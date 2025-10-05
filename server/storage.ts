import { questions, type Question, type InsertQuestion, type UpdateQuestion, type SearchRequest, type SearchResponse, type CategoryUpdate, type BulkCategoryUpdate } from "../shared/schema";
import { db } from "./db";
import { eq, like, ilike, or, and, isNull, isNotNull, ne, sql, count, gt } from "drizzle-orm";

export interface IStorage {
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: UpdateQuestion): Promise<Question | undefined>;
  bulkCreateQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  searchQuestions(request: SearchRequest): Promise<SearchResponse>;
  getTotalCount(): Promise<number>;
  clearQuestions(): Promise<void>;
  getFilterOptions(): Promise<{
    configIds: string[];
    testNames: string[];
    questionStats: {
      totalQuestions: number;
      questionsWithOptions: number;
      questionsWithDescription: number;
      optionCounts: Record<string, number>;
    };
  }>;
  // Categorization methods
  updateQuestionCategory(update: CategoryUpdate): Promise<Question | undefined>;
  bulkUpdateCategories(update: BulkCategoryUpdate): Promise<Question[]>;
  getCategoryOptions(): Promise<{
    subjects: string[];
    topics: string[];
    difficulties: string[];
    questionTypes: string[];
    tags: string[];
    categories: string[];
    subCategories: string[];
  }>;
  // Multilingual merge methods
  getQuestionsByConfigId(configId: string): Promise<Question[]>;
  mergeMultilingualQuestions(configId: string, primaryQuestionId: string, languageVariants: any[]): Promise<Question>;
  // Export methods
  getQuestionsByTestName(testName: string): Promise<Question[]>;
  // Smart deduplication methods
  getDuplicateConfigIds(): Promise<string[]>;
  updateQuestionConfigId(questionId: number, newConfigId: string): Promise<void>;
  deleteQuestion(questionId: number): Promise<void>;
  // Duplicate detection methods
  getDuplicateStats(): Promise<{
    totalGroups: number;
    totalQuestions: number;
    exactDuplicates: number;
    similarQuestions: number;
    multilingualPairs: number;
    potentialSavings: number;
  }>;
  getDuplicateGroups(): Promise<any[]>;
  saveDuplicateGroup(group: any): Promise<void>;
  mergeDuplicateGroups(groupIds: string[]): Promise<any>;
  deleteDuplicateGroups(groupIds: string[]): Promise<any>;
}

export class MemStorage implements IStorage {
  private questions: Map<number, Question>;
  private currentId: number;
  private searchIndex: Map<string, Set<number>>;

  constructor() {
    this.questions = new Map();
    this.currentId = 1;
    this.searchIndex = new Map();
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentId++;
    const question: Question = { 
      ...insertQuestion, 
      id,
      description: insertQuestion.description ?? null,
      testName: insertQuestion.testName ?? null,
      option1: insertQuestion.option1 ?? null,
      option2: insertQuestion.option2 ?? null,
      option3: insertQuestion.option3 ?? null,
      option4: insertQuestion.option4 ?? null,
      option5: insertQuestion.option5 ?? null,
      answer: insertQuestion.answer ?? null,
      // Ensure all required fields are present
      subject: insertQuestion.subject ?? null,
      topic: insertQuestion.topic ?? null,
      difficulty: insertQuestion.difficulty ?? null,
      questionType: insertQuestion.questionType ?? null,
      tags: insertQuestion.tags ?? null,
      category: insertQuestion.category ?? null,
      subCategory: insertQuestion.subCategory ?? null
    };
    this.questions.set(id, question);
    this.updateSearchIndex(question);
    return question;
  }

  async bulkCreateQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    const createdQuestions: Question[] = [];
    
    for (const insertQuestion of insertQuestions) {
      const id = this.currentId++;
      const question: Question = { 
        ...insertQuestion, 
        id,
        description: insertQuestion.description ?? null,
        testName: insertQuestion.testName ?? null,
        option1: insertQuestion.option1 ?? null,
        option2: insertQuestion.option2 ?? null,
        option3: insertQuestion.option3 ?? null,
        option4: insertQuestion.option4 ?? null,
        option5: insertQuestion.option5 ?? null,
        answer: insertQuestion.answer ?? null,
        // Ensure all required fields are present
        subject: insertQuestion.subject ?? null,
        topic: insertQuestion.topic ?? null,
        difficulty: insertQuestion.difficulty ?? null,
        questionType: insertQuestion.questionType ?? null,
        tags: insertQuestion.tags ?? null,
        category: insertQuestion.category ?? null,
        subCategory: insertQuestion.subCategory ?? null
      };
      this.questions.set(id, question);
      this.updateSearchIndex(question);
      createdQuestions.push(question);
    }
    
