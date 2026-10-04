import { createFileRoute } from "@tanstack/react-router";
import { KidShell, useRequireChild } from "@/components/KidShell";
import { Pocket } from "@/components/Pocket";
import { growthStage, streakOf, studyDays, useApp, dayKey } from "@/lib/store";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "ごほうび｜まなびポケット" },
      { name: "description", content: "あつめたスタンプと、育っていく「ぽけっと」のコレクション。" },
      { property: "og:title", content: "ごほうび｜まなびポケット" },
      { property: "og:description", content: "学ぶほどに種から実へ。スタンプ台帳で毎日の記録を見よう。" },
    ],
  }),
  component: Rewards,
});

const STAGES = [
  { need: 0, name: "たね" },
  { need: 3, name: "め" },
  { need: 10, name: "き" },
  { need: 25, name: "み" },
];

const BADGES = [
  { id: "first", label: "はじめての ステップ", test: (n: { clears: number }) => n.clears >= 1, icon: "🌱" },
  { id: "five", label: "5ステップ クリア", test: (n: { clears: number }) => n.clears >= 5, icon: "🌿" },
  { id: "streak3", label: "3にち れんぞく", test: (n: { streak: number }) => n.streak >= 3, icon: "🔥" },
  { id: "streak7", label: "7にち れんぞく", test: (n: { streak: number }) => n.streak >= 7, icon: "🌈" },
  { id: "self", label: "じりきで とけた", test: (n: { self: number }) => n.self >= 1, icon: "💡" },
  { id: "challenge", label: "チャレンジャー", test: (n: { chal: number }) => n.chal >= 1, icon: "🏆" },
];

function Rewards() {
  const child = useRequireChild();
  const sessions = useApp((s) => s.sessions);
  const attempts = useApp((s) => s.attempts);
  const progress = useApp((s) => s.progress);
  if (!child) return null;
  const mine = sessions.filter((s) => s.childId === child.id);
  const ma = attempts.filter((a) => a.childId === child.id);
  const count = mine.length + ma.length;
  const stage = growthStage(count);
  const days = studyDays(child.id, sessions, attempts);
  const stats = {
    clears: Object.keys(progress[child.id] ?? {}).length,
    streak: streakOf(days),
    self: ma.filter((a) => a.solved && a.hintLevel === 0).length,
    chal: ma.filter((a) => a.challengeWeek).length,
  };
  const nextStage = STAGES[stage + 1];

  // last 28 days stamp book
  const cells = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return { key: dayKey(d.getTime()), day: d.getDate() };
  });

  return (
    <KidShell header={<h1 className="text-2xl font-bold">ごほうび</h1>}>
      <section className="card-kid flex flex-col items-center p-6 text-center">
        <Pocket stage={stage} size={170} />
        <p className="mt-2 text-2xl font-bold">ぽけっと（{STAGES[stage]!.name}）</p>
        {nextStage ? (
          <p className="text-lg text-muted-foreground">あと {nextStage.need - count}かい がくしゅうすると「{nextStage.name}」に そだつよ</p>
        ) : (
          <p className="text-lg text-muted-foreground">みが なったよ！ すごい！</p>
        )}
        <div className="mt-4 flex gap-3">
          {STAGES.map((s, i) => (
            <div key={s.name} className={i <= stage ? "" : "opacity-30 grayscale"}>
              <Pocket stage={i} size={56} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">スタンプだいちょう</h2>
        <div className="card-kid mt-3 grid grid-cols-7 gap-2 p-4">
          {cells.map((c) => (
            <div key={c.key} className={`flex aspect-square items-center justify-center rounded-full text-sm font-bold ${days.has(c.key) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {days.has(c.key) ? "◎" : c.day}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">コレクション</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {BADGES.map((b) => {
            const got = b.test(stats as never);
            return (
              <div key={b.id} className={`card-kid flex min-h-28 flex-col items-center justify-center p-3 text-center ${got ? "" : "opacity-40 grayscale"}`}>
                <span className="text-4xl">{got ? b.icon : "？"}</span>
                <span className="mt-1 text-base font-bold">{b.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </KidShell>
  );
}
