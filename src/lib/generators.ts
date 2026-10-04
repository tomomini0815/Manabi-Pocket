// Original problem generators. Every problem is reproducible from its seed.
export type InputKind = "keypad" | "choice" | "handwrite";

export type Problem = {
  seed: number;
  prompt: string;
  visual?: string;
  passage?: string;
  answer: string;
  input: InputKind;
  choices?: string[];
  hints: [string, string, string];
};

type Params = Record<string, unknown>;
type Rand = () => number;

export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);
const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
function pick<T>(r: Rand, arr: readonly T[]): T {
  return arr[Math.floor(r() * arr.length)] as T;
}
function shuffle<T>(r: Rand, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}
function choices(r: Rand, answer: string, pool: string[], n = 4): string[] {
  const others = shuffle(r, pool.filter((p) => p !== answer)).slice(0, n - 1);
  return shuffle(r, [answer, ...others]);
}
const num = (p: Params, k: string, d: number) => (typeof p[k] === "number" ? (p[k] as number) : d);
const numArr = (p: Params, k: string, d: number[]) =>
  Array.isArray(p[k]) ? (p[k] as number[]) : d;

const DOTS = ["🍎", "🍓", "🐟", "⭐", "🌸", "🚗"];

type Gen = (p: Params, r: Rand, delta: number) => Omit<Problem, "seed">;

