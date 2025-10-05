import { db } from './db.js';
import { sql } from 'drizzle-orm';

interface DuplicateGroup {
  questionIds: string[];
  testName: string;
  answer: string;
  cleanQuestion: string;
  duplicateCount: number;
}

export class DuplicateCleanupService {
  
  async findExactDuplicates(batchSize: number = 100): Promise<DuplicateGroup[]> {
    console.log('🔍 Finding exact duplicates...');
    
    const result = await db.execute(sql`
      WITH cleaned_questions AS (
        SELECT id, question_id, test_name, answer,
          REGEXP_REPLACE(REGEXP_REPLACE(question, '<[^>]*>', '', 'g'), '\\s+', ' ', 'g') as clean_question,
          REGEXP_REPLACE(REGEXP_REPLACE(option_1, '<[^>]*>', '', 'g'), '\\s+', ' ', 'g') as clean_option_1
        FROM questions
        WHERE LENGTH(question) > 20
      ),
      duplicate_groups AS (
        SELECT clean_question, clean_option_1, answer, test_name,
          COUNT(*) as duplicate_count,
          array_agg(question_id ORDER BY id) as question_ids
        FROM cleaned_questions
        GROUP BY clean_question, clean_option_1, answer, test_name
        HAVING COUNT(*) > 1
      )
      SELECT duplicate_count, test_name, answer, question_ids, clean_question
      FROM duplicate_groups
      ORDER BY duplicate_count DESC
      LIMIT ${batchSize}
    `);

    return result.rows.map((row: any) => ({
      questionIds: Array.isArray(row.question_ids) ? row.question_ids : [],
      testName: String(row.test_name || ''),
      answer: String(row.answer || ''),
      cleanQuestion: String(row.clean_question || ''),
      duplicateCount: parseInt(String(row.duplicate_count))
    }));
  }

  async findMultilingualPairs(batchSize: number = 50): Promise<DuplicateGroup[]> {
    console.log('🌐 Finding multilingual pairs...');
    
    const result = await db.execute(sql`
      WITH test_answer_groups AS (
        SELECT test_name, answer, 
          COUNT(*) as question_count,
          array_agg(question_id ORDER BY id) as question_ids,
          array_agg(DISTINCT LEFT(REGEXP_REPLACE(question, '<[^>]*>', '', 'g'), 100) ORDER BY id LIMIT 1) as sample_question
        FROM questions
        WHERE test_name IS NOT NULL AND answer IS NOT NULL
        GROUP BY test_name, answer
        HAVING COUNT(*) = 2
      )
      SELECT question_count as duplicate_count, test_name, answer, question_ids,
        sample_question[1] as clean_question
      FROM test_answer_groups
      ORDER BY test_name, answer
      LIMIT ${batchSize}
    `);

    return result.rows.map((row: any) => ({
      questionIds: Array.isArray(row.question_ids) ? row.question_ids : [],
      testName: String(row.test_name || ''),
      answer: String(row.answer || ''),
      cleanQuestion: String(row.clean_question || ''),
      duplicateCount: parseInt(String(row.duplicate_count))
    }));
  }

  async cleanupExactDuplicates(duplicateGroups: DuplicateGroup[]): Promise<number> {
    let totalCleaned = 0;
    
    for (const group of duplicateGroups) {
      if (group.questionIds.length <= 1) continue;
      
      // Keep the first question ID, remove the rest
      const toKeep = group.questionIds[0];
      const toRemove = group.questionIds.slice(1);
      
      console.log(`🧹 Cleaning ${group.duplicateCount} duplicates: keeping ${toKeep}, removing ${toRemove.join(', ')}`);
      
      const result = await db.execute(sql`
        DELETE FROM questions 
        WHERE question_id = ANY(${toRemove}) 
          AND test_name = ${group.testName}
          AND answer = ${group.answer}
      `);
      
      totalCleaned += toRemove.length;
    }
    
    return totalCleaned;
  }

  async cleanupMultilingualPairs(pairs: DuplicateGroup[]): Promise<number> {
    let totalCleaned = 0;
    
    for (const pair of pairs) {
      if (pair.questionIds.length !== 2) continue;
      
      // Remove the second question in each multilingual pair
      const toRemove = pair.questionIds[1];
      
      console.log(`🌐 Merging multilingual pair: keeping ${pair.questionIds[0]}, removing ${toRemove}`);
      
      const result = await db.execute(sql`
        DELETE FROM questions 
        WHERE question_id = ${toRemove} 
          AND test_name = ${pair.testName}
          AND answer = ${pair.answer}
      `);
      
      totalCleaned += 1;
    }
    
    return totalCleaned;
  }

  async performComprehensiveCleanup(): Promise<{
    exactDuplicatesRemoved: number;
    multilingualPairsRemoved: number;
    totalQuestionsRemoved: number;
    finalCount: number;
  }> {
    console.log('🚀 Starting comprehensive duplicate cleanup...');
    
    // Phase 1: Clean exact duplicates
    const exactDuplicates = await this.findExactDuplicates(50);
    const exactDuplicatesRemoved = await this.cleanupExactDuplicates(exactDuplicates);
    
    // Phase 2: Clean multilingual pairs  
    const multilingualPairs = await this.findMultilingualPairs(100);
    const multilingualPairsRemoved = await this.cleanupMultilingualPairs(multilingualPairs);
    
    // Get final count
    const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM questions`);
    const finalCount = parseInt(countResult.rows[0].count);
    
    const totalRemoved = exactDuplicatesRemoved + multilingualPairsRemoved;
    
    console.log(`✅ Cleanup complete! Removed ${totalRemoved} duplicate questions`);
    console.log(`📊 Final database count: ${finalCount} questions`);
    
    return {
      exactDuplicatesRemoved,
      multilingualPairsRemoved, 
      totalQuestionsRemoved: totalRemoved,
      finalCount
    };
  }
}

export const duplicateCleanupService = new DuplicateCleanupService();