// client/src/components/MathRenderer.tsx
// Reusable component for rendering LaTeX math in HTML content

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

declare global {
  interface Window {
    katex?: any;
  }
}

interface MathRendererProps {
  content: string;
  className?: string;
  allowedTags?: string[];
}

export function MathRenderer({
  content,
  className = "",
  allowedTags = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "b",
    "i",
    "span",
    "div",
    "sup",
    "sub",
  ],
}: MathRendererProps) {
  const [renderedContent, setRenderedContent] = useState("");
  const [katexLoaded, setKatexLoaded] = useState(false);

  // Load KaTeX on component mount
  useEffect(() => {
    if (window.katex) {
      setKatexLoaded(true);
      return;
    }

    // Check if already being loaded
    const existingLink = document.querySelector('link[href*="katex"]');
    const existingScript = document.querySelector('script[src*="katex"]');

    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.async = true;
      script.onload = () => {
        setKatexLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      // Script exists, check if loaded
      const checkKatex = setInterval(() => {
        if (window.katex) {
          setKatexLoaded(true);
          clearInterval(checkKatex);
        }
      }, 100);

      return () => clearInterval(checkKatex);
    }
  }, []);

  // Render math when content changes or KaTeX loads
  useEffect(() => {
    if (!content) {
      setRenderedContent("");
      return;
    }

    if (katexLoaded && window.katex) {
      const processed = renderMathInHtml(content);
      const sanitized = DOMPurify.sanitize(processed, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: ["class", "style"],
        ALLOW_DATA_ATTR: false,
      });
      setRenderedContent(sanitized);
    } else {
      // Fallback: show content without math rendering
      const sanitized = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: [],
      });
      setRenderedContent(sanitized);
    }
  }, [content, katexLoaded, allowedTags]);

  const renderMathInHtml = (html: string): string => {
    if (!html || !window.katex) return html;

    try {
      let processed = html;

      // Handle display math \[ ... \] - must be first to avoid conflicts
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error (\\[\\]):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      // Handle inline math \( ... \)
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error (\\(\\)):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      // Handle display $$ ... $$ (be careful with edge cases)
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error ($$):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      // Handle inline $ ... $ (but not $$) - avoid matching across lines
      processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error ($):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      return processed;
    } catch (error) {
      console.error("Error rendering math:", error);
      return html;
    }
  };

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

// Hook for use in other components
export function useMathRenderer() {
  const [katexLoaded, setKatexLoaded] = useState(!!window.katex);

  useEffect(() => {
    if (window.katex) {
      setKatexLoaded(true);
      return;
    }

    const existingLink = document.querySelector('link[href*="katex"]');
    const existingScript = document.querySelector('script[src*="katex"]');

    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
      script.async = true;
      script.onload = () => setKatexLoaded(true);
      document.head.appendChild(script);
    } else {
      // Script already exists, check if loaded
      const checkKatex = setInterval(() => {
        if (window.katex) {
          setKatexLoaded(true);
          clearInterval(checkKatex);
        }
      }, 100);

      return () => clearInterval(checkKatex);
    }
  }, []);

  const renderMathInHtml = (html: string): string => {
    if (!html || !katexLoaded || !window.katex) return html;

    try {
      let processed = html;

      // Handle display math \[ ... \]
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error (\\[\\]):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      // Handle inline math \( ... \)
      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error (\\(\\)):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      // Handle display $$ ... $$
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error ($$):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      // Handle inline $ ... $
      processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, latex) => {
        try {
          return window.katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: false,
          });
        } catch (e) {
          console.error("KaTeX error ($):", e);
          return `<span class="math-error">[Math: ${latex}]</span>`;
        }
      });

      return processed;
    } catch (error) {
      console.error("Error rendering math:", error);
      return html;
    }
  };

  const sanitizeAndRenderMath = (
    html: string,
    customAllowedTags?: string[]
  ) => {
    const processed = renderMathInHtml(html);
    return DOMPurify.sanitize(processed, {
      ALLOWED_TAGS: customAllowedTags || [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "b",
        "i",
        "span",
        "div",
        "sup",
        "sub",
      ],
      ALLOWED_ATTR: ["class", "style"],
      ALLOW_DATA_ATTR: false,
    });
  };

  return {
    katexLoaded,
    renderMathInHtml,
    sanitizeAndRenderMath,
  };
}

// Utility function for stripping HTML while preserving math
export function stripHtmlKeepMath(html: string): string {
  if (!html) return "";

  // First try to render math if KaTeX is available
  let processed = html;
  if (window.katex) {
    try {
      // Render math to Unicode/text
      processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
        try {
          const rendered = window.katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            output: "html",
          });
          const temp = document.createElement("div");
          temp.innerHTML = rendered;
          return temp.textContent || latex;
        } catch {
          return latex;
        }
      });

      processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
        try {
          const rendered = window.katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            output: "html",
          });
          const temp = document.createElement("div");
          temp.innerHTML = rendered;
          return temp.textContent || latex;
        } catch {
          return latex;
        }
      });

      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
        try {
          const rendered = window.katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            output: "html",
          });
          const temp = document.createElement("div");
          temp.innerHTML = rendered;
          return temp.textContent || latex;
        } catch {
          return latex;
        }
      });

      processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, latex) => {
        try {
          const rendered = window.katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            output: "html",
          });
          const temp = document.createElement("div");
          temp.innerHTML = rendered;
          return temp.textContent || latex;
        } catch {
          return latex;
        }
      });
    } catch (error) {
      console.error("Error processing math:", error);
    }
  }

  // Replace <br> and </p> with newlines
  let text = processed.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p>/gi, "");

  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  text = textarea.value;

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n\s*\n/g, "\n\n");
  text = text.trim();

  return text;
}
