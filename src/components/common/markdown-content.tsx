"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { LaTeXRenderer } from "@/components/common/latex-renderer";

function renderInline(text: string) {
  const parts = text.split(
    /(\*\*.*?\*\*|`.*?`|\$[^$\n]+?\$|\\\(.+?\\\))/g
  );

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("$") && part.endsWith("$")) {
      return <LaTeXRenderer key={index} formula={part.slice(1, -1)} />;
    }

    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      return <LaTeXRenderer key={index} formula={part.slice(2, -2)} />;
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const blocks: React.ReactNode[] = [];

  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];
  let inCodeBlock = false;
  let latexLines: string[] = [];
  let latexDelimiter: "$$" | "\\[" | null = null;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-7 text-slate-700">
        {renderInline(paragraphLines.join(" "))}
      </p>
    );
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul
        key={`ul-${blocks.length}`}
        className="list-disc space-y-1.5 pl-5 text-slate-700"
      >
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  const flushCodeBlock = () => {
    if (!codeLines.length) return;
    blocks.push(
      <pre
        key={`code-${blocks.length}`}
        className="overflow-x-auto rounded-xl bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-100"
      >
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
    codeLines = [];
  };

  const flushLatexBlock = () => {
    if (!latexLines.length || !latexDelimiter) return;

    let formula = latexLines.join("\n").trim();
    if (latexDelimiter === "$$") {
      formula = formula.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
    } else {
      formula = formula.replace(/^\\\[\s*/, "").replace(/\s*\\\]$/, "").trim();
    }

    if (formula) {
      blocks.push(
        <div key={`latex-${blocks.length}`} className="overflow-x-auto py-1">
          <LaTeXRenderer formula={formula} displayMode />
        </div>
      );
    }

    latexLines = [];
    latexDelimiter = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (latexDelimiter) {
      latexLines.push(line);
      const reachedEnd =
        (latexDelimiter === "$$" && trimmed.endsWith("$$")) ||
        (latexDelimiter === "\\[" && trimmed.endsWith("\\]"));

      if (reachedEnd) {
        flushLatexBlock();
      }
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("$$")) {
      flushParagraph();
      flushList();

      if (trimmed.endsWith("$$") && trimmed.length > 4) {
        blocks.push(
          <div key={`latex-${blocks.length}`} className="overflow-x-auto py-1">
            <LaTeXRenderer formula={trimmed.slice(2, -2).trim()} displayMode />
          </div>
        );
      } else {
        latexDelimiter = "$$";
        latexLines = [line];
      }
      continue;
    }

    if (trimmed.startsWith("\\[")) {
      flushParagraph();
      flushList();

      if (trimmed.endsWith("\\]") && trimmed.length > 4) {
        blocks.push(
          <div key={`latex-${blocks.length}`} className="overflow-x-auto py-1">
            <LaTeXRenderer formula={trimmed.slice(2, -2).trim()} displayMode />
          </div>
        );
      } else {
        latexDelimiter = "\\[";
        latexLines = [line];
      }
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingClass =
        level === 1
          ? "text-xl font-bold text-slate-950"
          : level === 2
            ? "text-lg font-bold text-slate-900"
            : "text-base font-semibold text-slate-900";

      blocks.push(
        <div key={`h-${blocks.length}`} className={headingClass}>
          {renderInline(headingText)}
        </div>
      );
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      continue;
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedListMatch) {
      flushParagraph();
      listItems.push(orderedListMatch[1]);
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushCodeBlock();
  flushLatexBlock();

  if (!blocks.length) {
    return null;
  }

  return <div className={cn("space-y-3 text-sm", className)}>{blocks}</div>;
}
