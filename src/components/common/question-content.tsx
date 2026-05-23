"use client";

import { Fragment } from "react";
import { LaTeXRenderer } from "@/components/common/latex-renderer";
import { cn } from "@/lib/utils";

interface QuestionContentProps {
  content: string;
  className?: string;
}

function renderInlineSegments(text: string, keyPrefix: string) {
  const parts = text.split(/(\$[^$\n]+?\$)/g);

  return parts
    .filter((part) => part.length > 0)
    .map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return (
          <LaTeXRenderer
            key={`${keyPrefix}-inline-${index}`}
            formula={part.slice(1, -1)}
          />
        );
      }

      return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
    });
}

export function QuestionContent({ content, className }: QuestionContentProps) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  const blockParts = normalized.split(/(\$\$[\s\S]*?\$\$)/g);

  return (
    <div className={cn("space-y-3", className)}>
      {blockParts
        .filter((part) => part.length > 0)
        .map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2).trim();
          return <LaTeXRenderer key={`block-${i}`} formula={formula} displayMode />;
        }

          const lines = part.split("\n").filter((line) => line.trim().length > 0);
          if (lines.length === 0) {
            return null;
          }

          return (
            <div key={`text-${i}`} className="space-y-2">
              {lines.map((line, lineIndex) => (
                <p key={`line-${i}-${lineIndex}`}>{renderInlineSegments(line, `line-${i}-${lineIndex}`)}</p>
              ))}
            </div>
          );
        })}
    </div>
  );
}
