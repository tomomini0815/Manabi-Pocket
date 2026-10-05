import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Check, Lock, Sparkles, ChevronRight, Layers } from "lucide-react";
import { KidShell, useRequireChild } from "@/components/KidShell";
import {
  SUBJECT_COLOR,
  subjects,
  stepKey,
  GRADES,
  GRADE_SHORT,
  GRADE_ICONS,
  clampGrade,
  gradeLabel,
} from "@/lib/curriculum";
import { isStepOpen } from "@/lib/selectors";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "がくしゅう｜まなびポケット" },
      { name: "description", content: "幼児から小学6年生まで学年別にレベルをしっかり分類。自分のペースで先取りや復習もできます。" },
      { property: "og:title", content: "がくしゅうマップ｜まなびポケット" },
      { property: "og:description", content: "幼児〜6年生の学年別レベル分類。さんすう・こくご・えいご・思考力を楽しくマスター。" },
    ],
  }),
  component: Learn,
});

function Learn() {
  const child = useRequireChild();
  const progress = useApp((s) => s.progress);
  const [sid, setSid] = useState(subjects[0]!.id);

  const childGrade = clampGrade(child?.grade ?? 1);
  const [selectedGrade, setSelectedGrade] = useState<number | "all">(childGrade);

  if (!child) return null;
  const prog = progress[child.id] ?? {};
  const subject = subjects.find((s) => s.id === sid) ?? subjects[0]!;
  const color = SUBJECT_COLOR[sid] ?? "var(--primary)";

  // Filter levels based on selected grade
  const displayedLevels = useMemo(() => {
    if (selectedGrade === "all") {
      return subject.levels;
    }
    return subject.levels.filter((l) => l.startGrade === selectedGrade);
  }, [subject, selectedGrade]);

  // Compute step stats per grade for this subject
  const gradeStats = useMemo(() => {
    return GRADES.map((_, g) => {
      const lvls = subject.levels.filter((l) => l.startGrade === g);
      let total = 0;
      let cleared = 0;
      for (const lvl of lvls) {
        total += lvl.steps.length;
        cleared += lvl.steps.filter((st) => !!prog[stepKey(lvl.id, st.id)]).length;
      }
      return { total, cleared, count: lvls.length };
    });
  }, [subject, prog]);

  return (
    <KidShell
      header={
        <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap overflow-hidden">
          <h1 className="text-lg sm:text-2xl font-black text-foreground shrink-0">がくしゅう</h1>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-primary-soft px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-bold text-primary-dark truncate">
            <span>{GRADE_ICONS[childGrade]}</span>
            <span className="truncate">{child.nickname}さん：{gradeLabel(childGrade)}</span>
          </span>
        </div>
      }
    >
      {/* 1. 教科切り替えタブ（参考画像のパステル立体粘土カード準拠） */}
      <div className="grid grid-cols-4 gap-2.5" role="tablist" aria-label="きょうか">
        {subjects.map((s) => {
          const active = s.id === sid;
          const cardClass =
            s.id === "math"
              ? active ? "clay-card-blue scale-[1.04] z-10 !text-[#173d57]" : "clay-card text-[#173d57]/70 hover:scale-[1.02]"
              : s.id === "japanese"
              ? active ? "clay-card-peach scale-[1.04] z-10 !text-[#592518]" : "clay-card text-[#592518]/70 hover:scale-[1.02]"
              : s.id === "english"
              ? active ? "clay-card-lavender scale-[1.04] z-10 !text-[#432446]" : "clay-card text-[#432446]/70 hover:scale-[1.02]"
              : active ? "clay-card-mint scale-[1.04] z-10 !text-[#1e4537]" : "clay-card text-[#1e4537]/70 hover:scale-[1.02]";

          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              onClick={() => setSid(s.id)}
              className={`tap relative flex flex-col items-center justify-center p-3 text-center transition-all ${cardClass}`}
            >
              <span className="text-2xl sm:text-3xl mt-0.5">{s.icon}</span>
              <span className={`text-sm sm:text-base font-black ${active ? "font-black" : "text-muted-foreground"}`}>
                {s.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. 学年別分類セレクター（ポコポコ触りたくなる立体グループ） */}
      <div className="mt-5 clay-card p-3.5 bg-surface/90">
        <div className="flex items-center justify-between px-1 pb-2.5">
          <span className="text-xs sm:text-sm font-extrabold text-muted-foreground">学年レベルで絞り込み</span>
          {selectedGrade !== childGrade && (
            <button
              type="button"
              onClick={() => setSelectedGrade(childGrade)}
              className="text-xs font-black text-primary hover:underline inline-flex items-center gap-1"
            >
              <Sparkles className="size-3.5" />
              <span>{GRADE_SHORT[childGrade]}（自分の学年）にもどる</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 pt-2.5 pb-1">
          {GRADES.map((_, g) => {
            const isSelected = selectedGrade === g;
            const isChild = g === childGrade;
            const stat = gradeStats[g];
            const hasLevels = (stat?.count ?? 0) > 0;

            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrade(g)}
                className={`tap relative w-full !rounded-2xl pt-3.5 pb-2 px-1 text-center transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
                  isSelected
                    ? "clay-tab-active z-10"
                    : "clay-card text-foreground hover:scale-[1.03] active:scale-[0.97]"
                }`}
              >
                {isChild && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-tight shadow-sm border ${
                      isSelected
                        ? "bg-white text-primary border-white/80"
                        : "bg-primary text-white border-primary-dark/20"
                    }`}
                  >
                    <Sparkles className="size-2.5" />
                    <span>じぶん</span>
                  </span>
                )}
                <div className="flex items-center justify-center gap-1">
                  <span className="text-base">{GRADE_ICONS[g]}</span>
                  <span className="text-sm sm:text-base font-black">{GRADE_SHORT[g]}</span>
                </div>
                {hasLevels && (
                  <div className={`text-[10px] font-bold mt-0.5 ${isSelected ? "text-white/90" : "text-muted-foreground"}`}>
                    {stat?.cleared}/{stat?.total}
                  </div>
                )}
              </button>
            );
          })}

          {/* 全て表示ボタン */}
          <button
            type="button"
            onClick={() => setSelectedGrade("all")}
            className={`tap relative w-full !rounded-2xl pt-3.5 pb-2 px-1 text-center font-black transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
              selectedGrade === "all"
                ? "clay-tab-active z-10"
                : "clay-card text-muted-foreground hover:scale-[1.03] active:scale-[0.97]"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Layers className="size-4" />
              <span className="text-sm sm:text-base">すべて</span>
            </div>
            <div className={`text-[10px] mt-0.5 ${selectedGrade === "all" ? "text-white/90" : "text-muted-foreground"}`}>全学年</div>
          </button>
        </div>
      </div>

      {/* 3. レベル一覧表示 */}
      <div className="mt-6 space-y-6">
        {displayedLevels.length === 0 ? (
          <div className="clay-card p-10 text-center">
            <p className="text-4xl mb-3">{GRADE_ICONS[typeof selectedGrade === "number" ? selectedGrade : 0]}</p>
            <h3 className="text-2xl font-black">
              {typeof selectedGrade === "number" ? gradeLabel(selectedGrade) : ""}向けのコンテンツ
            </h3>
            <p className="mt-2 text-muted-foreground font-medium">
              この教科では他の学年向けレベルからステップアップできます！
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="btn-kid btn-primary text-sm py-2 px-5"
                onClick={() => setSelectedGrade("all")}
              >
                すべてのレベルを見る
              </button>
              <button
                type="button"
                className="btn-kid btn-outline text-sm py-2 px-5"
                onClick={() => setSelectedGrade(childGrade)}
              >
                {gradeLabel(childGrade)}（自分の学年）を見る
              </button>
            </div>
          </div>
        ) : (
          displayedLevels.map((level) => {
            const isChildTarget = level.startGrade === childGrade;
            const clearedCount = level.steps.filter((st) => !!prog[stepKey(level.id, st.id)]).length;
            const isAllDone = clearedCount === level.steps.length;

            return (
              <section key={level.id} className="clay-card p-5 sm:p-6">
                {/* レベルヘッダー：ぷっくり立体バッジ */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="clay-badge text-xs sm:text-sm font-black bg-muted/60 text-foreground">
                      <span>{GRADE_ICONS[level.startGrade]}</span>
                      <span>{gradeLabel(level.startGrade)}</span>
                    </span>

                    {isChildTarget && (
                      <span className="clay-badge text-xs font-black bg-primary-soft text-primary-dark">
                        <Sparkles className="size-3" />
                        おすすめ
                      </span>
                    )}

                    {isAllDone && (
                      <span className="clay-badge text-xs font-black bg-correct-soft text-correct">
                        <Check className="size-3" />
                        コンプリート！
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-extrabold text-muted-foreground">
                    {clearedCount} / {level.steps.length} クリア
                  </span>
                </div>

                <h2 className="mb-4 text-xl sm:text-2xl font-black flex items-center gap-2 text-foreground">
                  <span>{level.name}</span>
                </h2>

                <ol className="relative ml-6 space-y-3.5 border-l-2 border-dashed pl-6" style={{ borderColor: color }}>
                  {level.steps.map((st, i) => {
                    const done = !!prog[stepKey(level.id, st.id)];
                    const open = isStepOpen(prog, level.id, i);
                    const current = open && !done;
                    const node = (
                      <div
                        className={`clay-card flex min-h-16 items-center gap-3.5 p-4 transition-transform hover:scale-[1.01] active:scale-[0.99] ${
                          !open ? "opacity-50" : ""
                        }`}
                      >
                        <span
                          className={`-ml-[50px] flex size-10 shrink-0 items-center justify-center rounded-full text-base font-black ${
                            done
                              ? "clay-tile-mint !rounded-full text-white shadow-[0_4px_10px_rgba(95,145,125,0.4)]"
                              : current
                              ? "clay-tile-peach !rounded-full text-white shadow-[0_6px_14px_rgba(215,85,50,0.5)] scale-110 animate-glow"
                              : "clay-inset !rounded-full bg-[#e8e0d5] text-muted-foreground"
                          }`}
                        >
                          {done ? <Check className="size-5" /> : !open ? <Lock className="size-4" /> : i + 1}
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 flex-1">
                          <span className="text-base sm:text-lg font-black text-foreground">ステップ{i + 1}</span>
                          <span className="text-base sm:text-lg text-muted-foreground font-bold">{st.title}</span>
                        </div>
                        {done ? (
                          <span className="ml-auto text-sm font-black text-correct">クリア</span>
                        ) : open ? (
                          <ChevronRight className="ml-auto size-5 text-muted-foreground" />
                        ) : null}
                      </div>
                    );
                    return (
                      <li key={st.id}>
                        {open ? (
                          <Link
                            to="/drill/$levelId/$stepId"
                            params={{ levelId: level.id, stepId: st.id }}
                            aria-label={`${level.name} ステップ${i + 1} ${st.title}${done ? " クリア" : ""}`}
                          >
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
            );
          })
        )}
      </div>
    </KidShell>
  );
}
