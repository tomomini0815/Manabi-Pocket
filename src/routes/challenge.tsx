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
    <div className="min-h-screen bg-[#f5efe6] text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {solving_p ? (
              <button
                className="tap clay-tile-white size-11 !rounded-2xl transition-transform hover:scale-105 active:scale-95"
                onClick={() => setSolving(null)}
                aria-label="もどる"
              >
                <X className="size-6 text-muted-foreground" />
              </button>
            ) : (
              <Link
                to="/"
                className="tap clay-tile-white size-11 !rounded-2xl transition-transform hover:scale-105 active:scale-95"
                aria-label="ホームへ"
              >
                <X className="size-6 text-muted-foreground" />
              </Link>
            )}
            <div>
              <p className="text-xl sm:text-2xl font-black text-foreground">こんしゅうの チャレンジ</p>
              <p className="text-xs font-bold text-muted-foreground">じっくり かんがえてみよう！</p>
            </div>
          </div>
          <span className="clay-badge text-xs font-black bg-primary-soft text-primary-dark shrink-0">
            🏆 週替わり難問
          </span>
        </header>

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
            <section className="clay-card p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="clay-tile-yellow size-16 mx-auto mb-3">
                <Trophy className="size-9 text-white" aria-hidden />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="clay-badge text-xs font-black bg-primary-soft text-primary-dark">
                  {current.typeTag}
                </span>
                <span className="clay-badge text-xs font-black bg-amber-100 text-amber-900 border border-amber-300/40">
                  {DIFFICULTY_LABEL[current.difficulty]}
                </span>
              </div>
              <p className="mt-4 text-2xl sm:text-3xl leading-relaxed font-black text-foreground">{current.question}</p>
              <p className="mt-3 text-base text-muted-foreground font-bold">とけなくても だいじょうぶ。ちょうせんした ことが きろくに のこるよ。</p>
              <button className="btn-kid btn-primary mt-6 w-full text-xl" onClick={() => setSolving(current.id)}>
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
