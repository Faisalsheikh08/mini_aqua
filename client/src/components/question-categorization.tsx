import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tags, BookOpen, Target, FileText, Edit3, Plus, Save, X } from "lucide-react";
import type { Question, CategoryUpdate } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface QuestionCategorizationProps {
  question: Question;
  selectedQuestions?: number[];
  onBulkUpdate?: () => void;
}

export function QuestionCategorization({ question, selectedQuestions, onBulkUpdate }: QuestionCategorizationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: question.subject || "",
    topic: question.topic || "",
    difficulty: question.difficulty || "",
    questionType: question.questionType || "",
    category: question.category || "",
    subCategory: question.subCategory || "",
    tags: question.tags || [],
  });
  const [newTag, setNewTag] = useState("");
  const [isBulkMode, setIsBulkMode] = useState(!!selectedQuestions?.length);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch category options
  const { data: categoryOptions } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Single question update mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: Omit<CategoryUpdate, 'questionId'>) => {
      return apiRequest("PATCH", `/api/questions/${question.id}/category`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category updated successfully" });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update category", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { questionIds: number[]; updates: any }) => {
      return apiRequest("PATCH", "/api/questions/categories/bulk", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ 
        title: "Categories updated successfully", 
        description: `Updated ${data.count} questions` 
      });
      setIsOpen(false);
      onBulkUpdate?.();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update categories", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = () => {
    const updateData = {
      subject: formData.subject || undefined,
      topic: formData.topic || undefined,
      difficulty: formData.difficulty && formData.difficulty !== "" ? formData.difficulty : undefined,
      questionType: formData.questionType || undefined,
      category: formData.category || undefined,
      subCategory: formData.subCategory || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    if (isBulkMode && selectedQuestions?.length) {
      bulkUpdateMutation.mutate({
        questionIds: selectedQuestions,
        updates: updateData,
      });
    } else {
      updateCategoryMutation.mutate(updateData);
    }
  };

  const currentTags = question.tags || [];
  const hasCategorization = question.subject || question.topic || question.difficulty || 
                          question.questionType || question.category || question.subCategory || 
                          currentTags.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tags className="h-4 w-4" />
          {isBulkMode ? `Categorize ${selectedQuestions?.length} Questions` : "Categorize"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            {isBulkMode ? `Categorize ${selectedQuestions?.length} Questions` : "Question Categorization"}
          </DialogTitle>
          <DialogDescription>
            {isBulkMode 
              ? `Assign categories and tags to ${selectedQuestions?.length} selected questions at once.`
              : "Organize this question by assigning subject, difficulty, topic, and custom tags."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isBulkMode && hasCategorization && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {question.subject && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Subject:</span>
                    <Badge variant="secondary">{question.subject}</Badge>
                  </div>
                )}
                {question.topic && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Topic:</span>
                    <Badge variant="secondary">{question.topic}</Badge>
                  </div>
                )}
                {question.difficulty && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <Badge variant={question.difficulty === "Easy" ? "default" : 
                                  question.difficulty === "Medium" ? "secondary" : "destructive"}>
                      {question.difficulty}
                    </Badge>
                  </div>
                )}
                {currentTags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tags className="h-4 w-4 text-purple-500 mt-0.5" />
                    <span className="text-sm font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentTags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value === "__none__" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categoryOptions?.subjects?.filter(subject => subject && subject.trim() !== "").map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select value={formData.topic} onValueChange={(value) => setFormData(prev => ({ ...prev, topic: value === "__none__" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categoryOptions?.topics?.filter(topic => topic && topic.trim() !== "").map((topic) => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value === "__none__" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select value={formData.questionType} onValueChange={(value) => setFormData(prev => ({ ...prev, questionType: value === "__none__" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="MCQ">Multiple Choice</SelectItem>
                  <SelectItem value="True/False">True/False</SelectItem>
                  <SelectItem value="Fill in the blank">Fill in the blank</SelectItem>
                  <SelectItem value="Short Answer">Short Answer</SelectItem>
                  {categoryOptions?.questionTypes?.filter(type => type && type.trim() !== "").map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value === "__none__" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categoryOptions?.categories?.filter(category => category && category.trim() !== "").map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subCategory">Sub-Category</Label>
              <Select value={formData.subCategory} onValueChange={(value) => setFormData(prev => ({ ...prev, subCategory: value === "__none__" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categoryOptions?.subCategories?.filter(subCategory => subCategory && subCategory.trim() !== "").map((subCategory) => (
                    <SelectItem key={subCategory} value={subCategory}>{subCategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {isBulkMode && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="bulkMode" 
                  checked={isBulkMode}
                  onCheckedChange={setIsBulkMode}
                />
                <Label htmlFor="bulkMode" className="text-sm">
                  Apply to {selectedQuestions?.length} selected questions
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateCategoryMutation.isPending || bulkUpdateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateCategoryMutation.isPending || bulkUpdateMutation.isPending ? "Saving..." : "Save Categories"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}