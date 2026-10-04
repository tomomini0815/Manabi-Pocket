import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DrillSession, type DrillResult } from "@/components/DrillSession";
import { ResultView } from "@/components/ResultView";
import { useRequireChild } from "@/components/KidShell";
import { SUBJECT_COLOR, findStep } from "@/lib/curriculum";
import { generate, newSeed } from "@/lib/generators";
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
  const child = useRequireChild();
  const navigate = useNavigate();
  const record = useApp((s) => s.recordSession);
  const sessions = useApp((s) => s.sessions);
  const attempts = useApp((s) => s.attempts);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<{ r: DrillResult; passed: boolean; brk: boolean } | null>(null);
  const found = findStep(levelId, stepId);

  if (!child) return null;
  if (!found) return <p className="p-8 text-xl">ステップが みつかりません</p>;
  const { subject, level, step, next } = found;
  const stage = growthStage(sessions.filter((s) => s.childId === child.id).length + attempts.filter((a) => a.childId === child.id).length);

  if (result) {
    return (
      <ResultView
        result={result.r}
        passed={result.passed}
        targetSec={step.targetSec}
        stage={stage}
        needBreak={result.brk}
        onRetry={() => { setResult(null); setRound(round + 1); }}
        next={next ? { levelId: level.id, stepId: next.id, title: next.title } : null}
      />
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
      makeProblem={(_i, delta) => generate(step.generator, step.params, newSeed(), delta)}
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
