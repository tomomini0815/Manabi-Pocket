import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RubyText } from "../components/Kana";
import { MathFormula } from "../components/MathFormula";
import rawDictionary from "../data/furigana-dictionary.json";
import rawCurriculum from "../data/curriculum.json";
import rawThinking from "../data/thinking-problems.json";

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

    // Must be base: "1人", rt: "ひとり" (NOT "人: り")
    expect(rubies2).toContainEqual({ base: "1人", rt: "ひとり" });
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

  it("accurately handles complex real exam sentences like moving walkway (歩道, 同じ向き, 反対向き, 2人: ふたり, 相対速度)", () => {
    const examText = "分速60mで動く歩道の上を、歩道と同じ向きに分速80mで歩くA君と、歩道と反対向きに分速100mで歩くB君がいます。2人がすれ違うときの相対速度は分速何mですか？";
    const { container } = render(<RubyText text={examText} mode="ruby" />);
    const rubies = Array.from(container.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // Must be base: "2人", rt: "ふたり" (NEVER base: "人", rt: "り"!)
    expect(rubies).toContainEqual({ base: "2人", rt: "ふたり" });
    expect(rubies.some((r) => r.base === "人" && r.rt === "り")).toBe(false);

    // Key vocabulary check
    expect(rubies).toContainEqual({ base: "歩道", rt: "ほどう" });
    expect(rubies).toContainEqual({ base: "同", rt: "おな" });
    expect(rubies).toContainEqual({ base: "向", rt: "む" });
    expect(rubies).toContainEqual({ base: "反対向き", rt: "はんたいむき" });
    expect(rubies).toContainEqual({ base: "相対速度", rt: "そうたいそくど" });
    expect(rubies).toContainEqual({ base: "何m", rt: "なんメートル" });
    expect(rubies).toContainEqual({ base: "分速", rt: "ふんそく" });
    expect(rubies).toContainEqual({ base: "動", rt: "うご" });
    expect(rubies).toContainEqual({ base: "歩", rt: "ある" });
  });

  it("accurately handles honorifics and relatives like ご尊父様 and お父様 without misreading", () => {
    const { container } = render(
      <RubyText text="手紙で相手の父親のことを敬って呼ぶ言葉は？ ご尊父様（お父様）" mode="ruby" />
    );
    const rubies = Array.from(container.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // Must be ご尊父様: ごそんぷさま, お父様: おとうさま
    expect(rubies).toContainEqual({ base: "ご尊父様", rt: "ごそんぷさま" });
    expect(rubies).toContainEqual({ base: "お父様", rt: "おとうさま" });

    // Must NEVER read as "ちちさま"
    expect(rubies.some((r) => r.rt === "ちちさま")).toBe(false);
  });

  it("accurately handles verb '行く', '行かれる', '参る', '伺う' without misreading as 'こう'", () => {
    const qText = "先生が「行く」ことを、尊敬語で言うと？";
    const { container: cQ } = render(<RubyText text={qText} mode="ruby" />);
    const qRubies = Array.from(cQ.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // 「行く」: 行=い (NEVER こう!)
    expect(qRubies).toContainEqual({ base: "行", rt: "い" });
    expect(qRubies.some((r) => r.base === "行" && r.rt === "こう")).toBe(false);

    // 「先生」: せんせい, 「尊敬語」: そんけいご, 「言」: い
    expect(qRubies).toContainEqual({ base: "先生", rt: "せんせい" });
    expect(qRubies).toContainEqual({ base: "尊敬語", rt: "そんけいご" });
    expect(qRubies).toContainEqual({ base: "言", rt: "い" });

    // 選択肢の検証
    const { container: cIkare } = render(<RubyText text="行かれる" mode="ruby" />);
    const ikareRuby = Array.from(cIkare.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));
    expect(ikareRuby).toContainEqual({ base: "行", rt: "い" });
    expect(ikareRuby.some((r) => r.rt === "こう")).toBe(false);

    const { container: cMairu } = render(<RubyText text="参る" mode="ruby" />);
    const mairuRuby = Array.from(cMairu.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));
    expect(mairuRuby).toContainEqual({ base: "参", rt: "まい" });

    const { container: cUkagau } = render(<RubyText text="伺う" mode="ruby" />);
    const ukagauRuby = Array.from(cUkagau.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));
    expect(ukagauRuby).toContainEqual({ base: "伺", rt: "うかが" });
  });

  it("accurately handles '楽しかったです' and '笑い声' without misreading 楽 as らく or 笑 as しょう", () => {
    const text1 = "「楽しかったです！」は 英語で？";
    const { container: c1 } = render(<RubyText text={text1} mode="ruby" />);
    const rubies1 = Array.from(c1.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // 「楽しかっ」: 楽=たの (NEVER らく!)
    expect(rubies1).toContainEqual({ base: "楽", rt: "たの" });
    expect(rubies1.some((r) => r.base === "楽" && r.rt === "らく")).toBe(false);
    expect(rubies1).toContainEqual({ base: "英語", rt: "えいご" });

    // 「笑い声」
    const text2 = "家族の楽しげな笑い声";
    const { container: c2 } = render(<RubyText text={text2} mode="ruby" />);
    const rubies2 = Array.from(c2.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));
    expect(rubies2).toContainEqual({ base: "楽", rt: "たの" });
    expect(rubies2.some((r) => r.base === "楽" && r.rt === "らく")).toBe(false);
    expect(rubies2.some((r) => r.base === "笑" && r.rt === "しょう")).toBe(false);
  });

  it("accurately handles '過去形' as 'かこけい' (NEVER 'かこかたち') and other compound nouns", () => {
    const text = "「サッカーを しました」は 英語で？（playの過去形）";
    const { container } = render(<RubyText text={text} mode="ruby" />);
    const rubies = Array.from(container.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));

    // Must be 過去形: かこけい (NEVER 過去: かこ + 形: かたち!)
    expect(rubies).toContainEqual({ base: "過去形", rt: "かこけい" });
    expect(rubies.some((r) => r.base === "形" && r.rt === "かたち")).toBe(false);

    // Other compounds
    const { container: c2 } = render(
      <RubyText text="四字熟語と10分後と誕生日と既約分数" mode="ruby" />
    );
    const rubies2 = Array.from(c2.querySelectorAll("ruby")).map((el) => ({
      base: el.textContent?.replace(el.querySelector("rt")?.textContent || "", ""),
      rt: el.querySelector("rt")?.textContent,
    }));
    expect(rubies2).toContainEqual({ base: "四字熟語", rt: "よじじゅくご" });
    expect(rubies2).toContainEqual({ base: "分後", rt: "ふんご" });
    expect(rubies2).toContainEqual({ base: "誕生日", rt: "たんじょうび" });
    expect(rubies2).toContainEqual({ base: "既約分数", rt: "きやくぶんすう" });
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

  it("verifies that 100% of kanji compounds across curriculum and thinking problems are registered in the dictionary", () => {
    // 辞書ルールの準備
    const rawDict = rawDictionary as [string, string, string, string?, string?][];
    const rules = [...rawDict].sort((a, b) => b[0].length - a[0].length);
    const escaped = rules.map(([pat]) => pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(\\[([^\\]|]+)\\|([^\\]]+)\\])|(${escaped.join("|")})`, "g");

    const allTexts = new Set<string>();
    const extractStrings = (obj: unknown) => {
      if (typeof obj === "string") {
        if (/[\u4e00-\u9faf]/.test(obj)) allTexts.add(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(extractStrings);
      } else if (obj && typeof obj === "object") {
        Object.values(obj as Record<string, unknown>).forEach(extractStrings);
      }
    };

    extractStrings(rawCurriculum);
    extractStrings(rawThinking);

    const kanjiCompoundRegex = /[\u4e00-\u9faf]{2,}/g;
    const unhandledCompounds: string[] = [];

    for (const text of allTexts) {
      const cleanText = text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, " ");
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      let lastIdx = 0;
      const unhandledIntervals: string[] = [];

      while ((match = regex.exec(cleanText)) !== null) {
        if (match.index > lastIdx) {
          unhandledIntervals.push(cleanText.slice(lastIdx, match.index));
        }
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < cleanText.length) {
        unhandledIntervals.push(cleanText.slice(lastIdx));
      }

      for (const interval of unhandledIntervals) {
        let cm: RegExpExecArray | null;
        while ((cm = kanjiCompoundRegex.exec(interval)) !== null) {
          unhandledCompounds.push(cm[0]);
        }
      }
    }

    // Unhandled compounds must be 0 to guarantee no misread compound words
    expect(unhandledCompounds).toEqual([]);
  });
});