const gens: Record<string, Gen> = {
  count(p, r, d) {
    const n = int(r, num(p, "min", 1), Math.min(10, num(p, "max", 5) + d));
    const e = pick(r, DOTS);
    return {
      prompt: "いくつ あるかな？",
      visual: e.repeat(n),
      answer: String(n),
      input: "keypad",
      hints: ["ゆびで ひとつずつ さわって かぞえよう", `5こ ずつ まとめて みよう`, `こたえは ${n} だよ`],
    };
  },
  add(p, r, d) {
    const min = num(p, "min", 1);
    const max = num(p, "max", 5) + d;
    const bMax = num(p, "bMax", max);
    const carry = p["carry"] === true;
    const sumMax = num(p, "sumMax", 999);
    let a = 1, b = 1;
    for (let i = 0; i < 60; i++) {
      a = int(r, min, max);
      b = int(r, Math.min(min, bMax), bMax);
      const c = (a % 10) + (b % 10) >= 10;
      if (a + b <= sumMax && (carry ? c : !c || max <= 5)) break;
    }
    const s = a + b;
    return {
      prompt: `${a} + ${b} = ?`,
      visual: s <= 10 ? `${"🍎".repeat(a)} ＋ ${"🍎".repeat(b)}` : undefined as unknown as string,
      answer: String(s),
      input: "keypad",
      hints: [
        s <= 10 ? "りんごを ぜんぶ かぞえてみよう" : "一のくらいから たそう",
        `${a} から ${b} こ すすめると…`,
        `${a} + ${b} = ${s}`,
      ],
    };
  },
  sub(p, r, d) {
    const min = num(p, "min", 1);
    const max = num(p, "max", 10) + d;
    const borrow = p["borrow"] === true;
    const two = p["twoDigit"] === true;
    let a = 2, b = 1;
    for (let i = 0; i < 60; i++) {
      a = int(r, min, max);
      b = two ? int(r, 10, a - 1 < 10 ? 10 : a - 1) : int(r, 1, Math.min(9, a));
      if (b > a) continue;
      const c = a % 10 < b % 10;
      if (borrow ? c : !c || a <= 10) break;
    }
    return {
      prompt: `${a} − ${b} = ?`,
      visual: a <= 10 ? "🍓".repeat(a) : undefined as unknown as string,
      answer: String(a - b),
      input: "keypad",
      hints: [
        a <= 10 ? `${b} こ たべたら のこりは？` : "一のくらいが ひけないときは 10を かりよう",
        `${b} + □ = ${a} と かんがえても いいよ`,
        `${a} − ${b} = ${a - b}`,
      ],
    };
  },
  mul(p, r) {
    const a = pick(r, numArr(p, "tables", [2]));
    const b = int(r, 1, 9);
    return {
      prompt: `${a} × ${b} = ?`,
      answer: String(a * b),
      input: "keypad",
      hints: [`${a}のだんを となえてみよう`, `${a} を ${b} かい たすと…`, `${a} × ${b} = ${a * b}`],
    };
  },
  div(p, r) {
    const a = pick(r, numArr(p, "tables", [2]));
    const q = int(r, 1, 9);
    return {
      prompt: `${a * q} ÷ ${a} = ?`,
      answer: String(q),
      input: "keypad",
      hints: [`${a} × □ = ${a * q} の □は？`, `${a}のだんで ${a * q} に なるのは？`, `${a * q} ÷ ${a} = ${q}`],
    };
  },
  frac(p, r) {
    const den = pick(r, numArr(p, "dens", [4]));
    const a = int(r, 1, den - 2);
    const b = int(r, 1, den - 1 - a);
    const ans = `${a + b}/${den}`;
    const pool = [`${a + b}/${den * 2}`, `${a + b + 1}/${den}`, `${Math.max(1, a + b - 1)}/${den}`, `${a * b}/${den}`, `${a + b}/${den + 1}`];
    return {
      prompt: `${a}/${den} + ${b}/${den} = ?`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["分母が おなじときは 分母は そのまま", "分子だけを たそう", `${a}/${den} + ${b}/${den} = ${ans}`],
    };
  },
  decimal(p, r) {
    const a = int(r, 1, num(p, "max", 9));
    const b = int(r, 1, num(p, "max", 9));
    const fmt = (n: number) => (n / 10).toFixed(1);
    const ans = fmt(a + b);
    const pool = [fmt(a + b + 1), fmt(Math.abs(a + b - 1)), String(a + b), fmt(a + b + 10)];
    return {
      prompt: `${fmt(a)} + ${fmt(b)} = ?`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["0.1 が いくつ分か かんがえよう", `0.1 が ${a} こと ${b} こ`, `${fmt(a)} + ${fmt(b)} = ${ans}`],
    };
  },
  kanaFirst(_p, r) {
    const words: [string, string][] = [
      ["🍎", "りんご"], ["🐟", "さかな"], ["🐱", "ねこ"], ["🐶", "いぬ"], ["🍓", "いちご"],
      ["🌸", "はな"], ["🚗", "くるま"], ["🐘", "ぞう"], ["⛰️", "やま"], ["🌙", "つき"], ["🍊", "みかん"], ["🐢", "かめ"],
    ];
    const [e, w] = pick(r, words);
    const ans = w[0] as string;
    const pool = words.map(([, x]) => x[0] as string);
    return {
      prompt: "さいしょの もじは どれ？",
      visual: e,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, [...new Set(pool)]),
      hints: ["こえに だして いってみよう", `「${w}」の はじめの おと`, `こたえは「${ans}」`],
    };
  },
  katakana(_p, r) {
    const h = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん";
    const k = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン";
    const i = int(r, 0, h.length - 1);
    const ans = k[i] as string;
    return {
      prompt: `「${h[i]}」の カタカナは？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, k.split("")),
      hints: ["かたちが にている ものも あるよ", `「${h[i]}」と おなじ おと`, `こたえは「${ans}」`],
    };
  },
  write(p, r) {
    const hira = ["あめ", "いぬ", "うし", "えき", "おに", "かさ", "そら", "はな", "ねこ", "みみ"];
    const kata = ["パン", "バス", "ケーキ", "トマト", "ノート", "ペン", "カメラ", "メロン"];
    const w = pick(r, p["set"] === "kata" ? kata : hira);
    return {
      prompt: `「${w}」を かいてみよう`,
      answer: w,
      input: "handwrite",
      hints: ["ゆっくり ていねいに かこう", "かきおわったら こたえを みて くらべよう", `おてほん：${w}`],
    };
  },
  opposite(_p, r) {
    const pairs: [string, string][] = [
      ["おおきい", "ちいさい"], ["ながい", "みじかい"], ["あつい", "さむい"], ["たかい", "ひくい"],
      ["はやい", "おそい"], ["あかるい", "くらい"], ["おもい", "かるい"], ["ふとい", "ほそい"], ["ひろい", "せまい"],
    ];
    const [a, b] = pick(r, pairs);
    return {
      prompt: `「${a}」の はんたいの ことばは？`,
      answer: b,
      input: "choice",
      choices: choices(r, b, pairs.map(([, x]) => x)),
      hints: ["ようすを おもいうかべよう", `「${a}」ではない ようす`, `こたえは「${b}」`],
    };
  },
  kanji(p, r) {
    const set1: [string, string][] = [["山", "やま"], ["川", "かわ"], ["木", "き"], ["花", "はな"], ["空", "そら"], ["雨", "あめ"], ["目", "め"], ["手", "て"], ["火", "ひ"], ["水", "みず"]];
    const set2: [string, string][] = [["海", "うみ"], ["雪", "ゆき"], ["星", "ほし"], ["風", "かぜ"], ["朝", "あさ"], ["昼", "ひる"], ["夜", "よる"], ["春", "はる"], ["秋", "あき"], ["冬", "ふゆ"]];
    const set = p["set"] === 2 ? set2 : set1;
    const [k, y] = pick(r, set);
    return {
      prompt: `「${k}」の よみかたは？`,
      visual: k,
      answer: y,
      input: "choice",
      choices: choices(r, y, set.map(([, x]) => x)),
      hints: ["ぶんの なかで みたことは あるかな", `「${k}」を つかう ことばを おもいだそう`, `「${k}」は「${y}」`],
    };
  },
  reading(_p, r) {
    const items = [
      { t: "ゆいは あさ こうえんへ いきました。こうえんで しろい いぬに あいました。", q: "ゆいが あったのは どんな いぬ？", a: "しろい いぬ", c: ["しろい いぬ", "くろい いぬ", "ちいさい ねこ", "あかい とり"] },
      { t: "けんは にちようびに おじいさんと つりを しました。さかなが 3びき つれました。", q: "さかなは なんびき つれた？", a: "3びき", c: ["1ぴき", "2ひき", "3びき", "5ひき"] },
      { t: "あめが ふってきたので、はるは きいろい かさを さして がっこうへ いきました。", q: "はるが かさを さしたのは なぜ？", a: "あめが ふったから", c: ["あめが ふったから", "あついから", "かぜが つよいから", "ゆきが ふったから"] },
      { t: "そらは パンやさんで メロンパンを 2こと クリームパンを 1こ かいました。", q: "パンは ぜんぶで いくつ？", a: "3こ", c: ["1こ", "2こ", "3こ", "4こ"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      passage: it.t,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["もう いちど ゆっくり よもう", "しつもんの ことばを ぶんの なかで さがそう", `こたえは「${it.a}」`],
    };
  },
  alphaCase(_p, r) {
    const U = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const i = int(r, 0, 25);
    const ans = U.toLowerCase()[i] as string;
    return {
      prompt: `「${U[i]}」の 小文字は？`,
      visual: U[i] as string,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, U.toLowerCase().split("")),
      hints: ["かたちが にている ものも あるよ", "ABCの うたで かくにん しよう", `${U[i]} → ${ans}`],
    };
  },
  engWord(_p, r) {
    const w: [string, string][] = [["🐶", "dog"], ["🐱", "cat"], ["🍎", "apple"], ["🍌", "banana"], ["🐟", "fish"], ["🐦", "bird"], ["🥚", "egg"], ["🍋", "lemon"], ["🐻", "bear"]];
    const [e, ans] = pick(r, w);
    return {
      prompt: "えいごで なんて いう？",
      visual: e,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, w.map(([, x]) => x)),
      hints: ["さいしょの おとを かんがえよう", `「${ans[0]}」で はじまるよ`, `こたえは ${ans}`],
    };
  },
  engSentence(_p, r) {
    const items = [
      { q: "I ___ apples.（りんごが すき）", a: "like", c: ["like", "is", "are", "am"] },
      { q: "I ___ a dog.（いぬを かっている）", a: "have", c: ["have", "am", "is", "go"] },
      { q: "I ___ eight years old.", a: "am", c: ["am", "is", "are", "have"] },
      { q: "This ___ my pen.", a: "is", c: ["is", "am", "are", "like"] },
      { q: "___ you like cats?", a: "Do", c: ["Do", "Is", "Am", "Are"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["にほんごの いみを かんがえよう", "I のあとに くる ことばに ちゅうい", `こたえは ${it.a}`],
    };
  },
};

export function generate(generator: string, params: Params, seed: number, delta = 0): Problem {
  const g = gens[generator] ?? gens["add"]!;
  const p = g(params, rng(seed), delta);
  const out: Problem = { seed, prompt: p.prompt, answer: p.answer, input: p.input, hints: p.hints };
  if (p.visual) out.visual = p.visual;
  if (p.passage) out.passage = p.passage;
  if (p.choices) out.choices = p.choices;
  return out;
}