    return createdQuestions;
  }

  async searchQuestions(request: SearchRequest): Promise<SearchResponse> {
    const { query, searchIn, page, pageSize } = request;
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    let matchingIds = new Set<number>();
    
    if (searchTerms.length === 0) {
      // Return all questions if no search terms
      matchingIds = new Set(this.questions.keys());
    } else {
      // Find questions that match all search terms
      for (const term of searchTerms) {
        const termMatches = new Set<number>();
        
        // Search in the specified fields
        for (const [questionId, question] of Array.from(this.questions.entries())) {
          const shouldMatch = this.questionMatchesTerm(question, term, searchIn);
          if (shouldMatch) {
            termMatches.add(questionId);
          }
        }
        
        if (matchingIds.size === 0) {
          matchingIds = termMatches;
        } else {
          // Intersection - only keep questions that match all terms
          matchingIds = new Set(Array.from(matchingIds).filter(id => termMatches.has(id)));
        }
      }
    }

    const total = matchingIds.size;
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    
    // Convert to array and paginate
    const matchingQuestions = Array.from(matchingIds)
      .map(id => this.questions.get(id)!)
      .sort((a, b) => parseInt(a.questionId) - parseInt(b.questionId))
      .slice(offset, offset + pageSize);

    return {
      questions: matchingQuestions,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getTotalCount(): Promise<number> {
    return this.questions.size;
  }

  async clearQuestions(): Promise<void> {
    this.questions.clear();
    this.searchIndex.clear();
    this.currentId = 1;
  }

  async getFilterOptions(): Promise<{
    configIds: string[];
    testNames: string[];
    questionStats: {
      totalQuestions: number;
      questionsWithOptions: number;
      questionsWithDescription: number;
      optionCounts: Record<string, number>;
    };
  }> {
    const configIds = new Set<string>();
    const testNames = new Set<string>();
    let questionsWithOptions = 0;
    let questionsWithDescription = 0;
    const optionCounts: Record<string, number> = { "2": 0, "3": 0, "4": 0, "5": 0 };

    for (const [, question] of this.questions) {
      configIds.add(question.configId);
      if (question.testName) testNames.add(question.testName);
      
      if (question.option1 || question.option2 || question.option3 || question.option4 || question.option5) {
        questionsWithOptions++;
      }
      
      if (question.description && question.description.trim()) {
        questionsWithDescription++;
      }

      // Count options
      const options = [question.option1, question.option2, question.option3, question.option4, question.option5];
      const nonNullOptions = options.filter(opt => opt && opt.trim()).length;
      if (nonNullOptions >= 2 && nonNullOptions <= 5) {
        optionCounts[nonNullOptions.toString()]++;
      }
    }

    return {
      configIds: Array.from(configIds).slice(0, 50), // Limit for performance
      testNames: Array.from(testNames).slice(0, 50),
      questionStats: {
        totalQuestions: this.questions.size,
        questionsWithOptions,
        questionsWithDescription,
        optionCounts,
      },
    };
  }

  private questionMatchesTerm(question: Question, term: string, searchIn: string): boolean {
    const lowerTerm = term.toLowerCase();
    
    switch (searchIn) {
      case "question":
        return this.cleanHtml(question.question).toLowerCase().includes(lowerTerm);
      
      case "options":
        return [question.option1, question.option2, question.option3, question.option4, question.option5]
          .some(option => option && this.cleanHtml(option).toLowerCase().includes(lowerTerm));
      
      case "description":
        return question.description ? this.cleanHtml(question.description).toLowerCase().includes(lowerTerm) : false;
      
      case "all":
      default:
        const allText = [
          question.question,
          question.option1,
          question.option2,
          question.option3,
          question.option4,
          question.option5,
          question.description
        ].filter(Boolean).map(text => this.cleanHtml(text!)).join(' ').toLowerCase();
        
        return allText.includes(lowerTerm);
    }
  }

  private cleanHtml(text: string): string {
    return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private updateSearchIndex(question: Question): void {
    // Build search index for faster lookups if needed
    const allText = [
      question.question,
      question.option1,
      question.option2,
      question.option3,
      question.option4,
      question.option5,
      question.description
    ].filter(Boolean).join(' ').toLowerCase();

    const words = allText.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word)!.add(question.id);
      }
    }
  }

  // Memory storage implementation of merge functionality
  async getQuestionsByConfigId(configId: string): Promise<Question[]> {
    const matches: Question[] = [];
    for (const [, question] of this.questions) {
      if (question.configId === configId) {
        matches.push(question);
      }
    }
    return matches.sort((a, b) => a.id - b.id);
  }

  async mergeMultilingualQuestions(
    configId: string,
    primaryQuestionId: string,
    languageVariants: { questionId: string; language: string; questionText: string }[]
  ): Promise<Question> {
    // Get all questions with this config ID
    const questionsToMerge = await this.getQuestionsByConfigId(configId);
    
    if (questionsToMerge.length < 2) {
      throw new Error("Not enough questions to merge");
    }

    // Find the primary question
    const primaryQuestion = questionsToMerge.find(q => q.questionId === primaryQuestionId);
    if (!primaryQuestion) {
      throw new Error("Primary question not found");
    }

    // Create the merged question with multilingual content
    const mergedQuestionText = primaryQuestion.question + '\n\n' + 
      languageVariants.map(variant => 
        `[${variant.language}] ${variant.questionText}`
      ).join('\n\n');

    // Merge solutions/descriptions from all language variants  
    const allDescriptions = questionsToMerge
      .filter(q => q.description && q.description.trim() !== "")
      .map(q => {
        const language = this.detectLanguageFromContent(q.question);
        return `[${language} Solution] ${q.description}`;
      });

    const mergedDescription = allDescriptions.length > 0 ? allDescriptions.join('\n\n---\n\n') : primaryQuestion.description;

    // Update the primary question with merged content
    const updatedQuestion: Question = {
      ...primaryQuestion,
      question: mergedQuestionText,
      description: mergedDescription,
    };

    this.questions.set(primaryQuestion.id, updatedQuestion);
    this.updateSearchIndex(updatedQuestion);

    // Delete the other language variants
    const questionIdsToDelete = questionsToMerge
      .filter(q => q.id !== primaryQuestion.id)
      .map(q => q.id);

    questionIdsToDelete.forEach(id => this.questions.delete(id));

    return updatedQuestion;
  }

  // Missing methods for MemStorage to implement IStorage interface
  async updateQuestion(id: number, updateData: UpdateQuestion): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(id);
    if (!existingQuestion) {
      return undefined;
    }

    const updatedQuestion: Question = {
      ...existingQuestion,
      ...updateData,
    };

    this.questions.set(id, updatedQuestion);
    this.updateSearchIndex(updatedQuestion);
    return updatedQuestion;
  }

  async updateQuestionCategory(update: CategoryUpdate): Promise<Question | undefined> {
    const existingQuestion = this.questions.get(update.questionId);
    if (!existingQuestion) {
      return undefined;
    }

    const updatedQuestion: Question = {
      ...existingQuestion,
      subject: update.subject ?? existingQuestion.subject,
      topic: update.topic ?? existingQuestion.topic,
      difficulty: update.difficulty ?? existingQuestion.difficulty,
      questionType: update.questionType ?? existingQuestion.questionType,
      tags: update.tags ?? existingQuestion.tags,
      category: update.category ?? existingQuestion.category,
      subCategory: update.subCategory ?? existingQuestion.subCategory,
    };

    this.questions.set(update.questionId, updatedQuestion);
    this.updateSearchIndex(updatedQuestion);
    return updatedQuestion;
  }

  async bulkUpdateCategories(update: BulkCategoryUpdate): Promise<Question[]> {
    const updatedQuestions: Question[] = [];

    for (const questionId of update.questionIds) {
      const existingQuestion = this.questions.get(questionId);
      if (existingQuestion) {
        const updatedQuestion: Question = {
          ...existingQuestion,
          subject: update.updates.subject ?? existingQuestion.subject,
          topic: update.updates.topic ?? existingQuestion.topic,
          difficulty: update.updates.difficulty ?? existingQuestion.difficulty,
          questionType: update.updates.questionType ?? existingQuestion.questionType,
          tags: update.updates.tags ?? existingQuestion.tags,
          category: update.updates.category ?? existingQuestion.category,
          subCategory: update.updates.subCategory ?? existingQuestion.subCategory,
        };

        this.questions.set(questionId, updatedQuestion);
        this.updateSearchIndex(updatedQuestion);
        updatedQuestions.push(updatedQuestion);
      }
    }

    return updatedQuestions;
  }

  async getCategoryOptions(): Promise<{
    subjects: string[];
    topics: string[];
    difficulties: string[];
    questionTypes: string[];
    tags: string[];
    categories: string[];
    subCategories: string[];
  }> {
    const subjects = new Set<string>();
    const topics = new Set<string>();
    const difficulties = new Set<string>();
    const questionTypes = new Set<string>();
    const tags = new Set<string>();
    const categories = new Set<string>();
    const subCategories = new Set<string>();

    for (const [, question] of this.questions) {
      if (question.subject) subjects.add(question.subject);
      if (question.topic) topics.add(question.topic);
      if (question.difficulty) difficulties.add(question.difficulty);
      if (question.questionType) questionTypes.add(question.questionType);
      if (question.category) categories.add(question.category);
      if (question.subCategory) subCategories.add(question.subCategory);
      if (question.tags) {
        question.tags.forEach(tag => tags.add(tag));
      }
    }

    return {
      subjects: Array.from(subjects).sort(),
      topics: Array.from(topics).sort(),
      difficulties: Array.from(difficulties).sort(),
      questionTypes: Array.from(questionTypes).sort(),
      tags: Array.from(tags).sort(),
      categories: Array.from(categories).sort(),
      subCategories: Array.from(subCategories).sort(),
    };
  }

  // Helper method to detect language from content (MemStorage)
  private detectLanguageFromContent(text: string): string {
    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
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

  async getQuestionsByTestName(testName: string): Promise<Question[]> {
    const result: Question[] = [];
    for (const [, question] of this.questions) {
      if (question.testName === testName) {
        result.push(question);
      }
    }
    return result.sort((a, b) => a.id - b.id);
  }

  async getDuplicateConfigIds(): Promise<string[]> {
    const configCounts = new Map<string, number>();
    for (const [, question] of this.questions) {
      const count = configCounts.get(question.configId) || 0;
      configCounts.set(question.configId, count + 1);
    }
    
    return Array.from(configCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([configId]) => configId);
  }

  async updateQuestionConfigId(questionId: number, newConfigId: string): Promise<void> {
    const question = this.questions.get(questionId);
    if (question) {
      question.configId = newConfigId;
      this.questions.set(questionId, question);
    }
  }

  async deleteQuestion(questionId: number): Promise<void> {
    this.questions.delete(questionId);
  }

  // Duplicate detection methods (stub implementations for MemStorage)
  async getDuplicateStats(): Promise<{
    totalGroups: number;
    totalQuestions: number;
    exactDuplicates: number;
    similarQuestions: number;
    multilingualPairs: number;
    potentialSavings: number;
  }> {
    return {
      totalGroups: 0,
      totalQuestions: 0,
      exactDuplicates: 0,
      similarQuestions: 0,
      multilingualPairs: 0,
      potentialSavings: 0
    };
  }

  async getDuplicateGroups(): Promise<any[]> {
    return [];
  }

  async saveDuplicateGroup(group: any): Promise<void> {
    // Stub implementation
  }

  async mergeDuplicateGroups(groupIds: string[]): Promise<any> {
    return { merged: 0, total: groupIds.length };
  }

  async deleteDuplicateGroups(groupIds: string[]): Promise<any> {
    return { deleted: 0, total: groupIds.length };
  }
}

