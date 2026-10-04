import { createFileRoute } from "@tanstack/react-router";
import { ParentShell } from "@/components/ParentShell";

export const Route = createFileRoute("/parent/settings")({
  head: () => ({ meta: [{ title: "保護者 settings｜まなびポケット" }, { name: "description", content: "保護者向け設定画面。" }, { property: "og:title", content: "保護者 settings" }, { property: "og:description", content: "保護者向け設定画面。" }] }),
  component: () => (
    <ParentShell>
      <p className="text-muted-foreground">この画面は準備中です。</p>
    </ParentShell>
  ),
});
