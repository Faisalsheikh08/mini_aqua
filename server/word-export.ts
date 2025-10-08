// Enhanced LaTeX to Unicode conversion for Word export
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
import { replacements } from "./replacement.ts";

// Subscript/Superscript mappings
const subsuperscripts: [string, string][] = [
  ["_x", "ₓ"],
  ["_v", "ᵥ"],
  ["_u", "ᵤ"],
  ["_t", "ₜ"],
  ["_s", "ₛ"],
  ["_r", "ᵣ"],
  ["_p", "ₚ"],
  ["_o", "ₒ"],
  ["_n", "ₙ"],
  ["_m", "ₘ"],
  ["_l", "ₗ"],
  ["_k", "ₖ"],
  ["_j", "ⱼ"],
  ["_i", "ᵢ"],
  ["_h", "ₕ"],
  ["_e", "ₑ"],
  ["_a", "ₐ"],
  ["_>", "˲"],
  ["_=", "₌"],
  ["_<", "˱"],
  ["_9", "₉"],
  ["_8", "₈"],
  ["_7", "₇"],
  ["_6", "₆"],
  ["_5", "₅"],
  ["_4", "₄"],
  ["_3", "₃"],
  ["_2", "₂"],
  ["_1", "₁"],
  ["_0", "₀"],
  ["_-", "₋"],
  ["_−", "₋"],
  ["_+", "₊"],
  ["_)", "₎"],
  ["_(", "₍"],
  ["_ρ", "ᵨ"],
  ["_χ", "ᵪ"],
  ["_φ", "ᵩ"],
  ["_β", "ᵦ"],
  ["_γ", "ᵧ"],
  ["^φ", "ᵠ"],
  ["^χ", "ᵡ"],
  ["^δ", "ᵟ"],
  ["^γ", "ᵞ"],
  ["^β", "ᵝ"],
  ["^8", "⁸"],
  ["^9", "⁹"],
  ["^<", "˂"],
  ["^=", "⁼"],
  ["^>", "˃"],
  ["^0", "⁰"],
  ["^1", "¹"],
  ["^2", "²"],
  ["^3", "³"],
  ["^4", "⁴"],
  ["^5", "⁵"],
  ["^6", "⁶"],
  ["^7", "⁷"],
  ["^(", "⁽"],
  ["^)", "⁾"],
  ["^*", "⁎"],
  ["^+", "⁺"],
  ["^-", "⁻"],
  ["^−", "⁻"],
  ["^.", "ᐧ"],
  ["^P", "ᴾ"],
  ["^R", "ᴿ"],
  ["^T", "ᵀ"],
  ["^U", "ᵁ"],
  ["^V", "ⱽ"],
  ["^W", "ᵂ"],
  ["^H", "ᴴ"],
  ["^I", "ᴵ"],
  ["^J", "ᴶ"],
  ["^K", "ᴷ"],
  ["^L", "ᴸ"],
  ["^M", "ᴹ"],
  ["^N", "ᴺ"],
  ["^O", "ᴼ"],
  ["^A", "ᴬ"],
  ["^B", "ᴮ"],
  ["^D", "ᴰ"],
  ["^E", "ᴱ"],
  ["^G", "ᴳ"],
  ["^x", "ˣ"],
  ["^y", "ʸ"],
  ["^z", "ᶻ"],
  ["^p", "ᵖ"],
  ["^r", "ʳ"],
  ["^s", "ˢ"],
  ["^t", "ᵗ"],
  ["^u", "ᵘ"],
  ["^v", "ᵛ"],
  ["^w", "ʷ"],
  ["^h", "ʰ"],
  ["^i", "ⁱ"],
  ["^j", "ʲ"],
  ["^k", "ᵏ"],
  ["^l", "ˡ"],
  ["^m", "ᵐ"],
  ["^n", "ⁿ"],
  ["^o", "ᵒ"],
  ["^a", "ᵃ"],
  ["^b", "ᵇ"],
  ["^c", "ᶜ"],
  ["^d", "ᵈ"],
  ["^e", "ᵉ"],
  ["^f", "ᶠ"],
  ["^g", "ᵍ"],
];

const combiningmarks: [string, string][] = [
  ["\\doubleunderline", "\u0333"],
  ["\\strikethrough", "\u0335"],
  ["\\underline", "\u0332"],
  ["\\overline", "\u0305"],
  ["\\tilde", "\u0303"],
  ["\\grave", "\u0300"],
  ["\\acute", "\u0301"],
  ["\\slash", "\u0338"],
  ["\\breve", "\u0306"],
  ["\\ddot", "\u0308"],
  ["\\dot", "\u0307"],
  ["\\bar", "\u0305"],
  ["\\vec", "\u20d7"],
  ["\\hat", "\u0302"],
];

