import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { X, Trophy } from "lucide-react";
import { useRequireChild } from "@/components/KidShell";
import { ThinkingSolver } from "@/components/ThinkingSolver";
import { findThinking, weekKey, weeklyChallenge, DIFFICULTY_LABEL } from "@/lib/thinking";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/challenge")({
  head: () => ({
    meta: [
      { title: "こんしゅうのチャレンジ｜まなびポケット" },
      { name: "description", content: "週に1回の難問チャレンジ。解けなくても記録され、あとで再挑戦できます。" },
      { property: "og:title", content: "週替わりチャレンジ｜まなびポケット" },
      { property: "og:description", content: "ちょっと難しい1問に挑戦。挑戦の記録がたまっていきます。" },
    ],
  }),
  component: Challenge,
});

function Challenge() {
  const child = useRequireChild();
  const attempts = useApp((s) => s.attempts);
  const addAttempt = useApp((s) => s.addAttempt);
  const [solving, setSolving] = useState<string | null>(null);
  if (!child) return null;
  const week = weekKey();
  const current = weeklyChallenge();
  const history = attempts.filter((a) => a.childId === child.id && a.challengeWeek);
  const unsolvedPast = [...new Set(history.filter((a) => !a.solved).map((a) => a.problemId))].filter(
    (id) => id !== current.id && !history.some((h) => h.problemId === id && h.solved),
  );
  const solving_p = solving ? findThinking(solving) : null;

  return (
    <div className="min-h-screen bg-think text-think-deep">
      <div className="mx-auto max-w-3xl px-5 py-5">
        <div className="mb-6 flex items-center gap-3">
          {solving_p ? (
            <button className="tap inline-flex items-center justify-center rounded-full bg-surface" onClick={() => setSolving(null)} aria-label="もどる"><X className="size-6" /></button>
          ) : (
            <Link to="/" className="tap inline-flex items-center justify-center rounded-full bg-surface" aria-label="ホームへ"><X className="size-6" /></Link>
          )}
          <p className="text-lg font-bold">こんしゅうの チャレンジ</p>
        </div>

        {solving_p ? (
          <ThinkingSolver
            key={solving_p.id}
            problem={solving_p}
            onDone={(o) => {
              addAttempt({ childId: child.id, problemId: solving_p.id, typeTag: solving_p.typeTag, challengeWeek: week, ...o });
              setSolving(null);
            }}
          />
        ) : (
          <>
            <section className="rounded-2xl bg-surface p-6 text-center">
              <Trophy className="mx-auto size-14 text-primary" aria-hidden />
              <p className="mt-2 text-lg font-bold">{DIFFICULTY_LABEL[current.difficulty]}・{current.typeTag}</p>
              <p className="mt-3 text-2xl leading-relaxed font-bold">{current.question}</p>
              <p className="mt-3 text-base text-muted-foreground">とけなくても だいじょうぶ。ちょうせんした ことが きろくに のこるよ。</p>
              <button className="btn-kid btn-primary mt-6 w-full" onClick={() => setSolving(current.id)}>
                {history.some((h) => h.problemId === current.id) ? "もういちど ちょうせん" : "ちょうせんする"}
              </button>
            </section>
            {unsolvedPast.length > 0 && (
              <section className="mt-6">
                <h2 className="text-xl font-bold">まえの チャレンジに さいちょうせん</h2>
                <div className="mt-3 space-y-2">
                  {unsolvedPast.map((id) => {
                    const p = findThinking(id);
                    return p ? (
                      <button key={id} onClick={() => setSolving(id)} className="flex min-h-16 w-full items-center rounded-xl bg-surface px-4 text-left text-lg">
                        {p.question.slice(0, 32)}…
                      </button>
                    ) : null;
                  })}
                </div>
              </section>
            )}
            <section className="mt-6">
              <h2 className="text-xl font-bold">ちょうせんの きろく</h2>
              {history.length === 0 ? (
                <p className="mt-2 text-lg">まだ ないよ。さいしょの ちょうせんを しよう！</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {[...history].reverse().slice(0, 10).map((h) => (
                    <li key={h.id} className="flex items-center gap-3 rounded-xl bg-surface p-4 text-lg">
                      <span className="text-2xl">{h.solved ? "◎" : "△"}</span>
                      <span>{new Date(h.at).toLocaleDateString("ja-JP")}</span>
                      <span className="text-muted-foreground">{h.solved ? (h.hintLevel === 0 ? "じりきで とけた" : `ヒント${h.hintLevel}で とけた`) : "ちょうせんした"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
