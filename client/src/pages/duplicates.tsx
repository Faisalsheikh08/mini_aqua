import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Zap, Eye, Merge, Trash2, CheckCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DuplicateGroup {
  configId: string;
  questions: Array<{
    id: number;
    questionId: string;
    question: string;
    testName: string;
    similarity: number;
    language: string;
  }>;
  duplicateType: 'exact' | 'similar' | 'multilingual';
  totalCount: number;
  avgSimilarity: number;
}

interface DuplicateStats {
  totalGroups: number;
  totalQuestions: number;
  exactDuplicates: number;
  similarQuestions: number;
  multilingualPairs: number;
  potentialSavings: number;
}

export default function DuplicatesPage() {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("similarity");
  const { toast } = useToast();

  // Fetch duplicate analysis data
  const { data: duplicateData, isLoading, refetch } = useQuery({
    queryKey: ['/api/duplicates/analysis'],
    enabled: false // Only fetch when explicitly triggered
  });

  // Fetch duplicate statistics
  const { data: stats } = useQuery<DuplicateStats>({
    queryKey: ['/api/duplicates/stats']
  });

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Start analysis
      await apiRequest('POST', '/api/duplicates/start-analysis', {});
      
      // Poll for progress using browser fetch
      const pollProgress = async () => {
        try {
          const response = await fetch('/api/duplicates/progress');
          const data = await response.json();
          
          setAnalysisProgress(data.progress);
          
          if (data.progress < 100) {
            setTimeout(pollProgress, 1000);
          } else {
            setIsAnalyzing(false);
            refetch();
            toast({
              title: "Analysis Complete",
              description: `Found ${data.totalGroups} duplicate groups`
            });
          }
        } catch (error) {
          console.error("Error polling progress:", error);
          setIsAnalyzing(false);
          toast({
            title: "Progress Check Failed",
            description: "Could not check analysis progress",
            variant: "destructive"
          });
        }
      };
      
      pollProgress();
    } catch (error) {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Failed to start duplicate analysis",
        variant: "destructive"
      });
    }
  };

  const handleMergeSelected = async () => {
    if (selectedGroups.size === 0) return;
    
    try {
      await apiRequest('POST', '/api/duplicates/merge', {
        groupIds: Array.from(selectedGroups)
      });
      
      toast({
        title: "Merge Complete",
        description: `Merged ${selectedGroups.size} duplicate groups`
      });
      
      setSelectedGroups(new Set());
      refetch();
    } catch (error) {
      toast({
        title: "Merge Failed",
        description: "Failed to merge selected duplicates",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGroups.size === 0) return;
    
    try {
      await apiRequest('POST', '/api/duplicates/delete', {
        groupIds: Array.from(selectedGroups)
      });
      
      toast({
        title: "Deletion Complete",
        description: `Deleted duplicates from ${selectedGroups.size} groups`
      });
      
      setSelectedGroups(new Set());
      refetch();
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete selected duplicates",
        variant: "destructive"
      });
    }
  };

  const toggleGroupSelection = (configId: string) => {
    const newSelection = new Set(selectedGroups);
    if (newSelection.has(configId)) {
      newSelection.delete(configId);
    } else {
      newSelection.add(configId);
    }
    setSelectedGroups(newSelection);
  };

  const filteredGroups = (duplicateData?.groups || []).filter((group: DuplicateGroup) => {
    const matchesType = filterType === "all" || group.duplicateType === filterType;
    const matchesSearch = !searchQuery || 
      group.questions.some((q: any) => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.testName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesType && matchesSearch;
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    switch (sortBy) {
      case "similarity":
        return b.avgSimilarity - a.avgSimilarity;
      case "count":
        return b.totalCount - a.totalCount;
      case "configId":
        return a.configId.localeCompare(b.configId);
      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Duplicate Detection</h1>
          <p className="text-gray-600 mt-2">
            Identify and manage duplicate questions to improve database quality
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Start Analysis"}
          </Button>
          
          {selectedGroups.size > 0 && (
            <>
              <Button
                onClick={handleMergeSelected}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Merge className="h-4 w-4" />
                Merge Selected ({selectedGroups.size})
              </Button>
              
              <Button
                onClick={handleDeleteSelected}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Analyzing for duplicates...</span>
                  <span className="text-sm text-gray-500">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Total Groups</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalGroups}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Affected Questions</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalQuestions}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Exact Duplicates</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.exactDuplicates}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Similar Questions</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.similarQuestions}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Merge className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Multilingual Pairs</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.multilingualPairs}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search questions or test names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="exact">Exact Duplicates</SelectItem>
            <SelectItem value="similar">Similar Questions</SelectItem>
            <SelectItem value="multilingual">Multilingual Pairs</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="similarity">Similarity Score</SelectItem>
            <SelectItem value="count">Question Count</SelectItem>
            <SelectItem value="configId">Config ID</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Duplicate Groups */}
      {duplicateData && (
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-4">
              {sortedGroups.map((group) => (
                <Card key={group.configId} className={`transition-all ${
                  selectedGroups.has(group.configId) ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.configId)}
                          onChange={() => toggleGroupSelection(group.configId)}
                          className="rounded"
                        />
                        <div>
                          <CardTitle className="text-lg">
                            Config ID: {group.configId}
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={
                              group.duplicateType === 'exact' ? 'destructive' :
                              group.duplicateType === 'similar' ? 'default' : 'secondary'
                            }>
                              {group.duplicateType}
                            </Badge>
                            <Badge variant="outline">
                              {group.totalCount} questions
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(group.avgSimilarity)}% similarity
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid gap-3">
                      {group.questions.map((question: any) => (
                        <div
                          key={question.id}
                          className="p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {question.questionId}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {question.question.replace(/<[^>]*>/g, '').substring(0, 150)}...
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {question.testName}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {question.language}
                                </Badge>
                              </div>
                            </div>
                            <Badge className="text-xs">
                              {Math.round(question.similarity)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedGroups.size === sortedGroups.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroups(new Set(sortedGroups.map(g => g.configId)));
                              } else {
                                setSelectedGroups(new Set());
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="p-4">Config ID</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Questions</th>
                        <th className="p-4">Avg Similarity</th>
                        <th className="p-4">Sample Question</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroups.map((group) => (
                        <tr key={group.configId} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedGroups.has(group.configId)}
                              onChange={() => toggleGroupSelection(group.configId)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-4 font-mono text-sm">{group.configId}</td>
                          <td className="p-4">
                            <Badge variant={
                              group.duplicateType === 'exact' ? 'destructive' :
                              group.duplicateType === 'similar' ? 'default' : 'secondary'
                            }>
                              {group.duplicateType}
                            </Badge>
                          </td>
                          <td className="p-4">{group.totalCount}</td>
                          <td className="p-4">{Math.round(group.avgSimilarity)}%</td>
                          <td className="p-4 max-w-md">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {group.questions[0]?.question?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!isLoading && !duplicateData && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Analysis Available
            </h3>
            <p className="text-gray-600 mb-4">
              Start a duplicate analysis to identify potential duplicate questions in your database.
            </p>
            <Button onClick={startAnalysis} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}