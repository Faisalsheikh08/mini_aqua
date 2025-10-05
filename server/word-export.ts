// import {
// //   Document,
// //   Paragraph,
// //   TextRun,
// //   AlignmentType,
// //   HeadingLevel,
// //   Table,
// //   TableRow,
// //   TableCell,
// //   WidthType,
// //   BorderStyle,
// //   ImageRun,
// // } from "docx";
// // import { Question } from "../shared/schema";
// // import { parse } from "node-html-parser";

// // // Enhanced function to decode HTML entities with comprehensive coverage
// // function decodeHtmlEntities(content: string): string {
// //   if (!content) return "";

// //   return (
// //     content
// //       // First handle double-encoded entities (common issue)
// //       .replace(/&amp;quot;/g, '"')
// //       .replace(/&amp;amp;/g, "&")
// //       .replace(/&amp;lt;/g, "<")
// //       .replace(/&amp;gt;/g, ">")
// //       .replace(/&amp;nbsp;/g, " ")

// //       // Standard HTML entities
// //       .replace(/&lt;/g, "<")
// //       .replace(/&gt;/g, ">")
// //       .replace(/&quot;/g, '"')
// //       .replace(/&#39;/g, "'")
// //       .replace(/&apos;/g, "'")
// //       .replace(/&nbsp;/g, " ")

// //       // Extended Latin characters (Spanish, French, German, etc.)
// //       .replace(/&aacute;/g, "á")
// //       .replace(/&Aacute;/g, "Á")
// //       .replace(/&eacute;/g, "é")
// //       .replace(/&Eacute;/g, "É")
// //       .replace(/&iacute;/g, "í")
// //       .replace(/&Iacute;/g, "Í")
// //       .replace(/&oacute;/g, "ó")
// //       .replace(/&Oacute;/g, "Ó")
// //       .replace(/&uacute;/g, "ú")
// //       .replace(/&Uacute;/g, "Ú")
// //       .replace(/&ntilde;/g, "ñ")
// //       .replace(/&Ntilde;/g, "Ñ")

// //       // Mathematical fractions (HTML entities)
// //       .replace(/&frac14;/g, "¼")
// //       .replace(/&frac12;/g, "½")
// //       .replace(/&frac34;/g, "¾")
// //       .replace(/&frac13;/g, "⅓")
// //       .replace(/&frac23;/g, "⅔")
// //       .replace(/&frac15;/g, "⅕")
// //       .replace(/&frac25;/g, "⅖")
// //       .replace(/&frac35;/g, "⅗")
// //       .replace(/&frac45;/g, "⅘")
// //       .replace(/&frac16;/g, "⅙")
// //       .replace(/&frac56;/g, "⅚")
// //       .replace(/&frac18;/g, "⅛")
// //       .replace(/&frac38;/g, "⅜")
// //       .replace(/&frac58;/g, "⅝")
// //       .replace(/&frac78;/g, "⅞")
// //       .replace(/&agrave;/g, "à")
// //       .replace(/&Agrave;/g, "À")
// //       .replace(/&egrave;/g, "è")
// //       .replace(/&Egrave;/g, "È")
// //       .replace(/&igrave;/g, "ì")
// //       .replace(/&Igrave;/g, "Ì")
// //       .replace(/&ograve;/g, "ò")
// //       .replace(/&Ograve;/g, "Ò")
// //       .replace(/&ugrave;/g, "ù")
// //       .replace(/&Ugrave;/g, "Ù")
// //       .replace(/&acirc;/g, "â")
// //       .replace(/&Acirc;/g, "Â")
// //       .replace(/&ecirc;/g, "ê")
// //       .replace(/&Ecirc;/g, "Ê")
// //       .replace(/&icirc;/g, "î")
// //       .replace(/&Icirc;/g, "Î")
// //       .replace(/&ocirc;/g, "ô")
// //       .replace(/&Ocirc;/g, "Ô")
// //       .replace(/&ucirc;/g, "û")
// //       .replace(/&Ucirc;/g, "Û")
// //       .replace(/&auml;/g, "ä")
// //       .replace(/&Auml;/g, "Ä")
// //       .replace(/&euml;/g, "ë")
// //       .replace(/&Euml;/g, "Ë")
// //       .replace(/&iuml;/g, "ï")
// //       .replace(/&Iuml;/g, "Ï")
// //       .replace(/&ouml;/g, "ö")
// //       .replace(/&Ouml;/g, "Ö")
// //       .replace(/&uuml;/g, "ü")
// //       .replace(/&Uuml;/g, "Ü")
// //       .replace(/&yuml;/g, "ÿ")
// //       .replace(/&ccedil;/g, "ç")
// //       .replace(/&Ccedil;/g, "Ç")

// //       // Typographic quotes and dashes
// //       .replace(/&ldquo;/g, '"')
// //       .replace(/&rdquo;/g, '"')
// //       .replace(/&lsquo;/g, "'")
// //       .replace(/&rsquo;/g, "'")
// //       .replace(/&mdash;/g, "—")
// //       .replace(/&ndash;/g, "–")
// //       .replace(/&hellip;/g, "...")
// //       .replace(/&ensp;/g, " ")
// //       .replace(/&emsp;/g, "  ")
// //       .replace(/&thinsp;/g, " ")

// //       // Unicode text formatting controls (Hindi/Devanagari specific)
// //       .replace(/&zwj;/g, "\u200D")
// //       .replace(/&zwnj;/g, "\u200C")
// //       .replace(/&lrm;/g, "\u200E")
// //       .replace(/&rlm;/g, "\u200F")
// //       .replace(/&shy;/g, "\u00AD")

// //       // Symbols
// //       .replace(/&copy;/g, "©")
// //       .replace(/&reg;/g, "®")
// //       .replace(/&trade;/g, "™")
// //       .replace(/&deg;/g, "°")
// //       .replace(/&sect;/g, "§")
// //       .replace(/&para;/g, "¶")
// //       .replace(/&middot;/g, "·")
// //       .replace(/&bull;/g, "•")
// //       .replace(/&dagger;/g, "†")
// //       .replace(/&Dagger;/g, "‡")

// //       // Handle specific problematic numeric entities first
// //       .replace(/&#39;/g, "'")
// //       .replace(/&#34;/g, '"')
// //       .replace(/&#38;/g, "&")
// //       .replace(/&#60;/g, "<")
// //       .replace(/&#62;/g, ">")
// //       .replace(/&#32;/g, " ")
// //       .replace(/&#160;/g, " ")
// //       .replace(/&#8217;/g, "'")
// //       .replace(/&#8216;/g, "'")
// //       .replace(/&#8220;/g, '"')
// //       .replace(/&#8221;/g, '"')
// //       .replace(/&#8211;/g, "–")
// //       .replace(/&#8212;/g, "—")
// //       .replace(/&#8230;/g, "...")

// //       // Handle general numeric entities (decimal)
// //       .replace(/&#(\d+);/g, (match, code) => {
// //         try {
// //           const charCode = parseInt(code, 10);
// //           if (charCode > 0 && charCode < 1114112) {
// //             return String.fromCharCode(charCode);
// //           }
// //           return "";
// //         } catch {
// //           return "";
// //         }
// //       })

// //       // Handle hexadecimal entities
// //       .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => {
// //         try {
// //           const charCode = parseInt(code, 16);
// //           if (charCode > 0 && charCode < 1114112) {
// //             return String.fromCharCode(charCode);
// //           }
// //           return "";
// //         } catch {
// //           return "";
// //         }
// //       })

// //       // Keep ampersand LAST to avoid double-decoding
// //       .replace(/&amp;/g, "&")
// //   );
// // }

// // // Function to render LaTeX math to Unicode
// // function renderLatexMath(text: string): string {
// //   return text
// //     .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, "$1½")
// //     .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, "$1¼")
// //     .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, "$1¾")
// //     .replace(/\\\(\s*(\d+)\\frac\{1\}\{2\}\s*\\\)/g, "$1½")
// //     .replace(/\\\(\s*(\d+)\\frac\{1\}\{4\}\s*\\\)/g, "$1¼")
// //     .replace(/\\\(\s*(\d+)\\frac\{3\}\{4\}\s*\\\)/g, "$1¾")
// //     .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, "½")
// //     .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, "¼")
// //     .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, "¾")
// //     .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, "⅓")
// //     .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, "⅔")
// //     .replace(/\\\(\s*\\frac\{1\}\{5\}\s*\\\)/g, "⅕")
// //     .replace(/\\\(\s*\\frac\{2\}\{5\}\s*\\\)/g, "⅖")
// //     .replace(/\\\(\s*\\frac\{3\}\{5\}\s*\\\)/g, "⅗")
// //     .replace(/\\\(\s*\\frac\{4\}\{5\}\s*\\\)/g, "⅘")
// //     .replace(/\\\(\s*\\frac\{1\}\{6\}\s*\\\)/g, "⅙")
// //     .replace(/\\\(\s*\\frac\{5\}\{6\}\s*\\\)/g, "⅚")
// //     .replace(/\\\(\s*\\frac\{1\}\{8\}\s*\\\)/g, "⅛")
// //     .replace(/\\\(\s*\\frac\{3\}\{8\}\s*\\\)/g, "⅜")
// //     .replace(/\\\(\s*\\frac\{5\}\{8\}\s*\\\)/g, "⅝")
// //     .replace(/\\\(\s*\\frac\{7\}\{8\}\s*\\\)/g, "⅞")
// //     .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, "($1/$2)")
// //     .replace(/\\\(/g, "")
// //     .replace(/\\\)/g, "")
// //     .replace(/\\\[/g, "")
// //     .replace(/\\\]/g, "");
// // }