// CRITICAL: Process fractions recursively FIRST
function replaceFractions(text: string): string {
  let maxIterations = 10; // Prevent infinite loops
  let changed = true;

  while (changed && maxIterations-- > 0) {
    const original = text;
    // Match nested fractions with proper brace counting
    text = text.replace(
      /\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
      (match, num, den) => {
        return `(${num})/(${den})`;
      }
    );
    changed = text !== original;
  }

  return text;
}

// Process square roots recursively
function replaceSqrt(text: string): string {
  // \sqrt[n]{x} -> ⁿ√(x)
  text = text.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (_, n, x) => {
    const superN = convertToSuperscript(n);
    return `${superN}√(${x})`;
  });

  // \sqrt{x} -> √(x)
  text = text.replace(/\\sqrt\{([^{}]+)\}/g, (_, x) => `√(${x})`);

  return text;
}

// Convert string to superscript
function convertToSuperscript(str: string): string {
  const superMap: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "+": "⁺",
    "-": "⁻",
    "=": "⁼",
    "(": "⁽",
    ")": "⁾",
    n: "ⁿ",
    i: "ⁱ",
    x: "ˣ",
    y: "ʸ",
    z: "ᶻ",
  };
  return str
    .split("")
    .map((c) => superMap[c] || c)
    .join("");
}

// Convert string to subscript
function convertToSubscript(str: string): string {
  const subMap: Record<string, string> = {
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
    "+": "₊",
    "-": "₋",
    "=": "₌",
    "(": "₍",
    ")": "₎",
    x: "ₓ",
    a: "ₐ",
    e: "ₑ",
    i: "ᵢ",
    o: "ₒ",
    n: "ₙ",
    h: "ₕ",
    k: "ₖ",
    l: "ₗ",
    m: "ₘ",
    p: "ₚ",
    s: "ₛ",
    t: "ₜ",
  };
  return str
    .split("")
    .map((c) => subMap[c] || c)
    .join("");
}

// Enhanced unicodeit replacement
function unicodeitReplace(text: string): string {
  if (!text || typeof text !== "string") {
    return String(text || "");
  }

  // Handle \not prefix
  text = text.replace(/\\not\\?([A-Za-z]+)/g, "$1\u0338");

  // Apply main replacements (from your replacements file)
  for (const [latex, unicode] of replacements) {
    if (latex instanceof RegExp) {
      text = text.replace(latex, unicode as string);
    } else {
      text = text.split(latex).join(unicode);
    }
  }

  // Expand superscripts in braces: ^{abc} -> ^a^b^c
  text = text.replace(/\^\{([^{}]+)\}/g, (_, content) =>
    content
      .split("")
      .map((c: string) => "^" + c)
      .join("")
  );

  // Expand subscripts in braces: _{abc} -> _a_b_c
  text = text.replace(/_\{([^{}]+)\}/g, (_, content) =>
    content
      .split("")
      .map((c: string) => "_" + c)
      .join("")
  );

  // Apply subscript/superscript replacements
  for (const [latex, unicode] of subsuperscripts) {
    text = text.split(latex).join(unicode);
  }

  // Apply combining marks
  for (const [latex, unicode] of combiningmarks) {
    const cmdName = latex.slice(1);
    const pattern = new RegExp(`\\\\${cmdName}\\{(.?)\\}`, "g");
    text = text.replace(pattern, (_, char) =>
      char ? char + unicode : unicode
    );
  }

  return text;
}

