import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Question } from '@shared/schema';

interface ExportContextType {
  selectedQuestions: Question[];
  addQuestion: (question: Question) => void;
  removeQuestion: (questionId: number) => void;
  clearSelection: () => void;
  isQuestionSelected: (questionId: number) => boolean;
}

const ExportContext = createContext<ExportContextType | undefined>(undefined);

export function ExportProvider({ children }: { children: ReactNode }) {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  const addQuestion = (question: Question) => {
    setSelectedQuestions((prev) => {
      // Avoid duplicates
      if (prev.find(q => q.id === question.id)) {
        return prev;
      }
      console.log('Adding question to export:', question);
      console.log('Current selected questions:', prev);
      return [...prev, question];
    });
  };

  const removeQuestion = (questionId: number) => {
    setSelectedQuestions((prev) => prev.filter(q => q.id !== questionId));
  };

  const clearSelection = () => {
    setSelectedQuestions([]);
  };

  const isQuestionSelected = (questionId: number) => {
    return selectedQuestions.some(q => q.id === questionId);
  };

  return (
    <ExportContext.Provider value={{
      selectedQuestions,
      addQuestion,
      removeQuestion,
      clearSelection,
      isQuestionSelected
    }}>
      {children}
    </ExportContext.Provider>
  );
}

export function useExport() {
  const context = useContext(ExportContext);
  if (context === undefined) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
}