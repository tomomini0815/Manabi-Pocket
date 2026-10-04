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
  const today = mine.filter((s) => dayKey(s.at) === todayKey()).length + myAttempts.filter((a) => dayKey(a.at) === todayKey()).length;
  const due = reviews.filter((r) => r.childId === child.id && r.due <= Date.now()).length;

  return (
    <KidShell header={<p className="text-2xl font-bold">こんにちは、{child.nickname}！</p>}>
      <div className="flex items-center gap-4">
        <Pocket stage={stage} size={110} />
        <div className="card-kid flex flex-1 items-center gap-3 p-4">
          <Flame className="size-10 text-primary" aria-hidden />
          <div>
            <p className="text-3xl font-bold">{streak}<span className="text-xl">にち れんぞく</span></p>
            <div className="mt-1 flex gap-1.5" aria-label={`きょうの スタンプ ${Math.min(today, 5)}こ`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`size-5 rounded-full border-2 ${i < today ? "border-primary bg-primary" : "border-input"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {rec && (
        <section className="card-kid mt-5 overflow-hidden">
          <div className="h-2" style={{ background: SUBJECT_COLOR[rec.subject.id] }} />
          <div className="p-5">
            <p className="text-lg font-bold text-muted-foreground">きょうの おすすめ</p>
            <p className="mt-1 text-2xl font-bold">{rec.subject.name}　{rec.level.name}</p>
            <p className="text-xl text-muted-foreground">{rec.step.title}</p>
            <Link to="/drill/$levelId/$stepId" params={{ levelId: rec.level.id, stepId: rec.step.id }} className="btn-kid btn-primary mt-4 w-full text-2xl">
              はじめる
            </Link>
          </div>
        </section>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Link to="/learn" className="card-kid flex min-h-36 flex-col items-center justify-center gap-2 p-4 text-center">
          <Pencil className="size-10 text-secondary" aria-hidden />
          <span className="text-2xl font-bold">ドリル</span>
          <span className="text-base text-muted-foreground">テンポよく 10もん</span>
        </Link>
        <Link to="/think" className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl bg-think p-4 text-center text-think-deep">
          <Brain className="size-10" aria-hidden />
          <span className="text-2xl font-bold">かんがえる</span>
          <span className="text-base">じっくり 2〜3もん</span>
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {contNext && (
          <Link to="/drill/$levelId/$stepId" params={{ levelId: contNext.level.id, stepId: contNext.step.id }} className="card-kid flex min-h-16 items-center gap-3 p-4">
            <span className="size-3 rounded-full" style={{ background: SUBJECT_COLOR[contNext.subject.id] }} />
            <span className="text-lg font-bold">つづきから</span>
            <span className="truncate text-lg text-muted-foreground">{contNext.subject.name} {contNext.level.name}・{contNext.step.title}</span>
          </Link>
        )}
        {due > 0 && (
          <Link to="/review" className="card-kid flex min-h-16 items-center gap-3 p-4">
            <RotateCcw className="size-6 text-retry" aria-hidden />
            <span className="text-lg font-bold">ふくしゅう</span>
            <span className="text-lg text-muted-foreground">{due}もん まってるよ</span>
          </Link>
        )}
        <Link to="/challenge" className="card-kid flex min-h-16 items-center gap-3 p-4">
          <Trophy className="size-6 text-primary" aria-hidden />
          <span className="text-lg font-bold">こんしゅうの チャレンジ</span>
        </Link>
      </div>
    </KidShell>
  );
}