// // // NEW: Function to check if content contains images
// // function containsImage(content: string): boolean {
// //   if (!content) return false;

// //   // Check for <img> tags
// //   const imgTagRegex = /<img[^>]*>/gi;

// //   // Check for base64 images
// //   const base64Regex = /data:image\/[^;]+;base64,/gi;

// //   // Check for image URLs
// //   const imageUrlRegex = /\.(jpg|jpeg|png|gif|bmp|svg|webp)(\?[^"\s]*)?/gi;

// //   return (
// //     imgTagRegex.test(content) ||
// //     base64Regex.test(content) ||
// //     imageUrlRegex.test(content)
// //   );
// // }

// // // NEW: Function to extract image URLs from content
// // function extractImageUrls(content: string): string[] {
// //   if (!content) return [];

// //   const urls: string[] = [];
// //   const root = parse(content);

// //   // Extract from <img> tags
// //   const imgTags = root.querySelectorAll("img");
// //   imgTags.forEach((img) => {
// //     const src = img.getAttribute("src");
// //     if (src) {
// //       urls.push(src);
// //     }
// //   });

// //   return urls;
// // }

// // // NEW: Function to process content with images
// // interface ProcessedContent {
// //   text: string;
// //   hasImages: boolean;
// //   imageUrls: string[];
// // }

// // function processContentWithImages(content: string): ProcessedContent {
// //   if (!content) return { text: "", hasImages: false, imageUrls: [] };

// //   const hasImages = containsImage(content);
// //   const imageUrls = hasImages ? extractImageUrls(content) : [];

// //   // Remove image tags but keep the text
// //   let textOnly = content;
// //   if (hasImages) {
// //     const root = parse(content);

// //     // Remove img tags
// //     root.querySelectorAll("img").forEach((img) => {
// //       img.remove();
// //     });

// //     textOnly = root.toString();
// //   }

// //   return {
// //     text: textOnly,
// //     hasImages,
// //     imageUrls,
// //   };
// // }

// // // MODIFIED: Function to process bilingual text inline with image handling
// // function processBilingualTextInline(content: string): ProcessedContent {
// //   if (!content) return { text: "", hasImages: false, imageUrls: [] };

// //   const processed = processContentWithImages(content);
// //   let decoded = decodeHtmlEntities(processed.text);
// //   decoded = decoded.replace(/^<br\/?>\s*/gi, "").trim();

// //   // Check for existing <br/>[Hindi] or <br>[Hindi] format - convert to " / "
// //   const brHindiMatch = decoded.match(/^(.*?)<br\/?>\s*\[Hindi\]\s*(.*)$/s);
// //   if (brHindiMatch) {
// //     const englishPart = renderLatexMath(brHindiMatch[1].trim());
// //     const hindiPart = renderLatexMath(brHindiMatch[2].trim());
// //     return {
// //       text: `${englishPart} / ${hindiPart}`,
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   // Check for standalone [Hindi] marker
// //   const standaloneHindiMatch = decoded.match(/^(.*?)\[Hindi\]\s*(.*)$/s);
// //   if (standaloneHindiMatch && decoded.includes("[Hindi]")) {
// //     const beforeHindi = standaloneHindiMatch[1].trim();
// //     let afterHindi = standaloneHindiMatch[2]
// //       .replace(/^\[Hindi\]\s*/, "")
// //       .trim();
// //     afterHindi = afterHindi.replace(/\[Hindi\]/g, "").trim();

// //     const englishPart = renderLatexMath(beforeHindi);
// //     const hindiPart = renderLatexMath(afterHindi);
// //     return {
// //       text: `${englishPart} / ${hindiPart}`,
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   // Check for original " / " format - already in correct format
// //   if (decoded.includes(" / ")) {
// //     return {
// //       text: renderLatexMath(decoded),
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   // Single language
// //   return {
// //     text: renderLatexMath(decoded),
// //     hasImages: processed.hasImages,
// //     imageUrls: processed.imageUrls,
// //   };
// // }

// // // Function to process solution text with proper headers
// // function processSolutionText(content: string): {
// //   english: string;
// //   hindi?: string;
// //   hasImages: boolean;
// //   imageUrls: string[];
// // } {
// //   if (!content) return { english: "", hasImages: false, imageUrls: [] };

// //   const processed = processContentWithImages(content);
// //   let decoded = decodeHtmlEntities(processed.text);
// //   decoded = decoded.replace(/^<br\/?>\s*/gi, "").trim();
// //   decoded = decoded.replace(/\[English Solution\]/gi, "").trim();

// //   // Check for existing <br/>[Hindi] format
// //   const brHindiMatch = decoded.match(/^(.*?)<br\/?>\s*\[Hindi\]\s*(.*)$/s);
// //   if (brHindiMatch) {
// //     const englishPart = renderLatexMath(brHindiMatch[1].trim());
// //     const hindiPart = renderLatexMath(brHindiMatch[2].trim());
// //     return {
// //       english: englishPart,
// //       hindi: hindiPart,
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   // Check for standalone [Hindi] marker
// //   const standaloneHindiMatch = decoded.match(/^(.*?)\[Hindi\]\s*(.*)$/s);
// //   if (standaloneHindiMatch && decoded.includes("[Hindi]")) {
// //     const beforeHindi = standaloneHindiMatch[1].trim();
// //     let afterHindi = standaloneHindiMatch[2]
// //       .replace(/^\[Hindi\]\s*/, "")
// //       .trim();
// //     afterHindi = afterHindi.replace(/\[Hindi\]/g, "").trim();

// //     const englishPart = renderLatexMath(beforeHindi);
// //     const hindiPart = renderLatexMath(afterHindi);
// //     return {
// //       english: englishPart,
// //       hindi: hindiPart,
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   //  Check for [Hindi Solution] marker
// //   const hindiSolutionMatch = decoded.match(/^(.*?)\[Hindi Solution\]\s*(.*)$/s);
// //   if (hindiSolutionMatch) {
// //     const englishPart = renderLatexMath(hindiSolutionMatch[1].trim());
// //     const hindiPart = renderLatexMath(hindiSolutionMatch[2].trim());
// //     return {
// //       english: englishPart,
// //       hindi: hindiPart,
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   const hindiRegex = /[\u0900-\u097F]+/g;
// //   // Split content into English and Hindi based on Devanagari letters
// //   const hindiMatches = decoded.match(hindiRegex);
// //   if (hindiMatches) {
// //     const hindiPart = renderLatexMath(hindiMatches.join(" ").trim());
// //     const englishPart = renderLatexMath(decoded.replace(hindiRegex, "").trim());
// //     return {
// //       english: englishPart,
// //       hindi: hindiPart,
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   // Check for " / " separator
// //   const slashMatch = decoded.match(/^(.*?)\s+\/\s+(.*)$/s);
// //   if (slashMatch) {
// //     const englishPart = renderLatexMath(slashMatch[1].trim());
// //     const hindiPart = renderLatexMath(slashMatch[2].trim());
// //     return {
// //       english: englishPart,
// //       hindi: hindiPart,
// //       hasImages: processed.hasImages,
// //       imageUrls: processed.imageUrls,
// //     };
// //   }

// //   // Single language
// //   return {
// //     english: renderLatexMath(decoded),
// //     hasImages: processed.hasImages,
// //     imageUrls: processed.imageUrls,
// //   };
// // }

// // // Enhanced HTML cleaning
// // function cleanHtmlContent(content: string): string {
// //   if (!content) return "";

// //   const decoded = decodeHtmlEntities(content);

// //   let cleaned = decoded.replace(/^<br\/?>\s*/gi, "").trim();

// //   let spaced = cleaned
// //     .replace(/<\/(b|strong|i|em|u|span)>/gi, " ")
// //     .replace(/<(b|strong|i|em|u|span)[^>]*>/gi, " ")
// //     .replace(/<\/?(br|p|div)[^>]*>/gi, " ")
// //     .replace(/<[^>]*>/g, "")
// //     .replace(/\s+/g, " ")
// //     .trim();

// //   return spaced;
// // }

// // // Function to create a Word document from questions
// // export function createWordDocument(
// //   questions: Question[],
// //   testName: string
// // ): Document {
// //   const paragraphs: (Paragraph | Table)[] = [];

// //   // // Add title
// //   // paragraphs.push(
// //   //   new Paragraph({
// //   //     text: testName || "Question Bank Export",
// //   //     heading: HeadingLevel.TITLE,
// //   //     alignment: AlignmentType.CENTER,
// //   //     spacing: { after: 400 },
// //   //   })
// //   // );

