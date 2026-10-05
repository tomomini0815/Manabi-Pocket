import { useEffect, useMemo, useRef, useState } from "react";
import { X, Lightbulb } from "lucide-react";
import { Keypad } from "./Keypad";
import { DrawCanvas } from "./DrawCanvas";
import { Confetti } from "./Confetti";
import { Pocket } from "./Pocket";
import { MathFormula } from "./MathFormula";
import { RubyText } from "./Kana";
import { playTone } from "@/lib/sound";
import type { Problem } from "@/lib/generators";

export type DrillResult = { correct: number; total: number; durationSec: number; wrongSeeds: number[]; perProblem: { seed: number; ok: boolean }[] };

type Props = {
  title: string;
  color: string;
  total: number;
  targetSec?: number;
  stage: number;
  makeProblem: (index: number, delta: number, usedKeys: Set<string>) => Problem;
  onQuit: () => void;
  onFinish: (r: DrillResult) => void;
};

export function DrillSession({ title, color, total, targetSec, stage, makeProblem, onQuit, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [delta, setDelta] = useState(0);
  const [run, setRun] = useState({ right: 0, wrong: 0 });
  const usedKeys = useRef<Set<string>>(new Set());

  const getNextProblem = (idx: number, d: number) => {
    let p = makeProblem(idx, d, usedKeys.current);
    let key = `${p.prompt}___${p.answer}`;
    // 二重安全策：万一重複した場合はリトライ
    for (let i = 0; i < 30 && usedKeys.current.has(key); i++) {
      p = makeProblem(idx + (i + 1) * 13, d, usedKeys.current);
      key = `${p.prompt}___${p.answer}`;
    }
    usedKeys.current.add(key);
    return p;
  };

  const [problem, setProblem] = useState<Problem>(() => getNextProblem(0, 0));
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
    setProblem(getNextProblem(next, nd));
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

  const [showMemo, setShowMemo] = useState(false);
  const dots = useMemo(() => Array.from({ length: total }), [total]);

  return (
    <div className="min-h-dvh md:h-dvh md:max-h-dvh w-full bg-[#f5efe6] text-foreground flex flex-col justify-start px-3 pt-1.5 pb-3.5 sm:px-6 sm:pt-2 sm:pb-5 select-none overflow-y-auto md:overflow-hidden">
      {state === "correct" && <Confetti />}

      <div className="mx-auto w-full max-w-3xl flex flex-col gap-2 sm:gap-2.5 mt-0.5 sm:mt-1 mb-auto">
        {/* トップヘッダー（立体粘土バー ＆ ビーズプログレス） */}
        <header className="w-full shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onQuit}
              className="tap clay-tile-white size-9 sm:size-10 !rounded-2xl transition-transform hover:scale-105 active:scale-95"
              aria-label="やめる"
            >
              <X className="size-5 text-muted-foreground" />
            </button>

            {/* 10問の立体粘土ビーズ（Clay Beads） */}
            <div className="flex flex-1 items-center justify-center gap-1 sm:gap-1.5 px-2" aria-label={`あと ${total - index} もん`}>
              {dots.map((_, i) => (
                <span
                  key={i}
                  className={`transition-all duration-300 ${
                    i < index
                      ? "clay-tile-mint !size-2.5 sm:!size-3 !rounded-full shadow-[0_2px_4px_rgba(95,145,125,0.4)]"
                      : i === index
                      ? "clay-tile-peach !size-3.5 sm:!size-4 !rounded-full scale-125 animate-pulse shadow-[0_4px_8px_rgba(215,85,50,0.5)]"
                      : "clay-inset !size-2 sm:!size-2.5 !rounded-full bg-[#e3dcd1]"
                  }`}
                />
              ))}
            </div>

            <span className="clay-badge text-xs sm:text-sm font-black bg-surface text-primary-dark whitespace-nowrap">
              あと {total - index}もん
            </span>
          </div>

          {/* サブタイトル ＆ タイマー */}
          <div className="mt-1 flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-extrabold text-muted-foreground truncate">
              {title}
            </p>
            {targetSec && (
              <span className="clay-badge text-[10px] sm:text-[11px] font-black bg-muted/60 text-muted-foreground shrink-0 !py-0.5 !px-2">
                ⏱ {elapsed}秒 / 目安{Math.floor(targetSec / 60)}分
              </span>
            )}
          </div>
        </header>

        {/* メイン問題カード（超立体アイボリー粘土スレート） */}
        <section
          key={index}
          className="clay-card animate-slide-in flex flex-col justify-between p-3.5 sm:p-5 text-center w-full relative min-h-[140px] sm:min-h-[150px]"
        >
          {/* カード上部：問題形式バッジ ＆ メモ機能トグル */}
          <div className="w-full flex items-center justify-between shrink-0 mb-1.5">
            <span className="clay-badge text-[11px] sm:text-xs font-black bg-primary-soft text-primary-dark">
              第 {index + 1} 問
            </span>
            <button
              type="button"
              onClick={() => setShowMemo(!showMemo)}
              className={`tap clay-badge text-xs font-black transition-all ${
                showMemo
                  ? "clay-tile-peach text-white !py-1 !px-3 shadow-[0_4px_8px_rgba(215,85,50,0.4)]"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
              title={showMemo ? "メモをとじる" : "メモをひらく"}
            >
              📝 メモ
            </button>
          </div>

          {/* 筆算・計算・メモ用手書きキャンバス（トグル展開時） */}
          {showMemo && (
            <div className="w-full my-1.5 p-2 clay-inset rounded-2xl bg-[#f7f2e9] shrink-0">
              <p className="text-[11px] font-bold text-muted-foreground mb-1 text-left">✍️ 画面に指やペンで自由に書けます</p>
              <DrawCanvas height={110} />
            </div>
          )}

          {/* 長文（国語・文章題など） */}
          {problem.passage && (
            <div className="clay-inset my-2 sm:my-2.5 p-3.5 sm:p-5 text-left w-full bg-[#faf4eb] border border-[#e8ded0]/80 rounded-2xl sm:rounded-3xl max-h-44 sm:max-h-60 overflow-y-auto shrink-0 shadow-inner">
              <p className="text-lg sm:text-xl md:text-2xl font-black text-[#222831] leading-relaxed sm:leading-loose tracking-wide select-text">
                <RubyText text={problem.passage} />
              </p>
            </div>
          )}

          {/* カード中央コンテンツ：視覚補助（漢字・図）＋ 問題文が自然な距離感で美しく調和 */}
          <div className="flex flex-col items-center justify-center w-full gap-2 sm:gap-3 py-3 sm:py-5 my-auto">
            {problem.visual && (
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-wider select-none leading-none">
                {problem.visual}
              </div>
            )}

            <div className="w-full flex items-center justify-center">
              <MathFormula
                text={problem.prompt}
                noRuby={problem.noRuby}
                className="text-2xl sm:text-3xl md:text-4xl text-foreground font-black tracking-wide leading-relaxed"
              />
            </div>

            {/* テンキー用入力プレビュー枠 */}
            {problem.input === "keypad" && (
              <div
                className={`clay-inset min-h-12 sm:min-h-14 min-w-32 sm:min-w-36 px-6 text-3xl sm:text-4xl font-black flex items-center justify-center mt-2 ${
                  state === "correct"
                    ? "animate-pop clay-tile-mint text-white"
                    : "text-foreground bg-[#ede5d8]"
                }`}
                aria-live="polite"
              >
                {state === "correct" ? problem.answer : value || "\u00a0"}
              </div>
            )}
          </div>
        </section>

        {/* フィードバック・ヒント通知バナー */}
        <div className="shrink-0 min-h-8 sm:min-h-9" aria-live="polite">
          {state === "correct" && (
            <div className="clay-card-mint flex items-center justify-center gap-2 p-1.5 sm:p-2 text-base sm:text-lg font-black text-[#1e4537] animate-pop">
              <Pocket stage={stage} size={34} happy />
              <span>◎ せいかい！ そのちょうし！</span>
            </div>
          )}
          {(state === "retry" || state === "reveal") && (
            <div className="clay-card-peach p-1.5 sm:p-2 text-xs sm:text-sm text-[#592518]">
              <p className="font-black text-xs sm:text-sm text-[#b54523]">△ おしい！ もういちど かんがえてみよう</p>
              <p className="mt-0.5 truncate font-bold">💡 <RubyText text={problem.hints[hint - 1]} /></p>
            </div>
          )}
          {state === "ask" && hint > 0 && (
            <div className="clay-card p-1.5 sm:p-2 text-xs sm:text-sm text-foreground font-bold truncate">
              💡 <RubyText text={problem.hints[hint - 1]} />
            </div>
          )}
        </div>

        {/* 下部入力部（選択肢 / テンキー / 手書き） */}
        <footer className="w-full shrink-0">
        {problem.input === "choice" && (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
            {problem.choices?.map((c, cIdx) => {
              const isCorrectChoice = state === "correct" && c === problem.answer;
              const isWrongChoice = c === wrongPick;
              const choiceLabels = ["①", "②", "③", "④"];

              return (
                <button
                  key={c}
                  type="button"
                  disabled={state === "correct" || isWrongChoice}
                  onClick={() => check(c)}
                  className={`tap min-h-13 sm:min-h-14 md:min-h-15 px-3 sm:px-4 font-black transition-all flex items-center justify-between gap-2 relative ${
                    isCorrectChoice
                      ? "clay-card-mint scale-[1.02] ring-4 ring-correct shadow-[0_12px_24px_rgba(46,168,110,0.35)]"
                      : isWrongChoice
                      ? "clay-inset opacity-40 grayscale cursor-not-allowed"
                      : "clay-card hover:scale-[1.01] active:scale-95 text-foreground"
                  }`}
                >
                  <span className="clay-badge !size-7 shrink-0 text-xs font-black bg-muted/70 text-muted-foreground flex items-center justify-center !p-0">
                    {choiceLabels[cIdx] ?? cIdx + 1}
                  </span>
                  <div className="flex-1 flex items-center justify-center">
                    <MathFormula text={c} className="text-xl sm:text-2xl md:text-3xl" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {problem.input === "keypad" && state !== "correct" && (
          <div className="mx-auto w-full max-w-sm">
            <Keypad value={value} onChange={setValue} onSubmit={() => check(value)} />
          </div>
        )}

        {problem.input === "handwrite" && state !== "correct" && (
          <div className="flex flex-col gap-2 max-w-md mx-auto">
            <DrawCanvas key={index} height={180} />
            {state !== "selfgrade" ? (
              <button type="button" className="btn-kid btn-primary w-full py-2.5 text-base sm:text-lg" onClick={() => setState("selfgrade")}>
                かけた！ こたえを みる
              </button>
            ) : (
              <div className="clay-card p-3 sm:p-4 text-center">
                <p className="text-base sm:text-lg font-bold">おてほん：<span className="text-2xl sm:text-3xl font-black text-primary">{problem.answer}</span></p>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <button type="button" className="btn-kid btn-primary py-2 text-sm sm:text-base" onClick={() => { setState("correct"); playTone("correct"); setTimeout(() => finishOne(true), 900); }}>
                    ◎ かけた
                  </button>
                  <button type="button" className="btn-kid btn-outline py-2 text-sm sm:text-base" onClick={() => finishOne(false)}>
                    △ もうすこし
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ヒント＆スキップ操作ボタン */}
        <div className="mt-1 sm:mt-1.5 flex items-center justify-between text-xs sm:text-sm">
          {state !== "correct" && hint < 3 && problem.input !== "handwrite" ? (
            <button
              type="button"
              className="tap clay-badge text-xs sm:text-sm font-black text-muted-foreground bg-surface hover:text-foreground hover:scale-105 active:scale-95"
              onClick={() => { setMissed(true); setHint(hint + 1); }}
            >
              <Lightbulb className="size-4 text-amber-500" /> ヒント
            </button>
          ) : <span />}
          {state === "reveal" && (
            <button
              type="button"
              className="btn-kid btn-primary ml-auto min-h-9 sm:min-h-10 !py-1 px-5 text-xs sm:text-sm font-black"
              onClick={() => finishOne(false)}
            >
              つぎへ
            </button>
          )}
        </div>
      </footer>
    </div>
  </div>
  );
}
