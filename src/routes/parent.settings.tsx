import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ParentShell } from "@/components/ParentShell";
import { GRADES, clampGrade, recommendedLevelFor } from "@/lib/curriculum";
import { useActiveChild, useApp, type RubyMode } from "@/lib/store";
import { Check, User } from "lucide-react";

export const Route = createFileRoute("/parent/settings")({
  head: () => ({
    meta: [
      { title: "保護者 設定｜まなびポケット" },
      { name: "description", content: "お子様の学年やニックネーム、漢字表示の設定を変更できます。" },
      { property: "og:title", content: "保護者 設定" },
      { property: "og:description", content: "お子様の学年・プロフィール設定。" },
    ],
  }),
  component: ParentSettings,
});

function ParentSettings() {
  const child = useActiveChild();
  const updateChild = useApp((s) => s.updateChild);
  const [saved, setSaved] = useState(false);

  if (!child) {
    return (
      <ParentShell>
        <p className="text-muted-foreground">子どもが登録されていません。</p>
      </ParentShell>
    );
  }

  const currentGrade = clampGrade(child.grade);

  const handleGradeChange = (newGrade: number) => {
    const recLevel = recommendedLevelFor(newGrade);
    updateChild(child.id, { grade: newGrade, recommendedLevel: recLevel });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRubyChange = (ruby: RubyMode) => {
    updateChild(child.id, { rubyMode: ruby });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ParentShell>
      <div className="max-w-xl space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{child.nickname} さんの設定</h2>
              <p className="text-sm text-muted-foreground">現在の設定学年：{GRADES[currentGrade]}</p>
            </div>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
              <Check className="size-4" />
              保存しました
            </span>
          )}
        </div>

        {/* 学年の変更（幼児〜6年生） */}
        <div>
          <label className="block text-base font-bold mb-2">学年（学習レベルの目安）</label>
          <p className="text-xs text-muted-foreground mb-3">
            ここで選択した学年に合わせて、がくしゅう画面（/learn）でおすすめレベルが自動分類・フォーカスされます。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GRADES.map((g, idx) => {
              const isSelected = currentGrade === idx;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGradeChange(idx)}
                  className={`tap rounded-xl border-2 px-3 py-2.5 text-center font-bold transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-xs"
                      : "border-input bg-surface hover:border-primary/50 text-foreground"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* 漢字表示モード */}
        <div className="border-t pt-4">
          <label className="block text-base font-bold mb-2">漢字の表示</label>
          <div className="grid grid-cols-3 gap-2">
            {([["hira", "ひらがな"], ["ruby", "ふりがな"], ["kanji", "漢字"]] as const).map(([val, label]) => {
              const isSelected = child.rubyMode === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleRubyChange(val)}
                  className={`tap rounded-xl border-2 px-3 py-2.5 text-center font-bold transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-xs"
                      : "border-input bg-surface hover:border-primary/50 text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