// //   // Add questions
// //   questions.forEach((question, index) => {
// //     const questionNumber = index + 1;

// //     // Question text - bilingual on same line, no HTML, with image detection
// //     const questionProcessed = processBilingualTextInline(question.question);
// //     const questionText = cleanHtmlContent(questionProcessed.text);

// //     paragraphs.push(
// //       new Paragraph({
// //         children: [
// //           new TextRun({
// //             text: `${questionNumber}. ${questionText}`,
// //             bold: true,
// //             size: 24,
// //           }),
// //         ],
// //         spacing: { before: 200, after: 100 },
// //       })
// //     );

// //     // Add image indicator if question contains images
// //     if (questionProcessed.hasImages) {
// //       paragraphs.push(
// //         new Paragraph({
// //           children: [
// //             new TextRun({
// //               // text: `[Image(s) present in question - ${questionProcessed.imageUrls.length} image(s)]`,
// //               text: `[Image(s) in question image(s)]`,
// //               italics: true,
// //               size: 20,
// //               color: "0000FF",
// //             }),
// //           ],
// //           spacing: { before: 50, after: 50 },
// //           indent: { left: 200 },
// //         })
// //       );

// //       // List image URLs
// //       questionProcessed.imageUrls.forEach((url, idx) => {
// //         paragraphs.push(
// //           new Paragraph({
// //             children: [
// //               new TextRun({
// //                 text: `Image ${idx + 1}: ${url}`,
// //                 size: 18,
// //                 color: "666666",
// //               }),
// //             ],
// //             spacing: { before: 25, after: 25 },
// //             indent: { left: 400 },
// //           })
// //         );
// //       });
// //     }

// //     // Options (A, B, C, D, E) - bilingual on same line, no HTML, with image detection
// //     const options = [
// //       { label: "A", text: question.option1 },
// //       { label: "B", text: question.option2 },
// //       { label: "C", text: question.option3 },
// //       { label: "D", text: question.option4 },
// //       { label: "E", text: question.option5 },
// //     ];

// //     options.forEach((option) => {
// //       if (option.text && option.text.trim()) {
// //         const optionProcessed = processBilingualTextInline(option.text);
// //         const optionText = cleanHtmlContent(optionProcessed.text);

// //         paragraphs.push(
// //           new Paragraph({
// //             children: [
// //               new TextRun({
// //                 text: `${option.label}. ${optionText}`,
// //                 size: 22,
// //               }),
// //             ],
// //             spacing: { before: 50, after: 50 },
// //             indent: { left: 400 },
// //           })
// //         );

// //         // Add image indicator if option contains images
// //         if (optionProcessed.hasImages) {
// //           paragraphs.push(
// //             new Paragraph({
// //               children: [
// //                 new TextRun({
// //                   // text: `[Image(s) in option ${option.label} - ${optionProcessed.imageUrls.length} image(s)]`,
// //                   text: `[Image(s) in option image(s)]`,
// //                   italics: true,
// //                   size: 18,
// //                   color: "0000FF",
// //                 }),
// //               ],
// //               spacing: { before: 25, after: 25 },
// //               indent: { left: 600 },
// //             })
// //           );

// //           // List image URLs
// //           optionProcessed.imageUrls.forEach((url, idx) => {
// //             paragraphs.push(
// //               new Paragraph({
// //                 children: [
// //                   new TextRun({
// //                     text: `Image ${idx + 1}: ${url}`,
// //                     size: 16,
// //                     color: "666666",
// //                   }),
// //                 ],
// //                 spacing: { before: 25, after: 25 },
// //                 indent: { left: 800 },
// //               })
// //             );
// //           });
// //         }
// //       }
// //     });

// //     // Answer
// //     if (question.answer) {
// //       const answerLetter =
// //         ["A", "B", "C", "D", "E"][question.answer - 1] ||
// //         question.answer.toString();
// //       paragraphs.push(
// //         new Paragraph({
// //           children: [
// //             new TextRun({
// //               text: "Answer: ",
// //               bold: false,
// //               size: 22,
// //             }),
// //             new TextRun({
// //               text: answerLetter,
// //               bold: true,
// //               size: 22,
// //               color: "008000",
// //             }),
// //           ],
// //           spacing: { before: 100, after: 100 },
// //         })
// //       );
// //     }

// //     // Solution section: Hindi and English as separate paragraphs, no headers, no HTML, with image detection
// //     if (question.description && question.description.trim()) {
// //       const solutionContent = processSolutionText(question.description);

// //       paragraphs.push(
// //         new Paragraph({
// //           children: [
// //             new TextRun({
// //               text: "Solution.",
// //               bold: false,
// //               size: 22,
// //               color: "8B4513",
// //             }),
// //           ],
// //           spacing: { before: 150, after: 50 },
// //         })
// //       );

// //       // English solution (if exists)
// //       if (solutionContent.english) {
// //         paragraphs.push(
// //           new Paragraph({
// //             children: [
// //               new TextRun({
// //                 text: cleanHtmlContent(solutionContent.english),
// //                 size: 22,
// //               }),
// //             ],
// //             spacing: { after: 100 },
// //           })
// //         );
// //       }

// //       // Hindi solution (if exists)
// //       if (solutionContent.hindi) {
// //         paragraphs.push(
// //           new Paragraph({
// //             children: [
// //               new TextRun({
// //                 text: cleanHtmlContent(solutionContent.hindi),
// //                 size: 22,
// //               }),
// //             ],
// //             spacing: { after: 100 },
// //           })
// //         );
// //       }

// //       // Add image indicator if solution contains images
// //       if (solutionContent.hasImages) {
// //         paragraphs.push(
// //           new Paragraph({
// //             children: [
// //               new TextRun({
// //                 // text: `[Image(s) in solution - ${solutionContent.imageUrls.length} image(s)]`,
// //                 text: `[Image(s) in solution image(s)]`,
// //                 italics: true,
// //                 size: 20,
// //                 color: "0000FF",
// //               }),
// //             ],
// //             spacing: { before: 50, after: 50 },
// //           })
// //         );

// //         // List image URLs
// //         solutionContent.imageUrls.forEach((url, idx) => {
// //           paragraphs.push(
// //             new Paragraph({
// //               children: [
// //                 new TextRun({
// //                   text: `Image ${idx + 1}: ${url}`,
// //                   size: 18,
// //                   color: "666666",
// //                 }),
// //               ],
// //               spacing: { before: 25, after: 25 },
// //               indent: { left: 400 },
// //             })
// //           );
// //         });
// //       }
// //     }

// //     // Add spacing between questions
// //     paragraphs.push(
// //       new Paragraph({
// //         text: "",
// //         spacing: { after: 400 },
// //       })
// //     );
// //   });

// //   return new Document({
// //     sections: [
// //       {
// //         properties: {},
// //         children: paragraphs,
// //       },
// //     ],
// //   });
// // }

// import {
//   Document,
//   Paragraph,
//   TextRun,
//   AlignmentType,
//   HeadingLevel,
//   Packer,
// } from "docx";
// import { Question } from "../shared/schema";
// import { parse } from "node-html-parser";

// // Decode HTML entities
// function decodeHtmlEntities(content: string): string {
//   if (!content) return "";

