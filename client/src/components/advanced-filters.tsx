import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronDown, Filter, X, TrendingUp, Check, Plus } from "lucide-react";
import type { SearchRequest } from "@shared/schema";
import { WordExportButton } from "./word-export-button";
import { BulkExportButton } from "./bulk-export-button";

interface FilterOptions {
  configIds: string[];
  testNames: string[];
  questionStats: {
    totalQuestions: number;
    questionsWithOptions: number;
    questionsWithDescription: number;
    optionCounts: Record<string, number>;
  };
}

interface AdvancedFiltersProps {
  filters: Partial<SearchRequest>;
  onFiltersChange: (filters: Partial<SearchRequest>) => void;
  onClearFilters: () => void;
}

interface PendingFilters extends Partial<SearchRequest> {
  testNames?: string[];
}

export function AdvancedFilters({ filters, onFiltersChange, onClearFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<PendingFilters>({});
  const [testNameSearch, setTestNameSearch] = useState("");
  const [isTestNameOpen, setIsTestNameOpen] = useState(false);

  // Fetch filter options for suggestions
  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["/api/questions/filters"],
  });

  // Initialize pending filters when component mounts
  useEffect(() => {
    const testNames = filters.testName ? 
      (filters.testName.includes(',') ? filters.testName.split(',').map(t => t.trim()) : [filters.testName]) 
      : [];
    
    // Only initialize if pendingFilters is empty to prevent overriding user changes
    if (Object.keys(pendingFilters).length === 0) {
      setPendingFilters({
        ...filters,
        testNames,
        // Always enable these filters as they're commonly needed
        hasOptions: true,
        hasDescription: true,
      });
    }
  }, [filters]);

  // Filter test names based on search with virtual scrolling support
  const filteredTestNames = useMemo(() => {
    if (!filterOptions?.testNames) return [];
    
    const searchLower = testNameSearch.toLowerCase();
    const filtered = filterOptions.testNames
      .filter((name: string) => name.toLowerCase().includes(searchLower))
      .sort((a: string, b: string) => a.localeCompare(b));
    
    // Show all results - no artificial limit
    return filtered;
  }, [filterOptions?.testNames, testNameSearch]);

  const updatePendingFilter = (key: keyof PendingFilters, value: any) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTestName = (testName: string) => {
    const currentTestNames = pendingFilters.testNames || [];
    const newTestNames = currentTestNames.includes(testName)
      ? currentTestNames.filter((name: string) => name !== testName)
      : [...currentTestNames, testName];
    
    updatePendingFilter("testNames", newTestNames);
  };

  const removeTestName = (testName: string) => {
    const currentTestNames = pendingFilters.testNames || [];
    updatePendingFilter("testNames", currentTestNames.filter(name => name !== testName));
  };

  const applyFilters = () => {
    const filtersToApply = { ...pendingFilters };
    
    // Convert testNames array to single testName for backend compatibility
    if (filtersToApply.testNames && filtersToApply.testNames.length > 0) {
      // Join multiple test names with comma for backend processing
      filtersToApply.testName = filtersToApply.testNames.join(",");
    } else {
      filtersToApply.testName = undefined;
    }
    
    delete filtersToApply.testNames;
    onFiltersChange(filtersToApply);
    // Don't close the filters panel - keep it open for easy adjustment
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      hasOptions: true,
      hasDescription: true,
      testNames: []
    };
    setPendingFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = filters.configId || filters.testName || 
                          filters.hasOptions === false || 
                          filters.hasDescription === false || 
                          filters.answerCount;

  const hasPendingChanges = JSON.stringify(pendingFilters) !== JSON.stringify({
    ...filters,
    testNames: filters.testName ? 
      (filters.testName.includes(',') ? filters.testName.split(',').map(t => t.trim()) : [filters.testName]) 
      : []
  });

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Advanced Filters</span>
                {hasActiveFilters && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Filter Statistics */}
            {filterOptions && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">Database Overview</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Questions:</span>
                    <span className="ml-1 font-medium">{filterOptions.questionStats.totalQuestions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">With Options:</span>
                    <span className="ml-1 font-medium">{filterOptions.questionStats.questionsWithOptions.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">With Solutions:</span>
                    <span className="ml-1 font-medium">{filterOptions.questionStats.questionsWithDescription.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Config IDs:</span>
                    <span className="ml-1 font-medium">{filterOptions.configIds.length}+</span>
                  </div>
                </div>
              </div>
            )}

            {/* Config ID and Test Name Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="configId">Config ID</Label>
                <Input
                  id="configId"
                  placeholder="Enter config ID to filter..."
                  value={pendingFilters.configId || ""}
                  onChange={(e) => updatePendingFilter("configId", e.target.value)}
                />
                {filterOptions && filterOptions.configIds.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Popular: {filterOptions.configIds.slice(0, 3).join(", ")}...
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="testName">Test Names</Label>
                <Popover open={isTestNameOpen} onOpenChange={setIsTestNameOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isTestNameOpen}
                      className="w-full justify-between"
                    >
                      {pendingFilters.testNames && pendingFilters.testNames.length > 0
                        ? `${pendingFilters.testNames.length} test(s) selected`
                        : "Select test names..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search test names..." 
                        value={testNameSearch}
                        onValueChange={setTestNameSearch}
                      />
                      <CommandEmpty>No test names found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {filteredTestNames.map((testName) => (
                          <CommandItem
                            key={testName}
                            onSelect={() => toggleTestName(testName)}
                            className="cursor-pointer"
                          >
                            <Checkbox 
                              checked={pendingFilters.testNames?.includes(testName) || false}
                              className="mr-2"
                            />
                            <span className="truncate">{testName}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {/* Selected test names display */}
                {pendingFilters.testNames && pendingFilters.testNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pendingFilters.testNames.map((testName) => (
                      <Badge key={testName} variant="secondary" className="text-xs">
                        {testName.length > 30 ? `${testName.substring(0, 30)}...` : testName}
                        <button
                          onClick={() => removeTestName(testName)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {filterOptions && filterOptions.testNames.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Available: {filterOptions.testNames.length} test names
                  </div>
                )}
              </div>
            </div>

            {/* Question Type Filters */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Question Type</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Answer Count Filter */}
                <div className="space-y-2">
                  <Label htmlFor="answerCount">Number of Options</Label>
                  <Select
                    value={pendingFilters.answerCount || "any"}
                    onValueChange={(value) => updatePendingFilter("answerCount", value === "any" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any number</SelectItem>
                      <SelectItem value="2">2 options</SelectItem>
                      <SelectItem value="3">3 options</SelectItem>
                      <SelectItem value="4">4 options</SelectItem>
                      <SelectItem value="5">5 options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Export Section */}
                <div className="space-y-2">
                  <Label className="text-sm">Export Options</Label>
                  
                  {/* Single Test Export */}
                  {pendingFilters.testNames && pendingFilters.testNames.length === 1 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Export to Word Document
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Export all questions from "{pendingFilters.testNames[0]}"
                          </p>
                        </div>
                        <WordExportButton 
                          testName={pendingFilters.testNames[0]} 
                          disabled={false}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Bulk Export */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Bulk Export Multiple Tests
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Select and export multiple tests as separate Word documents
                        </p>
                      </div>
                      <BulkExportButton 
                        selectedTests={pendingFilters.testNames || []}
                      />
                    </div>
                  </div>
                </div>

                {/* Note about always enabled filters */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Always Enabled</Label>
                  <div className="text-xs text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    Multiple Choice and Solution filters are always active for better search results
                  </div>
                </div>
              </div>
            </div>

            {/* Apply and Clear Filters Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <Badge variant="outline" className="text-xs">
                    Filters Active
                  </Badge>
                )}
                {hasPendingChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Changes Pending
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2"
                  disabled={!hasActiveFilters && !hasPendingChanges}
                >
                  <X className="h-4 w-4" />
                  <span>Clear All</span>
                </Button>
                
                <Button
                  size="sm"
                  onClick={applyFilters}
                  className="flex items-center space-x-2"
                  disabled={!hasPendingChanges}
                >
                  <Check className="h-4 w-4" />
                  <span>Apply Filters</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}