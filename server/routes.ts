import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  searchRequestSchema,
  insertQuestionSchema,
  updateQuestionSchema,
  categoryUpdateSchema,
  bulkCategoryUpdateSchema,
  type InsertQuestion,
} from "../shared/schema.js";
import { db } from "./db.js";
import { questions } from "../shared/schema.js";
import { sql, isNotNull } from "drizzle-orm";

// Global progress tracking for uploads
let uploadProgress = {
  isActive: false,
  progress: 0,
  stage: "Idle",
  totalQuestions: 0,
  processedQuestions: 0,
};
import { z } from "zod";
import multer from "multer";
import { createWordDocument } from "./word-export";
import { Packer } from "docx";
import * as yazl from "yazl";
import { duplicateCleanupService } from "./duplicate-cleanup";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get total question count
  app.get("/api/questions/count", async (req, res) => {
    try {
      const count = await storage.getTotalCount();
      res.json({ count });
    } catch (error) {
      console.error("Error getting question count:", error);
      res.status(500).json({ message: "Failed to get question count" });
    }
  });

  // Get upload progress
  app.get("/api/upload-progress", (req, res) => {
    res.json(uploadProgress);
  });

  // Search questions
  app.post("/api/questions/search", async (req, res) => {
    try {
      const searchRequest = searchRequestSchema.parse(req.body);
      const result = await storage.searchQuestions(searchRequest);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid search parameters", errors: error.errors });
      }
      console.error("Error searching questions:", error);
      res.status(500).json({ message: "Failed to search questions" });
    }
  });

  // Upload CSV file with enhanced processing and real-time progress tracking
  app.post(
    "/api/questions/upload",
    upload.single("csvFile"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Initialize progress tracking
        uploadProgress = {
          isActive: true,
          progress: 10,
          stage: "Starting CSV processing...",
          totalQuestions: 0,
          processedQuestions: 0,
        };

        const csvContent = req.file.buffer.toString("utf-8");
        console.log("Starting enhanced CSV processing...");

        // Step 1: Parse CSV content with HTML processing
        uploadProgress.progress = 20;
        uploadProgress.stage = "Parsing CSV content...";

        const questions = await parseCsvContent(csvContent);

        if (questions.length === 0) {
          uploadProgress.isActive = false;
          return res
            .status(400)
            .json({ message: "No valid questions found in CSV file" });
        }

        console.log(`Parsed ${questions.length} questions from CSV`);
        uploadProgress.progress = 30;
        uploadProgress.stage = `Parsed ${questions.length} questions, starting database insertion...`;
        uploadProgress.totalQuestions = questions.length;

        // Step 2: Add new questions with progress callbacks
        const createdQuestions = await storage.bulkCreateQuestions(
          questions,
          (processed, total) => {
            uploadProgress.progress = 30 + Math.round((processed / total) * 40); // 30-70%
            uploadProgress.stage = `Inserting questions: ${processed}/${total}`;
            uploadProgress.processedQuestions = processed;
          }
        );

        console.log(
          `Successfully inserted ${createdQuestions.length} new questions`
        );
        uploadProgress.progress = 75;
        uploadProgress.stage = `Inserted ${createdQuestions.length} questions, starting merge process...`;

        // Step 3: Auto-detect and merge multilingual questions with same config IDs
        let mergeResults = { totalMerged: 0, errors: 0 };

        if (createdQuestions.length > 0) {
          console.log("Starting automatic multilingual merge process...");
          try {
            // Get all unique config IDs from newly uploaded questions
            const newConfigIds = [
              ...new Set(createdQuestions.map((q) => q.configId)),
            ];
            console.log(
              `Found ${newConfigIds.length} unique config IDs in uploaded data`
            );

            uploadProgress.progress = 80;
            uploadProgress.stage = `Processing ${newConfigIds.length} config IDs for merging...`;

            // Process each config ID for potential merging
            for (let i = 0; i < newConfigIds.length; i++) {
              const configId = newConfigIds[i];
              try {
                const duplicates = await storage.getQuestionsByConfigId(
                  configId
                );
                if (duplicates.length > 1) {
                  // Auto-merge multilingual variants
                  const languages = duplicates.map((q) => ({
                    questionId: q.questionId,
                    language: detectLanguageFromContent(q.question),
                    questionText: q.question,
                  }));

                  // Use the first question as primary (or the English one if available)
                  const primaryQuestion =
                    duplicates.find(
                      (q) => detectLanguageFromContent(q.question) === "English"
                    ) || duplicates[0];

                  const otherVariants = languages.filter(
                    (l) => l.questionId !== primaryQuestion.questionId
                  );

                  if (otherVariants.length > 0) {
                    await storage.mergeMultilingualQuestions(
                      configId,
                      primaryQuestion.questionId,
                      otherVariants
                    );
                    mergeResults.totalMerged++;
                  }
                }

                // Update progress every 50 items or at the end
                if (i % 50 === 0 || i === newConfigIds.length - 1) {
                  uploadProgress.progress =
                    80 + Math.round((i / newConfigIds.length) * 15); // 80-95%
                  uploadProgress.stage = `Merging progress: ${mergeResults.totalMerged} sets merged`;
                }
              } catch (mergeError) {
                console.warn(
                  `Error merging config ID ${configId}:`,
                  mergeError
                );
                mergeResults.errors++;
              }
            }

            console.log(
              `Merge process completed: ${mergeResults.totalMerged} merged, ${mergeResults.errors} errors`
            );
          } catch (bulkMergeError) {
            console.error("Error in bulk merge process:", bulkMergeError);
          }
        }

        // Finalize
        uploadProgress.progress = 100;
        uploadProgress.stage = "Upload completed successfully!";

        const duplicatesFound = questions.length - createdQuestions.length;

        const result = {
          message:
            duplicatesFound > 0
              ? `CSV processed: ${createdQuestions.length} new questions added, ${duplicatesFound} duplicates skipped`
              : "CSV uploaded and processed successfully",
          uploaded: createdQuestions.length,
          duplicatesSkipped: duplicatesFound,
          merged: mergeResults.totalMerged,
          mergeErrors: mergeResults.errors,
          totalProcessed: questions.length,
          explanation:
            duplicatesFound > 0
              ? "Questions with matching questionId + configId combinations already exist in database and were not re-added"
              : "All questions were successfully processed",
        };

        // Keep progress active for a moment to show completion
        setTimeout(() => {
          uploadProgress.isActive = false;
        }, 3000);

        res.json(result);
      } catch (error) {
        console.error("Error uploading CSV:", error);
        uploadProgress.isActive = false;
        res.status(500).json({
          message: "Failed to upload CSV",
          error: (error as Error).message,
        });
      }
    }
  );

  // Get filter suggestions
  app.get("/api/questions/filters", async (req, res) => {
    try {
      const filterOptions = await storage.getFilterOptions();
      res.json(filterOptions);
    } catch (error) {
      console.error("Error getting filter options:", error);
      res.status(500).json({ message: "Failed to get filter options" });
    }
  });

  // Test statistics endpoint for bulk export - must come before parameterized routes
  app.get("/api/questions/test-stats", async (req, res) => {
    try {
      const testStats = await storage.getTestStats();
      res.json(testStats);
    } catch (error) {
      console.error("Error getting test statistics:", error);
      res.status(500).json({ message: "Failed to get test statistics" });
    }
  });

  // Get a specific question
  app.get("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      console.error("Error getting question:", error);
      res.status(500).json({ message: "Failed to get question" });
    }
  });

  // Get categorization options
  app.get("/api/categories", async (req, res) => {
    try {
      const categoryOptions = await storage.getCategoryOptions();
      res.json(categoryOptions);
    } catch (error) {
      console.error("Error getting category options:", error);
      res.status(500).json({ message: "Failed to get category options" });
    }
  });

  // Update question endpoint
  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const updateData = updateQuestionSchema.parse(req.body);
      const updatedQuestion = await storage.updateQuestion(
        questionId,
        updateData
      );

      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid update data", errors: error.errors });
      }
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Update question category
  app.patch("/api/questions/:id/category", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const categoryUpdate = categoryUpdateSchema.parse({
        questionId,
        ...req.body,
      });
      const updatedQuestion = await storage.updateQuestionCategory(
        categoryUpdate
      );

      if (!updatedQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating question category:", error);
      res.status(500).json({ message: "Failed to update question category" });
    }
  });

  // Bulk update question categories
  app.patch("/api/questions/categories/bulk", async (req, res) => {
    try {
      const bulkUpdate = bulkCategoryUpdateSchema.parse(req.body);
      const updatedQuestions = await storage.bulkUpdateCategories(bulkUpdate);

      res.json({
        message: "Categories updated successfully",
        count: updatedQuestions.length,
        questions: updatedQuestions,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid bulk update data", errors: error.errors });
      }
      console.error("Error bulk updating categories:", error);
      res.status(500).json({ message: "Failed to bulk update categories" });
    }
  });

  // Get duplicate questions by config ID
  app.get("/api/questions/duplicates/:configId", async (req, res) => {
    try {
      const { configId } = req.params;
      const duplicates = await storage.getQuestionsByConfigId(configId);
      res.json({ questions: duplicates });
    } catch (error) {
      console.error("Error getting duplicate questions:", error);
      res.status(500).json({ message: "Failed to get duplicate questions" });
    }
  });

  // Export questions to Word document
  app.get("/api/export/word/:testName", async (req, res) => {
    try {
      const testName = decodeURIComponent(req.params.testName);
      console.log(`Exporting questions for test: ${testName}`);

      // Set a reasonable timeout for the request
      req.setTimeout(300000); // 5 minutes

      // Get all questions for the test with retry logic
      let questions;
      try {
        questions = await storage.getQuestionsByTestName(testName);
      } catch (dbError: any) {
        console.error("Database error during export:", dbError);
        return res.status(503).json({
          message:
            "Database temporarily unavailable. Please try again in a moment.",
          error: "CONNECTION_TIMEOUT",
        });
      }

      if (questions.length === 0) {
        return res
          .status(404)
          .json({ message: "No questions found for this test" });
      }

      console.log(`Found ${questions.length} questions for export`);

      // Create Word document
      const doc = createWordDocument(questions, testName);

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);

      // Set headers for file download
      const fileName = `${testName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_Questions.docx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", buffer.length);

      // Send the file
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting to Word:", error);
      res.status(500).json({
        message: "Failed to export questions to Word document",
        error: "EXPORT_FAILED",
      });
    }
  });

  // Export selected questions to Word
  app.post("/api/export/selected", async (req, res) => {
    try {
      const { questionIds, title } = req.body;

      if (
        !questionIds ||
        !Array.isArray(questionIds) ||
        questionIds.length === 0
      ) {
        return res.status(400).json({ message: "Question IDs are required" });
      }

      console.log(`Exporting ${questionIds.length} selected questions`);

      // Set a reasonable timeout for the request
      req.setTimeout(300000); // 5 minutes

      // Get questions by IDs
      let questions;
      try {
        questions = await Promise.all(
          questionIds.map((id) => storage.getQuestion(id))
        );

        // Filter out any null/undefined questions
        questions = questions.filter((q) => q !== undefined && q !== null);
      } catch (dbError: any) {
        console.error("Database error during export:", dbError);
        return res.status(503).json({
          message:
            "Database temporarily unavailable. Please try again in a moment.",
          error: "CONNECTION_TIMEOUT",
        });
      }

      if (questions.length === 0) {
        return res
          .status(404)
          .json({ message: "No questions found with the provided IDs" });
      }

      console.log(`Found ${questions.length} questions for export`);

      // Create Word document
      const documentTitle =
        title ||
        `Selected Questions Export - ${new Date().toLocaleDateString()}`;
      const doc = createWordDocument(questions, documentTitle);

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);

      // Set headers for file download
      const fileName = `selected-questions-${
        new Date().toISOString().split("T")[0]
      }.docx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", buffer.length);

      // Send the file
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting selected questions:", error);
      res.status(500).json({
        message: "Failed to export selected questions to Word document",
        error: "EXPORT_FAILED",
      });
    }
  });

  // Merge multilingual questions
  app.post("/api/questions/merge", async (req, res) => {
    try {
      const { configId, primaryQuestionId, languageVariants } = req.body;

      if (!configId || !primaryQuestionId || !Array.isArray(languageVariants)) {
        return res
          .status(400)
          .json({ message: "Invalid merge request parameters" });
      }

      const result = await storage.mergeMultilingualQuestions(
        configId,
        primaryQuestionId,
        languageVariants
      );
      res.json({
        message: "Questions merged successfully",
        mergedQuestion: result,
      });
    } catch (error) {
      console.error("Error merging questions:", error);
      res.status(500).json({ message: "Failed to merge questions" });
    }
  });

  // Bulk merge all multilingual questions (manual trigger only)
  app.post("/api/questions/bulk-merge", async (req, res) => {
    try {
      console.log("Manual bulk merge initiated...");
      const result = await storage.bulkMergeMultilingualQuestions();
      res.json({
        message: "Bulk merge completed successfully",
        results: result,
      });
    } catch (error) {
      console.error("Error bulk merging questions:", error);
      res.status(500).json({ message: "Failed to bulk merge questions" });
    }
  });

  // Memory-efficient multilingual merge endpoint
  app.post("/api/questions/merge-multilingual-batch", async (req, res) => {
    try {
      console.log("Starting memory-efficient multilingual merge...");

      // Get config IDs with duplicates in small batches
      const duplicateConfigIds = await storage.getDuplicateConfigIds();
      console.log(
        `Found ${duplicateConfigIds.length} config IDs with duplicates`
      );

      const batchSize = 10; // Process only 10 config IDs at a time
      let totalMerged = 0;
      let processedBatches = 0;
      let errors: string[] = [];

      // Process in small batches to prevent memory overflow
      for (
        let i = 0;
        i < Math.min(duplicateConfigIds.length, 100);
        i += batchSize
      ) {
        const batch = duplicateConfigIds.slice(i, i + batchSize);
        console.log(
          `Processing batch ${Math.floor(i / batchSize) + 1} (${
            batch.length
          } config IDs)...`
        );

        for (const configId of batch) {
          try {
            const questions = await storage.getQuestionsByConfigId(configId);

            if (questions.length > 1) {
              // Only merge if questions are similar (legitimate multilingual variants)
              const shouldMerge = areQuestionsSimilar(questions);

              if (shouldMerge) {
                const mergedQuestion = await createMergedQuestion(questions);

                // Delete all original questions
                for (const q of questions) {
                  await storage.deleteQuestion(q.id);
                }

                // Insert merged question
                await storage.createQuestion(mergedQuestion);
                totalMerged += questions.length - 1; // Count merged questions
                console.log(
                  `Merged ${questions.length} variants for config ${configId}`
                );
              }
            }
          } catch (error: any) {
            const errorMsg = `Error merging config ${configId}: ${
              error?.message || "Unknown error"
            }`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        processedBatches++;

        // Force garbage collection between batches
        if (global.gc) {
          global.gc();
        }

        // Add small delay to prevent overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`Multilingual merge completed:`);
      console.log(`- Processed ${processedBatches} batches`);
      console.log(`- Merged ${totalMerged} duplicate questions`);
      console.log(`- Errors: ${errors.length}`);

      res.json({
        success: true,
        processedBatches,
        totalMerged,
        errors: errors.slice(0, 5), // Return first 5 errors
      });
    } catch (error: any) {
      console.error("Multilingual merge error:", error);
      res.status(500).json({
        message: "Multilingual merge failed",
        error: error?.message || "Unknown error",
      });
    }
  });

  // Smart deduplication endpoint - separates unrelated questions with same config IDs
  app.post("/api/questions/smart-fix-duplicates", async (req, res) => {
    try {
      console.log("Smart duplicate fix initiated...");
      console.log(
        "This will separate unrelated questions that share config IDs..."
      );

      // Get all config IDs with multiple questions
      const duplicateConfigIds = await storage.getDuplicateConfigIds();
      console.log(
        `Found ${duplicateConfigIds.length} config IDs with duplicates`
      );

      let processedConfigs = 0;
      let separatedQuestions = 0;
      let errors: string[] = [];

      for (const configId of duplicateConfigIds.slice(0, 100)) {
        // Process in batches
        try {
          const questions = await storage.getQuestionsByConfigId(configId);

          if (questions.length > 1) {
            // Check if questions are actually different (not just multilingual variants)
            const areQuestionsDifferent =
              checkIfQuestionsAreDifferent(questions);

            if (areQuestionsDifferent) {
              // These are different questions sharing the same config ID - separate them
              for (let i = 1; i < questions.length; i++) {
                const newConfigId = `${Date.now()}_${i}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`;
                await storage.updateQuestionConfigId(
                  questions[i].id,
                  newConfigId
                );
                separatedQuestions++;
                console.log(
                  `Separated question ${questions[i].id} with new config ID: ${newConfigId}`
                );
              }
            }
          }

          processedConfigs++;
          if (processedConfigs % 20 === 0) {
            console.log(
              `Processed ${processedConfigs}/${Math.min(
                duplicateConfigIds.length,
                100
              )} config IDs...`
            );
          }
        } catch (error: any) {
          const errorMsg = `Error processing config ID ${configId}: ${
            error?.message || "Unknown error"
          }`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Smart duplicate fix completed:`);
      console.log(`- Processed ${processedConfigs} config IDs`);
      console.log(`- Separated ${separatedQuestions} unrelated questions`);
      console.log(`- Errors: ${errors.length}`);

      res.json({
        success: true,
        processedConfigs,
        separatedQuestions,
        errors: errors.slice(0, 10), // Return first 10 errors
      });
    } catch (error: any) {
      console.error("Smart duplicate fix error:", error);
      res.status(500).json({
        message: "Smart duplicate fix failed",
        error: error?.message || "Unknown error",
      });
    }
  });

  // Bulk export functionality
  let bulkExportProgress = {
    isActive: false,
    progress: 0,
    stage: "Idle",
    testNames: [] as string[],
    completedFiles: [] as string[],
    currentTest: "",
    zipFilePath: "",
  };

  app.post("/api/export/bulk", async (req, res) => {
    try {
      const { testNames } = req.body;

      if (!testNames || !Array.isArray(testNames) || testNames.length === 0) {
        return res.status(400).json({ message: "Test names are required" });
      }

      if (bulkExportProgress.isActive) {
        return res
          .status(409)
          .json({ message: "Bulk export already in progress" });
      }

      bulkExportProgress = {
        isActive: true,
        progress: 0,
        stage: "Starting bulk export...",
        testNames,
        completedFiles: [],
        currentTest: "",
        zipFilePath: "",
      };

      // Start bulk export in background
      bulkExportProcess(testNames);

      res.json({ message: "Bulk export started" });
    } catch (error) {
      console.error("Error starting bulk export:", error);
      bulkExportProgress.isActive = false;
      res.status(500).json({ message: "Failed to start bulk export" });
    }
  });

  app.get("/api/export/bulk/progress", (req, res) => {
    res.json(bulkExportProgress);
  });

  app.get("/api/export/bulk/download", async (req, res) => {
    try {
      if (!bulkExportProgress.zipFilePath) {
        return res
          .status(404)
          .json({ message: "No bulk export file available" });
      }

      const fs = await import("fs");
      const path = await import("path");

      if (!fs.existsSync(bulkExportProgress.zipFilePath)) {
        return res.status(404).json({ message: "Export file not found" });
      }

      const fileName = path.basename(bulkExportProgress.zipFilePath);
      const stats = fs.statSync(bulkExportProgress.zipFilePath);

      console.log(`Starting download of ${fileName} (${stats.size} bytes)`);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", stats.size.toString());
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      // Stream the file instead of loading into memory
      const readStream = fs.createReadStream(bulkExportProgress.zipFilePath);

      readStream.on("error", (error) => {
        console.error("Error streaming file:", error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error streaming file" });
        }
      });

      readStream.on("end", () => {
        console.log(`Download completed: ${fileName}`);
        // Clean up file after successful stream completion
        setTimeout(() => {
          try {
            if (fs.existsSync(bulkExportProgress.zipFilePath)) {
              fs.unlinkSync(bulkExportProgress.zipFilePath);
              console.log(`Cleaned up: ${fileName}`);
            }
          } catch (error) {
            console.error("Error cleaning up zip file:", error);
          }
        }, 10000); // Wait 10 seconds before cleanup
      });

      readStream.pipe(res);
    } catch (error) {
      console.error("Error downloading bulk export:", error);
      res.status(500).json({ message: "Failed to download bulk export" });
    }
  });

  // Reset bulk export progress (for when stuck)
  app.post("/api/export/bulk/reset", (req, res) => {
    bulkExportProgress = {
      isActive: false,
      progress: 0,
      stage: "Idle",
      testNames: [],
      completedFiles: [],
      currentTest: "",
      zipFilePath: "",
    };
    res.json({ message: "Bulk export progress reset" });
  });

  // Background bulk export process
  async function bulkExportProcess(testNames: string[]) {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { promisify } = await import("util");
      // Create temp directory for export files
      const tempDir = path.join(process.cwd(), "tmp", "bulk-export");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      bulkExportProgress.stage = "Creating Word documents...";
      bulkExportProgress.progress = 5;

      const createdFiles: string[] = [];

      for (let i = 0; i < testNames.length; i++) {
        const testName = testNames[i];
        bulkExportProgress.currentTest = testName;
        bulkExportProgress.stage = `Processing "${testName}"...`;

        try {
          // Get questions for this test
          const questions = await storage.getQuestionsByTestName(testName);

          if (questions.length > 0) {
            // Create Word document
            const doc = createWordDocument(questions, testName);
            const buffer = await Packer.toBuffer(doc);

            // Save to temp file with improved file naming
            const safeFileName = testName
              .replace(/[^a-zA-Z0-9\s\-_]/g, "_")
              .replace(/\s+/g, " ")
              .replace(/_+/g, "_")
              .trim();
            const filePath = path.join(
              tempDir,
              `${safeFileName} Questions.docx`
            );

            // Write file with error checking
            try {
              fs.writeFileSync(filePath, buffer);
              if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                createdFiles.push(filePath);
                bulkExportProgress.completedFiles.push(
                  `${safeFileName} Questions.docx`
                );
                console.log(
                  `Created: ${safeFileName} Questions.docx (${buffer.length} bytes)`
                );
              } else {
                console.error(`Failed to create valid file for ${testName}`);
              }
            } catch (err) {
              console.error(`Error writing file for ${testName}:`, err);
            }
          } else {
            console.warn(`No questions found for test: ${testName}`);
          }
        } catch (error) {
          console.error(`Error processing test "${testName}":`, error);
        }

        bulkExportProgress.progress = Math.round(
          ((i + 1) / testNames.length) * 80
        );

        // Force garbage collection every 50 files to prevent memory buildup
        if ((i + 1) % 50 === 0 && global.gc) {
          global.gc();
          console.log(`Forced garbage collection after ${i + 1} files`);
        }
      }

      // Create ZIP file using yazl (more reliable than archiver)
      bulkExportProgress.stage = "Creating ZIP file...";
      bulkExportProgress.progress = 85;

      const zipPath = path.join(tempDir, `bulk-export-${Date.now()}.zip`);
      console.log(
        `Starting ZIP creation with ${createdFiles.length} files using yazl...`
      );

      await new Promise<void>((resolve, reject) => {
        const zipFile = new yazl.ZipFile();
        let filesAdded = 0;
        let isComplete = false;

        const timeout = setTimeout(() => {
          if (!isComplete) {
            isComplete = true;
            console.error("ZIP creation timeout after 30 seconds");
            reject(new Error("ZIP creation timeout"));
          }
        }, 30000);

        const cleanup = () => {
          if (!isComplete) {
            isComplete = true;
            clearTimeout(timeout);
          }
        };

        // Add all files to ZIP
        for (const filePath of createdFiles) {
          if (fs.existsSync(filePath)) {
            try {
              const fileName = path.basename(filePath);
              const stats = fs.statSync(filePath);
              console.log(`Adding: ${fileName} (${stats.size} bytes)`);
              zipFile.addFile(filePath, fileName);
              filesAdded++;
            } catch (err) {
              console.error(`Error adding file ${filePath}:`, err);
            }
          } else {
            console.warn(`File not found: ${filePath}`);
          }
        }

        console.log(`Added ${filesAdded} files to ZIP, finalizing...`);
        zipFile.end();

        // Create output stream and handle ZIP creation
        const outputStream = fs.createWriteStream(zipPath);

        zipFile.outputStream.pipe(outputStream);

        outputStream.on("close", () => {
          cleanup();
          try {
            const stats = fs.statSync(zipPath);
            console.log(`ZIP created successfully: ${stats.size} bytes`);
            if (stats.size > 0) {
              resolve();
            } else {
              reject(new Error("ZIP file is empty"));
            }
          } catch (err) {
            reject(err);
          }
        });

        outputStream.on("error", (err) => {
          cleanup();
          console.error("Output stream error:", err);
          reject(err);
        });

        zipFile.outputStream.on("error", (err: Error) => {
          cleanup();
          console.error("ZIP stream error:", err);
          reject(err);
        });
      });

      // Clean up individual files with existence check
      createdFiles.forEach((filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error(`Error cleaning up file ${filePath}:`, error);
        }
      });

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        console.log("Forced garbage collection after ZIP creation");
      }

      bulkExportProgress.zipFilePath = zipPath;
      bulkExportProgress.progress = 100;
      bulkExportProgress.stage = "Export complete!";

      setTimeout(() => {
        bulkExportProgress.isActive = false;
      }, 3000);
    } catch (error) {
      console.error("Error in bulk export process:", error);
      bulkExportProgress.isActive = false;
      bulkExportProgress.stage = `Export failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }

  // Duplicate detection endpoints
  let duplicateAnalysisProgress = {
    isActive: false,
    progress: 0,
    stage: "Idle",
    totalGroups: 0,
    processedGroups: 0,
  };

  // Get duplicate statistics
  app.get("/api/duplicates/stats", async (req, res) => {
    try {
      const stats = await storage.getDuplicateStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting duplicate stats:", error);
      res.status(500).json({ message: "Failed to get duplicate statistics" });
    }
  });

  // Start duplicate analysis
  app.post("/api/duplicates/start-analysis", async (req, res) => {
    try {
      if (duplicateAnalysisProgress.isActive) {
        return res
          .status(409)
          .json({ message: "Analysis already in progress" });
      }

      duplicateAnalysisProgress = {
        isActive: true,
        progress: 0,
        stage: "Starting analysis...",
        totalGroups: 0,
        processedGroups: 0,
      };

      // Start analysis in background
      analyzeForDuplicates();

      res.json({ message: "Duplicate analysis started" });
    } catch (error) {
      console.error("Error starting duplicate analysis:", error);
      duplicateAnalysisProgress.isActive = false;
      res.status(500).json({ message: "Failed to start duplicate analysis" });
    }
  });

  // Get analysis progress
  app.get("/api/duplicates/progress", (req, res) => {
    res.json(duplicateAnalysisProgress);
  });

  // Get duplicate analysis results
  app.get("/api/duplicates/analysis", async (req, res) => {
    try {
      const duplicateGroups = await storage.getDuplicateGroups();
      res.json({ groups: duplicateGroups });
    } catch (error) {
      console.error("Error getting duplicate analysis:", error);
      res.status(500).json({ message: "Failed to get duplicate analysis" });
    }
  });

  // Merge duplicate groups
  app.post("/api/duplicates/merge", async (req, res) => {
    try {
      const { groupIds } = req.body;
      const result = await storage.mergeDuplicateGroups(groupIds);
      res.json(result);
    } catch (error) {
      console.error("Error merging duplicates:", error);
      res.status(500).json({ message: "Failed to merge duplicate groups" });
    }
  });

  // Delete duplicate groups
  app.post("/api/duplicates/delete", async (req, res) => {
    try {
      const { groupIds } = req.body;
      const result = await storage.deleteDuplicateGroups(groupIds);
      res.json(result);
    } catch (error) {
      console.error("Error deleting duplicates:", error);
      res.status(500).json({ message: "Failed to delete duplicate groups" });
    }
  });

  // Comprehensive duplicate cleanup endpoint
  app.post("/api/duplicates/comprehensive-cleanup", async (req, res) => {
    try {
      console.log("🚀 Starting comprehensive duplicate cleanup...");
      const result =
        await duplicateCleanupService.performComprehensiveCleanup();

      res.json({
        message: "Comprehensive duplicate cleanup completed successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error in comprehensive duplicate cleanup:", error);
      res.status(500).json({
        message: "Failed to perform comprehensive cleanup",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Background analysis function
  async function analyzeForDuplicates() {
    try {
      duplicateAnalysisProgress.stage = "Fetching questions...";
      duplicateAnalysisProgress.progress = 10;

      // Get all config IDs with multiple questions
      const duplicateConfigIds = await storage.getDuplicateConfigIds();
      duplicateAnalysisProgress.totalGroups = duplicateConfigIds.length;
      duplicateAnalysisProgress.stage = `Analyzing ${duplicateConfigIds.length} potential duplicate groups...`;
      duplicateAnalysisProgress.progress = 30;

      // Analyze each group
      for (let i = 0; i < duplicateConfigIds.length; i++) {
        const configId = duplicateConfigIds[i];
        const questions = await storage.getQuestionsByConfigId(configId);

        // Calculate similarity and language detection for the group
        const analyzedGroup = await analyzeQuestionGroup(questions, configId);
        await storage.saveDuplicateGroup(analyzedGroup);

        duplicateAnalysisProgress.processedGroups = i + 1;
        duplicateAnalysisProgress.progress =
          30 + Math.round((i / duplicateConfigIds.length) * 60);
        duplicateAnalysisProgress.stage = `Analyzed ${i + 1}/${
          duplicateConfigIds.length
        } groups...`;
      }

      duplicateAnalysisProgress.progress = 100;
      duplicateAnalysisProgress.stage = "Analysis complete!";

      setTimeout(() => {
        duplicateAnalysisProgress.isActive = false;
      }, 3000);
    } catch (error) {
      console.error("Error in duplicate analysis:", error);
      duplicateAnalysisProgress.isActive = false;
      duplicateAnalysisProgress.stage = "Analysis failed";
    }
  }

  const httpServer = createServer(app);
  return httpServer;

  // Helper function to check if questions sharing a config ID are actually different questions
  function checkIfQuestionsAreDifferent(questions: any[]): boolean {
    if (questions.length < 2) return false;

    // Extract the core content of each question (remove HTML and normalize)
    const extractCoreContent = (q: any): string => {
      const questionText =
        q.question
          ?.replace(/<[^>]*>/g, "")
          .replace(/&[^;]+;/g, "")
          .toLowerCase() || "";
      const options = [q.option1, q.option2, q.option3, q.option4]
        .filter(Boolean)
        .map((opt) =>
          opt
            ?.replace(/<[^>]*>/g, "")
            .replace(/&[^;]+;/g, "")
            .toLowerCase()
        )
        .join(" ");
      return questionText + " " + options;
    };

    const contents = questions.map(extractCoreContent);

    // Check if any two questions have significantly different content
    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        const content1 = contents[i];
        const content2 = contents[j];

        // Simple similarity check - if less than 30% overlap, they're different questions
        const words1 = content1.split(/\s+/).filter((w) => w.length > 3);
        const words2 = content2.split(/\s+/).filter((w) => w.length > 3);

        const commonWords = words1.filter((word) => words2.includes(word));
        const similarity =
          commonWords.length / Math.max(words1.length, words2.length);

        if (similarity < 0.3) {
          console.log(
            `Found different questions in config ${
              questions[0].configId
            }: similarity = ${similarity.toFixed(2)}`
          );
          return true; // These are different questions
        }
      }
    }

    return false; // Questions are similar (likely multilingual variants)
  }

  // Helper function to check if questions are similar (legitimate multilingual variants)
  function areQuestionsSimilar(questions: any[]): boolean {
    if (questions.length < 2) return false;

    // Check if all questions have the same test name or subject
    const testNames = questions.map((q) => q.testName).filter(Boolean);
    const subjects = questions.map((q) => q.subject).filter(Boolean);

    const sameTestName = testNames.length > 0 && new Set(testNames).size === 1;
    const sameSubject = subjects.length > 0 && new Set(subjects).size === 1;

    if (!sameTestName && !sameSubject) {
      return false; // Different test names/subjects = different questions
    }

    // Check content similarity (for multilingual variants)
    const contents = questions.map((q) => {
      const questionText =
        q.question?.replace(/<[^>]*>/g, "").toLowerCase() || "";
      return questionText.replace(/[^\w\s]/g, "").trim();
    });

    // Check if questions have similar structure (same number of options)
    const optionCounts = questions.map(
      (q) =>
        [q.option1, q.option2, q.option3, q.option4, q.option5].filter(Boolean)
          .length
    );

    const sameStructure = new Set(optionCounts).size === 1;

    return sameSubject || (sameTestName && sameStructure);
  }

  // Helper function to create merged multilingual question
  async function createMergedQuestion(questions: any[]): Promise<any> {
    // Sort by language priority (English first, then others)
    const sortedQuestions = questions.sort((a, b) => {
      const aIsEnglish = /^[a-zA-Z\s.,!?;:()0-9-]+$/.test(
        a.question?.replace(/<[^>]*>/g, "") || ""
      );
      const bIsEnglish = /^[a-zA-Z\s.,!?;:()0-9-]+$/.test(
        b.question?.replace(/<[^>]*>/g, "") || ""
      );

      if (aIsEnglish && !bIsEnglish) return -1;
      if (!aIsEnglish && bIsEnglish) return 1;
      return 0;
    });

    const primary = sortedQuestions[0];
    const others = sortedQuestions.slice(1);

    // Merge descriptions from all variants
    const allDescriptions = questions
      .map((q) => q.description)
      .filter(Boolean)
      .filter((desc, index, arr) => arr.indexOf(desc) === index); // Remove duplicates

    return {
      questionId: primary.questionId,
      configId: primary.configId,
      testName: primary.testName,
      question: primary.question,
      option1: primary.option1,
      option2: primary.option2,
      option3: primary.option3,
      option4: primary.option4,
      option5: primary.option5,
      answer: primary.answer,
      description: allDescriptions.join(
        "\n\n--- Alternative Language Version ---\n\n"
      ),
      subject: primary.subject,
      topic: primary.topic,
      difficulty: primary.difficulty,
      questionType: primary.questionType,
      tags: primary.tags,
      category: primary.category,
      subCategory: primary.subCategory,
    };
  }
}

async function parseCsvContent(csvContent: string): Promise<InsertQuestion[]> {
  const questions: InsertQuestion[] = [];
  let currentRecord: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let recordCount = 0;
  let i = 0;

  console.log(`Parsing CSV with ${csvContent.length} characters...`);

  // Enhanced HTML content processing function with icon removal and HTML entity decoding
  function processHtmlContent(content: string): string {
    if (!content) return "";

    // HTML entity decoding function (same as in word-export.ts)
    function decodeHtmlEntities(text: string): string {
      if (!text) return "";

      return (
        text
          // First handle double-encoded entities (common issue)
          .replace(/&amp;quot;/g, '"')
          .replace(/&amp;amp;/g, "&")
          .replace(/&amp;lt;/g, "<")
          .replace(/&amp;gt;/g, ">")
          .replace(/&amp;nbsp;/g, " ")

          // Standard HTML entities
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, " ")

          // Extended Latin characters (Spanish, French, German, etc.)
          .replace(/&aacute;/g, "á")
          .replace(/&Aacute;/g, "Á")
          .replace(/&eacute;/g, "é")
          .replace(/&Eacute;/g, "É")
          .replace(/&iacute;/g, "í")
          .replace(/&Iacute;/g, "Í")
          .replace(/&oacute;/g, "ó")
          .replace(/&Oacute;/g, "Ó")
          .replace(/&uacute;/g, "ú")
          .replace(/&Uacute;/g, "Ú")
          .replace(/&ntilde;/g, "ñ")
          .replace(/&Ntilde;/g, "Ñ")
          .replace(/&agrave;/g, "à")
          .replace(/&Agrave;/g, "À")
          .replace(/&egrave;/g, "è")
          .replace(/&Egrave;/g, "È")
          .replace(/&igrave;/g, "ì")
          .replace(/&Igrave;/g, "Ì")
          .replace(/&ograve;/g, "ò")
          .replace(/&Ograve;/g, "Ò")
          .replace(/&ugrave;/g, "ù")
          .replace(/&Ugrave;/g, "Ù")
          .replace(/&acirc;/g, "â")
          .replace(/&Acirc;/g, "Â")
          .replace(/&ecirc;/g, "ê")
          .replace(/&Ecirc;/g, "Ê")
          .replace(/&icirc;/g, "î")
          .replace(/&Icirc;/g, "Î")
          .replace(/&ocirc;/g, "ô")
          .replace(/&Ocirc;/g, "Ô")
          .replace(/&ucirc;/g, "û")
          .replace(/&Ucirc;/g, "Û")
          .replace(/&auml;/g, "ä")
          .replace(/&Auml;/g, "Ä")
          .replace(/&euml;/g, "ë")
          .replace(/&Euml;/g, "Ë")
          .replace(/&iuml;/g, "ï")
          .replace(/&Iuml;/g, "Ï")
          .replace(/&ouml;/g, "ö")
          .replace(/&Ouml;/g, "Ö")
          .replace(/&uuml;/g, "ü")
          .replace(/&Uuml;/g, "Ü")
          .replace(/&yuml;/g, "ÿ")
          .replace(/&ccedil;/g, "ç")
          .replace(/&Ccedil;/g, "Ç")

          // Typographic quotes and dashes
          .replace(/&ldquo;/g, '"')
          .replace(/&rdquo;/g, '"')
          .replace(/&lsquo;/g, "'")
          .replace(/&rsquo;/g, "'")
          .replace(/&mdash;/g, "—")
          .replace(/&ndash;/g, "–")
          .replace(/&hellip;/g, "...")
          .replace(/&ensp;/g, " ")
          .replace(/&emsp;/g, "  ")
          .replace(/&thinsp;/g, " ")

          // Symbols
          .replace(/&copy;/g, "©")
          .replace(/&reg;/g, "®")
          .replace(/&trade;/g, "™")
          .replace(/&deg;/g, "°")
          .replace(/&sect;/g, "§")
          .replace(/&para;/g, "¶")
          .replace(/&middot;/g, "·")
          .replace(/&bull;/g, "•")
          .replace(/&dagger;/g, "†")
          .replace(/&Dagger;/g, "‡")

          // Handle numeric entities
          .replace(/&#(\d+);/g, (match, code) => {
            try {
              return String.fromCharCode(parseInt(code, 10));
            } catch {
              return "";
            }
          })
          .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => {
            try {
              return String.fromCharCode(parseInt(code, 16));
            } catch {
              return "";
            }
          })

          // Keep ampersand LAST to avoid double-decoding
          .replace(/&amp;/g, "&")
      );
    }

    // Remove problematic circular icons from HTML content
    function removeProblematicIcons(html: string): string {
      if (!html) return "";

      // Server-side regex-based approach to remove problematic icons
      return (
        html
          // Remove small images by size attributes (1-50px)
          .replace(
            /<img[^>]*(?:width|height)=["']?(?:[1-9]|[1-4][0-9]|50)["']?[^>]*>/gi,
            ""
          )
          // Remove images with icon-related src attributes
          .replace(
            /<img[^>]*src=["'][^"']*(?:icon|key|document|check|mark|circle)[^"']*["'][^>]*>/gi,
            ""
          )
          // Remove images with icon-related alt text
          .replace(
            /<img[^>]*alt=["'][^"']*(?:icon|key|document|check|mark)[^"']*["'][^>]*>/gi,
            ""
          )
          // Remove images with icon-related class names
          .replace(
            /<img[^>]*class=["'][^"']*(?:icon|key|document|check|mark|circle|rounded-full)[^"']*["'][^>]*>/gi,
            ""
          )
          // Remove common small icon formats
          .replace(
            /<img[^>]*src=["'][^"']*\.(?:svg|png|jpg|jpeg)["'][^>]*(?:width|height)=["']?(?:[1-9]|[1-4][0-9]|50)["']?[^>]*>/gi,
            ""
          )
          // Remove standalone icon tags
          .replace(
            /<img[^>]*\b(?:width|height)=["']?(?:[1-9]|[1-4][0-9]|50)["']?[^>]*\b(?:width|height)=["']?(?:[1-9]|[1-4][0-9]|50)["']?[^>]*>/gi,
            ""
          )
      );
    }

    // Clean up the content while preserving HTML tags and removing problematic icons
    let cleaned = content
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\r/g, "\n") // Convert remaining \r to \n
      .trim(); // Remove leading/trailing whitespace

    // Remove problematic icons
    cleaned = removeProblematicIcons(cleaned);

    // Decode HTML entities to preserve special characters like ñ, é, ó
    cleaned = decodeHtmlEntities(cleaned);

    // Function to convert LaTeX math expressions to Unicode or readable text
    const convertLatexMath = (text: string): string => {
      if (!text) return "";

      return (
        text
          // Handle LaTeX fractions with explicit space handling - more precise patterns
          .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, "$1½") // \(365 \frac{1}{2}\) → 365½
          .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, "$1¼") // \(365 \frac{1}{4}\) → 365¼
          .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, "$1¾") // \(365 \frac{3}{4}\) → 365¾

          // Handle patterns without space between number and frac
          .replace(/\\\(\s*(\d+)\\frac\{1\}\{2\}\s*\\\)/g, "$1½")
          .replace(/\\\(\s*(\d+)\\frac\{1\}\{4\}\s*\\\)/g, "$1¼")
          .replace(/\\\(\s*(\d+)\\frac\{3\}\{4\}\s*\\\)/g, "$1¾")

          // Handle standalone fractions in LaTeX delimiters
          .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, "½")
          .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, "¼")
          .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, "¾")
          .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, "⅓")
          .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, "⅔")
          .replace(/\\\(\s*\\frac\{1\}\{5\}\s*\\\)/g, "⅕")
          .replace(/\\\(\s*\\frac\{2\}\{5\}\s*\\\)/g, "⅖")
          .replace(/\\\(\s*\\frac\{3\}\{5\}\s*\\\)/g, "⅗")
          .replace(/\\\(\s*\\frac\{4\}\{5\}\s*\\\)/g, "⅘")
          .replace(/\\\(\s*\\frac\{1\}\{6\}\s*\\\)/g, "⅙")
          .replace(/\\\(\s*\\frac\{5\}\{6\}\s*\\\)/g, "⅚")
          .replace(/\\\(\s*\\frac\{1\}\{8\}\s*\\\)/g, "⅛")
          .replace(/\\\(\s*\\frac\{3\}\{8\}\s*\\\)/g, "⅜")
          .replace(/\\\(\s*\\frac\{5\}\{8\}\s*\\\)/g, "⅝")
          .replace(/\\\(\s*\\frac\{7\}\{8\}\s*\\\)/g, "⅞")

          // Handle generic fractions - convert to readable format
          .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, "($1/$2)")

          // Handle fractions without LaTeX delimiters but with backslash prefix
          .replace(/\\frac\{1\}\{2\}/g, "½")
          .replace(/\\frac\{1\}\{4\}/g, "¼")
          .replace(/\\frac\{3\}\{4\}/g, "¾")
          .replace(/\\frac\{1\}\{3\}/g, "⅓")
          .replace(/\\frac\{2\}\{3\}/g, "⅔")
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")

          // Handle LaTeX fractions without delimiters but with numbers before
          .replace(/(\d+)\s*\\frac\{1\}\{2\}/g, "$1½")
          .replace(/(\d+)\s*\\frac\{1\}\{4\}/g, "$1¼")
          .replace(/(\d+)\s*\\frac\{3\}\{4\}/g, "$1¾")
          .replace(/(\d+)\s*\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 ($2/$3)")

          // Handle standalone fractions without delimiters
          .replace(/\\frac\{1\}\{2\}/g, "½")
          .replace(/\\frac\{1\}\{4\}/g, "¼")
          .replace(/\\frac\{3\}\{4\}/g, "¾")
          .replace(/\\frac\{1\}\{3\}/g, "⅓")
          .replace(/\\frac\{2\}\{3\}/g, "⅔")
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")

          // Remove LaTeX delimiters
          .replace(/\\\(/g, "")
          .replace(/\\\)/g, "")
          .replace(/\\\[/g, "")
          .replace(/\\\]/g, "")

          // Clean up any remaining backslashes before math commands
          .replace(/\\(?=frac|text|left|right)/g, "")
      );
    };

    // Process bilingual text with safe LaTeX rendering (same function as word-export)
    const processBilingualText = (content: string): string => {
      if (!content) return "";

      // Function to render LaTeX math to Unicode
      function renderLatexMath(text: string): string {
        return (
          text
            // Handle LaTeX fractions with numbers - comprehensive patterns
            .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, "$1½")
            .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, "$1¼")
            .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, "$1¾")
            .replace(/\\\(\s*(\d+)\\frac\{1\}\{2\}\s*\\\)/g, "$1½")
            .replace(/\\\(\s*(\d+)\\frac\{1\}\{4\}\s*\\\)/g, "$1¼")
            .replace(/\\\(\s*(\d+)\\frac\{3\}\{4\}\s*\\\)/g, "$1¾")

            // Handle standalone fractions in LaTeX delimiters
            .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, "½")
            .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, "¼")
            .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, "¾")
            .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, "⅓")
            .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, "⅔")
            .replace(/\\\(\s*\\frac\{1\}\{5\}\s*\\\)/g, "⅕")
            .replace(/\\\(\s*\\frac\{2\}\{5\}\s*\\\)/g, "⅖")
            .replace(/\\\(\s*\\frac\{3\}\{5\}\s*\\\)/g, "⅗")
            .replace(/\\\(\s*\\frac\{4\}\{5\}\s*\\\)/g, "⅘")
            .replace(/\\\(\s*\\frac\{1\}\{6\}\s*\\\)/g, "⅙")
            .replace(/\\\(\s*\\frac\{5\}\{6\}\s*\\\)/g, "⅚")
            .replace(/\\\(\s*\\frac\{1\}\{8\}\s*\\\)/g, "⅛")
            .replace(/\\\(\s*\\frac\{3\}\{8\}\s*\\\)/g, "⅜")
            .replace(/\\\(\s*\\frac\{5\}\{8\}\s*\\\)/g, "⅝")
            .replace(/\\\(\s*\\frac\{7\}\{8\}\s*\\\)/g, "⅞")

            // Handle generic fractions
            .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, "($1/$2)")

            // Clean up LaTeX delimiters
            .replace(/\\\(/g, "")
            .replace(/\\\)/g, "")
            .replace(/\\\[/g, "")
            .replace(/\\\]/g, "")
        );
      }

      // Safe bilingual split that respects math delimiters
      function safeBilingualSplit(text: string): string[] {
        // Find potential split points (space-slash-space)
        const splitPoints: number[] = [];
        let i = 0;
        while (i < text.length - 2) {
          if (text.substr(i, 3) === " / ") {
            splitPoints.push(i);
          }
          i++;
        }

        if (splitPoints.length === 0) {
          return [text];
        }

        // Check if split points are inside math delimiters
        const validSplitPoints = splitPoints.filter((point) => {
          // Check if this split point is inside \( ... \) delimiters
          const beforePoint = text.substring(0, point);

          // Count LaTeX delimiter pairs before the split point
          const openDelims = (beforePoint.match(/\\\(/g) || []).length;
          const closeDelims = (beforePoint.match(/\\\)/g) || []).length;

          // If we have unmatched open delimiters, we're inside math
          return openDelims === closeDelims;
        });

        if (validSplitPoints.length === 0) {
          return [text];
        }

        // Use the first valid split point
        const splitAt = validSplitPoints[0];
        return [text.substring(0, splitAt), text.substring(splitAt + 3)];
      }

      // Process the text
      const parts = safeBilingualSplit(content);

      if (parts.length === 2) {
        // Render math in each part separately, then rejoin with line break
        const englishPart = renderLatexMath(parts[0].trim());
        const hindiPart = renderLatexMath(parts[1].trim());
        return `${englishPart}<br/>[Hindi] ${hindiPart}`;
      } else {
        // Single language or no valid split - just render math
        return renderLatexMath(content);
      }
    };

    cleaned = processBilingualText(cleaned);

    return cleaned;
  }

  while (i < csvContent.length) {
    const char = csvContent[i];
    const nextChar = i + 1 < csvContent.length ? csvContent[i + 1] : "";

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (!inQuotes && char === ",") {
      // Field separator
      currentRecord.push(processHtmlContent(currentField));
      currentField = "";
      i++;
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      // End of record
      if (currentField || currentRecord.length > 0) {
        currentRecord.push(processHtmlContent(currentField));

        // Process complete record (skip header)
        if (currentRecord.length >= 11 && recordCount > 0) {
          try {
            const question: InsertQuestion = {
              questionId: currentRecord[0] || "",
              configId: currentRecord[1] || "",
              testName: processHtmlContent(currentRecord[2]) || null,
              question: processHtmlContent(currentRecord[3] || ""),
              option1: processHtmlContent(currentRecord[4]) || null,
              option2: processHtmlContent(currentRecord[5]) || null,
              option3: processHtmlContent(currentRecord[6]) || null,
              option4: processHtmlContent(currentRecord[7]) || null,
              option5: processHtmlContent(currentRecord[8]) || null,
              answer: currentRecord[9] ? parseInt(currentRecord[9]) : null,
              description: processHtmlContent(currentRecord[10]) || null,
              // Additional fields if present in CSV
              subject: currentRecord[11]
                ? processHtmlContent(currentRecord[11])
                : undefined,
              topic: currentRecord[12]
                ? processHtmlContent(currentRecord[12])
                : undefined,
              difficulty: currentRecord[13]
                ? processHtmlContent(currentRecord[13])
                : undefined,
              questionType: currentRecord[14]
                ? processHtmlContent(currentRecord[14])
                : undefined,
              category: currentRecord[15]
                ? processHtmlContent(currentRecord[15])
                : undefined,
              subCategory: currentRecord[16]
                ? processHtmlContent(currentRecord[16])
                : undefined,
              tags: currentRecord[17]
                ? currentRecord[17]
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag)
                : undefined,
            };

            // Validate essential fields before adding
            if (question.questionId && question.configId && question.question) {
              questions.push(question);

              if (questions.length % 5000 === 0) {
                console.log(`Processed ${questions.length} questions...`);
              }
            } else {
              console.warn(
                `Skipping invalid question at record ${
                  recordCount + 1
                }: missing essential fields`
              );
            }
          } catch (error) {
            console.warn(`Error processing record ${recordCount + 1}:`, error);
          }
        }

        recordCount++;
      }

      // Reset for next record
      currentRecord = [];
      currentField = "";

      // Skip \r\n combinations
      if (char === "\r" && nextChar === "\n") {
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // Regular character
    currentField += char;
    i++;
  }

  // Handle last record if file doesn't end with newline
  if (currentRecord.length > 0 || currentField) {
    currentRecord.push(processHtmlContent(currentField));
    if (currentRecord.length >= 11 && recordCount > 0) {
      try {
        const question: InsertQuestion = {
          questionId: currentRecord[0] || "",
          configId: currentRecord[1] || "",
          testName: processHtmlContent(currentRecord[2]) || null,
          question: processHtmlContent(currentRecord[3] || ""),
          option1: processHtmlContent(currentRecord[4]) || null,
          option2: processHtmlContent(currentRecord[5]) || null,
          option3: processHtmlContent(currentRecord[6]) || null,
          option4: processHtmlContent(currentRecord[7]) || null,
          option5: processHtmlContent(currentRecord[8]) || null,
          answer: currentRecord[9] ? parseInt(currentRecord[9]) : null,
          description: processHtmlContent(currentRecord[10]) || null,
          subject: currentRecord[11]
            ? processHtmlContent(currentRecord[11])
            : undefined,
          topic: currentRecord[12]
            ? processHtmlContent(currentRecord[12])
            : undefined,
          difficulty: currentRecord[13]
            ? processHtmlContent(currentRecord[13])
            : undefined,
          questionType: currentRecord[14]
            ? processHtmlContent(currentRecord[14])
            : undefined,
          category: currentRecord[15]
            ? processHtmlContent(currentRecord[15])
            : undefined,
          subCategory: currentRecord[16]
            ? processHtmlContent(currentRecord[16])
            : undefined,
          tags: currentRecord[17]
            ? currentRecord[17]
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : undefined,
        };

        if (question.questionId && question.configId && question.question) {
          questions.push(question);
        }
      } catch (error) {
        console.warn(`Error processing final record:`, error);
      }
    }
  }

  console.log(
    `Parsed ${questions.length} questions from ${recordCount} total records`
  );
  return questions;
}