//   return content
//     .replace(/&amp;quot;/g, '"')
//     .replace(/&amp;amp;/g, "&")
//     .replace(/&amp;lt;/g, "<")
//     .replace(/&amp;gt;/g, ">")
//     .replace(/&amp;nbsp;/g, " ")
//     .replace(/&lt;/g, "<")
//     .replace(/&gt;/g, ">")
//     .replace(/&quot;/g, '"')
//     .replace(/&#39;/g, "'")
//     .replace(/&apos;/g, "'")
//     .replace(/&nbsp;/g, " ")
//     .replace(/&aacute;/g, "á")
//     .replace(/&Aacute;/g, "Á")
//     .replace(/&eacute;/g, "é")
//     .replace(/&Eacute;/g, "É")
//     .replace(/&iacute;/g, "í")
//     .replace(/&Iacute;/g, "Í")
//     .replace(/&oacute;/g, "ó")
//     .replace(/&Oacute;/g, "Ó")
//     .replace(/&uacute;/g, "ú")
//     .replace(/&Uacute;/g, "Ú")
//     .replace(/&ntilde;/g, "ñ")
//     .replace(/&Ntilde;/g, "Ñ")
//     .replace(/&frac14;/g, "¼")
//     .replace(/&frac12;/g, "½")
//     .replace(/&frac34;/g, "¾")
//     .replace(/&frac13;/g, "⅓")
//     .replace(/&frac23;/g, "⅔")
//     .replace(/&agrave;/g, "à")
//     .replace(/&egrave;/g, "è")
//     .replace(/&igrave;/g, "ì")
//     .replace(/&ograve;/g, "ò")
//     .replace(/&ugrave;/g, "ù")
//     .replace(/&acirc;/g, "â")
//     .replace(/&ecirc;/g, "ê")
//     .replace(/&icirc;/g, "î")
//     .replace(/&ocirc;/g, "ô")
//     .replace(/&ucirc;/g, "û")
//     .replace(/&auml;/g, "ä")
//     .replace(/&euml;/g, "ë")
//     .replace(/&iuml;/g, "ï")
//     .replace(/&ouml;/g, "ö")
//     .replace(/&uuml;/g, "ü")
//     .replace(/&yuml;/g, "ÿ")
//     .replace(/&ccedil;/g, "ç")
//     .replace(/&ldquo;/g, '"')
//     .replace(/&rdquo;/g, '"')
//     .replace(/&lsquo;/g, "'")
//     .replace(/&rsquo;/g, "'")
//     .replace(/&mdash;/g, "—")
//     .replace(/&ndash;/g, "–")
//     .replace(/&hellip;/g, "...")
//     .replace(/&zwj;/g, "\u200D")
//     .replace(/&zwnj;/g, "\u200C")
//     .replace(/&copy;/g, "©")
//     .replace(/&reg;/g, "®")
//     .replace(/&trade;/g, "™")
//     .replace(/&deg;/g, "°")
//     .replace(/&bull;/g, "•")
//     .replace(/&#(\d+);/g, (match, code) => {
//       try {
//         const charCode = parseInt(code, 10);
//         if (charCode > 0 && charCode < 1114112) {
//           return String.fromCharCode(charCode);
//         }
//         return "";
//       } catch {
//         return "";
//       }
//     })
//     .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => {
//       try {
//         const charCode = parseInt(code, 16);
//         if (charCode > 0 && charCode < 1114112) {
//           return String.fromCharCode(charCode);
//         }
//         return "";
//       } catch {
//         return "";
//       }
//     })
//     .replace(/&amp;/g, "&");
// }

// // Render LaTeX math to Unicode
// function renderLatexMath(text: string): string {
//   // return text
//   //   .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, "$1½")
//   //   .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, "$1¼")
//   //   .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, "$1¾")
//   //   .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, "½")
//   //   .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, "¼")
//   //   .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, "¾")
//   //   .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, "⅓")
//   //   .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, "⅔")
//   //   .replace(/\\\(\s*\\frac\{([^}]+)\}\{([^}]+)\}\s*\\\)/g, "($1/$2)")
//   //   .replace(/\\\(/g, "")
//   //   .replace(/\\\)/g, "")
//   //   .replace(/\\\[/g, "")
//   //   .replace(/\\\]/g, "");

//   return (
//     text
//       // Mixed numbers with common fractions
//       .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{2\}\s*\\\)/g, "$1½")
//       .replace(/\\\(\s*(\d+)\s+\\frac\{1\}\{4\}\s*\\\)/g, "$1¼")
//       .replace(/\\\(\s*(\d+)\s+\\frac\{3\}\{4\}\s*\\\)/g, "$1¾")

//       // Common fractions (standalone)
//       .replace(/\\\(\s*\\frac\{1\}\{2\}\s*\\\)/g, "½")
//       .replace(/\\\(\s*\\frac\{1\}\{4\}\s*\\\)/g, "¼")
//       .replace(/\\\(\s*\\frac\{3\}\{4\}\s*\\\)/g, "¾")
//       .replace(/\\\(\s*\\frac\{1\}\{3\}\s*\\\)/g, "⅓")
//       .replace(/\\\(\s*\\frac\{2\}\{3\}\s*\\\)/g, "⅔")
//       .replace(/\\\(\s*\\frac\{1\}\{5\}\s*\\\)/g, "⅕")
//       .replace(/\\\(\s*\\frac\{2\}\{5\}\s*\\\)/g, "⅖")
//       .replace(/\\\(\s*\\frac\{3\}\{5\}\s*\\\)/g, "⅗")
//       .replace(/\\\(\s*\\frac\{4\}\{5\}\s*\\\)/g, "⅘")
//       .replace(/\\\(\s*\\frac\{1\}\{6\}\s*\\\)/g, "⅙")
//       .replace(/\\\(\s*\\frac\{5\}\{6\}\s*\\\)/g, "⅚")
//       .replace(/\\\(\s*\\frac\{1\}\{8\}\s*\\\)/g, "⅛")
//       .replace(/\\\(\s*\\frac\{3\}\{8\}\s*\\\)/g, "⅜")
//       .replace(/\\\(\s*\\frac\{5\}\{8\}\s*\\\)/g, "⅝")
//       .replace(/\\\(\s*\\frac\{7\}\{8\}\s*\\\)/g, "⅞")

//       // Superscripts (powers)
//       .replace(/\^\{2\}/g, "²")
//       .replace(/\^\{3\}/g, "³")
//       .replace(/\^\{1\}/g, "¹")
//       .replace(/\^\{0\}/g, "⁰")
//       .replace(/\^\{4\}/g, "⁴")
//       .replace(/\^\{5\}/g, "⁵")
//       .replace(/\^\{6\}/g, "⁶")
//       .replace(/\^\{7\}/g, "⁷")
//       .replace(/\^\{8\}/g, "⁸")
//       .replace(/\^\{9\}/g, "⁹")
//       .replace(/\^\{([^}]+)\}/g, "^($1)")

//       // Square root
//       .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
//       .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, "$1√($2)")

//       // Greek letters (lowercase)
//       .replace(/\\alpha/g, "α")
//       .replace(/\\beta/g, "β")
//       .replace(/\\gamma/g, "γ")
//       .replace(/\\delta/g, "δ")
//       .replace(/\\epsilon/g, "ε")
//       .replace(/\\zeta/g, "ζ")
//       .replace(/\\eta/g, "η")
//       .replace(/\\theta/g, "θ")
//       .replace(/\\iota/g, "ι")
//       .replace(/\\kappa/g, "κ")
//       .replace(/\\lambda/g, "λ")
//       .replace(/\\mu/g, "μ")
//       .replace(/\\nu/g, "ν")
//       .replace(/\\xi/g, "ξ")
//       .replace(/\\pi/g, "π")
//       .replace(/\\rho/g, "ρ")
//       .replace(/\\sigma/g, "σ")
//       .replace(/\\tau/g, "τ")
//       .replace(/\\phi/g, "φ")
//       .replace(/\\chi/g, "χ")
//       .replace(/\\psi/g, "ψ")
//       .replace(/\\omega/g, "ω")

//       // Greek letters (uppercase)
//       .replace(/\\Gamma/g, "Γ")
//       .replace(/\\Delta/g, "Δ")
//       .replace(/\\Theta/g, "Θ")
//       .replace(/\\Lambda/g, "Λ")
//       .replace(/\\Xi/g, "Ξ")
//       .replace(/\\Pi/g, "Π")
//       .replace(/\\Sigma/g, "Σ")
//       .replace(/\\Phi/g, "Φ")
//       .replace(/\\Psi/g, "Ψ")
//       .replace(/\\Omega/g, "Ω")

//       // Mathematical operators and symbols
//       .replace(/\\times/g, "×")
//       .replace(/\\div/g, "÷")
//       .replace(/\\pm/g, "±")
//       .replace(/\\mp/g, "∓")
//       .replace(/\\cdot/g, "·")
//       .replace(/\\leq/g, "≤")
//       .replace(/\\geq/g, "≥")
//       .replace(/\\neq/g, "≠")
//       .replace(/\\approx/g, "≈")
//       .replace(/\\equiv/g, "≡")
//       .replace(/\\sim/g, "∼")
//       .replace(/\\propto/g, "∝")
//       .replace(/\\infty/g, "∞")
//       .replace(/\\partial/g, "∂")
//       .replace(/\\nabla/g, "∇")
//       .replace(/\\sum/g, "∑")
//       .replace(/\\prod/g, "∏")
//       .replace(/\\int/g, "∫")
//       .replace(/\\oint/g, "∮")

//       // Sets and logic
//       .replace(/\\in/g, "∈")
//       .replace(/\\notin/g, "∉")
//       .replace(/\\subset/g, "⊂")
//       .replace(/\\supset/g, "⊃")
//       .replace(/\\subseteq/g, "⊆")
//       .replace(/\\supseteq/g, "⊇")
//       .replace(/\\cup/g, "∪")
//       .replace(/\\cap/g, "∩")
//       .replace(/\\emptyset/g, "∅")
//       .replace(/\\forall/g, "∀")
//       .replace(/\\exists/g, "∃")
//       .replace(/\\neg/g, "¬")
//       .replace(/\\land/g, "∧")
//       .replace(/\\lor/g, "∨")

//       // Arrows
//       .replace(/\\rightarrow/g, "→")
//       .replace(/\\leftarrow/g, "←")
//       .replace(/\\leftrightarrow/g, "↔")
//       .replace(/\\Rightarrow/g, "⇒")
//       .replace(/\\Leftarrow/g, "⇐")
//       .replace(/\\Leftrightarrow/g, "⇔")

