import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Merge, Languages, Trash2, Check, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DOMPurify from "dompurify";
import type { Question } from "@shared/schema";

interface QuestionMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  configId: string;
}

interface LanguageVariant {
  questionId: string;
  language: string;
  questionText: string;
}

export function QuestionMergeModal({ isOpen, onClose, configId }: QuestionMergeModalProps) {
  const [primaryQuestionId, setPrimaryQuestionId] = useState<string>("");
  const [languageVariants, setLanguageVariants] = useState<LanguageVariant[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch questions with the same config ID
  const { data: duplicateQuestions, isLoading } = useQuery({
    queryKey: ["/api/questions/duplicates", configId],
    queryFn: () => apiRequest(`/api/questions/duplicates/${configId}`),
    enabled: isOpen && !!configId,
  });

  // Initialize language variants when questions are loaded
  useEffect(() => {
    if (duplicateQuestions?.questions && duplicateQuestions.questions.length > 0) {
      const questions = duplicateQuestions.questions as Question[];
      
      // Set first question as primary by default
      setPrimaryQuestionId(questions[0].questionId);
      
      // Auto-detect language variants
      const variants: LanguageVariant[] = questions.slice(1).map((question, index) => ({
        questionId: question.questionId,
        language: detectLanguage(question.question),
        questionText: extractPlainText(question.question)
      }));
      
      setLanguageVariants(variants);
    }
  }, [duplicateQuestions]);

  // Detect language based on content
  const detectLanguage = (text: string): string => {
    const plainText = extractPlainText(text);
    
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
  };

  // Extract plain text from HTML content
  const extractPlainText = (htmlContent: string): string => {
    const cleanHtml = DOMPurify.sanitize(htmlContent, { ALLOWED_TAGS: [] });
    return cleanHtml.substring(0, 100);
  };

  // Update language variant
  const updateLanguageVariant = (index: number, field: keyof LanguageVariant, value: string) => {
    const updated = [...languageVariants];
    updated[index] = { ...updated[index], [field]: value };
    setLanguageVariants(updated);
  };

  // Remove language variant
  const removeLanguageVariant = (index: number) => {
    const updated = languageVariants.filter((_, i) => i !== index);
    setLanguageVariants(updated);
  };

  // Add new language variant
  const addLanguageVariant = () => {
    const availableQuestions = duplicateQuestions?.questions.filter(
      (q: Question) => q.questionId !== primaryQuestionId && 
      !languageVariants.some(v => v.questionId === q.questionId)
    );
    
    if (availableQuestions && availableQuestions.length > 0) {
      const nextQuestion = availableQuestions[0];
      setLanguageVariants([...languageVariants, {
        questionId: nextQuestion.questionId,
        language: detectLanguage(nextQuestion.question),
        questionText: extractPlainText(nextQuestion.question)
      }]);
    }
  };

  // Merge mutation
  const mergeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/questions/merge", {
        method: "POST",
        body: JSON.stringify({
          configId,
          primaryQuestionId,
          languageVariants
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Questions merged successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/duplicates"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to merge questions",
        variant: "destructive",
      });
    },
  });

  const handleMerge = () => {
    if (!primaryQuestionId) {
      toast({
        title: "Error",
        description: "Please select a primary question",
        variant: "destructive",
      });
      return;
    }

    if (languageVariants.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one language variant",
        variant: "destructive",
      });
      return;
    }

    mergeMutation.mutate();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Merge className="h-5 w-5" />
              <span>Loading Questions...</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const questions = duplicateQuestions?.questions as Question[] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Merge className="h-5 w-5" />
            <span>Merge Multilingual Questions</span>
            <Badge variant="secondary">{questions.length} variants found</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Config ID Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Config ID: <span className="font-mono text-blue-600">{configId}</span>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Warning */}
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Bilingual Question Merge:</p>
                    <p>This will merge multiple language versions into one bilingual question with combined solutions. The original language variants will be deleted. This action cannot be undone.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Primary Question Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Check className="h-4 w-4" />
                  <span>Select Primary Question</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={primaryQuestionId} onValueChange={setPrimaryQuestionId}>
                  {questions.map((question) => (
                    <div key={question.questionId} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={question.questionId} id={question.questionId} />
                        <Label htmlFor={question.questionId} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{question.questionId}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{detectLanguage(question.question)}</Badge>
                              {question.description && (
                                <Badge variant="secondary" className="text-xs">
                                  Has Solution
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="ml-6 space-y-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <strong>Question:</strong> {extractPlainText(question.question)}...
                        </div>
                        {question.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                            <strong>Solution:</strong> {extractPlainText(question.description)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Language Variants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Languages className="h-4 w-4" />
                    <span>Language Variants</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={addLanguageVariant}
                    disabled={languageVariants.length >= questions.length - 1}>
                    Add Variant
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {languageVariants.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No language variants added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {languageVariants.map((variant, index) => (
                      <Card key={index} className="border-gray-200 dark:border-gray-700">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Variant {index + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLanguageVariant(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label>Question ID</Label>
                                <Input
                                  value={variant.questionId}
                                  onChange={(e) => updateLanguageVariant(index, "questionId", e.target.value)}
                                  className="font-mono text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Language</Label>
                                <Input
                                  value={variant.language}
                                  onChange={(e) => updateLanguageVariant(index, "language", e.target.value)}
                                  placeholder="e.g., Hindi, Tamil, etc."
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <Label>Question Preview</Label>
                              <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                                {variant.questionText}...
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {questions.length} questions will be merged into 1
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={mergeMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={mergeMutation.isPending || !primaryQuestionId}>
              {mergeMutation.isPending ? "Merging..." : "Merge Questions"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}