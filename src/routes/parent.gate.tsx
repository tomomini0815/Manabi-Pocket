import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/parent/gate")({
  head: () => ({
    meta: [
      { title: "保護者確認｜まなびポケット" },
      { name: "description", content: "保護者モードへ入るための確認です。" },
      { property: "og:title", content: "保護者確認｜まなびポケット" },
      { property: "og:description", content: "保護者向け画面への入り口。" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Gate,
});

function Gate() {
  const [q] = useState(() => ({ a: 11 + Math.floor(Math.random() * 8), b: 6 + Math.floor(Math.random() * 3) }));
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const unlock = useApp((s) => s.setParentUnlocked);
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-parent px-4">
      <form
        className="w-full max-w-sm rounded-xl border bg-surface p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (Number(v) === q.a * q.b) {
            unlock(true);
            navigate({ to: "/parent" });
          } else {
            setErr(true);
            setV("");
          }
        }}
      >
        <h1 className="text-lg font-bold">保護者の方の確認</h1>
        <p className="mt-1 text-sm text-muted-foreground">次の計算の答えを入力してください。</p>
        <label className="mt-4 block text-2xl font-bold">
          {q.a} × {q.b} =
          <input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ""))} className="mt-2 h-12 w-full rounded-md border px-3 text-xl" aria-invalid={err} autoFocus />
        </label>
        {err && <p className="mt-2 text-sm" style={{ color: "var(--primary-dark)" }}>答えが違います。</p>}
        <button className="mt-4 h-12 w-full rounded-md bg-foreground font-bold text-surface">確認</button>
        <Link to="/" className="mt-3 block text-center text-sm text-muted-foreground underline">子ども画面に戻る</Link>
      </form>
    </div>
  );
}
