"use client";

import { useEffect, useRef } from "react";

interface LaTeXRendererProps {
  formula: string;
  displayMode?: boolean;
}

export function LaTeXRenderer({ formula, displayMode = false }: LaTeXRendererProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const katex = await import("katex");
        if (!cancelled && ref.current) {
          katex.default.render(formula, ref.current, {
            displayMode,
            throwOnError: false,
          });
        }
      } catch {
        if (ref.current) {
          ref.current.textContent = formula;
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [formula, displayMode]);

  return <span ref={ref} />;
}
