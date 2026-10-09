import React from "react";
import { useActiveChild, type RubyMode } from "@/lib/store";
import rawDictionary from "@/data/furigana-dictionary.json";
import rawSingleKanji from "@/data/kanji-single-map.json";

/**
 * ルール形式:
 * [pattern: マッチ文字列, kanji: ルビを振る漢字, rt: ルビ読み, okuri?: 送り仮名, prefix?: 接頭辞]
 */
type RuleTuple = [string, string, string, string?, string?];

const KANJI_RULES: RuleTuple[] = (rawDictionary as RuleTuple[]).sort(
  (a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0], "ja")
);

const SINGLE_KANJI: Record<string, string> = rawSingleKanji as Record<string, string>;

// 最長一致検索用の正規表現を事前コンパイル
const DICT_REGEX = new RegExp(
  `(\\[([^\\]|]+)\\|([^\\]]+)\\])|(${KANJI_RULES.map(([pat]) => pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g"
);

const RULE_MAP = new Map<string, RuleTuple>();
for (const r of KANJI_RULES) {
  if (!RULE_MAP.has(r[0])) {
    RULE_MAP.set(r[0], r);
  }
}

/** 辞書マッチから漏れたプレーンテキスト内の漢字を1文字フォールバック辞書で救済 */
function renderPlainTextWithFallback(plain: string, mode: RubyMode, keyPrefix: string): React.ReactNode {
  if (!plain) return null;
  if (!/[\u4e00-\u9faf]/.test(plain)) {
    return plain;
  }

  const parts: React.ReactNode[] = [];
  let buffer = "";

  for (let i = 0; i < plain.length; i++) {
    const char = plain[i]!;
    if (/[\u4e00-\u9faf]/.test(char)) {
      if (buffer) {
        parts.push(buffer);
        buffer = "";
      }
      const reading = SINGLE_KANJI[char];
      if (reading) {
        if (mode === "hira") {
          parts.push(reading);
        } else {
          parts.push(
            <ruby key={`${keyPrefix}-fb-${i}`} className="select-text">
              {char}
              <rt className="select-none text-[0.55em] text-primary-dark font-bold leading-none">{reading}</rt>
            </ruby>
          );
        }
      } else {
        parts.push(char);
      }
    } else {
      buffer += char;
    }
  }

  if (buffer) {
    parts.push(buffer);
  }

  return <React.Fragment key={`${keyPrefix}-plain`}>{parts}</React.Fragment>;
}

/**
 * 文字列をパースして、子どもの rubyMode に応じた React 要素の配列を生成
 */
export function parseFurigana(text: string, mode: RubyMode): React.ReactNode {
  if (!text) return text;
  if (mode === "kanji") {
    // 漢字モード：手動タグ [漢字|かんじ] は漢字のみにする
    return text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$1");
  }

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 正規表現の検索インデックスをリセット
  DICT_REGEX.lastIndex = 0;

  while ((match = DICT_REGEX.exec(text)) !== null) {
    // マッチ前のプレーンテキスト
    if (match.index > lastIndex) {
      nodes.push(renderPlainTextWithFallback(text.slice(lastIndex, match.index), mode, `${lastIndex}`));
    }

    if (match[1]) {
      // 手動タグ形式: [漢字|かんじ]
      const kanji = match[2]!;
      const reading = match[3]!;
      if (mode === "hira") {
        nodes.push(reading);
      } else {
        nodes.push(
          <ruby key={`${match.index}-custom`} className="select-text">
            {kanji}
            <rt className="select-none text-[0.55em] text-primary-dark font-bold leading-none">{reading}</rt>
          </ruby>
        );
      }
    } else {
      // 辞書マッチ（最長一致）
      const pattern = match[4]!;
      const rule = RULE_MAP.get(pattern)!;
      const kanji = rule[1];
      const rt = rule[2];
      const okuri = rule[3] || "";
      const prefix = rule[4] || "";

      if (mode === "hira") {
        nodes.push(`${prefix}${rt}${okuri}`);
      } else {
        nodes.push(
          <React.Fragment key={`${match.index}-${pattern}`}>
            {prefix}
            <ruby className="select-text">
              {kanji}
              <rt className="select-none text-[0.55em] text-primary-dark font-bold leading-none">{rt}</rt>
            </ruby>
            {okuri}
          </React.Fragment>
        );
      }
    }

    lastIndex = DICT_REGEX.lastIndex;
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    nodes.push(renderPlainTextWithFallback(text.slice(lastIndex), mode, `tail-${lastIndex}`));
  }

  return <>{nodes}</>;
}

/**
 * テキストを受け取り、子どものふりがな設定（rubyMode）に合わせて自動でルビを振るコンポーネント
 */
export function RubyText({
  text,
  className = "",
  mode: overrideMode,
}: {
  text?: string | null | undefined;
  className?: string | undefined;
  mode?: RubyMode | undefined;
}) {
  if (!text) return null;
  const child = useActiveChild();
  const mode = overrideMode ?? child?.rubyMode ?? "ruby";

  return <span className={className}>{parseFurigana(text, mode)}</span>;
}

/** 従来の単体タグ互換 */
export function Kana({ k, r }: { k: string; r: string }) {
  const mode = useActiveChild()?.rubyMode ?? "ruby";
  if (mode === "hira") return <>{r}</>;
  if (mode === "kanji") return <>{k}</>;
  return (
    <ruby className="select-text">
      {k}
      <rt className="select-none text-[0.55em] text-primary-dark font-bold leading-none">{r}</rt>
    </ruby>
  );
}

/** [漢字|かんじ] タグを除去して純粋な漢字文字列にする */
export function stripFurigana(text: string): string {
  if (!text) return text;
  return text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$1");
}

/** [漢字|かんじ] タグをすべてひらがなにする */
export function toHiragana(text: string): string {
  if (!text) return text;
  return text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, "$2");
}

