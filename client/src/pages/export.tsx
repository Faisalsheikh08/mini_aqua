// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Download, Trash2, FileText, X } from "lucide-react";
// import { useExport } from "@/contexts/ExportContext";
// import { useToast } from "@/hooks/use-toast";
// import type { Question } from "@shared/schema";
// import DOMPurify from "dompurify";

// export default function ExportPage() {
//   const { selectedQuestions, removeQuestion, clearSelection } = useExport();
//   const { toast } = useToast();
//   const [isExporting, setIsExporting] = useState(false);
//   const [showExportDialog, setShowExportDialog] = useState(false);
//   const [documentHeading, setDocumentHeading] = useState("");
//   const [fileName, setFileName] = useState("");

//   const handleExportClick = () => {
//     if (selectedQuestions.length === 0) {
//       toast({
//         title: "No questions selected",
//         description: "Please add some questions to export first.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Set default values
//     const defaultDate = new Date().toLocaleDateString();
//     setDocumentHeading(`Selected Questions Export - ${defaultDate}`);
//     setFileName(`selected-questions-${new Date().toISOString().split("T")[0]}`);
//     setShowExportDialog(true);
//   };

//   const handleExportToWord = async () => {
//     if (!documentHeading.trim() || !fileName.trim()) {
//       toast({
//         title: "Missing information",
//         description: "Please provide both document heading and filename.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsExporting(true);
//     setShowExportDialog(false);

//     try {
//       const response = await fetch("/api/export/selected", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           questionIds: selectedQuestions.map((q) => q.id),
//           title: documentHeading.trim(),
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Export failed");
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.style.display = "none";
//       a.href = url;

//       // Clean filename and ensure .docx extension
//       let cleanFileName = fileName.trim().replace(/[^a-zA-Z0-9\s\-_]/g, "_");
//       if (!cleanFileName.toLowerCase().endsWith(".docx")) {
//         cleanFileName += ".docx";
//       }
//       a.download = cleanFileName;

//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);

//       toast({
//         title: "Export successful",
//         description: `${selectedQuestions.length} questions exported to Word document.`,
//       });
//     } catch (error) {
//       console.error("Export error:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export questions. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   const sanitizeHtml = (html: string) => {
//     return DOMPurify.sanitize(html, {
//       ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "b", "i"],
//       ALLOWED_ATTR: [],
//     });
//   };

//   const stripHtml = (html: string) => {
//     return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Questions</h1>
//         <p className="text-gray-600">
//           Manage and export your selected questions to Word documents.
//         </p>
//       </div>

//       <div className="mb-6 flex justify-between items-center">
//         <div className="flex items-center space-x-4">
//           <Badge variant="secondary" className="text-lg py-2 px-4">
//             {selectedQuestions.length} questions selected
//           </Badge>
//         </div>

//         <div className="flex space-x-2">
//           <Button
//             onClick={clearSelection}
//             variant="outline"
//             disabled={selectedQuestions.length === 0}
//           >
//             <Trash2 className="h-4 w-4 mr-2" />
//             Clear All
//           </Button>
//           <Button
//             onClick={handleExportClick}
//             disabled={selectedQuestions.length === 0 || isExporting}
//           >
//             <Download className="h-4 w-4 mr-2" />
//             {isExporting ? "Exporting..." : "Export to Word"}
//           </Button>
//         </div>
//       </div>

