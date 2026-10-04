import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Confetti } from "./Confetti";
import { Pocket } from "./Pocket";
import { playTone } from "@/lib/sound";
import type { DrillResult } from "./DrillSession";

type Props = {
  result: DrillResult;
  passed: boolean;
  targetSec?: number;
  stage: number;
  needBreak: boolean;
  onRetry: () => void;
  next?: { levelId: string; stepId: string; title: string } | null;
};

/** S04 結果画面 */
export function ResultView({ result, passed, targetSec, stage, needBreak, onRetry, next }: Props) {
  const acc = Math.round((result.correct / result.total) * 100);
  useEffect(() => {
    playTone(passed ? "fanfare" : "correct");
  }, [passed]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center px-5 py-10 text-center">
      {passed && <Confetti />}
      <Pocket stage={stage} size={150} happy />
      <h1 className="mt-4 text-4xl font-bold">{passed ? "ステップ クリア！" : "よく がんばったね！"}</h1>
      <div className="card-kid mt-6 grid w-full grid-cols-2 divide-x p-5">
        <div>
          <p className="text-muted-foreground">せいかい</p>
          <p className="text-5xl font-bold">{result.correct}<span className="text-2xl">/{result.total}</span></p>
        </div>
        <div>
          <p className="text-muted-foreground">じかん</p>
          <p className="text-5xl font-bold">{result.durationSec}<span className="text-2xl">びょう</span></p>
          {targetSec && <p className="text-sm text-muted-foreground">めやす {targetSec}びょう</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-2xl font-bold" aria-label="スタンプ">
        <span className="flex size-16 animate-pop items-center justify-center rounded-full border-4 border-primary text-primary">
          {passed ? "◎" : acc >= 70 ? "○" : "△"}
        </span>
        <span>スタンプ ゲット！</span>
      </div>
      {!passed && (
        <p className="mt-4 text-lg text-muted-foreground">
          {acc < 90 ? "9わり せいかいで クリアだよ。" : "あと すこし はやく とけたら クリア！"} あたらしい もんだいで もういちど やってみよう。
        </p>
      )}
      {needBreak && (
        <div className="mt-6 w-full rounded-xl bg-think p-4 text-xl text-think-deep" role="status">
          🌿 15ふん がんばったね。ひとやすみ しよう！
        </div>
      )}
      <div className="mt-auto w-full space-y-3 pt-8">
        {passed && next ? (
          <Link to="/drill/$levelId/$stepId" params={{ levelId: next.levelId, stepId: next.stepId }} className="btn-kid btn-primary w-full">
            つぎの ステップへ
          </Link>
        ) : (
          <button type="button" className="btn-kid btn-primary w-full" onClick={onRetry}>もういちど</button>
        )}
        <Link to="/" className="btn-kid btn-outline w-full">ホームへ</Link>
      </div>
    </div>
  );
}