// Main conversion function - PROPER ORDER IS CRITICAL
function convertLatexToUnicode(text: string): string {
  if (!text) return "";

  // STEP 1: Clean up text formatting commands FIRST
  text = text
    .replace(/\\text(bf|it|rm|sf|tt)?\{([^{}]+)\}/g, "$2")
    .replace(/\\math(bf|it|rm|cal|bb|frak|sf)?\{([^{}]+)\}/g, "$2");

  // STEP 2: Handle spacing commands
  text = text
    .replace(/\\,/g, " ")
    .replace(/\\;/g, "  ")
    .replace(/\\:/g, " ")
    .replace(/\\!/g, "")
    .replace(/\\quad/g, "    ")
    .replace(/\\qquad/g, "        ")
    .replace(/\\ /g, " ");

  // STEP 3: Handle parentheses/brackets BEFORE other processing
  text = text
    .replace(/\\left\[/g, "[")
    .replace(/\\right\]/g, "]")
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\left\\?\{/g, "{")
    .replace(/\\right\\?\}/g, "}")
    .replace(/\\left\|/g, "|")
    .replace(/\\right\|/g, "|")
    .replace(/\\left\./g, "")
    .replace(/\\right\./g, "");

  // STEP 4: Process fractions FIRST (before other commands)
  text = replaceFractions(text);

  // STEP 5: Process square roots
  text = replaceSqrt(text);

  // STEP 6: Handle common math functions
  text = text
    .replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan)\b/g, "$1")
    .replace(/\\(log|ln|exp|det|dim|ker|lim|max|min|sup|inf)\b/g, "$1");

  // STEP 7: Handle common operators and symbols
  text = text
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mp\b/g, "∓")
    .replace(/\\cdot\b/g, "⋅")
    .replace(/\\ast\b/g, "∗")
    .replace(/\\star\b/g, "⋆")
    .replace(/\\sum\b/g, "∑")
    .replace(/\\prod\b/g, "∏")
    .replace(/\\int\b/g, "∫")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\partial\b/g, "∂")
    .replace(/\\nabla\b/g, "∇")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\delta\b/g, "δ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\Gamma\b/g, "Γ")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\Theta\b/g, "Θ")
    .replace(/\\lambda\b/g, "λ")
    .replace(/\\Lambda\b/g, "Λ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\pi\b/g, "π")
    .replace(/\\Pi\b/g, "Π")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\Sigma\b/g, "Σ")
    .replace(/\\tau\b/g, "τ")
    .replace(/\\phi\b/g, "φ")
    .replace(/\\Phi\b/g, "Φ")
    .replace(/\\omega\b/g, "ω")
    .replace(/\\Omega\b/g, "Ω")
    .replace(/\\epsilon\b/g, "ε")
    .replace(/\\varepsilon\b/g, "ε")
    .replace(/\\rho\b/g, "ρ")
    .replace(/\\chi\b/g, "χ");

  // STEP 8: Handle relations
  text = text
    .replace(/\\leq\b|\\le\b/g, "≤")
    .replace(/\\geq\b|\\ge\b/g, "≥")
    .replace(/\\neq\b|\\ne\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\equiv\b/g, "≡")
    .replace(/\\sim\b/g, "∼")
    .replace(/\\propto\b/g, "∝")
    .replace(/\\rightarrow\b|\\to\b/g, "→")
    .replace(/\\leftarrow\b/g, "←")
    .replace(/\\leftrightarrow\b/g, "↔")
    .replace(/\\Rightarrow\b/g, "⇒")
    .replace(/\\Leftarrow\b/g, "⇐")
    .replace(/\\Leftrightarrow\b/g, "⇔");

  // STEP 9: Handle sets and logic
  text = text
    .replace(/\\in\b/g, "∈")
    .replace(/\\notin\b/g, "∉")
    .replace(/\\subset\b/g, "⊂")
    .replace(/\\supset\b/g, "⊃")
    .replace(/\\subseteq\b/g, "⊆")
    .replace(/\\supseteq\b/g, "⊇")
    .replace(/\\cup\b/g, "∪")
    .replace(/\\cap\b/g, "∩")
    .replace(/\\emptyset\b/g, "∅")
    .replace(/\\forall\b/g, "∀")
    .replace(/\\exists\b/g, "∃")
    .replace(/\\neg\b|\\lnot\b/g, "¬")
    .replace(/\\land\b|\\wedge\b/g, "∧")
    .replace(/\\lor\b|\\vee\b/g, "∨");

  // STEP 10: Apply unicodeit replacements (handles subscripts/superscripts)
  text = unicodeitReplace(text);

  // STEP 11: Clean up remaining braces and backslashes
  text = text
    .replace(/\\?\{/g, "")
    .replace(/\\?\}/g, "")
    .replace(/\\\\/g, "\\")
    .replace(/\\([^a-zA-Z])/g, "$1");

  // STEP 12: Handle dimensional formulas like [ML²T⁻²]
  text = text.replace(/\[([A-Z][^\]]*)\]/g, (match, content) => {
    content = content.replace(/\s/g, "");
    content = content.replace(
      /([A-Z])([-+])?(\d+)/g,
      (_, letter, sign, num) => {
        let result = letter;
        if (sign === "-") result += "⁻";
        else if (sign === "+") result += "⁺";
        result += convertToSuperscript(num);
        return result;
      }
    );
    return "[" + content + "]";
  });

  // STEP 13: Final cleanup
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Render LaTeX math with proper delimiter handling
function renderLatexMath(text: string): string {
  if (!text) return "";

  try {
    // Save escaped delimiters
    text = text
      .replace(/\\\$/g, "___DOLLAR___")
      .replace(/\\\[/g, "___LBRACK___")
      .replace(/\\\]/g, "___RBRACK___")
      .replace(/\\\(/g, "___LPAREN___")
      .replace(/\\\)/g, "___RPAREN___");

    // Process display math \[...\]
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, latex) =>
      convertLatexToUnicode(latex.trim())
    );

    // Process inline math \(...\)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, latex) =>
      convertLatexToUnicode(latex.trim())
    );

    // Process display math $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) =>
      convertLatexToUnicode(latex.trim())
    );

    // Process inline math $...$
    text = text.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, latex) =>
      convertLatexToUnicode(latex.trim())
    );

    // Restore escaped delimiters
    text = text
      .replace(/___DOLLAR___/g, "$")
      .replace(/___LBRACK___/g, "[")
      .replace(/___RBRACK___/g, "]")
      .replace(/___LPAREN___/g, "(")
      .replace(/___RPAREN___/g, ")");

    // Fallback: convert any remaining LaTeX
    if (/\\[a-zA-Z]+/.test(text)) {
      text = convertLatexToUnicode(text);
    }

    return text;
  } catch (error) {
    console.error("Error rendering LaTeX:", error);
    return text;
  }
}

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
    .replace(/&#(\d+);/g, (_, code) => {
      const charCode = parseInt(code, 10);
      return charCode > 0 && charCode < 1114112
        ? String.fromCharCode(charCode)
        : "";
    })
    .replace(/&#x([a-fA-F0-9]+);/g, (_, code) => {
      const charCode = parseInt(code, 16);
      return charCode > 0 && charCode < 1114112
        ? String.fromCharCode(charCode)
        : "";
    })
    .replace(/&amp;/g, "&");
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