//       // Special numbers and constants
//       .replace(/\\mathbb\{R\}/g, "ℝ")
//       .replace(/\\mathbb\{C\}/g, "ℂ")
//       .replace(/\\mathbb\{N\}/g, "ℕ")
//       .replace(/\\mathbb\{Z\}/g, "ℤ")
//       .replace(/\\mathbb\{Q\}/g, "ℚ")

//       // Subscripts
//       .replace(/_\{([^}]+)\}/g, "₍$1₎")
//       .replace(/_(\d)/g, (match, d) => {
//         const subscripts: { [key: string]: string } = {
//           "0": "₀",
//           "1": "₁",
//           "2": "₂",
//           "3": "₃",
//           "4": "₄",
//           "5": "₅",
//           "6": "₆",
//           "7": "₇",
//           "8": "₈",
//           "9": "₉",
//         };
//         return subscripts[d] || match;
//       })

//       // Trigonometric functions
//       .replace(/\\sin/g, "sin")
//       .replace(/\\cos/g, "cos")
//       .replace(/\\tan/g, "tan")
//       .replace(/\\cot/g, "cot")
//       .replace(/\\sec/g, "sec")
//       .replace(/\\csc/g, "csc")

//       // Logarithms
//       .replace(/\\log/g, "log")
//       .replace(/\\ln/g, "ln")

//       // Limits and calculus
//       .replace(/\\lim/g, "lim")
//       .replace(/\\max/g, "max")
//       .replace(/\\min/g, "min")

//       // Generic fractions (must come after specific ones)
//       .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")

//       // Remove LaTeX delimiters
//       .replace(/\\\[/g, "")
//       .replace(/\\\]/g, "")
//       .replace(/\\\(/g, "")
//       .replace(/\\\)/g, "")
//       .replace(/\$\$/g, "")
//       .replace(/\$/g, "")

//       // Clean up extra spaces
//       .replace(/\s+/g, " ")
//       .trim()
//   );
// }

// // Check if content contains images
// function containsImage(content: string): boolean {
//   if (!content) return false;
//   return (
//     /<img[^>]*>/gi.test(content) ||
//     /data:image\/[^;]+;base64,/gi.test(content) ||
//     /\.(jpg|jpeg|png|gif|bmp|svg|webp)/gi.test(content)
//   );
// }

// // Extract image URLs
// function extractImageUrls(content: string): string[] {
//   if (!content) return [];
//   const urls: string[] = [];
//   const root = parse(content);
//   const imgTags = root.querySelectorAll("img");
//   imgTags.forEach((img) => {
//     const src = img.getAttribute("src");
//     if (src) urls.push(src);
//   });
//   return urls;
// }

// // Clean HTML content
// function cleanHtmlContent(content: string): string {
//   if (!content) return "";

//   const decoded = decodeHtmlEntities(content);
//   const root = parse(decoded);

//   // Remove all img tags
//   root.querySelectorAll("img").forEach((img) => img.remove());

//   // Get text content
//   let text = root.textContent || "";

//   // Clean up whitespace
//   text = text.replace(/\s+/g, " ").replace(/\n\s+/g, "\n").trim();

//   return renderLatexMath(text);
// }

// // Process bilingual content - keep English and Hindi separate
// function processBilingualText(content: string): {
//   english: string;
//   hindi: string;
// } {
//   if (!content) return { english: "", hindi: "" };

//   const decoded = decodeHtmlEntities(content);
//   const root = parse(decoded);

//   // Remove all img tags
//   root.querySelectorAll("img").forEach((img) => img.remove());

//   let text = root.textContent || "";
//   text = text.replace(/\s+/g, " ").trim();

//   text = text.replace(/\[English Solution\]/gi, "").trim();
//   text = renderLatexMath(text);

//   // Check for <br/>[Hindi] or <br>[Hindi] format
//   const brHindiMatch = text.match(/^(.*?)<br\/?>\s*\[Hindi\]\s*(.*)$/s);
//   if (brHindiMatch) {
//     return {
//       english: brHindiMatch[1].trim(),
//       hindi: brHindiMatch[2].trim(),
//     };
//   }

//   // Check for standalone [Hindi] marker
//   const standaloneHindiMatch = text.match(/^(.*?)\[Hindi\]\s*(.*)$/s);
//   if (standaloneHindiMatch && text.includes("[Hindi]")) {
//     const beforeHindi = standaloneHindiMatch[1].trim();
//     let afterHindi = standaloneHindiMatch[2]
//       .replace(/^\[Hindi\]\s*/, "")
//       .trim();
//     afterHindi = afterHindi.replace(/\[Hindi\]/g, "").trim();
//     return {
//       english: beforeHindi,
//       hindi: afterHindi,
//     };
//   }

//   // Check for " / " separator
//   const slashMatch = text.match(/^(.*?)\s+\/\s+(.*)$/s);
//   if (slashMatch) {
//     return {
//       english: slashMatch[1].trim(),
//       hindi: slashMatch[2].trim(),
//     };
//   }

//   // //Check for [Hindi Solution] marker
//   // const hindiSolutionMatch = text.match(/^(.*?)\[Hindi Solution\]\s*(.*)$/s);
//   // if (hindiSolutionMatch) {
//   //   return {
//   //     english: hindiSolutionMatch[1].trim(),
//   //     hindi: hindiSolutionMatch[2].trim(),
//   //   };
//   // }

//   // const hindiSolutionMatch2 = text.match(/^(-*?)\[Hindi Solution\]\s*(.*)$/s);
//   // if (hindiSolutionMatch2) {
//   //   return {
//   //     english: hindiSolutionMatch2[1].trim(),
//   //     hindi: hindiSolutionMatch2[2].trim(),
//   //   };
//   // }

//   const dashedHindiSolutionMatch = text.match(
//     /^(.*?)\s*[-.]*\s*\[hindi solution\]\s*(.*)$/is
//   );
//   if (dashedHindiSolutionMatch) {
//     return {
//       english: dashedHindiSolutionMatch[1].trim(),
//       hindi: dashedHindiSolutionMatch[2].trim(),
//     };
//   }

//   // Check for plain [Hindi Solution] marker
//   const hindiSolutionMatch = text.match(/^(.*?)\[Hindi Solution\]\s*(.*)$/is);
//   if (hindiSolutionMatch) {
//     return {
//       english: hindiSolutionMatch[1].trim(),
//       hindi: hindiSolutionMatch[2].trim(),
//     };
//   }

//   // Detect Devanagari script for Hindi
//   const hindiRegex = /[\u0900-\u097F]+/g;
//   const hindiMatches = text.match(hindiRegex);
//   if (hindiMatches) {
//     const hindiPart = hindiMatches.join(" ").trim();
//     const englishPart = text.replace(hindiRegex, "").trim();
//     return {
//       english: englishPart,
//       hindi: hindiPart,
//     };
//   }

//   // Single language (assume English)
//   return { english: text, hindi: "" };
// }

// // LMS-COMPATIBLE: Pure text format without tables
// export function createWordDocument(
//   questions: Question[],
//   testName: string
// ): Document {
//   const paragraphs: Paragraph[] = [];

//   // // Title
//   // paragraphs.push(
//   //   new Paragraph({
//   //     text: testName || "Question Bank Export",
//   //     heading: HeadingLevel.HEADING_1,
//   //     alignment: AlignmentType.CENTER,
//   //     spacing: { after: 200 },
//   //   })
//   // );

//   // // Total questions
//   // paragraphs.push(
//   //   new Paragraph({
//   //     text: `Total Questions: ${questions.length}`,
//   //     alignment: AlignmentType.CENTER,
//   //     spacing: { after: 400 },
//   //   })
//   // );

//   // // Empty line for spacing
//   // paragraphs.push(
//   //   new Paragraph({
//   //     text: "",
//   //     spacing: { after: 300 },
//   //   })
//   // );

//   // Process each question as pure text
//   questions.forEach((question, index) => {
//     const qNum = index + 1;

//     // Question number header
//     paragraphs.push(
//       new Paragraph({
//         children: [
//           new TextRun({
//             text: `${qNum}.`,
//             bold: true,
//             size: 26,
//           }),
//         ],
//         spacing: { before: 200, after: 100 },
//       })
//     );

//     // Question text with English and Hindi separate
//     const questionProcessed = processBilingualText(question.question);

//     // English question
//     if (questionProcessed.english) {
//       paragraphs.push(
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: questionProcessed.english,
//               size: 24,
//             }),
//           ],
//           spacing: { after: 100 },
//         })
//       );
//     }

//     // Hindi question (if exists)
//     if (questionProcessed.hindi) {
//       paragraphs.push(
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: questionProcessed.hindi,
//               size: 24,
//             }),
//           ],
//           spacing: { after: 150 },
//         })
//       );
//     }

//     // Question images (if any)
//     const hasQuestionImage = containsImage(question.question);
//     if (hasQuestionImage) {
//       const questionImages = extractImageUrls(question.question);
//       questionImages.forEach((url, idx) => {
//         paragraphs.push(
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: `[Question Image ${idx + 1}: ${url}]`,
//                 size: 20,
//                 color: "0000FF",
//                 italics: true,
//               }),
//             ],
//             spacing: { before: 50, after: 50 },
//           })
//         );
//       });
//     }

