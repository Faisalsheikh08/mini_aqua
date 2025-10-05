import { readFileSync } from 'fs';
import { storage } from './storage';
import type { InsertQuestion } from '@shared/schema';

async function loadCsvData() {
  try {
    console.log('Loading CSV data...');
    
    // Read the CSV file
    const csvContent = readFileSync('../attached_assets/784-questions-data-2025-06-17_1752958316126.csv', 'utf-8');
    
    console.log('Parsing CSV content...');
    
    // Parse CSV content
    const questions = parseCsvContent(csvContent);
    
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

function parseCsvContent(csvContent: string): InsertQuestion[] {
  const lines = csvContent.split('\n');
  const questions: InsertQuestion[] = [];
  let skippedRows = 0;
  let processedRows = 0;
  
  console.log(`Total lines in CSV: ${lines.length}`);
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      skippedRows++;
      continue;
    }
    
    try {
      const columns = parseCsvLine(line);
      if (columns.length < 11) {
        skippedRows++;
        console.warn(`Row ${i + 1}: Only ${columns.length} columns found, skipping`);
        continue;
      }
      
      const question: InsertQuestion = {
        questionId: columns[0] || '',
        configId: columns[1] || '',
        testName: columns[2] || null,
        question: columns[3] || '',
        option1: columns[4] || null,
        option2: columns[5] || null,
        option3: columns[6] || null,
        option4: columns[7] || null,
        option5: columns[8] || null,
        answer: columns[9] ? parseInt(columns[9]) : null,
        description: columns[10] || null,
      };
      
      questions.push(question);
      processedRows++;
      
      // Progress logging
      if (processedRows % 10000 === 0) {
        console.log(`Processed ${processedRows} questions...`);
      }
    } catch (error) {
      skippedRows++;
      console.warn(`Skipping invalid row ${i + 1}:`, error);
    }
  }
  
  console.log(`Processed: ${processedRows} questions, Skipped: ${skippedRows} rows`);
  return questions;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current);
  return result;
}

// Run the script
loadCsvData();