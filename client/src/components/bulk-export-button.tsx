// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Checkbox } from "@/components/ui/checkbox";
// // Progress component placeholder - you can replace with actual Progress component
// function Progress({ value, className }: { value: number; className?: string }) {
//   return (
//     <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
//       <div
//         className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
//         style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
//       />
//     </div>
//   );
// }
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Download, Search, FileText, Package, Database, AlertTriangle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/lib/queryClient";

// interface TestInfo {
//   testName: string;
//   questionCount: number;
// }

// interface BulkExportButtonProps {
//   selectedTests?: string[];
// }

// export function BulkExportButton({ selectedTests = [] }: BulkExportButtonProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedTestsToExport, setSelectedTestsToExport] = useState<string[]>(selectedTests);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isExporting, setIsExporting] = useState(false);
//   const [exportProgress, setExportProgress] = useState(0);
//   const [exportedFiles, setExportedFiles] = useState<string[]>([]);
//   const { toast } = useToast();

//   // Fetch all test names with question counts
//   const { data: testData, isLoading } = useQuery({
//     queryKey: ['/api/questions/test-stats'],
//     queryFn: async () => {
//       const response = await fetch('/api/questions/test-stats');
//       return response.json() as Promise<TestInfo[]>;
//     }
//   });

//   // Filter tests based on search query
//   const filteredTests = Array.isArray(testData) ? testData.filter(test =>
//     test.testName.toLowerCase().includes(searchQuery.toLowerCase())
//   ) : [];

//   const toggleTestSelection = (testName: string) => {
//     setSelectedTestsToExport(prev =>
//       prev.includes(testName)
//         ? prev.filter(t => t !== testName)
//         : [...prev, testName]
//     );
//   };

//   const selectAllTests = () => {
//     setSelectedTestsToExport(filteredTests.map(test => test.testName));
//   };

//   const selectAllAvailableTests = () => {
//     if (Array.isArray(testData)) {
//       setSelectedTestsToExport(testData.map(test => test.testName));
//     }
//   };

//   const selectChunk = (chunkNumber: number, chunkSize: number = 1000) => {
//     if (Array.isArray(testData)) {
//       const startIndex = (chunkNumber - 1) * chunkSize;
//       const endIndex = Math.min(startIndex + chunkSize, testData.length);
//       setSelectedTestsToExport(testData.slice(startIndex, endIndex).map(test => test.testName));
//     }
//   };

//   const getChunkInfo = (chunkNumber: number, chunkSize: number = 1000) => {
//     if (!Array.isArray(testData)) return { start: 0, end: 0, count: 0 };
//     const startIndex = (chunkNumber - 1) * chunkSize;
//     const endIndex = Math.min(startIndex + chunkSize, testData.length);
//     return {
//       start: startIndex + 1,
//       end: endIndex,
//       count: endIndex - startIndex
//     };
//   };

//   const totalChunks = Array.isArray(testData) ? Math.ceil(testData.length / 1000) : 0;

//   const clearAllTests = () => {
//     setSelectedTestsToExport([]);
//   };

//   const handleBulkExport = async () => {
//     if (selectedTestsToExport.length === 0) {
//       toast({
//         title: "No Tests Selected",
//         description: "Please select at least one test to export",
//         variant: "destructive"
//       });
//       return;
//     }

//     setIsExporting(true);
//     setExportProgress(0);
//     setExportedFiles([]);

//     try {
//       // Reset any previous stuck export
//       await apiRequest('POST', '/api/export/bulk/reset', {});

//       // Start bulk export
//       await apiRequest('POST', '/api/export/bulk', {
//         testNames: selectedTestsToExport
//       });

//       // Poll for progress
//       const pollProgress = async () => {
//         try {
//           const response = await fetch('/api/export/bulk/progress');
//           const data = await response.json();

//           setExportProgress(data.progress);
//           setExportedFiles(data.completedFiles || []);

