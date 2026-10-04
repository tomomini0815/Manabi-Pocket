import { createFileRoute } from "@tanstack/react-router";
import { ParentShell } from "@/components/ParentShell";

export const Route = createFileRoute("/parent/paper")({
  head: () => ({ meta: [{ title: "保護者 paper｜まなびポケット" }, { name: "description", content: "保護者向け設定画面。" }, { property: "og:title", content: "保護者 paper" }, { property: "og:description", content: "保護者向け設定画面。" }] }),
  component: () => (
    <ParentShell>
      <p className="text-muted-foreground">この画面は準備中です。</p>
    </ParentShell>
  ),
});
