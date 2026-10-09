import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type RubyMode = "hira" | "ruby" | "kanji";
export type Child = {
  id: string;
  nickname: string;
  grade: number;
  rubyMode: RubyMode;
  avatar: string;
  recommendedLevel: string;
  createdAt: number;
};
export type StepProgress = { bestAcc: number; bestSec: number; clears: number };
export type SessionRec = {
  id: string;
  childId: string;
  subjectId: string;
  levelId: string;
  stepId: string;
  at: number;
  durationSec: number;
  correct: number;
  total: number;
  passed: boolean;
  review?: boolean;
};
export type ReviewItem = { id: string; childId: string; levelId: string; stepId: string; seed: number; due: number; interval: number };
export type ThinkAttempt = {
  id: string;
  childId: string;
  problemId: string;
  typeTag: string;
  solved: boolean;
  hintLevel: number;
  timeSec: number;
  methods: string[];
  at: number;
  challengeWeek?: string;
};
export type PaperRec = { id: string; childId: string; material: string; level: string; page: number; note: string; updatedAt: number };

const DAY = 86400000;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const INTERVALS = [1, 3, 7];

type State = {
  children: Child[];
  activeChildId: string | null;
  progress: Record<string, Record<string, StepProgress>>;
  sessions: SessionRec[];
  reviews: ReviewItem[];
  attempts: ThinkAttempt[];
  paper: PaperRec[];
  sound: boolean;
  lastSubjectId?: string | undefined;
  lastGrade?: number | "all" | undefined;
  // not persisted
  hydrated: boolean;
  parentUnlocked: boolean;

  addChild: (c: Omit<Child, "id" | "createdAt">) => string;
  updateChild: (id: string, patch: Partial<Child>) => void;
  removeChild: (id: string) => void;
  setActive: (id: string) => void;
  recordSession: (s: Omit<SessionRec, "id" | "at">, wrongSeeds: number[]) => void;
  resolveReview: (id: string, correct: boolean) => void;
  addAttempt: (a: Omit<ThinkAttempt, "id" | "at">) => void;
  upsertPaper: (p: Omit<PaperRec, "id" | "updatedAt"> & { id?: string }) => void;
  deletePaper: (id: string) => void;
  setSound: (v: boolean) => void;
  setParentUnlocked: (v: boolean) => void;
  setLastSubjectId: (id: string) => void;
  setLastGrade: (g: number | "all" | undefined) => void;
};

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      children: [],
      activeChildId: null,
      progress: {},
      sessions: [],
      reviews: [],
      attempts: [],
      paper: [],
      sound: true,
      lastSubjectId: "math",
      lastGrade: undefined,
      hydrated: false,
      parentUnlocked: false,

      addChild: (c) => {
        const id = uid();
        set((s) => ({ children: [...s.children, { ...c, id, createdAt: Date.now() }], activeChildId: id }));
        return id;
      },
      updateChild: (id, patch) =>
        set((s) => ({ children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeChild: (id) =>
        set((s) => {
          const children = s.children.filter((c) => c.id !== id);
          return { children, activeChildId: s.activeChildId === id ? (children[0]?.id ?? null) : s.activeChildId };
        }),
      setActive: (id) => set({ activeChildId: id }),
      recordSession: (rec, wrongSeeds) => {
        const now = Date.now();
        const key = `${rec.levelId}/${rec.stepId}`;
        set((s) => {
          const childProg = { ...(s.progress[rec.childId] ?? {}) };
          if (rec.passed && !rec.review) {
            const prev = childProg[key];
            const acc = rec.correct / rec.total;
            childProg[key] = {
              bestAcc: Math.max(prev?.bestAcc ?? 0, acc),
              bestSec: Math.min(prev?.bestSec ?? Infinity, rec.durationSec),
              clears: (prev?.clears ?? 0) + 1,
            };
          }
          const newReviews: ReviewItem[] = rec.review
            ? []
            : wrongSeeds.map((seed) => ({ id: uid(), childId: rec.childId, levelId: rec.levelId, stepId: rec.stepId, seed, due: now + DAY, interval: 0 }));
          return {
            sessions: [...s.sessions, { ...rec, id: uid(), at: now }].slice(-2000),
            progress: { ...s.progress, [rec.childId]: childProg },
            reviews: [...s.reviews, ...newReviews].slice(-500),
          };
        });
      },
      resolveReview: (id, correct) =>
        set((s) => ({
          reviews: s.reviews.flatMap((r) => {
            if (r.id !== id) return [r];
            if (!correct) return [{ ...r, interval: 0, due: Date.now() + DAY }];
            const next = r.interval + 1;
            if (next >= INTERVALS.length) return [];
            return [{ ...r, interval: next, due: Date.now() + (INTERVALS[next] ?? 7) * DAY }];
          }),
        })),
      addAttempt: (a) => set((s) => ({ attempts: [...s.attempts, { ...a, id: uid(), at: Date.now() }].slice(-2000) })),
      upsertPaper: (p) =>
        set((s) => {
          const id = p.id ?? uid();
          const rec: PaperRec = { id, childId: p.childId, material: p.material, level: p.level, page: p.page, note: p.note, updatedAt: Date.now() };
          return { paper: s.paper.some((x) => x.id === id) ? s.paper.map((x) => (x.id === id ? rec : x)) : [...s.paper, rec] };
        }),
      deletePaper: (id) => set((s) => ({ paper: s.paper.filter((x) => x.id !== id) })),
      setSound: (v) => set({ sound: v }),
      setParentUnlocked: (v) => set({ parentUnlocked: v }),
      setLastSubjectId: (id) => set({ lastSubjectId: id }),
      setLastGrade: (g) => set({ lastGrade: g }),
    }),
    {
      name: "manabi-pocket-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        children: s.children,
        activeChildId: s.activeChildId,
        progress: s.progress,
        sessions: s.sessions,
        reviews: s.reviews,
        attempts: s.attempts,
        paper: s.paper,
        sound: s.sound,
        lastSubjectId: s.lastSubjectId,
        lastGrade: s.lastGrade,
      }),
      onRehydrateStorage: () => () => useApp.setState({ hydrated: true }),
    },
  ),
);

export function useActiveChild() {
  return useApp((s) => s.children.find((c) => c.id === s.activeChildId) ?? null);
}

const dayKey = (t: number) => new Date(t).toLocaleDateString("sv-SE");

export function studyDays(childId: string, sessions: SessionRec[], attempts: ThinkAttempt[]) {
  const set = new Set<string>();
  sessions.filter((s) => s.childId === childId).forEach((s) => set.add(dayKey(s.at)));
  attempts.filter((a) => a.childId === childId).forEach((a) => set.add(dayKey(a.at)));
  return set;
}

export function streakOf(days: Set<string>) {
  let n = 0;
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const todayKey = () => dayKey(Date.now());
export { dayKey };

/** Growth stage of "ぽけっと": 0 seed, 1 sprout, 2 tree, 3 fruit */
export function growthStage(count: number) {
  if (count >= 25) return 3;
  if (count >= 10) return 2;
  if (count >= 3) return 1;
  return 0;
}