//     // // Options header
//     // paragraphs.push(
//     //   new Paragraph({
//     //     text: "",
//     //     spacing: { before: 100 },
//     //   })
//     // );

//     // // Options
//     // const options = [
//     //   { label: "A", text: question.option1 },
//     //   { label: "B", text: question.option2 },
//     //   { label: "C", text: question.option3 },
//     //   { label: "D", text: question.option4 },
//     //   { label: "E", text: question.option5 },
//     // ];

//     // options.forEach((opt) => {
//     //   if (opt.text && opt.text.trim()) {
//     //     const optionProcessed = processBilingualText(opt.text);

//     //     // English option
//     //     if (optionProcessed.english) {
//     //       paragraphs.push(
//     //         new Paragraph({
//     //           children: [
//     //             new TextRun({
//     //               text: `${opt.label}) `,
//     //               bold: true,
//     //               size: 24,
//     //             }),
//     //             new TextRun({
//     //               text: optionProcessed.english,
//     //               size: 24,
//     //             }),
//     //           ],
//     //           // spacing: { before: 80, after: 50 },
//     //         })
//     //       );
//     //     }

//     //     // Hindi option (if exists)
//     //     if (optionProcessed.hindi) {
//     //       paragraphs.push(
//     //         new Paragraph({
//     //           children: [
//     //             new TextRun({
//     //               text: optionProcessed.hindi,
//     //               size: 24,
//     //             }),
//     //           ],
//     //           spacing: { after: 80 },
//     //           indent: { left: 360 },
//     //         })
//     //       );
//     //     }

//     //     // Option images (if any)
//     //     const hasOptImage = containsImage(opt.text);
//     //     if (hasOptImage) {
//     //       const optImages = extractImageUrls(opt.text);
//     //       optImages.forEach((url, idx) => {
//     //         paragraphs.push(
//     //           new Paragraph({
//     //             children: [
//     //               new TextRun({
//     //                 text: `   [Option ${opt.label} Image ${idx + 1}: ${url}]`,
//     //                 size: 18,
//     //                 color: "0000FF",
//     //                 italics: true,
//     //               }),
//     //             ],
//     //             spacing: { before: 30, after: 30 },
//     //           })
//     //         );
//     //       });
//     //     }
//     //   }
//     // });

//     // Options
//     const options = [
//       { label: "A", text: question.option1 },
//       { label: "B", text: question.option2 },
//       { label: "C", text: question.option3 },
//       { label: "D", text: question.option4 },
//       { label: "E", text: question.option5 },
//     ];

//     options.forEach((opt) => {
//       if (opt.text && opt.text.trim()) {
//         const optionProcessed = processBilingualText(opt.text);

//         // Combine English and Hindi on one line with " / " separator
//         let optionText = optionProcessed.english;
//         if (optionProcessed.hindi) {
//           optionText = `${optionProcessed.english} / ${optionProcessed.hindi}`;
//         }

//         paragraphs.push(
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: `${opt.label}. `,
//                 bold: true,
//                 size: 24,
//               }),
//               new TextRun({
//                 text: optionText,
//                 size: 24,
//               }),
//             ],
//             spacing: { before: 80, after: 80 },
//           })
//         );

//         // Option images (if any)
//         const hasOptImage = containsImage(opt.text);
//         if (hasOptImage) {
//           const optImages = extractImageUrls(opt.text);
//           optImages.forEach((url, idx) => {
//             paragraphs.push(
//               new Paragraph({
//                 children: [
//                   new TextRun({
//                     text: `   [Option ${opt.label} Image ${idx + 1}: ${url}]`,
//                     size: 18,
//                     color: "0000FF",
//                     italics: true,
//                   }),
//                 ],
//                 spacing: { before: 30, after: 30 },
//               })
//             );
//           });
//         }
//       }
//     });

//     // Correct Answer
//     if (question.answer) {
//       const answerLetter =
//         ["A", "B", "C", "D", "E"][question.answer - 1] ||
//         question.answer.toString();

//       paragraphs.push(
//         new Paragraph({
//           text: "",
//           spacing: { before: 150 },
//         })
//       );

//       paragraphs.push(
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: "Answer: ",
//               bold: true,
//               size: 24,
//             }),
//             new TextRun({
//               text: answerLetter,
//               bold: true,
//               size: 26,
//               color: "008000",
//             }),
//           ],
//           spacing: { after: 150 },
//         })
//       );
//     }

//     // Explanation
//     if (question.description && question.description.trim()) {
//       const explanationProcessed = processBilingualText(question.description);

//       paragraphs.push(
//         new Paragraph({
//           children: [
//             new TextRun({
//               text: "Solution:",
//               bold: true,
//               size: 24,
//             }),
//           ],
//           spacing: { before: 100, after: 100 },
//         })
//       );

//       // English explanation
//       if (explanationProcessed.english) {
//         paragraphs.push(
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: explanationProcessed.english,
//                 size: 24,
//               }),
//             ],
//             spacing: { after: 100 },
//           })
//         );
//       }

//       // Hindi explanation (if exists)
//       if (explanationProcessed.hindi) {
//         paragraphs.push(
//           new Paragraph({
//             children: [
//               new TextRun({
//                 text: explanationProcessed.hindi,
//                 size: 24,
//               }),
//             ],
//             spacing: { after: 100 },
//           })
//         );
//       }

//       // Solution images (if any)
//       const hasSolImage = containsImage(question.description);
//       if (hasSolImage) {
//         const solImages = extractImageUrls(question.description);
//         solImages.forEach((url, idx) => {
//           paragraphs.push(
//             new Paragraph({
//               children: [
//                 new TextRun({
//                   text: `[Explanation Image ${idx + 1}: ${url}]`,
//                   size: 20,
//                   color: "0000FF",
//                   italics: true,
//                 }),
//               ],
//               spacing: { before: 50, after: 50 },
//             })
//           );
//         });
//       }
//     }

//     // Empty line between questions
//     paragraphs.push(
//       new Paragraph({
//         text: "",
//         spacing: { before: 300, after: 300 },
//       })
//     );
//   });

//   // Empty line at the end
//   paragraphs.push(
//     new Paragraph({
//       text: "",
//       spacing: { before: 200, after: 100 },
//     })
//   );

//   // Create simple document with only paragraphs
//   return new Document({
//     sections: [
//       {
//         properties: {
//           page: {
//             margin: {
//               top: 1440, // 1 inch
//               right: 1440, // 1 inch
//               bottom: 1440, // 1 inch
//               left: 1440, // 1 inch
//             },
//           },
//         },
//         children: paragraphs,
//       },
//     ],
//   });
// }

// // Export helper function for saving the document
// export async function saveWordDocument(
//   doc: Document,
//   filename: string
// ): Promise<Blob> {
//   const blob = await Packer.toBlob(doc);
//   return blob;
// }

// 3rd=------------------------------------------------------------------------------------------------------------------------------------------------

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Packer,
} from "docx";
import { Question } from "../shared/schema";
import { parse } from "node-html-parser";
import katex from "katex";

// Decode HTML entities
function decodeHtmlEntities(content: string): string {
  if (!content) return "";

  return content
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;amp;/g, "&")
    .replace(/&amp;lt;/g, "<")
    .replace(/&amp;gt;/g, ">")
    .replace(/&amp;nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&aacute;/g, "á")
    .replace(/&Aacute;/g, "Á")
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&iacute;/g, "í")
    .replace(/&Iacute;/g, "Í")
    .replace(/&oacute;/g, "ó")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&Ntilde;/g, "Ñ")
    .replace(/&frac14;/g, "¼")
    .replace(/&frac12;/g, "½")
    .replace(/&frac34;/g, "¾")
    .replace(/&frac13;/g, "⅓")
    .replace(/&frac23;/g, "⅔")
    .replace(/&agrave;/g, "à")
    .replace(/&egrave;/g, "è")
    .replace(/&igrave;/g, "ì")
    .replace(/&ograve;/g, "ò")
    .replace(/&ugrave;/g, "ù")
    .replace(/&acirc;/g, "â")
    .replace(/&ecirc;/g, "ê")
    .replace(/&icirc;/g, "î")
    .replace(/&ocirc;/g, "ô")
    .replace(/&ucirc;/g, "û")
    .replace(/&auml;/g, "ä")
    .replace(/&euml;/g, "ë")
    .replace(/&iuml;/g, "ï")
    .replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü")
    .replace(/&yuml;/g, "ÿ")
    .replace(/&ccedil;/g, "ç")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "...")
    .replace(/&zwj;/g, "\u200D")
    .replace(/&zwnj;/g, "\u200C")
    .replace(/&copy;/g, "©")
    .replace(/&reg;/g, "®")
    .replace(/&trade;/g, "™")
    .replace(/&deg;/g, "°")
    .replace(/&bull;/g, "•")
    .replace(/&#(\d+);/g, (match, code) => {
      try {
        const charCode = parseInt(code, 10);
        if (charCode > 0 && charCode < 1114112) {
          return String.fromCharCode(charCode);
        }
        return "";
      } catch {
        return "";
      }
    })
    .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => {
      try {
        const charCode = parseInt(code, 16);
        if (charCode > 0 && charCode < 1114112) {
          return String.fromCharCode(charCode);
        }
        return "";
      } catch {
        return "";
      }
    })
    .replace(/&amp;/g, "&");
}

