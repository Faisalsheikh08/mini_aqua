
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Lightbulb, ChevronDown, Check, BookOpen, Target, Tags, Edit, Plus, Merge, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuestionCategorization } from "@/components/question-categorization";
import { QuestionEditModal } from "@/components/question-edit-modal";
import { QuestionMergeModal } from "@/components/question-merge-modal";
import { useExport } from "@/contexts/ExportContext";
import type { Question } from "@shared/schema";
import DOMPurify from "dompurify";

interface QuestionCardProps {
  question: Question;
  showCategorization?: boolean;
}
// interface QuestionCardProps {
//   question: Question;
//   showCategorization?: boolean;
//   onAddToExport?: (question: Question) => void;  // ADD THIS
//   isSelected?: boolean;  // ADD THIS
// }


export function QuestionCard({ question, showCategorization = true }: QuestionCardProps) {
  const [showSolution, setShowSolution] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const { toast } = useToast();
  const { addQuestion, isQuestionSelected } = useExport();
// export function QuestionCard({ 
//   question, 
//   showCategorization = true,
//   onAddToExport,  // ADD THIS
//   isSelected  // ADD THIS
// }: QuestionCardProps) {
//   const [showSolution, setShowSolution] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showMergeModal, setShowMergeModal] = useState(false);
//   const { toast } = useToast();
//   const { addQuestion, isQuestionSelected } = useExport();

  // const handleAddToExport = onAddToExport || addQuestion;
  // const isInExportList = isSelected !== undefined ? isSelected : isQuestionSelected(question.id);

  const sanitizeHtml = (html: string) => {
    // Comprehensive HTML entity decoding function (same as server-side)
    const decodeHtmlEntities = (text: string): string => {
      if (!text) return "";
      
      return text
        // First handle double-encoded entities (common issue)
        .replace(/&amp;quot;/g, '"')
        .replace(/&amp;amp;/g, '&')
        .replace(/&amp;lt;/g, '<')
        .replace(/&amp;gt;/g, '>')
        .replace(/&amp;nbsp;/g, ' ')
        
        // Standard HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        
        // Extended Latin characters (Spanish, French, German, etc.)
        .replace(/&aacute;/g, 'á')
        .replace(/&Aacute;/g, 'Á')
        .replace(/&eacute;/g, 'é')
        .replace(/&Eacute;/g, 'É')
        .replace(/&iacute;/g, 'í')
        .replace(/&Iacute;/g, 'Í')
        .replace(/&oacute;/g, 'ó')
        .replace(/&Oacute;/g, 'Ó')
        .replace(/&uacute;/g, 'ú')
        .replace(/&Uacute;/g, 'Ú')
        .replace(/&ntilde;/g, 'ñ')
        .replace(/&Ntilde;/g, 'Ñ')
        .replace(/&agrave;/g, 'à')
        .replace(/&Agrave;/g, 'À')
        .replace(/&egrave;/g, 'è')
        .replace(/&Egrave;/g, 'È')
        .replace(/&igrave;/g, 'ì')
        .replace(/&Igrave;/g, 'Ì')
        .replace(/&ograve;/g, 'ò')
        .replace(/&Ograve;/g, 'Ò')
        .replace(/&ugrave;/g, 'ù')
        .replace(/&Ugrave;/g, 'Ù')
        .replace(/&acirc;/g, 'â')
        .replace(/&Acirc;/g, 'Â')
        .replace(/&ecirc;/g, 'ê')
        .replace(/&Ecirc;/g, 'Ê')
        .replace(/&icirc;/g, 'î')
        .replace(/&Icirc;/g, 'Î')
        .replace(/&ocirc;/g, 'ô')
        .replace(/&Ocirc;/g, 'Ô')
        .replace(/&ucirc;/g, 'û')
        .replace(/&Ucirc;/g, 'Û')
        .replace(/&auml;/g, 'ä')
        .replace(/&Auml;/g, 'Ä')
        .replace(/&euml;/g, 'ë')
        .replace(/&Euml;/g, 'Ë')
        .replace(/&iuml;/g, 'ï')
        .replace(/&Iuml;/g, 'Ï')
        .replace(/&ouml;/g, 'ö')
        .replace(/&Ouml;/g, 'Ö')
        .replace(/&uuml;/g, 'ü')
        .replace(/&Uuml;/g, 'Ü')
        .replace(/&yuml;/g, 'ÿ')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&Ccedil;/g, 'Ç')
        
        // Typographic quotes and dashes
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/&hellip;/g, '...')
        .replace(/&ensp;/g, ' ')
        .replace(/&emsp;/g, '  ')
        .replace(/&thinsp;/g, ' ')
        
        // Symbols
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™')
        .replace(/&deg;/g, '°')
        .replace(/&sect;/g, '§')
        .replace(/&para;/g, '¶')
        .replace(/&middot;/g, '·')
        .replace(/&bull;/g, '•')
        .replace(/&dagger;/g, '†')
        .replace(/&Dagger;/g, '‡')
        
        // Handle numeric entities
        .replace(/&#(\d+);/g, (match, code) => {
          try {
            return String.fromCharCode(parseInt(code, 10));
          } catch {
            return '';
          }
        })
        .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => {
          try {
            return String.fromCharCode(parseInt(code, 16));
          } catch {
            return '';
          }
        })
        
        // Keep ampersand LAST to avoid double-decoding
        .replace(/&amp;/g, '&');
    };
    
    // First decode HTML entities, process LaTeX math, then sanitize
    const decoded = decodeHtmlEntities(html);
    
    // Function to convert LaTeX math expressions to Unicode
    const convertLatexMath = (text: string): string => {
      if (!text) return "";
      
      return text
        // Handle LaTeX fractions with explicit space handling
        .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, '$1½')
        .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')
        .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')
        
        // Handle patterns without space between number and frac
        .replace(/\\\(\s*(\d+)\\frac\{1\}\{2\}\s*\\\)/g, '$1½')
        .replace(/\\\(\s*(\d+)\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')
        .replace(/\\\(\s*(\d+)\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')
        
        // Handle standalone fractions in LaTeX delimiters
        .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, '½')
        .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, '¼')
        .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, '¾')
        .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, '⅓')
        .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, '⅔')
        .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, '($1/$2)')
        
        // Handle fractions without LaTeX delimiters
        .replace(/\\frac\{1\}\{2\}/g, '½')
        .replace(/\\frac\{1\}\{4\}/g, '¼')
        .replace(/\\frac\{3\}\{4\}/g, '¾')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        
        // Handle LaTeX fractions without delimiters but with numbers before
        .replace(/(\d+)\s*\\frac\{1\}\{2\}/g, '$1½')
        .replace(/(\d+)\s*\\frac\{1\}\{4\}/g, '$1¼')
        .replace(/(\d+)\s*\\frac\{3\}\{4\}/g, '$1¾')
        .replace(/(\d+)\s*\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 ($2/$3)')
        
        // Handle standalone fractions without delimiters
        .replace(/\\frac\{1\}\{2\}/g, '½')
        .replace(/\\frac\{1\}\{4\}/g, '¼')
        .replace(/\\frac\{3\}\{4\}/g, '¾')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        
        // Remove LaTeX delimiters
        .replace(/\\\(/g, '').replace(/\\\)/g, '')
        .replace(/\\\[/g, '').replace(/\\\]/g, '')
        
        // Clean up backslashes
        .replace(/\\(?=frac|text|left|right)/g, '');
    };
    
    // Use the same bilingual processing as copy function
    const processBilingualTextForDisplay = (content: string): string => {
      if (!content) return "";
      
      function renderLatexMath(text: string): string {
        return text
          .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, '$1½')
          .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')
          .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')
          .replace(/\\\(\s*(\d+)\\frac\{1\}\{2\}\s*\\\)/g, '$1½')
          .replace(/\\\(\s*(\d+)\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')
          .replace(/\\\(\s*(\d+)\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')
          .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, '½')
          .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, '¼')
          .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, '¾')
          .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, '($1/$2)')
          .replace(/\\\(/g, '').replace(/\\\)/g, '');
      }
      
      function safeBilingualSplit(text: string): string[] {
        const splitPoints: number[] = [];
        let i = 0;
        while (i < text.length - 2) {
          if (text.substr(i, 3) === ' / ') {
            splitPoints.push(i);
          }
          i++;
        }
        
        if (splitPoints.length === 0) return [text];
        
        const validSplitPoints = splitPoints.filter(point => {
          const beforePoint = text.substring(0, point);
          const openDelims = (beforePoint.match(/\\\(/g) || []).length;
          const closeDelims = (beforePoint.match(/\\\)/g) || []).length;
          return openDelims === closeDelims;
        });
        
        if (validSplitPoints.length === 0) return [text];
        
        const splitAt = validSplitPoints[0];
        return [text.substring(0, splitAt), text.substring(splitAt + 3)];
      }
      
      const parts = safeBilingualSplit(content);
      if (parts.length === 2) {
        const englishPart = renderLatexMath(parts[0].trim());
        const hindiPart = renderLatexMath(parts[1].trim());
        return `${englishPart}<br/>[Hindi] ${hindiPart}`;
      } else {
        return renderLatexMath(content);
      }
    };
    
    const mathProcessed = processBilingualTextForDisplay(decoded);
    
    return DOMPurify.sanitize(mathProcessed, { 
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'img', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'sup', 'sub'
      ],
      ALLOWED_ATTR: [
        'style', 'class', 'src', 'alt', 'width', 'height', 
        'border', 'cellpadding', 'cellspacing', 'align'
      ]
    });
  };

  // Function to format mathematical expressions
  const formatMathExpressions = (text: string) => {
    // Convert LaTeX fractions to readable format
    text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');
    
    // Convert LaTeX parentheses
    text = text.replace(/\\left\(/g, '(');
    text = text.replace(/\\right\)/g, ')');
    
    // Convert LaTeX brackets
    text = text.replace(/\\left\[/g, '[');
    text = text.replace(/\\right\]/g, ']');
    
    // Convert LaTeX braces
    text = text.replace(/\\left\{/g, '{');
    text = text.replace(/\\right\}/g, '}');
    
    // Convert simple LaTeX delimiters
    text = text.replace(/\\\(/g, '');
    text = text.replace(/\\\)/g, '');
    text = text.replace(/\\\[/g, '');
    text = text.replace(/\\\]/g, '');
    
    // Convert superscripts
    text = text.replace(/\^(\d+)/g, '^$1');
    text = text.replace(/\^\{([^}]+)\}/g, '^($1)');
    
    // Convert subscripts
    text = text.replace(/_(\d+)/g, '₁₂₃₄₅₆₇₈₉₀'[parseInt('$1')] || '_$1');
    text = text.replace(/\_\{([^}]+)\}/g, '_($1)');
    
    // Convert common mathematical symbols
    text = text.replace(/\\times/g, '×');
    text = text.replace(/\\div/g, '÷');
    text = text.replace(/\\pm/g, '±');
    text = text.replace(/\\infty/g, '∞');
    text = text.replace(/\\alpha/g, 'α');
    text = text.replace(/\\beta/g, 'β');
    text = text.replace(/\\gamma/g, 'γ');
    text = text.replace(/\\delta/g, 'δ');
    text = text.replace(/\\pi/g, 'π');
    text = text.replace(/\\theta/g, 'θ');
    text = text.replace(/\\lambda/g, 'λ');
    text = text.replace(/\\mu/g, 'μ');
    text = text.replace(/\\sigma/g, 'σ');
    text = text.replace(/\\omega/g, 'ω');
    
    // Convert common operators
    text = text.replace(/\\leq/g, '≤');
    text = text.replace(/\\geq/g, '≥');
    text = text.replace(/\\neq/g, '≠');
    text = text.replace(/\\approx/g, '≈');
    text = text.replace(/\\equiv/g, '≡');
    
    // Clean up extra backslashes
    text = text.replace(/\\/g, '');
    
    return text;
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // Function to format table content in a clean, readable way
  const formatTableContent = (tableElement: Element): string => {
    const rows = Array.from(tableElement.querySelectorAll('tr'));
    if (rows.length === 0) return '';
    
    const tableData: string[][] = [];
    
    // Extract all table data
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      const rowData = cells.map(cell => {
        const cellText = cell.textContent?.trim() || '';
        return cellText;
      });
      tableData.push(rowData);
    });
    
    if (tableData.length === 0) return '';
    
    // Clean, readable table format
    let tableText = '';
    
    if (tableData.length > 0) {
      // Process each row
      tableData.forEach((row, rowIndex) => {
        if (row && row.length >= 2) {
          if (rowIndex === 0) {
            // Header row - show column names
            tableText += `${row[0]} | ${row[1]}\n\n`;
          } else {
            // Data rows - format as clear pairs
            tableText += `${row[0]}: ${row[1]}\n\n`;
          }
        }
      });
    }
    
    return tableText.trim();
  };

  // Comprehensive HTML to clean text converter for copy functionality
  const convertHtmlToCleanText = (html: string) => {
    if (!html) return '';
    
    // Use the same comprehensive HTML entity decoding
    const decodeHtmlEntities = (text: string): string => {
      if (!text) return "";
      
      return text
        .replace(/&amp;quot;/g, '"')
        .replace(/&amp;amp;/g, '&')
        .replace(/&amp;lt;/g, '<')
        .replace(/&amp;gt;/g, '>')
        .replace(/&amp;nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&aacute;/g, 'á')
        .replace(/&Aacute;/g, 'Á')
        .replace(/&eacute;/g, 'é')
        .replace(/&Eacute;/g, 'É')
        .replace(/&iacute;/g, 'í')
        .replace(/&Iacute;/g, 'Í')
        .replace(/&oacute;/g, 'ó')
        .replace(/&Oacute;/g, 'Ó')
        .replace(/&uacute;/g, 'ú')
        .replace(/&Uacute;/g, 'Ú')
        .replace(/&ntilde;/g, 'ñ')
        .replace(/&Ntilde;/g, 'Ñ')
        .replace(/&agrave;/g, 'à')
        .replace(/&Agrave;/g, 'À')
        .replace(/&egrave;/g, 'è')
        .replace(/&Egrave;/g, 'È')
        .replace(/&igrave;/g, 'ì')
        .replace(/&Igrave;/g, 'Ì')
        .replace(/&ograve;/g, 'ò')
        .replace(/&Ograve;/g, 'Ò')
        .replace(/&ugrave;/g, 'ù')
        .replace(/&Ugrave;/g, 'Ù')
        .replace(/&acirc;/g, 'â')
        .replace(/&Acirc;/g, 'Â')
        .replace(/&ecirc;/g, 'ê')
        .replace(/&Ecirc;/g, 'Ê')
        .replace(/&icirc;/g, 'î')
        .replace(/&Icirc;/g, 'Î')
        .replace(/&ocirc;/g, 'ô')
        .replace(/&Ocirc;/g, 'Ô')
        .replace(/&ucirc;/g, 'û')
        .replace(/&Ucirc;/g, 'Û')
        .replace(/&auml;/g, 'ä')
        .replace(/&Auml;/g, 'Ä')
        .replace(/&euml;/g, 'ë')
        .replace(/&Euml;/g, 'Ë')
        .replace(/&iuml;/g, 'ï')
        .replace(/&Iuml;/g, 'Ï')
        .replace(/&ouml;/g, 'ö')
        .replace(/&Ouml;/g, 'Ö')
        .replace(/&uuml;/g, 'ü')
        .replace(/&Uuml;/g, 'Ü')
        .replace(/&yuml;/g, 'ÿ')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&Ccedil;/g, 'Ç')
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/&hellip;/g, '...')
        .replace(/&copy;/g, '©')
        .replace(/&reg;/g, '®')
        .replace(/&trade;/g, '™')
        .replace(/&deg;/g, '°')
        .replace(/&#(\d+);/g, (match, code) => {
          try {
            return String.fromCharCode(parseInt(code, 10));
          } catch {
            return '';
          }
        })
        .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => {
          try {
            return String.fromCharCode(parseInt(code, 16));
          } catch {
            return '';
          }
        })
        .replace(/&amp;/g, '&');
    };
    
    // Function to convert LaTeX math expressions to Unicode or readable text (same as server-side)
    const convertLatexMath = (text: string): string => {
      if (!text) return "";
      
      return text
        // Handle LaTeX fractions with explicit space handling - more precise patterns
        .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, '$1½')  // \(365 \frac{1}{2}\) → 365½
        .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')  // \(365 \frac{1}{4}\) → 365¼
        .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')  // \(365 \frac{3}{4}\) → 365¾
        
        // Handle patterns without space between number and frac
        .replace(/\\\(\s*(\d+)\\frac\{1\}\{2\}\s*\\\)/g, '$1½')
        .replace(/\\\(\s*(\d+)\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')
        .replace(/\\\(\s*(\d+)\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')
        
        // Handle standalone fractions in LaTeX delimiters
        .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, '½')
        .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, '¼')
        .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, '¾')
        .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, '⅓')
        .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, '⅔')
        .replace(/\\\(\s*\\frac\{1\}\{5\}\s*\\\)/g, '⅕')
        .replace(/\\\(\s*\\frac\{2\}\{5\}\s*\\\)/g, '⅖')
        .replace(/\\\(\s*\\frac\{3\}\{5\}\s*\\\)/g, '⅗')
        .replace(/\\\(\s*\\frac\{4\}\{5\}\s*\\\)/g, '⅘')
        .replace(/\\\(\s*\\frac\{1\}\{6\}\s*\\\)/g, '⅙')
        .replace(/\\\(\s*\\frac\{5\}\{6\}\s*\\\)/g, '⅚')
        .replace(/\\\(\s*\\frac\{1\}\{8\}\s*\\\)/g, '⅛')
        .replace(/\\\(\s*\\frac\{3\}\{8\}\s*\\\)/g, '⅜')
        .replace(/\\\(\s*\\frac\{5\}\{8\}\s*\\\)/g, '⅝')
        .replace(/\\\(\s*\\frac\{7\}\{8\}\s*\\\)/g, '⅞')
        
        // Handle generic fractions - convert to readable format
        .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, '($1/$2)')
        
        // Handle fractions without LaTeX delimiters but with backslash prefix
        .replace(/\\frac\{1\}\{2\}/g, '½')
        .replace(/\\frac\{1\}\{4\}/g, '¼')
        .replace(/\\frac\{3\}\{4\}/g, '¾')
        .replace(/\\frac\{1\}\{3\}/g, '⅓')
        .replace(/\\frac\{2\}\{3\}/g, '⅔')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        
        // Handle LaTeX fractions without delimiters but with numbers before
        .replace(/(\d+)\s*\\frac\{1\}\{2\}/g, '$1½')
        .replace(/(\d+)\s*\\frac\{1\}\{4\}/g, '$1¼')
        .replace(/(\d+)\s*\\frac\{3\}\{4\}/g, '$1¾')
        .replace(/(\d+)\s*\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 ($2/$3)')
        
        // Handle standalone fractions without delimiters
        .replace(/\\frac\{1\}\{2\}/g, '½')
        .replace(/\\frac\{1\}\{4\}/g, '¼')
        .replace(/\\frac\{3\}\{4\}/g, '¾')
        .replace(/\\frac\{1\}\{3\}/g, '⅓')
        .replace(/\\frac\{2\}\{3\}/g, '⅔')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        
        // Remove LaTeX delimiters
        .replace(/\\\(/g, '')
        .replace(/\\\)/g, '')
        .replace(/\\\[/g, '')
        .replace(/\\\]/g, '')
        
        // Clean up any remaining backslashes before math commands
        .replace(/\\(?=frac|text|left|right)/g, '');
    };
    
    // Process bilingual text with safe LaTeX rendering (same as server-side)
    const processBilingualText = (content: string): string => {
      if (!content) return "";
      
      // Function to render LaTeX math to Unicode
      function renderLatexMath(text: string): string {
        return text
          // Handle LaTeX fractions with numbers - comprehensive patterns
          .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, '$1½')
          .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')
          .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')
          .replace(/\\\(\s*(\d+)\\frac\{1\}\{2\}\s*\\\)/g, '$1½')
          .replace(/\\\(\s*(\d+)\\frac\{1\}\{4\}\s*\\\)/g, '$1¼')
          .replace(/\\\(\s*(\d+)\\frac\{3\}\{4\}\s*\\\)/g, '$1¾')
          
          // Handle standalone fractions in LaTeX delimiters
          .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, '½')
          .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, '¼')
          .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, '¾')
          .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, '⅓')
          .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, '⅔')
          .replace(/\\\(\s*\\frac\{1\}\{5\}\s*\\\)/g, '⅕')
          .replace(/\\\(\s*\\frac\{2\}\{5\}\s*\\\)/g, '⅖')
          .replace(/\\\(\s*\\frac\{3\}\{5\}\s*\\\)/g, '⅗')
          .replace(/\\\(\s*\\frac\{4\}\{5\}\s*\\\)/g, '⅘')
          .replace(/\\\(\s*\\frac\{1\}\{6\}\s*\\\)/g, '⅙')
          .replace(/\\\(\s*\\frac\{5\}\{6\}\s*\\\)/g, '⅚')
          .replace(/\\\(\s*\\frac\{1\}\{8\}\s*\\\)/g, '⅛')
          .replace(/\\\(\s*\\frac\{3\}\{8\}\s*\\\)/g, '⅜')
          .replace(/\\\(\s*\\frac\{5\}\{8\}\s*\\\)/g, '⅝')
          .replace(/\\\(\s*\\frac\{7\}\{8\}\s*\\\)/g, '⅞')
          
          // Handle generic fractions
          .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, '($1/$2)')
          
          // Clean up LaTeX delimiters
          .replace(/\\\(/g, '').replace(/\\\)/g, '')
          .replace(/\\\[/g, '').replace(/\\\]/g, '');
      }
      
      // Safe bilingual split that respects math delimiters
      function safeBilingualSplit(text: string): string[] {
        // Find potential split points (space-slash-space)
        const splitPoints: number[] = [];
        let i = 0;
        while (i < text.length - 2) {
          if (text.substr(i, 3) === ' / ') {
            splitPoints.push(i);
          }
          i++;
        }
        
        if (splitPoints.length === 0) {
          return [text];
        }
        
        // Check if split points are inside math delimiters
        const validSplitPoints = splitPoints.filter(point => {
          // Check if this split point is inside \( ... \) delimiters
          const beforePoint = text.substring(0, point);
          
          // Count LaTeX delimiter pairs before the split point
          const openDelims = (beforePoint.match(/\\\(/g) || []).length;
          const closeDelims = (beforePoint.match(/\\\)/g) || []).length;
          
          // If we have unmatched open delimiters, we're inside math
          return openDelims === closeDelims;
        });
        
        if (validSplitPoints.length === 0) {
          return [text];
        }
        
        // Use the first valid split point
        const splitAt = validSplitPoints[0];
        return [
          text.substring(0, splitAt),
          text.substring(splitAt + 3)
        ];
      }
      
      // Process the text
      const parts = safeBilingualSplit(content);
      
      if (parts.length === 2) {
        // Render math in each part separately, then rejoin with line break
        const englishPart = renderLatexMath(parts[0].trim());
        const hindiPart = renderLatexMath(parts[1].trim());
        return `${englishPart}<br/>[Hindi] ${hindiPart}`;
      } else {
        // Single language or no valid split - just render math
        return renderLatexMath(content);
      }
    };
    
    // Create a temporary div to parse processed HTML
    const tempDiv = document.createElement('div');
    const processedHtml = processBilingualText(decodeHtmlEntities(html));
    tempDiv.innerHTML = processedHtml;
    
    // Function to recursively extract clean text
    const extractCleanText = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        return text.replace(/\s+/g, ' ');
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        let text = '';
        
        // Handle different elements
        const tagName = el.tagName?.toLowerCase();
        
        // Skip script and style elements
        if (tagName === 'script' || tagName === 'style') {
          return '';
        }
        
        // Process children first
        for (const child of Array.from(el.childNodes)) {
          text += extractCleanText(child);
        }
        
        // Add appropriate spacing/formatting based on element type
        switch (tagName) {
          case 'br':
            return '\n';
          case 'p':
            return text.trim() ? `${text.trim()}\n\n` : '\n';
          case 'div':
            return text.trim() ? `${text.trim()}\n` : '';
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            return text.trim() ? `${text.trim()}\n\n` : '';
          case 'li':
            return text.trim() ? `• ${text.trim()}\n` : '';
          case 'ul':
          case 'ol':
            return text.trim() ? `\n${text.trim()}\n` : '';
          case 'table':
            return `\n${formatTableContent(el)}\n`;
          case 'tr':
            return text; // Handled by table processing
          case 'td':
          case 'th':
            return text; // Handled by table processing
          case 'strong':
          case 'b':
          case 'em':
          case 'i':
          case 'u':
            return text; // Just return text without formatting
          default:
            return text;
        }
      }
      
      return '';
    };
    
    let cleanText = extractCleanText(tempDiv);
    
    // Clean up the result but preserve table formatting
    cleanText = cleanText
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs but preserve newlines
      .replace(/\n /g, '\n') // Remove spaces after line breaks
      .trim();
    
    // Format mathematical expressions
    cleanText = formatMathExpressions(cleanText);
    
    // Decode HTML entities that might still be present
    cleanText = cleanText
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'");
    
    // Handle bilingual content
    const languageMarkers = ['[Hindi]', '[Tamil]', '[Telugu]', '[Gujarati]', '[Punjabi]', '[Bengali]', '[Malayalam]', '[Kannada]', '[Odia]', '[Marathi]'];
    
    for (const marker of languageMarkers) {
      if (cleanText.includes(marker)) {
        const parts = cleanText.split(marker);
        if (parts.length === 2) {
          const englishPart = parts[0].trim();
          const localPart = parts[1].trim();
          const language = marker.replace(/[\[\]]/g, '');
          
          cleanText = `English: ${englishPart}\n\n${language}: ${localPart}`;
          break;
        }
      }
    }
    
    return cleanText;
  };

  // Function to remove problematic icons from HTML content
  const removeProblematicIcons = (html: string) => {
    if (!html) return '';
    
    // Create a temporary DOM element to manipulate the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove problematic images (small icons that cause copy issues)
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.src || '';
      const alt = img.alt || '';
      const width = img.width || img.naturalWidth || 0;
      const height = img.height || img.naturalHeight || 0;
      
      // Identify and remove small circular icons
      const isProblematicIcon = 
        // Size-based detection
        (width <= 50 && height <= 50) ||
        // Source-based detection
        src.includes('icon') ||
        src.includes('key') ||
        src.includes('document') ||
        src.includes('check') ||
        src.includes('mark') ||
        // Alt text detection
        alt.toLowerCase().includes('icon') ||
        alt.toLowerCase().includes('key') ||
        alt.toLowerCase().includes('document') ||
        alt.toLowerCase().includes('check');
      
      if (isProblematicIcon) {
        img.remove();
      }
    });
    
    return tempDiv.innerHTML;
  };

  // Function to format bilingual questions with proper line breaks
  const formatBilingualQuestion = (questionText: string) => {
    // First sanitize the HTML
    const sanitized = sanitizeHtml(questionText);
    
    // Remove problematic icons that cause copy issues
    const cleanedOfIcons = removeProblematicIcons(sanitized);
    
    // Check if the question contains [Hindi] or other language markers
    const languagePatterns = [
      { marker: '[Hindi]', language: 'Hindi' },
      { marker: '[Tamil]', language: 'Tamil' },
      { marker: '[Telugu]', language: 'Telugu' },
      { marker: '[Gujarati]', language: 'Gujarati' },
      { marker: '[Punjabi]', language: 'Punjabi' },
      { marker: '[Bengali]', language: 'Bengali' },
      { marker: '[Malayalam]', language: 'Malayalam' },
      { marker: '[Kannada]', language: 'Kannada' },
      { marker: '[Odia]', language: 'Odia' },
      { marker: '[Marathi]', language: 'Marathi' }
    ];
    
    let formattedText = cleanedOfIcons;
    
    // Process each language pattern
    for (const pattern of languagePatterns) {
      if (formattedText.includes(pattern.marker)) {
        // Split by the language marker
        const parts = formattedText.split(pattern.marker);
        if (parts.length === 2) {
          const englishPart = formatMathExpressions(parts[0].trim());
          const localPart = formatMathExpressions(parts[1].trim());
          
          // Format with proper line breaks and language labels
          formattedText = `
            <div class="space-y-3">
              <div class="border-l-4 border-blue-500 pl-4">
                <div class="text-sm font-medium text-blue-600 mb-1">English</div>
                <div>${englishPart}</div>
              </div>
              <div class="border-l-4 border-green-500 pl-4">
                <div class="text-sm font-medium text-green-600 mb-1">${pattern.language}</div>
                <div>${localPart}</div>
              </div>
            </div>
          `;
          break; // Only process the first matching pattern
        }
      }
    }
    
    // If no language markers found, still format math expressions
    if (formattedText === cleanedOfIcons) {
      formattedText = formatMathExpressions(formattedText);
    }
    
    return formattedText;
  };

  const convertHtmlToRichText = (html: string) => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizeHtml(html);
    
    // Function to extract text with formatting
    const extractFormattedText = (element: Node): string => {
      if (element.nodeType === Node.TEXT_NODE) {
        const text = element.textContent || '';
        // Clean up excessive whitespace but preserve intentional line breaks
        return text.replace(/\s+/g, ' ');
      }
      
      if (element.nodeType === Node.ELEMENT_NODE) {
        const el = element as Element;
        let text = '';
        
        // Handle images separately before processing children
        if (el.tagName?.toLowerCase() === 'img') {
          const src = el.getAttribute('src') || '';
          const alt = el.getAttribute('alt') || 'Image';
          // Convert relative URLs to absolute URLs
          const fullSrc = src.startsWith('//') ? `https:${src}` : src;
          return `\n\n📷 **${alt}**\n${fullSrc}\n\n`;
        }
        
        // Process child nodes first
        for (const child of Array.from(el.childNodes)) {
          text += extractFormattedText(child);
        }
        
        // Apply formatting based on tag
        switch (el.tagName?.toLowerCase()) {
          case 'strong':
          case 'b':
            return `**${text.trim()}**`; // Markdown bold
          case 'em':
          case 'i':
            return `*${text.trim()}*`; // Markdown italic
          case 'u':
            return `__${text.trim()}__`; // Underline representation
          case 'br':
            return '\n';
          case 'p':
            const pText = text.trim();
            return pText ? `${pText}\n\n` : '\n';
          case 'div':
            const divText = text.trim();
            return divText ? `${divText}\n` : '';
          case 'li':
            return `• ${text.trim()}\n`;
          case 'ul':
          case 'ol':
            return `\n${text}\n`;
          case 'h1':
            return `\n# ${text.trim()}\n\n`;
          case 'h2':
            return `\n## ${text.trim()}\n\n`;
          case 'h3':
            return `\n### ${text.trim()}\n\n`;
          case 'h4':
          case 'h5':
          case 'h6':
            return `\n#### ${text.trim()}\n\n`;
          case 'table':
            return `\n\n${text}\n\n`;
          case 'thead':
            return `${text}|---|\n`;
          case 'tbody':
            return text;
          case 'tr':
            return `|${text}\n`;
          case 'td':
          case 'th':
            return ` ${text.trim()} |`;
          case 'sup':
            return `^${text}`;
          case 'sub':
            return `_${text}`;
          case 'span':
            // Preserve important span content
            return text;
          default:
            return text;
        }
      }
      
      return '';
    };
    
    // Clean up the final result
    const result = extractFormattedText(tempDiv);
    return result
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim();
  };

  // Function to format bilingual questions for clean text copying
  const formatBilingualQuestionForCopy = (questionText: string) => {
    // Remove HTML tags first
    const plainText = stripHtml(questionText);
    
    // Check for language markers and format appropriately
    const languagePatterns = [
      { marker: '[Hindi]', language: 'Hindi' },
      { marker: '[Tamil]', language: 'Tamil' },
      { marker: '[Telugu]', language: 'Telugu' },
      { marker: '[Gujarati]', language: 'Gujarati' },
      { marker: '[Punjabi]', language: 'Punjabi' },
      { marker: '[Bengali]', language: 'Bengali' },
      { marker: '[Malayalam]', language: 'Malayalam' },
      { marker: '[Kannada]', language: 'Kannada' },
      { marker: '[Odia]', language: 'Odia' },
      { marker: '[Marathi]', language: 'Marathi' }
    ];
    
    let formattedText = plainText;
    
    // Process each language pattern
    for (const pattern of languagePatterns) {
      if (formattedText.includes(pattern.marker)) {
        // Split by the language marker
        const parts = formattedText.split(pattern.marker);
        if (parts.length === 2) {
          const englishPart = parts[0].trim();
          const localPart = parts[1].trim();
          
          // Format with clean line breaks
          formattedText = `English: ${englishPart}\n\n${pattern.language}: ${localPart}`;
          break; // Only process the first matching pattern
        }
      }
    }
    
    return formattedText;
  };

  const handleCopyQuestion = async () => {
    // Use the enhanced HTML to clean text converter that handles tables properly
    const formattedQuestion = convertHtmlToCleanText(question.question);
    
    const options = [
      question.option1,
      question.option2,
      question.option3,
      question.option4,
      question.option5
    ].filter(Boolean).map((option, index) => 
      `${String.fromCharCode(65 + index)}. ${convertHtmlToCleanText(option!)}`
    );

    const fullText = `${formattedQuestion}\n\n${options.join('\n')}`;

    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Success", 
        description: "Question copied as clean text (no HTML)!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopySolution = async () => {
    if (!question.description) return;

    try {
      // Try to copy as HTML first (preserves images and formatting)
      const solutionElement = document.querySelector('.solution-content');
      if (solutionElement && navigator.clipboard.write) {
        // Clone the element to modify without affecting the original
        const clonedElement = solutionElement.cloneNode(true) as HTMLElement;
        
        // Remove problematic circular icons (green key and blue document icons)
        const images = clonedElement.querySelectorAll('img');
        images.forEach((img) => {
          const src = img.src || '';
          const alt = img.alt || '';
          const computedStyle = window.getComputedStyle(img);
          const currentWidth = parseInt(computedStyle.width) || img.width || img.naturalWidth || 0;
          const currentHeight = parseInt(computedStyle.height) || img.height || img.naturalHeight || 0;
          
          // Remove small circular icons that cause sizing issues
          const isProblematicIcon = 
            // Size-based: small square/circular images
            (currentWidth <= 50 && currentHeight <= 50) ||
            // Source-based detection for common icon patterns
            src.includes('icon') ||
            src.includes('key') ||
            src.includes('document') ||
            src.includes('check') ||
            src.includes('mark') ||
            src.includes('circle') ||
            // Alt text detection
            alt.toLowerCase().includes('icon') ||
            alt.toLowerCase().includes('key') ||
            alt.toLowerCase().includes('document') ||
            alt.toLowerCase().includes('check') ||
            alt.toLowerCase().includes('mark') ||
            // Class-based detection
            img.classList.contains('icon') ||
            img.classList.contains('rounded-full') ||
            img.classList.contains('w-6') ||
            img.classList.contains('h-6') ||
            img.classList.contains('w-8') ||
            img.classList.contains('h-8');
          
          if (isProblematicIcon) {
            // Remove the image entirely
            img.remove();
          }
        });
        
        const htmlContent = clonedElement.innerHTML;
        const textContent = clonedElement.textContent || '';
        
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([textContent], { type: 'text/plain' })
        });
        
        await navigator.clipboard.write([clipboardItem]);
        toast({
          title: "Success",
          description: "Solution copied (problematic icons removed)!",
        });
        return;
      }
      
      // Fallback to text-only copy
      const formattedSolution = convertHtmlToRichText(question.description);
      await navigator.clipboard.writeText(formattedSolution);
      toast({
        title: "Success",
        description: "Solution copied as text!",
      });
    } catch (error) {
      console.error('Copy failed:', error);
      // Final fallback - just copy plain text
      try {
        const plainText = stripHtml(question.description);
        await navigator.clipboard.writeText(plainText);
        toast({
          title: "Success", 
          description: "Solution copied as plain text!",
        });
      } catch (finalError) {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const getOptionStyle = (optionIndex: number) => {
    const isCorrect = question.answer === optionIndex + 1;
    return isCorrect 
      ? "border-2 border-secondary bg-green-50" 
      : "border border-gray-200 hover:bg-gray-50";
  };

  const getOptionIcon = (optionIndex: number) => {
    const isCorrect = question.answer === optionIndex + 1;
    return isCorrect ? (
      <span className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
        <Check className="h-4 w-4" />
      </span>
    ) : (
      <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
        {optionIndex + 1}
      </span>
    );
  };

  const options = [
    question.option1,
    question.option2,
    question.option3,
    question.option4,
    question.option5
  ].filter(Boolean);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Source Information - Test Name, Subject, and Additional Fields */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Question Source</span>
          </div>
          {question.testName ? (
            <div className="text-sm text-gray-800 mb-2">
              <span className="font-semibold text-blue-700">Test:</span> {question.testName}
            </div>
          ) : (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Test:</span> <span className="italic">Not specified</span>
            </div>
          )}
          {question.subject ? (
            <div className="text-sm text-gray-800 mb-2">
              <span className="font-semibold text-green-700">Subject:</span> {question.subject}
            </div>
          ) : (
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Subject:</span> <span className="italic">Not specified</span>
            </div>
          )}
          {(question.topic || question.category) && (
            <div className="flex gap-4">
              {question.topic && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Topic:</span> {question.topic}
                </div>
              )}
              {question.category && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Category:</span> {question.category}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-50 text-primary">
              Q ID: {question.questionId}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-600">
              Config: {question.configId}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                addQuestion(question);
                toast({
                  title: "Added to export",
                  description: "Question added to export list."
                });
              }}
              className={`${isQuestionSelected(question.id) ? 'text-green-600 hover:text-green-700 bg-green-50' : 'text-gray-400 hover:text-green-600'}`}
              title={isQuestionSelected(question.id) ? "Already in export list" : "Add to export"}
              disabled={isQuestionSelected(question.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMergeModal(true)}
              className="text-gray-400 hover:text-blue-600"
              title="Merge multilingual variants"
            >
              <Merge className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="text-gray-400 hover:text-gray-600"
              title="Edit question"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyQuestion}
              className="text-gray-400 hover:text-gray-600"
              title="Copy question text"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <div 
            className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatBilingualQuestion(question.question) }}
          />
        </div>

        {/* Options */}
        <div className="grid gap-3 mb-6">
          {options.map((option, index) => (
            <div key={index} className={`flex items-start p-3 rounded-lg transition-colors ${getOptionStyle(index)}`}>
              {getOptionIcon(index)}
              <span 
                className={`text-gray-700 dark:text-gray-300 flex-1 ${question.answer === index + 1 ? 'font-medium' : ''}`}
                dangerouslySetInnerHTML={{ __html: formatBilingualQuestion(option!) }}
              />
              {question.answer === index + 1 && (
                <Badge className="ml-auto bg-secondary text-white text-xs">
                  Correct
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Categorization Section */}
        {showCategorization && (
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Tags className="h-4 w-4" />
                <span>Categories</span>
              </div>
              <QuestionCategorization question={question} />
            </div>
            
            {/* Display current categories */}
            <div className="flex flex-wrap gap-2">
              {question.subject && (
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {question.subject}
                </Badge>
              )}
              {question.topic && (
                <Badge variant="secondary" className="gap-1">
                  <Target className="h-3 w-3" />
                  {question.topic}
                </Badge>
              )}
              {question.difficulty && (
                <Badge 
                  variant={question.difficulty === "Easy" ? "default" : 
                          question.difficulty === "Medium" ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {question.difficulty}
                </Badge>
              )}
              {question.questionType && (
                <Badge variant="outline" className="text-xs">
                  {question.questionType}
                </Badge>
              )}
              {question.category && (
                <Badge variant="outline" className="text-xs">
                  {question.category}
                </Badge>
              )}
              {question.tags && question.tags.length > 0 && 
                question.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))
              }
              {(!question.subject && !question.topic && !question.difficulty && 
                !question.questionType && !question.category && 
                (!question.tags || question.tags.length === 0)) && (
                <span className="text-sm text-gray-400 italic">No categories assigned</span>
              )}
            </div>
          </div>
        )}

        {/* Solution Toggle */}
        {question.description && (
          <div className="border-t border-gray-200 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center justify-between w-full text-left py-2 text-accent hover:text-orange-700"
            >
              <span className="flex items-center font-medium">
                <Lightbulb className="mr-2 h-4 w-4" />
                {showSolution ? 'Hide Solution' : 'View Solution'}
              </span>
              <ChevronDown className={`h-4 w-4 transform transition-transform ${showSolution ? 'rotate-180' : ''}`} />
            </Button>
            
            {showSolution && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-amber-800">Solution & Explanation</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySolution}
                    className="h-8 px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Solution
                  </Button>
                </div>
                <div 
                  className="text-gray-700 leading-relaxed solution-content"
                  dangerouslySetInnerHTML={{ __html: formatBilingualQuestion(question.description) }}
                />
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        <QuestionEditModal
          question={question}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />

        {/* Merge Modal */}
        <QuestionMergeModal
          configId={question.configId}
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
        />
      </CardContent>
    </Card>
  );
}
