import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { useRequireChild, SoundToggle } from "@/components/KidShell";
import { ThinkingSolver } from "@/components/ThinkingSolver";
import { Pocket } from "@/components/Pocket";
import { findStep } from "@/lib/curriculum";
import { pickSession, type ThinkProblem } from "@/lib/thinking";
import { growthStage, useApp } from "@/lib/store";

export const Route = createFileRoute("/think")({
  head: () => ({
    meta: [
      { title: "かんがえる｜まなびポケット" },
      { name: "description", content: "じっくり考える思考力問題。時間制限なし、段階ヒントとひらめきノート付き。" },
      { property: "og:title", content: "かんがえるモード｜まなびポケット" },
      { property: "og:description", content: "場合の数・論理・図形・規則性。1問ずつじっくり取り組もう。" },
    ],
  }),
  component: Think,
});

function Think() {
  const child = useRequireChild();
  const navigate = useNavigate();
  const attempts = useApp((s) => s.attempts);
  const sessions = useApp((s) => s.sessions);
  const addAttempt = useApp((s) => s.addAttempt);
  const [problems] = useState<ThinkProblem[]>(() =>
    pickSession(child?.grade ?? 3, new Set(attempts.filter((a) => a.childId === child?.id && a.solved).map((a) => a.problemId))),
  );
  const [i, setI] = useState(0);
  const [stuckStreak, setStuckStreak] = useState(0);
  const [stuckPrereqs, setStuckPrereqs] = useState<string[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  if (!child) return null;
  const stage = growthStage(sessions.filter((s) => s.childId === child.id).length + attempts.filter((a) => a.childId === child.id).length);
  const p = problems[i];

  // consecutive stuck across sessions also counts
  const mine = attempts.filter((a) => a.childId === child.id);
  const lastTwoStuck = mine.length >= 2 && mine.slice(-2).every((a) => !a.solved || a.hintLevel >= 3);

  return (
    <div className="min-h-screen bg-think text-think-deep">
      <div className="mx-auto max-w-3xl px-5 py-5">
        <div className="mb-6 flex items-center gap-3">
          <button type="button" className="tap inline-flex items-center justify-center rounded-full bg-surface" onClick={() => navigate({ to: "/" })} aria-label="やめる">
            <X className="size-6" />
          </button>
          <p className="flex-1 text-lg font-bold">かんがえる　{Math.min(i + 1, problems.length)} / {problems.length}</p>
          <SoundToggle />
        </div>

        {p ? (
          <ThinkingSolver
            key={p.id}
            problem={p}
            onDone={(o) => {
              addAttempt({ childId: child.id, problemId: p.id, typeTag: p.typeTag, ...o });
              const stuck = !o.solved || o.hintLevel >= 3;
              setStuckStreak(stuck ? stuckStreak + 1 : 0);
              if (stuck) setStuckPrereqs([...new Set([...stuckPrereqs, ...p.prereq])]);
              setResults([...results, o.solved]);
              setI(i + 1);
            }}
          />
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <Pocket stage={stage} size={140} happy />
            <h1 className="mt-4 text-3xl font-bold">きょうも よく かんがえたね</h1>
            <p className="mt-2 text-xl">とけた もんだい {results.filter(Boolean).length} / {results.length}</p>
            {(stuckStreak >= 2 || lastTwoStuck) && stuckPrereqs.length > 0 && (
              <div className="mt-6 w-full rounded-2xl bg-surface p-5 text-left">
                <p className="text-xl font-bold">こんな ドリルで ちからを つけよう</p>
                <div className="mt-3 space-y-2">
                  {stuckPrereqs.slice(0, 3).map((k) => {
                    const [lv, st] = k.split("/");
                    const f = lv && st ? findStep(lv, st) : null;
                    if (!f) return null;
                    return (
                      <Link key={k} to="/drill/$levelId/$stepId" params={{ levelId: f.level.id, stepId: f.step.id }} className="flex min-h-14 items-center rounded-lg border-2 border-input px-4 text-lg font-bold">
                        {f.subject.name}・{f.level.name}・{f.step.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            <Link to="/" className="btn-kid btn-think mt-8 w-full">ホームへ</Link>
          </div>
        )}
      </div>
    </div>
  );
}