// Helper function for language detection
function detectLanguageFromContent(text: string): string {
  const plainText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Simple language detection based on script/characters
  if (/[\u0900-\u097F]/.test(plainText)) return "Hindi";
  if (/[\u0B80-\u0BFF]/.test(plainText)) return "Tamil";
  if (/[\u0C00-\u0C7F]/.test(plainText)) return "Telugu";
  if (/[\u0A80-\u0AFF]/.test(plainText)) return "Gujarati";
  if (/[\u0A00-\u0A7F]/.test(plainText)) return "Punjabi";
  if (/[\u0980-\u09FF]/.test(plainText)) return "Bengali";
  if (/[\u0D00-\u0D7F]/.test(plainText)) return "Malayalam";
  if (/[\u0C80-\u0CFF]/.test(plainText)) return "Kannada";
  if (/[\u0B00-\u0B7F]/.test(plainText)) return "Odia";
  if (/[\u0A80-\u0AFF]/.test(plainText)) return "Marathi";

  return "English";
}

// Helper function to calculate text similarity
function calculateSimilarity(text1: string, text2: string): number {
  const clean1 = text1
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const clean2 = text2
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (clean1 === clean2) return 100;

  // Simple Jaccard similarity
  const words1 = new Set(clean1.split(" "));
  const words2 = new Set(clean2.split(" "));
  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return Math.round((intersection.size / union.size) * 100);
}

