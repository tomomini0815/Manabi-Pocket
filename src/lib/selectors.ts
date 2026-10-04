import { subjects, stepKey, findLevel } from "./curriculum";
import type { StepProgress } from "./store";

/** A step is open if it is the first step of a level (先取りOK) or the previous step is cleared. */
export function isStepOpen(prog: Record<string, StepProgress>, levelId: string, stepIdx: number) {
  if (stepIdx === 0) return true;
  const f = findLevel(levelId);
  const prev = f?.level.steps[stepIdx - 1];
  return !!prev && !!prog[stepKey(levelId, prev.id)];
}

export function nextStepIn(prog: Record<string, StepProgress>, levelId: string) {
  const f = findLevel(levelId);
  if (!f) return null;
  const s = f.level.steps.find((st) => !prog[stepKey(levelId, st.id)]);
  if (s) return { subject: f.subject, level: f.level, step: s };
  // level complete → first open step of next level in the same subject
  const li = f.subject.levels.findIndex((l) => l.id === levelId);
  const nl = f.subject.levels[li + 1];
  if (nl && nl.steps[0]) return { subject: f.subject, level: nl, step: nl.steps[0] };
  return { subject: f.subject, level: f.level, step: f.level.steps[0]! };
}

export function totalSteps() {
  return subjects.reduce((n, s) => n + s.levels.reduce((m, l) => m + l.steps.length, 0), 0);
}
