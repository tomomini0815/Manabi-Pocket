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

export const GRADES = ["年少", "年中", "年長", "小1", "小2", "小3", "小4", "小5", "小6"];

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
  const fit = [...s.levels].reverse().find((l) => l.startGrade <= grade);
  return (fit ?? s.levels[0]!).id;
}
