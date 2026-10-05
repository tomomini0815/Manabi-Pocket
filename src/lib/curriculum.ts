import data from "@/data/curriculum.json";

export type Step = { id: string; title: string; generator: string; params: Record<string, unknown>; targetSec: number };
export type Level = { id: string; name: string; startGrade: number; steps: Step[] };
export type Subject = { id: string; name: string; icon: string; levels: Level[] };

export const subjects = data.subjects as unknown as Subject[];

export const SUBJECT_COLOR: Record<string, string> = {
  math: "var(--math)",
  japanese: "var(--japanese)",
  english: "var(--english)",
  thinking: "var(--thinking)",
};

export const GRADES = ["幼児", "小学1年", "小学2年", "小学3年", "小学4年", "小学5年", "小学6年"] as const;
export const GRADE_SHORT = ["幼児", "小1", "小2", "小3", "小4", "小5", "小6"] as const;
export const GRADE_ICONS = ["👶", "🎒", "📘", "📗", "📙", "📕", "🎓"] as const;

export function clampGrade(grade: number): number {
  if (typeof grade !== "number" || isNaN(grade)) return 1;
  return Math.min(6, Math.max(0, Math.floor(grade)));
}

export function gradeLabel(grade: number): string {
  return GRADES[clampGrade(grade)] ?? "幼児";
}

export function gradeShort(grade: number): string {
  return GRADE_SHORT[clampGrade(grade)] ?? "幼児";
}

export function gradeIcon(grade: number): string {
  return GRADE_ICONS[clampGrade(grade)] ?? "🎒";
}

export const stepKey = (levelId: string, stepId: string) => `${levelId}/${stepId}`;

export function findLevel(levelId: string) {
  for (const s of subjects) {
    const l = s.levels.find((x) => x.id === levelId);
    if (l) return { subject: s, level: l };
  }
  return null;
}

export function findStep(levelId: string, stepId: string) {
  const f = findLevel(levelId);
  if (!f) return null;
  const idx = f.level.steps.findIndex((s) => s.id === stepId);
  const step = f.level.steps[idx];
  if (!step) return null;
  return { ...f, step, index: idx, next: f.level.steps[idx + 1] };
}

/** Recommended start level for a grade (grade only decides the starting point). */
export function recommendedLevelFor(grade: number, subjectId = "math") {
  const s = subjects.find((x) => x.id === subjectId) ?? subjects[0]!;
  const g = clampGrade(grade);
  const fit = [...s.levels].reverse().find((l) => l.startGrade <= g);
  return (fit ?? s.levels[0]!).id;
}