// Process bilingual content
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

  // CRITICAL FIX: Split BEFORE LaTeX processing to preserve delimiters
  let englishPart = "";
  let hindiPart = "";

  // Check for <br/>[Hindi] format
  const brHindiMatch = text.match(/^(.*?)<br\/?>\s*\[Hindi\]\s*(.*)$/s);
  if (brHindiMatch) {
    englishPart = brHindiMatch[1].trim();
    hindiPart = brHindiMatch[2].trim();
  }
  // Check for standalone [Hindi] marker
  else {
    const standaloneHindiMatch = text.match(/^(.*?)\[Hindi\]\s*(.*)$/s);
    if (standaloneHindiMatch && text.includes("[Hindi]")) {
      englishPart = standaloneHindiMatch[1].trim();
      hindiPart = standaloneHindiMatch[2]
        .replace(/^\[Hindi\]\s*/, "")
        .replace(/\[Hindi\]/g, "")
        .trim();
    }
    // Check for " / " separator
    else {
      const slashMatch = text.match(/^(.*?)\s+\/\s+(.*)$/s);
      if (slashMatch) {
        englishPart = slashMatch[1].trim();
        hindiPart = slashMatch[2].trim();
      }
      // Check for [Hindi Solution] marker
      else {
        const hindiSolutionMatch = text.match(
          /^(.*?)\[Hindi Solution\]\s*(.*)$/is
        );
        if (hindiSolutionMatch) {
          englishPart = hindiSolutionMatch[1].trim();
          hindiPart = hindiSolutionMatch[2].trim();
        }
        // Detect Devanagari script
        else {
          const hindiRegex = /[\u0900-\u097F]+/g;
          const hindiMatches = text.match(hindiRegex);
          if (hindiMatches) {
            hindiPart = hindiMatches.join(" ").trim();
            englishPart = text.replace(hindiRegex, "").trim();
          } else {
            // No Hindi found, everything is English
            englishPart = text;
          }
        }
      }
    }
  }

  // NOW apply LaTeX rendering to BOTH parts separately
  englishPart = renderLatexMath(englishPart);
  hindiPart = renderLatexMath(hindiPart);

  return {
    english: englishPart,
    hindi: hindiPart,
  };
}

// Create Word document
export function createWordDocument(
  questions: Question[],
  testName: string
): Document {
  const paragraphs: Paragraph[] = [];

  questions.forEach((question, index) => {
    const qNum = index + 1;

    // Question number
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

    // Question text
    const questionProcessed = processBilingualText(question.question);

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

    // Question images
    if (containsImage(question.question)) {
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

        if (containsImage(opt.text)) {
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

    // Answer
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

    // Solution
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

      if (containsImage(question.description)) {
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

    // Spacing between questions
    paragraphs.push(
      new Paragraph({
        text: "",
        spacing: { before: 300, after: 300 },
      })
    );
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });
}

// Export helper
export async function saveWordDocument(
  doc: Document,
  filename: string
): Promise<Blob> {
  const blob = await Packer.toBlob(doc);
  return blob;
}
