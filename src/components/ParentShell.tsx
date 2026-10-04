import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/store";

export function ParentShell({ children }: { children: ReactNode }) {
  const unlocked = useApp((s) => s.parentUnlocked);
  const lock = useApp((s) => s.setParentUnlocked);
  const navigate = useNavigate();
  useEffect(() => {
    if (!unlocked) navigate({ to: "/parent/gate" });
  }, [unlocked, navigate]);
  if (!unlocked) return null;

  const link = "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted";
  return (
    <div className="min-h-screen bg-parent text-foreground">
      <header className="border-b bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-4 font-bold">まなびポケット｜保護者</span>
          <Link to="/parent" activeOptions={{ exact: true }} className={link} activeProps={{ className: "bg-muted text-foreground" }}>ダッシュボード</Link>
          <Link to="/parent/paper" className={link} activeProps={{ className: "bg-muted text-foreground" }}>紙テキスト進捗</Link>
          <Link to="/parent/settings" className={link} activeProps={{ className: "bg-muted text-foreground" }}>子ども設定</Link>
          <button
            type="button"
            className="ml-auto rounded-md border px-3 py-2 text-sm"
            onClick={() => {
              lock(false);
              navigate({ to: "/" });
            }}
          >
            子ども画面へ戻る
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
