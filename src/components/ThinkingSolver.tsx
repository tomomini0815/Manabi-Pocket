import { useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { DrawCanvas } from "./DrawCanvas";
import { Keypad } from "./Keypad";
import { Confetti } from "./Confetti";
import { playTone } from "@/lib/sound";
import { DIFFICULTY_LABEL, METHOD_TAGS, type ThinkProblem } from "@/lib/thinking";

export type ThinkOutcome = { solved: boolean; hintLevel: number; timeSec: number; methods: string[] };

const HINT_TITLE = ["", "ヒント1：といかけ", "ヒント2：ちゃくがんてん", "ヒント3：とちゅうまで"];

function Figure({ kind }: { kind: string }) {
  if (kind === "grid2")
    return (
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="2×2の ごばんのめ">
        <rect x="10" y="10" width="120" height="120" fill="none" stroke="var(--think-deep)" strokeWidth="4" />
        <line x1="70" y1="10" x2="70" y2="130" stroke="var(--think-deep)" strokeWidth="4" />
        <line x1="10" y1="70" x2="130" y2="70" stroke="var(--think-deep)" strokeWidth="4" />
      </svg>
    );
  return null;
}

/** S11 考える問題 + S12 ふりかえり */
export function ThinkingSolver({ problem, onDone }: { problem: ThinkProblem; onDone: (o: ThinkOutcome) => void }) {
  const [hint, setHint] = useState(0);
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<"solve" | "reflect" | "explain">("solve");
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [methods, setMethods] = useState<string[]>([]);
  const start = useRef(Date.now());
  const elapsed = () => Math.round((Date.now() - start.current) / 1000);

  const check = (given: string) => {
    if (given.trim() === problem.answer) {
      playTone("correct");
      setSolved(true);
      setPhase("reflect");
    } else {
      playTone("retry");
      setValue("");
      setMsg("おしい！ ノートで もういちど たしかめてみよう");
    }
  };

  const finish = () => onDone({ solved, hintLevel: solved ? hint : 4, timeSec: elapsed(), methods });

  return (
    <div className="relative">
      {phase === "reflect" && <Confetti />}
      <p className="text-sm font-bold tracking-wider">
        {problem.typeTag}・{DIFFICULTY_LABEL[problem.difficulty]}
      </p>
      <section className="mt-3 rounded-2xl bg-surface p-6 md:p-8">
        <h1 className="text-3xl leading-relaxed font-bold md:text-[32px]">{problem.question}</h1>
        {problem.figure && <div className="mt-4 flex justify-center"><Figure kind={problem.figure} /></div>}
      </section>

      {phase === "solve" && (
        <>
          <div className="mt-6">
            <p className="mb-2 text-lg font-bold">ひらめきノート</p>
            <DrawCanvas height={300} templates />
          </div>

          {hint > 0 && (
            <div className="mt-6 space-y-2">
              {problem.hints.slice(0, hint).map((h, i) => (
                <div key={i} className="rounded-xl bg-surface p-4 text-xl">
                  <span className="block text-sm font-bold text-muted-foreground">{HINT_TITLE[i + 1]}</span>
                  {h}
                </div>
              ))}
            </div>
          )}
          {msg && <p className="mt-4 rounded-xl bg-retry-soft p-4 text-xl" role="status">{msg}</p>}

          <div className="mt-8">
            {problem.answerType === "choice" ? (
              <div className="grid grid-cols-3 gap-3">
                {problem.choices?.map((c) => (
                  <button key={c} type="button" className="min-h-20 rounded-xl bg-surface text-2xl font-bold active:scale-95" onClick={() => check(c)}>{c}</button>
                ))}
              </div>
            ) : (
              <>
                <div className="mx-auto mb-3 min-h-16 max-w-sm rounded-lg border-2 border-input bg-surface text-center text-5xl font-bold" aria-live="polite">{value || "\u00a0"}</div>
                <Keypad value={value} onChange={setValue} onSubmit={() => check(value)} />
              </>
            )}
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            {hint < 3 ? (
              <button type="button" className="btn-kid btn-ghost min-h-12 text-lg" onClick={() => setHint(hint + 1)}>
                <Lightbulb className="size-5" /> ヒント（{hint + 1}/3）
              </button>
            ) : <span />}
            <button type="button" className="btn-kid btn-ghost min-h-12 text-lg" onClick={() => setPhase("explain")}>
              わからない・かいせつを みる
            </button>
          </div>
        </>
      )}

      {phase === "reflect" && (
        <div className="mt-6 rounded-2xl bg-surface p-6">
          <p className="text-3xl font-bold" style={{ color: "var(--correct)" }}>◎ せいかい！ {hint === 0 ? "じぶんの ちからで とけたね！" : ""}</p>
          <p className="mt-4 text-2xl font-bold">どうやって かんがえた？</p>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {METHOD_TAGS.map((m) => {
              const on = methods.includes(m);
              return (
                <button key={m} type="button" aria-pressed={on} onClick={() => setMethods(on ? methods.filter((x) => x !== m) : [...methods, m])}
                  className={`min-h-16 rounded-lg border-2 px-3 text-xl font-bold ${on ? "border-think-deep bg-think text-think-deep" : "border-input"}`}>
                  {m}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn-kid btn-think mt-6 w-full" onClick={() => setPhase("explain")}>かいせつと べつの ときかた</button>
        </div>
      )}

      {phase === "explain" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-surface p-6">
            <p className="text-lg font-bold text-muted-foreground">こたえ</p>
            <p className="text-4xl font-bold">{problem.answer}</p>
            <p className="mt-3 text-xl leading-relaxed">{problem.explanation}</p>
          </div>
          {problem.altSolutions.map((a, i) => (
            <div key={i} className="rounded-2xl bg-surface p-5">
              <p className="text-sm font-bold text-muted-foreground">べつの ときかた {i + 1}</p>
              <p className="text-xl leading-relaxed">{a}</p>
            </div>
          ))}
          <button type="button" className="btn-kid btn-think w-full" onClick={finish}>つぎへ</button>
        </div>
      )}
    </div>
  );
}
