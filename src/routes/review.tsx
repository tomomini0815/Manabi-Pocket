import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DrillSession, type DrillResult } from "@/components/DrillSession";
import { ResultView } from "@/components/ResultView";
import { useRequireChild } from "@/components/KidShell";
import { Pocket } from "@/components/Pocket";
import { findStep } from "@/lib/curriculum";
import { generate } from "@/lib/generators";
import { growthStage, useApp, type ReviewItem } from "@/lib/store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "ふくしゅう｜まなびポケット" },
      { name: "description", content: "まちがえた問題を1日後・3日後・7日後にもう一度。" },
      { property: "og:title", content: "ふくしゅう｜まなびポケット" },
      { property: "og:description", content: "間隔をあけて苦手をくりかえし、しっかり定着。" },
    ],
  }),
  component: Review,
});

function Review() {
  const child = useRequireChild();
  const navigate = useNavigate();
  const reviews = useApp((s) => s.reviews);
  const resolve = useApp((s) => s.resolveReview);
  const record = useApp((s) => s.recordSession);
  const sessions = useApp((s) => s.sessions);
  const [items] = useState<ReviewItem[]>(() =>
    reviews.filter((r) => r.childId === child?.id && r.due <= Date.now()).slice(0, 10),
  );
  const [result, setResult] = useState<DrillResult | null>(null);
  if (!child) return null;
  const stage = growthStage(sessions.filter((s) => s.childId === child.id).length);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
        <Pocket stage={stage} size={130} happy />
        <h1 className="mt-4 text-3xl font-bold">ふくしゅうは ないよ！</h1>
        <Link to="/" className="btn-kid btn-primary mt-8 w-full">ホームへ</Link>
      </div>
    );
  }
  if (result) {
    return <ResultView result={result} passed={result.correct === result.total} stage={stage} needBreak={false} onRetry={() => navigate({ to: "/" })} />;
  }

  return (
    <DrillSession
      title="ふくしゅう"
      color="var(--retry)"
      total={items.length}
      stage={stage}
      makeProblem={(i) => {
        const it = items[i]!;
        const f = findStep(it.levelId, it.stepId);
        return generate(f?.step.generator ?? "add", f?.step.params ?? {}, it.seed);
      }}
      onQuit={() => navigate({ to: "/" })}
      onFinish={(r) => {
        r.perProblem.forEach((p, i) => items[i] && resolve(items[i]!.id, p.ok));
        const first = items[0]!;
        const f = findStep(first.levelId, first.stepId);
        record({ childId: child.id, subjectId: f?.subject.id ?? "math", levelId: first.levelId, stepId: first.stepId, durationSec: r.durationSec, correct: r.correct, total: r.total, passed: false, review: true }, []);
        setResult(r);
      }}
    />
  );
}