//           if (data.progress < 100) {
//             setTimeout(pollProgress, 1000);
//           } else {
//             setIsExporting(false);
//             toast({
//               title: "Export Complete",
//               description: `Successfully exported ${selectedTestsToExport.length} test files`,
//             });

//             // Trigger download of zip file with timeout and error handling
//             try {
//               const controller = new AbortController();
//               const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

//               toast({
//                 title: "Starting Download",
//                 description: "Your ZIP file is being prepared for download...",
//               });

//               const downloadResponse = await fetch('/api/export/bulk/download', {
//                 signal: controller.signal
//               });

//               clearTimeout(timeoutId);

//               if (!downloadResponse.ok) {
//                 throw new Error(`Download failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
//               }

//               const blob = await downloadResponse.blob();
//               const url = window.URL.createObjectURL(blob);
//               const a = document.createElement('a');
//               a.href = url;
//               a.download = `bulk-export-${new Date().toISOString().split('T')[0]}.zip`;
//               document.body.appendChild(a);
//               a.click();
//               document.body.removeChild(a);
//               window.URL.revokeObjectURL(url);

//               toast({
//                 title: "Download Started",
//                 description: `ZIP file with ${selectedTestsToExport.length} documents is downloading...`,
//               });

//             } catch (downloadError: any) {
//               console.error("Download error:", downloadError);

//               let errorMessage = "Failed to download ZIP file";
//               if (downloadError.name === 'AbortError') {
//                 errorMessage = "Download timed out. Please try exporting fewer tests at once.";
//               } else if (downloadError.message.includes('NetworkError')) {
//                 errorMessage = "Network error during download. Please check your connection and try again.";
//               }

//               toast({
//                 title: "Download Failed",
//                 description: errorMessage,
//                 variant: "destructive"
//               });

//               // Provide alternative: direct link to download
//               toast({
//                 title: "Alternative Download",
//                 description: "Try refreshing the page and clicking 'Download Ready Export' if available.",
//               });
//             }
//           }
//         } catch (error) {
//           console.error("Error polling export progress:", error);
//           setIsExporting(false);
//         }
//       };

//       pollProgress();
//     } catch (error) {
//       setIsExporting(false);
//       toast({
//         title: "Export Failed",
//         description: "Failed to start bulk export",
//         variant: "destructive"
//       });
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={setIsOpen}>
//       <DialogTrigger asChild>
//         <Button variant="outline" className="flex items-center gap-2">
//           <Package className="h-4 w-4" />
//           Bulk Export
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="max-w-4xl max-h-[80vh]">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Download className="h-5 w-5" />
//             Bulk Export Tests to Word Documents
//           </DialogTitle>
//           <DialogDescription>
//             Select multiple tests to export as individual Word documents. All files will be packaged into a single ZIP file for download.
//           </DialogDescription>