//       {/* Export Configuration Dialog */}
//       <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
//         <DialogContent className="sm:max-w-[500px]">
//           <DialogHeader>
//             <DialogTitle>Export Configuration</DialogTitle>
//             <DialogDescription>
//               Customize your document heading and filename before exporting.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="grid gap-4 py-4">
//             <div className="grid gap-2">
//               <Label htmlFor="heading">Document Heading</Label>
//               <Input
//                 id="heading"
//                 value={documentHeading}
//                 onChange={(e) => setDocumentHeading(e.target.value)}
//                 placeholder="Enter document heading"
//                 className="col-span-3"
//               />
//               <p className="text-sm text-gray-500">
//                 This will appear as the title in your Word document.
//               </p>
//             </div>
//             <div className="grid gap-2">
//               <Label htmlFor="filename">File Name</Label>
//               <Input
//                 id="filename"
//                 value={fileName}
//                 onChange={(e) => setFileName(e.target.value)}
//                 placeholder="Enter filename (without .docx)"
//                 className="col-span-3"
//               />
//               <p className="text-sm text-gray-500">
//                 The file will be saved as "{fileName || 'filename'}.docx"
//               </p>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setShowExportDialog(false)}
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleExportToWord} disabled={isExporting}>
//               <Download className="h-4 w-4 mr-2" />
//               Export
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {selectedQuestions.length === 0 ? (
//         <Card>
//           <CardContent className="text-center py-12">
//             <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               No questions selected
//             </h3>
//             <p className="text-gray-600 mb-4">
//               Go to the search page and click "Add to Export" on questions you
//               want to export.
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {selectedQuestions.map((question) => {
//             const options = ["option1", "option2", "option3", "option4", "option5"];
//             const correctOptionKey =
//               question.answer && options[Number(question.answer) - 1];
//             const correctOptionText =
//               correctOptionKey && question[correctOptionKey as keyof typeof question];

//             return (
//               <Card key={question.id} className="relative">
//                 <CardHeader className="pb-3">
//                   <div className="flex justify-between items-start">
//                     <div className="flex-1">
//                       <div className="flex items-center space-x-2 mb-2">
//                         <Badge variant="outline">#{question.id}</Badge>
//                         {question.testName && (
//                           <Badge variant="secondary">{question.testName}</Badge>
//                         )}
//                         {question.configId && (
//                           <Badge variant="outline">Config: {question.configId}</Badge>
//                         )}
//                       </div>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => removeQuestion(question.id)}
//                       className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <div
//                     className="text-gray-900 mb-3 leading-relaxed"
//                     dangerouslySetInnerHTML={{
//                       __html: sanitizeHtml(question.question || ""),
//                     }}
//                   />

//                   {question.description && (
//                     <div className="bg-blue-50 border-l-4 border-blue-200 p-3 mb-3">
//                       <div
//                         className="text-sm text-blue-800"
//                         dangerouslySetInnerHTML={{
//                           __html: sanitizeHtml(question.description),
//                         }}
//                       />
//                     </div>
//                   )}

//                   <div className="space-y-2 mb-3">
//                     {options.map(
//                       (key, index) =>
//                         question[key as keyof typeof question] && (
//                           <div key={key} className="text-sm text-gray-700">
//                             <span className="font-medium">
//                               {String.fromCharCode(65 + index)}:
//                             </span>{" "}
//                             {stripHtml(
//                               question[key as keyof typeof question] as string
//                             )}
//                           </div>
//                         )
//                     )}
//                   </div>

//                   {question.answer && (
//                     <div className="text-green-700 font-medium">
//                       Correct Answer: Option {question.answer}{" "}
//                       {correctOptionText
//                         ? `(${stripHtml(correctOptionText as string)})`
//                         : ""}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Download, Trash2, FileText, X } from "lucide-react";
// import { useExport } from "@/contexts/ExportContext";
// import { useToast } from "@/hooks/use-toast";
// import type { Question } from "@shared/schema";
// import DOMPurify from "dompurify";

// export default function ExportPage() {
//   const { selectedQuestions, removeQuestion, clearSelection } = useExport();
//   const { toast } = useToast();
//   const [isExporting, setIsExporting] = useState(false);
//   const [showExportDialog, setShowExportDialog] = useState(false);
//   const [documentHeading, setDocumentHeading] = useState("");
//   const [fileName, setFileName] = useState("");

//   // Function to strip HTML tags and keep plain text with line breaks
//   const stripHtmlTags = (html: string): string => {
//     if (!html) return "";

//     // Replace <br> and </p> with newlines to preserve formatting
//     let text = html.replace(/<br\s*\/?>/gi, "\n");
//     text = text.replace(/<\/p>/gi, "\n\n");
//     text = text.replace(/<p>/gi, "");

//     // Remove all other HTML tags
//     text = text.replace(/<[^>]*>/g, "");

//     // Decode HTML entities
//     const textarea = document.createElement("textarea");
//     textarea.innerHTML = text;
//     text = textarea.value;

//     // Clean up excessive whitespace while preserving intentional line breaks
//     text = text.replace(/[ \t]+/g, " "); // Multiple spaces to single space
//     text = text.replace(/\n\s*\n\s*\n/g, "\n\n"); // Max 2 consecutive newlines
//     text = text.trim();

//     return text;
//   };

//   // Clean question data before sending to backend
//   const cleanQuestionForExport = (question: any) => {
//     const cleaned: any = {
//       id: question.id,
//       testName: question.testName,
//       configId: question.configId,
//       answer: question.answer,
//     };

//     // Clean all text fields by removing HTML tags
//     const fieldsToClean = [
//       "question",
//       "description",
//       "option1",
//       "option2",
//       "option3",
//       "option4",
//       "option5",
//       "questionText",
//       "questionDescription",
//       "optionA",
//       "optionB",
//       "optionC",
//       "optionD",
//     ];

//     fieldsToClean.forEach((field) => {
//       if (question[field]) {
//         cleaned[field] = stripHtmlTags(question[field]);
//       }
//     });

//     return cleaned;
//   };

//   const handleExportClick = () => {
//     if (selectedQuestions.length === 0) {
//       toast({
//         title: "No questions selected",
//         description: "Please add some questions to export first.",
//         variant: "destructive",
//       });
//       return;
//     }

//     // Set default values
//     const defaultDate = new Date().toLocaleDateString();
//     setDocumentHeading(`Selected Questions Export - ${defaultDate}`);
//     setFileName(`selected-questions-${new Date().toISOString().split("T")[0]}`);
//     setShowExportDialog(true);
//   };

//   const handleExportToWord = async () => {
//     if (!documentHeading.trim() || !fileName.trim()) {
//       toast({
//         title: "Missing information",
//         description: "Please provide both document heading and filename.",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsExporting(true);
//     setShowExportDialog(false);

//     try {
//       // Clean all questions before sending
//       const cleanedQuestions = selectedQuestions.map((q) =>
//         cleanQuestionForExport(q)
//       );

//       const response = await fetch("/api/export/selected", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           questionIds: selectedQuestions.map((q) => q.id),
//           questions: cleanedQuestions, // Send cleaned questions
//           title: documentHeading.trim(),
//         }),
//       });

//       if (!response.ok) {
//         throw new Error("Export failed");
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.style.display = "none";
//       a.href = url;

//       // Clean filename and ensure .docx extension
//       let cleanFileName = fileName.trim().replace(/[^a-zA-Z0-9\s\-_]/g, "_");
//       if (!cleanFileName.toLowerCase().endsWith(".docx")) {
//         cleanFileName += ".docx";
//       }
//       a.download = cleanFileName;

//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);

//       toast({
//         title: "Export successful",
//         description: `${selectedQuestions.length} questions exported to Word document.`,
//       });
//     } catch (error) {
//       console.error("Export error:", error);
//       toast({
//         title: "Export failed",
//         description: "Failed to export questions. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   const sanitizeHtml = (html: string) => {
//     return DOMPurify.sanitize(html, {
//       ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "b", "i"],
//       ALLOWED_ATTR: [],
//     });
//   };

//   const stripHtml = (html: string) => {
//     return html
//       .replace(/<[^>]*>/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();
//   };

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">
//           Export Questions
//         </h1>
//         <p className="text-gray-600">
//           Manage and export your selected questions to Word documents.
//         </p>
//       </div>

//       <div className="mb-6 flex justify-between items-center">
//         <div className="flex items-center space-x-4">
//           <Badge variant="secondary" className="text-lg py-2 px-4">
//             {selectedQuestions.length} questions selected
//           </Badge>
//         </div>

//         <div className="flex space-x-2">
//           <Button
//             onClick={clearSelection}
//             variant="outline"
//             disabled={selectedQuestions.length === 0}
//           >
//             <Trash2 className="h-4 w-4 mr-2" />
//             Clear All
//           </Button>
//           <Button
//             onClick={handleExportClick}
//             disabled={selectedQuestions.length === 0 || isExporting}
//           >
//             <Download className="h-4 w-4 mr-2" />
//             {isExporting ? "Exporting..." : "Export to Word"}
//           </Button>
//         </div>
//       </div>

//       {/* Export Configuration Dialog */}
//       <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
//         <DialogContent className="sm:max-w-[500px]">
//           <DialogHeader>
//             <DialogTitle>Export Configuration</DialogTitle>
//             <DialogDescription>
//               Customize your document heading and filename before exporting.
//             </DialogDescription>
//           </DialogHeader>

//           <div className="grid gap-4 py-4">
//             <div className="grid gap-2">
//               <Label htmlFor="filename">File Name</Label>
//               <Input
//                 id="filename"
//                 value={fileName}
//                 onChange={(e) => setFileName(e.target.value)}
//                 placeholder="Enter filename (without .docx)"
//                 className="col-span-3"
//               />
//               <p className="text-sm text-gray-500">
//                 The file will be saved as "{fileName || "filename"}.docx"
//               </p>
//             </div>

//             <div className="grid gap-2">
//               <Label htmlFor="heading">Document Heading</Label>
//               <Input
//                 id="heading"
//                 value={documentHeading}
//                 onChange={(e) => setDocumentHeading(e.target.value)}
//                 placeholder="Enter document heading"
//                 className="col-span-3"
//               />
//               <p className="text-sm text-gray-500">
//                 This will appear as the title in your Word document.
//               </p>
//             </div>
//           </div>

//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setShowExportDialog(false)}
//             >
//               Cancel
//             </Button>
//             <Button onClick={handleExportToWord} disabled={isExporting}>
//               <Download className="h-4 w-4 mr-2" />
//               Export
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {selectedQuestions.length === 0 ? (
//         <Card>
//           <CardContent className="text-center py-12">
//             <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               No questions selected
//             </h3>
//             <p className="text-gray-600 mb-4">
//               Go to the search page and click "Add to Export" on questions you
//               want to export.
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {selectedQuestions.map((question) => {
//             const options = [
//               "option1",
//               "option2",
//               "option3",
//               "option4",
//               "option5",
//             ];
//             const correctOptionKey =
//               question.answer && options[Number(question.answer) - 1];
//             const correctOptionText =
//               correctOptionKey &&
//               question[correctOptionKey as keyof typeof question];

//             return (
//               <Card key={question.id} className="relative">
//                 <CardHeader className="pb-3">
//                   <div className="flex justify-between items-start">
//                     <div className="flex-1">
//                       <div className="flex items-center space-x-2 mb-2">
//                         <Badge variant="outline">#{question.id}</Badge>
//                         {question.testName && (
//                           <Badge variant="secondary">{question.testName}</Badge>
//                         )}
//                         {question.configId && (
//                           <Badge variant="outline">
//                             Config: {question.configId}
//                           </Badge>
//                         )}
//                       </div>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => removeQuestion(question.id)}
//                       className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                     >
//                       <X className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <div
//                     className="text-gray-900 mb-3 leading-relaxed"
//                     dangerouslySetInnerHTML={{
//                       __html: sanitizeHtml(question.question || ""),
//                     }}
//                   />

//                   {question.description && (
//                     <div className="bg-blue-50 border-l-4 border-blue-200 p-3 mb-3">
//                       <div
//                         className="text-sm text-blue-800"
//                         dangerouslySetInnerHTML={{
//                           __html: sanitizeHtml(question.description),
//                         }}
//                       />
//                     </div>
//                   )}

//                   <div className="space-y-2 mb-3">
//                     {options.map(
//                       (key, index) =>
//                         question[key as keyof typeof question] && (
//                           <div key={key} className="text-sm text-gray-700">
//                             <span className="font-medium">
//                               {String.fromCharCode(65 + index)}:
//                             </span>{" "}
//                             {stripHtml(
//                               question[key as keyof typeof question] as string
//                             )}
//                           </div>
//                         )
//                     )}
//                   </div>

//                   {question.answer && (
//                     <div className="text-green-700 font-medium">
//                       Correct Answer: Option {question.answer}{" "}
//                       {correctOptionText
//                         ? `(${stripHtml(correctOptionText as string)})`
//                         : ""}
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Trash2, FileText, X } from "lucide-react";
import { useExport } from "@/contexts/ExportContext";
import { useToast } from "@/hooks/use-toast";
import type { Question } from "@shared/schema";
import DOMPurify from "dompurify";

export default function ExportPage() {
  const { selectedQuestions, removeQuestion, clearSelection } = useExport();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [documentHeading, setDocumentHeading] = useState("");
  const [fileName, setFileName] = useState("");
  const [useSameAsFileName, setUseSameAsFileName] = useState(true);

  // Function to strip HTML tags and keep plain text with line breaks
  const stripHtmlTags = (html: string): string => {
    if (!html) return "";

    // Replace <br> and </p> with newlines to preserve formatting
    let text = html.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<p>/gi, "");

    // Remove all other HTML tags
    text = text.replace(/<[^>]*>/g, "");

    // Decode HTML entities
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    text = textarea.value;

    // Clean up excessive whitespace while preserving intentional line breaks
    text = text.replace(/[ \t]+/g, " "); // Multiple spaces to single space
    text = text.replace(/\n\s*\n\s*\n/g, "\n\n"); // Max 2 consecutive newlines
    text = text.trim();

    return text;
  };

  // Clean question data before sending to backend
  const cleanQuestionForExport = (question: any) => {
    const cleaned: any = {
      id: question.id,
      testName: question.testName,
      configId: question.configId,
      answer: question.answer,
    };

    // Clean all text fields by removing HTML tags
    const fieldsToClean = [
      "question",
      "description",
      "option1",
      "option2",
      "option3",
      "option4",
      "option5",
      "questionText",
      "questionDescription",
      "optionA",
      "optionB",
      "optionC",
      "optionD",
    ];

    fieldsToClean.forEach((field) => {
      if (question[field]) {
        cleaned[field] = stripHtmlTags(question[field]);
      }
    });

    return cleaned;
  };

  const handleExportClick = () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please add some questions to export first.",
        variant: "destructive",
      });
      return;
    }

    // Set default values
    const defaultDate = new Date().toLocaleDateString();
    const defaultFileName = `selected-questions-${
      new Date().toISOString().split("T")[0]
    }`;
    setFileName(defaultFileName);
    setDocumentHeading(defaultFileName);
    setUseSameAsFileName(true);
    setShowExportDialog(true);
  };

  const handleExportToWord = async () => {
    if (!documentHeading.trim() || !fileName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both document heading and filename.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setShowExportDialog(false);

    try {
      // Clean all questions before sending
      const cleanedQuestions = selectedQuestions.map((q) =>
        cleanQuestionForExport(q)
      );

      const response = await fetch("/api/export/selected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIds: selectedQuestions.map((q) => q.id),
          questions: cleanedQuestions, // Send cleaned questions
          title: documentHeading.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Clean filename and ensure .docx extension
      let cleanFileName = fileName.trim().replace(/[^a-zA-Z0-9\s\-_]/g, "_");
      if (!cleanFileName.toLowerCase().endsWith(".docx")) {
        cleanFileName += ".docx";
      }
      a.download = cleanFileName;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `${selectedQuestions.length} questions exported to Word document.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "b", "i"],
      ALLOWED_ATTR: [],
    });
  };

  const stripHtml = (html: string) => {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Export Questions
        </h1>
        <p className="text-gray-600">
          Manage and export your selected questions to Word documents.
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-lg py-2 px-4">
            {selectedQuestions.length} questions selected
          </Badge>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={clearSelection}
            variant="outline"
            disabled={selectedQuestions.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button
            onClick={handleExportClick}
            disabled={selectedQuestions.length === 0 || isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export to Word"}
          </Button>
        </div>
      </div>

      {/* Export Configuration Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Configuration</DialogTitle>
            <DialogDescription>
              Customize your document heading and filename before exporting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={fileName}
                onChange={(e) => {
                  setFileName(e.target.value);
                  if (useSameAsFileName) {
                    setDocumentHeading(e.target.value);
                  }
                }}
                placeholder="Enter filename (without .docx)"
                className="col-span-3"
              />
              <p className="text-sm text-gray-500">
                The file will be saved as "{fileName || "filename"}.docx"
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="heading">Document Heading</Label>
              <Input
                id="heading"
                value={documentHeading}
                onChange={(e) => {
                  setDocumentHeading(e.target.value);
                  if (useSameAsFileName) {
                    setFileName(e.target.value);
                  }
                }}
                placeholder="Enter document heading"
                className="col-span-3"
                disabled={useSameAsFileName}
              />
              <p className="text-sm text-gray-500">
                This will appear as the title in your Word document.
              </p>
            </div>

            <div className="items-center flex space-x-2 pt-2">
              <Checkbox
                id="same-as-filename"
                checked={useSameAsFileName}
                onCheckedChange={(checked) => {
                  setUseSameAsFileName(checked as boolean);
                  if (checked) {
                    setDocumentHeading(fileName);
                  }
                }}
              />
              <Label
                htmlFor="same-as-filename"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Same as file name
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleExportToWord} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedQuestions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No questions selected
            </h3>
            <p className="text-gray-600 mb-4">
              Go to the search page and click "Add to Export" on questions you
              want to export.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {selectedQuestions.map((question) => {
            const options = [
              "option1",
              "option2",
              "option3",
              "option4",
              "option5",
            ];
            const correctOptionKey =
              question.answer && options[Number(question.answer) - 1];
            const correctOptionText =
              correctOptionKey &&
              question[correctOptionKey as keyof typeof question];

            return (
              <Card key={question.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">#{question.id}</Badge>
                        {question.testName && (
                          <Badge variant="secondary">{question.testName}</Badge>
                        )}
                        {question.configId && (
                          <Badge variant="outline">
                            Config: {question.configId}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="text-gray-900 mb-3 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(question.question || ""),
                    }}
                  />

                  {question.description && (
                    <div className="bg-blue-50 border-l-4 border-blue-200 p-3 mb-3">
                      <div
                        className="text-sm text-blue-800"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(question.description),
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-2 mb-3">
                    {options.map(
                      (key, index) =>
                        question[key as keyof typeof question] && (
                          <div key={key} className="text-sm text-gray-700">
                            <span className="font-medium">
                              {String.fromCharCode(65 + index)}:
                            </span>{" "}
                            {stripHtml(
                              question[key as keyof typeof question] as string
                            )}
                          </div>
                        )
                    )}
                  </div>

                  {question.answer && (
                    <div className="text-green-700 font-medium">
                      Correct Answer: Option {question.answer}{" "}
                      {correctOptionText
                        ? `(${stripHtml(correctOptionText as string)})`
                        : ""}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