// Helper function to convert KaTeX HTML to plain text with Unicode
function katexHtmlToText(html: string): string {
  if (!html) return "";

  // Parse the HTML
  const root = parse(html);

  // Extract text content
  let text = root.textContent || "";

  // Clean up extra spaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Render LaTeX math using KaTeX and convert to Unicode text
function renderLatexMath(text: string): string {
  if (!text) return "";

  try {
    // Handle inline math \( ... \)
    text = text.replace(/\\\((.*?)\\\)/g, (match, latex) => {
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          output: "html",
          displayMode: false,
        });
        return katexHtmlToText(html);
      } catch (e) {
        console.error("KaTeX error for inline math:", e);
        // Fallback to manual parsing
        return manualLatexParse(latex);
      }
    });

    // Handle display math \[ ... \]
    text = text.replace(/\\\[(.*?)\\\]/g, (match, latex) => {
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          output: "html",
          displayMode: true,
        });
        return katexHtmlToText(html);
      } catch (e) {
        console.error("KaTeX error for display math:", e);
        return manualLatexParse(latex);
      }
    });

    // Handle inline $ ... $
    text = text.replace(/\$([^\$]+)\$/g, (match, latex) => {
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          output: "html",
          displayMode: false,
        });
        return katexHtmlToText(html);
      } catch (e) {
        console.error("KaTeX error for $ math:", e);
        return manualLatexParse(latex);
      }
    });

    // Handle display $$ ... $$
    text = text.replace(/\$\$(.*?)\$\$/g, (match, latex) => {
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          output: "html",
          displayMode: true,
        });
        return katexHtmlToText(html);
      } catch (e) {
        console.error("KaTeX error for $$ math:", e);
        return manualLatexParse(latex);
      }
    });

    return text;
  } catch (error) {
    console.error("Error rendering LaTeX:", error);
    return text;
  }
}

// Manual fallback parser for cases where KaTeX fails
function manualLatexParse(text: string): string {
  return (
    text
      // Text formatting commands
      .replace(/\\rm\{([^}]+)\}/g, "$1")
      .replace(/\\rm\s+/g, "")
      .replace(/\\text\{([^}]+)\}/g, "$1")
      .replace(/\\mathrm\{([^}]+)\}/g, "$1")

      // Spacing commands
      .replace(/\\;/g, " ")
      .replace(/\\,/g, " ")
      .replace(/\\:/g, " ")
      .replace(/\\!/g, "")
      .replace(/\\quad/g, "  ")
      .replace(/\\qquad/g, "    ")

      // Special symbols
      .replace(/\\%/g, "%")

      // Parentheses and brackets
      .replace(/\\left\(/g, "(")
      .replace(/\\right\)/g, ")")
      .replace(/\\left\[/g, "[")
      .replace(/\\right\]/g, "]")
      .replace(/\\left\{/g, "{")
      .replace(/\\right\}/g, "}")
      .replace(/\\left\|/g, "|")
      .replace(/\\right\|/g, "|")

      // Mixed numbers with common fractions
      .replace(/(\d+)\s*\\frac\{1\}\{2\}/g, "$1½")
      .replace(/(\d+)\s*\\frac\{1\}\{4\}/g, "$1¼")
      .replace(/(\d+)\s*\\frac\{3\}\{4\}/g, "$1¾")

      // Common fractions (standalone)
      .replace(/\\frac\{1\}\{2\}/g, "½")
      .replace(/\\frac\{1\}\{4\}/g, "¼")
      .replace(/\\frac\{3\}\{4\}/g, "¾")
      .replace(/\\frac\{1\}\{3\}/g, "⅓")
      .replace(/\\frac\{2\}\{3\}/g, "⅔")
      .replace(/\\frac\{1\}\{5\}/g, "⅕")
      .replace(/\\frac\{2\}\{5\}/g, "⅖")
      .replace(/\\frac\{3\}\{5\}/g, "⅗")
      .replace(/\\frac\{4\}\{5\}/g, "⅘")
      .replace(/\\frac\{1\}\{6\}/g, "⅙")
      .replace(/\\frac\{5\}\{6\}/g, "⅚")
      .replace(/\\frac\{1\}\{8\}/g, "⅛")
      .replace(/\\frac\{3\}\{8\}/g, "⅜")
      .replace(/\\frac\{5\}\{8\}/g, "⅝")
      .replace(/\\frac\{7\}\{8\}/g, "⅞")

      // Superscripts (powers)
      .replace(/\^\{2\}/g, "²")
      .replace(/\^\{3\}/g, "³")
      .replace(/\^\{1\}/g, "¹")
      .replace(/\^\{0\}/g, "⁰")
      .replace(/\^\{4\}/g, "⁴")
      .replace(/\^\{5\}/g, "⁵")
      .replace(/\^\{6\}/g, "⁶")
      .replace(/\^\{7\}/g, "⁷")
      .replace(/\^\{8\}/g, "⁸")
      .replace(/\^\{9\}/g, "⁹")
      .replace(/\^\{([^}]+)\}/g, "^($1)")

      // Square root
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, "$1√($2)")

      // Greek letters (lowercase)
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\epsilon/g, "ε")
      .replace(/\\zeta/g, "ζ")
      .replace(/\\eta/g, "η")
      .replace(/\\theta/g, "θ")
      .replace(/\\iota/g, "ι")
      .replace(/\\kappa/g, "κ")
      .replace(/\\lambda/g, "λ")
      .replace(/\\mu/g, "μ")
      .replace(/\\nu/g, "ν")
      .replace(/\\xi/g, "ξ")
      .replace(/\\pi/g, "π")
      .replace(/\\rho/g, "ρ")
      .replace(/\\sigma/g, "σ")
      .replace(/\\tau/g, "τ")
      .replace(/\\phi/g, "φ")
      .replace(/\\chi/g, "χ")
      .replace(/\\psi/g, "ψ")
      .replace(/\\omega/g, "ω")

      // Greek letters (uppercase)
      .replace(/\\Gamma/g, "Γ")
      .replace(/\\Delta/g, "Δ")
      .replace(/\\Theta/g, "Θ")
      .replace(/\\Lambda/g, "Λ")
      .replace(/\\Xi/g, "Ξ")
      .replace(/\\Pi/g, "Π")
      .replace(/\\Sigma/g, "Σ")
      .replace(/\\Phi/g, "Φ")
      .replace(/\\Psi/g, "Ψ")
      .replace(/\\Omega/g, "Ω")

      // Mathematical operators and symbols
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\pm/g, "±")
      .replace(/\\mp/g, "∓")
      .replace(/\\cdot/g, "·")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\approx/g, "≈")
      .replace(/\\equiv/g, "≡")
      .replace(/\\sim/g, "∼")
      .replace(/\\propto/g, "∝")
      .replace(/\\infty/g, "∞")
      .replace(/\\partial/g, "∂")
      .replace(/\\nabla/g, "∇")
      .replace(/\\sum/g, "∑")
      .replace(/\\prod/g, "∏")
      .replace(/\\int/g, "∫")
      .replace(/\\oint/g, "∮")

      // Sets and logic
      .replace(/\\in/g, "∈")
      .replace(/\\notin/g, "∉")
      .replace(/\\subset/g, "⊂")
      .replace(/\\supset/g, "⊃")
      .replace(/\\subseteq/g, "⊆")
      .replace(/\\supseteq/g, "⊇")
      .replace(/\\cup/g, "∪")
      .replace(/\\cap/g, "∩")
      .replace(/\\emptyset/g, "∅")
      .replace(/\\forall/g, "∀")
      .replace(/\\exists/g, "∃")
      .replace(/\\neg/g, "¬")
      .replace(/\\land/g, "∧")
      .replace(/\\lor/g, "∨")

      // Arrows
      .replace(/\\rightarrow/g, "→")
      .replace(/\\leftarrow/g, "←")
      .replace(/\\leftrightarrow/g, "↔")
      .replace(/\\Rightarrow/g, "⇒")
      .replace(/\\Leftarrow/g, "⇐")
      .replace(/\\Leftrightarrow/g, "⇔")

      // Special numbers and constants
      .replace(/\\mathbb\{R\}/g, "ℝ")
      .replace(/\\mathbb\{C\}/g, "ℂ")
      .replace(/\\mathbb\{N\}/g, "ℕ")
      .replace(/\\mathbb\{Z\}/g, "ℤ")
      .replace(/\\mathbb\{Q\}/g, "ℚ")

      // Subscripts
      .replace(/_\{([^}]+)\}/g, "₍$1₎")
      .replace(/_(\d)/g, (match, d) => {
        const subscripts: { [key: string]: string } = {
          "0": "₀",
          "1": "₁",
          "2": "₂",
          "3": "₃",
          "4": "₄",
          "5": "₅",
          "6": "₆",
          "7": "₇",
          "8": "₈",
          "9": "₉",
        };
        return subscripts[d] || match;
      })

      // Trigonometric functions
      .replace(/\\sin/g, "sin")
      .replace(/\\cos/g, "cos")
      .replace(/\\tan/g, "tan")
      .replace(/\\cot/g, "cot")
      .replace(/\\sec/g, "sec")
      .replace(/\\csc/g, "csc")

      // Logarithms
      .replace(/\\log/g, "log")
      .replace(/\\ln/g, "ln")

      // Limits and calculus
      .replace(/\\lim/g, "lim")
      .replace(/\\max/g, "max")
      .replace(/\\min/g, "min")

      // Generic fractions (must come after specific ones)
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1/$2)")

      // Clean up extra spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Check if content contains images
