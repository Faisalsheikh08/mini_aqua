import { pgTable, text, serial, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionId: text("question_id").notNull(),
  configId: text("config_id").notNull(),
  testName: text("test_name"),
  question: text("question").notNull(),
  option1: text("option_1"),
  option2: text("option_2"),
  option3: text("option_3"),
  option4: text("option_4"),
  option5: text("option_5"),
  answer: integer("answer"),
  description: text("description"),
  // Categorization fields
  subject: text("subject"), // e.g., "Mathematics", "Science", "English", etc.
  topic: text("topic"), // e.g., "Algebra", "Physics", "Grammar", etc.
  difficulty: text("difficulty"), // e.g., "Easy", "Medium", "Hard"
  questionType: text("question_type"), // e.g., "MCQ", "True/False", "Fill in the blank"
  tags: text("tags").array(), // Array of custom tags
  category: text("category"), // Main category like "CTET", "KVS", "MPTET", etc.
  subCategory: text("sub_category"), // Sub-category within main category
}, (table) => ({
  uniqueQuestionConfig: unique().on(table.questionId, table.configId),
}));

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const updateQuestionSchema = createInsertSchema(questions).partial().omit({
  id: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export const searchRequestSchema = z.object({
  query: z.string().default(""),
  searchIn: z.enum(["all", "question", "options", "description"]).default("all"),
  searchMode: z.enum(["simple", "boolean"]).default("simple"), // New: search mode
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  // Advanced filters
  configId: z.string().optional(),
  testName: z.string().optional(),
  hasOptions: z.boolean().optional(), // Filter by questions with/without options
  hasDescription: z.boolean().optional(), // Filter by questions with/without description
  answerCount: z.enum(["2", "3", "4", "5", "any"]).optional(), // Filter by number of answer options
  // Categorization filters
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  questionType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const searchResponseSchema = z.object({
  questions: z.array(z.object({
    id: z.number(),
    questionId: z.string(),
    configId: z.string(),
    testName: z.string().nullable(),
    question: z.string(),
    option1: z.string().nullable(),
    option2: z.string().nullable(),
    option3: z.string().nullable(),
    option4: z.string().nullable(),
    option5: z.string().nullable(),
    answer: z.number().nullable(),
    description: z.string().nullable(),
    // Categorization fields
    subject: z.string().nullable(),
    topic: z.string().nullable(),
    difficulty: z.string().nullable(),
    questionType: z.string().nullable(),
    tags: z.array(z.string()).nullable(),
    category: z.string().nullable(),
    subCategory: z.string().nullable(),
  })),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

// Categorization schemas
export const categoryUpdateSchema = z.object({
  questionId: z.number(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.union([z.enum(["Easy", "Medium", "Hard"]), z.literal(""), z.null()]).optional(),
  questionType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
});

export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

export const bulkCategoryUpdateSchema = z.object({
  questionIds: z.array(z.number()),
  updates: z.object({
    subject: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.union([z.enum(["Easy", "Medium", "Hard"]), z.literal(""), z.null()]).optional(),
    questionType: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
  }),
});

export type BulkCategoryUpdate = z.infer<typeof bulkCategoryUpdateSchema>;