//           {/* Smart Chunk Export Options */}
//           <div className="pt-4 border-t space-y-4">
//             <div className="text-sm text-gray-600 font-medium">
//               Memory-Safe Export Chunks (1,000 tests each to prevent crashes)
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               {Array.from({ length: Math.min(totalChunks, 6) }, (_, index) => {
//                 const chunkNumber = index + 1;
//                 const chunkInfo = getChunkInfo(chunkNumber);
//                 return (
//                   <Button
//                     key={chunkNumber}
//                     onClick={() => selectChunk(chunkNumber)}
//                     variant="default"
//                     size="sm"
//                     className="bg-blue-600 hover:bg-blue-700 text-left"
//                     disabled={isExporting}
//                   >
//                     <FileText className="w-4 h-4 mr-2" />
//                     <div className="flex flex-col items-start">
//                       <span className="text-xs">Chunk {chunkNumber}</span>
//                       <span className="text-xs opacity-90">
//                         Tests {chunkInfo.start}-{chunkInfo.end} ({chunkInfo.count} tests)
//                       </span>
//                     </div>
//                   </Button>
//                 );
//               })}
//             </div>

//             {totalChunks > 6 && (
//               <div className="space-y-2">
//                 <div className="text-xs text-gray-500">
//                   Additional chunks available ({totalChunks - 6} more)
//                 </div>
//                 <div className="grid grid-cols-3 gap-2">
//                   {Array.from({ length: Math.min(totalChunks - 6, 6) }, (_, index) => {
//                     const chunkNumber = index + 7;
//                     const chunkInfo = getChunkInfo(chunkNumber);
//                     return (
//                       <Button
//                         key={chunkNumber}
//                         onClick={() => selectChunk(chunkNumber)}
//                         variant="outline"
//                         size="sm"
//                         className="text-xs"
//                         disabled={isExporting}
//                       >
//                         Chunk {chunkNumber} ({chunkInfo.count})
//                       </Button>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             <div className="pt-2 border-t">
//               <Button
//                 onClick={selectAllAvailableTests}
//                 variant="outline"
//                 size="sm"
//                 className="w-full text-red-600 border-red-200 hover:bg-red-50"
//                 disabled={isExporting}
//               >
//                 <AlertTriangle className="w-4 h-4 mr-2" />
//                 Select All {Array.isArray(testData) ? testData.length : 0} Tests (⚠️ May Cause Memory Issues)
//               </Button>
//             </div>
//           </div>
//         </DialogHeader>

//         {isExporting ? (
//           <div className="space-y-4 py-6">
//             <div className="flex items-center justify-between">
//               <span className="text-sm font-medium">
//                 Exporting {selectedTestsToExport.length} tests...
//               </span>
//               <span className="text-sm text-gray-500">
//                 {exportProgress}%
//               </span>
//             </div>
//             <Progress value={exportProgress} className="h-2" />

//             {exportProgress === 85 && (
//               <div className="text-center py-4">
//                 <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
//                 <div className="space-y-2 mt-2">
//                   <p className="text-sm text-gray-700 font-medium">Creating ZIP file...</p>
//                   <p className="text-xs text-gray-500">
//                     Processing {exportedFiles.length} documents. This may take up to 1-2 minutes.
//                   </p>
//                 </div>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => {
//                     setIsExporting(false);
//                     setExportProgress(0);
//                     setExportedFiles([]);
//                   }}
//                   className="mt-3"
//                 >
//                   Cancel Export
//                 </Button>
//               </div>
//             )}

//             {exportedFiles.length > 0 && exportProgress < 85 && (
//               <div className="space-y-2">
//                 <p className="text-sm text-gray-600">Completed files:</p>
//                 <ScrollArea className="h-32 border rounded p-2">
//                   {exportedFiles.map((fileName, index) => (
//                     <div key={index} className="flex items-center gap-2 py-1">
//                       <FileText className="h-3 w-3 text-green-500" />
//                       <span className="text-xs">{fileName}</span>
//                     </div>
//                   ))}
//                 </ScrollArea>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {/* Search Controls */}
//             <div className="space-y-3">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <Input
//                   placeholder="Search tests..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>

//               {/* Selection Controls */}
//               <div className="flex flex-wrap gap-2">
//                 <Button onClick={selectAllTests} variant="outline" size="sm">
//                   Select All Visible ({filteredTests.length})
//                 </Button>
//                 <Button onClick={clearAllTests} variant="outline" size="sm">
//                   Clear All
//                 </Button>
//               </div>
//             </div>

//             {/* Selected Tests Summary */}
//             {selectedTestsToExport.length > 0 && (
//               <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//                   <span className="text-sm font-medium text-blue-900">
//                     {selectedTestsToExport.length} tests selected
//                   </span>
//                   <Badge variant="secondary" className="self-start sm:self-auto">
//                     {selectedTestsToExport.reduce((total, testName) => {
//                       const test = testData?.find(t => t.testName === testName);
//                       return total + (test?.questionCount || 0);
//                     }, 0)} questions total
//                   </Badge>
//                 </div>
//               </div>
//             )}

//             {/* Test List */}
//             <ScrollArea className="h-80 border rounded">
//               {isLoading ? (
//                 <div className="p-4 text-center text-gray-500">
//                   Loading tests...
//                 </div>
//               ) : (
//                 <div className="p-2">
//                   {filteredTests.map((test) => (
//                     <div
//                       key={test.testName}
//                       className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
//                     >
//                       <Checkbox
//                         checked={selectedTestsToExport.includes(test.testName)}
//                         onCheckedChange={() => toggleTestSelection(test.testName)}
//                       />
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-medium truncate" title={test.testName}>
//                           {decodeURIComponent(test.testName)}
//                         </p>
//                       </div>
//                       <Badge variant="outline" className="text-xs">
//                         {test.questionCount} questions
//                       </Badge>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </ScrollArea>

//             {/* Fixed Export Button - Always Visible */}
//             <div className="sticky bottom-0 bg-white border-t pt-4 mt-4">
//               <div className="flex flex-col gap-2">
//                 <Button
//                   onClick={handleBulkExport}
//                   disabled={isExporting || selectedTestsToExport.length === 0}
//                   className="w-full"
//                   size="lg"
//                 >
//                   <Download className="h-4 w-4 mr-2" />
//                   {selectedTestsToExport.length > 0
//                     ? `Export ${selectedTestsToExport.length} Selected Tests`
//                     : 'Select Tests to Export'
//                   }
//                 </Button>
//                 <p className="text-xs text-gray-500 text-center">
//                   Each test will be exported as a separate Word document
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  FileText,
  Package,
  Database,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Progress component
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface TestInfo {
  testName: string;
  questionCount: number;
}

interface BulkExportButtonProps {
  selectedTests?: string[];
}

export function BulkExportButton({
  selectedTests = [],
}: BulkExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTestsToExport, setSelectedTestsToExport] =
    useState<string[]>(selectedTests);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedFiles, setExportedFiles] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch all test names with question counts
  const { data: testData, isLoading } = useQuery({
    queryKey: ["/api/questions/test-stats"],
    queryFn: async () => {
      const response = await fetch("/api/questions/test-stats");
      return response.json() as Promise<TestInfo[]>;
    },
  });

  // Filter tests based on search query
  const filteredTests = Array.isArray(testData)
    ? testData.filter((test) =>
        test.testName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const toggleTestSelection = (testName: string) => {
    setSelectedTestsToExport((prev) =>
      prev.includes(testName)
        ? prev.filter((t) => t !== testName)
        : [...prev, testName]
    );
  };

  const selectAllTests = () => {
    setSelectedTestsToExport(filteredTests.map((test) => test.testName));
  };

  const selectAllAvailableTests = () => {
    if (Array.isArray(testData)) {
      setSelectedTestsToExport(testData.map((test) => test.testName));
    }
  };

  const selectChunk = (chunkNumber: number, chunkSize: number = 1000) => {
    if (Array.isArray(testData)) {
      const startIndex = (chunkNumber - 1) * chunkSize;
      const endIndex = Math.min(startIndex + chunkSize, testData.length);
      setSelectedTestsToExport(
        testData.slice(startIndex, endIndex).map((test) => test.testName)
      );
    }
  };

  const getChunkInfo = (chunkNumber: number, chunkSize: number = 1000) => {
    if (!Array.isArray(testData)) return { start: 0, end: 0, count: 0 };
    const startIndex = (chunkNumber - 1) * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, testData.length);
    return {
      start: startIndex + 1,
      end: endIndex,
      count: endIndex - startIndex,
    };
  };

  const totalChunks = Array.isArray(testData)
    ? Math.ceil(testData.length / 1000)
    : 0;

  const clearAllTests = () => {
    setSelectedTestsToExport([]);
  };

  const handleBulkExport = async () => {
    if (selectedTestsToExport.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select at least one test to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportedFiles([]);

    try {
      await apiRequest("POST", "/api/export/bulk/reset", {});
      await apiRequest("POST", "/api/export/bulk", {
        testNames: selectedTestsToExport,
      });

      const pollProgress = async () => {
        try {
          const response = await fetch("/api/export/bulk/progress");
          const data = await response.json();

          setExportProgress(data.progress);
          setExportedFiles(data.completedFiles || []);

          if (data.progress < 100) {
            setTimeout(pollProgress, 1000);
          } else {
            setIsExporting(false);
            toast({
              title: "Export Complete",
              description: `Successfully exported ${selectedTestsToExport.length} test files`,
            });

            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 600000);

              toast({
                title: "Starting Download",
                description: "Your ZIP file is being prepared for download...",
              });

              const downloadResponse = await fetch(
                "/api/export/bulk/download",
                {
                  signal: controller.signal,
                }
              );

              clearTimeout(timeoutId);

              if (!downloadResponse.ok) {
                throw new Error(
                  `Download failed: ${downloadResponse.status} ${downloadResponse.statusText}`
                );
              }

              const blob = await downloadResponse.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `bulk-export-${
                new Date().toISOString().split("T")[0]
              }.zip`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);

              toast({
                title: "Download Started",
                description: `ZIP file with ${selectedTestsToExport.length} documents is downloading...`,
              });
            } catch (downloadError: any) {
              console.error("Download error:", downloadError);

              let errorMessage = "Failed to download ZIP file";
              if (downloadError.name === "AbortError") {
                errorMessage =
                  "Download timed out. Please try exporting fewer tests at once.";
              } else if (downloadError.message.includes("NetworkError")) {
                errorMessage =
                  "Network error during download. Please check your connection and try again.";
              }

              toast({
                title: "Download Failed",
                description: errorMessage,
                variant: "destructive",
              });

              toast({
                title: "Alternative Download",
                description:
                  "Try refreshing the page and clicking 'Download Ready Export' if available.",
              });
            }
          }
        } catch (error) {
          console.error("Error polling export progress:", error);
          setIsExporting(false);
        }
      };

      pollProgress();
    } catch (error) {
      setIsExporting(false);
      toast({
        title: "Export Failed",
        description: "Failed to start bulk export",
        variant: "destructive",
      });
    }
  };

  const totalSelectedQuestions = selectedTestsToExport.reduce(
    (total, testName) => {
      const test = testData?.find((t) => t.testName === testName);
      return total + (test?.questionCount || 0);
    },
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Bulk Export</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Download className="h-5 w-5 flex-shrink-0" />
            <span>Bulk Export Tests</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Export multiple tests as Word documents, packaged in a ZIP file.
          </DialogDescription>
        </DialogHeader>

        {isExporting ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Exporting Tests</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Processing {selectedTestsToExport.length} test
                    {selectedTestsToExport.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-gray-600">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} />
              </div>

              {exportProgress === 85 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center space-y-4">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      Creating ZIP file...
                    </p>
                    <p className="text-sm text-gray-600">
                      Processing {exportedFiles.length} documents. This may take
                      1-2 minutes.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsExporting(false);
                      setExportProgress(0);
                      setExportedFiles([]);
                    }}
                  >
                    Cancel Export
                  </Button>
                </div>
              )}

              {exportedFiles.length > 0 && exportProgress < 85 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Completed Files</p>
                    <Badge variant="secondary">{exportedFiles.length}</Badge>
                  </div>
                  <ScrollArea className="h-48 border rounded-lg">
                    <div className="p-3 space-y-2">
                      {exportedFiles.map((fileName, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="truncate">{fileName}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
              {/* Quick Selection Chunks */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Memory-Safe Chunks
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    Recommended
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Select 1,000 tests at a time to prevent memory issues
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Array.from(
                    { length: Math.min(totalChunks, 6) },
                    (_, index) => {
                      const chunkNumber = index + 1;
                      const chunkInfo = getChunkInfo(chunkNumber);
                      return (
                        <Button
                          key={chunkNumber}
                          onClick={() => selectChunk(chunkNumber)}
                          variant="outline"
                          size="sm"
                          className="justify-start h-auto py-2"
                          disabled={isExporting}
                        >
                          <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                          <div className="flex flex-col items-start text-left">
                            <span className="text-xs font-medium">
                              Chunk {chunkNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              {chunkInfo.start}-{chunkInfo.end} (
                              {chunkInfo.count})
                            </span>
                          </div>
                        </Button>
                      );
                    }
                  )}
                </div>

                {totalChunks > 6 && (
                  <details className="group">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900 flex items-center gap-1">
                      <span>Show {totalChunks - 6} more chunks</span>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                      {Array.from(
                        { length: Math.min(totalChunks - 6, 12) },
                        (_, index) => {
                          const chunkNumber = index + 7;
                          const chunkInfo = getChunkInfo(chunkNumber);
                          return (
                            <Button
                              key={chunkNumber}
                              onClick={() => selectChunk(chunkNumber)}
                              variant="outline"
                              size="sm"
                              className="text-xs h-auto py-1.5"
                              disabled={isExporting}
                            >
                              <span className="truncate">
                                Chunk {chunkNumber} ({chunkInfo.count})
                              </span>
                            </Button>
                          );
                        }
                      )}
                    </div>
                  </details>
                )}

                <Button
                  onClick={selectAllAvailableTests}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  disabled={isExporting}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-xs sm:text-sm">
                    Select All {Array.isArray(testData) ? testData.length : 0}{" "}
                    Tests (May cause issues)
                  </span>
                </Button>
              </div>

              {/* Search and Filter */}
              <div className="space-y-3 pt-4 border-t">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={selectAllTests}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Select Visible ({filteredTests.length})
                  </Button>
                  <Button
                    onClick={clearAllTests}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>

                  {selectedTestsToExport.length > 0 && (
                    <div className="ml-auto">
                      <Badge variant="default" className="text-xs">
                        {selectedTestsToExport.length} selected
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Summary */}
              {selectedTestsToExport.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-900">
                        {selectedTestsToExport.length} test
                        {selectedTestsToExport.length !== 1 ? "s" : ""} selected
                      </p>
                      <p className="text-xs text-blue-700">
                        {totalSelectedQuestions.toLocaleString()} total
                        questions
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllTests}
                      className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 self-start sm:self-auto"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Test List */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Available Tests
                </h3>
                <ScrollArea className="h-64 sm:h-80 border rounded-lg">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center space-y-2">
                        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full mx-auto"></div>
                        <p className="text-sm">Loading tests...</p>
                      </div>
                    </div>
                  ) : filteredTests.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center space-y-2">
                        <Search className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-sm">No tests found</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredTests.map((test) => (
                        <label
                          key={test.testName}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={selectedTestsToExport.includes(
                              test.testName
                            )}
                            onCheckedChange={() =>
                              toggleTestSelection(test.testName)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              title={decodeURIComponent(test.testName)}
                            >
                              {decodeURIComponent(test.testName)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0"
                          >
                            {test.questionCount}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Fixed Footer with Export Button */}
            <div className="border-t bg-white px-4 sm:px-6 py-4">
              <div className="max-w-2xl mx-auto space-y-3">
                <Button
                  onClick={handleBulkExport}
                  disabled={isExporting || selectedTestsToExport.length === 0}
                  className="w-full h-11"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {selectedTestsToExport.length > 0
                    ? `Export ${selectedTestsToExport.length} Test${
                        selectedTestsToExport.length !== 1 ? "s" : ""
                      }`
                    : "Select Tests to Export"}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Each test exports as a separate Word document in a ZIP file
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
