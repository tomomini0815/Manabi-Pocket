import { useActiveChild } from "@/lib/store";

/** Renders text according to the child's furigana mode: hiragana only / ruby / kanji. */
export function Kana({ k, r }: { k: string; r: string }) {
  const mode = useActiveChild()?.rubyMode ?? "ruby";
  if (mode === "hira") return <>{r}</>;
  if (mode === "kanji") return <>{k}</>;
  return (
    <ruby>
      {k}
      <rt>{r}</rt>
    </ruby>
  );
}
