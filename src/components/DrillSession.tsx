import { useEffect, useMemo, useRef, useState } from "react";
import { X, Lightbulb } from "lucide-react";
import { Keypad } from "./Keypad";
import { DrawCanvas } from "./DrawCanvas";
import { Confetti } from "./Confetti";
import { Pocket } from "./Pocket";
import { playTone } from "@/lib/sound";
import type { Problem } from "@/lib/generators";

export type DrillResult = { correct: number; total: number; durationSec: number; wrongSeeds: number[]; perProblem: { seed: number; ok: boolean }[] };

type Props = {
  title: string;
  color: string;
  total: number;
  targetSec?: number;
  stage: number;
  makeProblem: (index: number, delta: number) => Problem;
  onQuit: () => void;
  onFinish: (r: DrillResult) => void;
};

export function DrillSession({ title, color, total, targetSec, stage, makeProblem, onQuit, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [delta, setDelta] = useState(0);
  const [run, setRun] = useState({ right: 0, wrong: 0 });
  const [problem, setProblem] = useState<Problem>(() => makeProblem(0, 0));
  const [value, setValue] = useState("");
  const [hint, setHint] = useState(0);
  const [state, setState] = useState<"ask" | "correct" | "retry" | "reveal" | "selfgrade">("ask");
  const [missed, setMissed] = useState(false);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const results = useRef<{ seed: number; ok: boolean }[]>([]);
  const start = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.round((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const finishOne = (ok: boolean) => {
    results.current.push({ seed: problem.seed, ok });
    // in-session difficulty: 3 right in a row → harder, 2 wrong → easier
    let nr = ok ? run.right + 1 : 0;
    let nw = ok ? 0 : run.wrong + 1;
    let nd = delta;
    if (nr >= 3) { nd = Math.min(2, delta + 1); nr = 0; }
    if (nw >= 2) { nd = Math.max(-1, delta - 1); nw = 0; }
    setRun({ right: nr, wrong: nw });
    setDelta(nd);
    const next = index + 1;
    if (next >= total) {
      const r = results.current;
      onFinish({
        correct: r.filter((x) => x.ok).length,
        total,
        durationSec: Math.round((Date.now() - start.current) / 1000),
        wrongSeeds: r.filter((x) => !x.ok).map((x) => x.seed),
        perProblem: r,
      });
      return;
    }
    setIndex(next);
    setProblem(makeProblem(next, nd));
    setValue("");
    setHint(0);
    setMissed(false);
    setWrongPick(null);
    setState("ask");
  };

  const check = (given: string) => {
    if (given.trim() === problem.answer) {
      setState("correct");
      playTone("correct");
      setTimeout(() => finishOne(!missed), 900);
    } else {
      playTone("retry");
      setMissed(true);
      const h = Math.min(3, hint + 1);
      setHint(h);
      setWrongPick(given);
      setValue("");
      setState(h >= 3 ? "reveal" : "retry");
    }
  };

  const dots = useMemo(() => Array.from({ length: total }), [total]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 pt-4 pb-8">
      {state === "correct" && <Confetti />}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onQuit} className="tap inline-flex items-center justify-center rounded-full bg-surface" aria-label="やめる">
          <X className="size-6" />
        </button>
        <div className="flex flex-1 flex-wrap items-center gap-1.5" aria-label={`あと ${total - index} もん`}>
          {dots.map((_, i) => (
            <span
              key={i}
              className="size-3.5 rounded-full"
              style={{ background: i < index ? color : i === index ? "var(--primary)" : "var(--border)" }}
            />
          ))}
        </div>
        <span className="text-sm font-bold text-muted-foreground">あと {total - index}もん</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {title}
        {targetSec ? `　めやす ${Math.floor(targetSec / 60)}ふん${targetSec % 60 ? `${targetSec % 60}びょう` : ""}・いま ${elapsed}びょう` : ""}
      </p>

      <section key={index} className="card-kid animate-slide-in mt-4 flex flex-col items-center gap-4 p-6 text-center">
        {problem.passage && <p className="rounded-lg bg-muted p-4 text-left text-2xl leading-relaxed">{problem.passage}</p>}
        {problem.visual && <div className="text-5xl leading-snug tracking-wider break-all">{problem.visual}</div>}
        <h1 className="text-4xl font-bold leading-snug md:text-5xl">{problem.prompt}</h1>
        {problem.input === "keypad" && (
          <div className={`min-h-16 min-w-32 rounded-lg border-2 px-6 text-6xl font-bold ${state === "correct" ? "animate-pop border-correct text-correct" : "border-input"}`} aria-live="polite">
            {state === "correct" ? problem.answer : value || "\u00a0"}
          </div>
        )}
      </section>

      <div className="mt-4 min-h-14" aria-live="polite">
        {state === "correct" && (
          <div className="flex items-center justify-center gap-3 rounded-xl bg-correct-soft p-3 text-2xl font-bold text-correct">
            <Pocket stage={stage} size={56} happy /> ◎ せいかい！
          </div>
        )}
        {(state === "retry" || state === "reveal") && (
          <div className="rounded-xl bg-retry-soft p-4 text-xl">
            <p className="font-bold" style={{ color: "var(--primary-dark)" }}>△ おしい！ もういちど</p>
            <p className="mt-1">💡 {problem.hints[hint - 1]}</p>
          </div>
        )}
        {state === "ask" && hint > 0 && (
          <div className="rounded-xl bg-accent p-4 text-xl">💡 {problem.hints[hint - 1]}</div>
        )}
      </div>

      <div className="mt-auto pt-4">
        {problem.input === "keypad" && state !== "correct" && (
          <Keypad value={value} onChange={setValue} onSubmit={() => check(value)} />
        )}
        {problem.input === "choice" && (
          <div className="grid grid-cols-2 gap-3">
            {problem.choices?.map((c) => (
              <button
                key={c}
                type="button"
                disabled={state === "correct" || c === wrongPick}
                onClick={() => check(c)}
                className={`card-kid min-h-20 px-3 text-2xl font-bold transition-transform active:scale-95 disabled:opacity-40 ${state === "correct" && c === problem.answer ? "ring-4 ring-correct" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {problem.input === "handwrite" && state !== "correct" && (
          <div className="flex flex-col gap-3">
            <DrawCanvas key={index} height={240} />
            {state !== "selfgrade" ? (
              <button type="button" className="btn-kid btn-primary w-full" onClick={() => setState("selfgrade")}>かけた！ こたえを みる</button>
            ) : (
              <div className="card-kid p-4 text-center">
                <p className="text-xl">おてほん：<span className="text-4xl font-bold">{problem.answer}</span></p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button type="button" className="btn-kid btn-primary" onClick={() => { setState("correct"); playTone("correct"); setTimeout(() => finishOne(true), 900); }}>◎ かけた</button>
                  <button type="button" className="btn-kid btn-outline" onClick={() => finishOne(false)}>△ もうすこし</button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-3 flex justify-between">
          {state !== "correct" && hint < 3 && problem.input !== "handwrite" && (
            <button type="button" className="btn-kid btn-ghost min-h-12 text-lg" onClick={() => { setMissed(true); setHint(hint + 1); }}>
              <Lightbulb className="size-5" /> ヒント
            </button>
          )}
          {state === "reveal" && (
            <button type="button" className="btn-kid btn-outline ml-auto min-h-12 text-lg" onClick={() => finishOne(false)}>
              つぎへ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
