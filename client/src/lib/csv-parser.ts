export interface CSVQuestion {
  id: string;
  config_id: string;
  test_name: string;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  option_5: string;
  answer: number;
  description: string;
}

export function parseCSV(csvContent: string): CSVQuestion[] {
  const lines = csvContent.split('\n');
  const questions: CSVQuestion[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const columns = parseCsvLine(line);
      if (columns.length < 11) continue; // Skip incomplete rows
      
      const question: CSVQuestion = {
        id: columns[0] || '',
        config_id: columns[1] || '',
        test_name: columns[2] || '',
        question: columns[3] || '',
        option_1: columns[4] || '',
        option_2: columns[5] || '',
        option_3: columns[6] || '',
        option_4: columns[7] || '',
        option_5: columns[8] || '',
        answer: parseInt(columns[9]) || 0,
        description: columns[10] || '',
      };
      
      questions.push(question);
    } catch (error) {
      console.warn(`Skipping invalid row ${i + 1}:`, error);
    }
  }
  
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
