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

const DOTS = ["🍎", "🍓", "🐟", "⭐", "🌸", "🚗", "🍬", "🐥", "🍇", "🥕", "🚀", "🐱", "🐶", "🎈", "🍉", "🍒"];

type GenOut = {
  prompt: string;
  visual?: string | undefined;
  passage?: string;
  answer: string;
  input: InputKind;
  choices?: string[];
  hints: [string, string, string];
};
type Gen = (p: Params, r: Rand, delta: number) => GenOut;

const gens: Record<string, Gen> = {
  // 数の認識・カウント
  count(p, r, d) {
    const n = int(r, num(p, "min", 1), Math.min(20, num(p, "max", 5) + d));
    const e = pick(r, DOTS);
    return {
      prompt: "いくつ あるかな？",
      visual: n <= 10 ? e.repeat(n) : `${e.repeat(10)}\n${e.repeat(n - 10)}`,
      answer: String(n),
      input: "keypad",
      hints: ["ゆびで ひとつずつ さわって かぞえよう", n > 5 ? "5こ ずつ まとめて みよう" : "こえを だして かぞえよう", `こたえは ${n} だよ`],
    };
  },

  // 数の大小比較
  compare(_p, r) {
    const a = int(r, 1, 20);
    let b = int(r, 1, 20);
    while (a === b) b = int(r, 1, 20);
    const bigger = a > b ? a : b;
    return {
      prompt: "おおきい かずは どっち？",
      answer: String(bigger),
      input: "choice",
      choices: shuffle(r, [String(a), String(b)]),
      hints: ["かずのせん（ものさし）で みぎにある ほうだよ", `${Math.min(a, b)} より おおい ほう`, `こたえは「${bigger}」`],
    };
  },

  // 数のならび順（穴埋め）
  order(_p, r) {
    const start = int(r, 1, 16);
    const seq = [start, start + 1, start + 2, start + 3];
    const hideIdx = int(r, 1, 2);
    const ans = String(seq[hideIdx]);
    const display = seq.map((n, idx) => (idx === hideIdx ? "□" : n)).join(" , ");
    return {
      prompt: `${display}\n□ に はいる かずは？`,
      answer: ans,
      input: "keypad",
      hints: ["1ずつ ふえているよ", `「${seq[hideIdx - 1]}」の つぎの かずは？`, `こたえは ${ans} だよ`],
    };
  },

  // 10のまとまり（補数）
  makeTen(_p, r) {
    const a = int(r, 1, 9);
    const ans = 10 - a;
    return {
      prompt: `${a} ＋ □ ＝ 10\n□ に はいる かずは？`,
      visual: "●".repeat(a) + "○".repeat(ans),
      answer: String(ans),
      input: "keypad",
      hints: ["あと いくつで 10に なるかな？", "くろいまるを 10こに するには しろいまるは なんこ？", `${a} ＋ ${ans} ＝ 10 だよ`],
    };
  },

  // たし算
  add(p, r, d) {
    const min = num(p, "min", 1);
    const max = num(p, "max", 5) + d;
    const bMax = num(p, "bMax", max);
    const carry = p["carry"] === true;
    const plusFixed = typeof p["plus"] === "number" ? (p["plus"] as number) : undefined;
    const sumMax = num(p, "sumMax", 999);
    let a = 1, b = 1;
    for (let i = 0; i < 80; i++) {
      a = int(r, min, max);
      b = plusFixed !== undefined ? plusFixed : int(r, Math.min(min, bMax), bMax);
      if (plusFixed !== undefined) {
        if (a + b <= sumMax) break;
      } else {
        const c = (a % 10) + (b % 10) >= 10;
        if (a + b <= sumMax && (carry ? c : !c || max <= 5)) break;
      }
    }
    const s = a + b;
    return {
      prompt: `${a} + ${b} = ?`,
      visual: s <= 10 ? `${"🍎".repeat(a)} ＋ ${"🍎".repeat(b)}` : undefined,
      answer: String(s),
      input: "keypad",
      hints: [
        s <= 10 ? "りんごを ぜんぶ かぞえてみよう" : a >= 10 ? "一のくらいから たそう" : "10の まとまりを つくろう",
        `${a} から ${b} こ すすめると…`,
        `${a} + ${b} = ${s}`,
      ],
    };
  },

  // ひき算
  sub(p, r, d) {
    const min = num(p, "min", 1);
    const max = num(p, "max", 10) + d;
    const borrow = p["borrow"] === true;
    const two = p["twoDigit"] === true;
    const minusFixed = typeof p["minus"] === "number" ? (p["minus"] as number) : undefined;
    let a = 2, b = 1;
    for (let i = 0; i < 80; i++) {
      a = int(r, min, max);
      b = minusFixed !== undefined ? minusFixed : two ? int(r, 10, a - 1 < 10 ? 10 : a - 1) : int(r, 1, Math.min(9, a));
      if (b > a) continue;
      if (minusFixed !== undefined) {
        break;
      }
      const c = a % 10 < b % 10;
      if (borrow ? c : !c || a <= 10) break;
    }
    return {
      prompt: `${a} − ${b} = ?`,
      visual: a <= 10 ? "🍓".repeat(a) : undefined,
      answer: String(a - b),
      input: "keypad",
      hints: [
        a <= 10 ? `${b} こ たべたら のこりは？` : "一のくらいが ひけないときは 10を かりよう",
        `${b} + □ = ${a} と かんがえても いいよ`,
        `${a} − ${b} = ${a - b}`,
      ],
    };
  },

  // かけ算（九九）
  mul(p, r) {
    const zeroOne = p["zeroOne"] === true;
    let a: number, b: number;
    if (zeroOne) {
      a = pick(r, [0, 1, 10]);
      b = int(r, 1, 9);
    } else {
      a = pick(r, numArr(p, "tables", [2]));
      b = int(r, 1, 9);
    }
    return {
      prompt: `${a} × ${b} = ?`,
      answer: String(a * b),
      input: "keypad",
      hints: [a === 0 ? "0を なんかい かけても 0だよ" : `${a}のだんを となえてみよう`, `${a} を ${b} かい たすと…`, `${a} × ${b} = ${a * b}`],
    };
  },

  // わり算
  div(p, r) {
    const hasRem = p["remainder"] === true;
    const a = pick(r, numArr(p, "tables", [2, 3, 4, 5, 6, 7, 8, 9]));
    if (hasRem) {
      const q = int(r, 1, 8);
      const rem = int(r, 1, a - 1);
      const total = a * q + rem;
      return {
        prompt: `${total} ÷ ${a} の あまりは？`,
        answer: String(rem),
        input: "keypad",
        hints: [`${a} × ${q} ＝ ${a * q} だね`, `${total} から ${a * q} を ひくと…？`, `${total} ÷ ${a} ＝ ${q} あまり ${rem}`],
      };
    }
    const q = int(r, 1, 9);
    return {
      prompt: `${a * q} ÷ ${a} = ?`,
      answer: String(q),
      input: "keypad",
      hints: [`${a} × □ = ${a * q} の □は？`, `${a}のだんで ${a * q} に なるのは？`, `${a * q} ÷ ${a} = ${q}`],
    };
  },

  // 分数
  frac(p, r) {
    const den = pick(r, numArr(p, "dens", [4, 5, 6, 8]));
    const isSub = p["op"] === "sub";
    if (isSub) {
      const a = int(r, 2, den - 1);
      const b = int(r, 1, a - 1);
      const ans = `${a - b}/${den}`;
      const pool = [`${a + b}/${den}`, `${Math.max(1, a - b + 1)}/${den}`, `${a - b}/${den * 2}`];
      return {
        prompt: `${a}/${den} − ${b}/${den} = ?`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["分母は そのままだよ", "分子だけを ひき算しよう", `${a}/${den} − ${b}/${den} = ${ans}`],
      };
    }
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

  // 小数
  decimal(p, r) {
    const isSub = p["op"] === "sub";
    const fmt = (n: number) => (n / 10).toFixed(1);
    if (isSub) {
      const a = int(r, 11, 35);
      const b = int(r, 1, a - 1);
      const ans = fmt(a - b);
      const pool = [fmt(a - b + 1), fmt(a + b), fmt(Math.abs(a - b - 2))];
      return {
        prompt: `${fmt(a)} − ${fmt(b)} = ?`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["小数点の いちを そろえて ひこう", `0.1 が ${a} こから ${b} こ ひくと…`, `${fmt(a)} − ${fmt(b)} = ${ans}`],
      };
    }
    const a = int(r, 1, num(p, "max", 9));
    const b = int(r, 1, num(p, "max", 9));
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

  // 11級・10級：とけい・じかん
  clock(p, r) {
    const mode = p["mode"] || "read"; // read, addMin, ampm
    if (mode === "read") {
      const h = int(r, 1, 12);
      const isHalf = r() > 0.5;
      const m = isHalf ? 30 : 0;
      const ans = isHalf ? `${h}じはん` : `${h}じ`;
      const pool = [`${h === 12 ? 1 : h + 1}じ`, `${h === 1 ? 12 : h - 1}じ`, `${h}じはん`, `${h === 12 ? 1 : h + 1}じはん`];
      return {
        prompt: `みじかい はりが ${h}、ながい はりが ${isHalf ? 6 : 12} を さしています。いま なんじ？`,
        visual: `⏰ ${h}:${m === 0 ? "00" : "30"}`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["みじかい はりが「じ」を あらわすよ", "ながい はりが 6 のときは「はん（30ぷん）」", `こたえは ${ans}`],
      };
    }
    if (mode === "addMin") {
      const h = int(r, 1, 10);
      const addM = pick(r, [10, 20, 30, 40]);
      const ans = `${h}じ${addM}ふん`;
      const pool = [`${h}じ${addM + 10}ふん`, `${h + 1}じ`, `${h}じ${Math.max(5, addM - 10)}ふん`];
      return {
        prompt: `${h}じ から ${addM}ふん たつと、いま なんじ なんぷん？`,
        visual: `⏰ ${h}:00 ＋ ${addM}分`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["ふん だけが ふえるよ", `${addM}分 すすむと…`, `こたえは ${ans}`],
      };
    }
    // 午前午後
    const h = int(r, 1, 11);
    const m = pick(r, [0, 15, 30, 45]);
    const isAm = r() > 0.5;
    const ans = isAm ? "ごぜん" : "ごご";
    return {
      prompt: `${isAm ? "あさ" : "ゆうがた"}の ${h}じ${m === 0 ? "" : `${m}ふん`} は、ごぜん？ ごご？`,
      answer: ans,
      input: "choice",
      choices: ["ごぜん", "ごご"],
      hints: ["ひるの 12じ より まえ は「ごぜん」", "ひるの 12じ より あと は「ごご」", `こたえは ${ans}`],
    };
  },

  // 10級・9級：たんい（長さ・かさ・重さ）
  unitConvert(p, r) {
    const kind = p["kind"] || "length"; // length, volume, weight
    if (kind === "length") {
      const items = [
        { q: "1cm は 何 mm？", a: "10", u: "mm", pool: ["10", "100", "1000", "1"] },
        { q: "1m は 何 cm？", a: "100", u: "cm", pool: ["100", "10", "1000", "50"] },
        { q: "1km は 何 m？", a: "1000", u: "m", pool: ["1000", "100", "10", "500"] },
        { q: "3cm は 何 mm？", a: "30", u: "mm", pool: ["30", "300", "3", "13"] },
        { q: "2m は 何 cm？", a: "200", u: "cm", pool: ["200", "20", "2000", "120"] },
        { q: "5km は 何 m？", a: "5000", u: "m", pool: ["5000", "500", "50", "1500"] },
        { q: "40mm は 何 cm？", a: "4", u: "cm", pool: ["4", "40", "400", "14"] },
        { q: "300cm は 何 m？", a: "3", u: "m", pool: ["3", "30", "300", "3000"] },
      ];
      const it = pick(r, items);
      return {
        prompt: it.q,
        answer: it.a,
        input: "choice",
        choices: choices(r, it.a, it.pool),
        hints: ["1cm ＝ 10mm、1m ＝ 100cm だよ", "1km ＝ 1000m だね", `こたえは ${it.a}`],
      };
    }
    if (kind === "volume") {
      const items = [
        { q: "1L は 何 dL？", a: "10", pool: ["10", "100", "1000", "1"] },
        { q: "1L は 何 mL？", a: "1000", pool: ["1000", "100", "10", "500"] },
        { q: "1dL は 何 mL？", a: "100", pool: ["100", "10", "1000", "50"] },
        { q: "2L は 何 dL？", a: "20", pool: ["20", "200", "2", "2000"] },
        { q: "3000mL は 何 L？", a: "3", pool: ["3", "30", "300", "13"] },
        { q: "50dL は 何 L？", a: "5", pool: ["5", "50", "500", "15"] },
        { q: "5L は 何 dL？", a: "50", pool: ["50", "500", "5", "5000"] },
        { q: "200mL は 何 dL？", a: "2", pool: ["2", "20", "200", "2000"] },
        { q: "4L は 何 mL？", a: "4000", pool: ["4000", "400", "40", "1400"] },
        { q: "8dL は 何 mL？", a: "800", pool: ["800", "80", "8000", "8"] },
        { q: "10dL は 何 L？", a: "1", pool: ["1", "10", "100", "2"] },
        { q: "500mL は 何 dL？", a: "5", pool: ["5", "50", "500", "5000"] },
      ];
      const it = pick(r, items);
      return {
        prompt: it.q,
        answer: it.a,
        input: "choice",
        choices: choices(r, it.a, it.pool),
        hints: ["1L ＝ 10dL、1L ＝ 1000mL だよ", "1dL ＝ 100mL だね", `こたえは ${it.a}`],
      };
    }
    // weight (9級)
    const items = [
      { q: "1kg は 何 g？", a: "1000", pool: ["1000", "100", "10", "500"] },
      { q: "1t は 何 kg？", a: "1000", pool: ["1000", "100", "10000", "10"] },
      { q: "3kg は 何 g？", a: "3000", pool: ["3000", "300", "30", "1300"] },
      { q: "2000g は 何 kg？", a: "2", pool: ["2", "20", "200", "2000"] },
      { q: "4t は 何 kg？", a: "4000", pool: ["4000", "400", "40", "1400"] },
      { q: "5kg は 何 g？", a: "5000", pool: ["5000", "500", "50", "1500"] },
      { q: "5000kg は 何 t？", a: "5", pool: ["5", "50", "500", "5000"] },
      { q: "8kg は 何 g？", a: "8000", pool: ["8000", "800", "80", "1800"] },
      { q: "7000g は 何 kg？", a: "7", pool: ["7", "70", "700", "17"] },
      { q: "2t は 何 kg？", a: "2000", pool: ["2000", "200", "20", "20000"] },
      { q: "10000g は 何 kg？", a: "10", pool: ["10", "100", "1000", "1"] },
      { q: "3t は 何 kg？", a: "3000", pool: ["3000", "300", "30", "30000"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: choices(r, it.a, it.pool),
      hints: ["1kg ＝ 1000g、1t ＝ 1000kg だよ", "k（キロ）は1000倍のことだね", `こたえは ${it.a}`],
    };
  },

  // 8級：がい数・四捨五入
  roundNumber(_p, r) {
    const numVal = int(r, 1200, 8900);
    const place = pick(r, ["千の位まで", "百の位まで"]);
    if (place === "千の位まで") {
      const ansNum = Math.round(numVal / 1000) * 1000;
      const ans = String(ansNum);
      const pool = [String(ansNum + 1000), String(Math.max(1000, ansNum - 1000)), String(Math.floor(numVal / 1000) * 1000), String(Math.ceil(numVal / 100) * 100)];
      return {
        prompt: `${numVal} を 四捨五入して 千の位までのがい数に すると？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["千の位までのがい数は、すぐ下の「百の位」を四捨五入するよ", "0,1,2,3,4は切り捨て、5,6,7,8,9は切り上げ", `こたえは ${ans}`],
      };
    }
    const ansNum = Math.round(numVal / 100) * 100;
    const ans = String(ansNum);
    const pool = [String(ansNum + 100), String(Math.max(100, ansNum - 100)), String(Math.floor(numVal / 100) * 100)];
    return {
      prompt: `${numVal} を 四捨五入して 百の位までのがい数に すると？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["百の位までのがい数は、すぐ下の「十の位」を四捨五入するよ", "0,1,2,3,4は切り捨て、5,6,7,8,9は切り上げ", `こたえは ${ans}`],
    };
  },

  // 8級・7級：小数の掛け算・割り算
  decimalMulDiv(p, r) {
    const isDiv = p["op"] === "div";
    if (isDiv) {
      const b = pick(r, [2, 3, 4, 5, 8]);
      const q = (int(r, 11, 45) / 10);
      const a = Math.round(q * b * 10) / 10;
      const ans = q.toFixed(1);
      const pool = [(q + 0.2).toFixed(1), (q - 0.1).toFixed(1), (q * 10).toFixed(0)];
      return {
        prompt: `${a.toFixed(1)} ÷ ${b} = ?`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["小数点の位置をそのまま上にあげよう", `${a}の中に${b}がいくつあるかな？`, `${a} ÷ ${b} = ${ans}`],
      };
    }
    // 小数×整数 または 小数×小数
    const isDecDec = p["mode"] === "decDec";
    if (isDecDec) {
      const a = int(r, 12, 35) / 10;
      const b = int(r, 2, 8) / 10;
      const ans = (Math.round(a * b * 100) / 100).toFixed(2);
      const pool = [(Number(ans) + 0.1).toFixed(2), (Number(ans) * 10).toFixed(1), (Number(ans) - 0.05).toFixed(2)];
      return {
        prompt: `${a.toFixed(1)} × ${b.toFixed(1)} = ?`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["小数の桁数を合わせると 1桁＋1桁＝2桁 小数点以下になるよ", `整数としてかけてから小数点を2つ左へ動かそう`, `こたえは ${ans}`],
      };
    }
    const a = int(r, 11, 48) / 10;
    const b = int(r, 2, 9);
    const ans = (Math.round(a * b * 10) / 10).toFixed(1);
    const pool = [(Number(ans) + 0.2).toFixed(1), (Number(ans) - 0.1).toFixed(1), (Number(ans) * 10).toFixed(0)];
    return {
      prompt: `${a.toFixed(1)} × ${b} = ?`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["整数と同じように計算して、小数点をつけよう", `0.1が何個分になるか考えよう`, `こたえは ${ans}`],
    };
  },

  // 7級・6級：分数の発展（異分母たし引き・約分・かけ算・わり算）
  fracAdvanced(p, r) {
    const mode = p["mode"] || "addDiff"; // addDiff, subDiff, simplify, mul, div
    if (mode === "simplify") {
      const primes = [2, 3, 5];
      const g = pick(r, primes);
      const an = int(r, 1, 4);
      const ad = pick(r, [an + 1, an + 2, an + 3]);
      const n = an * g;
      const d = ad * g;
      const ans = `${an}/${ad}`;
      const pool = [`${an + 1}/${ad}`, `${an}/${ad + 1}`, `${n}/${ad}`];
      return {
        prompt: `${n}/${d} を 約分して いちばん簡単な分数に すると？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: [`分母と分子を同じ数（${g}）で割ってみよう`, `分子: ${n}÷${g}＝${an}`, `こたえは ${ans}`],
      };
    }
    if (mode === "mul") {
      const n1 = int(r, 1, 3), d1 = pick(r, [4, 5, 7]);
      const n2 = int(r, 1, 3), d2 = pick(r, [2, 3]);
      const an = n1 * n2;
      const ad = d1 * d2;
      const ans = `${an}/${ad}`;
      const pool = [`${an + 1}/${ad}`, `${an}/${ad + 2}`, `${n1 + n2}/${d1 + d2}`];
      return {
        prompt: `${n1}/${d1} × ${n2}/${d2} = ?`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["分数のかけ算は「分子どうし」「分母どうし」をかけるよ", `分子は ${n1}×${n2}、分母は ${d1}×${d2}`, `こたえは ${ans}`],
      };
    }
    if (mode === "div") {
      const n1 = int(r, 1, 3), d1 = pick(r, [4, 5]);
      const n2 = int(r, 1, 2), d2 = pick(r, [3, 7]);
      const an = n1 * d2;
      const ad = d1 * n2;
      const ans = `${an}/${ad}`;
      const pool = [`${an}/${ad + 1}`, `${n1 * n2}/${d1 * d2}`, `${an + 1}/${ad}`];
      return {
        prompt: `${n1}/${d1} ÷ ${n2}/${d2} = ?`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["分数のわり算は、うしろの分数を「逆数」にしてかけるよ", `${n1}/${d1} × ${d2}/${n2} になるね`, `こたえは ${ans}`],
      };
    }
    // 異分母の加減算（addDiff / subDiff）
    const isSub = mode === "subDiff";
    const pairs = [
      { d1: 2, d2: 3, lcm: 6 },
      { d1: 3, d2: 4, lcm: 12 },
      { d1: 2, d2: 5, lcm: 10 },
      { d1: 4, d2: 5, lcm: 20 },
      { d1: 2, d2: 7, lcm: 14 },
      { d1: 3, d2: 5, lcm: 15 },
      { d1: 5, d2: 6, lcm: 30 },
      { d1: 3, d2: 7, lcm: 21 },
      { d1: 4, d2: 7, lcm: 28 },
      { d1: 2, d2: 9, lcm: 18 },
      { d1: 5, d2: 7, lcm: 35 },
      { d1: 3, d2: 8, lcm: 24 },
    ];
    const pair = pick(r, pairs);
    if (isSub) {
      const n1 = 1, n2 = 1; // 1/d1 - 1/d2 where d1 < d2
      const an = (pair.lcm / pair.d1) * n1 - (pair.lcm / pair.d2) * n2;
      const ans = `${an}/${pair.lcm}`;
      const pool = [`${an + 1}/${pair.lcm}`, `0`, `${an}/${pair.d1 + pair.d2}`];
      return {
        prompt: `1/${pair.d1} − 1/${pair.d2} = ?`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: [`分母を ${pair.lcm} に 通分（そろえる）しよう`, `${pair.lcm / pair.d1}/${pair.lcm} − ${pair.lcm / pair.d2}/${pair.lcm}`, `こたえは ${ans}`],
      };
    }
    const n1 = 1, n2 = 1;
    const an = (pair.lcm / pair.d1) * n1 + (pair.lcm / pair.d2) * n2;
    const ans = `${an}/${pair.lcm}`;
    const pool = [`${an + 1}/${pair.lcm}`, `2/${pair.d1 + pair.d2}`, `${an}/${pair.lcm * 2}`];
    return {
      prompt: `1/${pair.d1} + 1/${pair.d2} = ?`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: [`分母を ${pair.lcm} に 通分（そろえる）しよう`, `${pair.lcm / pair.d1}/${pair.lcm} + ${pair.lcm / pair.d2}/${pair.lcm}`, `こたえは ${ans}`],
    };
  },

  // 7級：割合と百分率（％、割）
  percent(_p, r) {
    const mode = pick(r, ["calc", "convert"]);
    if (mode === "convert") {
      const items = [
        { q: "0.4 を 百分率（％）で 表すと？", a: "40%", pool: ["40%", "4%", "400%", "0.4%"] },
        { q: "0.25 を 百分率（％）で 表すと？", a: "25%", pool: ["25%", "2.5%", "250%", "0.25%"] },
        { q: "70% を 小数で 表すと？", a: "0.7", pool: ["0.7", "0.07", "7", "70"] },
        { q: "3割 は 何 ％？", a: "30%", pool: ["30%", "3%", "300%", "13%"] },
        { q: "1割5分 は 何 ％？", a: "15%", pool: ["15%", "1.5%", "150%", "5%"] },
        { q: "50% は 何 割？", a: "5割", pool: ["5割", "50割", "0.5割", "1割"] },
      ];
      const it = pick(r, items);
      return {
        prompt: it.q,
        answer: it.a,
        input: "choice",
        choices: choices(r, it.a, it.pool),
        hints: ["1 ＝ 100% ＝ 10割 だよ", "0.1 ＝ 10% ＝ 1割 だね", `こたえは ${it.a}`],
      };
    }
    const base = pick(r, [100, 200, 300, 500, 1000]);
    const rate = pick(r, [10, 20, 30, 50]);
    const ansNum = (base * rate) / 100;
    const ans = `${ansNum}円`;
    const pool = [`${ansNum + 20}円`, `${ansNum * 2}円`, `${Math.max(10, ansNum - 10)}円`];
    return {
      prompt: `${base}円 の ${rate}％ は いくら？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: [`${rate}％ は 小数にすると ${rate / 100} だね`, `${base} × ${rate / 100} を計算しよう`, `こたえは ${ans}`],
    };
  },

  // 6級：速さ・道のり・時間
  speed(_p, r) {
    const kind = pick(r, ["distance", "speed", "time"]);
    if (kind === "distance") {
      const s = pick(r, [40, 50, 60]);
      const t = int(r, 2, 4);
      const ans = `${s * t}km`;
      const pool = [`${s * t + 20}km`, `${s * t - 30}km`, `${s + t}km`];
      return {
        prompt: `時速 ${s}km で ${t}時間 走ると、進む 道のりは 何km？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["道のり ＝ 速さ × 時間 だよ", `${s} × ${t} を計算しよう`, `こたえは ${ans}`],
      };
    }
    if (kind === "time") {
      const s = pick(r, [30, 40, 50]);
      const t = int(r, 2, 4);
      const d = s * t;
      const ans = `${t}時間`;
      const pool = [`${t + 1}時間`, `${t - 1}時間`, `${t * 2}時間`];
      return {
        prompt: `${d}km の 道のりを 時速 ${s}km で 進むと、かかる 時間は 何時間？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["時間 ＝ 道のり ÷ 速さ だよ", `${d} ÷ ${s} を計算しよう`, `こたえは ${ans}`],
      };
    }
    // speed
    const t = int(r, 2, 3);
    const s = pick(r, [30, 40, 50, 60]);
    const d = s * t;
    const ans = `時速${s}km`;
    const pool = [`時速${s + 10}km`, `時速${s - 10}km`, `時速${s * 2}km`];
    return {
      prompt: `${d}km の 道のりを ${t}時間 で 進んだときの 速さは？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["速さ ＝ 道のり ÷ 時間 だよ", `${d} ÷ ${t} を計算しよう`, `こたえは ${ans}`],
    };
  },

  // 6級：比と比の値
  ratio(_p, r) {
    const a = int(r, 2, 5);
    const b = int(r, 3, 7);
    const k = int(r, 2, 4);
    const isMissingSecond = r() > 0.5;
    if (isMissingSecond) {
      const ans = String(b * k);
      const pool = [String(b * k + 1), String(b * k - 2), String(b * (k + 1))];
      return {
        prompt: `${a} : ${b} ＝ ${a * k} : □ の □に入る数は？`,
        answer: ans,
        input: "keypad",
        hints: [`左の数は ${a} から ${a * k} へ ${k}倍 になっているね`, `右の数 ${b} も ${k}倍 にしよう`, `こたえは ${ans}`],
      };
    }
    const ans = String(a * k);
    return {
      prompt: `${a} : ${b} ＝ □ : ${b * k} の □に入る数は？`,
      answer: ans,
      input: "keypad",
      hints: [`右の数は ${b} から ${b * k} へ ${k}倍 になっているね`, `左の数 ${a} も ${k}倍 にしよう`, `こたえは ${ans}`],
    };
  },

  // 8級・7級・6級：図形の面積と体積
  geometry(p, r) {
    const kind = p["kind"] || "rectArea"; // rectArea, triangleArea, cubeVolume, circleArea
    if (kind === "rectArea") {
      const w = int(r, 3, 9);
      const h = int(r, 2, 8);
      const ans = String(w * h);
      return {
        prompt: `たて ${h}cm、よこ ${w}cm の 長方形の 面積は 何cm²？`,
        visual: `📐 たて:${h}cm × よこ:${w}cm`,
        answer: ans,
        input: "keypad",
        hints: ["長方形の面積 ＝ たて × よこ", `${h} × ${w} を計算しよう`, `こたえは ${ans}cm²`],
      };
    }
    if (kind === "triangleArea") {
      const base = pick(r, [4, 6, 8, 10]);
      const h = int(r, 3, 8);
      const ans = String((base * h) / 2);
      return {
        prompt: `底辺 ${base}cm、高さ ${h}cm の 三角形の 面積は 何cm²？`,
        visual: `📐 底辺:${base}cm, 高さ:${h}cm`,
        answer: ans,
        input: "keypad",
        hints: ["三角形の面積 ＝ 底辺 × 高さ ÷ 2", `${base} × ${h} ÷ 2 を計算しよう`, `こたえは ${ans}cm²`],
      };
    }
    if (kind === "cubeVolume") {
      const a = int(r, 2, 6);
      const b = int(r, 2, 5);
      const c = int(r, 2, 4);
      const ans = String(a * b * c);
      return {
        prompt: `たて ${a}cm、よこ ${b}cm、高さ ${c}cm の 直方体の 体積は 何cm³？`,
        visual: `📦 ${a}cm × ${b}cm × ${c}cm`,
        answer: ans,
        input: "keypad",
        hints: ["直方体の体積 ＝ たて × よこ × 高さ", `${a} × ${b} × ${c} を計算しよう`, `こたえは ${ans}cm³`],
      };
    }
    // circleArea (6級)
    const rad = pick(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20]);
    // 3.14 * rad^2
    const ansNum = Math.round(rad * rad * 3.14 * 100) / 100;
    const ans = String(ansNum);
    const pool = [String(Math.round((ansNum + 6.28) * 100) / 100), String(Math.round(rad * 2 * 3.14 * 100) / 100), String(rad * rad * 3), String(Math.round((ansNum - 3.14) * 100) / 100)];
    return {
      prompt: `半径 ${rad}cm の 円の 面積は 何cm²？（円周率は 3.14）`,
      visual: `⭕ 半径 ${rad}cm`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["円の面積 ＝ 半径 × 半径 × 3.14", `${rad} × ${rad} × 3.14 を計算しよう`, `こたえは ${ans}cm²`],
    };
  },

  // 6級：文字と式（xを使った逆算）
  equation(_p, r) {
    const op = pick(r, ["add", "sub", "mul"]);
    if (op === "add") {
      const a = int(r, 12, 45);
      const b = int(r, a + 10, a + 50);
      const ans = String(b - a);
      return {
        prompt: `x ＋ ${a} ＝ ${b} の x は？`,
        answer: ans,
        input: "keypad",
        hints: [`x を求めるには、両辺から ${a} を引こう`, `x ＝ ${b} − ${a}`, `こたえは ${ans}`],
      };
    }
    if (op === "sub") {
      const a = int(r, 8, 25);
      const x = int(r, 15, 60);
      const b = x - a;
      return {
        prompt: `x − ${a} ＝ ${b} の x は？`,
        answer: String(x),
        input: "keypad",
        hints: [`x を求めるには、${b} に ${a} を足そう`, `x ＝ ${b} ＋ ${a}`, `こたえは ${x}`],
      };
    }
    // mul
    const a = pick(r, [3, 4, 5, 6, 7, 8]);
    const x = int(r, 4, 12);
    const b = a * x;
    return {
      prompt: `x × ${a} ＝ ${b} の x は？`,
      answer: String(x),
      input: "keypad",
      hints: [`x を求めるには、${b} を ${a} で割ろう`, `x ＝ ${b} ÷ ${a}`, `こたえは ${x}`],
    };
  },

  // 国語：ひらがな最初のもじ（40語プール）
  kanaFirst(_p, r) {
    const words: [string, string][] = [
      ["🍎", "りんご"], ["🐟", "さかな"], ["🐱", "ねこ"], ["🐶", "いぬ"], ["🍓", "いちご"],
      ["🌸", "はな"], ["🚗", "くるま"], ["🐘", "ぞう"], ["⛰️", "やま"], ["🌙", "つき"],
      ["🍊", "みかん"], ["🐢", "かめ"], ["🍉", "すいか"], ["🦁", "らいおん"], ["🍌", "ばなな"],
      ["🍞", "ぱん"], ["✈️", "ひこうき"], ["🚃", "でんしゃ"], ["🦋", "ちょう"], ["🐸", "かえる"],
      ["🎈", "ふうせん"], ["👒", "ぼうし"], ["☂️", "かさ"], ["🍙", "おにぎり"], ["🌻", "ひまわり"],
      ["🐼", "ぱんだ"], ["🐰", "うさぎ"], ["🐧", "ぺんぎん"], ["🐙", "たこ"], ["🦀", "かに"],
      ["🌽", "とうもろこし"], ["🍇", "ぶどう"], ["🍄", "きのこ"], ["🍅", "とまと"], ["🥕", "にんじん"],
      ["🚀", "ろけっと"], ["🚢", "ふね"], ["🚲", "じてんしゃ"], ["🎺", "らっぱ"], ["🥁", "たいこ"],
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

  // 国語：カタカナ
  katakana(p, r) {
    const isReverse = p["reverse"] === true;
    const h = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん";
    const k = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン";
    const i = int(r, 0, h.length - 1);
    if (isReverse) {
      return {
        prompt: `「${k[i]}」の ひらがなは？`,
        answer: h[i] as string,
        input: "choice",
        choices: choices(r, h[i] as string, h.split("")),
        hints: ["おなじ おとの ひらがなを えらぼう", `「${k[i]}」と おなじ おと`, `こたえは「${h[i]}」`],
      };
    }
    const ans = k[i] as string;
    return {
      prompt: `「${h[i]}」の カタカナは？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, k.split("")),
      hints: ["かたちが にている ものも あるよ", `「${h[i]}」と おなじ おと`, `こたえは「${ans}」`],
    };
  },

  // 国語：手書き
  write(p, r) {
    const hira = [
      "あめ", "いぬ", "うし", "えき", "おに", "かさ", "そら", "はな", "ねこ", "みみ",
      "とり", "つき", "かわ", "やま", "ほし", "ゆき", "くも", "もり", "うみ", "ふね",
      "はる", "なつ", "あき", "ふゆ", "あさ",
    ];
    const kata = [
      "パン", "バス", "ケーキ", "トマト", "ノート", "ペン", "カメラ", "メロン", "ドア", "コップ",
      "ピアノ", "バナナ", "ミルク", "ポスト", "ボール", "ラジオ", "ギター", "チーズ", "アイス", "テレビ",
      "リンゴ", "レモン", "イチゴ", "トラック", "ボタン",
    ];
    const w = pick(r, p["set"] === "kata" ? kata : hira);
    return {
      prompt: `「${w}」を かいてみよう`,
      answer: w,
      input: "handwrite",
      hints: ["ゆっくり ていねいに かこう", "かきおわったら こたえを みて くらべよう", `おてほん：${w}`],
    };
  },

  // 国語：反対語（32組プール）
  opposite(_p, r) {
    const pairs: [string, string][] = [
      ["おおきい", "ちいさい"], ["ながい", "みじかい"], ["あつい", "さむい"], ["たかい", "ひくい"],
      ["はやい", "おそい"], ["あかるい", "くらい"], ["おもい", "かるい"], ["ふとい", "ほそい"],
      ["ひろい", "せまい"], ["うえ", "した"], ["まえ", "うしろ"], ["みぎ", "ひだり"],
      ["あける", "しめる"], ["あがる", "さがる"], ["たつ", "すわる"], ["いく", "くる"],
      ["あさ", "よる"], ["すき", "きらい"], ["つよい", "よわい"], ["あたらしい", "ふるい"],
      ["おおい", "すくない"], ["とおい", "ちかい"], ["かたい", "やわらかい"], ["あまい", "からい"],
      ["はいる", "でる"], ["かう", "うる"], ["かつ", "まける"], ["ひらく", "とじる"],
      ["わらう", "なく"], ["ねる", "おきる"], ["はじまる", "おわる"], ["ただしい", "まちがい"],
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

  // 国語：助詞（は・を・へ・が・に・で・と）
  josh(_p, r) {
    const items = [
      { q: "がっこう（ □ ）いく。", a: "へ", c: ["へ", "を", "は", "が"] },
      { q: "りんご（ □ ）たべる。", a: "を", c: ["を", "へ", "に", "は"] },
      { q: "わたし（ □ ）小学生です。", a: "は", c: ["は", "へ", "を", "で"] },
      { q: "あめ（ □ ）ふっている。", a: "が", c: ["が", "を", "へ", "は"] },
      { q: "ともだち（ □ ）あう。", a: "に", c: ["に", "を", "は", "へ"] },
      { q: "いえ（ □ ）かえる。", a: "へ", c: ["へ", "を", "が", "は"] },
      { q: "ほん（ □ ）よむ。", a: "を", c: ["を", "へ", "に", "は"] },
      { q: "とり（ □ ）とんでいる。", a: "が", c: ["が", "へ", "を", "に"] },
      { q: "こうえん（ □ ）あそぶ。", a: "で", c: ["で", "を", "へ", "が"] },
      { q: "バス（ □ ）のる。", a: "に", c: ["に", "を", "へ", "は"] },
      { q: "て（ □ ）あらう。", a: "を", c: ["を", "へ", "に", "は"] },
      { q: "はな（ □ ）さいた。", a: "が", c: ["が", "を", "へ", "に"] },
      { q: "はは（ □ ）てがみをかく。", a: "に", c: ["に", "を", "へ", "は"] },
      { q: "つくえ（ □ ）うえにおく。", a: "の", c: ["の", "を", "へ", "が"] },
      { q: "うみ（ □ ）いく。", a: "へ", c: ["へ", "を", "が", "は"] },
      { q: "ごはん（ □ ）たべる。", a: "を", c: ["を", "へ", "に", "は"] },
      { q: "やま（ □ ）のぼる。", a: "に", c: ["に", "を", "へ", "は"] },
      { q: "いぬ（ □ ）はしる。", a: "が", c: ["が", "を", "へ", "に"] },
      { q: "プール（ □ ）およぐ。", a: "で", c: ["で", "を", "へ", "が"] },
      { q: "えんぴつ（ □ ）じをかく。", a: "で", c: ["で", "を", "へ", "に"] },
      { q: "かぜ（ □ ）ふく。", a: "が", c: ["が", "を", "へ", "に"] },
      { q: "おかし（ □ ）かう。", a: "を", c: ["を", "へ", "に", "は"] },
      { q: "ともだち（ □ ）いっしょにかえる。", a: "と", c: ["と", "を", "へ", "に"] },
      { q: "あさ7じ（ □ ）おきる。", a: "に", c: ["に", "を", "へ", "は"] },
    ];
    const it = pick(r, items);
    return {
      prompt: `正しい ことばを えらぼう：\n${it.q}`,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["声に出して 読んでみよう", "どこへ行く？ なにを食べる？", `こたえは「${it.a}」`],
    };
  },

  // 国語：なかまのことば
  wordGroup(_p, r) {
    const groups: { group: string; correct: string; wrong: string[] }[] = [
      { group: "くだもの", correct: "ぶどう", wrong: ["キャベツ", "きゅうり", "さんま"] },
      { group: "やさい", correct: "にんじん", wrong: ["いちご", "バナナ", "すずめ"] },
      { group: "のりもの", correct: "ひこうき", wrong: ["えんぴつ", "いぬ", "ピアノ"] },
      { group: "どうぶつ", correct: "きりん", wrong: ["チューリップ", "トマト", "つくえ"] },
      { group: "がっこうの どうぐ", correct: "ノート", wrong: ["フォーク", "スリッパ", "リンゴ"] },
      { group: "とり（鳥）", correct: "つばめ", wrong: ["かえる", "うさぎ", "くじら"] },
      { group: "うみの いきもの", correct: "イルカ", wrong: ["スズメ", "ライオン", "ちょうちょ"] },
      { group: "むし（昆虫）", correct: "カブトムシ", wrong: ["金魚", "カラス", "リス"] },
      { group: "しょっき（食器）", correct: "おさら", wrong: ["えんぴつ", "くつ", "まくら"] },
      { group: "からだの ぶぶん", correct: "あたま", wrong: ["ぼうし", "シャツ", "メガネ"] },
      { group: "スポーツ", correct: "サッカー", wrong: ["ピアノ", "読書", "お絵かき"] },
      { group: "がっき（楽器）", correct: "バイオリン", wrong: ["ボール", "ハサミ", "カメラ"] },
      { group: "てんき（天気）", correct: "はれ", wrong: ["あさ", "よる", "はる"] },
      { group: "きせつ（季節）", correct: "なつ", wrong: ["きょう", "あした", "きのう"] },
      { group: "ふく（衣服）", correct: "ズボン", wrong: ["かばん", "時計", "えほん"] },
      { group: "あまい たべもの", correct: "ケーキ", wrong: ["カレー", "ラーメン", "おすし"] },
      { group: "さかな（魚）", correct: "マグロ", wrong: ["タコ", "エビ", "カニ"] },
      { group: "はな（花）", correct: "ひまわり", wrong: ["もみじ", "まつ", "イチョウ"] },
      { group: "いえの なか", correct: "台所（だいどころ）", wrong: ["公園", "道路", "駅"] },
      { group: "ぶんぼうぐ", correct: "消しゴム", wrong: ["コップ", "ティッシュ", "タオル"] },
    ];
    const it = pick(r, groups);
    return {
      prompt: `「${it.group}」の なかまは どれ？`,
      answer: it.correct,
      input: "choice",
      choices: shuffle(r, [it.correct, ...it.wrong]),
      hints: ["どんな なかまか 考えよう", `${it.group}の なかまを 1つえらぼう`, `こたえは「${it.correct}」`],
    };
  },

  // 国語：漢字の読み
  kanji(p, r) {
    const set1: [string, string][] = [
      ["山", "やま"], ["川", "かわ"], ["木", "き"], ["花", "はな"], ["空", "そら"],
      ["雨", "あめ"], ["目", "め"], ["手", "て"], ["火", "ひ"], ["水", "みず"],
      ["日", "ひ"], ["月", "つき"], ["田", "た"], ["白", "しろ"], ["赤", "あか"],
      ["青", "あお"], ["小", "ちいさい"], ["大", "おおきい"], ["上", "うえ"], ["下", "した"],
      ["右", "みぎ"], ["左", "ひだり"], ["人", "ひと"], ["子", "こ"], ["本", "ほん"],
    ];
    const set2: [string, string][] = [
      ["海", "うみ"], ["雪", "ゆき"], ["星", "ほし"], ["風", "かぜ"], ["朝", "あさ"],
      ["昼", "ひる"], ["夜", "よる"], ["春", "はる"], ["秋", "あき"], ["冬", "ふゆ"],
      ["道", "みち"], ["店", "みせ"], ["門", "もん"], ["寺", "てら"], ["魚", "さかな"],
      ["鳥", "とり"], ["馬", "うま"], ["牛", "うし"], ["友", "とも"], ["声", "こえ"],
      ["光", "ひかり"], ["雲", "くも"], ["池", "いけ"], ["谷", "たに"], ["林", "はやし"],
    ];
    const set3: [string, string][] = [
      ["駅", "えき"], ["島", "しま"], ["港", "みなと"], ["橋", "はし"], ["池", "いけ"],
      ["畑", "はたけ"], ["森", "もり"], ["坂", "さか"], ["太陽", "たいよう"], ["緑", "みどり"],
      ["服", "ふく"], ["指", "ゆび"], ["歯", "は"], ["鉄", "てつ"], ["銀", "ぎん"],
      ["笛", "ふえ"], ["波", "なみ"], ["岸", "きし"], ["昔", "むかし"], ["箱", "はこ"],
    ];
    const set4: [string, string][] = [
      ["旗", "はた"], ["城", "しろ"], ["街", "まち"], ["鏡", "かがみ"], ["船", "ふね"],
      ["雲", "くも"], ["波", "なみ"], ["泉", "いずみ"], ["岸", "きし"], ["底", "そこ"],
      ["熱い", "あつい"], ["冷たい", "つめたい"], ["拾う", "ひろう"], ["折る", "おる"],
      ["固い", "かたい"], ["浅い", "あさい"], ["深い", "ふかい"], ["照らす", "てらす"],
    ];
    const grade = p["set"];
    const set = grade === 4 ? set4 : grade === 3 ? set3 : grade === 2 ? set2 : set1;
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

  // 国語：読解問題
  reading(_p, r) {
    const items = [
      { t: "ゆいは あさ こうえんへ いきました。こうえんで しろい いぬに あいました。", q: "ゆいが あったのは どんな いぬ？", a: "しろい いぬ", c: ["しろい いぬ", "くろい いぬ", "ちいさい ねこ", "あかい とり"] },
      { t: "けんは にちようびに おじいさんと つりを しました。さかなが 3びき つれました。", q: "さかなは なんびき つれた？", a: "3びき", c: ["1ぴき", "2ひき", "3びき", "5ひき"] },
      { t: "あめが ふってきたので、はるは きいろい かさを さして がっこうへ いきました。", q: "はるが かさを さしたのは なぜ？", a: "あめが ふったから", c: ["あめが ふったから", "あついから", "かぜが つよいから", "ゆきが ふったから"] },
      { t: "そらは パンやさんで メロンパンを 2こと クリームパンを 1こ かいました。", q: "パンは ぜんぶで いくつ？", a: "3こ", c: ["1こ", "2こ", "3こ", "4こ"] },
      { t: "たろうくんは としょかんで きょうりゅうの えほんを かりて、うちで よみました。", q: "たろうくんは なにの ほんを かりた？", a: "きょうりゅうの えほん", c: ["きょうりゅうの えほん", "くるまの えほん", "りょうりの ほん", "おばけの まんが"] },
      { t: "ねこが ひなたぼっこを しています。きもちよさそうに めを とじて ねむっています。", q: "ねこは なにを している？", a: "ねむっている", c: ["ねむっている", "ごはんを たべている", "はしっている", "ないている"] },
      { t: "あおいそらに しろいくもが ふわふわ うかんでいます。ことりたちが たのしそうに うたっています。", q: "うたっているのは だれ？", a: "ことりたち", c: ["ことりたち", "くも", "たいよう", "ちょうちょ"] },
      { t: "あきになると、もみじの はっぱが あかや きいろに そまります。やまが とても きれいです。", q: "はっぱは なにいろに そまった？", a: "あかや きいろ", c: ["あかや きいろ", "あおや みどり", "くろや しろ", "むらさき"] },
      { t: "まいちゃんは にちようび、お母さんと 一緒に クッキーを つくりました。チョコの クッキーです。", q: "まいちゃんが つくったのは 何のクッキー？", a: "チョコの クッキー", c: ["チョコの クッキー", "イチゴの クッキー", "バナナの クッキー", "バターの クッキー"] },
      { t: "こうすけくんは あさ 6時におきて、ラジオたいそうを しました。すっきり めが さめました。", q: "こうすけくんは 何時におきた？", a: "6時", c: ["5時", "6時", "7時", "8時"] },
      { t: "にわの チューリップが あかい はなを さかせました。みつばちが とんできました。", q: "とんできたのは なに？", a: "みつばち", c: ["みつばち", "ちょうちょ", "とんぼ", "すずめ"] },
      { t: "りくくんは じぶんの じてんしゃを ピカピカに みがきました。あした ドライブに いきます。", q: "りくくんが みがいたのは？", a: "じてんしゃ", c: ["じてんしゃ", "くるま", "くつ", "つくえ"] },
      { t: "もりのおくで、りすが どんぐりを つちの なかに うめて います。ふゆの ごはんに するためです。", q: "りすは どんぐりを どうした？", a: "つちに うめた", c: ["つちに うめた", "たべた", "かわになげた", "きにのせた"] },
      { t: "きょうの きゅうしょくは、カレーライスと フルーツポンチでした。みんな だいすきです。", q: "きょうの きゅうしょくは何？", a: "カレーライス", c: ["カレーライス", "ラーメン", "うどん", "ハンバーグ"] },
      { t: "ゆうがた、にしのもりに 大きな にじが かかりました。7つの色が とても きれいでした。", q: "にじは何色あった？", a: "7つの色", c: ["5つの色", "6つの色", "7つの色", "8つの色"] },
      { t: "ぽちという 名前の こいぬが、しっぽを ふりながら 走ってきました。", q: "こいぬの 名前は何？", a: "ぽち", c: ["ぽち", "しろ", "くろ", "ころ"] },
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

  // 英語：大文字小文字
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

  // 英語：アルファベット順
  alphaOrder(_p, r) {
    const U = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const i = int(r, 0, 22);
    const ans = U[i + 3] as string;
    return {
      prompt: `${U[i]}, ${U[i + 1]}, ${U[i + 2]}, □\n□ に はいる 文字は？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, U.split("")),
      hints: ["ABCの うたを うたってみよう", `「${U[i + 2]}」の つぎの 文字は？`, `こたえは ${ans}`],
    };
  },

  // 英語：単語
  engWord(_p, r) {
    const w: [string, string][] = [
      ["🐶", "dog"], ["🐱", "cat"], ["🍎", "apple"], ["🍌", "banana"], ["🐟", "fish"],
      ["🐦", "bird"], ["🥚", "egg"], ["🍋", "lemon"], ["🐻", "bear"], ["🐰", "rabbit"],
      ["🦁", "lion"], ["🚗", "car"], ["✈️", "plane"], ["🚌", "bus"], ["🚲", "bike"],
      ["🌸", "flower"], ["🌳", "tree"], ["☀️", "sun"], ["🌙", "moon"], ["⭐", "star"],
      ["⚽", "soccer"], ["📖", "book"], ["✏️", "pen"], ["🏠", "house"], ["🥛", "milk"],
      ["🐼", "panda"], ["🐘", "elephant"], ["🍇", "grape"], ["🍉", "watermelon"],
      ["🧢", "cap"], ["👟", "shoe"], ["🎸", "guitar"], ["🚪", "door"], ["🪑", "chair"],
      ["⏰", "clock"], ["🌧️", "rain"],
    ];
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

  // 英語：色と数（28問プール）
  engColorsNumbers(_p, r) {
    const items: [string, string, string][] = [
      ["🔴", "red", "あか (赤)"],
      ["🔵", "blue", "あお (青)"],
      ["🟡", "yellow", "きいろ (黄)"],
      ["🟢", "green", "みどり (緑)"],
      ["⚪", "white", "しろ (白)"],
      ["⚫", "black", "くろ (黒)"],
      ["🌸", "pink", "ピンク"],
      ["🍊", "orange", "オレンジ (橙)"],
      ["🟣", "purple", "むらさき (紫)"],
      ["🟤", "brown", "ちゃいろ (茶)"],
      ["💧", "light blue", "みずいろ (水色)"],
      ["🪙", "gold", "きんいろ (金)"],
      ["🥈", "silver", "ぎんいろ (銀)"],
      ["1️⃣", "one", "いち (1)"],
      ["2️⃣", "two", "に (2)"],
      ["3️⃣", "three", "さん (3)"],
      ["4️⃣", "four", "よん (4)"],
      ["5️⃣", "five", "ご (5)"],
      ["6️⃣", "six", "ろく (6)"],
      ["7️⃣", "seven", "なな (7)"],
      ["8️⃣", "eight", "はち (8)"],
      ["9️⃣", "nine", "きゅう (9)"],
      ["🔟", "ten", "じゅう (10)"],
      ["1️⃣1️⃣", "eleven", "じゅういち (11)"],
      ["1️⃣2️⃣", "twelve", "じゅうに (12)"],
      ["2️⃣0️⃣", "twenty", "にじゅう (20)"],
      ["💯", "one hundred", "ひゃく (100)"],
    ];
    const [v, ans, hintText] = pick(r, items);
    return {
      prompt: `「${hintText}」を えいごで言うと？`,
      visual: v,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, items.map(([, x]) => x)),
      hints: ["色のなまえ・数のなまえを 思い出そう", `「${ans[0]}」から はじまるよ`, `こたえは ${ans}`],
    };
  },

  // 英語：あいさつと日常会話（20問プール）
  engGreeting(_p, r) {
    const items = [
      { q: "「おはよう」は えいごで？", a: "Good morning", c: ["Good morning", "Good night", "Hello", "Good bye"] },
      { q: "「こんにちは」は えいごで？", a: "Hello", c: ["Hello", "Good morning", "Thank you", "Sorry"] },
      { q: "「ありがとう」は えいごで？", a: "Thank you", c: ["Thank you", "You're welcome", "Please", "Excuse me"] },
      { q: "「さようなら」は えいごで？", a: "Good bye", c: ["Good bye", "Good morning", "Hello", "Here you are"] },
      { q: "「おやすみ」は えいごで？", a: "Good night", c: ["Good night", "Good afternoon", "See you", "Welcome"] },
      { q: "「ごめんなさい」は えいごで？", a: "I'm sorry", c: ["I'm sorry", "Thank you", "OK", "Nice to meet you"] },
      { q: "「はじめまして」は えいごで？", a: "Nice to meet you", c: ["Nice to meet you", "Good night", "Excuse me", "Hello"] },
      { q: "「またね！」は えいごで？", a: "See you", c: ["See you", "I'm sorry", "Thank you", "Good morning"] },
      { q: "「どういたしまして」は えいごで？", a: "You're welcome", c: ["You're welcome", "Excuse me", "Good bye", "Hello"] },
      { q: "「すみません（呼びかけ）」は えいごで？", a: "Excuse me", c: ["Excuse me", "Thank you", "I'm sorry", "Good bye"] },
      { q: "「元気ですか？」は えいごで？", a: "How are you?", c: ["How are you?", "What's this?", "Who are you?", "Where are you?"] },
      { q: "「元気です！」は えいごで？", a: "I'm fine", c: ["I'm fine", "I'm sorry", "Thank you", "Good bye"] },
      { q: "「どうぞ（手渡すとき）」は えいごで？", a: "Here you are", c: ["Here you are", "Thank you", "Good job", "See you"] },
      { q: "「おたんじょうび おめでとう！」は？", a: "Happy birthday", c: ["Happy birthday", "Good luck", "Welcome", "Thank you"] },
      { q: "「がんばって！」は えいごで？", a: "Good luck", c: ["Good luck", "Good night", "Good bye", "I'm sorry"] },
      { q: "「ようこそ！」は えいごで？", a: "Welcome", c: ["Welcome", "Good bye", "Thank you", "Hello"] },
      { q: "「いいよ！/ もちろん」は えいごで？", a: "Sure", c: ["Sure", "Sorry", "No", "Good night"] },
      { q: "「こんばんは」は えいごで？", a: "Good evening", c: ["Good evening", "Good morning", "Good night", "See you"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["まいにち つかう あいさつだよ", `さいしょの文字は「${it.a[0]}」`, `こたえは ${it.a}`],
    };
  },

  // 英語：文（24問プール）
  engSentence(_p, r) {
    const items = [
      { q: "I ___ apples.（りんごが すき）", a: "like", c: ["like", "is", "are", "am"] },
      { q: "I ___ a dog.（いぬを かっている）", a: "have", c: ["have", "am", "is", "go"] },
      { q: "I ___ eight years old.（8さいです）", a: "am", c: ["am", "is", "are", "have"] },
      { q: "This ___ my pen.（これは 私のペンです）", a: "is", c: ["is", "am", "are", "like"] },
      { q: "___ you like cats?（ねこが すきですか？）", a: "Do", c: ["Do", "Is", "Am", "Are"] },
      { q: "What is ___?（これは 何ですか？）", a: "this", c: ["this", "you", "they", "am"] },
      { q: "She ___ happy.（かの女は うれしそうです）", a: "is", c: ["is", "am", "are", "do"] },
      { q: "Let's ___ soccer!（サッカーを しよう！）", a: "play", c: ["play", "is", "eat", "am"] },
      { q: "I can ___ fast.（はやく 走れる）", a: "run", c: ["run", "am", "is", "like"] },
      { q: "I ___ bread for breakfast.（あさごはんに パンを たべる）", a: "eat", c: ["eat", "see", "run", "is"] },
      { q: "I ___ books every day.（まいにち 本を よむ）", a: "read", c: ["read", "play", "am", "is"] },
      { q: "He ___ a teacher.（彼は せんせいです）", a: "is", c: ["is", "am", "are", "do"] },
      { q: "They ___ my friends.（彼らは 私の友だちです）", a: "are", c: ["are", "is", "am", "have"] },
      { q: "We ___ to school.（私たちは 学校へ 行く）", a: "go", c: ["go", "is", "am", "are"] },
      { q: "I ___ to drink water.（水を 飲みたい）", a: "want", c: ["want", "is", "am", "play"] },
      { q: "Can you ___ English?（英語を 話せますか？）", a: "speak", c: ["speak", "eat", "run", "is"] },
      { q: "It is ___ today.（きょうは 晴れです）", a: "sunny", c: ["sunny", "apple", "book", "dog"] },
      { q: "I live ___ Japan.（日本に 住んでいます）", a: "in", c: ["in", "on", "at", "to"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["にほんごの いみを かんがえよう", "文のかたちに ちゅうい", `こたえは ${it.a}`],
    };
  },
};

export function generate(
  generator: string,
  params: Params,
  seed: number,
  delta = 0,
  usedPrompts?: Set<string>,
): Problem {
  const g = gens[generator] ?? gens["add"]!;
  let curSeed = seed;
  let lastProb: Problem | null = null;

  // 重複を避けるため最大50回までリロール
  for (let attempt = 0; attempt < 50; attempt++) {
    const p = g(params, rng(curSeed), delta);
    const prob: Problem = {
      seed: curSeed,
      prompt: p.prompt,
      answer: p.answer,
      input: p.input,
      hints: p.hints,
    };
    if (p.visual) prob.visual = p.visual;
    if (p.passage) prob.passage = p.passage;
    if (p.choices) prob.choices = p.choices;

    lastProb = prob;
    const key = `${prob.prompt}___${prob.answer}___${prob.visual || ""}`;
    if (!usedPrompts || !usedPrompts.has(key)) {
      usedPrompts?.add(key);
      return prob;
    }
    // 重複した場合はシードを変化させて別問題を探す
    curSeed = (curSeed + 1013904223 + attempt * 7919) >>> 0;
  }

  // プールが尽きた場合は最後の問題を返す
  return lastProb!;
}
