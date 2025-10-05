import { readFileSync } from 'fs';
import { storage } from './storage';
import type { InsertQuestion } from '@shared/schema';

async function loadCsvDataRobust() {
  try {
    console.log('Loading CSV data with robust parser...');
    
    // Read the CSV file
    const csvContent = readFileSync('../attached_assets/784-questions-data-2025-06-17_1752958316126.csv', 'utf-8');
    
    console.log('Parsing CSV content...');
    
    // Parse CSV content with robust parser
    const questions = parseRobustCsv(csvContent);
    
    console.log(`Parsed ${questions.length} questions from CSV`);
    
    // Clear existing questions and load new ones
    console.log('Clearing existing questions...');
    await storage.clearQuestions();
    
    console.log('Loading questions into database...');
    const createdQuestions = await storage.bulkCreateQuestions(questions);
    
    console.log(`Successfully loaded ${createdQuestions.length} questions into database`);
    
  } catch (error) {
    console.error('Error loading CSV data:', error);
  }
}

function parseRobustCsv(csvContent: string): InsertQuestion[] {
  const questions: InsertQuestion[] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let fieldIndex = 0;
  let recordCount = 0;
  let i = 0;
  
  console.log(`CSV content length: ${csvContent.length} characters`);
  
  while (i < csvContent.length) {
    const char = csvContent[i];
    const nextChar = i + 1 < csvContent.length ? csvContent[i + 1] : '';
    
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
    
    if (!inQuotes && char === ',') {
      // Field separator
      currentRecord.push(currentField.trim());
      currentField = '';
      fieldIndex++;
      i++;
      continue;
    }
    
    if (!inQuotes && (char === '\n' || char === '\r')) {
      // End of record
      if (currentField || currentRecord.length > 0) {
        currentRecord.push(currentField.trim());
        
        // Process complete record
        if (currentRecord.length >= 11 && recordCount > 0) { // Skip header
          try {
            const question: InsertQuestion = {
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
            
            if (questions.length % 10000 === 0) {
              console.log(`Processed ${questions.length} questions...`);
            }
          } catch (error) {
            console.warn(`Error processing record ${recordCount + 1}:`, error);
          }
        }
        
        recordCount++;
      }
      
      // Reset for next record
      currentRecord = [];
      currentField = '';
      fieldIndex = 0;
      
      // Skip \r\n combinations
      if (char === '\r' && nextChar === '\n') {
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
    currentRecord.push(currentField.trim());
    if (currentRecord.length >= 11 && recordCount > 0) {
      try {
        const question: InsertQuestion = {
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
  
  console.log(`Total records processed: ${recordCount}, Questions created: ${questions.length}`);
  return questions;
}

// Run the script
loadCsvDataRobust();