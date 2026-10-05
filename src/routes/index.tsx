import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Brain, Pencil, RotateCcw, Trophy } from "lucide-react";
import { KidShell, useRequireChild } from "@/components/KidShell";
import { Pocket } from "@/components/Pocket";
import { SUBJECT_COLOR, findStep } from "@/lib/curriculum";
import { nextStepIn } from "@/lib/selectors";
import { growthStage, streakOf, studyDays, todayKey, dayKey, useApp } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ホーム｜まなびポケット" },
      { name: "description", content: "きょうのおすすめ、つづきから、連続日数。ドリルとかんがえるの2つの入口から学習を始めよう。" },
      { property: "og:title", content: "まなびポケット｜毎日つづく家庭学習" },
      { property: "og:description", content: "ドリルで基礎、考えるモードで思考力。オリジナル問題で毎日5〜15分。" },
    ],
  }),
  component: Home,
});

function Home() {
  const child = useRequireChild();
  const sessions = useApp((s) => s.sessions);
  const attempts = useApp((s) => s.attempts);
  const progress = useApp((s) => s.progress);
  const reviews = useApp((s) => s.reviews);
  if (!child) return null;

  const mine = sessions.filter((s) => s.childId === child.id);
  const myAttempts = attempts.filter((a) => a.childId === child.id);
  const prog = progress[child.id] ?? {};
  const streak = streakOf(studyDays(child.id, sessions, attempts));
  const stage = growthStage(mine.length + myAttempts.length);
  const rec = nextStepIn(prog, child.recommendedLevel);
  const last = [...mine].reverse().find((s) => !s.review);
  const cont = last ? findStep(last.levelId, last.stepId) : null;
  const contNext = last && cont ? (last.passed && cont.next ? { ...cont, step: cont.next } : cont) : null;
  const due = reviews.filter((r) => r.childId === child.id && r.due <= Date.now()).length;
  const today = mine.filter((s) => dayKey(s.at) === todayKey()).length + myAttempts.filter((a) => dayKey(a.at) === todayKey()).length;
  return (
    <KidShell
      header={
        <div className="clay-card !rounded-2xl !py-1 sm:!py-1.5 !px-3 sm:!px-4 flex flex-col justify-center bg-gradient-to-r from-[#fffaf7] via-white to-[#fff4ee] border-2 border-white shadow-[0_4px_14px_rgba(234,99,64,0.08)]">
          <span className="text-xs sm:text-sm font-black text-foreground/75 tracking-tight leading-tight">
            こんにちは、
          </span>
          <div className="flex items-baseline gap-1 leading-tight">
            <span className="text-base sm:text-xl font-black text-primary-dark tracking-tight truncate max-w-[130px] sm:max-w-none">
              {child.nickname}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[#9c5938]">
              さん
            </span>
          </div>
        </div>
      }
    >
      {/* 連続日数 & ポケットの成長ステータス（モバイルでも右余白をしっかり確保） */}
      <div className="flex items-center gap-2.5 sm:gap-4 w-full">
        <div className="clay-card p-2 sm:p-3 flex items-center justify-center shrink-0">
          <Pocket stage={stage} size={76} />
        </div>
        <div className="clay-card-yellow flex flex-1 min-w-0 items-center gap-2.5 sm:gap-4 p-3 sm:p-5">
          <div className="clay-tile-peach size-11 sm:size-14 shrink-0 flex items-center justify-center">
            <Flame className="size-6 sm:size-8 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-3xl font-black text-[#523b0d] truncate leading-tight">
              {streak}<span className="text-sm sm:text-lg font-extrabold text-[#7a5e20] ml-1">日れんぞく</span>
            </p>
            <div className="mt-1 flex gap-1 sm:gap-1.5" aria-label={`きょうの スタンプ ${Math.min(today, 5)}こ`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`size-4 sm:size-5 rounded-full transition-all ${
                    i < today
                      ? "clay-tile-peach !size-4.5 sm:!size-5.5 scale-110 !rounded-full shadow-[0_4px_8px_rgba(215,85,50,0.4)]"
                      : "clay-inset bg-[#e5dbc9] !rounded-full"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* きょうのおすすめ（参考画像のGood Morningバナーに完全準拠したピーチ粘土パネル） */}
      {rec && (
        <section className="clay-card-peach mt-5 overflow-hidden p-6 sm:p-7 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="clay-badge text-xs font-black bg-white/90 text-[#b54523] shadow-xs">
              きょうのおすすめ
            </span>
            <span className="clay-badge text-xs font-black bg-[#fbe0d7] text-[#933010]">
              {rec.subject.name}
            </span>
          </div>

          <p className="text-2xl sm:text-3xl font-black text-[#4d1f14] mt-2">
            {rec.level.name}
          </p>
          <p className="text-lg sm:text-xl font-bold text-[#7d3b2c] mt-1">
            {rec.step.title}
          </p>

          <Link
            to="/drill/$levelId/$stepId"
            params={{ levelId: rec.level.id, stepId: rec.step.id }}
            className="btn-kid btn-primary mt-6 w-full text-xl flex items-center justify-center gap-2"
          >
            <span>はじめる</span>
          </Link>
        </section>
      )}

      {/* ドリル ＆ かんがえる（参考画像準拠のスカイブルー粘土 ＆ セージミント粘土カード） */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <Link
          to="/learn"
          className="clay-card-blue flex min-h-44 flex-col items-center justify-center gap-2.5 p-5 text-center transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          <div className="clay-tile-blue size-14">
            <Pencil className="size-8 text-white" aria-hidden />
          </div>
          <span className="text-2xl font-black text-[#173d57]">ドリル</span>
          <span className="text-xs sm:text-sm font-extrabold text-[#3a6988]">テンポよく 10問</span>
        </Link>

        <Link
          to="/think"
          className="clay-card-mint flex min-h-44 flex-col items-center justify-center gap-2.5 p-5 text-center transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          <div className="clay-tile-mint size-14">
            <Brain className="size-8 text-white" aria-hidden />
          </div>
          <span className="text-2xl font-black text-[#1e4537]">かんがえる</span>
          <span className="text-xs sm:text-sm font-extrabold text-[#38705c]">じっくり 2〜3問</span>
        </Link>
      </div>

      {/* クイックアクションリスト（立体アイテム） */}
      <div className="mt-5 space-y-3.5">
        {contNext && (
          <Link
            to="/drill/$levelId/$stepId"
            params={{ levelId: contNext.level.id, stepId: contNext.step.id }}
            className="clay-card flex min-h-18 items-center gap-4 p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="clay-tile-peach size-11 shrink-0 text-white font-black text-lg">
              ▶
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-[#ea6340] block">つづきから</span>
              <p className="truncate text-base sm:text-lg font-black text-foreground">
                {contNext.subject.name} {contNext.level.name}・{contNext.step.title}
              </p>
            </div>
          </Link>
        )}

        {due > 0 && (
          <Link
            to="/review"
            className="clay-card flex min-h-18 items-center gap-4 p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="clay-tile-lavender size-11 shrink-0 text-white">
              <RotateCcw className="size-6" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-[#85458c] block">ふくしゅう</span>
              <p className="text-base sm:text-lg font-black text-foreground">{due}問 まってるよ</p>
            </div>
          </Link>
        )}

        <Link
          to="/challenge"
          className="clay-card flex min-h-18 items-center gap-4 p-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="clay-tile-yellow size-11 shrink-0 text-white">
            <Trophy className="size-6" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-black text-[#b8851c] block">こんしゅうの チャレンジ</span>
            <p className="text-base sm:text-lg font-black text-foreground">
              あと 3回 がくしゅうすると 達成！
            </p>
          </div>
          <span className="clay-badge text-xs font-black bg-primary-soft text-primary-dark shrink-0">
            +50P
          </span>
        </Link>
      </div>
    </KidShell>
  );
}
