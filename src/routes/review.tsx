import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { DrillSession, type DrillResult } from "@/components/DrillSession";
import { ResultView } from "@/components/ResultView";
import { ThinkingSolver, type ThinkOutcome } from "@/components/ThinkingSolver";
import { useRequireChild, SoundToggle } from "@/components/KidShell";
import { Pocket } from "@/components/Pocket";
import { findStep } from "@/lib/curriculum";
import { generate } from "@/lib/generators";
import { findThinking, paramProblem } from "@/lib/thinking";
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
  const attempts = useApp((s) => s.attempts);
  const addAttempt = useApp((s) => s.addAttempt);

  // 対象アイテム：期日到来の問題（時刻差の漏れを防ぐため child の復習があれば確実に抽出）
  const candidateItems = useMemo(() => {
    if (!child) return [];
    const now = Date.now();
    const dueItems = reviews.filter((r) => r.childId === child.id && r.due <= now);
    if (dueItems.length > 0) return dueItems.slice(0, 10);
    const childReviews = reviews.filter((r) => r.childId === child.id);
    return childReviews.slice(0, 10);
  }, [reviews, child]);

  // セッション進行用アイテムリスト
  const [sessionItems, setSessionItems] = useState<ReviewItem[] | null>(null);

  if (sessionItems === null && candidateItems.length > 0) {
    setSessionItems(candidateItems);
  }

  const items = sessionItems ?? candidateItems;
  const [result, setResult] = useState<DrillResult | null>(null);

  // 思考力問題の進行ステート
  const [thinkIndex, setThinkIndex] = useState(0);
  const [thinkOutcomes, setThinkOutcomes] = useState<{ seed: number; ok: boolean }[]>([]);

  if (!child) return null;
  const stage = growthStage(
    sessions.filter((s) => s.childId === child.id).length +
      attempts.filter((a) => a.childId === child.id).length,
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
        <Pocket stage={stage} size={130} happy />
        <h1 className="mt-4 text-3xl font-bold">ふくしゅうは ないよ！</h1>
        <p className="mt-2 text-muted-foreground">まちがえた問題が出たら、ここでもう一度チャレンジできます。</p>
        <Link to="/" className="btn-kid btn-primary mt-8 w-full">
          ホームへ
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <ResultView
        result={result}
        passed={result.correct === result.total}
        stage={stage}
        needBreak={false}
        onRetry={() => navigate({ to: "/" })}
      />
    );
  }

  // 現在の復習アイテム
  const currentItem = items[thinkIndex] ?? items[0]!;
  const found = findStep(currentItem.levelId, currentItem.stepId);
  const isThinking =
    found?.step.generator === "thinking" ||
    found?.subject.id === "thinking" ||
    currentItem.levelId.startsWith("think");

  // 思考力問題の場合：ThinkingSolver で個別に出題
  if (isThinking) {
    const pId = typeof found?.step.params?.["problemId"] === "string" ? (found.step.params["problemId"] as string) : "";
    const thinkProb = (pId ? findThinking(pId) : null) || paramProblem(currentItem.seed);

    const handleThinkDone = (o: ThinkOutcome) => {
      resolve(currentItem.id, o.solved);
      addAttempt({ childId: child.id, problemId: thinkProb.id, typeTag: thinkProb.typeTag, ...o });
      record(
        {
          childId: child.id,
          subjectId: found?.subject.id ?? "thinking",
          levelId: currentItem.levelId,
          stepId: currentItem.stepId,
          durationSec: o.timeSec,
          correct: o.solved ? 1 : 0,
          total: 1,
          passed: o.solved,
          review: true,
        },
        [],
      );

      const nextResults = [...thinkOutcomes, { seed: currentItem.seed, ok: o.solved }];
      setThinkOutcomes(nextResults);

      if (thinkIndex + 1 < items.length) {
        setThinkIndex(thinkIndex + 1);
      } else {
        const correctCount = nextResults.filter((x) => x.ok).length;
        setResult({
          correct: correctCount,
          total: nextResults.length,
          durationSec: 0,
          wrongSeeds: nextResults.filter((x) => !x.ok).map((x) => x.seed),
          perProblem: nextResults,
        });
      }
    };

    return (
      <div className="min-h-screen bg-[#f5efe6] text-foreground">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 md:px-8 pt-2.5 sm:pt-3.5 md:pt-4 lg:pt-6 pb-12 sm:pb-16">
          <div className="mb-2 sm:mb-3 lg:mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                className="tap clay-tile-white size-9 sm:size-10 lg:size-11 !rounded-2xl transition-transform hover:scale-105 active:scale-95"
                onClick={() => navigate({ to: "/" })}
                aria-label="やめる"
              >
                <X className="size-5 lg:size-6 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <span className="clay-badge text-[11px] font-black bg-primary-soft text-primary-dark">
                  ふくしゅう {thinkIndex + 1} / {items.length}
                </span>
                <p className="text-base sm:text-lg md:text-xl font-black text-foreground truncate mt-0.5">
                  {found?.subject.name ?? "しこうりょく"}・{found?.step.title ?? thinkProb.typeTag}
                </p>
              </div>
            </div>
            <SoundToggle />
          </div>

          <ThinkingSolver key={`${currentItem.id}-${thinkIndex}`} problem={thinkProb} onDone={handleThinkDone} />
        </div>
      </div>
    );
  }

  // ドリル問題の場合：DrillSession で出題
  return (
    <DrillSession
      title="ふくしゅう"
      color="var(--retry)"
      total={items.length}
      stage={stage}
      makeProblem={(i) => {
        const it = items[i % items.length] ?? items[0]!;
        const f = findStep(it.levelId, it.stepId);
        return generate(f?.step.generator ?? "add", f?.step.params ?? {}, it.seed);
      }}
      onQuit={() => navigate({ to: "/" })}
      onFinish={(r) => {
        r.perProblem.forEach((p, i) => {
          const item = items[i];
          if (item) resolve(item.id, p.ok);
        });
        const first = items[0]!;
        const f = findStep(first.levelId, first.stepId);
        record(
          {
            childId: child.id,
            subjectId: f?.subject.id ?? "math",
            levelId: first.levelId,
            stepId: first.stepId,
            durationSec: r.durationSec,
            correct: r.correct,
            total: r.total,
            passed: false,
            review: true,
          },
          [],
        );
        setResult(r);
      }}
    />
  );
}
