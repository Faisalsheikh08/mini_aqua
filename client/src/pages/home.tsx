import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SearchBar } from "@/components/search-bar";
import { QuestionCard } from "@/components/question-card";
import { Pagination } from "@/components/pagination";
import { AdvancedFilters } from "@/components/advanced-filters";
import { CategoryFilters } from "@/components/category-filters";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Upload, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SearchResponse, SearchRequest } from "@shared/schema";

export default function Home() {
  const [searchRequest, setSearchRequest] = useState<SearchRequest>({
    query: "",
    searchIn: "all",
    searchMode: "simple", // Default to simple search
    page: 1,
    pageSize: 20,
    hasOptions: true, // Default to show questions with multiple choice options
    hasDescription: true, // Default to show questions with solutions/explanations
  });
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  
  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    stage: "",
    totalQuestions: 0,
    processedQuestions: 0
  });

  // Get total question count
  const { data: countData } = useQuery<{ count: string }>({
    queryKey: ["/api/questions/count"],
  });

  // Search questions
  const { data: searchData, isLoading, error } = useQuery({
    queryKey: ["/api/questions/search", searchRequest],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/questions/search", searchRequest);
      return response.json() as Promise<SearchResponse>;
    },
    enabled: Boolean(hasSearched || searchRequest.query.length > 0 || 
             searchRequest.configId || searchRequest.testName || 
             searchRequest.hasOptions !== undefined || 
             searchRequest.hasDescription !== undefined || 
             searchRequest.answerCount ||
             searchRequest.subject || searchRequest.topic || searchRequest.difficulty ||
             searchRequest.questionType || searchRequest.category || searchRequest.subCategory),
  });

  const handleSearch = (newSearchRequest: Partial<SearchRequest>) => {
    setSearchRequest(prev => ({ 
      ...prev, 
      ...newSearchRequest, 
      page: 1 // Always reset to page 1 for new searches
    }));
    setHasSearched(true);
  };

  const handleFiltersChange = (filters: Partial<SearchRequest>) => {
    setSearchRequest(prev => ({ 
      ...prev, 
      ...filters, 
      page: 1 // Reset to first page when filters change
    }));
    setHasSearched(true);
  };

  const handleClearFilters = () => {
    setSearchRequest(prev => ({
      query: prev.query,
      searchIn: prev.searchIn,
      searchMode: prev.searchMode,
      page: 1,
      pageSize: prev.pageSize,
      hasOptions: true, // Keep default filters
      hasDescription: true, // Keep default filters
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchRequest(prev => ({ ...prev, page }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    // Reset and start progress tracking
    setUploadProgress({
      isUploading: true,
      progress: 0,
      stage: "Uploading file...",
      totalQuestions: 0,
      processedQuestions: 0
    });

    try {
      // Start with initial progress
      setUploadProgress(prev => ({ ...prev, progress: 5, stage: "Uploading CSV file..." }));
      
      // Create a promise that polls for progress updates
      const progressPollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch("/api/upload-progress");
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.isActive) {
              setUploadProgress(prev => ({
                ...prev,
                progress: progressData.progress,
                stage: progressData.stage,
                totalQuestions: progressData.totalQuestions || prev.totalQuestions,
                processedQuestions: progressData.processedQuestions || prev.processedQuestions
              }));
            }
          }
        } catch (progressError) {
          // Ignore progress polling errors
        }
      }, 500);
      
      // Start upload
      const response = await fetch("/api/questions/upload", {
        method: "POST",
        body: formData,
      });

      // Clear progress polling
      clearInterval(progressPollInterval);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse the response
      const result = await response.json();
      
      // Final progress update
      setUploadProgress(prev => ({ 
        ...prev, 
        progress: 100, 
        stage: "Upload complete!",
        totalQuestions: result.totalProcessed || 0,
        processedQuestions: result.uploaded || 0
      }));
      
      toast({
        title: "Enhanced Upload Complete",
        description: `${result.uploaded || result.count} questions uploaded, ${result.merged || 0} multilingual sets merged`,
      });
      
      // Wait a moment then hide progress and reload
      setTimeout(() => {
        setUploadProgress({
          isUploading: false,
          progress: 0,
          stage: "",
          totalQuestions: 0,
          processedQuestions: 0
        });
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload CSV file",
        variant: "destructive",
      });
      
      setUploadProgress({
        isUploading: false,
        progress: 0,
        stage: "",
        totalQuestions: 0,
        processedQuestions: 0
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const totalQuestions = parseInt(countData?.count || "0", 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Database className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Question Database</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {totalQuestions.toLocaleString()} questions loaded
              </span>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadProgress.isUploading}
                />
                <Button 
                  className="bg-primary hover:bg-blue-700"
                  disabled={uploadProgress.isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadProgress.isUploading ? "Uploading..." : "Upload CSV"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upload Progress Bar */}
        {uploadProgress.isUploading && (
          <div className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    {uploadProgress.stage}
                  </span>
                  <span className="text-sm font-bold text-blue-800">
                    {Math.round(uploadProgress.progress)}%
                  </span>
                </div>
                <Progress 
                  value={uploadProgress.progress} 
                  className="w-full h-3 mb-2"
                />
                {uploadProgress.totalQuestions > 0 && (
                  <div className="text-xs text-blue-600">
                    Processed: {uploadProgress.processedQuestions.toLocaleString()} / {uploadProgress.totalQuestions.toLocaleString()} questions
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <SearchBar 
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={searchRequest}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Category Filters */}
        <CategoryFilters
          filters={searchRequest}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Results or Welcome */}
        {hasSearched || searchRequest.query ? (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-semibold text-gray-900">Search Results</h2>
                {searchData && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {searchData.total.toLocaleString()} questions found
                  </span>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    <span className="text-gray-600">Searching questions...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {error && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
                  <p className="text-gray-600">Failed to search questions. Please try again.</p>
                </CardContent>
              </Card>
            )}

            {/* Questions List */}
            {searchData && searchData.questions.length > 0 && (
              <div className="space-y-6">
                {searchData.questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
                
                {/* Pagination */}
                <Pagination
                  currentPage={searchData.page}
                  totalPages={searchData.totalPages}
                  totalResults={searchData.total}
                  pageSize={searchData.pageSize}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {/* Empty State */}
            {searchData && searchData.questions.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search criteria or browse all questions</p>
                  <Button onClick={() => {
                    setSearchRequest(prev => ({ ...prev, query: "" }));
                    setHasSearched(false);
                  }}>
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Welcome State */
          <Card>
            <CardContent className="p-12 text-center">
              <Database className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to Question Database
              </h3>
              <p className="text-gray-600 mb-6">
                Search through {totalQuestions.toLocaleString()} exam questions with keyword search and copy functionality
              </p>
              <p className="text-sm text-gray-500">
                Enter keywords in the search box above to find questions, options, or solutions
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
