import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, X, Plus, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Question, UpdateQuestion } from "@shared/schema";

interface QuestionEditModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionEditModal({ question, isOpen, onClose }: QuestionEditModalProps) {
  const [formData, setFormData] = useState<UpdateQuestion>({});
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when question changes
  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question,
        option1: question.option1 || "",
        option2: question.option2 || "",
        option3: question.option3 || "",
        option4: question.option4 || "",
        option5: question.option5 || "",
        answer: question.answer,
        description: question.description || "",
        subject: question.subject || "",
        topic: question.topic || "",
        difficulty: question.difficulty || "",
        questionType: question.questionType || "",
        tags: question.tags || [],
        category: question.category || "",
        subCategory: question.subCategory || "",
      });
    }
  }, [question]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateQuestion) => {
      const response = await apiRequest("PATCH", `/api/questions/${question.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/search"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const updateFormData = (key: keyof UpdateQuestion, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      updateFormData("tags", [...(formData.tags || []), newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData("tags", formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target === e.currentTarget) {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Edit Question
          </DialogTitle>
          <DialogDescription>
            Update question content, options, categorization, and tags.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={formData.question || ""}
              onChange={(e) => updateFormData("question", e.target.value)}
              rows={4}
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="option1">Option 1</Label>
              <Input
                id="option1"
                value={formData.option1 || ""}
                onChange={(e) => updateFormData("option1", e.target.value)}
                placeholder="First option"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option2">Option 2</Label>
              <Input
                id="option2"
                value={formData.option2 || ""}
                onChange={(e) => updateFormData("option2", e.target.value)}
                placeholder="Second option"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option3">Option 3</Label>
              <Input
                id="option3"
                value={formData.option3 || ""}
                onChange={(e) => updateFormData("option3", e.target.value)}
                placeholder="Third option"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option4">Option 4</Label>
              <Input
                id="option4"
                value={formData.option4 || ""}
                onChange={(e) => updateFormData("option4", e.target.value)}
                placeholder="Fourth option"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option5">Option 5 (Optional)</Label>
              <Input
                id="option5"
                value={formData.option5 || ""}
                onChange={(e) => updateFormData("option5", e.target.value)}
                placeholder="Fifth option"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Correct Answer</Label>
              <Select value={formData.answer?.toString() || ""} onValueChange={(value) => updateFormData("answer", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Option 1</SelectItem>
                  <SelectItem value="2">Option 2</SelectItem>
                  <SelectItem value="3">Option 3</SelectItem>
                  <SelectItem value="4">Option 4</SelectItem>
                  {formData.option5 && <SelectItem value="5">Option 5</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Solution/Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Solution/Explanation</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={4}
              placeholder="Provide detailed explanation or solution..."
              className="min-h-[100px]"
            />
          </div>

          {/* Categorization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject || ""}
                onChange={(e) => updateFormData("subject", e.target.value)}
                placeholder="e.g., Mathematics, Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={formData.topic || ""}
                onChange={(e) => updateFormData("topic", e.target.value)}
                placeholder="e.g., Algebra, Physics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty || "none"} onValueChange={(value) => updateFormData("difficulty", value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select value={formData.questionType || "none"} onValueChange={(value) => updateFormData("questionType", value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="MCQ">Multiple Choice</SelectItem>
                  <SelectItem value="True/False">True/False</SelectItem>
                  <SelectItem value="Fill in the blank">Fill in the blank</SelectItem>
                  <SelectItem value="Short Answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Management */}
          <div className="space-y-3">
            <Label>Tags</Label>
            
            {/* Current Tags */}
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add new tag..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}