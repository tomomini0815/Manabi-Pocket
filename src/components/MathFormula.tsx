import React from "react";

/**
 * 算数・数学のテキストを子供向けに美しくレンダリングするコンポーネント。
 * - "1/5" や "3/4" などの分数を、上下の本格的な分数（分子/分母）として描画。
 * - "×", "÷", "=", "+" などの記号に適切なアキを持たせる。
 * - "?" をアクセントカラーで強調。
 */
export function MathFormula({ text, className = "" }: { text: string; className?: string }) {
  // 分数表記 "12/34" を正規表現で検出して分割
  const parts = text.split(/(\b\d+\/\d+\b)/g);
  const isPureFormula = !/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);

  return (
    <span
      className={`${
        isPureFormula ? "inline-flex flex-wrap items-center justify-center gap-x-1" : "inline leading-relaxed"
      } font-black ${className}`}
    >
      {parts.map((part, idx) => {
        const fractionMatch = part.match(/^(\d+)\/(\d+)$/);
        if (fractionMatch) {
          const [, numerator, denominator] = fractionMatch;
          return (
            <span
              key={idx}
              className="inline-flex flex-col items-center justify-center align-middle mx-1 my-0.5 leading-none select-none"
            >
              <span className="border-b-[2.5px] border-current px-1.5 pb-0.5 text-[0.8em] font-black">
                {numerator}
              </span>
              <span className="px-1.5 pt-0.5 text-[0.8em] font-black">
                {denominator}
              </span>
            </span>
          );
        }

        if (part === " ? " || part === "?" || part.endsWith(" = ?")) {
          // 純粋な数式の末尾 "?" の強調
          if (part.endsWith(" = ?")) {
            const prefix = part.slice(0, -4);
            return (
              <span key={idx}>
                {prefix} ={" "}
                <span className="clay-tile-peach !rounded-xl px-2.5 py-1 text-white mx-1 text-[0.85em] animate-pulse">
                  ?
                </span>
              </span>
            );
          }
          return (
            <span
              key={idx}
              className="clay-tile-peach !rounded-xl px-2.5 py-1 text-white mx-1 text-[0.85em] animate-pulse"
            >
              ?
            </span>
          );
        }

        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}
