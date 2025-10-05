import { readFileSync } from 'fs';
import { db } from './db';
import { questions } from '../shared/schema.js';

async function migrateData() {
  try {
    console.log('Starting data migration...');
    
    // Read the CSV file
    const csvContent = readFileSync('../attached_assets/784-questions-data-2025-06-17_1752958316126.csv', 'utf-8');
    
    console.log('Parsing CSV content...');
    const parsedQuestions = parseRobustCsv(csvContent);
    
    console.log(`Parsed ${parsedQuestions.length} questions`);
    
    // Clear existing data
    console.log('Clearing existing questions...');
    await db.delete(questions);
    
    // Insert in small batches
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < parsedQuestions.length; i += batchSize) {
      const batch = parsedQuestions.slice(i, i + batchSize);
      
      const validBatch = batch.map(q => ({
        questionId: q.questionId,
        configId: q.configId,
        testName: q.testName || null,
        question: q.question,
        option1: q.option1 || null,
        option2: q.option2 || null,
        option3: q.option3 || null,
        option4: q.option4 || null,
        option5: q.option5 || null,
        answer: q.answer || null,
        description: q.description || null,
      }));
      
      await db.insert(questions).values(validBatch);
      totalInserted += validBatch.length;
      
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(parsedQuestions.length / batchSize)} (${totalInserted}/${parsedQuestions.length})`);
    }
    
    console.log(`✅ Migration complete! Inserted ${totalInserted} questions`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

interface ParsedQuestion {
  questionId: string;
  configId: string;
  testName: string | null;
  question: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  option5: string | null;
  answer: number | null;
  description: string | null;
}

function parseRobustCsv(csvContent: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let recordCount = 0;
  let i = 0;
  
  while (i < csvContent.length) {
    const char = csvContent[i];
    const nextChar = i + 1 < csvContent.length ? csvContent[i + 1] : '';
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }
    
    if (!inQuotes && char === ',') {
      currentRecord.push(currentField.trim());
      currentField = '';
      i++;
      continue;
    }
    
    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (currentField || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        
        if (currentRecord.length >= 11 && recordCount > 0) {
          try {
            const question: ParsedQuestion = {
              questionId: currentRecord[0] || '',
              configId: currentRecord[1] || '',
              testName: currentRecord[2] || null,
              question: currentRecord[3] || '',
              option1: currentRecord[4] || null,
              option2: currentRecord[5] || null,
              option3: currentRecord[6] || null,
              option4: currentRecord[7] || null,
              option5: currentRecord[8] || null,
              answer: currentRecord[9] ? parseInt(currentRecord[9]) : null,
              description: currentRecord[10] || null,
            };
            
            questions.push(question);
          } catch (error) {
            console.warn(`Error processing record ${recordCount + 1}:`, error);
          }
        }
        
        recordCount++;
      }
      
      currentRecord = [];
      currentField = '';
      
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    
    currentField += char;
    i++;
  }
  
  if (currentRecord.length > 0 || currentField) {
    currentRecord.push(currentField.trim());
    if (currentRecord.length >= 11 && recordCount > 0) {
      try {
        const question: ParsedQuestion = {
          questionId: currentRecord[0] || '',
          configId: currentRecord[1] || '',
          testName: currentRecord[2] || null,
          question: currentRecord[3] || '',
          option1: currentRecord[4] || null,
          option2: currentRecord[5] || null,
          option3: currentRecord[6] || null,
          option4: currentRecord[7] || null,
          option5: currentRecord[8] || null,
          answer: currentRecord[9] ? parseInt(currentRecord[9]) : null,
          description: currentRecord[10] || null,
        };
        
        questions.push(question);
      } catch (error) {
        console.warn(`Error processing final record:`, error);
      }
    }
  }
  
  return questions;
}

// Run migration
migrateData().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});