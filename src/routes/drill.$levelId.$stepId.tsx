import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { DrillSession, type DrillResult } from "@/components/DrillSession";
import { ResultView } from "@/components/ResultView";
import { ThinkingSolver, type ThinkOutcome } from "@/components/ThinkingSolver";
import { useRequireChild, SoundToggle } from "@/components/KidShell";
import { SUBJECT_COLOR, findStep } from "@/lib/curriculum";
import { generate, newSeed } from "@/lib/generators";
import { findThinking, paramProblem } from "@/lib/thinking";
import { growthStage, useApp } from "@/lib/store";

export const Route = createFileRoute("/drill/$levelId/$stepId")({
  head: () => ({
    meta: [
      { title: "ドリル｜まなびポケット" },
      { name: "description", content: "10問のドリル。正答率90%以上・目標タイム内でステップクリア。" },
      { property: "og:title", content: "ドリル｜まなびポケット" },
      { property: "og:description", content: "テンポよく10問。スモールステップで基礎を身につけよう。" },
    ],
  }),
  component: Drill,
});

const TOTAL = 10;

export function needBreakNow(sessions: { childId: string; at: number; durationSec: number }[], childId: string, extraSec: number) {
  const since = Date.now() - 20 * 60000;
  const sec = sessions.filter((s) => s.childId === childId && s.at > since).reduce((n, s) => n + s.durationSec, 0);
  return sec + extraSec >= 15 * 60;
}

function Drill() {
  const { levelId, stepId } = Route.useParams();
  return <DrillInner key={`${levelId}-${stepId}`} levelId={levelId} stepId={stepId} />;
}

function DrillInner({ levelId, stepId }: { levelId: string; stepId: string }) {
  const child = useRequireChild();
  const navigate = useNavigate();
  const record = useApp((s) => s.recordSession);
  const addAttempt = useApp((s) => s.addAttempt);
  const sessions = useApp((s) => s.sessions);
  const attempts = useApp((s) => s.attempts);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ r: DrillResult; passed: boolean; brk: boolean } | null>(null);
  const found = findStep(levelId, stepId);

  if (!child) return null;
  if (!found) return <p className="p-8 text-xl">ステップが みつかりません</p>;
  const { subject, level, step, next } = found;
  const stage = growthStage(sessions.filter((s) => s.childId === child.id).length + attempts.filter((a) => a.childId === child.id).length);

  // 次のステップの決定（同レベル内の次、または同教科内の次レベルのステップ1）
  const nextTarget = (() => {
    if (next) return { levelId: level.id, stepId: next.id, title: next.title };
    const levelIdx = subject.levels.findIndex((l) => l.id === level.id);
    const nextLevel = subject.levels[levelIdx + 1];
    if (nextLevel && nextLevel.steps.length > 0) {
      const firstStep = nextLevel.steps[0];
      return { levelId: nextLevel.id, stepId: firstStep.id, title: `${nextLevel.name}・${firstStep.title}` };
    }
    return null;
  })();

  if (result) {
    return (
      <ResultView
        result={result.r}
        passed={result.passed}
        targetSec={step.targetSec}
        stage={stage}
        needBreak={result.brk}
        onRetry={() => { setResult(null); setRound(round + 1); }}
        next={nextTarget}
      />
    );
  }

  // 思考力ステップの場合：ThinkingSolver（ひらめきノート、段階ヒント、ふりかえり）を出題
  if (step.generator === "thinking" || subject.id === "thinking") {
    const pId = typeof step.params?.["problemId"] === "string" ? (step.params["problemId"] as string) : "";
    const thinkProb = findThinking(pId) || paramProblem(newSeed());

    const handleThinkDone = (o: ThinkOutcome) => {
      const passed = o.solved;
      const brk = needBreakNow(sessions, child.id, o.timeSec);
      addAttempt({ childId: child.id, problemId: thinkProb.id, typeTag: thinkProb.typeTag, ...o });
      record(
        {
          childId: child.id,
          subjectId: subject.id,
          levelId: level.id,
          stepId: step.id,
          durationSec: o.timeSec,
          correct: o.solved ? 1 : 0,
          total: 1,
          passed,
        },
        o.solved ? [] : [newSeed()],
      );
      setResult({
        r: {
          correct: o.solved ? 1 : 0,
          total: 1,
          durationSec: o.timeSec,
          wrongSeeds: o.solved ? [] : [newSeed()],
          perProblem: [{ seed: 0, ok: o.solved }],
        },
        passed,
        brk,
      });
    };

    return (
      <div className="min-h-screen bg-[#f5efe6] text-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="tap clay-tile-white size-10 sm:size-11 !rounded-2xl transition-transform hover:scale-105 active:scale-95 shrink-0"
                onClick={() => navigate({ to: "/learn" })}
                aria-label="やめる"
              >
                <X className="size-5 sm:size-6 text-muted-foreground" />
              </button>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-foreground truncate">
                  {step.title}
                </p>
                <p className="text-xs font-bold text-muted-foreground truncate">
                  {subject.name}・{level.name}
                </p>
              </div>
            </div>
            <SoundToggle />
          </div>

          <ThinkingSolver key={`${levelId}-${stepId}-${round}`} problem={thinkProb} onDone={handleThinkDone} />
        </div>
      </div>
    );
  }

  return (
    <DrillSession
      key={`${levelId}-${stepId}-${round}`}
      title={`${subject.name}・${level.name}・${step.title}`}
      color={SUBJECT_COLOR[subject.id] ?? "var(--primary)"}
      total={TOTAL}
      targetSec={step.targetSec}
      stage={stage}
      makeProblem={(_i, delta, usedKeys) => generate(step.generator, step.params, newSeed(), delta, usedKeys)}
      onQuit={() => navigate({ to: "/learn" })}
      onFinish={(r) => {
        const passed = r.correct / r.total >= 0.9 && r.durationSec <= step.targetSec;
        const brk = needBreakNow(sessions, child.id, r.durationSec);
        record({ childId: child.id, subjectId: subject.id, levelId: level.id, stepId: step.id, durationSec: r.durationSec, correct: r.correct, total: r.total, passed }, r.wrongSeeds);
        setResult({ r, passed, brk });
      }}
    />
  );
}
