import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Pocket } from "@/components/Pocket";
import { GRADES, recommendedLevelFor, subjects } from "@/lib/curriculum";
import { useApp, type RubyMode } from "@/lib/store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "はじめよう｜まなびポケット" },
      { name: "description", content: "ニックネームと学年を登録して、かんたんな力試しで開始レベルを決めます。" },
      { property: "og:title", content: "はじめよう｜まなびポケット" },
      { property: "og:description", content: "子どもの登録と力試しで、ぴったりのスタート地点へ。" },
    ],
  }),
  component: Onboarding,
});

const TEST = [
  { q: "🍎🍎🍎 いくつ？", a: "3", c: ["2", "3", "4"] },
  { q: "4 + 3 = ?", a: "7", c: ["6", "7", "8"] },
  { q: "8 + 7 = ?", a: "15", c: ["13", "15", "16"] },
  { q: "6 × 7 = ?", a: "42", c: ["36", "42", "48"] },
];

function Onboarding() {
  const addChild = useApp((s) => s.addChild);
  const hasChildren = useApp((s) => s.children.length > 0);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [ruby, setRuby] = useState<RubyMode>("ruby");
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);

  const finish = (s: number) => {
    // grade gives the base; the quick test can move the start one level forward
    const math = subjects.find((x) => x.id === "math")!;
    const baseId = recommendedLevelFor(grade);
    let idx = math.levels.findIndex((l) => l.id === baseId);
    const testLevel = s >= 4 ? 4 : s >= 3 ? 2 : s >= 2 ? 1 : 0;
    idx = Math.min(math.levels.length - 1, Math.max(Math.min(idx, testLevel + 1), testLevel));
    addChild({ nickname: name.trim(), grade, rubyMode: ruby, avatar: "pocket", recommendedLevel: math.levels[idx]!.id });
    setStep(3);
  };

  const opt = (active: boolean) =>
    `tap rounded-lg border-2 px-3 py-2.5 text-base sm:text-lg font-bold transition-all ${active ? "border-primary bg-primary-soft text-primary-dark shadow-sm" : "border-input bg-surface hover:border-primary/50"}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-5 py-10 text-center">
      <Pocket stage={step === 3 ? 1 : 0} size={140} happy={step === 3} />
      {step === 0 && (
        <>
          <h1 className="mt-4 text-4xl font-bold">まなびポケット</h1>
          <p className="mt-3 text-xl text-muted-foreground">ぽけっとと いっしょに まいにち すこしずつ。</p>
          <button className="btn-kid btn-primary mt-10 w-full" onClick={() => setStep(1)}>はじめる</button>
          {hasChildren && <button className="btn-kid btn-ghost mt-3" onClick={() => navigate({ to: "/" })}>もどる</button>}
        </>
      )}
      {step === 1 && (
        <div className="mt-6 w-full space-y-6 text-left">
          <label className="block">
            <span className="text-xl font-bold">おなまえ（ニックネーム）</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={12} className="mt-2 h-16 w-full rounded-md border-2 border-input bg-surface px-4 text-2xl" placeholder="はると" />
          </label>
          <fieldset>
            <legend className="text-xl font-bold">がくねん（スタートの めやす）</legend>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADES.map((g, i) => (
                <button key={g} type="button" className={opt(grade === i)} onClick={() => setGrade(i)} aria-pressed={grade === i}>
                  {g}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xl font-bold">かんじの ひょうじ</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([["hira", "ひらがな"], ["ruby", "ふりがな"], ["kanji", "漢字"]] as const).map(([v, l]) => (
                <button key={v} type="button" className={opt(ruby === v)} onClick={() => setRuby(v)} aria-pressed={ruby === v}>{l}</button>
              ))}
            </div>
          </fieldset>
          <p className="text-sm text-muted-foreground">登録するのはニックネームと学年だけ。データはこの端末の中にだけ保存されます。</p>
          <button className="btn-kid btn-primary w-full" disabled={!name.trim()} onClick={() => setStep(2)}>つぎへ</button>
        </div>
      )}
      {step === 2 && TEST[qi] && (
        <div className="mt-6 w-full">
          <p className="text-lg text-muted-foreground">ちからだめし {qi + 1} / {TEST.length}（わからなくても だいじょうぶ）</p>
          <h2 className="mt-4 text-5xl font-bold">{TEST[qi]!.q}</h2>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {TEST[qi]!.c.map((c) => (
              <button key={c} className="card-kid min-h-20 text-3xl font-bold" onClick={() => {
                const s = score + (c === TEST[qi]!.a ? 1 : 0);
                setScore(s);
                if (qi + 1 >= TEST.length) finish(s); else setQi(qi + 1);
              }}>{c}</button>
            ))}
          </div>
          <button className="btn-kid btn-ghost mt-6" onClick={() => finish(score)}>わからない（ここまでで おわる）</button>
        </div>
      )}
      {step === 3 && (
        <>
          <h2 className="mt-4 text-3xl font-bold">{name}、よろしくね！</h2>
          <p className="mt-2 text-xl text-muted-foreground">ぴったりの ところから はじめよう。</p>
          <button className="btn-kid btn-primary mt-10 w-full" onClick={() => navigate({ to: "/" })}>ホームへ</button>
        </>
      )}
    </div>
  );
}
