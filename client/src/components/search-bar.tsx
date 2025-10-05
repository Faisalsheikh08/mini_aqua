import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Info } from "lucide-react";
import type { SearchRequest } from "@shared/schema";

interface SearchBarProps {
  onSearch: (searchRequest: Partial<SearchRequest>) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [searchAreas, setSearchAreas] = useState({
    questions: true,
    options: true,
    solutions: true
  });
  const [searchMode, setSearchMode] = useState<"simple" | "boolean">("simple");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert checkbox selections to searchIn format with intelligent prioritization
    let searchIn: "all" | "question" | "options" | "description" = "all";
    
    const selectedAreas = Object.entries(searchAreas)
      .filter(([_, selected]) => selected)
      .map(([area, _]) => area);
    
    if (selectedAreas.length === 0) {
      // If nothing selected, search all
      searchIn = "all";
    } else if (selectedAreas.length === 3) {
      // If all selected, search all
      searchIn = "all";
    } else if (selectedAreas.length === 1) {
      // If only one selected, use specific search for maximum prioritization
      if (selectedAreas[0] === "questions") searchIn = "question";
      else if (selectedAreas[0] === "options") searchIn = "options";
      else if (selectedAreas[0] === "solutions") searchIn = "description";
    } else if (selectedAreas.length === 2) {
      // If two areas selected, prioritize based on most important combination
      if (selectedAreas.includes("questions") && selectedAreas.includes("options")) {
        // Questions + Options: prioritize questions but include options
        searchIn = "question";
      } else if (selectedAreas.includes("questions") && selectedAreas.includes("solutions")) {
        // Questions + Solutions: prioritize questions
        searchIn = "question";
      } else if (selectedAreas.includes("options") && selectedAreas.includes("solutions")) {
        // Options + Solutions: prioritize options
        searchIn = "options";
      }
    }
    
    onSearch({ 
      query: query.trim(), 
      searchIn, 
      searchMode
    });
  };

  const handleSelectAll = () => {
    setSearchAreas({
      questions: true,
      options: true,
      solutions: true
    });
  };

  const handleDeselectAll = () => {
    setSearchAreas({
      questions: false,
      options: false,
      solutions: false
    });
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Input Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="searchInput" className="block text-sm font-medium text-gray-700 mb-2">
                Search Questions
              </Label>
              <div className="relative">
                <Input
                  id="searchInput"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                  placeholder={searchMode === "boolean" ? 
                    "e.g., Ashok OR Ashoka, Maths AND Science" : 
                    Object.values(searchAreas).every(v => v) || Object.values(searchAreas).filter(v => v).length === 0 ? 
                      "Search in all content..." :
                      `Search in ${Object.entries(searchAreas).filter(([_, selected]) => selected).map(([area, _]) => 
                        area === "questions" ? "questions" : 
                        area === "options" ? "options" : "solutions"
                      ).join(", ")}...`
                  }
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>
            
            <div className="lg:w-32 flex items-end">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-blue-700"
                disabled={isLoading}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          {/* Search Options Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-64">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">
                  Search In
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleDeselectAll}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="search-questions"
                    checked={searchAreas.questions}
                    onCheckedChange={(checked) =>
                      setSearchAreas(prev => ({ ...prev, questions: !!checked }))
                    }
                  />
                  <Label htmlFor="search-questions" className="text-sm font-normal cursor-pointer flex-1">
                    Questions
                  </Label>
                  {searchAreas.questions && (
                    <Badge variant="secondary" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="search-options"
                    checked={searchAreas.options}
                    onCheckedChange={(checked) =>
                      setSearchAreas(prev => ({ ...prev, options: !!checked }))
                    }
                  />
                  <Label htmlFor="search-options" className="text-sm font-normal cursor-pointer flex-1">
                    Answer Options
                  </Label>
                  {searchAreas.options && (
                    <Badge variant="secondary" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="search-solutions"
                    checked={searchAreas.solutions}
                    onCheckedChange={(checked) =>
                      setSearchAreas(prev => ({ ...prev, solutions: !!checked }))
                    }
                  />
                  <Label htmlFor="search-solutions" className="text-sm font-normal cursor-pointer flex-1">
                    Solutions/Explanations
                  </Label>
                  {searchAreas.solutions && (
                    <Badge variant="secondary" className="text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
              </div>
              {/* Search Area Status */}
              <div className="mt-2 text-xs text-gray-600">
                {Object.values(searchAreas).every(v => v) ? (
                  <span className="text-green-600 font-medium">📋 Searching in all content with balanced ranking</span>
                ) : Object.values(searchAreas).filter(v => v).length === 0 ? (
                  <span className="text-orange-600 font-medium">⚠️ No search areas selected - will search all</span>
                ) : (
                  <span className="text-blue-600 font-medium">
                    🎯 Smart ranking: {Object.entries(searchAreas)
                      .filter(([_, selected]) => selected)
                      .map(([area, _]) => 
                        area === "questions" ? "Questions" : 
                        area === "options" ? "Options" : "Solutions"
                      ).join(" + ")} prioritized first
                  </span>
                )}
              </div>
            </div>

            <div className="lg:w-48">
              <Label htmlFor="searchMode" className="block text-sm font-medium text-gray-700 mb-2">
                Search Mode
              </Label>
              <Select value={searchMode} onValueChange={(value: any) => setSearchMode(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select search mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple Search</SelectItem>
                  <SelectItem value="boolean">Boolean Search</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              {searchMode === "boolean" && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Info className="h-4 w-4" />
                    <span>Boolean Search Help:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      AND: Find questions with all terms
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      OR: Find questions with any term
                    </Badge>
                  </div>
                </div>
              )}
              {searchMode === "simple" && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Info className="h-4 w-4" />
                    <span>Results ranked by relevance</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Questions with exact phrase matches appear first
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
