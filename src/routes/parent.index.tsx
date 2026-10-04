import { createFileRoute } from "@tanstack/react-router";
import { ParentShell } from "@/components/ParentShell";
import { useActiveChild, useApp } from "@/lib/store";

export const Route = createFileRoute("/parent/")({
  head: () => ({ meta: [{ title: "保護者ダッシュボード｜まなびポケット" }, { name: "description", content: "学習日数・時間・正答率・自力で解いた割合。" }, { property: "og:title", content: "保護者ダッシュボード" }, { property: "og:description", content: "学習状況をひと目で。" }] }),
  component: Dashboard,
});

function Dashboard() {
  const child = useActiveChild();
  const sessions = useApp((s) => s.sessions).filter((s) => s.childId === child?.id);
  const attempts = useApp((s) => s.attempts).filter((a) => a.childId === child?.id);
  const total = sessions.reduce((n, s) => n + s.total, 0);
  const correct = sessions.reduce((n, s) => n + s.correct, 0);
  const sec = sessions.reduce((n, s) => n + s.durationSec, 0) + attempts.reduce((n, a) => n + a.timeSec, 0);
  const self = attempts.filter((a) => a.solved && a.hintLevel === 0).length;
  const card = "rounded-lg border bg-surface p-4";
  return (
    <ParentShell>
      <h1 className="text-xl font-bold">{child?.nickname ?? "—"} さんの学習状況</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className={card}><p className="text-sm text-muted-foreground">自力で解いた割合</p><p className="text-2xl font-bold">{attempts.length ? Math.round((self / attempts.length) * 100) : 0}%</p></div>
        <div className={card}><p className="text-sm text-muted-foreground">ドリル正答率</p><p className="text-2xl font-bold">{total ? Math.round((correct / total) * 100) : 0}%</p></div>
        <div className={card}><p className="text-sm text-muted-foreground">合計時間</p><p className="text-2xl font-bold">{Math.round(sec / 60)}分</p></div>
        <div className={card}><p className="text-sm text-muted-foreground">セッション数</p><p className="text-2xl font-bold">{sessions.length + attempts.length}</p></div>
      </div>
    </ParentShell>
  );
}
