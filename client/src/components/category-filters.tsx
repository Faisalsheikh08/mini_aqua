import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Filter, X, BookOpen, Target, Tags } from "lucide-react";
import type { SearchRequest } from "@shared/schema";

interface CategoryFiltersProps {
  filters: Partial<SearchRequest>;
  onFiltersChange: (filters: Partial<SearchRequest>) => void;
  onClearFilters: () => void;
}

export function CategoryFilters({ filters, onFiltersChange, onClearFilters }: CategoryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<Partial<SearchRequest>>({});

  // Fetch category options
  const { data: categoryOptions } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Initialize pending filters
  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  const updatePendingFilter = (key: keyof SearchRequest, value: any) => {
    const finalValue = value === "__any__" ? undefined : value;
    setPendingFilters(prev => ({ ...prev, [key]: finalValue }));
  };

  const applyFilters = () => {
    onFiltersChange(pendingFilters);
    setIsOpen(false);
  };

  const clearAllFilters = () => {
    setPendingFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== "" && (Array.isArray(value) ? value.length > 0 : true)
  );

  const hasPendingChanges = JSON.stringify(pendingFilters) !== JSON.stringify(filters);

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Category Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.values(filters).filter(v => v !== undefined && v !== "").length} active
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Subject
                </Label>
                <Select 
                  value={pendingFilters.subject || "__any__"} 
                  onValueChange={(value) => updatePendingFilter("subject", value === "__any__" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any subject</SelectItem>
                    {categoryOptions?.subjects?.filter(subject => subject && subject.trim() !== "").map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Topic
                </Label>
                <Select 
                  value={pendingFilters.topic || "__any__"} 
                  onValueChange={(value) => updatePendingFilter("topic", value === "__any__" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any topic</SelectItem>
                    {categoryOptions?.topics?.filter(topic => topic && topic.trim() !== "").map((topic) => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select 
                  value={pendingFilters.difficulty || "__any__"} 
                  onValueChange={(value) => updatePendingFilter("difficulty", value === "__any__" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any difficulty</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select 
                  value={pendingFilters.questionType || "__any__"} 
                  onValueChange={(value) => updatePendingFilter("questionType", value === "__any__" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any type</SelectItem>
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
                <Label>Category</Label>
                <Select 
                  value={pendingFilters.category || "__any__"} 
                  onValueChange={(value) => updatePendingFilter("category", value === "__any__" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any category</SelectItem>
                    {categoryOptions?.categories?.filter(category => category && category.trim() !== "").map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sub-Category</Label>
                <Select 
                  value={pendingFilters.subCategory || "__any__"} 
                  onValueChange={(value) => updatePendingFilter("subCategory", value === "__any__" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">Any sub-category</SelectItem>
                    {categoryOptions?.subCategories?.filter(subCategory => subCategory && subCategory.trim() !== "").map((subCategory) => (
                      <SelectItem key={subCategory} value={subCategory}>{subCategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Filters:</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.subject && (
                    <Badge variant="secondary" className="gap-1">
                      Subject: {filters.subject}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updatePendingFilter("subject", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.topic && (
                    <Badge variant="secondary" className="gap-1">
                      Topic: {filters.topic}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updatePendingFilter("topic", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.difficulty && (
                    <Badge variant="secondary" className="gap-1">
                      Difficulty: {filters.difficulty}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updatePendingFilter("difficulty", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.questionType && (
                    <Badge variant="secondary" className="gap-1">
                      Type: {filters.questionType}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updatePendingFilter("questionType", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.category && (
                    <Badge variant="secondary" className="gap-1">
                      Category: {filters.category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updatePendingFilter("category", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.subCategory && (
                    <Badge variant="secondary" className="gap-1">
                      Sub-Category: {filters.subCategory}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updatePendingFilter("subCategory", undefined)}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={applyFilters}
                disabled={!hasPendingChanges}
                className="flex-1"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}