function containsImage(content: string): boolean {
  if (!content) return false;
  return (
    /<img[^>]*>/gi.test(content) ||
    /data:image\/[^;]+;base64,/gi.test(content) ||
    /\.(jpg|jpeg|png|gif|bmp|svg|webp)/gi.test(content)
  );
}

// Extract image URLs
function extractImageUrls(content: string): string[] {
  if (!content) return [];
  const urls: string[] = [];
  const root = parse(content);
  const imgTags = root.querySelectorAll("img");
  imgTags.forEach((img) => {
    const src = img.getAttribute("src");
    if (src) urls.push(src);
  });
  return urls;
}

// Clean HTML content
function cleanHtmlContent(content: string): string {
  if (!content) return "";

  const decoded = decodeHtmlEntities(content);
  const root = parse(decoded);

  // Remove all img tags
  root.querySelectorAll("img").forEach((img) => img.remove());

  // Get text content
  let text = root.textContent || "";

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").replace(/\n\s+/g, "\n").trim();

  return renderLatexMath(text);
}

// Process bilingual content - keep English and Hindi separate
function processBilingualText(content: string): {
  english: string;
  hindi: string;
} {
  if (!content) return { english: "", hindi: "" };

  const decoded = decodeHtmlEntities(content);
  const root = parse(decoded);

  // Remove all img tags
  root.querySelectorAll("img").forEach((img) => img.remove());

  let text = root.textContent || "";
  text = text.replace(/\s+/g, " ").trim();

  text = text.replace(/\[English Solution\]/gi, "").trim();
  text = renderLatexMath(text);

  // Check for <br/>[Hindi] or <br>[Hindi] format
  const brHindiMatch = text.match(/^(.*?)<br\/?>\s*\[Hindi\]\s*(.*)$/s);
  if (brHindiMatch) {
    return {
      english: brHindiMatch[1].trim(),
      hindi: brHindiMatch[2].trim(),
    };
  }

  // Check for standalone [Hindi] marker
  const standaloneHindiMatch = text.match(/^(.*?)\[Hindi\]\s*(.*)$/s);
  if (standaloneHindiMatch && text.includes("[Hindi]")) {
    const beforeHindi = standaloneHindiMatch[1].trim();
    let afterHindi = standaloneHindiMatch[2]
      .replace(/^\[Hindi\]\s*/, "")
      .trim();
    afterHindi = afterHindi.replace(/\[Hindi\]/g, "").trim();
    return {
      english: beforeHindi,
      hindi: afterHindi,
    };
  }

  // Check for " / " separator
  const slashMatch = text.match(/^(.*?)\s+\/\s+(.*)$/s);
  if (slashMatch) {
    return {
      english: slashMatch[1].trim(),
      hindi: slashMatch[2].trim(),
    };
  }

  const dashedHindiSolutionMatch = text.match(
    /^(.*?)\s*[-.]*\s*\[hindi solution\]\s*(.*)$/is
  );
  if (dashedHindiSolutionMatch) {
    return {
      english: dashedHindiSolutionMatch[1].trim(),
      hindi: dashedHindiSolutionMatch[2].trim(),
    };
  }

  // Check for plain [Hindi Solution] marker
  const hindiSolutionMatch = text.match(/^(.*?)\[Hindi Solution\]\s*(.*)$/is);
  if (hindiSolutionMatch) {
    return {
      english: hindiSolutionMatch[1].trim(),
      hindi: hindiSolutionMatch[2].trim(),
    };
  }

  // Detect Devanagari script for Hindi
  const hindiRegex = /[\u0900-\u097F]+/g;
  const hindiMatches = text.match(hindiRegex);
  if (hindiMatches) {
    const hindiPart = hindiMatches.join(" ").trim();
    const englishPart = text.replace(hindiRegex, "").trim();
    return {
      english: englishPart,
      hindi: hindiPart,
    };
  }

  // Single language (assume English)
  return { english: text, hindi: "" };
}

// LMS-COMPATIBLE: Pure text format without tables
export function createWordDocument(
  questions: Question[],
  testName: string
): Document {
  const paragraphs: Paragraph[] = [];

  // Process each question as pure text
  questions.forEach((question, index) => {
    const qNum = index + 1;

    // Question number header
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${qNum}.`,
            bold: true,
            size: 26,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    // Question text with English and Hindi separate
    const questionProcessed = processBilingualText(question.question);

    // English question
    if (questionProcessed.english) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: questionProcessed.english,
              size: 24,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Hindi question (if exists)
    if (questionProcessed.hindi) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: questionProcessed.hindi,
              size: 24,
            }),
          ],
          spacing: { after: 150 },
        })
      );
    }

    // Question images (if any)
    const hasQuestionImage = containsImage(question.question);
    if (hasQuestionImage) {
      const questionImages = extractImageUrls(question.question);
      questionImages.forEach((url, idx) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Question Image ${idx + 1}: ${url}]`,
                size: 20,
                color: "0000FF",
                italics: true,
              }),
            ],
            spacing: { before: 50, after: 50 },
          })
        );
      });
    }

    // Options
    const options = [
      { label: "A", text: question.option1 },
      { label: "B", text: question.option2 },
      { label: "C", text: question.option3 },
      { label: "D", text: question.option4 },
      { label: "E", text: question.option5 },
    ];

    options.forEach((opt) => {
      if (opt.text && opt.text.trim()) {
        const optionProcessed = processBilingualText(opt.text);

        // Combine English and Hindi on one line with " / " separator
        let optionText = optionProcessed.english;
        if (optionProcessed.hindi) {
          optionText = `${optionProcessed.english} / ${optionProcessed.hindi}`;
        }

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${opt.label}. `,
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: optionText,
                size: 24,
              }),
            ],
            spacing: { before: 80, after: 80 },
          })
        );

        // Option images (if any)
        const hasOptImage = containsImage(opt.text);
        if (hasOptImage) {
          const optImages = extractImageUrls(opt.text);
          optImages.forEach((url, idx) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `   [Option ${opt.label} Image ${idx + 1}: ${url}]`,
                    size: 18,
                    color: "0000FF",
                    italics: true,
                  }),
                ],
                spacing: { before: 30, after: 30 },
              })
            );
          });
        }
      }
    });

    // Correct Answer
    if (question.answer) {
      const answerLetter =
        ["A", "B", "C", "D", "E"][question.answer - 1] ||
        question.answer.toString();

      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { before: 150 },
        })
      );

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Answer: ",
              bold: true,
              size: 24,
            }),
            new TextRun({
              text: answerLetter,
              bold: true,
              size: 26,
              color: "008000",
            }),
          ],
          spacing: { after: 150 },
        })
      );
    }

    // Explanation
    if (question.description && question.description.trim()) {
      const explanationProcessed = processBilingualText(question.description);

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Solution:",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );

      // English explanation
      if (explanationProcessed.english) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: explanationProcessed.english,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Hindi explanation (if exists)
      if (explanationProcessed.hindi) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: explanationProcessed.hindi,
                size: 24,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Solution images (if any)
      const hasSolImage = containsImage(question.description);
      if (hasSolImage) {
        const solImages = extractImageUrls(question.description);
        solImages.forEach((url, idx) => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Explanation Image ${idx + 1}: ${url}]`,
                  size: 20,
                  color: "0000FF",
                  italics: true,
                }),
              ],
              spacing: { before: 50, after: 50 },
            })
          );
        });
      }
    }

    // Empty line between questions
    paragraphs.push(
      new Paragraph({
        text: "",
        spacing: { before: 300, after: 300 },
      })
    );
  });

  // Empty line at the end
  paragraphs.push(
    new Paragraph({
      text: "",
      spacing: { before: 200, after: 100 },
    })
  );

  // Create simple document with only paragraphs
  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440, // 1 inch
              bottom: 1440, // 1 inch
              left: 1440, // 1 inch
            },
          },
        },
        children: paragraphs,
      },
    ],
  });
}

// Export helper function for saving the document
export async function saveWordDocument(
  doc: Document,
  filename: string
): Promise<Blob> {
  const blob = await Packer.toBlob(doc);
  return blob;
}
