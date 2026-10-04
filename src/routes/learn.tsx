import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { KidShell, useRequireChild } from "@/components/KidShell";
import { SUBJECT_COLOR, subjects, stepKey } from "@/lib/curriculum";
import { isStepOpen } from "@/lib/selectors";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "がくしゅう｜まなびポケット" },
      { name: "description", content: "教科ごとのレベルマップ。学年に関係なく、好きなレベルから先取りできます。" },
      { property: "og:title", content: "レベルマップ｜まなびポケット" },
      { property: "og:description", content: "さんすう・こくご・えいごのスモールステップを道のように進もう。" },
    ],
  }),
  component: Learn,
});

function Learn() {
  const child = useRequireChild();
  const progress = useApp((s) => s.progress);
  const [sid, setSid] = useState(subjects[0]!.id);
  if (!child) return null;
  const prog = progress[child.id] ?? {};
  const subject = subjects.find((s) => s.id === sid)!;
  const color = SUBJECT_COLOR[sid];

  return (
    <KidShell header={<h1 className="text-2xl font-bold">がくしゅう</h1>}>
      <div className="grid grid-cols-4 gap-2" role="tablist">
        {subjects.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === sid}
            onClick={() => setSid(s.id)}
            className="tap rounded-lg px-2 py-3 text-lg font-bold"
            style={s.id === sid ? { background: SUBJECT_COLOR[s.id], color: "var(--surface)" } : { background: "var(--surface)" }}
          >
            <span className="block text-xl">{s.icon}</span>
            {s.name}
          </button>
        ))}
        <Link to="/think" className="tap rounded-lg bg-think px-2 py-3 text-center text-lg font-bold text-think-deep">
          <span className="block text-xl">💡</span>しこうりょく
        </Link>
      </div>

      <div className="mt-6 space-y-8">
        {subject.levels.map((level) => (
          <section key={level.id}>
            <h2 className="mb-3 text-xl font-bold">{level.name}</h2>
            <ol className="relative ml-6 space-y-4 border-l-4 border-dashed pl-6" style={{ borderColor: color }}>
              {level.steps.map((st, i) => {
                const done = !!prog[stepKey(level.id, st.id)];
                const open = isStepOpen(prog, level.id, i);
                const current = open && !done;
                const node = (
                  <div className={`card-kid flex min-h-16 items-center gap-3 p-4 ${!open ? "opacity-50" : ""}`}>
                    <span
                      className={`-ml-[52px] flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${current ? "animate-glow" : ""}`}
                      style={{ background: done ? color : current ? "var(--primary)" : "var(--border)", color: "var(--surface)" }}
                    >
                      {done ? <Check className="size-6" /> : !open ? <Lock className="size-5" /> : i + 1}
                    </span>
                    <span className="text-lg font-bold">ステップ{i + 1}</span>
                    <span className="text-lg text-muted-foreground">{st.title}</span>
                    {done && <span className="ml-auto text-sm font-bold" style={{ color: "var(--correct)" }}>クリア</span>}
                  </div>
                );
                return (
                  <li key={st.id}>
                    {open ? (
                      <Link to="/drill/$levelId/$stepId" params={{ levelId: level.id, stepId: st.id }} aria-label={`${level.name} ステップ${i + 1} ${st.title}${done ? " クリア" : ""}`}>
                        {node}
                      </Link>
                    ) : (
                      <div aria-label={`ステップ${i + 1} まだ ひらいていない`}>{node}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </KidShell>
  );
}
