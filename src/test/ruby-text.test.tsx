import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RubyText } from "../components/Kana";
import { MathFormula } from "../components/MathFormula";

describe("Kana & RubyText system", () => {
  it("renders ruby tags correctly for dictionary words in ruby mode", () => {
    const { container } = render(<RubyText text="計算の問題を解く" mode="ruby" />);
    const rubyElements = container.querySelectorAll("ruby");
    expect(rubyElements.length).toBeGreaterThan(0);

    const rubyTexts = Array.from(rubyElements).map((el) => {
      const rt = el.querySelector("rt");
      return {
        base: el.textContent?.replace(rt?.textContent || "", ""),
        rt: rt?.textContent,
      };
    });

    expect(rubyTexts).toContainEqual({ base: "計算", rt: "けいさん" });
    expect(rubyTexts).toContainEqual({ base: "問題", rt: "もんだい" });
    expect(rubyTexts).toContainEqual({ base: "解", rt: "と" });
  });

  it("strictly attaches ruby ONLY to kanji, never wrapping okurigana (子ども, 配ります, 足りなくなります)", () => {
    const text1 = "子どもたちに アメを配ります。";
    const text2 = "1人に 4個ずつ配ると 6個 あまり、1人に 5個ずつ配ると 4個 足りなくなります。";
    const text3 = "子どもの 人数は 何人？";

    const { container: c1 } = render(<RubyText text={text1} mode="ruby" />);
    const rubies1 = Array.from(c1.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // Must be base: "子", rt: "こ" (NOT "子どもたち")
    expect(rubies1).toContainEqual({ base: "子", rt: "こ" });
    // Must be base: "配", rt: "くば" (NOT "配ります")
    expect(rubies1).toContainEqual({ base: "配", rt: "くば" });
    expect(rubies1.some((r) => r.base === "子どもたち" || r.base === "配ります")).toBe(false);

    const { container: c2 } = render(<RubyText text={text2} mode="ruby" />);
    const rubies2 = Array.from(c2.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // Must be base: "人", rt: "り" (for 1人)
    expect(rubies2).toContainEqual({ base: "人", rt: "り" });
    // Must be base: "個", rt: "こ" (for 4個)
    expect(rubies2).toContainEqual({ base: "個", rt: "こ" });
    // Must be base: "配", rt: "くば" (for 配ると)
    expect(rubies2).toContainEqual({ base: "配", rt: "くば" });
    // Must be base: "足", rt: "た" (for 足りなくなります, NOT "あし"!)
    expect(rubies2).toContainEqual({ base: "足", rt: "た" });
    expect(rubies2.some((r) => r.base === "足" && r.rt === "あし")).toBe(false);

    const { container: c3 } = render(<RubyText text={text3} mode="ruby" />);
    const rubies3 = Array.from(c3.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));
    expect(rubies3).toContainEqual({ base: "子", rt: "こ" });
    expect(rubies3).toContainEqual({ base: "人数", rt: "にんずう" });
    expect(rubies3).toContainEqual({ base: "何人", rt: "なんにん" });
  });

  it("accurately handles complex geometry compounds like 正三角形 and ご石 without fragmentation", () => {
    const { container } = render(
      <RubyText text="ご石を 正三角形の 形にならべます。" mode="ruby" />
    );
    const rubyElements = container.querySelectorAll("ruby");
    const rubyTexts = Array.from(rubyElements).map((el) => {
      const rt = el.querySelector("rt");
      return {
        base: el.textContent?.replace(rt?.textContent || "", ""),
        rt: rt?.textContent,
      };
    });

    expect(rubyTexts).toContainEqual({ base: "石", rt: "いし" });
    expect(rubyTexts).toContainEqual({ base: "正三角形", rt: "せいさんかっけい" });
    expect(rubyTexts).toContainEqual({ base: "形", rt: "かたち" });

    // Ensure it does NOT contain single "角"
    const hasIsolatedKaku = rubyTexts.some((r) => r.base === "角");
    expect(hasIsolatedKaku).toBe(false);
  });

  it("converts kanji to hiragana in hira mode", () => {
    const { container } = render(<RubyText text="子どもに配ります" mode="hira" />);
    expect(container.querySelector("ruby")).toBeNull();
    expect(container.textContent).toBe("こどもにくばります");
  });

  it("keeps kanji as is in kanji mode", () => {
    const { container } = render(<RubyText text="子どもに配ります" mode="kanji" />);
    expect(container.querySelector("ruby")).toBeNull();
    expect(container.textContent).toBe("子どもに配ります");
  });

  it("handles custom bracket notation [漢字|かんじ]", () => {
    const { container } = render(<RubyText text="ここで[遊具|ゆうぐ]であそぶ" mode="ruby" />);
    const rt = container.querySelector("rt");
    expect(rt?.textContent).toBe("ゆうぐ");
  });

  it("integrates seamlessly into MathFormula and respects noRuby for kanji reading questions", () => {
    const { container: c1 } = render(<MathFormula text="3個のお皿に分ける" />);
    expect(c1.textContent).toContain("お皿");

    // When noRuby is true, kanji reading question must NOT show ruby
    const { container: c2 } = render(<MathFormula text="「馬」の よみかたは？" noRuby={true} />);
    expect(c2.querySelector("ruby")).toBeNull();
    expect(c2.textContent).toBe("「馬」の よみかたは？");
  });

  it("verifies t-pigeonhole has 100% correct rubies without fragmented readings", () => {
    const text = "[確実|かくじつ]に「[同|おな]じ[色|いろ]のボールが 2[個|こ][以上|いじょう]」あるようにするには、[最低|さいてい]でも [何個|なんこ] [取|と]り[出|だ]せばよい？";
    const { container } = render(<RubyText text={text} mode="ruby" />);
    const rubyElements = container.querySelectorAll("ruby");
    const rubies = Array.from(rubyElements).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // Must be かくじつ (NOT たしじつ!)
    expect(rubies).toContainEqual({ base: "確実", rt: "かくじつ" });
    expect(rubies.some((r) => r.base === "確" && r.rt === "たし")).toBe(false);

    // Must be いじょう (NOT い + うえ!)
    expect(rubies).toContainEqual({ base: "以上", rt: "いじょう" });
    expect(rubies.some((r) => r.base === "上" && r.rt === "うえ")).toBe(false);

    // Must be とりだせば (NOT とりでせば!)
    expect(rubies).toContainEqual({ base: "取", rt: "と" });
    expect(rubies).toContainEqual({ base: "出", rt: "だ" });
    expect(rubies.some((r) => r.base === "出" && r.rt === "で")).toBe(false);

    // Also check other words in the sentence
    expect(rubies).toContainEqual({ base: "同", rt: "おな" });
    expect(rubies).toContainEqual({ base: "色", rt: "いろ" });
    expect(rubies).toContainEqual({ base: "個", rt: "こ" });
    expect(rubies).toContainEqual({ base: "最低", rt: "さいてい" });
    expect(rubies).toContainEqual({ base: "何個", rt: "なんこ" });
  });
});