export class DatabaseStorage implements IStorage {
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values({
        ...insertQuestion,
        description: insertQuestion.description ?? null,
        testName: insertQuestion.testName ?? null,
        option1: insertQuestion.option1 ?? null,
        option2: insertQuestion.option2 ?? null,
        option3: insertQuestion.option3 ?? null,
        option4: insertQuestion.option4 ?? null,
        option5: insertQuestion.option5 ?? null,
        answer: insertQuestion.answer ?? null
      })
      .returning();
    return question;
  }

  async bulkCreateQuestions(insertQuestions: InsertQuestion[], progressCallback?: (processed: number, total: number) => void): Promise<Question[]> {
    // First, get existing question IDs to avoid duplicates
    const existingQuestionIds = new Set(
      (await db.select({ questionId: questions.questionId, configId: questions.configId }).from(questions))
        .map(q => `${q.questionId}-${q.configId}`)
    );

    // Filter out questions that already exist
    const newQuestions = insertQuestions.filter(q => 
      !existingQuestionIds.has(`${q.questionId}-${q.configId}`)
    );

    console.log(`Filtered ${insertQuestions.length - newQuestions.length} duplicate questions, inserting ${newQuestions.length} new questions`);

    if (newQuestions.length === 0) {
      return [];
    }

    const validQuestions = newQuestions.map(q => ({
      ...q,
      description: q.description ?? null,
      testName: q.testName ?? null,
      option1: q.option1 ?? null,
      option2: q.option2 ?? null,
      option3: q.option3 ?? null,
      option4: q.option4 ?? null,
      option5: q.option5 ?? null,
      answer: q.answer ?? null
    }));

    const batchSize = 100;
    const createdQuestions: Question[] = [];
    
    for (let i = 0; i < validQuestions.length; i += batchSize) {
      const batch = validQuestions.slice(i, i + batchSize);
      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validQuestions.length / batchSize)}`);
      
      const batchResults = await db
        .insert(questions)
        .values(batch)
        .onConflictDoNothing({
          target: [questions.questionId, questions.configId],
        })
        .returning();
      
      createdQuestions.push(...batchResults);
      
      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(Math.min(i + batchSize, validQuestions.length), validQuestions.length);
      }
    }
    
    return createdQuestions;
  }

  async searchQuestions(request: SearchRequest): Promise<SearchResponse> {
    const { 
      query, 
      searchIn, 
      searchMode,
      page, 
      pageSize: requestedPageSize, 
      configId, 
      testName, 
      hasOptions, 
      hasDescription, 
      answerCount,
      // Categorization filters
      subject,
      topic,
      difficulty,
      questionType,
      tags,
      category,
      subCategory
    } = request;
    
    // Emergency memory protection: limit page size
    const pageSize = Math.min(requestedPageSize || 10, 50); // Max 50 results per page
    
    const conditions = [];
    
    // Enhanced text search with Boolean operators and relevance ranking
    if (query && query.trim().length > 0) {
      const searchConditions = this.buildSearchConditions(query, searchIn, searchMode);
      if (searchConditions) {
        conditions.push(searchConditions);
      }
    }
    
    // Advanced filter conditions
    if (configId) {
      conditions.push(ilike(questions.configId, `%${configId}%`));
    }
    
    if (testName) {
      // Handle multiple test names separated by comma
      const testNames = testName.split(',').map(name => name.trim());
      if (testNames.length > 1) {
        conditions.push(or(...testNames.map(name => ilike(questions.testName, `%${name}%`))));
      } else {
        conditions.push(ilike(questions.testName, `%${testName}%`));
      }
    }
    
    if (hasOptions !== undefined) {
      if (hasOptions) {
        conditions.push(or(
          isNotNull(questions.option1),
          isNotNull(questions.option2),
          isNotNull(questions.option3),
          isNotNull(questions.option4),
          isNotNull(questions.option5)
        ));
      } else {
        conditions.push(and(
          isNull(questions.option1),
          isNull(questions.option2),
          isNull(questions.option3),
          isNull(questions.option4),
          isNull(questions.option5)
        ));
      }
    }
    
    if (hasDescription !== undefined) {
      if (hasDescription) {
        conditions.push(and(
          isNotNull(questions.description),
          ne(questions.description, "")
        ));
      } else {
        conditions.push(or(
          isNull(questions.description),
          eq(questions.description, "")
        ));
      }
    }
    
    if (answerCount && answerCount !== "any") {
      const count = parseInt(answerCount);
      // Create a condition based on how many options are not null
      const optionConditions = [];
      
      switch (count) {
        case 2:
          optionConditions.push(
            and(
              isNotNull(questions.option1),
              isNotNull(questions.option2),
              isNull(questions.option3),
              isNull(questions.option4),
              isNull(questions.option5)
            )
          );
          break;
        case 3:
          optionConditions.push(
            and(
              isNotNull(questions.option1),
              isNotNull(questions.option2),
              isNotNull(questions.option3),
              isNull(questions.option4),
              isNull(questions.option5)
            )
          );
          break;
        case 4:
          optionConditions.push(
            and(
              isNotNull(questions.option1),
              isNotNull(questions.option2),
              isNotNull(questions.option3),
              isNotNull(questions.option4),
              isNull(questions.option5)
            )
          );
          break;
        case 5:
          optionConditions.push(
            and(
              isNotNull(questions.option1),
              isNotNull(questions.option2),
              isNotNull(questions.option3),
              isNotNull(questions.option4),
              isNotNull(questions.option5)
            )
          );
          break;
      }
      
      if (optionConditions.length > 0) {
        conditions.push(or(...optionConditions));
      }
    }

    // Categorization filters
    if (subject) {
      conditions.push(ilike(questions.subject, `%${subject}%`));
    }
    
    if (topic) {
      conditions.push(ilike(questions.topic, `%${topic}%`));
    }
    
    if (difficulty) {
      conditions.push(eq(questions.difficulty, difficulty));
    }
    
    if (questionType) {
      conditions.push(ilike(questions.questionType, `%${questionType}%`));
    }
    
    if (category) {
      conditions.push(ilike(questions.category, `%${category}%`));
    }
    
    if (subCategory) {
      conditions.push(ilike(questions.subCategory, `%${subCategory}%`));
    }
    
    const whereCondition = conditions.length === 0 ? undefined : 
                          conditions.length === 1 ? conditions[0] : and(...conditions);

    // Emergency memory protection: Use efficient count query
    let total: number;
    try {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(whereCondition);
      total = countResult.count;
    } catch (error) {
      console.warn("Count query failed:", error);
      total = 0;
    }
    
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;
    
    // Get paginated results with strict memory limits
    let matchingQuestions: Question[] = [];
    try {
      matchingQuestions = await db
        .select()
        .from(questions)
        .where(whereCondition)
        .limit(Math.min(pageSize, 50)) // Emergency limit
        .offset(offset);
    } catch (error) {
      console.warn("Search query failed:", error);
      return {
        questions: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    // Apply relevance ranking only for small result sets
    let sortedQuestions = matchingQuestions;
    if (query && query.trim().length > 0 && matchingQuestions.length <= 100) {
      try {
        sortedQuestions = this.rankQuestionsByRelevance(matchingQuestions, query, searchIn);
      } catch (error) {
        console.warn("Ranking failed:", error);
        sortedQuestions = matchingQuestions;
      }
    }

    // Results are already paginated above
    const paginatedQuestions = sortedQuestions;

    return {
      questions: paginatedQuestions,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getTotalCount(): Promise<number> {
    // Use efficient count query instead of loading all records
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions);
    return result.count;
  }

  async clearQuestions(): Promise<void> {
    await db.delete(questions);
  }

  async getFilterOptions(): Promise<{
    configIds: string[];
    testNames: string[];
    questionStats: {
      totalQuestions: number;
      questionsWithOptions: number;
      questionsWithDescription: number;
      optionCounts: Record<string, number>;
    };
  }> {
    // Get distinct config IDs (emergency memory limit)
    const configIdResults = await db
      .selectDistinct({ configId: questions.configId })
      .from(questions)
      .orderBy(questions.configId)
      .limit(20); // Emergency limit to prevent memory overflow
    
    // Get distinct test names (non-null) - show all available tests
    const testNameResults = await db
      .selectDistinct({ testName: questions.testName })
      .from(questions)
      .where(isNotNull(questions.testName))
      .orderBy(questions.testName)
      .limit(10000); // Show all 9,772 available tests

    // Get question statistics
    const totalCount = await this.getTotalCount();
    
    // Count questions with options using efficient counting
    const [questionsWithOptionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(or(
        isNotNull(questions.option1),
        isNotNull(questions.option2),
        isNotNull(questions.option3),
        isNotNull(questions.option4),
        isNotNull(questions.option5)
      ));
    
    // Count questions with description using efficient counting
    const [questionsWithDescriptionResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(and(
        isNotNull(questions.description),
        ne(questions.description, "")
      ));

    // Count option patterns (simplified for now)
    const optionCounts = { "2": 0, "3": 0, "4": 0, "5": 0 };

    return {
      configIds: configIdResults.map(r => r.configId),
      testNames: testNameResults.map(r => r.testName).filter((name): name is string => name !== null),
      questionStats: {
        totalQuestions: totalCount,
        questionsWithOptions: questionsWithOptionsResult?.count || 0,
        questionsWithDescription: questionsWithDescriptionResult?.count || 0,
        optionCounts,
      },
    };
  }

  async updateQuestion(id: number, updateQuestion: UpdateQuestion): Promise<Question | undefined> {
    // Remove undefined values from the update object
    const updateData = Object.fromEntries(
      Object.entries(updateQuestion).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      return this.getQuestion(id);
    }

    const [updatedQuestion] = await db
      .update(questions)
      .set(updateData)
      .where(eq(questions.id, id))
      .returning();

    return updatedQuestion || undefined;
  }

  async updateQuestionCategory(update: CategoryUpdate): Promise<Question | undefined> {
    const { questionId, ...categoryData } = update;
    
    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(categoryData).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0) {
      return this.getQuestion(questionId);
    }

    const updatedQuestions = await db
      .update(questions)
      .set(updateData)
      .where(eq(questions.id, questionId))
      .returning();

    return updatedQuestions[0] || undefined;
  }

  async bulkUpdateCategories(update: BulkCategoryUpdate): Promise<Question[]> {
    const { questionIds, updates } = update;
    
    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(updateData).length === 0 || questionIds.length === 0) {
      return [];
    }

    const updatedQuestions = await db
      .update(questions)
      .set(updateData)
      .where(or(...questionIds.map(id => eq(questions.id, id))))
      .returning();

    return updatedQuestions;
  }

  async getCategoryOptions(): Promise<{
    subjects: string[];
    topics: string[];
    difficulties: string[];
    questionTypes: string[];
    tags: string[];
    categories: string[];
    subCategories: string[];
  }> {
    // Get distinct values for each categorization field
    const [
      subjectResults,
      topicResults,
      difficultyResults,
      questionTypeResults,
      categoryResults,
      subCategoryResults,
    ] = await Promise.all([
      db.selectDistinct({ value: questions.subject }).from(questions).where(isNotNull(questions.subject)).limit(10),
      db.selectDistinct({ value: questions.topic }).from(questions).where(isNotNull(questions.topic)).limit(10),
      db.selectDistinct({ value: questions.difficulty }).from(questions).where(isNotNull(questions.difficulty)).limit(3),
      db.selectDistinct({ value: questions.questionType }).from(questions).where(isNotNull(questions.questionType)).limit(5),
      db.selectDistinct({ value: questions.category }).from(questions).where(isNotNull(questions.category)).limit(10),
      db.selectDistinct({ value: questions.subCategory }).from(questions).where(isNotNull(questions.subCategory)).limit(10),
    ]);

    // Get unique tags (emergency memory limit)
    const tagResults = await db.select({ tags: questions.tags }).from(questions).where(isNotNull(questions.tags)).limit(100); // Emergency limit
    const allTags = tagResults.flatMap(row => row.tags || []);
    const uniqueTags = [...new Set(allTags)].slice(0, 20); // Emergency limit

    return {
      subjects: subjectResults.map(r => r.value).filter((v): v is string => v !== null && v.trim() !== "").sort(),
      topics: topicResults.map(r => r.value).filter((v): v is string => v !== null && v.trim() !== "").sort(),
      difficulties: difficultyResults.map(r => r.value).filter((v): v is string => v !== null && v.trim() !== "").sort(),
      questionTypes: questionTypeResults.map(r => r.value).filter((v): v is string => v !== null && v.trim() !== "").sort(),
      tags: uniqueTags.filter(tag => tag.trim() !== "").sort(),
      categories: categoryResults.map(r => r.value).filter((v): v is string => v !== null && v.trim() !== "").sort(),
      subCategories: subCategoryResults.map(r => r.value).filter((v): v is string => v !== null && v.trim() !== "").sort(),
    };
  }

  // Get all questions with the same config ID (multilingual variants)
  async getQuestionsByConfigId(configId: string): Promise<Question[]> {
    const duplicateQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.configId, configId))
      .orderBy(questions.id);
    
    return duplicateQuestions;
  }

  // Merge multilingual questions into a single question with language variants
  async mergeMultilingualQuestions(
    configId: string,
    primaryQuestionId: string,
    languageVariants: { questionId: string; language: string; questionText: string }[]
  ): Promise<Question> {
    // Get all questions with this config ID
    const questionsToMerge = await this.getQuestionsByConfigId(configId);
    
    if (questionsToMerge.length < 2) {
      throw new Error("Not enough questions to merge");
    }

    // Find the primary question
    const primaryQuestion = questionsToMerge.find(q => q.questionId === primaryQuestionId);
    if (!primaryQuestion) {
      throw new Error("Primary question not found");
    }

    // Create the merged question with multilingual content
    const mergedQuestionText = primaryQuestion.question + '\n\n' + 
      languageVariants.map(variant => 
        `[${variant.language}] ${variant.questionText}`
      ).join('\n\n');

    // Merge options from all language variants
    const mergeOptions = (optionIndex: 1 | 2 | 3 | 4 | 5): string | null => {
      const optionKey = `option${optionIndex}` as keyof Question;
      const primaryOption = primaryQuestion[optionKey] as string;
      
      // Get options from other language variants
      const otherOptions = questionsToMerge
        .filter(q => q.id !== primaryQuestion.id)
        .map(q => {
          const option = q[optionKey] as string;
          return option ? option : null;
        })
        .filter(Boolean);

      if (otherOptions.length > 0) {
        // Use '/' to separate different language options instead of '[Hindi]'
        return primaryOption + ' / ' + otherOptions.join(' / ');
      }
      return primaryOption;
    };

    // Merge solutions/descriptions from all language variants
    const allDescriptions = questionsToMerge
      .filter(q => q.description && q.description.trim() !== "")
      .map(q => {
        const language = this.detectLanguageFromContent(q.question);
        return `[${language} Solution] ${q.description}`;
      });

    const mergedDescription = allDescriptions.length > 0 ? allDescriptions.join('\n\n---\n\n') : primaryQuestion.description;

    // Update the primary question with merged content
    const [updatedQuestion] = await db
      .update(questions)
      .set({
        question: mergedQuestionText,
        option1: mergeOptions(1),
        option2: mergeOptions(2),
        option3: mergeOptions(3),
        option4: mergeOptions(4),
        option5: mergeOptions(5),
        description: mergedDescription,
        // Preserve other fields from primary question
        subject: primaryQuestion.subject,
        topic: primaryQuestion.topic,
        difficulty: primaryQuestion.difficulty,
        questionType: primaryQuestion.questionType,
        tags: primaryQuestion.tags,
        category: primaryQuestion.category,
        subCategory: primaryQuestion.subCategory,
      })
      .where(eq(questions.id, primaryQuestion.id))
      .returning();

    // Delete the other language variants
    const questionIdsToDelete = questionsToMerge
      .filter(q => q.id !== primaryQuestion.id)
      .map(q => q.id);

    if (questionIdsToDelete.length > 0) {
      await db
        .delete(questions)
        .where(or(...questionIdsToDelete.map(id => eq(questions.id, id))));
    }

    return updatedQuestion;
  }

  // Bulk merge all questions with duplicate config IDs (with memory optimization)
  async bulkMergeMultilingualQuestions(): Promise<{ merged: number; skipped: number; errors: string[] }> {
    console.log("Starting bulk merge of multilingual questions...");
    
    // Find duplicate config IDs in batches to prevent memory overflow
    const batchSize = 500;
    let offset = 0;
    let merged = 0;
    let skipped = 0;
    const errors: string[] = [];
    let totalDuplicates = 0;

    // First, get the total count of duplicates for progress tracking
    try {
      const [{ count: duplicateCount }] = await db
        .select({ count: sql<number>`count(distinct ${questions.configId})` })
        .from(questions)
        .where(sql`${questions.configId} in (
          select config_id from questions 
          group by config_id 
          having count(*) > 1
        )`);
      
      totalDuplicates = duplicateCount || 0;
      console.log(`Found approximately ${totalDuplicates} config IDs with multiple questions`);

      if (totalDuplicates > 50000) {
        console.log("WARNING: Large number of duplicates detected. Processing will be limited to prevent memory issues.");
        totalDuplicates = Math.min(totalDuplicates, 10000); // Limit to 10k for safety
      }
    } catch (error) {
      console.error("Error counting duplicates:", error);
      return { merged: 0, skipped: 0, errors: ["Failed to count duplicate config IDs"] };
    }

    while (offset < totalDuplicates) {
      console.log(`Processing batch ${Math.floor(offset/batchSize) + 1}, offset: ${offset}`);
      
      try {
        // Get batch of duplicate config IDs with memory limits
        const duplicateConfigIds = await db
          .select({
            configId: questions.configId,
            count: sql<number>`count(${questions.id})`,
          })
          .from(questions)
          .groupBy(questions.configId)
          .having(sql`count(${questions.id}) > 1`)
          .limit(batchSize)
          .offset(offset);

        if (duplicateConfigIds.length === 0) {
          console.log("No more duplicates found, breaking loop");
          break;
        }

        // Process each config ID in this batch
        for (const { configId } of duplicateConfigIds) {
          try {
            const duplicates = await this.getQuestionsByConfigId(configId);
            
            if (duplicates.length < 2) {
              skipped++;
              continue;
            }

            // Use the first question as primary
            const primaryQuestion = duplicates[0];
            
            // Create language variants from other questions
            const languageVariants = duplicates.slice(1).map(q => ({
              questionId: q.questionId,
              language: this.detectLanguageFromContent(q.question),
              questionText: this.extractPlainText(q.question)
            }));

            await this.mergeMultilingualQuestions(configId, primaryQuestion.questionId, languageVariants);
            merged++;
            
            if (merged % 100 === 0) {
              console.log(`Processed ${merged} merges so far...`);
            }

            // Add small delay to prevent overwhelming the database
            if (merged % 50 === 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            const errorMsg = `Error merging config ${configId}: ${error instanceof Error ? error.message : String(error)}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            skipped++;
          }
        }

        offset += batchSize;
        
        // Memory protection: force garbage collection and add delay between batches
        if (global.gc) {
          global.gc();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (batchError) {
        console.error(`Error processing batch at offset ${offset}:`, batchError);
        errors.push(`Batch error at offset ${offset}: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
        break;
      }
    }

    console.log(`Bulk merge completed: ${merged} merged, ${skipped} skipped, ${errors.length} errors`);
    return { merged, skipped, errors };
  }

  private extractPlainText(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Helper method to detect language from content
  private detectLanguageFromContent(text: string): string {
    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
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

  // Build search conditions with Boolean operator support
  private buildSearchConditions(query: string, searchIn: string, searchMode: string = "simple") {
    if (searchMode === "boolean") {
      return this.buildBooleanSearchConditions(query, searchIn);
    } else {
      // Simple search: all terms must be present (AND operation)
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
      
      const termConditions = searchTerms.map(term => {
        const searchTerm = `%${term}%`;
        
        switch (searchIn) {
          case "question":
            return ilike(questions.question, searchTerm);
          case "options":
            return or(
              ilike(questions.option1, searchTerm),
              ilike(questions.option2, searchTerm),
              ilike(questions.option3, searchTerm),
              ilike(questions.option4, searchTerm),
              ilike(questions.option5, searchTerm)
            );
          case "description":
            return ilike(questions.description, searchTerm);
          case "all":
          default:
            return or(
              ilike(questions.question, searchTerm),
              ilike(questions.option1, searchTerm),
              ilike(questions.option2, searchTerm),
              ilike(questions.option3, searchTerm),
              ilike(questions.option4, searchTerm),
              ilike(questions.option5, searchTerm),
              ilike(questions.description, searchTerm)
            );
        }
      });
      
      return termConditions.length === 1 ? termConditions[0] : and(...termConditions);
    }
  }

  // Build Boolean search conditions
  private buildBooleanSearchConditions(query: string, searchIn: string) {
    // Parse Boolean query (simplified implementation)
    const orParts = query.toLowerCase().split(/\s+or\s+/i);
    
    const orConditions = orParts.map(orPart => {
      const andParts = orPart.split(/\s+and\s+/i);
      
      const andConditions = andParts.map(term => {
        const cleanTerm = term.trim();
        const searchTerm = `%${cleanTerm}%`;
        
        switch (searchIn) {
          case "question":
            return ilike(questions.question, searchTerm);
          case "options":
            return or(
              ilike(questions.option1, searchTerm),
              ilike(questions.option2, searchTerm),
              ilike(questions.option3, searchTerm),
              ilike(questions.option4, searchTerm),
              ilike(questions.option5, searchTerm)
            );
          case "description":
            return ilike(questions.description, searchTerm);
          case "all":
          default:
            return or(
              ilike(questions.question, searchTerm),
              ilike(questions.option1, searchTerm),
              ilike(questions.option2, searchTerm),
              ilike(questions.option3, searchTerm),
              ilike(questions.option4, searchTerm),
              ilike(questions.option5, searchTerm),
              ilike(questions.description, searchTerm)
            );
        }
      });
      
      return andConditions.length === 1 ? andConditions[0] : and(...andConditions);
    });
    
    return orConditions.length === 1 ? orConditions[0] : or(...orConditions);
  }

  // Rank questions by relevance based on keyword matches and sequence
  private rankQuestionsByRelevance(questions: Question[], query: string, searchIn: string): Question[] {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    const scoredQuestions = questions.map(question => {
      const score = this.calculateRelevanceScore(question, searchTerms, searchIn);
      return { question, score };
    });
    
    // Sort by relevance score (highest first)
    return scoredQuestions
      .sort((a, b) => b.score - a.score)
      .map(item => item.question);
  }

  // Calculate relevance score for a question with intelligent area-based prioritization
  private calculateRelevanceScore(question: Question, searchTerms: string[], searchIn: string): number {
    let score = 0;
    
    // Get individual content areas for targeted scoring
    const questionText = question.question.toLowerCase();
    const optionsText = [
      question.option1, question.option2, question.option3, 
      question.option4, question.option5
    ].filter(Boolean).join(' ').toLowerCase();
    const descriptionText = (question.description || '').toLowerCase();
    
    for (const term of searchTerms) {
      // PRIORITY SCORING: Higher scores for matches in selected search areas
      
      // 1. Question matches - highest priority when "question" is selected
      if (questionText.includes(term)) {
        if (searchIn === "question") {
          score += 100; // Highest priority for targeted question search
        } else if (searchIn === "all") {
          score += 50; // High priority for general search
        } else {
          score += 10; // Lower priority when not in selected area
        }
        
        // Bonus for exact word matches in questions
        const exactMatches = (questionText.match(new RegExp(`\\b${term}\\b`, 'gi')) || []).length;
        score += exactMatches * (searchIn === "question" ? 50 : 20);
      }
      
      // 2. Options matches - highest priority when "options" is selected
      if (optionsText.includes(term)) {
        if (searchIn === "options") {
          score += 100; // Highest priority for targeted options search
        } else if (searchIn === "all") {
          score += 30; // Medium priority for general search
        } else {
          score += 5; // Lower priority when not in selected area
        }
        
        // Bonus for exact word matches in options
        const exactMatches = (optionsText.match(new RegExp(`\\b${term}\\b`, 'gi')) || []).length;
        score += exactMatches * (searchIn === "options" ? 40 : 15);
      }
      
      // 3. Description matches - highest priority when "description" is selected
      if (descriptionText.includes(term)) {
        if (searchIn === "description") {
          score += 100; // Highest priority for targeted description search
        } else if (searchIn === "all") {
          score += 25; // Medium priority for general search
        } else {
          score += 3; // Lower priority when not in selected area
        }
        
        // Bonus for exact word matches in descriptions
        const exactMatches = (descriptionText.match(new RegExp(`\\b${term}\\b`, 'gi')) || []).length;
        score += exactMatches * (searchIn === "description" ? 35 : 12);
      }
    }
    
    // PHRASE MATCHING: Bonus for exact phrase sequences in selected areas
    const fullQuery = searchTerms.join(' ');
    if (searchIn === "question" && questionText.includes(fullQuery)) {
      score += 200; // Very high bonus for exact phrase in targeted question search
    } else if (searchIn === "options" && optionsText.includes(fullQuery)) {
      score += 180; // Very high bonus for exact phrase in targeted options search
    } else if (searchIn === "description" && descriptionText.includes(fullQuery)) {
      score += 160; // Very high bonus for exact phrase in targeted description search
    } else if (searchIn === "all") {
      // Distribute phrase bonuses for general search
      if (questionText.includes(fullQuery)) score += 100;
      if (optionsText.includes(fullQuery)) score += 80;
      if (descriptionText.includes(fullQuery)) score += 60;
    }
    
    // MULTI-TERM COVERAGE: Bonus for matching multiple terms in selected areas
    const questionMatches = searchTerms.filter(term => questionText.includes(term)).length;
    const optionMatches = searchTerms.filter(term => optionsText.includes(term)).length;
    const descriptionMatches = searchTerms.filter(term => descriptionText.includes(term)).length;
    
    if (searchIn === "question") {
      score += questionMatches * 20;
    } else if (searchIn === "options") {
      score += optionMatches * 20;
    } else if (searchIn === "description") {
      score += descriptionMatches * 20;
    } else if (searchIn === "all") {
      score += (questionMatches * 15) + (optionMatches * 10) + (descriptionMatches * 8);
    }
    
    return score;
  }

  // Get searchable content based on searchIn parameter
  private getSearchableContent(question: Question, searchIn: string): string {
    const parts = [];
    
    switch (searchIn) {
      case "question":
        parts.push(question.question);
        break;
      case "options":
        if (question.option1) parts.push(question.option1);
        if (question.option2) parts.push(question.option2);
        if (question.option3) parts.push(question.option3);
        if (question.option4) parts.push(question.option4);
        if (question.option5) parts.push(question.option5);
        break;
      case "description":
        if (question.description) parts.push(question.description);
        break;
      case "all":
      default:
        // Always include question text
        parts.push(question.question);
        // Include options
        if (question.option1) parts.push(question.option1);
        if (question.option2) parts.push(question.option2);
        if (question.option3) parts.push(question.option3);
        if (question.option4) parts.push(question.option4);
        if (question.option5) parts.push(question.option5);
        // Include description/solution
        if (question.description) parts.push(question.description);
        break;
    }
    
    return parts.join(' ');
  }

  async getQuestionsByTestName(testName: string): Promise<Question[]> {
    try {
      const questionList = await db
        .select()
        .from(questions)
        .where(eq(questions.testName, testName))
        .orderBy(questions.id);
      
      return questionList;
    } catch (error: any) {
      console.error("Database error in getQuestionsByTestName:", error);
      
      // If connection terminated, try once more after a short delay
      if (error.code === '57P01' || error.code === 'ECONNRESET') {
        console.log("Connection terminated, retrying after 1 second...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const questionList = await db
            .select()
            .from(questions)
            .where(eq(questions.testName, testName))
            .orderBy(questions.id);
          
          return questionList;
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  async getDuplicateConfigIds(): Promise<string[]> {
    const result = await db
      .select({ configId: questions.configId })
      .from(questions)
      .groupBy(questions.configId)
      .having(sql`count(*) > 1`);
    
    return result.map(row => row.configId);
  }

  async updateQuestionConfigId(questionId: number, newConfigId: string): Promise<void> {
    await db
      .update(questions)
      .set({ configId: newConfigId })
      .where(eq(questions.id, questionId));
  }

  async deleteQuestion(questionId: number): Promise<void> {
    await db
      .delete(questions)
      .where(eq(questions.id, questionId));
  }



  async getTestStats(): Promise<Array<{testName: string, questionCount: number}>> {
    const testStats = await db
      .select({
        testName: questions.testName,
        questionCount: sql<number>`count(*)`,
      })
      .from(questions)
      .where(isNotNull(questions.testName))
      .groupBy(questions.testName)
      .orderBy(questions.testName)
      .limit(10000); // Increased to show all 9,772 available tests

    return testStats.filter(stat => stat.testName !== null).map(stat => ({
      testName: stat.testName!,
      questionCount: stat.questionCount
    }));
  }

  // Duplicate detection methods
  async getDuplicateStats(): Promise<{
    totalGroups: number;
    totalQuestions: number;
    exactDuplicates: number;
    similarQuestions: number;
    multilingualPairs: number;
    potentialSavings: number;
  }> {
    // Get basic duplicate statistics
    const [totalGroupsResult] = await db
      .select({ count: sql<number>`count(distinct ${questions.configId})` })
      .from(questions)
      .where(sql`${questions.configId} in (
        select config_id from questions 
        group by config_id 
        having count(*) > 1
      )`);

    const [totalQuestionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(sql`${questions.configId} in (
        select config_id from questions 
        group by config_id 
        having count(*) > 1
      )`);

    const totalGroups = totalGroupsResult?.count || 0;
    const totalQuestions = totalQuestionsResult?.count || 0;
    
    // For now, return simplified stats
    // In a more advanced implementation, these would be calculated from stored analysis
    return {
      totalGroups,
      totalQuestions,
      exactDuplicates: Math.round(totalQuestions * 0.3), // Estimated
      similarQuestions: Math.round(totalQuestions * 0.5), // Estimated
      multilingualPairs: Math.round(totalQuestions * 0.2), // Estimated
      potentialSavings: Math.round(totalQuestions * 0.6) // Estimated potential reduction
    };
  }

  private duplicateGroupsCache: any[] = [];

  async getDuplicateGroups(): Promise<any[]> {
    return this.duplicateGroupsCache;
  }

  async saveDuplicateGroup(group: any): Promise<void> {
    // For now, store in memory cache
    // In a production system, this would be stored in a dedicated table
    const existingIndex = this.duplicateGroupsCache.findIndex(g => g.configId === group.configId);
    if (existingIndex >= 0) {
      this.duplicateGroupsCache[existingIndex] = group;
    } else {
      this.duplicateGroupsCache.push(group);
    }
  }

  async mergeDuplicateGroups(groupIds: string[]): Promise<any> {
    let mergedCount = 0;
    
    for (const configId of groupIds) {
      try {
        const questions = await this.getQuestionsByConfigId(configId);
        if (questions.length > 1) {
          const primaryQuestion = questions[0];
          const languageVariants = questions.slice(1).map(q => ({
            questionId: q.questionId,
            language: this.detectLanguageFromContent(q.question),
            questionText: this.extractPlainText(q.question)
          }));
          
          await this.mergeMultilingualQuestions(configId, primaryQuestion.questionId, languageVariants);
          mergedCount++;
          
          // Remove from cache
          this.duplicateGroupsCache = this.duplicateGroupsCache.filter(g => g.configId !== configId);
        }
      } catch (error) {
        console.error(`Error merging group ${configId}:`, error);
      }
    }
    
    return { merged: mergedCount, total: groupIds.length };
  }

  async deleteDuplicateGroups(groupIds: string[]): Promise<any> {
    let deletedCount = 0;
    
    for (const configId of groupIds) {
      try {
        const questionsToDelete = await this.getQuestionsByConfigId(configId);
        if (questionsToDelete.length > 1) {
          // Keep the first question, delete the rest
          const questionIdsToDelete = questionsToDelete.slice(1).map(q => q.id);
          
          await db
            .delete(questions)
            .where(or(...questionIdsToDelete.map(id => eq(questions.id, id))));
          
          deletedCount += questionIdsToDelete.length;
          
          // Remove from cache
          this.duplicateGroupsCache = this.duplicateGroupsCache.filter(g => g.configId !== configId);
        }
      } catch (error) {
        console.error(`Error deleting group ${configId}:`, error);
      }
    }
    
    return { deleted: deletedCount, total: groupIds.length };
  }
}

export const storage = new DatabaseStorage();
