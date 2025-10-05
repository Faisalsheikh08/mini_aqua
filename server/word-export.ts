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
