import bank from "@/data/thinking-problems.json";
import { rng } from "./generators";

export type ThinkProblem = {
  id: string;
  typeTag: string;
  difficulty: number;
  question: string;
  figure?: string;
  answerType: "number" | "choice";
  answer: string;
  choices?: string[];
  hints: [string, string, string];
  explanation: string;
  altSolutions: string[];
  prereq: string[];
};

export const DIFFICULTY_LABEL = ["", "入口", "基礎", "標準", "チャレンジ", "オリンピック級"];
export const METHOD_TAGS = ["図をかいた", "表にした", "小さい数で試した", "あてはめた", "式にした"];

/** Quality check: every problem must have answer, 3 hints, explanation, ≥2 alt solutions, tag, difficulty. */
function validate(p: Partial<ThinkProblem>): p is ThinkProblem {
  const ok =
    !!p.id && !!p.typeTag && typeof p.difficulty === "number" && !!p.question && !!p.answer &&
    Array.isArray(p.hints) && p.hints.length === 3 && !!p.explanation &&
    Array.isArray(p.altSolutions) && p.altSolutions.length >= 2 && Array.isArray(p.prereq);
  if (!ok) console.warn("[thinking] invalid problem skipped:", p.id);
  return ok;
}

export const BANK: ThinkProblem[] = (bank.problems as unknown as Partial<ThinkProblem>[]).filter(validate);

/** Parametric thinking problems (numbers vary by seed). */
export function paramProblem(seed: number): ThinkProblem {
  const r = rng(seed);
  const kind = Math.floor(r() * 3);
  if (kind === 0) {
    const heads = 5 + Math.floor(r() * 6);
    const cranes = 1 + Math.floor(r() * (heads - 1));
    const turtles = heads - cranes;
    const legs = cranes * 2 + turtles * 4;
    return {
      id: `p-tk-${seed}`, typeTag: "文章題", difficulty: 3,
      question: `つると かめが あわせて ${heads}ひき います。あしは ぜんぶで ${legs}ほん。かめは なんびき？`,
      answerType: "number", answer: String(turtles),
      hints: ["ぜんぶ つるだったら あしは なんぼん？", "ひょうに して かめを 1ぴきずつ ふやしてみよう", `ぜんぶ つるだと ${heads * 2}ほん。たりない あしは ${legs - heads * 2}ほん`],
      explanation: `ぜんぶ つるなら ${heads * 2}ほん。${legs - heads * 2}ほん たりない。かめ1ぴきで あしが2ほん ふえるので ${legs - heads * 2}÷2=${turtles}ひき。`,
      altSolutions: [`かめ0, 1, 2…と ひょうに して あしが ${legs} に なる ところを さがす`, `ぜんぶ かめなら ${heads * 4}ほん。おおい ${heads * 4 - legs}ほん ÷2 = つる${cranes}わ → かめ ${turtles}ひき`],
      prereq: ["math-mul/s01", "math-sub-1/s01"],
    };
  }
  if (kind === 1) {
    const start = 1 + Math.floor(r() * 5);
    const step = 2 + Math.floor(r() * 4);
    const seq = Array.from({ length: 5 }, (_, i) => start + step * i);
    const ans = start + step * 5;
    return {
      id: `p-seq-${seed}`, typeTag: "規則性", difficulty: 2,
      question: `${seq.join("、")}、□ … □に はいる かずは？`,
      answerType: "number", answer: String(ans),
      hints: ["となりどうしの かずを くらべよう", "いくつずつ ふえているかな？", `${step}ずつ ふえているよ`],
      explanation: `${step}ずつ ふえるので ${seq[4]}+${step}=${ans}。`,
      altSolutions: [`さいしょの ${start} に ${step}を 5かい たす：${start}+${step}×5=${ans}`, "かずのせんに ならべて あいだを くらべる"],
      prereq: ["math-add-1/s02"],
    };
  }
  const k = 3 + Math.floor(r() * 4);
  const n = k * (2 + Math.floor(r() * 4)) + 1 + Math.floor(r() * (k - 1));
  return {
    id: `p-rem-${seed}`, typeTag: "数の性質", difficulty: 2,
    question: `あめが ${n}こ あります。${k}にんで おなじ かずずつ わけると、なんこ あまる？`,
    answerType: "number", answer: String(n % k),
    hints: ["1にん 1こずつ くばっていこう", `${k}こずつ まるで かこんでみよう`, `${k}の だんで ${n}に ちかい かずは？`],
    explanation: `${n} ÷ ${k} = ${Math.floor(n / k)} あまり ${n % k}。`,
    altSolutions: [`${k}×${Math.floor(n / k)}=${k * Math.floor(n / k)}、${n}−${k * Math.floor(n / k)}=${n % k}`, `○を ${n}こ かいて ${k}こずつ かこむ`],
    prereq: ["math-div/s01"],
  };
}

export function findThinking(id: string): ThinkProblem | null {
  if (id.startsWith("p-")) {
    const seed = Number(id.split("-").pop());
    return Number.isFinite(seed) ? paramProblem(seed) : null;
  }
  return BANK.find((p) => p.id === id) ?? null;
}

export function weekKey(d = new Date()) {
  const start = new Date(Date.UTC(d.getFullYear(), 0, 1));
  const w = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000));
  return `${d.getFullYear()}-W${w}`;
}

export function weeklyChallenge(d = new Date()): ThinkProblem {
  const hard = BANK.filter((p) => p.difficulty >= 4);
  const w = Number(weekKey(d).split("W")[1]);
  return hard[w % hard.length] ?? BANK[0]!;
}

/** 2-3 problems around the child's level. Prefers unsolved bank problems. */
export function pickSession(grade: number, solvedIds: Set<string>): ThinkProblem[] {
  const target = Math.min(4, Math.max(1, Math.round(grade / 2)));
  const pool = BANK.filter((p) => p.difficulty <= target + 1 && p.difficulty >= target - 1 && p.difficulty < 5);
  const fresh = pool.filter((p) => !solvedIds.has(p.id));
  const src = (fresh.length >= 2 ? fresh : pool).sort(() => Math.random() - 0.5).slice(0, 2);
  return [...src, paramProblem(Math.floor(Math.random() * 1e9))];
}
