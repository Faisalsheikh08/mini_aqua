import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WordExportButtonProps {
  testName: string;
  disabled?: boolean;
}

export function WordExportButton({ testName, disabled = false }: WordExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!testName || isExporting) return;

    setIsExporting(true);
    
    try {
      // Make API call to export endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      const response = await fetch(`/api/export/word/${encodeURIComponent(testName)}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 503 && errorData.error === 'CONNECTION_TIMEOUT') {
          throw new Error('Database connection timeout. Please wait a moment and try again.');
        }
        
        throw new Error(errorData.message || 'Failed to export questions');
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${testName.replace(/[^a-zA-Z0-9\s\-_]/g, '_').replace(/\s+/g, ' ').replace(/_+/g, '_').trim()} Questions.docx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Questions for "${testName}" have been exported to Word document.`,
      });
      
    } catch (error: any) {
      console.error('Export error:', error);
      
      let errorMessage = "Failed to export questions. Please try again.";
      
      if (error.name === 'AbortError') {
        errorMessage = "Export timed out. Large tests may take longer to export. Please try again.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Database connection timeout. Please wait a moment and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting || !testName}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {isExporting ? "Exporting..." : "Export to Word"}
    </Button>
  );
}


// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Download, FileText, Loader2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// interface WordExportButtonProps {
//   testName: string;
//   disabled?: boolean;
// }

// export function WordExportButton({ testName, disabled = false }: WordExportButtonProps) {
//   const [isExporting, setIsExporting] = useState(false);
//   const { toast } = useToast();

//   const handleExport = async () => {
//     if (!testName || isExporting) return;

//     setIsExporting(true);

//     try {
//       // API call with timeout
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min
//       const response = await fetch(
//         `/api/export/word/${encodeURIComponent(testName)}`,
//         { signal: controller.signal }
//       );
//       clearTimeout(timeoutId);

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         if (response.status === 503 && errorData.error === "CONNECTION_TIMEOUT") {
//           throw new Error("Database connection timeout. Please try again later.");
//         }
//         throw new Error(errorData.message || "Failed to export questions");
//       }

//       // Get blob (Word file)
//       const blob = await response.blob();

//       // Create file download link
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");

//       // ✅ Clean filename properly
//       const cleanName = testName
//         .replace(/[^a-zA-Z0-9\s\-_]/g, "_") // remove invalid chars
//         .replace(/\s+/g, " ") // normalize spaces
//         .replace(/_+/g, "_") // avoid multiple underscores
//         .trim();

//       link.href = url;
//       link.download = `${cleanName}_Questions.docx`;

//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       toast({
//         title: "Export Successful",
//         description: `Questions for "${testName}" exported successfully.`,
//       });
//     } catch (error: any) {
//       console.error("Export error:", error);

//       let errorMessage = "Failed to export questions. Please try again.";
//       if (error.name === "AbortError") {
//         errorMessage = "Export timed out. Large tests may take longer.";
//       } else if (error.message.includes("timeout")) {
//         errorMessage = "Database connection timeout. Please try again later.";
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       toast({
//         title: "Export Failed",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   return (
//     <Button
//       onClick={handleExport}
//       disabled={disabled || isExporting || !testName}
//       variant="outline"
//       size="sm"
//       className="flex items-center gap-2"
//     >
//       {isExporting ? (
//         <Loader2 className="h-4 w-4 animate-spin" />
//       ) : (
//         <FileText className="h-4 w-4" />
//       )}
//       {isExporting ? "Exporting..." : "Export to Word"}
//     </Button>
//   );
// }