// Helper function to analyze question groups for duplicates
async function analyzeQuestionGroup(questions: any[], configId: string) {
  const analyzedQuestions = questions.map((q) => ({
    id: q.id,
    questionId: q.questionId,
    question: q.question,
    testName: q.testName || "Unknown",
    language: detectLanguageFromContent(q.question),
    similarity: 100, // Start with 100% for self-comparison
  }));

  // Calculate average similarity within the group
  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < analyzedQuestions.length; i++) {
    for (let j = i + 1; j < analyzedQuestions.length; j++) {
      const similarity = calculateSimilarity(
        analyzedQuestions[i].question,
        analyzedQuestions[j].question
      );
      totalSimilarity += similarity;
      comparisons++;
    }
  }

  const avgSimilarity =
    comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 100;

  // Determine duplicate type
  let duplicateType: "exact" | "similar" | "multilingual" = "similar";
  if (avgSimilarity >= 95) {
    duplicateType = "exact";
  } else if (analyzedQuestions.some((q) => q.language !== "English")) {
    duplicateType = "multilingual";
  }

  return {
    configId,
    questions: analyzedQuestions,
    duplicateType,
    totalCount: analyzedQuestions.length,
    avgSimilarity,
  };
}

// Add duplicate detection endpoints after the existing endpoints
