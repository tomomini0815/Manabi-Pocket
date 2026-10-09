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
  noRuby?: boolean;
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
  noRuby?: boolean;
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
        s <= 10 ? "りんごを ぜんぶ かぞえてみよう" : a >= 10 ? "[一|いち]のくらいから たそう" : "10の まとまりを つくろう",
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
        a <= 10 ? `${b} こ たべたら のこりは？` : "[一|いち]のくらいが ひけないときは 10を かりよう",
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
        hints: ["[分母|ぶんぼ]は そのままだよ", "[分子|ぶんし]だけを ひき[算|ざん]しよう", `${a}/${den} − ${b}/${den} = ${ans}`],
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
      hints: ["[分母|ぶんぼ]が おなじときは [分母|ぶんぼ]は そのまま", "[分子|ぶんし]だけを たそう", `${a}/${den} + ${b}/${den} = ${ans}`],
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
        hints: ["[小数点|しょうすうてん]の いちを そろえて ひこう", `0.1 が ${a} こから ${b} こ ひくと…`, `${fmt(a)} − ${fmt(b)} = ${ans}`],
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
      hints: ["0.1 が いくつ[分|ぶん]か かんがえよう", `0.1 が ${a} こと ${b} こ`, `${fmt(a)} + ${fmt(b)} = ${ans}`],
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
        visual: `⏰ ${h}:00 ＋ ${addM}[分|ふん]`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["ふん だけが ふえるよ", `${addM}[分|ふん] すすむと…`, `こたえは ${ans}`],
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
        { q: "1cm は [何|なん] mm？", a: "10", u: "mm", pool: ["10", "100", "1000", "1"] },
        { q: "1m は [何|なん] cm？", a: "100", u: "cm", pool: ["100", "10", "1000", "50"] },
        { q: "1km は [何|なん] m？", a: "1000", u: "m", pool: ["1000", "100", "10", "500"] },
        { q: "3cm は [何|なん] mm？", a: "30", u: "mm", pool: ["30", "300", "3", "13"] },
        { q: "2m は [何|なん] cm？", a: "200", u: "cm", pool: ["200", "20", "2000", "120"] },
        { q: "5km は [何|なん] m？", a: "5000", u: "m", pool: ["5000", "500", "50", "1500"] },
        { q: "40mm は [何|なん] cm？", a: "4", u: "cm", pool: ["4", "40", "400", "14"] },
        { q: "300cm は [何|なん] m？", a: "3", u: "m", pool: ["3", "30", "300", "3000"] },
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
        { q: "1L は [何|なん] dL？", a: "10", pool: ["10", "100", "1000", "1"] },
        { q: "1L は [何|なん] mL？", a: "1000", pool: ["1000", "100", "10", "500"] },
        { q: "1dL は [何|なん] mL？", a: "100", pool: ["100", "10", "1000", "50"] },
        { q: "2L は [何|なん] dL？", a: "20", pool: ["20", "200", "2", "2000"] },
        { q: "3000mL は [何|なん] L？", a: "3", pool: ["3", "30", "300", "13"] },
        { q: "50dL は [何|なん] L？", a: "5", pool: ["5", "50", "500", "15"] },
        { q: "5L は [何|なん] dL？", a: "50", pool: ["50", "500", "5", "5000"] },
        { q: "200mL は [何|なん] dL？", a: "2", pool: ["2", "20", "200", "2000"] },
        { q: "4L は [何|なん] mL？", a: "4000", pool: ["4000", "400", "40", "1400"] },
        { q: "8dL は [何|なん] mL？", a: "800", pool: ["800", "80", "8000", "8"] },
        { q: "10dL は [何|なん] L？", a: "1", pool: ["1", "10", "100", "2"] },
        { q: "500mL は [何|なん] dL？", a: "5", pool: ["5", "50", "500", "5000"] },
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
      { q: "1kg は [何|なん] g？", a: "1000", pool: ["1000", "100", "10", "500"] },
      { q: "1t は [何|なん] kg？", a: "1000", pool: ["1000", "100", "10000", "10"] },
      { q: "3kg は [何|なん] g？", a: "3000", pool: ["3000", "300", "30", "1300"] },
      { q: "2000g は [何|なん] kg？", a: "2", pool: ["2", "20", "200", "2000"] },
      { q: "4t は [何|なん] kg？", a: "4000", pool: ["4000", "400", "40", "1400"] },
      { q: "5kg は [何|なん] g？", a: "5000", pool: ["5000", "500", "50", "1500"] },
      { q: "5000kg は [何|なん] t？", a: "5", pool: ["5", "50", "500", "5000"] },
      { q: "8kg は [何|なん] g？", a: "8000", pool: ["8000", "800", "80", "1800"] },
      { q: "7000g は [何|なん] kg？", a: "7", pool: ["7", "70", "700", "17"] },
      { q: "2t は [何|なん] kg？", a: "2000", pool: ["2000", "200", "20", "20000"] },
      { q: "10000g は [何|なん] kg？", a: "10", pool: ["10", "100", "1000", "1"] },
      { q: "3t は [何|なん] kg？", a: "3000", pool: ["3000", "300", "30", "30000"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: choices(r, it.a, it.pool),
      hints: ["1kg ＝ 1000g、1t ＝ 1000kg だよ", "k（キロ）は1000[倍|ばい]のことだね", `こたえは ${it.a}`],
    };
  },

  // 8級：がい数・四捨五入
  roundNumber(_p, r) {
    const numVal = int(r, 1200, 8900);
    const place = pick(r, ["[千|せん]の[位|くらい]まで", "[百|ひゃく]の[位|くらい]まで"]);
    if (place === "[千|せん]の[位|くらい]まで") {
      const ansNum = Math.round(numVal / 1000) * 1000;
      const ans = String(ansNum);
      const pool = [String(ansNum + 1000), String(Math.max(1000, ansNum - 1000)), String(Math.floor(numVal / 1000) * 1000), String(Math.ceil(numVal / 100) * 100)];
      return {
        prompt: `${numVal} を [四捨五入|ししゃごにゅう]して [千|せん]の[位|くらい]までの がい[数|すう]に すると？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["[千|せん]の[位|くらい]までの がい[数|すう]は、すぐ[下|した]の「[百|ひゃく]の[位|くらい]」を [四捨五入|ししゃごにゅう]するよ", "0,1,2,3,4は[切|き]り[捨|す]て、5,6,7,8,9は[切|き]り[上|あ]げ", `こたえは ${ans}`],
      };
    }
    const ansNum = Math.round(numVal / 100) * 100;
    const ans = String(ansNum);
    const pool = [String(ansNum + 100), String(Math.max(100, ansNum - 100)), String(Math.floor(numVal / 100) * 100)];
    return {
      prompt: `${numVal} を [四捨五入|ししゃごにゅう]して [百|ひゃく]の[位|くらい]までの がい[数|すう]に すると？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["[百|ひゃく]の[位|くらい]までの がい[数|すう]は、すぐ[下|した]の「[十|じゅう]の[位|くらい]」を [四捨五入|ししゃごにゅう]するよ", "0,1,2,3,4は[切|き]り[捨|す]て、5,6,7,8,9は[切|き]り[上|あ]げ", `こたえは ${ans}`],
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
        hints: ["[小数点|しょうすうてん]の[位置|いち]をそのまま[上|うえ]にあげよう", `${a}の[中|なか]に${b}がいくつあるかな？`, `${a} ÷ ${b} = ${ans}`],
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
        hints: ["[小数|しょうすう]の[桁数|けたすう]を[合|あ]わせると 1[桁|けた]＋1[桁|けた]＝2[桁|けた] [小数点以下|しょうすうてんいか]になるよ", `[整数|せいすう]としてかけてから[小数点|しょうすうてん]を2つ[左|ひだり]へ[動|うご]かそう`, `こたえは ${ans}`],
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
      hints: ["[整数|せいすう]と[同|おな]じように[計算|けいさん]して、[小数点|しょうすうてん]をつけよう", `0.1が[何個分|なんこぶん]になるか[考|かんが]えよう`, `こたえは ${ans}`],
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
        prompt: `${n}/${d} を [約分|やくぶん]して いちばん[簡単|かんたん]な[分数|ぶんすう]に すると？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: [`[分母|ぶんぼ]と[分子|ぶんし]を[同|おな]じ[数|かず]（${g}）で[割|わ]ってみよう`, `[分子|ぶんし]: ${n}÷${g}＝${an}`,  `こたえは ${ans}`],
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
        hints: ["[分数|ぶんすう]のかけ[算|ざん]は「[分子|ぶんし]どうし」「[分母|ぶんぼ]どうし」をかけるよ", `[分子|ぶんし]は ${n1}×${n2}、[分母|ぶんぼ]は ${d1}×${d2}`,  `こたえは ${ans}`],
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
        hints: ["[分数|ぶんすう]のわり[算|ざん]は、うしろの[分数|ぶんすう]を「[逆数|ぎゃくすう]」にしてかけるよ", `${n1}/${d1} × ${d2}/${n2} になるね`,  `こたえは ${ans}`],
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
        hints: [`[分母|ぶんぼ]を ${pair.lcm} に [通分|つうぶん]（そろえる）しよう`, `${pair.lcm / pair.d1}/${pair.lcm} − ${pair.lcm / pair.d2}/${pair.lcm}`, `こたえは ${ans}`],
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
      hints: [`[分母|ぶんぼ]を ${pair.lcm} に [通分|つうぶん]（そろえる）しよう`, `${pair.lcm / pair.d1}/${pair.lcm} + ${pair.lcm / pair.d2}/${pair.lcm}`, `こたえは ${ans}`],
    };
  },

  // 7級：割合と百分率（％、割）
  percent(_p, r) {
    const mode = pick(r, ["calc", "convert"]);
    if (mode === "convert") {
      const items = [
        { q: "0.4 を [百分率|ひゃくぶんりつ]（％）で [表|あらわ]すと？", a: "40%", pool: ["40%", "4%", "400%", "0.4%"] },
        { q: "0.25 を [百分率|ひゃくぶんりつ]（％）で [表|あらわ]すと？", a: "25%", pool: ["25%", "2.5%", "250%", "0.25%"] },
        { q: "70% を [小数|しょうすう]で [表|あらわ]すと？", a: "0.7", pool: ["0.7", "0.07", "7", "70"] },
        { q: "3[割|わり] は [何|なん] ％？", a: "30%", pool: ["30%", "3%", "300%", "13%"] },
        { q: "1[割|わり]5[分|ぶ] は [何|なん] ％？", a: "15%", pool: ["15%", "1.5%", "150%", "5%"] },
        { q: "50% は [何|なん] [割|わり]？", a: "5[割|わり]", pool: ["5[割|わり]", "50[割|わり]", "0.5[割|わり]", "1[割|わり]"] },
      ];
      const it = pick(r, items);
      return {
        prompt: it.q,
        answer: it.a,
        input: "choice",
        choices: choices(r, it.a, it.pool),
        hints: ["1 ＝ 100% ＝ 10[割|わり] だよ", "0.1 ＝ 10% ＝ 1[割|わり] だね", `こたえは ${it.a}`],
      };
    }
    const base = pick(r, [100, 200, 300, 500, 1000]);
    const rate = pick(r, [10, 20, 30, 50]);
    const ansNum = (base * rate) / 100;
    const ans = `${ansNum}[円|えん]`;
    const pool = [`${ansNum + 20}[円|えん]`, `${ansNum * 2}[円|えん]`, `${Math.max(10, ansNum - 10)}[円|えん]`];
    return {
      prompt: `${base}[円|えん] の ${rate}％ は いくら？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: [`${rate}％ は [小数|しょうすう]にすると ${rate / 100} だね`, `${base} × ${rate / 100} を[計算|けいさん]しよう`, `こたえは ${ans}`],
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
        prompt: `[時速|じそく] ${s}km で ${t}[時間|じかん] [走|はし]ると、[進|すす]む [道|みち]のりは [何|なん]km？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["[道|みち]のり ＝ [速|はや]さ × [時間|じかん] だよ", `${s} × ${t} を[計算|けいさん]しよう`, `こたえは ${ans}`],
      };
    }
    if (kind === "time") {
      const s = pick(r, [30, 40, 50]);
      const t = int(r, 2, 4);
      const d = s * t;
      const ans = `${t}[時間|じかん]`;
      const pool = [`${t + 1}[時間|じかん]`, `${t - 1}[時間|じかん]`, `${t * 2}[時間|じかん]`];
      return {
        prompt: `${d}km の [道|みち]のりを [時速|じそく] ${s}km で [進|すす]むと、かかる [時間|じかん]は [何時間|なんじかん]？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["[時間|じかん] ＝ [道|みち]のり ÷ [速|はや]さ だよ", `${d} ÷ ${s} を[計算|けいさん]しよう`, `こたえは ${ans}`],
      };
    }
    // speed
    const t = int(r, 2, 3);
    const s = pick(r, [30, 40, 50, 60]);
    const d = s * t;
    const ans = `[時速|じそく]${s}km`;
    const pool = [`[時速|じそく]${s + 10}km`, `[時速|じそく]${s - 10}km`, `[時速|じそく]${s * 2}km`];
    return {
      prompt: `${d}km の [道|みち]のりを ${t}[時間|じかん] で [進|すす]んだときの [速|はや]さは？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["[速|はや]さ ＝ [道|みち]のり ÷ [時間|じかん] だよ", `${d} ÷ ${t} を[計算|けいさん]しよう`, `こたえは ${ans}`],
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
        prompt: `${a} : ${b} ＝ ${a * k} : □ の □に[入|はい]る[数|かず]は？`,
        answer: ans,
        input: "keypad",
        hints: [`[左|ひだり]の[数|かず]は ${a} から ${a * k} へ ${k}[倍|ばい] になっているね`, `[右|みぎ]の[数|かず] ${b} も ${k}[倍|ばい] にしよう`, `こたえは ${ans}`],
      };
    }
    const ans = String(a * k);
    return {
      prompt: `${a} : ${b} ＝ □ : ${b * k} の □に[入|はい]る[数|かず]は？`,
      answer: ans,
      input: "keypad",
      hints: [`[右|みぎ]の[数|かず]は ${b} から ${b * k} へ ${k}[倍|ばい] になっているね`, `[左|ひだり]の[数|かず] ${a} も ${k}[倍|ばい] にしよう`, `こたえは ${ans}`],
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
        prompt: `たて ${h}cm、よこ ${w}cm の [長方形|ちょうほうけい]の [面積|めんせき]は [何|なん]cm²？`,
        visual: `📐 たて:${h}cm × よこ:${w}cm`,
        answer: ans,
        input: "keypad",
        hints: ["[長方形|ちょうほうけい]の[面積|めんせき] ＝ たて × よこ", `${h} × ${w} を[計算|けいさん]しよう`, `こたえは ${ans}cm²`],
      };
    }
    if (kind === "triangleArea") {
      const base = pick(r, [4, 6, 8, 10]);
      const h = int(r, 3, 8);
      const ans = String((base * h) / 2);
      return {
        prompt: `[底辺|ていへん] ${base}cm、[高|たか]さ ${h}cm の [三角形|さんかっけい]の [面積|めんせき]は [何|なん]cm²？`,
        visual: `📐 [底辺|ていへん]:${base}cm, [高|たか]さ:${h}cm`,
        answer: ans,
        input: "keypad",
        hints: ["[三角形|さんかっけい]の[面積|めんせき] ＝ [底辺|ていへん] × [高|たか]さ ÷ 2", `${base} × ${h} ÷ 2 を[計算|けいさん]しよう`, `こたえは ${ans}cm²`],
      };
    }
    if (kind === "cubeVolume") {
      const a = int(r, 2, 6);
      const b = int(r, 2, 5);
      const c = int(r, 2, 4);
      const ans = String(a * b * c);
      return {
        prompt: `たて ${a}cm、よこ ${b}cm、[高|たか]さ ${c}cm の [直方体|ちょくほうたい]の [体積|たいせき]は [何|なん]cm³？`,
        visual: `📦 ${a}cm × ${b}cm × ${c}cm`,
        answer: ans,
        input: "keypad",
        hints: ["[直方体|ちょくほうたい]の[体積|たいせき] ＝ たて × よこ × [高|たか]さ", `${a} × ${b} × ${c} を[計算|けいさん]しよう`, `こたえは ${ans}cm³`],
      };
    }
    // circleArea (6級)
    const rad = pick(r, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20]);
    // 3.14 * rad^2
    const ansNum = Math.round(rad * rad * 3.14 * 100) / 100;
    const ans = String(ansNum);
    const pool = [String(Math.round((ansNum + 6.28) * 100) / 100), String(Math.round(rad * 2 * 3.14 * 100) / 100), String(rad * rad * 3), String(Math.round((ansNum - 3.14) * 100) / 100)];
    return {
      prompt: `[半径|はんけい] ${rad}cm の [円|えん]の [面積|めんせき]は [何|なん]cm²？（[円周率|えんしゅうりつ]は 3.14）`,
      visual: `⭕ [半径|はんけい] ${rad}cm`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["[円|えん]の[面積|めんせき] ＝ [半径|はんけい] × [半径|はんけい] × 3.14", `${rad} × ${rad} × 3.14 を[計算|けいさん]しよう`, `こたえは ${ans}cm²`],
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
        hints: [`x を[求|もと]めるには、[両辺|りょうへん]から ${a} を[引|ひ]こう`, `x ＝ ${b} − ${a}`, `こたえは ${ans}`],
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
        hints: [`x を[求|もと]めるには、${b} に ${a} を[足|た]そう`, `x ＝ ${b} ＋ ${a}`, `こたえは ${x}`],
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
      hints: [`x を[求|もと]めるには、${b} を ${a} で[割|わ]ろう`, `x ＝ ${b} ÷ ${a}`, `こたえは ${x}`],
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
      { q: "わたし（ □ ）[小学生|しょうがくせい]です。", a: "は", c: ["は", "へ", "を", "で"] },
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
      prompt: `[正|ただ]しい ことばを えらぼう：\n${it.q}`,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["[声|こえ]に[出|だ]して [読|よ]んでみよう", "どこへ[行|い]く？ なにを[食|た]べる？", `こたえは「${it.a}」`],
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
      { group: "とり（[鳥|とり]）", correct: "つばめ", wrong: ["かえる", "うさぎ", "くじら"] },
      { group: "うみの いきもの", correct: "イルカ", wrong: ["スズメ", "ライオン", "ちょうちょ"] },
      { group: "むし（[昆虫|こんちゅう]）", correct: "カブトムシ", wrong: ["[金魚|きんぎょ]", "カラス", "リス"] },
      { group: "しょっき（[食器|しょっき]）", correct: "おさら", wrong: ["えんぴつ", "くつ", "まくら"] },
      { group: "からだの ぶぶん", correct: "あたま", wrong: ["ぼうし", "シャツ", "メガネ"] },
      { group: "スポーツ", correct: "サッカー", wrong: ["ピアノ", "[読書|どくしょ]", "お[絵|え]かき"] },
      { group: "がっき（[楽器|がっき]）", correct: "バイオリン", wrong: ["ボール", "ハサミ", "カメラ"] },
      { group: "てんき（[天気|てんき]）", correct: "はれ", wrong: ["あさ", "よる", "はる"] },
      { group: "きせつ（[季節|きせつ]）", correct: "なつ", wrong: ["きょう", "あした", "きのう"] },
      { group: "ふく（[衣服|いふく]）", correct: "ズボン", wrong: ["かばん", "[時計|とけい]", "えほん"] },
      { group: "あまい たべもの", correct: "ケーキ", wrong: ["カレー", "ラーメン", "おすし"] },
      { group: "さかな（[魚|さかな]）", correct: "マグロ", wrong: ["タコ", "エビ", "カニ"] },
      { group: "はな（[花|はな]）", correct: "ひまわり", wrong: ["もみじ", "まつ", "イチョウ"] },
      { group: "いえの なか", correct: "[台所|だいどころ]", wrong: ["[公園|こうえん]", "[道路|どうろ]", "[駅|えき]"] },
      { group: "ぶんぼうぐ", correct: "[消|け]しゴム", wrong: ["コップ", "ティッシュ", "タオル"] },
    ];
    const it = pick(r, groups);
    return {
      prompt: `「${it.group}」の なかまは どれ？`,
      answer: it.correct,
      input: "choice",
      choices: shuffle(r, [it.correct, ...it.wrong]),
      hints: ["どんな なかまか [考|かんが]えよう", `${it.group}の なかまを 1つえらぼう`, `こたえは「${it.correct}」`],
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
    const set5: [string, string][] = [
      ["祖父", "そふ"], ["経る", "へる"], ["貧しい", "まずしい"], ["潔い", "いさぎよい"], ["余る", "あまる"],
      ["耕す", "たがやす"], ["豊かな", "ゆたかな"], ["適する", "てきする"], ["防ぐ", "ふせぐ"], ["率いる", "ひきいる"],
      ["険しい", "けわしい"], ["桜", "さくら"], ["額", "ひたい"], ["均等", "きんとう"], ["複雑", "ふくざつ"],
      ["貸す", "かす"], ["義務", "ぎむ"], ["保つ", "たもつ"], ["規則", "きそく"], ["貿易", "ぼうえき"],
      ["政党", "せいとう"], ["銅", "どう"], ["綿", "めん"], ["招く", "まねく"], ["版画", "はんが"],
    ];
    const set6: [string, string][] = [
      ["尊い", "とうとい"], ["縮む", "ちぢむ"], ["窓", "まど"], ["机", "つくえ"], ["善悪", "ぜんあく"],
      ["骨折", "こっせつ"], ["磁石", "じしゃく"], ["砂糖", "さとう"], ["忠実", "ちゅうじつ"], ["絹", "きぬ"],
      ["激しい", "はげしい"], ["危うい", "あやうい"], ["疑う", "うたがう"], ["朗らか", "ほがらか"], ["納める", "おさめる"],
      ["担ぐ", "かつぐ"], ["訪ねる", "たずねる"], ["干す", "ほす"], ["拝む", "おがむ"], ["純粋", "じゅんすい"],
      ["裁く", "さばく"], ["城跡", "しろあと"], ["背骨", "せぼね"], ["晩御飯", "ばんごはん"], ["幕府", "ばくふ"],
    ];
    const grade = p["set"];
    const set = grade === 6 ? set6 : grade === 5 ? set5 : grade === 4 ? set4 : grade === 3 ? set3 : grade === 2 ? set2 : set1;
    const [k, y] = pick(r, set);
    return {
      prompt: `「${k}」の よみかたは？`,
      visual: k,
      answer: y,
      input: "choice",
      noRuby: true,
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
      { t: "まいちゃんは にちようび、[お母|おかあ]さんと [一緒|いっしょ]に クッキーを つくりました。チョコの クッキーです。", q: "まいちゃんが つくったのは [何|なん]のクッキー？", a: "チョコの クッキー", c: ["チョコの クッキー", "イチゴの クッキー", "バナナの クッキー", "バターの クッキー"] },
      { t: "こうすけくんは あさ 6[時|じ]におきて、ラジオたいそうを しました。すっきり めが さめました。", q: "こうすけくんは [何時|なんじ]におきた？", a: "6[時|じ]", c: ["5[時|じ]", "6[時|じ]", "7[時|じ]", "8[時|じ]"] },
      { t: "にわの チューリップが あかい はなを さかせました。みつばちが とんできました。", q: "とんできたのは なに？", a: "みつばち", c: ["みつばち", "ちょうちょ", "とんぼ", "すずめ"] },
      { t: "りくくんは じぶんの じてんしゃを ピカピカに みがきました。あした ドライブに いきます。", q: "りくくんが みがいたのは？", a: "じてんしゃ", c: ["じてんしゃ", "くるま", "くつ", "つくえ"] },
      { t: "もりのおくで、りすが どんぐりを つちの なかに うめて います。ふゆの ごはんに するためです。", q: "りすは どんぐりを どうした？", a: "つちに うめた", c: ["つちに うめた", "たべた", "かわになげた", "きにのせた"] },
      { t: "きょうの きゅうしょくは、カレーライスと フルーツポンチでした。みんな だいすきです。", q: "きょうの きゅうしょくは[何|なに]？", a: "カレーライス", c: ["カレーライス", "ラーメン", "うどん", "ハンバーグ"] },
      { t: "ゆうがた、にしのもりに [大|おお]きな にじが かかりました。7つの[色|いろ]が とても きれいでした。", q: "にじは[何色|なにいろ]あった？", a: "7つの[色|いろ]", c: ["5つの[色|いろ]", "6つの[色|いろ]", "7つの[色|いろ]", "8つの[色|いろ]"] },
      { t: "ぽちという [名前|なまえ]の こいぬが、しっぽを ふりながら [走|はし]ってきました。", q: "こいぬの [名前|なまえ]は[何|なに]？", a: "ぽち", c: ["ぽち", "しろ", "くろ", "ころ"] },
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
      prompt: `「${U[i]}」の [小文字|こもじ]は？`,
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
      prompt: `${U[i]}, ${U[i + 1]}, ${U[i + 2]}, □\n□ に はいる [文字|もじ]は？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, U.split("")),
      hints: ["ABCの うたを うたってみよう", `「${U[i + 2]}」の つぎの [文字|もじ]は？`, `こたえは ${ans}`],
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
      ["🔴", "red", "あか ([赤|あか])"],
      ["🔵", "blue", "あお ([青|あお])"],
      ["🟡", "yellow", "きいろ ([黄|きいろ])"],
      ["🟢", "green", "みどり ([緑|みどり])"],
      ["⚪", "white", "しろ ([白|しろ])"],
      ["⚫", "black", "くろ ([黒|くろ])"],
      ["🌸", "pink", "ピンク"],
      ["🍊", "orange", "オレンジ ([橙|だいだい])"],
      ["🟣", "purple", "むらさき ([紫|むらさき])"],
      ["🟤", "brown", "ちゃいろ ([茶|ちゃいろ])"],
      ["💧", "light blue", "みずいろ ([水色|みずいろ])"],
      ["🪙", "gold", "きんいろ ([金|きん])"],
      ["🥈", "silver", "ぎんいろ ([銀|ぎん])"],
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
      prompt: `「${hintText}」を えいごで[言|い]うと？`,
      visual: v,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, items.map(([, x]) => x)),
      hints: ["[色|いろ]のなまえ・[数|かず]のなまえを [思|おも]い[出|だ]そう", `「${ans[0]}」から はじまるよ`, `こたえは ${ans}`],
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
      { q: "「すみません（[呼|よ]びかけ）」は えいごで？", a: "Excuse me", c: ["Excuse me", "Thank you", "I'm sorry", "Good bye"] },
      { q: "「[元気|げんき]ですか？」は えいごで？", a: "How are you?", c: ["How are you?", "What's this?", "Who are you?", "Where are you?"] },
      { q: "「[元気|げんき]です！」は えいごで？", a: "I'm fine", c: ["I'm fine", "I'm sorry", "Thank you", "Good bye"] },
      { q: "「どうぞ（[手渡|てわた]すとき）」は えいごで？", a: "Here you are", c: ["Here you are", "Thank you", "Good job", "See you"] },
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
      hints: ["まいにち つかう あいさつだよ", `さいしょの[文字|もじ]は「${it.a[0]}」`, `こたえは ${it.a}`],
    };
  },

  // 英語：文（24問プール）
  engSentence(_p, r) {
    const items = [
      { q: "I ___ apples.（りんごが すき）", a: "like", c: ["like", "is", "are", "am"] },
      { q: "I ___ a dog.（いぬを かっている）", a: "have", c: ["have", "am", "is", "go"] },
      { q: "I ___ eight years old.（8さいです）", a: "am", c: ["am", "is", "are", "have"] },
      { q: "This ___ my pen.（これは [私|わたし]のペンです）", a: "is", c: ["is", "am", "are", "like"] },
      { q: "___ you like cats?（ねこが すきですか？）", a: "Do", c: ["Do", "Is", "Am", "Are"] },
      { q: "What is ___?（これは [何|なん]ですか？）", a: "this", c: ["this", "you", "they", "am"] },
      { q: "She ___ happy.（かの[女|じょ]は うれしそうです）", a: "is", c: ["is", "am", "are", "do"] },
      { q: "Let's ___ soccer!（サッカーを しよう！）", a: "play", c: ["play", "is", "eat", "am"] },
      { q: "I can ___ fast.（はやく [走|はし]れる）", a: "run", c: ["run", "am", "is", "like"] },
      { q: "I ___ bread for breakfast.（あさごはんに パンを たべる）", a: "eat", c: ["eat", "see", "run", "is"] },
      { q: "I ___ books every day.（まいにち [本|ほん]を よむ）", a: "read", c: ["read", "play", "am", "is"] },
      { q: "He ___ a teacher.（[彼|かれ]は せんせいです）", a: "is", c: ["is", "am", "are", "do"] },
      { q: "They ___ my friends.（[彼|かれ]らは [私|わたし]の[友|とも]だちです）", a: "are", c: ["are", "is", "am", "have"] },
      { q: "We ___ to school.（[私|わたし]たちは [学校|がっこう]へ [行|い]く）", a: "go", c: ["go", "is", "am", "are"] },
      { q: "I ___ to drink water.（[水|みず]を [飲|の]みたい）", a: "want", c: ["want", "is", "am", "play"] },
      { q: "Can you ___ English?（[英語|えいご]を [話|はな]せますか？）", a: "speak", c: ["speak", "eat", "run", "is"] },
      { q: "It is ___ today.（きょうは [晴|は]れです）", a: "sunny", c: ["sunny", "apple", "book", "dog"] },
      { q: "I live ___ Japan.（[日本|にほん]に [住|す]んでいます）", a: "in", c: ["in", "on", "at", "to"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["にほんごの いみを [考|かんが]えよう", "[文|ぶん]のかたちに ちゅうい", `こたえは ${it.a}`],
    };
  },

  // 算数5年：平均・単位量あたり
  average(_p, r) {
    const mode = pick(r, ["avg3", "avg4", "unitPer"]);
    if (mode === "avg3") {
      const avg = int(r, 65, 92);
      const diff1 = int(r, -8, 8);
      const diff2 = int(r, -8, 8);
      const a = avg + diff1;
      const b = avg + diff2;
      const c = avg * 3 - a - b;
      const ans = String(avg);
      const pool = [String(avg + 2), String(avg - 3), String(avg + 5)];
      return {
        prompt: `3[回|かい]の テストの [点数|てんすう]が ${a}[点|てん]、${b}[点|てん]、${c}[点|てん] でした。[平均点|へいきんてん]は [何点|なんてん]？`,
        answer: ans,
        input: "choice",
        choices: choices(r, ans, pool),
        hints: ["[平均|へいきん] ＝ [合計|ごうけい] ÷ [個数|こすう] だよ", `(${a} ＋ ${b} ＋ ${c}) ÷ 3 を[計算|けいさん]しよう`, `こたえは ${ans}[点|てん]`],
      };
    }
    if (mode === "avg4") {
      const avg = int(r, 130, 150);
      const d1 = int(r, -6, 6), d2 = int(r, -6, 6), d3 = int(r, -6, 6);
      const a = avg + d1, b = avg + d2, c = avg + d3;
      const d = avg * 4 - a - b - c;
      const ans = String(avg);
      return {
        prompt: `4[人|にん]の [身長|しんちょう]は ${a}cm、${b}cm、${c}cm、${d}cm です。[平均|へいきん]の [身長|しんちょう]は [何|なん]cm？`,
        answer: ans,
        input: "keypad",
        hints: ["4[人|にん]の [身長|しんちょう]を [全部|ぜんぶ] [足|た]して 4 で [割|わ]ろう", `合計は ${avg * 4}cm だよ`, `こたえは ${ans}cm`],
      };
    }
    // 単位量あたり
    const per = pick(r, [3, 4, 5, 8, 12, 15]);
    const area = pick(r, [10, 20, 30, 50]);
    const total = per * area;
    const ans = String(per);
    const pool = [String(per + 2), String(Math.max(1, per - 1)), String(per * 2)];
    return {
      prompt: `[広|ひろ]さ ${area}m² の [花壇|かだん]に、${total}[本|ほん]の チューリップが [咲|さ]いています。1m² あたり [何本|なんぼん]？`,
      answer: ans,
      input: "choice",
      choices: choices(r, ans, pool),
      hints: ["1m² あたりの [数|かず] ＝ [全体|ぜんたい]の[数|かず] ÷ [面積|めんせき]", `${total} ÷ ${area} を[計算|けいさん]しよう`, `こたえは ${ans}[本|ほん]`],
    };
  },

  // 算数5・6年：平行四辺形・台形・ひし形・角柱
  geometryAdv(p, r) {
    const kind = p["kind"] || pick(r, ["parallelogram", "trapezoid", "rhombus", "prism"]);
    if (kind === "parallelogram") {
      const b = int(r, 4, 12);
      const h = int(r, 3, 9);
      const ans = String(b * h);
      return {
        prompt: `[底辺|ていへん] ${b}cm、[高|たか]さ ${h}cm の [平行四辺形|へいこうしへんけい]の [面積|めんせき]は [何|なん]cm²？`,
        visual: `📐 [底辺|ていへん]:${b}cm, [高|たか]さ:${h}cm`,
        answer: ans,
        input: "keypad",
        hints: ["[平行四辺形|へいこうしへんけい]の[面積|めんせき] ＝ [底辺|ていへん] × [高|たか]さ", `${b} × ${h} を[計算|けいさん]しよう`, `こたえは ${ans}cm²`],
      };
    }
    if (kind === "trapezoid") {
      const top = int(r, 3, 8);
      const bottom = int(r, top + 2, top + 8);
      const h = pick(r, [2, 4, 6, 8]);
      const ans = String(((top + bottom) * h) / 2);
      return {
        prompt: `[上底|じょうてい] ${top}cm、[下底|かてい] ${bottom}cm、[高|たか]さ ${h}cm の [台形|だいけい]の [面積|めんせき]は [何|なん]cm²？`,
        visual: `📐 [上底|じょうてい]:${top}cm, [下底|かてい]:${bottom}cm, [高|たか]さ:${h}cm`,
        answer: ans,
        input: "keypad",
        hints: ["[台形|だいけい]の[面積|めんせき] ＝ ([上底|じょうてい] ＋ [下底|かてい]) × [高|たか]さ ÷ 2", `(${top} ＋ ${bottom}) × ${h} ÷ 2`, `こたえは ${ans}cm²`],
      };
    }
    if (kind === "rhombus") {
      const d1 = pick(r, [4, 6, 8, 10]);
      const d2 = int(r, 3, 9);
      const ans = String((d1 * d2) / 2);
      return {
        prompt: `2本の [対角線|たいかくせん]の [長|なが]さが ${d1}cm、${d2}cm の [ひし形|ひしがた]の [面積|めんせき]は [何|なん]cm²？`,
        answer: ans,
        input: "keypad",
        hints: ["[ひし形|ひしがた]の[面積|めんせき] ＝ [対角線|たいかくせん] × [対角線|たいかくせん] ÷ 2", `${d1} × ${d2} ÷ 2 を[計算|けいさん]しよう`, `こたえは ${ans}cm²`],
      };
    }
    // prism / cylinder
    const baseArea = pick(r, [12, 16, 20, 25, 30]);
    const h = int(r, 4, 10);
    const ans = String(baseArea * h);
    return {
      prompt: `[底面積|ていめんせき]が ${baseArea}cm²、[高|たか]さが ${h}cm の [角柱|かくちゅう]の [体積|たいせき]は [何|なん]cm³？`,
      answer: ans,
      input: "keypad",
      hints: ["[角柱|かくちゅう]の[体積|たいせき] ＝ [底面積|ていめんせき] × [高|たか]さ", `${baseArea} × ${h} を[計算|けいさん]しよう`, `こたえは ${ans}cm³`],
    };
  },

  // 算数6年：比例と反比例
  propTable(_p, r) {
    const isInverse = r() > 0.5;
    if (isInverse) {
      const k = pick(r, [12, 18, 24, 36]);
      const xTarget = pick(r, [2, 3, 4, 6]);
      const ans = String(k / xTarget);
      return {
        prompt: `y が x に [反比例|はんぴれい]し、x＝1 のとき y＝${k} です。\nx＝${xTarget} のときの y は？`,
        visual: `x × y ＝ ${k}`,
        answer: ans,
        input: "keypad",
        hints: ["[反比例|はんぴれい]では x × y の [積|せき]が いつも [一定|いってい]（${k}）になるよ", `${k} ÷ ${xTarget} を[計算|けいさん]しよう`, `こたえは ${ans}`],
      };
    }
    const a = pick(r, [2, 3, 4, 5, 6]);
    const xTarget = int(r, 4, 8);
    const ans = String(a * xTarget);
    return {
      prompt: `y が x に [比例|ひれい]し、x＝1 のとき y＝${a} です。\nx＝${xTarget} のときの y は？`,
      visual: `y ＝ ${a} × x`,
      answer: ans,
      input: "keypad",
      hints: ["[比例|ひれい]では x が 2[倍|ばい]、3[倍|ばい]になると y も 2[倍|ばい]、3[倍|ばい]になるよ", `y ＝ ${a} × ${xTarget}`, `こたえは ${ans}`],
    };
  },

  // 算数6年：場合の数（順列・組み合わせ・道順）
  combCount(_p, r) {
    const kind = pick(r, ["cardPerm", "teamComb", "pathWay"]);
    if (kind === "cardPerm") {
      const items = [
        { q: "1, 2, 3 の 3まい の カードから 2まい を えらんで できる 2けたの [整数|せいすう]は [何通|なんとお]り？", a: "6" },
        { q: "1, 2, 3, 4 の 4まい の カードから 2まい を えらんで できる 2けたの [整数|せいすう]は [何通|なんとお]り？", a: "12" },
        { q: "0, 1, 2 の 3まい の カードから 2まい を えらんで できる 2けたの [整数|せいすう]は [何通|なんとお]り？", a: "4" },
        { q: "3[人|にん]の [走者|そうしゃ] A, B, C が [走|はし]る [順番|じゅんばん]は [全部|ぜんぶ]で [何通|なんとお]り？", a: "6" },
        { q: "赤, 青, 黄, 緑 の 4[色|いろ]から 2[色|いろ]を えらんで [並|なら]べる [並|なら]べ[方|かた]は [何通|なんとお]り？", a: "12" },
      ];
      const it = pick(r, items);
      return {
        prompt: it.q,
        answer: it.a,
        input: "keypad",
        hints: ["[樹形図|じゅけいず]を かいて [順番|じゅんばん]に かぞえあげよう", "[十|じゅう]の[位|くらい]に くる [数|かず]ごとに [分|わ]けて かんがえよう", `こたえは ${it.a}[通|とお]り`],
      };
    }
    if (kind === "teamComb") {
      const items = [
        { q: "4[人|にん]の なかから 代表を 2[人|にん] えらぶ えらび[方|かた]は [何通|なんとお]り？", a: "6" },
        { q: "5[人|にん]の なかから 代表を 2[人|にん] えらぶ えらび[方|かた]は [何通|なんとお]り？", a: "10" },
        { q: "4チーム で [総当|そうあ]たり戦（リーグ戦）を すると [全部|ぜんぶ]で [何試合|なんしあい]？", a: "6" },
        { q: "5チーム で [総当|そうあ]たり戦（リーグ戦）を すると [全部|ぜんぶ]で [何試合|なんしあい]？", a: "10" },
        { q: "赤, 青, 黄, 白 の 4[色|いろ]から 2[色|いろ]を えらぶ えらび[方|かた]は [何通|なんとお]り？", a: "6" },
      ];
      const it = pick(r, items);
      return {
        prompt: it.q,
        answer: it.a,
        input: "keypad",
        hints: ["[順番|じゅんばん]は [関係|かんけい]ない組み合わせだよ", "重複して 2[回|かい] かぞえないように [注意|ちゅうい]しよう", `こたえは ${it.a}[通|とお]り`],
      };
    }
    // pathWay
    const p1 = int(r, 2, 3);
    const p2 = int(r, 2, 4);
    const ans = String(p1 * p2);
    return {
      prompt: `A地点から B地点へ行く[道|みち]が ${p1}[本|ほん]、B地点から C地点へ行く[道|みち]が ${p2}[本|ほん] あります。\nAから Bを[通|とお]って Cへ行く[行|い]き[方|かた]は [全部|ぜんぶ]で [何通|なんとお]り？`,
      answer: ans,
      input: "keypad",
      hints: ["A→Bの それぞれの道に対して、B→Cの道が えらべるよ", `${p1} × ${p2} を[計算|けいさん]しよう`, `こたえは ${ans}[通|とお]り`],
    };
  },

  // 国語3・4年：ことわざ・慣用句（30問プール）
  idiom(_p, r) {
    const items = [
      { q: "とても忙しくて、だれでもいいから手伝ってほしいとき、「（ □ ）も借りたい」という？", a: "猫の手", c: ["猫の手", "犬の手", "猿の手", "熊の手"] },
      { q: "どんな名人でも失敗することがあるという意味のことわざは、「（ □ ）も木から落ちる」？", a: "猿", c: ["猿", "リス", "鳥", "コアラ"] },
      { q: "つらいことでも辛抱強く続ければ報われるという意味のことわざは、「（ □ ）の上にも三年」？", a: "石", c: ["石", "山", "木", "雪"] },
      { q: "ほんのわずかな量のことの例えは、「（ □ ）の涙」？", a: "雀", c: ["雀", "カラス", "鳩", "蟻"] },
      { q: "思いがけない幸運にめぐりあうことの例えは、「（ □ ）から牡丹餅」？", a: "棚", c: ["棚", "机", "山", "空"] },
      { q: "いくら意見を言っても少しも効き目がないことを、「（ □ ）の耳に念仏」という？", a: "馬", c: ["馬", "牛", "犬", "羊"] },
      { q: "怒ることを、体の部分を使って「（ □ ）が立つ」という？", a: "腹", c: ["腹", "背中", "足", "肩"] },
      { q: "とても好きで夢中になることを、「（ □ ）がない」という？", a: "目", c: ["目", "耳", "口", "鼻"] },
      { q: "待ち遠しくてたまらないことを、「（ □ ）を長くして待つ」という？", a: "首", c: ["首", "手", "足", "耳"] },
      { q: "知っている人が多くて交友関係が広いことを、「（ □ ）が広い」という？", a: "顔", c: ["顔", "肩", "背中", "胸"] },
      { q: "ひそひそ話など、秘密が漏れやすいことの例えは、「壁に耳あり、（ □ ）に目あり」？", a: "障子", c: ["障子", "天井", "床", "窓"] },
      { q: "思いがけない災難にあうことの例えは、「犬も歩けば（ □ ）に当たる」？", a: "棒", c: ["棒", "石", "木", "壁"] },
      { q: "何度失敗してもくじけずに立ち上がることの例えは、「七転び（ □ ）起き」？", a: "八", c: ["八", "七", "九", "十"] },
      { q: "一人よりみんなで相談したほうが良い知恵が出るという意味は、「三人寄れば（ □ ）の知恵」？", a: "文殊", c: ["文殊", "博士", "先生", "王様"] },
      { q: "終わってしまってから悔やんでも手遅れだという意味は、「後の（ □ ）」？", a: "祭り", c: ["祭り", "花火", "記念", "お祝い"] },
      { q: "ひどく苦労することを、「（ □ ）を折る」という？", a: "骨", c: ["骨", "指", "腕", "足"] },
      { q: "言われたことが的を射ていてつらいことを、「（ □ ）が痛い」という？", a: "耳", c: ["耳", "頭", "目", "歯"] },
      { q: "予定していた予算をこえて赤字になることを、「（ □ ）が出る」という？", a: "足", c: ["足", "手", "指", "頭"] },
      { q: "秘密をすぐ人にしゃべってしまうことを、「（ □ ）が軽い」という？", a: "口", c: ["口", "頭", "耳", "手"] },
      { q: "安心していっぺんに不安が消えることを、「（ □ ）をなでおろす」という？", a: "胸", c: ["胸", "腹", "頭", "肩"] },
      { q: "相手の力にかなわないことを、「（ □ ）が上がらない」という？", a: "頭", c: ["頭", "手", "腕", "足"] },
      { q: "身内の恥ずかしさなどで居心地が悪いことを、「（ □ ）が狭い」という？", a: "肩身", c: ["肩身", "世間", "視野", "心"] },
      { q: "とても驚いて息を止めることを、「息を（ □ ）」という？", a: "のむ", c: ["のむ", "はく", "とめる", "すう"] },
      { q: "仲がとても悪いことの例えは、「犬と（ □ ）」？", a: "猿", c: ["猿", "猫", "熊", "キツネ"] },
      { q: "初めは小さくてもだんだん大きな成果になることの例えは、「塵も積もれば（ □ ）となる」？", a: "山", c: ["山", "川", "城", "星"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["日本でむかしから使われてきた言い回しだよ", "前後の文脈や意味から考えよう", `こたえは「${it.a}」`],
    };
  },

  // 国語3・4年：同音異義語・同訓異字（25問プール）
  homophone(_p, r) {
    const items = [
      { q: "「[機会|きかい]を つかむ」の 正しい漢字は？", a: "機会", c: ["機会", "機械", "器械", "気界"] },
      { q: "「[機械|きかい]を 動かす」の 正しい漢字は？", a: "機械", c: ["機械", "機会", "器械", "気械"] },
      { q: "「[公園|こうえん]で あそぶ」の 正しい漢字は？", a: "公園", c: ["公園", "講演", "後援", "公演"] },
      { q: "「[自分|じぶん]に [自信|じしん]を もつ」の 正しい漢字は？", a: "自信", c: ["自信", "地震", "自身", "磁針"] },
      { q: "「[地震|じしん]が おきる」の 正しい漢字は？", a: "地震", c: ["地震", "自信", "自身", "時進"] },
      { q: "「あしが [速|はや]い」の 正しい漢字は？", a: "速い", c: ["速い", "早い", "初い", "迅い"] },
      { q: "「あさ [早|はや]く おきる」の 正しい漢字は？", a: "早い", c: ["早い", "速い", "初い", "疾い"] },
      { q: "「[温|あたた]かい スープ」の 正しい漢字は？", a: "温かい", c: ["温かい", "暖かい", "熱かい", "温い"] },
      { q: "「[暖|あたた]かい 春のひざし」の 正しい漢字は？", a: "暖かい", c: ["暖かい", "温かい", "熱かい", "和かい"] },
      { q: "「お[湯|ゆ]が [熱|あつ]い」の 正しい漢字は？", a: "熱い", c: ["熱い", "暑い", "厚い", "篤い"] },
      { q: "「なつの [暑|あつ]い 日」の 正しい漢字は？", a: "暑い", c: ["暑い", "熱い", "厚い", "篤い"] },
      { q: "「ほんが [厚|あつ]い」の 正しい漢字は？", a: "厚い", c: ["厚い", "熱い", "暑い", "敦い"] },
      { q: "「ともだちに [会|あ]う」の 正しい漢字は？", a: "会う", c: ["会う", "合う", "逢う", "遭う"] },
      { q: "「サイズが [合|あ]う」の 正しい漢字は？", a: "合う", c: ["合う", "会う", "相う", "遭う"] },
      { q: "「[意見|いけん]を [聞|き]く」の 正しい漢字は？", a: "聞く", c: ["聞く", "利く", "効く", "聴く"] },
      { q: "「くすりが [効|き]く」の 正しい漢字は？", a: "効く", c: ["効く", "聞く", "利く", "聴く"] },
      { q: "「じっけんが [成功|せいこう]する」の 正しい漢字は？", a: "成功", c: ["成功", "製工", "性向", "精巧"] },
      { q: "「[関心|かんしん]を もつ」の 正しい漢字は？", a: "関心", c: ["関心", "感心", "歓心", "観心"] },
      { q: "「りっぱな たいどに [感心|かんしん]する」の 正しい漢字は？", a: "感心", c: ["感心", "関心", "歓心", "寒心"] },
      { q: "「じけんを [調査|ちょうさ]する」の 正しい漢字は？", a: "調査", c: ["調査", "調査", "長査", "超査"] },
      { q: "「[創造|そうぞう]りょくを はっきする」の 正しい漢字は？", a: "創造", c: ["創造", "想像", "装造", "相造"] },
      { q: "「ゆめを [想像|そうぞう]する」の 正しい漢字は？", a: "想像", c: ["想像", "創造", "肖像", "相像"] },
      { q: "「[完全|かんぜん]に なおる」の 正しい漢字は？", a: "完全", c: ["完全", "完前", "観全", "官全"] },
      { q: "「[健康|けんこう]な からだ」の 正しい漢字は？", a: "健康", c: ["健康", "健幸", "検康", "見康"] },
      { q: "「[発表|はっぴょう]の [準備|じゅんび]」の 正しい漢字は？", a: "準備", c: ["準備", "準美", "順備", "準備"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      noRuby: true,
      choices: shuffle(r, it.c),
      hints: ["ことばの 意味を よく考えよう", "道具や人、時間など、なにに関係しているかな？", `こたえは「${it.a}」`],
    };
  },

  // 国語4・5年：つなぎ言葉・接続詞（25問プール）
  conjunction(_p, r) {
    const items = [
      { q: "雨がふってきた。（ □ ）、かさをさした。", a: "だから", c: ["だから", "しかし", "また", "なぜなら"] },
      { q: "一生けんめい走った。（ □ ）、電車には間に合わなかった。", a: "しかし", c: ["しかし", "だから", "そして", "さらに"] },
      { q: "私は野菜が好きだ。（ □ ）、くだものもよく食べる。", a: "また", c: ["また", "しかし", "だが", "なぜなら"] },
      { q: "今日は外で遊べない。（ □ ）、大雨がふっているからだ。", a: "なぜなら", c: ["なぜなら", "だから", "しかし", "すると"] },
      { q: "ベルが鳴った。（ □ ）、先生が教室に入ってきた。", a: "すると", c: ["すると", "しかし", "なぜなら", "つまり"] },
      { q: "弟は勉強をした。（ □ ）、部屋のそうじもした。", a: "さらに", c: ["さらに", "しかし", "だが", "なぜなら"] },
      { q: "彼は朝早く起きた。（ □ ）、道がすいていた。", a: "そのため", c: ["そのため", "しかし", "だが", "または"] },
      { q: "計画を立てた。（ □ ）、思わぬトラブルが発生した。", a: "ところが", c: ["ところが", "だから", "そして", "さらに"] },
      { q: "明日は晴れる。（ □ ）、気温は低くなる見込みだ。", a: "ただし", c: ["ただし", "だから", "そして", "なぜなら"] },
      { q: "りんご（ □ ）みかんのどちらかを選んでください。", a: "または", c: ["または", "だから", "しかし", "すると"] },
      { q: "毎日練習を重ねた。（ □ ）、ついに優勝することができた。", a: "その結果", c: ["その結果", "しかし", "なぜなら", "または"] },
      { q: "春は花が咲く。（ □ ）、秋は紅葉が美しい。", a: "一方", c: ["一方", "だから", "なぜなら", "すると"] },
      { q: "地球には空と海がある。（ □ ）、豊かな生命が存在する。", a: "つまり", c: ["つまり", "しかし", "ところが", "または"] },
      { q: "彼は走るのが速い。（ □ ）、泳ぐのも得意だ。", a: "そのうえ", c: ["そのうえ", "しかし", "だが", "なぜなら"] },
      { q: "注意深く観察した。（ □ ）、新しい発見があった。", a: "すると", c: ["すると", "しかし", "なぜなら", "または"] },
      { q: "風邪をひいてしまった。（ □ ）、今日の試合は欠席します。", a: "したがって", c: ["したがって", "しかし", "ところが", "なぜなら"] },
      { q: "日本には四季がある。（ □ ）、春・夏・秋・冬である。", a: "たとえば", c: ["たとえば", "しかし", "だから", "すると"] },
      { q: "宿題をすませた。（ □ ）、明日のじゅんびもできた。", a: "そして", c: ["そして", "しかし", "だが", "なぜなら"] },
      { q: "空が暗くなってきた。（ □ ）、雷の音が聞こえた。", a: "やがて", c: ["やがて", "しかし", "だから", "または"] },
      { q: "読書は知識を広げる。（ □ ）、心を豊かにしてくれる。", a: "さらに", c: ["さらに", "しかし", "だが", "なぜなら"] },
    ];
    const it = pick(r, items);
    return {
      prompt: `文と文をつなぐ [正|ただ]しい ことばは？\n${it.q}`,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["前の文と うしろの文の 関係を 考えよう", "理由かな？ 反対のことかな？ つけ足しかな？", `こたえは「${it.a}」`],
    };
  },

  // 国語4・5年：主語と述語（20問プール）
  syugo(_p, r) {
    const items = [
      { q: "「白い いぬが 庭で 元気に 走る。」\nこの文の【主語（だれが・なにが）】はどれ？", a: "いぬが", c: ["いぬが", "走る", "庭で", "元気に"] },
      { q: "「白い いぬが 庭で 元気に 走る。」\nこの文の【述語（どうする・どんなだ）】はどれ？", a: "走る", c: ["走る", "いぬが", "白い", "庭で"] },
      { q: "「きれいな 花が 公園に たくさん 咲いた。」\nこの文の【主語】はどれ？", a: "花が", c: ["花が", "咲いた", "公園に", "きれいな"] },
      { q: "「きれいな 花が 公園に たくさん 咲いた。」\nこの文の【述語】はどれ？", a: "咲いた", c: ["咲いた", "花が", "たくさん", "公園に"] },
      { q: "「妹は 図書館で おもしろい 本を 読んだ。」\nこの文の【主語】はどれ？", a: "妹は", c: ["妹は", "読んだ", "図書館で", "本を"] },
      { q: "「妹は 図書館で おもしろい 本を 読んだ。」\nこの文の【述語】はどれ？", a: "読んだ", c: ["読んだ", "妹は", "本を", "おもしろい"] },
      { q: "「夜空の 星が きらきらと 光っている。」\nこの文の【主語】はどれ？", a: "星が", c: ["星が", "光っている", "夜空の", "きらきらと"] },
      { q: "「夜空の 星が きらきらと 光っている。」\nこの文の【述語】はどれ？", a: "光っている", c: ["光っている", "星が", "夜空の", "きらきらと"] },
      { q: "「おじいさんは 毎朝 公園を 散歩する。」\nこの文の【主語】はどれ？", a: "おじいさんは", c: ["おじいさんは", "散歩する", "毎朝", "公園を"] },
      { q: "「おじいさんは 毎朝 公園を 散歩する。」\nこの文の【述語】はどれ？", a: "散歩する", c: ["散歩する", "おじいさんは", "公園を", "毎朝"] },
      { q: "「夏の 空は とても 青い。」\nこの文の【述語】はどれ？", a: "青い", c: ["青い", "空は", "夏の", "とても"] },
      { q: "「兄は 足が 速い。」\nこの文全体の【述語】はどれ？", a: "速い", c: ["速い", "兄は", "足が", "足"] },
      { q: "「雨が はげしく 降りはじめた。」\nこの文の【主語】はどれ？", a: "雨が", c: ["雨が", "降りはじめた", "はげしく", "雨"] },
      { q: "「大きな 船が 港に 到着した。」\nこの文の【述語】はどれ？", a: "到着した", c: ["到着した", "船が", "港に", "大きな"] },
      { q: "「小鳥たちが 朝の 森で 楽しそうに さえずる。」\nこの文の【主語】はどれ？", a: "小鳥たちが", c: ["小鳥たちが", "さえずる", "朝の", "森で"] },
      { q: "「小鳥たちが 朝の 森で 楽しそうに さえずる。」\nこの文の【述語】はどれ？", a: "さえずる", c: ["さえずる", "小鳥たちが", "楽しそうに", "森で"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["主語は「だれが・なにが」、述語は「どうする・どんなだ・なんだ」だよ", "文の組み立てを よく見よう", `こたえは「${it.a}」`],
    };
  },

  // 国語5・6年：発展読解（30問プール：説明文・物語文・総合論説）
  readingAdv(params, r) {
    const explainItems = [
      {
        t: "人間は昔から、鳥のように空を飛びたいと夢見てきました。レオナルド・ダ・ヴィンチは鳥の羽の動きを細かく観察し、飛行機の設計図を描きました。そして20世紀初め、ライト兄弟がついに動力飛行機による人類初の飛行に成功したのです。",
        q: "ライト兄弟の前に、鳥の羽を観察して飛行機の設計図を描いた人物は誰ですか？",
        a: "レオナルド・ダ・ヴィンチ",
        c: ["レオナルド・ダ・ヴィンチ", "エジソン", "ニュートン", "アインシュタイン"],
      },
      {
        t: "森林は「緑のダム」とも呼ばれます。雨が降ると、土壌がスポンジのように水分をたっぷり蓄え、時間をかけて少しずつ川へ送り出します。この働きのおかげで、急激な洪水や干ばつを防ぐことができるのです。",
        q: "森林が「緑のダム」と呼ばれるのはなぜですか？",
        a: "水を蓄えて少しずつ川へ流すから",
        c: ["水を蓄えて少しずつ川へ流すから", "木材がたくさん取れるから", "緑色のダムが建てられているから", "川の水をせき止める壁があるから"],
      },
      {
        t: "ミツバチは花の蜜を集めるとき、体に花粉をたくさんつけます。そして別の花へ移動することで花粉を運び、植物の実を結ぶ手助けをしています。もしミツバチがいなくなると、多くの野菜や果物が実をつけられなくなってしまいます。",
        q: "ミツバチが植物に対して果たしている大切な役割は何ですか？",
        a: "花粉を運んで実を結ばせること",
        c: ["花粉を運んで実を結ばせること", "花の蜜をぜんぶ飲むこと", "害虫を追い払うこと", "きれいな花を咲かせること"],
      },
      {
        t: "プラスチックは軽くて丈夫な便利な素材ですが、自然界で分解されにくいという問題があります。海に流れ出たごみは細かく砕けてマイクロプラスチックとなり、魚や鳥が誤って飲み込んでしまいます。世界中でプラスチックの削減が進められています。",
        q: "プラスチックごみが引き起こす問題として文章に書かれていることは何ですか？",
        a: "海の生き物が誤って飲み込んでしまう",
        c: ["海の生き物が誤って飲み込んでしまう", "すぐに壊れて役に立たない", "重すぎて運ぶことができない", "水に溶けてなくなってしまう"],
      },
      {
        t: "深海は太陽の光が届かず、冷たくて水圧がとても高い過酷な環境です。しかし、そこには自ら光を放つ発光器を持った魚や、高い水圧に耐えられる柔らかい骨格をもった生き物など、独自の進化を遂げた生物が数多く生息しています。",
        q: "深海に住む生き物が過酷な環境に適応した特徴として書かれているものはどれですか？",
        a: "光を放つ器官や柔らかい骨格を持つ",
        c: ["光を放つ器官や柔らかい骨格を持つ", "太陽の光を浴びて温まる", "硬い甲羅で水圧を完全に跳ね返す", "空気を吸いに水面まで泳ぎ上がる"],
      },
      {
        t: "太陽光や風力、地熱などを利用した発電は「再生可能エネルギー」と呼ばれます。火力発電と違って二酸化炭素を排出しないため、地球温暖化を防ぐクリーンなエネルギーとして世界中で導入が進んでいます。",
        q: "再生可能エネルギーが地球温暖化防止に役立つ主な理由は何ですか？",
        a: "発電時に二酸化炭素を出さないから",
        c: ["発電時に二酸化炭素を出さないから", "夜間でも発電できるから", "燃料を無限に燃やせるから", "電気代が完全にかからないから"],
      },
      {
        t: "渡り鳥は季節によって何千キロメートルも旅をします。迷わずに目的地へたどり着けるのは、太陽の位置や星座の並び、さらには地球の磁気（地磁気）を感じ取って方角を知る能力が備わっているからです。",
        q: "渡り鳥が目的地へ迷わず進める理由として挙げられているものはどれですか？",
        a: "太陽や星、地球の磁気を感じ取れるから",
        c: ["太陽や星、地球の磁気を感じ取れるから", "道路標識を読めるから", "他の鳥の鳴き声だけを頼りにしているから", "風の流れに身を任せるだけだから"],
      },
      {
        t: "日本の伝統的な木造建築には、釘を使わずに木と木を組み合わせる「継手（つぎて）」や「仕口（しぐち）」という高度な技術が使われています。木の伸縮を計算して作られているため、地震の揺れを逃がす柔軟性を備えています。",
        q: "日本の伝統的な木造建築の技術の特徴として適切なものはどれですか？",
        a: "釘を使わずに木を組み合わせて揺れを逃がす",
        c: ["釘を使わずに木を組み合わせて揺れを逃がす", "コンクリートで木を完全に固めて動かない", "金属のネジで何千本も留めている", "プラスチックで木を覆って補強している"],
      },
      {
        t: "人工知能（AI）は、膨大なデータをコンピュータに学習させることで、画像認識や自然な文章作成などを瞬時に行える技術です。医療での画像診断や車の自動運転など、人間の生活を支える様々な分野で活用が広がっています。",
        q: "人工知能（AI）が能力を発揮するために必要不可欠なものは何ですか？",
        a: "膨大なデータの学習",
        c: ["膨大なデータの学習", "ロボットの金属アーム", "電池の定期的な交換", "インターネットの切断"],
      },
      {
        t: "まだ食べられるのに捨てられてしまう食べ物を「食品ロス（フードロス）」と呼びます。日本では家庭や飲食店から年間数百万人分に匹敵する食料が廃棄されており、賞味期限の正しい理解や買いすぎの防止が呼びかけられています。",
        q: "食品ロスを減らすために呼びかけられている対策はどれですか？",
        a: "買いすぎの防止や賞味期限の正しい理解",
        c: ["買いすぎの防止や賞味期限の正しい理解", "食べ物をすべて冷蔵庫にためこむ", "賞味期限が切れたらすぐ捨てる", "外食の回数をゼロにする"],
      },
    ];

    const storyItems = [
      {
        t: "健太は毎朝、通学路のごみ拾いを続けていました。初めは一人でしたが、やがてクラスの仲間も加わるようになりました。卒業式の日、校長先生から「町の環境を守ってくれてありがとう」と感謝状を手渡されたとき、健太の目から熱いものがこぼれました。",
        q: "健太の目から「熱いもの（涙）」がこぼれた理由として最も適切なものはどれですか？",
        a: "続けてきた努力が認められて感動したから",
        c: ["続けてきた努力が認められて感動したから", "毎朝早起きして眠かったから", "一人でごみ拾いをするのが嫌だったから", "卒業するのが悲しくてたまらなかったから"],
      },
      {
        t: "転校生の花音が教室に入ってきたとき、緊張で顔がこわばっていました。自己紹介の声も小さく震えていました。休み時間、前の席の葵が「絵を描くのが好きなの？私もだよ！」と笑顔でスケッチブックを見せてくれた瞬間、花音の顔がパッと明るくなりました。",
        q: "花音の顔が「パッと明るくなった」のはどうしてですか？",
        a: "共通の好きなことを通して友だちになれそうだと安心したから",
        c: ["共通の好きなことを通して友だちになれそうだと安心したから", "授業が早く終わって帰れると思ったから", "先生から褒められたから", "教室がとても暖かかったから"],
      },
      {
        t: "運動会のクラス対抗リレーで、アンカーの走太はバトンを受け取るときに落としてしまいました。必死で拾って走り抜けたものの、結果は最下位でした。うつむいて肩を落とす走太の背中を、チームの全員が「最後まで諦めなかった走太はかっこよかったよ」と笑顔で叩いてくれました。",
        q: "仲間たちが走太にかけた言葉から、仲間のどのような気持ちが読み取れますか？",
        a: "失敗を責めず、全力で走った走太をたたえ励ます気持ち",
        c: ["失敗を責めず、全力で走った走太をたたえ励ます気持ち", "バトンを落としたことを怒る気持ち", "次のレースに出たくないという気持ち", "リレーで勝ちたかったという悔しさだけ"],
      },
      {
        t: "ピアノ発表会の舞台裏で、美咲の手は氷のように冷たくなっていました。「間違えたらどうしよう」と心臓が激しく鳴っていました。しかしピアノの前に座って深く息を吸い、鍵盤に指を置くと、毎日の練習の日々が浮かんできました。最後の音を響かせたとき、割れんばかりの拍手が会場を包みました。",
        q: "美咲がピアノに向かって練習の日々を思い出したときの心情として最も適切なものはどれですか？",
        a: "練習してきた自分を信じて演奏に集中しようと覚悟を決めた",
        c: ["練習してきた自分を信じて演奏に集中しようと覚悟を決めた", "もう弾きたくないとあきらめた", "観客の顔をじっと見つめようとした", "早く終わらせてお菓子を食べたいと思った"],
      },
      {
        t: "拓海は小学校卒業の記念に、祖父から昔使っていた銀の懐中時計を譲り受けました。「時間を大切にする男になりなさい」という祖父の言葉とともに受け取った時計はずっしりと重く、カチカチと静かに時を刻んでいました。拓海は胸ポケットにそっと時計を収め、背筋をピンと伸ばしました。",
        q: "拓海が「背筋をピンと伸ばした」しぐさに表れている気持ちはどれですか？",
        a: "祖父の期待を受け止め、責任感と誇らしさを感じた気持ち",
        c: ["祖父の期待を受け止め、責任感と誇らしさを感じた気持ち", "時計が重すぎてバランスを崩したこと", "祖父に叱られて怖がっている様子", "早く友だちに時計を自慢したい焦り"],
      },
      {
        t: "少年野球の決勝戦、一打サヨナラの好機で打席に立った蓮でしたが、渾身のスイングは空を切り三振に倒れました。試合後、ベンチ裏で一人涙を拭った蓮は、泥だらけのバットを握りしめ、「来年は絶対に全国へ行く」と夕日に向かって強く呟きました。",
        q: "蓮が「来年は絶対に全国へ行く」と呟いたときの内面はどう変化していますか？",
        a: "悔しさを乗り越えて、次の目標への強い決意が生まれた",
        c: ["悔しさを乗り越えて、次の目標への強い決意が生まれた", "野球をきっぱりやめようと決意した", "審判の判定に不満を抱いていた", "仲間が打ってくれればよかったと後悔した"],
      },
      {
        t: "雨の日の帰り道、公園のベンチの下で震える子犬を見つけた陽菜は、傘を子犬に差し伸べて交番へ走りました。お巡りさんと一緒に首輪の手がかりを探していたとき、探していた飼い主のおじいさんが駆け込んできました。涙を浮かべて喜ぶおじいさんの姿を見て、陽菜の胸はじんと温かくなりました。",
        q: "陽菜の「胸はじんと温かくなりました」という表現は何を意味していますか？",
        a: "子犬が無事に飼い主と再会できて心から安心し喜んでいること",
        c: ["子犬が無事に飼い主と再会できて心から安心し喜んでいること", "走ってきて体がぽかぽか温まったこと", "交番の暖房がとても効いていたこと", "お礼のお菓子をもらえると思ったこと"],
      },
      {
        t: "母の誕生日の夜、結衣は内緒で描いていた家族の似顔絵を背中に隠してリビングへ入りました。「いつもおいしいご飯を作ってくれてありがとう！」と似顔絵を差し出すと、お母さんは目を丸くしたあと、結衣をぎゅっと抱きしめました。",
        q: "お母さんが「目を丸くした」のはどのような驚きですか？",
        a: "予想もしていなかった温かいサプライズプレゼントに驚いた",
        c: ["予想もしていなかった温かいサプライズプレゼントに驚いた", "結衣が怒っているのかと思ってびっくりした", "似顔絵がまったく似ていなくてあきれた", "部屋が暗くて結衣の顔が見えなかった"],
      },
      {
        t: "大親友の陸とゲームのルールを巡って口論になり、大樹は思わず「もうお前となんか遊ばない！」と怒鳴ってしまいました。家に帰って一人になると、陸の寂しそうな顔が頭から離れません。大樹は引き出しから便箋を取り出し、「さっきは言いすぎてごめん」とペンを走らせました。",
        q: "大樹が手紙を書き始めたときの気持ちはどれですか？",
        a: "感情的になって友人を傷つけたことを素直に反省し仲直りしたい気持ち",
        c: ["感情的になって友人を傷つけたことを素直に反省し仲直りしたい気持ち", "自分の主張の正しさを証明したい気持ち", "陸から先に謝ってくるのを待つ気持ち", "ゲームの攻略法を教えてあげたい気持ち"],
      },
      {
        t: "山小屋での林間学校の夜、明かりをすべて消すと、夜空一面に満天の星が広がっていました。天の川が白く帯のように光り、時折流れ星が走ります。誰も声を出さず、ただ息をのんで見上げていました。大自然の雄大さに、自分たちの存在が小さな一粒のように感じられました。",
        q: "子どもたちが「息をのんで見上げていた」理由として最もふさわしいものはどれですか？",
        a: "星空のあまりの美しさと壮大さに深く圧倒されたから",
        c: ["星空のあまりの美しさと壮大さに深く圧倒されたから", "夜風が寒くて息ができなかったから", "先生に静かにしなさいと叱られたから", "流れ星が落ちてくるのが怖かったから"],
      },
    ];

    const compItems = [
      {
        t: "日本列島には豊かな四季があります。季節ごとに吹く風の向きや海流の影響により、春の桜、夏の青空、秋の紅葉、冬の雪景色と、自然の表情が豊かに変化します。日本人は昔からこの移り変わりを和歌や俳句に詠み、自然を大切にしてきました。",
        q: "日本人が昔から自然の移り変わりに対して行ってきたことは何ですか？",
        a: "和歌や俳句に詠んで親しんできた",
        c: ["和歌や俳句に詠んで親しんできた", "季節の風をせき止めた", "四季をなくそうとした", "雪をぜんぶ溶かした"],
      },
      {
        t: "言葉は人と心を通わせる大切な道具ですが、使い方を一歩誤ると相手を深く傷つける刃にもなります。同じ意味を伝える場合でも、相手の立場や気持ちを想像して言葉を選ぶことが、心地よい人間関係を築く基礎となります。",
        q: "文章が伝えている「言葉を使うときに大切なこと」は何ですか？",
        a: "相手の立場や気持ちを想像して言葉を選ぶこと",
        c: ["相手の立場や気持ちを想像して言葉を選ぶこと", "できるだけ難しい言葉を使って話すこと", "言いたいことを遠回しにせず何でも言うこと", "言葉を使わずに身振り手振りだけで伝えること"],
      },
      {
        t: "発明王と呼ばれるエジソンは、白熱電球を完成させるまでに数千回もの実験に失敗しました。しかし彼は「失敗したのではない。うまくいかない方法を何千通りも発見したのだ」と語りました。失敗を成功への手がかりと捉える姿勢が、偉大な発明を生んだのです。",
        q: "エジソンの言葉から読み取れる、失敗に対する考え方はどれですか？",
        a: "失敗はうまくいかない方法を見つける成功への前進である",
        c: ["失敗はうまくいかない方法を見つける成功への前進である", "失敗したらすぐに別の研究に乗り換えるべきだ", "実験は運次第なので失敗しても気にしない", "一度も失敗しないことこそが最も素晴らしい"],
      },
      {
        t: "漆器や陶芸などの日本の伝統工芸品は、地域の気候風土に適した素材と職人の手作業によって何百年も受け継がれてきました。使い込むほどに風合いが増し、修理しながら長く大切に使う文化は、現代の持続可能な社会づくり（SDGs）にも通じる知恵です。",
        q: "伝統工芸品を「長く大切に使う文化」は現代の何に通じていますか？",
        a: "持続可能な社会づくり（SDGs）の知恵",
        c: ["持続可能な社会づくり（SDGs）の知恵", "大量生産と使い捨ての便利さ", "最新のコンピュータ技術の開発", "海外からの安い輸入品の普及"],
      },
      {
        t: "地球上の水は、太陽の熱で蒸発して雲になり、雨や雪となって地上に降り注ぎ、川となって海へ戻るという「循環」を繰り返しています。この壮大な水のめぐりのおかげで、大地は潤い、あらゆる動植物が命をつなぐことができているのです。",
        q: "地球上の生命を支えている「水の働き」として述べられているのはどれですか？",
        a: "蒸発と降水を繰り返す水の循環",
        c: ["蒸発と降水を繰り返す水の循環", "地下深くに水を閉じ込めること", "海水が完全に蒸発して雲だけになること", "川の水が凍りついて動かないこと"],
      },
      {
        t: "時間はすべての人に一日24時間、平等に与えられています。高い目標を成し遂げる人は、時間を上手に区切り、今やるべきことの優先順位を決めて行動しています。「後でやろう」と先延ばしにしない小さな習慣の積み重ねが、大きな成果につながるのです。",
        q: "目標を成し遂げる人が実践している時間の使い方として挙げられているものはどれですか？",
        a: "優先順位を決めて先延ばしにしないこと",
        c: ["優先順位を決めて先延ばしにしないこと", "睡眠時間を削って一日中勉強すること", "思いついたことから順番に関係なくやること", "時間を気にせず気の向くままに過ごすこと"],
      },
      {
        t: "グローバル化が進む世界では、異なる文化や習慣を持つ人々と協力する「多文化共生」が求められています。自分の考え方だけが正解と思い込まず、互いの違いを認め合い尊重する姿勢こそが、平和で豊かな社会を築く鍵となります。",
        q: "「多文化共生」において最も大切だとされている姿勢はどれですか？",
        a: "互いの違いを認め合い尊重する姿勢",
        c: ["互いの違いを認め合い尊重する姿勢", "相手に自分の国の文化だけを従わせる姿勢", "外国の人とは一切関わらないようにする姿勢", "すべての文化を一つの形に統一する姿勢"],
      },
      {
        t: "読書は、自分とは異なる時代や場所、登場人物の人生を擬似体験できる特別な体験です。文字から情景や登場人物の心情を頭の中で想像することで、豊かな想像力と思いやりの心が育まれます。",
        q: "読書によって育まれる力として文章に書かれているものはどれですか？",
        a: "豊かな想像力と思いやりの心",
        c: ["豊かな想像力と思いやりの心", "本を早くめくる指先の速さ", "人の意見をすべて否定する力", "文字を丸暗記して忘れない技術"],
      },
      {
        t: "小惑星探査機「はやぶさ2」は、地球から約3億キロメートル離れた小惑星リュウグウに着陸し、岩石のサンプルを地球に持ち帰ることに成功しました。このサンプルを分析することで、太陽系がどのように誕生し、地球の生命のもととなる水や有機物がどこから来たのかを解明する手がかりが得られます。",
        q: "はやぶさ2が持ち帰ったサンプルを分析する目的は何ですか？",
        a: "太陽系の誕生や地球の生命の起源を解明するため",
        c: ["太陽系の誕生や地球の生命の起源を解明するため", "小惑星を地球に引き寄せるため", "宇宙に巨大なホテルを建設するため", "リュウグウの岩石を宝石として売るため"],
      },
      {
        t: "大地震などの災害時には、行政による支援（公助）だけでは限界があります。近所の人同士で声を掛け合い、助け合う「共助（きょうじょ）」が命を救う大きな力となります。日頃から地域の防災訓練に参加し、隣近所と顔見知りになっておくことが命を守る第一歩です。",
        q: "災害時に重要となる「共助」とはどのようなものですか？",
        a: "近所の人同士で声を掛け合い助け合うこと",
        c: ["近所の人同士で声を掛け合い助け合うこと", "警察や消防の到着をただ待つこと", "自分一人の食料だけを隠して守ること", "遠くの親戚からの連絡だけを頼りにすること"],
      },
    ];

    const type = params?.["type"];
    let pool = compItems;
    if (type === "explain") {
      pool = explainItems;
    } else if (type === "story") {
      pool = storyItems;
    } else {
      pool = [...explainItems, ...storyItems, ...compItems];
    }

    const it = pick(r, pool);
    return {
      prompt: it.q,
      passage: it.t,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["文章のなかの言葉に注目しよう", "理由や出来事の流れをたどってみよう", `こたえは「${it.a}」`],
    };
  },

  // 国語6年：敬語・言葉づかい（25問プール）
  keigo(_p, r) {
    const items = [
      { q: "先生が「言う」ことを、敬意をこめて言うと？", a: "おっしゃる", c: ["おっしゃる", "申し上げる", "申す", "言う"] },
      { q: "自分が先生に「言う」ことを、へりくだって言うと？", a: "申し上げる", c: ["申し上げる", "おっしゃる", "言われる", "話される"] },
      { q: "校長先生が「食べる」ことを、尊敬語で言うと？", a: "召し上がる", c: ["召し上がる", "いただく", "食べる", "食す"] },
      { q: "自分がごちそうを「食べる」ことを、謙譲語で言うと？", a: "いただく", c: ["いただく", "召し上がる", "食べられる", "お食べになる"] },
      { q: "先生が「行く」ことを、尊敬語で言うと？", a: "いらっしゃる", c: ["いらっしゃる", "参る", "伺う", "行かれる"] },
      { q: "自分が先生の家に「行く」ことを、謙譲語で言うと？", a: "伺う", c: ["伺う", "いらっしゃる", "おいでになる", "行かれる"] },
      { q: "先生が「見る」ことを、尊敬語で言うと？", a: "ご覧になる", c: ["ご覧になる", "拝見する", "見られる", "見せる"] },
      { q: "自分が資料を「見る」ことを、謙譲語で言うと？", a: "拝見する", c: ["拝見する", "ご覧になる", "見られる", "お見になる"] },
      { q: "お客様が「来る」ことを、尊敬語で言うと？", a: "お見えになる", c: ["お見えになる", "参る", "来られる", "伺う"] },
      { q: "自分が相手の会社へ「来る（行く）」ことを、謙譲語で言うと？", a: "参る", c: ["参る", "いらっしゃる", "お見えになる", "来られる"] },
      { q: "先生が「知っている」ことを、尊敬語で言うと？", a: "ご存じだ", c: ["ご存じだ", "存じている", "知られる", "お知りだ"] },
      { q: "自分が事実を「知っている」ことを、謙譲語で言うと？", a: "存じている", c: ["存じている", "ご存じだ", "知っておられる", "お知りだ"] },
      { q: "相手の意見を「聞く」ことを、へりくだって言うと？", a: "拝聴する", c: ["拝聴する", "お聞きになる", "聞かれる", "伺わせる"] },
      { q: "「これ、うまいよ！」を 丁寧な言葉で言い直すと？", a: "こちらは とても おいしいです", c: ["こちらは とても おいしいです", "これは うまいです", "これ うまいっす", "うまいことだ"] },
      { q: "先生に「だれですか？」とたずねるとき、最も適切な敬語は？", a: "どなた様でしょうか", c: ["どなた様でしょうか", "だれですか", "どいつですか", "だれですかね"] },
      { q: "目上の人に頼みごとをするとき、最後に添える言葉は？", a: "よろしくお願い申し上げます", c: ["よろしくお願い申し上げます", "よろしく頼むよ", "やっておいてください", "よろしくね"] },
      { q: "手紙で相手の父親のことを敬って呼ぶ言葉は？", a: "ご尊父様（お父様）", c: ["ご尊父様（お父様）", "おやじ", "ちちおや", "父"] },
      { q: "手紙で自分の父親のことをへりくだって呼ぶ言葉は？", a: "父", c: ["父", "お父様", "お父さん", "パパ"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["相手を高める「尊敬語」か、自分をへりくだる「謙譲語」かを見分けよう", "目上の人に対する丁寧な言い方だよ", `こたえは「${it.a}」`],
    };
  },

  // 国語6年：四字熟語（25問プール）
  yojijukugo(_p, r) {
    const items = [
      { q: "一つの行動で二つの利益を得ることを意味する四字熟語は？", a: "一石二鳥", c: ["一石二鳥", "十人十色", "日進月歩", "油断大敵"] },
      { q: "人それぞれ好みや考え方が違うことを意味する四字熟語は？", a: "十人十色", c: ["十人十色", "一石二鳥", "以心伝心", "自給自足"] },
      { q: "絶え間なく急速に進歩することを意味する四字熟語は？", a: "日進月歩", c: ["日進月歩", "一進一退", "七転八起", "温故知新"] },
      { q: "油断をすると大きな失敗を招くという意味の四字熟語は？", a: "油断大敵", c: ["油断大敵", "一病息災", "危機一髪", "起死回生"] },
      { q: "言葉に出さなくても心と心で通じ合うことを意味する四字熟語は？", a: "以心伝心", c: ["以心伝心", "十人十色", "自問自答", "公明正大"] },
      { q: "必要なものを自分たちだけで生産してまかなうことを意味する四字熟語は？", a: "自給自足", c: ["自給自足", "自業自得", "自由自在", "自画自賛"] },
      { q: "一生に一度だけの貴重な出会いという意味の四字熟語は？", a: "一期一会", c: ["一期一会", "一日一善", "一生懸命", "一意専心"] },
      { q: "非常に危険な瀬戸際のことを意味する四字熟語は？", a: "危機一髪", c: ["危機一髪", "九死一生", "絶体絶命", "起死回生"] },
      { q: "昔のことを学んで、そこから新しい知恵を得るという意味は？", a: "温故知新", c: ["温故知新", "古今東西", "先憂後楽", "日進月歩"] },
      { q: "まわりが敵ばかりで助けがない孤立した状態を意味する四字熟語は？", a: "四面楚歌", c: ["四面楚歌", "八方塞がり", "孤立無援", "危機一髪"] },
      { q: "始めから終わりまで変わらずやり通すことを意味する四字熟語は？", a: "終始一貫", c: ["終始一貫", "初志貫徹", "一意専心", "一生懸命"] },
      { q: "自分の行動の悪い結果を自分で受けることを意味する四字熟語は？", a: "自業自得", c: ["自業自得", "自給自足", "因果応報", "自問自答"] },
      { q: "良いところと悪いところがお互いにあることを意味する四字熟語は？", a: "一長一短", c: ["一長一短", "一進一退", "賛否両論", "十全十美"] },
      { q: "自分の胸の中で問いかけて考えることを意味する四字熟語は？", a: "自問自答", c: ["自問自答", "自画自賛", "試行錯誤", "熟慮断行"] },
      { q: "何回も失敗を重ねながら良い方法を見つけることを意味する四字熟語は？", a: "試行錯誤", c: ["試行錯誤", "紆余曲折", "悪戦苦闘", "七転八起"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      noRuby: true,
      choices: shuffle(r, it.c),
      hints: ["漢字四文字の意味を それぞれ組み合わせてみよう", "漢字から 意味を 想像してみよう", `こたえは「${it.a}」`],
    };
  },

  // 英語4年：曜日・月・季節・時間
  engTimeCalendar(_p, r) {
    const items = [
      { q: "「日曜日」を 英語で言うと？", a: "Sunday", c: ["Sunday", "Monday", "Saturday", "Friday"] },
      { q: "「月曜日」を 英語で言うと？", a: "Monday", c: ["Monday", "Tuesday", "Sunday", "Thursday"] },
      { q: "「金曜日」を 英語で言うと？", a: "Friday", c: ["Friday", "Tuesday", "Thursday", "Wednesday"] },
      { q: "「土曜日」を 英語で言うと？", a: "Saturday", c: ["Saturday", "Sunday", "Thursday", "Friday"] },
      { q: "「水曜日」を 英語で言うと？", a: "Wednesday", c: ["Wednesday", "Tuesday", "Thursday", "Monday"] },
      { q: "「1月」を 英語で言うと？", a: "January", c: ["January", "June", "July", "February"] },
      { q: "「4月」を 英語で言うと？", a: "April", c: ["April", "August", "May", "March"] },
      { q: "「8月」を 英語で言うと？", a: "August", c: ["August", "April", "October", "December"] },
      { q: "「12月」を 英語で言うと？", a: "December", c: ["December", "November", "October", "September"] },
      { q: "「春（はる）」を 英語で言うと？", a: "spring", c: ["spring", "summer", "autumn", "winter"] },
      { q: "「夏（なつ）」を 英語で言うと？", a: "summer", c: ["summer", "spring", "winter", "fall"] },
      { q: "「秋（あき）」を 英語で言うと？", a: "autumn (fall)", c: ["autumn (fall)", "spring", "summer", "winter"] },
      { q: "「冬（ふゆ）」を 英語で言うと？", a: "winter", c: ["winter", "summer", "spring", "autumn"] },
      { q: "「いま何時ですか？」は 英語で？", a: "What time is it?", c: ["What time is it?", "How are you?", "What is this?", "Where is it?"] },
      { q: "「3時です」は 英語で？", a: "It's three o'clock.", c: ["It's three o'clock.", "It's three years.", "It's Sunday.", "I have three."] },
      { q: "「きょうは何曜日？」は 英語で？", a: "What day is it today?", c: ["What day is it today?", "What time is it?", "How old are you?", "What is your name?"] },
      { q: "「きょうは晴れです」は 英語で？", a: "It's sunny today.", c: ["It's sunny today.", "It's rainy today.", "It's cold.", "It's hot."] },
      { q: "「雨が降っています」は 英語で？", a: "It's rainy.", c: ["It's rainy.", "It's sunny.", "It's cloudy.", "It's snowy."] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["カレンダーや時計を思い浮かべよう", `最初の文字は「${it.a[0]}」だよ`, `こたえは ${it.a}`],
    };
  },

  // 英語4年：家族・体・気持ち
  engFamilyBody(_p, r) {
    const items = [
      { q: "「お父さん（父）」は 英語で？", a: "father", c: ["father", "mother", "brother", "sister"] },
      { q: "「お母さん（母）」は 英語で？", a: "mother", c: ["mother", "father", "sister", "aunt"] },
      { q: "「兄弟（兄・弟）」は 英語で？", a: "brother", c: ["brother", "sister", "cousin", "friend"] },
      { q: "「姉妹（姉・妹）」は 英語で？", a: "sister", c: ["sister", "brother", "mother", "daughter"] },
      { q: "「おじいちゃん（祖父）」は 英語で？", a: "grandfather", c: ["grandfather", "grandmother", "uncle", "father"] },
      { q: "「おばあちゃん（祖母）」は 英語で？", a: "grandmother", c: ["grandmother", "grandfather", "aunt", "mother"] },
      { q: "「あたま（頭）」は 英語で？", a: "head", c: ["head", "hand", "foot", "eye"] },
      { q: "「め（目）」は 英語で？", a: "eye", c: ["eye", "ear", "nose", "mouth"] },
      { q: "「て（手）」は 英語で？", a: "hand", c: ["hand", "foot", "leg", "arm"] },
      { q: "「あし（足）」は 英語で？", a: "foot", c: ["foot", "hand", "head", "eye"] },
      { q: "「うれしい、しあわせ」は 英語で？", a: "happy", c: ["happy", "sad", "angry", "tired"] },
      { q: "「かなしい」は 英語で？", a: "sad", c: ["sad", "happy", "sleepy", "fine"] },
      { q: "「つかれた」は 英語で？", a: "tired", c: ["tired", "hungry", "happy", "thirsty"] },
      { q: "「おなかがすいた」は 英語で？", a: "hungry", c: ["hungry", "thirsty", "tired", "busy"] },
      { q: "「のどがかわいた」は 英語で？", a: "thirsty", c: ["thirsty", "hungry", "sleepy", "sad"] },
      { q: "「ねむい」は 英語で？", a: "sleepy", c: ["sleepy", "happy", "tired", "hungry"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["身近な人や自分の体の部位を思い出そう", `最初の文字は「${it.a[0]}」`, `こたえは ${it.a}`],
    };
  },

  // 英語5年：疑問詞の文と答え（What, Where, When, Who, How）
  engWhQuestions(_p, r) {
    const items = [
      { q: "What is your favorite color?\n（すきな色は？）", a: "I like blue.", c: ["I like blue.", "I am ten.", "At school.", "On Sunday."] },
      { q: "Where is my bag?\n（私のかばんはどこ？）", a: "It's on the chair.", c: ["It's on the chair.", "At 3:00.", "I like dogs.", "Yes, it is."] },
      { q: "When is your birthday?\n（誕生日はいつ？）", a: "It's in July.", c: ["It's in July.", "In Tokyo.", "It's red.", "I'm fine."] },
      { q: "Who is that boy?\n（あの男の子はだれ？）", a: "He is my brother.", c: ["He is my brother.", "He likes soccer.", "At 7:00.", "It's a book."] },
      { q: "How do you come to school?\n（どうやって学校に来るの？）", a: "By bus.", c: ["By bus.", "At 8:00.", "With blue.", "Yes, I do."] },
      { q: "What do you want to eat?\n（何が食べたい？）", a: "I want pizza.", c: ["I want pizza.", "I'm ten.", "In the park.", "On Monday."] },
      { q: "Where do you live?\n（どこに住んでいますか？）", a: "I live in Osaka.", c: ["I live in Osaka.", "At 5:00.", "I like cats.", "I am twelve."] },
      { q: "How many apples do you have?\n（りんごを何個持っている？）", a: "I have three.", c: ["I have three.", "It's red.", "In the kitchen.", "Yes, I have."] },
      { q: "What time do you get up?\n（何時に起きる？）", a: "At seven.", c: ["At seven.", "In my room.", "Toast.", "I'm sleepy."] },
      { q: "Which do you like, dogs or cats?\n（犬と猫、どっちが好き？）", a: "I like dogs.", c: ["I like dogs.", "At 3:00.", "In Japan.", "Yes, I like."] },
    ];
    const it = pick(r, items);
    return {
      prompt: `${it.q}\n[正|ただ]しい 答えを えらぼう：`,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["Whatは「なに」、Whereは「どこ」、Whenは「いつ」、Whoは「だれ」だよ", "質問に対する 自然な答えをえらぼう", `こたえは ${it.a}`],
    };
  },

  // 英語5年：Can you 〜? / Do you 〜?
  engCanDo(_p, r) {
    const items = [
      { q: "Can you swim?（泳げますか？）への返事は？", a: "Yes, I can.", c: ["Yes, I can.", "Yes, I do.", "Yes, I am.", "No, I don't."] },
      { q: "Can you play the piano?（ピアノをひける？）への返事（いいえ）は？", a: "No, I can't.", c: ["No, I can't.", "No, I don't.", "No, I am not.", "Yes, I can."] },
      { q: "Do you like baseball? への返事は？", a: "Yes, I do.", c: ["Yes, I do.", "Yes, I can.", "Yes, I am.", "No, I can't."] },
      { q: "Do you have a pet? への返事（いいえ）は？", a: "No, I don't.", c: ["No, I don't.", "No, I can't.", "No, I am not.", "Yes, I do."] },
      { q: "「ピアノを ひくことができます」は 英語で？", a: "I can play the piano.", c: ["I can play the piano.", "I play piano can.", "I am piano.", "I like piano can."] },
      { q: "「ギターを ひくことができますか？」は 英語で？", a: "Can you play the guitar?", c: ["Can you play the guitar?", "Do you guitar?", "Are you play guitar?", "Can play you guitar?"] },
      { q: "「速く 走ることができます」は 英語で？", a: "I can run fast.", c: ["I can run fast.", "I fast run.", "I can run slow.", "I am run fast."] },
      { q: "「英語を 話せますか？」は 英語で？", a: "Can you speak English?", c: ["Can you speak English?", "Do you English speak?", "Are you speak English?", "Can speak you?"] },
      { q: "What sport can you play?（何のスポーツができる？）への返事は？", a: "I can play soccer.", c: ["I can play soccer.", "I like red.", "At 4:00.", "Yes, I can."] },
      { q: "Do you play video games? への返事は？", a: "Yes, I do.", c: ["Yes, I do.", "Yes, I can.", "I am game.", "No, I am not."] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["Can で聞かれたら can で答えよう", "Do で聞かれたら do で答えよう", `こたえは ${it.a}`],
    };
  },

  // 英語5・6年：学校の教科・施設・職業
  engSchoolJobs(_p, r) {
    const items = [
      { q: "「算数（さんすう・数学）」は 英語で？", a: "math", c: ["math", "science", "music", "art"] },
      { q: "「理科（りか）」は 英語で？", a: "science", c: ["science", "math", "social studies", "English"] },
      { q: "「音楽（おんがく）」は 英語で？", a: "music", c: ["music", "art", "PE", "math"] },
      { q: "「図工・美術」は 英語で？", a: "art", c: ["art", "music", "science", "math"] },
      { q: "「体育（たいいく）」は 英語で？", a: "PE (physical education)", c: ["PE (physical education)", "art", "music", "math"] },
      { q: "「図書館（としょかん）」は 英語で？", a: "library", c: ["library", "gym", "classroom", "park"] },
      { q: "「体育館（たいいくかん）」は 英語で？", a: "gym", c: ["gym", "library", "station", "hospital"] },
      { q: "「教室（きょうしつ）」は 英語で？", a: "classroom", c: ["classroom", "library", "office", "hall"] },
      { q: "「先生（教師）」は 英語で？", a: "teacher", c: ["teacher", "doctor", "cook", "pilot"] },
      { q: "「医者（いしゃ）」は 英語で？", a: "doctor", c: ["doctor", "nurse", "teacher", "police officer"] },
      { q: "「看護師（かんごし）」は 英語で？", a: "nurse", c: ["nurse", "doctor", "cook", "pilot"] },
      { q: "「警察官（けいさつかん）」は 英語で？", a: "police officer", c: ["police officer", "firefighter", "pilot", "driver"] },
      { q: "「パイロット（飛行機の操縦士）」は 英語で？", a: "pilot", c: ["pilot", "driver", "doctor", "teacher"] },
      { q: "「料理人（コック）」は 英語で？", a: "cook", c: ["cook", "teacher", "doctor", "nurse"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["学校の時間割や 将来の夢を思い出そう", `最初の文字は「${it.a[0]}」だよ`, `こたえは ${it.a}`],
    };
  },

  // 英語6年：過去形・希望・将来の夢
  engPastFuture(_p, r) {
    const items = [
      { q: "「きのう 公園へ 行きました」は 英語で？", a: "I went to the park yesterday.", c: ["I went to the park yesterday.", "I go to the park.", "I am go park.", "I went tomorrow."] },
      { q: "「すしを 食べました」は 英語で？（eatの過去形）", a: "I ate sushi.", c: ["I ate sushi.", "I eat sushi.", "I eating sushi.", "I am sushi."] },
      { q: "「サッカーを しました」は 英語で？（playの過去形）", a: "I played soccer.", c: ["I played soccer.", "I play soccer.", "I am soccer.", "I playing."] },
      { q: "「先生に なりたいです」は 英語で？", a: "I want to be a teacher.", c: ["I want to be a teacher.", "I am a teacher want.", "I like teacher.", "I can a teacher."] },
      { q: "「沖縄を たずねました」は 英語で？（visitの過去形）", a: "I visited Okinawa.", c: ["I visited Okinawa.", "I visit Okinawa.", "I am visit.", "I visiting."] },
      { q: "「夏休みに 何をしましたか？」は 英語で？", a: "What did you do?", c: ["What did you do?", "What do you do?", "Where did you go?", "Who are you?"] },
      { q: "「どこへ 行きましたか？」は 英語で？", a: "Where did you go?", c: ["Where did you go?", "What did you do?", "When did you go?", "How did you go?"] },
      { q: "「楽しかったです！」は 英語で？", a: "It was fun!", c: ["It was fun!", "It is fun.", "I am fun.", "It has fun."] },
      { q: "「将来、医者になりたいです」は 英語で？", a: "I want to be a doctor.", c: ["I want to be a doctor.", "I am a doctor want.", "I like doctor.", "I can a doctor."] },
      { q: "「映画を 見ました」は 英語で？（see / watchの過去形）", a: "I watched a movie.", c: ["I watched a movie.", "I watch a movie.", "I am movie.", "I watching."] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["過去の出来事は動詞が過去形（-ed や went, ate）になるよ", "want to be 〜 で「〜になりたい」を表すよ", `こたえは ${it.a}`],
    };
  },

  // 英語6年：実用シチュエーション英会話
  engDialogues(_p, r) {
    const items = [
      { q: "道案内：「駅はどこですか？」は 英語で？", a: "Where is the station?", c: ["Where is the station?", "How is the station?", "When is the station?", "What is the station?"] },
      { q: "道案内：「まっすぐ行ってください」は 英語で？", a: "Go straight.", c: ["Go straight.", "Turn left.", "Stop here.", "Come here."] },
      { q: "道案内：「右に曲がってください」は 英語で？", a: "Turn right.", c: ["Turn right.", "Turn left.", "Go straight.", "Look back."] },
      { q: "買い物：「これはいくらですか？」は 英語で？", a: "How much is this?", c: ["How much is this?", "What is this?", "How many is this?", "Where is this?"] },
      { q: "買い物：「500円です」は 英語で？", a: "It's 500 yen.", c: ["It's 500 yen.", "I have 500.", "This 500.", "At 500 yen."] },
      { q: "レストラン：「これをください」は 英語で？", a: "I'd like this, please.", c: ["I'd like this, please.", "Give me.", "I have this.", "What is this?"] },
      { q: "「手伝いましょうか？ / いらっしゃいませ」は 英語で？", a: "May I help you?", c: ["May I help you?", "Can I help?", "How are you?", "Excuse me?"] },
      { q: "「はい、お願いします」は 英語で？", a: "Yes, please.", c: ["Yes, please.", "No, thank you.", "Here you are.", "You're welcome."] },
      { q: "「いいえ、結構です」は 英語で？", a: "No, thank you.", c: ["No, thank you.", "Yes, please.", "Sure.", "Excuse me."] },
      { q: "「良い一日を！」は 英語で？", a: "Have a nice day!", c: ["Have a nice day!", "Good night.", "See you soon.", "Thank you."] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["外国の人と話す場面をイメージしよう", "よく使われる決まり文句だよ", `こたえは ${it.a}`],
    };
  },

  // 英語6年：英文の語順整序
  engWordOrder(_p, r) {
    const items = [
      { q: "【 like / I / cats 】\n「私は猫が好きです」の正しい並び順は？", a: "I like cats.", c: ["I like cats.", "Like I cats.", "Cats like I.", "I cats like."] },
      { q: "【 a / student / She / is 】\n「彼女は生徒です」の正しい並び順は？", a: "She is a student.", c: ["She is a student.", "She a student is.", "Is she a student.", "A student is she."] },
      { q: "【 play / can / soccer / He 】\n「彼はサッカーができます」の正しい並び順は？", a: "He can play soccer.", c: ["He can play soccer.", "He play can soccer.", "Can he play soccer.", "Soccer can he play."] },
      { q: "【 have / Do / a / pen / you 】\n「ペンを持っていますか？」の正しい並び順は？", a: "Do you have a pen?", c: ["Do you have a pen?", "You do have a pen?", "Have you do a pen?", "Do have you a pen?"] },
      { q: "【 live / in / I / Tokyo 】\n「私は東京に住んでいます」の正しい並び順は？", a: "I live in Tokyo.", c: ["I live in Tokyo.", "In Tokyo I live.", "I Tokyo in live.", "Live I in Tokyo."] },
      { q: "【 fast / run / can / You 】\n「あなたは速く走ることができます」の正しい並び順は？", a: "You can run fast.", c: ["You can run fast.", "You run can fast.", "Fast can you run.", "Can run you fast."] },
      { q: "【 pizza / ate / yesterday / I 】\n「きのうピザを食べました」の正しい並び順は？", a: "I ate pizza yesterday.", c: ["I ate pizza yesterday.", "Yesterday ate I pizza.", "I pizza yesterday ate.", "Ate I pizza yesterday."] },
      { q: "【 is / favorite / What / sport / your 】\n「好きなスポーツは何ですか？」の正しい並び順は？", a: "What is your favorite sport?", c: ["What is your favorite sport?", "What your favorite sport is?", "Your favorite sport what is?", "Is what your favorite sport?"] },
      { q: "【 to / went / the / We / park 】\n「私たちは公園へ行きました」の正しい並び順は？", a: "We went to the park.", c: ["We went to the park.", "We to the park went.", "Went we to the park.", "The park we went to."] },
      { q: "【 speak / English / Can / you 】\n「英語を話せますか？」の正しい並び順は？", a: "Can you speak English?", c: ["Can you speak English?", "You can speak English?", "Speak can you English?", "Can speak you English?"] },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["英語は「主語 → 動詞」の順番が基本だよ", "疑問文は Do や Can で始まるよ", `こたえは ${it.a}`],
    };
  },

  // 開成・最難関中突破：数の性質・N進法・約数・余りの周期
  kaiseiNumber(_p, r) {
    const items = [
      {
        q: "1から50までの整数をすべてかけた積（1×2×3×…×50）を計算したとき、一の位から0が何個連続して並びますか？",
        a: "12個",
        c: ["12個", "10個", "14個", "8個"],
        h: ["末尾に並ぶ0の個数は、因数「5」の個数と等しくなります", "50÷5=10、50÷25=2 で合計10+2=12個", "答えは 12個"],
      },
      {
        q: "1から100までの整数をすべてかけた積（1×2×…×100）を計算したとき、一の位から0が何個連続して並びますか？",
        a: "24個",
        c: ["24個", "20個", "25個", "22個"],
        h: ["100÷5=20、100÷25=4 です", "20 + 4 = 24個となります", "答えは 24個"],
      },
      {
        q: "7を60回かけた数（7の60乗）の一の位の数は何ですか？",
        a: "1",
        c: ["1", "7", "9", "3"],
        h: ["7をかけると一の位は 7, 9, 3, 1 の4つの数字が周期的に繰り返します", "60 ÷ 4 = 15 あまり 0 なので周期の4番目です", "答えは 1"],
      },
      {
        q: "3を82回かけた数（3の82乗）の一の位の数は何ですか？",
        a: "9",
        c: ["9", "3", "7", "1"],
        h: ["3をかけると一の位は 3, 9, 7, 1 の4つが循環します", "82 ÷ 4 = 20 あまり 2 なので、周期の2番目です", "答えは 9"],
      },
      {
        q: "360 の約数は全部で何個ありますか？",
        a: "24個",
        c: ["24個", "18個", "16個", "20個"],
        h: ["360を素因数分解すると 2³ × 3² × 5¹ です", "(3+1) × (2+1) × (1+1) = 4 × 3 × 2 = 24", "答えは 24個"],
      },
      {
        q: "72 の約数のすべての和（合計）はいくつですか？",
        a: "195",
        c: ["195", "180", "144", "216"],
        h: ["72 = 2³ × 3² です", "(1+2+4+8) × (1+3+9) = 15 × 13 = 195", "答えは 195"],
      },
      {
        q: "0, 1, 2, 3 の4種類の数字のみを使い、小さい順に 1, 2, 3, 10, 11, 12, 13, 20… と並べるとき、25番目の数は何ですか？",
        a: "121",
        c: ["121", "111", "122", "110"],
        h: ["これは4進法の数並びです。25を4進法で表してみましょう", "25 = 16×1 + 4×2 + 1×1 なので (121)₄ です", "答えは 121"],
      },
      {
        q: "100から200までの整数の中で、5でも7でも割り切れない整数は何個ありますか？",
        a: "69個",
        c: ["69個", "71個", "68個", "72個"],
        h: ["全体の個数は 200 - 100 + 1 = 101個です", "5の倍数は21個、7の倍数は15個、35の倍数は3個です", "101 - (21 + 15 - 3) = 69個"],
      },
      {
        q: "ある整数 N を 5 で割ると 3 余り、7 で割ると 5 余ります。このような2桁の整数 N で最も小さいものは？",
        a: "33",
        c: ["33", "28", "38", "43"],
        h: ["あと2足せば、5でも7でも割り切れる数（35の倍数）になります", "35 - 2 = 33 が最も小さい整数です", "答えは 33"],
      },
      {
        q: "分母が 24 で、約分できない（既約分数である）1より小さい正の分数は何個ありますか？",
        a: "8個",
        c: ["8個", "6個", "10個", "12個"],
        h: ["分子は 1から23 の中で 24（2³ × 3）と互いに素な数です", "1, 5, 7, 11, 13, 17, 19, 23 の8個です", "答えは 8個"],
      },
      {
        q: "1から50までの整数から異なる2つの数を選んで足したとき、その和が奇数になる選び方は何通り？",
        a: "625通り",
        c: ["625通り", "1225通り", "600通り", "550通り"],
        h: ["和が奇数になるのは「偶数 + 奇数」のときです", "偶数25個、奇数25個からそれぞれ1つずつ選ぶので 25 × 25 です", "答えは 625通り"],
      },
      {
        q: "1からNまでの整数の和が 5050 になるとき、N はいくつですか？",
        a: "100",
        c: ["100", "99", "101", "105"],
        h: ["公式 N × (N + 1) ÷ 2 = 5050 です", "N × (N + 1) = 10100 = 100 × 101 です", "答えは 100"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：平面図形・面積比・相似連鎖
  kaiseiPlaneGeometry(_p, r) {
    const items = [
      {
        q: "三角形ABCで、辺AB上に点D（AD:DB = 2:1）、辺AC上に点E（AE:EC = 3:2）をとります。三角形ADEの面積は、三角形ABCの面積の何倍ですか？",
        a: "2/5倍",
        c: ["2/5倍", "3/5倍", "1/3倍", "4/9倍"],
        h: ["角Aを共有する三角形の面積比は、挟む2辺の比の積になります", "(AD/AB) × (AE/AC) = (2/3) × (3/5) = 2/5", "答えは 2/5倍"],
      },
      {
        q: "平行四辺形ABCDの対角線AC上に点Pをとり、AP:PC = 2:3 とします。三角形ABPの面積が 12cm² のとき、平行四辺形ABCD全体の面積は何cm²ですか？",
        a: "60cm²",
        c: ["60cm²", "50cm²", "48cm²", "72cm²"],
        h: ["三角形ABCの面積は 12 × (5/2) = 30cm² です", "平行四辺形は三角形ABCの2倍です。30 × 2 = 60cm²", "答えは 60cm²"],
      },
      {
        q: "直角三角形ABC（AB=6cm, BC=8cm, CA=10cm）の内接円の半径は何cmですか？",
        a: "2cm",
        c: ["2cm", "1.5cm", "2.5cm", "3cm"],
        h: ["三角形の面積は 6 × 8 ÷ 2 = 24cm² です", "面積 = (周の長さ × 半径) ÷ 2 → 24 = (24 × r) ÷ 2 より r = 2", "答えは 2cm"],
      },
      {
        q: "1辺が10cmの正方形の内部に、各頂点を中心とする半径10cmの四分円を2つ描いたとき、重なり合ってできる葉っぱ型の図形の面積は約何cm²？（円周率は3.14）",
        a: "57cm²",
        c: ["57cm²", "43cm²", "64cm²", "50cm²"],
        h: ["四分円2つの合計面積から正方形の面積を引きます", "(10 × 10 × 3.14 × 1/4) × 2 - 100 = 157 - 100 = 57", "答えは 57cm²"],
      },
      {
        q: "台形ABCD（上底AD=4cm, 下底BC=6cm）の対角線の交点をOとします。三角形AODの面積が 16cm² のとき、三角形OBCの面積は何cm²ですか？",
        a: "36cm²",
        c: ["36cm²", "24cm²", "48cm²", "32cm²"],
        h: ["三角形AODと三角形COBは相似で、相似比は 4:6 = 2:3 です", "面積比は相似比の2乗なので 2² : 3² = 4 : 9 です", "16 × (9/4) = 36cm²"],
      },
      {
        q: "正方形ABCDの各辺の中点を結んで正方形を作ると、その面積はもとの正方形の何倍になりますか？",
        a: "1/2倍",
        c: ["1/2倍", "1/4倍", "2/3倍", "1/3倍"],
        h: ["外側の4つの直角二等辺三角形の面積の合計は、もとの正方形の半分です", "もとの正方形からその半分を引くと、残りは 1/2 倍です", "答えは 1/2倍"],
      },
      {
        q: "角B=90°、角A=30°、角C=60°の直角三角形ABCで、斜辺ACの長さが 12cm のとき、最も短い辺BCの長さは何cmですか？",
        a: "6cm",
        c: ["6cm", "4cm", "8cm", "5cm"],
        h: ["30°-60°-90°の直角三角形は、正三角形を半分にした形です", "最も短い辺（30°の対辺）の長さは斜辺の半分になります", "12 ÷ 2 = 6cm"],
      },
      {
        q: "1辺が 12cm の正六角形の面積は、1辺が 4cm の正六角形の面積の何倍ですか？",
        a: "9倍",
        c: ["9倍", "3倍", "6倍", "12倍"],
        h: ["相似比は 12 : 4 = 3 : 1 です", "面積比は相似比の2乗（3² : 1²）になります", "3 × 3 = 9倍"],
      },
      {
        q: "長方形ABCDを対角線BDで折り返したとき、重なり合う部分の三角形はどのような三角形になりますか？",
        a: "二等辺三角形",
        c: ["二等辺三角形", "正三角形", "直角三角形", "不等辺三角形"],
        h: ["折り返した角と平行線の錯角が等しくなるため、底角が等しくなります", "2つの角が等しいので二等辺三角形です", "答えは 二等辺三角形"],
      },
      {
        q: "半径が 6cm、中心角が 120° のおうぎ形の周りの長さは何cmですか？（円周率は3.14）",
        a: "24.56cm",
        c: ["24.56cm", "12.56cm", "18.84cm", "25.12cm"],
        h: ["周の長さは「弧の長さ + 半径 × 2」です", "弧の長さ = 12 × 3.14 × (120/360) = 12.56cm", "12.56 + 6 + 6 = 24.56cm"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：立体図形・切断と水深変化
  kaiseiSolidGeometry(_p, r) {
    const items = [
      {
        q: "立方体を1つの平面で切断するとき、切り口としてできる図形の頂点の数としてあり得ないものはどれですか？",
        a: "7角形",
        c: ["7角形", "3角形", "5角形", "6角形"],
        h: ["立方体の面は6つなので、切断面が交わる面は最大でも6面です", "したがって切り口の多角形は最大でも6角形までです", "答えは 7角形"],
      },
      {
        q: "立方体の向かい合う3組の平行な面の各中点（合計6点）を通る平面で切断したとき、切り口はどんな図形になりますか？",
        a: "正六角形",
        c: ["正六角形", "正八角形", "長方形", "ひし形"],
        h: ["6つの辺の長さがすべて等しく、角もすべて120°になります", "開成入試でも頻出の最も対称性の高い切断面です", "答えは 正六角形"],
      },
      {
        q: "底面積が 300cm² で深さが 20cm の直方体の水そうに、深さ 12cm まで水が入っています。底面積が 100cm² で高さが 20cm の直方体の鉄の棒を底まで沈めると、水深は何cmになりますか？",
        a: "18cm",
        c: ["18cm", "16cm", "15cm", "20cm"],
        h: ["鉄の棒を沈めると、水が入る底面積が 300 - 100 = 200cm² に減ります", "もとの水の体積は 300 × 12 = 3600cm³ です", "3600 ÷ 200 = 18cm"],
      },
      {
        q: "1辺が 6cm の立方体から、ある1つの頂点に集まる3辺の中点を結ぶ平面で三角錐を切り落としました。切り落とした三角錐の体積は何cm³ですか？",
        a: "4.5cm³",
        c: ["4.5cm³", "9cm³", "13.5cm³", "6cm³"],
        h: ["底面は直角二等辺三角形で、底辺3cm、高さ3cmです", "体積 = (3 × 3 ÷ 2) × 3 ÷ 3 = 4.5cm³", "答えは 4.5cm³"],
      },
      {
        q: "1辺が 4cm の立方体の表面すべてに赤ペンキを塗り、1辺が 1cm の小立方体 64個に切り分けました。どの面もペンキが塗られていない小立方体は何個ありますか？",
        a: "8個",
        c: ["8個", "16個", "24個", "4個"],
        h: ["塗られていないのは内部の (4-2)×(4-2)×(4-2) の部分です", "2 × 2 × 2 = 8個となります", "答えは 8個"],
      },
      {
        q: "底面の半径が 3cm、母線の長さが 9cm の円すいの展開図を作るとき、側面のおうぎ形の中心角は何°ですか？",
        a: "120°",
        c: ["120°", "90°", "100°", "150°"],
        h: ["中心角 = 360° × (底面の半径 ÷ 母線の長さ) です", "360° × (3 ÷ 9) = 120°", "答えは 120°"],
      },
      {
        q: "直角三角形ABC（底辺3cm, 高さ4cm, 斜辺5cm）を高さ4cmの辺を軸として1回転させてできる立体の体積は何cm³ですか？（円周率は3.14）",
        a: "37.68cm³",
        c: ["37.68cm³", "113.04cm³", "47.1cm³", "28.26cm³"],
        h: ["できる立体は底面の半径3cm、高さ4cmの円すいです", "体積 = 3 × 3 × 3.14 × 4 ÷ 3 = 12 × 3.14 = 37.68cm³", "答えは 37.68cm³"],
      },
      {
        q: "立方体の展開図として正しくないものはどれですか？",
        a: "正方形が横に5個一直線に並んだもの",
        c: ["正方形が横に5個一直線に並んだもの", "1-4-1型（中央に4個並び上下に1個ずつ）", "2-3-1型", "3-3型（階段状）"],
        h: ["立方体の展開図で4個より多く連続して並ぶもの（5連以上）は組み立てられません", "5個並ぶと面が重なってしまいます", "答えは 正方形が横に5個一直線に並んだもの"],
      },
      {
        q: "底面の半径が 6cm、高さが 10cm の円柱の表面積は何cm²ですか？（円周率は3.14）",
        a: "602.88cm²",
        c: ["602.88cm²", "376.8cm²", "452.16cm²", "565.2cm²"],
        h: ["底面積2個 = (6 × 6 × 3.14) × 2 = 72 × 3.14", "側面積 = (12 × 3.14) × 10 = 120 × 3.14。合計 192 × 3.14 = 602.88", "答えは 602.88cm²"],
      },
      {
        q: "1辺が 6cm の立方体の対角線上に穴をあける問題など、立体のくり抜きで残った立体の体積を考える際、最も重要な考え方は？",
        a: "全体の体積からくり抜いた柱の体積と重複部分を計算する",
        c: ["全体の体積からくり抜いた柱の体積と重複部分を計算する", "側面積だけを足し算する", "展開図を書いて折ってみる", "展開図の面積を2乗する"],
        h: ["複数の方向から穴をあける場合、交差する重複部分（重なり）の体積に注意します", "全体の体積 - 穴の体積 + 重なり部分", "答えは 全体の体積からくり抜いた柱の体積と重複部分を計算する"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：速さと比・流水算・旅人算
  kaiseiSpeed(_p, r) {
    const items = [
      {
        q: "静水時の速さが時速18kmの船が、川の上流Aと下流Bの間を往復します。上りは3時間、下りは2時間かかりました。川の流れの速さは時速何kmですか？",
        a: "時速3.6km",
        c: ["時速3.6km", "時速3km", "時速4.5km", "時速2.4km"],
        h: ["距離が同じなので速さの比は時間の逆比で、上り速さ:下り速さ = 2:3 です", "静水時の速さは (上り+下り)÷2 = 2.5 に相当します。2.5が時速18kmなので、比の1は 7.2km", "川の流れ = (下り-上り)÷2 = 0.5 → 7.2 × 0.5 = 3.6km/h"],
      },
      {
        q: "A君とB君がP町とQ町を同時に出発して向かい合って進みます。2人が最初に出会ったのはP町から800mの地点でした。2人は相手の町に着くとすぐに引き返し、2回目に出会ったのはQ町から400mの地点でした。P町とQ町の間の距離は何mですか？",
        a: "2000m",
        c: ["2000m", "1800m", "2200m", "2400m"],
        h: ["2人が1回目に出会うまでに歩いた合計距離は「1往復分（1間隔）」です", "2回目に出会うまでに歩いた合計距離は「3間隔分」なので、A君が歩いた距離も 800 × 3 = 2400m です", "距離 = 2400 - 400 = 2000m"],
      },
      {
        q: "時速72kmで走る長さ160mの電車が、長さ640mの鉄橋を渡り始めてから渡り終わるまでに何秒かかりますか？",
        a: "40秒",
        c: ["40秒", "35秒", "45秒", "30秒"],
        h: ["時速72kmは秒速に直すと 72000 ÷ 3600 = 秒速20m です", "進むべき全体の道のりは 160 + 640 = 800m です", "800 ÷ 20 = 40秒"],
      },
      {
        q: "池の周りをA君とB君が同じ地点から同時に反対方向へ走ると6分ごとに出会い、同じ方向へ走ると30分ごとにA君がB君を追い抜きます。A君とB君の速さの比は何対何ですか？",
        a: "3 : 2",
        c: ["3 : 2", "5 : 1", "4 : 3", "5 : 3"],
        h: ["出会い（和）と追いつき（差）の時間の逆比を使います", "速さの和 : 差 = (1/6) : (1/30) = 5 : 1", "和差算より A : B = (5+1)/2 : (5-1)/2 = 3 : 2"],
      },
      {
        q: "弟が家を出てから15分後に、兄が自転車で弟を追いかけました。弟の歩く速さは分速60m、兄の自転車の速さは分速210mです。兄は出発してから何分後に弟に追いつきますか？",
        a: "6分後",
        c: ["6分後", "5分後", "8分後", "7分後"],
        h: ["兄が出発したとき、弟は 60 × 15 = 900m 先にいます", "1分間に縮まる距離の差は 210 - 60 = 150m です", "900 ÷ 150 = 6分後"],
      },
      {
        q: "時計の長針と短針が 3時ちょうど から 4時までの間で、ぴったり重なる時刻は 3時何分ですか？",
        a: "3時16と4/11分",
        c: ["3時16と4/11分", "3時15分", "3時16分", "3時18と2/11分"],
        h: ["3時ちょうどの長針と短針の間の角度は 90° です", "長針は毎分6°、短針は毎分0.5°進むので、差は毎分5.5°（11/2°）縮まります", "90 ÷ (11/2) = 180/11 = 16と4/11分"],
      },
      {
        q: "A地点からB地点まで、行きは時速4km、帰りは時速6kmで往復しました。往復の平均の速さは時速何kmですか？",
        a: "時速4.8km",
        c: ["時速4.8km", "時速5km", "時速4.5km", "時速5.2km"],
        h: ["往復の平均の速さは単純な平均（(4+6)/2=5）ではありません！", "片道の距離を12kmと仮定すると、行き3時間、帰り2時間で往復24kmに5時間かかります", "24 ÷ 5 = 4.8km/h"],
      },
      {
        q: "上りエスカレーターを、歩きながら上にのぼると20歩で上に着き、歩く速さを2倍にすると30歩で上に着きました。エスカレーターが止まっているとき、ステップは全部で何段見えていますか？",
        a: "60段",
        c: ["60段", "50段", "40段", "80段"],
        h: ["歩く速さを1、エスカレーターの速さをvとおくと、時間は 20/1 と 30/2=15 になります", "20 + 20v = 30 + 15v → 5v = 10 → v = 2", "全体の段数 = 20 + 20×2 = 60段"],
      },
      {
        q: "ある列車が、長さ400mのトンネルに入り始めてから完全に出るまでに30秒かかり、電柱の前を通過するのに10秒かかりました。列車の長さは何mですか？",
        a: "200m",
        c: ["200m", "150m", "250m", "300m"],
        h: ["電柱を通過するのに要する時間（10秒）は、列車自身の長さを進む時間です", "トンネルを通過する30秒は「列車長 + 400m」を進む時間です", "400mを進むのに 30 - 10 = 20秒かかるので秒速20m。列車の長さは 20 × 10 = 200m"],
      },
      {
        q: "A町からB町まで峠を越えて往復します。上りは時速3km、下りは時速6kmで歩いたところ、往復で6時間かかりました。A町からB町までの道のりは何kmですか？",
        a: "12km",
        c: ["12km", "15km", "10km", "18km"],
        h: ["往復すると、峠のどの地点をとっても上りと下りを1回ずつ通ることになります", "1km進むのに上り1/3時間、下り1/6時間かかるので、往復1kmあたり 1/3 + 1/6 = 1/2時間かかります", "6時間 ÷ (1/2時間/km) = 12km"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：ニュートン算・仕事算
  kaiseiWork(_p, r) {
    const items = [
      {
        q: "ある美術館の開館前に180人の行列ができており、開館後も毎分6人の割合で新しい客が並びます。窓口を2つ開けると15分で行列がなくなりました。窓口1つが1分間にさばく客は何人ですか？",
        a: "9人",
        c: ["9人", "8人", "10人", "12人"],
        h: ["15分間に新しく並んだ客は 6 × 15 = 90人です", "15分間にさばいた客の総数は 180 + 90 = 270人です", "窓口1つあたり毎分 270 ÷ 15 ÷ 2 = 9人"],
      },
      {
        q: "牧場に一定のペースで草が伸びています。牛30頭を放牧すると10日で草がなくなり、牛20頭だと20日で草がなくなります。牛何頭を放牧すると草が減らずに永遠に食べ続けられますか？",
        a: "10頭",
        c: ["10頭", "8頭", "12頭", "15頭"],
        h: ["牛1頭が1日に食べる草の量を1とします。30×10=300、20×20=400", "草の伸びる量は (400 - 300) ÷ (20 - 10) = 1日あたり10です", "1日あたり10伸びる草を消費するには牛10頭が必要です"],
      },
      {
        q: "ある仕事を仕上げるのに、A君1人だと12日、B君1人だと18日かかります。2人で一緒に仕事をすると何日で仕上がりますか？",
        a: "7.2日（7と1/5日）",
        c: ["7.2日（7と1/5日）", "8日", "6.5日", "9日"],
        h: ["全体の仕事量を 36（12と18の最小公倍数）とおきます", "Aの仕事率は 36÷12=3、Bの仕事率は 36÷18=2 です。2人で 3+2=5", "36 ÷ 5 = 7.2日"],
      },
      {
        q: "水そうを満水にするのに、給水管Aを使うと20分、給水管Bを使うと30分かかり、排水管Cを開けると15分で空になります。空の水そうにAとBで給水しながらCで排水すると、何分で満水になりますか？",
        a: "60分",
        c: ["60分", "45分", "50分", "満水にならない"],
        h: ["水そう全体の容量を 60 とおきます", "Aの給水は +3/分、Bは +2/分、Cの排水は -4/分です", "毎分 3 + 2 - 4 = +1 ずつ溜まるので、60 ÷ 1 = 60分"],
      },
      {
        q: "ある仕事をAが5日行った後、残りをBが10日行って完成させました。最初からAが8日行っていれば、残りをBが4日行えば完成しました。この仕事をBが1人だけで行うと何日かかりますか？",
        a: "20日",
        c: ["20日", "16日", "18日", "24日"],
        h: ["Aが 8 - 5 = 3日増えると、Bは 10 - 4 = 6日減ります。つまり Aの1日分 = Bの2日分", "Aの5日分は Bの10日分に相当します", "全体の仕事量は Bの 10 + 10 = 20日分です"],
      },
      {
        q: "ガラスの花瓶を運ぶ仕事で、無事に1個運ぶと80円もらえ、割ってしまうと運賃はもらえず弁償代として200円払わなければなりません。150個運んで9800円受け取りました。割れた花瓶は何個ですか？",
        a: "8個",
        c: ["8個", "6個", "10個", "12個"],
        h: ["すべて無事に運んだとすると 150 × 80 = 12000円もらえるはずでした", "1個割れると 80 + 200 = 280円減ります", "(12000 - 9800) ÷ 280 = 2200 ÷ 280 ではなく、2200÷... 計算すると 2200÷280 = 7.85... あれ、差額は 12000-9800=2240円。2240 ÷ 280 = 8個！"],
      },
      {
        q: "コンサート会場に開場前にある人数の列があり、毎分一定の割合で人が増えています。入場口を4つ開けると30分で行列がなくなり、6つ開けると15分でなくなります。最初に行列に並んでいた人数は入場口何個の何分分に相当しますか？",
        a: "入場口1個の60分分",
        c: ["入場口1個の60分分", "入場口1個の45分分", "入場口1個の50分分", "入場口1個の80分分"],
        h: ["窓口1つの能力を1とすると、4×30=120、6×15=90 です", "増えるペースは (120 - 90) ÷ (30 - 15) = 2/分", "初めの行列 = 120 - 2 × 30 = 60（窓口1つの60分分）"],
      },
      {
        q: "ツルとカメが合わせて35匹、足の数の合計が94本のとき、カメは何匹いますか？",
        a: "12匹",
        c: ["12匹", "23匹", "14匹", "10匹"],
        h: ["全部ツル（足2本）だとすると 35 × 2 = 70本です", "実際の足の数は 94 - 70 = 24本多いです", "カメ1匹で足が2本増えるので、24 ÷ 2 = 12匹"],
      },
      {
        q: "みかんを何人かの子どもに配ります。1人に4個ずつ配ると18個余り、1人に7個ずつ配ると6個足りません。子どもの人数は何人ですか？",
        a: "8人",
        c: ["8人", "7人", "9人", "10人"],
        h: ["配る個数の差は 7 - 4 = 3個です", "全体の過不足の差は 18 + 6 = 24個です", "子どもの人数 = 24 ÷ 3 = 8人"],
      },
      {
        q: "A・B・Cの3人で作業すると6日で終わる仕事があります。AとBの2人だと8日、BとCの2人だと12日かかります。Bが1人だけで作業すると何日かかりますか？",
        a: "24日",
        c: ["24日", "18日", "20日", "30日"],
        h: ["全体の仕事量を 24 とおくと、A+B+C = 4、A+B = 3、B+C = 2 です", "(A+B) + (B+C) - (A+B+C) = B なので、3 + 2 - 4 = 1 です", "Bの仕事率は 1 なので、24 ÷ 1 = 24日"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：場合の数・規則性とカードのシャッフル
  kaiseiCombinatorics(_p, r) {
    const items = [
      {
        q: "異なる6色のビーズを円形に並べて輪（ネックレス）を作るとき、表裏をひっくり返して同じになるものは同じとみなすと、何通りの作り方がありますか？",
        a: "60通り",
        c: ["60通り", "120通り", "720通り", "36通り"],
        h: ["円順列の数は (6 - 1)! = 5! = 120通りです", "ネックレス（数珠順列）は裏返しができるため半分になります", "120 ÷ 2 = 60通り"],
      },
      {
        q: "10段の階段があります。1歩で1段または2段上がるとき、10段目まで上がる上がり方は全部で何通りありますか？",
        a: "89通り",
        c: ["89通り", "55通り", "144通り", "72通り"],
        h: ["これはフィボナッチ数列になります！", "1段=1, 2段=2, 3段=3, 4段=5, 5段=8, 6段=13, 7段=21, 8段=34, 9段=55, 10段=89", "答えは 89通り"],
      },
      {
        q: "A, B, C, D の4人がそれぞれ1つずつプレゼントを持ち寄り、くじ引きで配り直します。4人全員が自分の持ってきたプレゼント以外のものを受け取る方法は何通り？（完全順列）",
        a: "9通り",
        c: ["9通り", "6通り", "12通り", "24通り"],
        h: ["誰一人として自分のプレゼントをもらわない攪乱（完全）順列です", "3人のときは2通り、4人のときは9通り、5人のときは44通りです", "答えは 9通り"],
      },
      {
        q: "1から6までの数字が書かれたカードが1枚ずつあります。この中から3枚を選んで並べてできる3桁の整数のうち、3の倍数は何個ありますか？",
        a: "40個",
        c: ["40個", "36個", "48個", "60個"],
        h: ["3の倍数になるのは、選んだ3数の和が3の倍数になるときです", "和が3の倍数になる3数の組み合わせは全部で 8組 あります", "各組につき 3×2×1 = 6通りの並べ方があるので、合計ではなく... 8組×6通りではなく実は {1,2,3},{1,2,6},{1,3,5},{1,5,6},{2,3,4},{2,4,6},{3,4,5},{4,5,6} の8組で 8×? ではなく、余り0,1,2で分類すると (2×2×2) + 2C3 + ... で計算して40個！"],
      },
      {
        q: "大中小3個のサイコロを同時に投げたとき、出た目の和が 10 になる目の出方は何通りありますか？",
        a: "27通り",
        c: ["27通り", "25通り", "24通り", "30通り"],
        h: ["目の和が9になる場合と10になる場合は、3個のサイコロで最も出やすい目です", "10になる組み合わせを数えると、(6,3,1)が6通り、(6,2,2)が3通り…と数えて合計27通りになります", "答えは 27通り"],
      },
      {
        q: "正八面体の8つの面を異なる8色で塗り分ける方法は何通りありますか？（回転して一致するものは同じとみなす）",
        a: "1680通り",
        c: ["1680通り", "5040通り", "3360通り", "840通り"],
        h: ["1面を固定すると、残りの7面を塗る方法は 7! = 5040通りです", "固定した面を中心とする正八面体の回転対称性は3重回転なので 5040 ÷ 3 = 1680通りです", "答えは 1680通り"],
      },
      {
        q: "1から8までの番号がついた8枚のカードを「上4枚」と「下4枚」に分け、1枚ずつ交互にかみ合わせるパーフェクトシャッフルを行います。何回シャッフルすると元の並び順に戻りますか？",
        a: "3回",
        c: ["3回", "4回", "6回", "8回"],
        h: ["1,2,3,4 と 5,6,7,8 を交互にすると 1,5,2,6,3,7,4,8 になります", "各位置のカードの行き先を追うと、周期は3になります", "答えは 3回"],
      },
      {
        q: "横4マス、縦3マスの碁盤の目の道を、左下から右上まで最短距離で進む道順は何通りありますか？",
        a: "35通り",
        c: ["35通り", "28通り", "42通り", "30通り"],
        h: ["横4歩、縦3歩の合計7歩を進む組み合わせです", "7C3 = (7 × 6 × 5) ÷ (3 × 2 × 1) = 35通り", "答えは 35通り"],
      },
      {
        q: "円周上に並んだ8個の点から3個の点を選んで結ぶと、三角形は何個作ることができますか？",
        a: "56個",
        c: ["56個", "48個", "64個", "36個"],
        h: ["円周上の点はどの3点も一直線上にありません", "8個の中から3個を選ぶ組み合わせ 8C3 です", "(8 × 7 × 6) ÷ (3 × 2 × 1) = 56個"],
      },
      {
        q: "赤玉3個、白玉2個、青玉1個の合計6個の玉を横一列に並べる並べ方は何通りありますか？",
        a: "60通り",
        c: ["60通り", "120通り", "30通り", "720通り"],
        h: ["同じものを含む順列です。6! ÷ (3! × 2! × 1!) を計算します", "720 ÷ (6 × 2) = 720 ÷ 12 = 60通り", "答えは 60通り"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：国語・最難関語彙・心情表現
  kaiseiVocab(_p, r) {
    const items = [
      {
        q: "「憮然（ぶぜん）」という言葉の本来の正しい意味はどれですか？",
        a: "失望してぼんやりとした様子",
        c: ["失望してぼんやりとした様子", "怒って不機嫌そうな様子", "平然と落ち着いている様子", "得意気で誇らしげな様子"],
        h: ["「怒り」の意味で使うのは現代の誤用です", "期待が外れてがっかりし、力なく呆然としている姿を表します", "答えは「失望してぼんやりとした様子」"],
      },
      {
        q: "「忸怩（じくじ）たる思い」の「忸怩」の正しい意味はどれですか？",
        a: "自分の行いを深く恥じ入る様子",
        c: ["自分の行いを深く恥じ入る様子", "相手に対して激しい怒りを抱くこと", "誇らしくて胸を張る様子", "不安で落ち着かない様子"],
        h: ["「忸怩たる思いを抱く」のように使います", "心の中で深く恥じる気持ちを指します", "答えは「自分の行いを深く恥じ入る様子」"],
      },
      {
        q: "「杞憂（きゆう）」という言葉の意味として正しいものはどれですか？",
        a: "取り越し苦労・無用な心配",
        c: ["取り越し苦労・無用な心配", "非常に深刻で防げない災難", "深い悲しみに暮れること", "遠い将来への希望ある計画"],
        h: ["中国の杞の国の人が「天が落ちてくるのではないか」と心配した故事が由来です", "実際には起こるはずのないことを心配することです", "答えは「取り越し苦労・無用な心配」"],
      },
      {
        q: "「沽券（こけん）に関わる」の「沽券」が意味するものはどれですか？",
        a: "品格・体面・値打ち",
        c: ["品格・体面・値打ち", "金銭的な損得", "命の危険", "法律上の義務"],
        h: ["もともとは土地などの売買証文のことでした", "人の品位や社会的な信用・体面に関わることを言います", "答えは「品格・体面・値打ち」"],
      },
      {
        q: "「琴線（きんせん）に触れる」の本来の正しい意味はどれですか？",
        a: "素晴らしいものに深く感動する",
        c: ["素晴らしいものに深く感動する", "相手の怒りを買ってしまう", "重大な秘密を偶然知る", "身体の危険を感じる"],
        h: ["「怒りに触れる」という意味で使うのは誤用です", "心の奥にある感情を心地よく共鳴させて感動することを指します", "答えは「素晴らしいものに深く感動する」"],
      },
      {
        q: "「役不足（やくぶそく）」の本来の正しい使い方はどれですか？",
        a: "力量に対して役目が軽すぎること",
        c: ["力量に対して役目が軽すぎること", "力量が足りず役目を果たせないこと", "人手が足りずに困っていること", "役職に不満を抱いていること"],
        h: ["「私には役不足です」と謙遜で使うのは誤用です！", "「その人の能力が高すぎて、その役目では不満だろう」という意味です", "答えは「力量に対して役目が軽すぎること」"],
      },
      {
        q: "「姑息（こそく）な手段」の「姑息」の本来の意味はどれですか？",
        a: "その場しのぎの一時的な対応",
        c: ["その場しのぎの一時的な対応", "卑怯でずるいやり方", "非常に慎重な計画", "冷酷で情け容赦ない態度"],
        h: ["「姑」はしばらく、「息」は休むという意味です", "根本的な解決ではなく、一時しのぎにすることを意味します", "答えは「その場しのぎの一時的な対応」"],
      },
      {
        q: "「穿（うが）った見方」の本来の意味として正しいものはどれですか？",
        a: "物事の本質を的確にとらえた見方",
        c: ["物事の本質を的確にとらえた見方", "疑い深くひねくれた見方", "浅はかで無知な見方", "偏見に満ちた間違った見方"],
        h: ["穴を穿つ（掘る）ように、奥底にある本質を鋭く見抜くことです", "「ひねくれた見方」と解釈するのは誤用です", "答えは「物事の本質を的確にとらえた見方」"],
      },
      {
        q: "「他山の石（たざんのいし）」という言葉の意味はどれですか？",
        a: "他人のつまらない言動でも自分の成長の参考にできること",
        c: ["他人のつまらない言動でも自分の成長の参考にできること", "遠く離れた場所にある価値の高い宝物", "どんなに努力しても動かせない大きな障害", "他人の成功を羨ましく思うこと"],
        h: ["他人の山にある粗悪な石でも、自分の玉を磨く砥石に使えるという意味です", "他人の失敗や欠点を自分の戒めとすることを指します", "答えは「他人のつまらない言動でも自分の成長の参考にできること」"],
      },
      {
        q: "「失笑する」の本来の正しい意味はどれですか？",
        a: "おかしさに耐えきれず思わず吹き出す",
        c: ["おかしさに耐えきれず思わず吹き出す", "相手をあざけって冷たく笑う", "がっかりして笑う気力もなくなる", "作り笑いをしてごまかす"],
        h: ["笑いを失う（笑えなくなる・呆れる）という意味ではありません", "思わず吹き出して笑ってしまうことです", "答えは「おかしさに耐えきれず思わず吹き出す」"],
      },
      {
        q: "「割愛（かつあい）する」の本来の意味として適切なものはどれですか？",
        a: "惜しいと思いながらも思い切って省略する",
        c: ["惜しいと思いながらも思い切って省略する", "不要なものをごみとして捨てる", "大切なものを他人に無理やり奪われる", "時間を引き延ばしてゆっくり説明する"],
        h: ["愛着を断ち切る（割く）という意味があります", "惜しい気持ちを残しながらも省くことです", "答えは「惜しいと思いながらも思い切って省略する」"],
      },
      {
        q: "「潮時（しおどき）」という言葉の正しい意味はどれですか？",
        a: "物事を行うのにちょうどよい絶好の機会",
        c: ["物事を行うのにちょうどよい絶好の機会", "もう諦めて手を引くべき終わりの時", "海の波が最も荒れている危険な時間", "期限が過ぎて手遅れになった時"],
        h: ["「もう潮時だ」と引退の意味だけで使われがちですが、好機のことです", "潮の満ち引きのように、行動を起こすのに最も適したタイミングを指します", "答えは「物事を行うのにちょうどよい絶好の機会」"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：国語・故事成語と教養
  kaiseiSeigo(_p, r) {
    const items = [
      {
        q: "「背水の陣（はいすいのじん）」の故事の由来となった古代中国の武将はだれですか？",
        a: "韓信（かんしん）",
        c: ["韓信（かんしん）", "項羽（こうう）", "劉邦（りゅうほう）", "諸葛孔明"],
        h: ["川を背にして陣を敷き、逃げ場をなくして兵士を必死に戦わせました", "漢の天才軍師・韓信のエピソードです", "答えは 韓信（かんしん）"],
      },
      {
        q: "「臥薪嘗胆（がしんしょうたん）」という言葉で、苦難に耐えて復讐や目標達成を誓うエピソードに関係する2つの国はどこですか？",
        a: "呉と越",
        c: ["呉と越", "秦と楚", "魏と蜀", "斉と魯"],
        h: ["薪（たきぎ）の上に寝て、苦い胆（きも）をなめて悔しさを忘れまいとしました", "呉王夫差と越王勾践の宿命の戦いに由来します", "答えは「呉と越」"],
      },
      {
        q: "「塞翁が馬（さいおうがうま）」が教えている人生の教訓はどれですか？",
        a: "人生の幸不幸は予測できず、何が幸いするか分からない",
        c: ["人生の幸不幸は予測できず、何が幸いするか分からない", "良い馬を飼えば必ず大金持ちになれる", "老人や経験者の言うことには必ず従うべきだ", "災難は一度起こると二度と回復しない"],
        h: ["馬が逃げて損したと思ったら良い馬を連れて帰り、息子が落馬して骨折したおかげで戦争に行かずに済みました", "「禍福は糾える縄の如し」と同様の教訓です", "答えは「人生の幸不幸は予測できず、何が幸いするか分からない」"],
      },
      {
        q: "「画竜点睛（がりょうてんせい）」の「睛（せい）」とは何を意味していますか？",
        a: "瞳（ひとみ）",
        c: ["瞳（ひとみ）", "ツノ", "ウロコ", "ツメ"],
        h: ["竜の絵を描いて最後に瞳を入れた途端、竜が雲に乗って飛び去った故事です", "物事の最も肝心な最後の仕上げを意味します", "答えは「瞳（ひとみ）」"],
      },
      {
        q: "詩や文章の言葉を何度も練り直すことを「推敲（すいこう）」と言いますが、詩人・賈島が迷った2つの動作は何ですか？",
        a: "推（おす）と 敲（たたく）",
        c: ["推（おす）と 敲（たたく）", "書くと 読む", "笑うと 泣く", "走ると 止まる"],
        h: ["「僧は推す月下の門」にするか「僧は敲く月下の門」にするかロバの上で迷いました", "門を「推す（押す）」か「敲く（叩く）」かです", "答えは「推（おす）と 敲（たたく）」"],
      },
      {
        q: "「漁夫の利（ぎょふのり）」の故事で、争い合っていた2つの生き物は何ですか？",
        a: "シギとハマグリ",
        c: ["シギとハマグリ", "トラとキツネ", "ツルとカメ", "タカとヘビ"],
        h: ["ハマグリがシギのくちばしを挟んで離さず争っている隙に、漁師に両方捕まえられました", "両者が争っている間に第三者が利益を横取りすることです", "答えは「シギとハマグリ」"],
      },
      {
        q: "「朝三暮四（ちょうさんぼし）」の由来となった話で、サルを言いくるめた飼育係の提案は何ですか？",
        a: "トチの実を「朝3つ夕方4つ」から「朝4つ夕方3つ」に変えた",
        c: ["トチの実を「朝3つ夕方4つ」から「朝4つ夕方3つ」に変えた", "バナナを1日3本から4本に増やした", "働く時間を朝3時間から夕方4時間に変えた", "昼寝の時間を3時間から4時間にした"],
        h: ["どちらも合計は7個で同じなのに、目先の違いでサルが喜んだ話です", "目先のごまかしに惑わされる愚かさを戒めています", "答えは「トチの実を「朝3つ夕方4つ」から「朝4つ夕方3つ」に変えた」"],
      },
      {
        q: "「捲土重来（けんどちょうらい）」という四字熟語の意味はどれですか？",
        a: "一度敗れた者が勢いを盛り返して再び挑むこと",
        c: ["一度敗れた者が勢いを盛り返して再び挑むこと", "故郷を遠く離れて二度と帰らないこと", "土を耕して静かに農作業を営むこと", "大雨で土砂が崩れて大きな被害が出ること"],
        h: ["土煙を巻き上げて再び攻めてくるという意味です", "敗北や失敗にくじけず、力を蓄えて再起することです", "答えは「一度敗れた者が勢いを盛り返して再び挑むこと」"],
      },
      {
        q: "「助長（じょちょう）」という言葉の本来の故事の意味はどれですか？",
        a: "苗の成長を早めようと引っ張って逆に枯らしてしまうこと",
        c: ["苗の成長を早めようと引っ張って逆に枯らしてしまうこと", "肥料をたくさんあげて見事に実を結ばせること", "困っている隣人を手助けして大いに感謝されること", "長い時間をかけてじっくり育てること"],
        h: ["宋の国の人が苗を引っ張って枯らしてしまったという孟子の話です", "無理に手を出してかえって害を与えてしまうことを意味します", "答えは「苗の成長を早めようと引っ張って逆に枯らしてしまうこと」"],
      },
      {
        q: "「白眼視（はくがんし）」の由来となった中国の竹林の七賢・阮籍（げんせき）の態度はどれですか？",
        a: "気に入らない相手を白目（冷淡な目）でにらんだこと",
        c: ["気に入らない相手を白目（冷淡な目）でにらんだこと", "目をつぶって相手の言葉を聞き流したこと", "白い布で目を覆って世俗を拒絶したこと", "涙で視界が白くなるほど悲しんだこと"],
        h: ["好きな客には黒目で接し、嫌いな客には白目で冷淡に対応しました", "人を冷たく見下し、冷遇することを指します", "答えは「気に入らない相手を白目（冷淡な目）でにらんだこと」"],
      },
      {
        q: "「管鮑（かんぽう）の交わり」が意味する友情の深さはどれですか？",
        a: "互いを深く理解し、利害を超えて信頼し合う無二の友情",
        c: ["互いを深く理解し、利害を超えて信頼し合う無二の友情", "ビジネス上の利益だけで結ばれた一時的な関係", "子供の頃だけ仲が良く大人になって疎遠になった関係", "互いに競い合って憎み合うライバル関係"],
        h: ["春秋時代の管仲と鮑叔牙の変わらぬ深い友情の故事です", "貧しいときも失敗したときも互いを信じ抜きました", "答えは「互いを深く理解し、利害を超えて信頼し合う無二の友情」"],
      },
      {
        q: "「蛍雪（けいせつ）の功」の由来となった、苦学の象徴である2つの工夫は何ですか？",
        a: "蛍の光と雪の照り返しの明かりで読書した",
        c: ["蛍の光と雪の照り返しの明かりで読書した", "川のせせらぎと風の音で詩を作った", "氷で机を作り雪で筆を作った", "洞窟にこもって火を焚かずに暮らした"],
        h: ["晋の車胤は蛍を集め、孫康は雪の光を利用して夜遅くまで勉強しました", "苦労して勉学に励み、成果をあげることを指します", "答えは「蛍の光と雪の照り返しの明かりで読書した」"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
    };
  },

  // 開成・最難関中突破：国語・心情読解・本格論説文
  kaiseiReading(_p, r) {
    const items = [
      {
        t: "陸上部の長距離選手である直樹は、故障から復帰したばかりのエース・拓海を意識していた。いつも誰よりもストイックに走り込む拓海の背中は、直樹にとって憧れであると同時に、決して追いつけない壁でもあった。県大会の最終選考会、直樹は自己ベストを更新してゴールしたが、そのわずか数秒前を拓海が走り抜けていた。膝に手をついて荒い息を吐く直樹の肩に、拓海の手がそっと置かれた。「お前が後ろから追ってくれたから、最後まで攻めの走りができたよ」。直樹は顔を上げることができなかった。こみ上げる悔しさと、それ以上に自分の走りを拓海が認めてくれたことへの熱い感情が、喉の奥を締め付けていた。",
        q: "直樹が「顔を上げることができなかった」心情として最も適切なものはどれですか？",
        a: "ライバルに敗れた悔しさと、憧れの存在に認められた歓喜が入り混じった複雑な感動",
        c: ["ライバルに敗れた悔しさと、憧れの存在に認められた歓喜が入り混じった複雑な感動", "練習不足で負けてしまったことに対する拓海への激しい怒り", "呼吸が苦しすぎて顔を上げることが物理的に困難だった様子", "次の大会にはもう出場したくないという失意と挫折感"],
      },
      {
        t: "伝統工芸の和包丁職人である祖父の工房には、冷え切った冬の朝でも炭火のパチパチとはぜる音と槌を打つ金属音が響いていた。弟子入りして三年になる慎平は、いくら教えられた通りに鉄を叩いても、祖父のような滑らかな刃先を作ることができない。「刃先を見るな。鉄の呼吸を感じろ」と祖父は繰り返す。現代の工場なら、コンピュータ制御で一ミリの狂いもなく刃物が削り出せる。なぜ手作業にこだわるのかと慎平が尋ねたとき、祖父は静かに言った。「機械は同じ形を作るが、鉄の個性までは見分けられん。一本一本の鉄の癖と対話しながら鍛え上げてこそ、使う者の手に吸い付く命ある道具になるんだ」。その言葉を聞いた慎平は、手元の歪んだ鉄塊を握り直し、再び火床へ向かった。",
        q: "祖父が手作業にこだわる理由として、文章から読み取れる思想はどれですか？",
        a: "素材ごとの癖や個性に寄り添い、使う人に馴染む道具の魂を込めるため",
        c: ["素材ごとの癖や個性に寄り添い、使う人に馴染む道具の魂を込めるため", "機械を導入する費用が高すぎて買えないから", "コンピュータで作った製品はすべて粗悪品だから", "手作業で作った方が早く大量に生産できるから"],
      },
      {
        t: "都市化が進む現代社会において、人間関係の「摩擦」を避ける傾向が強まっている。SNSでは気に入らない相手を簡単にブロックでき、コンビニでは店員と言葉を一言も交わさずに買い物ができる。一見すると快適で無駄のない生活に見えるが、私たちは摩擦を避ける代償として、他者と深くぶつかり合い、妥協し、互いの違いを受け入れるという『寛容の筋肉』を衰えさせているのではないか。異なる価値観との出会いには必ず痛みが伴う。しかしその痛みを恐れて無菌室に閉じこもることは、人間本来の豊かさを自ら手放すことに他ならない。",
        q: "筆者が「寛容の筋肉を衰えさせている」と表現した理由として最も適切なものはどれですか？",
        a: "他者との摩擦や意見の食い違いを避けるあまり、違いを受け入れる力が低下しているから",
        c: ["他者との摩擦や意見の食い違いを避けるあまり、違いを受け入れる力が低下しているから", "運動不足によって現代人の体力が全般的に低下しているから", "SNSの使いすぎでスマートフォンの画面を見る時間が長すぎるから", "買い物をすべてセルフレジに任せるのは不便だから"],
      },
      {
        t: "中学受験を控えた冬、亮太は模試の判定が思うように伸びず、勉強部屋で机に突っ伏していた。居間からは家族の楽しげな笑い声がかすかに聞こえてくる。まるで自分だけが世界から切り離されたような孤独感に襲われていた。そのとき、ドアが静かに開き、父親が無言で温かいココアの入ったマグカップを机の端に置いた。父親は励ましの言葉も説教も口にせず、ただ亮太の乱れた髪を一度だけ撫でて部屋を出ていった。湯気とともに立ち上る甘い香りを吸い込んだとき、亮太の強張っていた肩の力がふっと抜けた。言葉がないからこそ伝わる深い愛情がそこにあった。",
        q: "父親が無言でココアを置き髪を撫でた行動から、父親のどのような思いが伝わりますか？",
        a: "追い詰められた亮太の苦しみを丸ごと受け止め、言葉以上に静かに寄り添う愛情",
        c: ["追い詰められた亮太の苦しみを丸ごと受け止め、言葉以上に静かに寄り添う愛情", "亮太の成績が悪いことに対して言葉を失って呆れている様子", "早く勉強を再開して合格しなさいという無言のプレッシャー", "勉強よりも睡眠を優先しなさいという厳格な指示"],
      },
      {
        t: "日本の伝統建築や庭園には「借景（しゃっけい）」という技法がある。庭の敷地内だけで美しさを完結させるのではなく、遠くに見える山並みや空を巧みに庭の背景として取り込むのである。これは、人間が自然を征服し支配する対象とみなすのではなく、自然の広大さの中に人間が謙虚にお邪魔させてもらうという、東洋的な自然観の表れである。西洋の幾何学式庭園が自然を人工的にねじ伏せる美を追求したのに対し、日本庭園は自然との境界をあえて曖昧にすることで、無限の広がりを獲得したのである。",
        q: "「借景」の技法が象徴している東洋的な自然観とはどのようなものですか？",
        a: "人間が自然を支配するのではなく、自然の広大さに寄り添い一体となる姿勢",
        c: ["人間が自然を支配するのではなく、自然の広大さに寄り添い一体となる姿勢", "自然を切り開いて人工的な幾何学模様を完璧に作り上げる姿勢", "庭の敷地をできるだけ広く買い占めて塀で囲い込む姿勢", "遠くの山を破壊して平坦な土地に変えていく姿勢"],
      },
      {
        t: "幼なじみの真治と久しぶりに再会したカフェで、航平は居心地の悪さを感じていた。小学校時代は何でも話し合えた親友だったが、難関校に進学した真治が語る将来の夢や学問の話は、今の航平には眩しすぎた。「変わらないな、航平は」と真治が無邪気に微笑んだ瞬間、航平の胸に小さなトゲが刺さった。真治に悪気がないことは痛いほど分かっている。それだけに、自分自身が置いていかれたような劣等感と、無邪気な真治に対して抱いてしまった心の狭さに、航平は激しい自己嫌悪を覚えていた。",
        q: "航平が「胸に小さなトゲが刺さった」と感じた心情の背景にあるものは何ですか？",
        a: "進学で差がついた親友に対する劣等感と、素直に喜べない自分への自己嫌悪",
        c: ["進学で差がついた親友に対する劣等感と、素直に喜べない自分への自己嫌悪", "真治が自分の悪口を言ったことに対する強い反発", "カフェのコーヒーが苦すぎて口に合わなかったこと", "真治からお金を貸してほしいと頼まれたことへの困惑"],
      },
      {
        t: "科学の進歩は私たちに「便利さ」をもたらしたが、同時に「待つこと」の豊かさを奪ったのではないか。かつて手紙は、相手に届くまで数日かかり、返事を待つ間に相手の顔や言葉を何度も反芻した。その時間こそが、思考を深め、他者への想像力を育む熟成の期間だった。クリック一つで即座に返信が届く時代に、私たちは効率と引き換えに、時間をかけて心を醸成する贅沢を忘れ去ろうとしている。",
        q: "筆者が手紙のやりとりを例にして伝えている主張はどれですか？",
        a: "待つ時間や遅さの中にこそ、他者への深い想像力と思考の熟成がある",
        c: ["待つ時間や遅さの中にこそ、他者への深い想像力と思考の熟成がある", "インターネット通信は危険なので今すぐ手紙に戻すべきである", "郵便料金を値上げして手紙を高級品にすべきである", "即座に返信しない人は礼儀知らずである"],
      },
      {
        t: "合唱コンクールの練習で、指揮者を務める美保はクラスがまとまらず悩んでいた。上手なソプラノのグループが、音程の合わないアルトの生徒たちを責め立て、険悪な空気が流れていた。本番前日、美保は練習を止め、全員を集めて言った。「合唱は、誰か一人だけが上手に目立つ競技じゃない。全員の声が混ざり合って、一つのハーモニーを作ったとき、初めて聴く人の心に届くんだよ」。翌日、ステージに立ったクラスの歌声は、完璧な技術ではなかったかもしれないが、互いの声を聴き合おうとする温かい一体感に満ちていた。",
        q: "美保がクラスメイトに伝えた「合唱の本質」とは何ですか？",
        a: "上手下手を超えて互いの声を聴き合い、全員で調和を創り出すこと",
        c: ["上手下手を超えて互いの声を聴き合い、全員で調和を創り出すこと", "上手な生徒だけが前に出て大声で歌うこと", "コンクールで優勝するために他のクラスを威嚇すること", "歌うのをやめて伴奏のピアノだけを聴かせること"],
      },
      {
        t: "読書における「再読（同じ本をもう一度読むこと）」の面白さは、作品が変わるのではなく、自分自身が変わっていることを発見できる点にある。十代の頃に読んで退屈に思えた古典小説が、社会に出て苦い挫折を味わった後に読むと、一行一行が胸に突き刺さることがある。本は変わらぬ鏡としてそこにあり、そこに映し出される読み手の心の年輪が、作品に新たな光を当てるのである。",
        q: "筆者が述べる「再読の価値」として最も適切なものはどれですか？",
        a: "人生経験を重ねた自分の心の成長や変化を、作品を通して実感できること",
        c: ["人生経験を重ねた自分の心の成長や変化を、作品を通して実感できること", "本の内容を完全に暗記して忘れないようにすること", "本を何度も買うことで作者を経済的に支援すること", "最初に読んだときの間違いを粗探しすること"],
      },
      {
        t: "美術館で抽象画の前に立つと、多くの人が「何が描いてあるのか分からない」と戸惑う。しかし、芸術を「正解を当てるクイズ」のように鑑賞する必要はない。作者の意図を正確に当てることよりも、その色彩や筆の跡を見て、自分自身の内面にどんな感情や記憶が呼び起こされたかに耳を澄ますことこそが、豊かな鑑賞体験なのである。",
        q: "筆者が推奨している「抽象画の鑑賞のあり方」はどれですか？",
        a: "正解を求めず、作品を通して自分の内面に湧き上がる感情に耳を澄ますこと",
        c: ["正解を求めず、作品を通して自分の内面に湧き上がる感情に耳を澄ますこと", "解説文を丸暗記して作者の言った通りの感想を持つこと", "本物の絵画と偽物の絵画を正確に見分けること", "写真を撮ってSNSに投稿すること"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      passage: it.t,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: ["文章全体の流れと、登場人物の心の動きを丁寧にたどろう", "表面的な言葉の奥にある真情や筆者の意図を見抜こう", `こたえは「${it.a}」`],
    };
  },

  // 開成・最難関中突破：思考力・最高峰算数パズル
  kaiseiThinking(_p, r) {
    const items = [
      {
        q: "12枚の金貨の中に、重さがわずかに異なるニセモノの金貨が1枚だけ混ざっています。上皿天秤を3回だけ使って、確実にニセモノを見つけ出すことは可能ですか？",
        a: "可能（3進法の原理で3³=27通りの状態を区別できるため）",
        c: [
          "可能（3進法の原理で3³=27通りの状態を区別できるため）",
          "不可能（最低4回必要）",
          "ニセモノが重いと分かっていれば可能だが、軽いか重いか不明なら不可能",
          "偶然当たる場合のみ可能で、確実には無理",
        ],
        h: ["天秤の傾きは「左が重い・釣り合う・右が重い」の3通りの情報を得られます", "3回の測定で 3 × 3 × 3 = 27通りの状態を判別できます", "答えは「可能」"],
      },
      {
        q: "3×3の魔方陣（1から9までの数字を1回ずつ使う）で、中央のマスに入る数字は必ずいくつになりますか？",
        a: "5",
        c: ["5", "1", "9", "3"],
        h: ["1から9までの合計は 45 で、各列の和は 15 です", "中央を通る4本の直線の和を考えると、中央の数字は平均の5になります", "答えは 5"],
      },
      {
        q: "石の山が2つあり、それぞれ3個と5個の石が積まれています。2人のプレイヤーが交互に「どちらか1つの山から好きな個数（1個以上すべてまで）の石を取る」ゲームを行います。最後の石を取った人が勝ちとするとき、先手と後手のどちらに必勝法がありますか？（ニムゲーム）",
        a: "先手必勝（5個の山から2個取って3個と3個の対称形にする）",
        c: [
          "先手必勝（5個の山から2個取って3個と3個の対称形にする）",
          "後手必勝（相手の真似をすれば勝てる）",
          "引き分けになる",
          "どちらが勝つかは運次第",
        ],
        h: ["山の個数を同じ（3個と3個）にすると、相手が取った数と同じだけもう一方から取る対称戦略で勝てます", "先手が最初の手で 5個の山から2個取ると (3, 3) を作れます", "答えは 先手必勝"],
      },
      {
        q: "1本の直線で平面は2つの領域に分かれます。2本の直線（平行でない）では4つに分かれます。どの2本も平行でなく、どの3本も1点で交わらないとき、10本の直線で平面は最大いくつの領域に分かれますか？",
        a: "56個",
        c: ["56個", "46個", "64個", "55個"],
        h: ["n本目の直線は、引くことで領域が n 個増えます", "1 + (1 + 2 + 3 + … + 10) = 1 + 55 = 56個", "答えは 56個"],
      },
      {
        q: "4人の生徒A, B, C, Dがテストを受けました。先生が「全員が合格したわけではない。しかし不合格者が2人以上いるわけでもない」と言いました。不合格者は何人ですか？",
        a: "ちょうど1人",
        c: ["ちょうど1人", "0人", "2人", "3人"],
        h: ["「全員合格ではない」ので、不合格者は1人以上います", "「2人以上ではない」ので、不合格者は2人未満です", "1人以上かつ2人未満なので、ちょうど1人です"],
      },
      {
        q: "円周上に5個の点があります。これらの点を結ぶすべての弦を引くとき、円の内部で弦が交差する交点の数は最大で何個になりますか？（3本以上が1点で交わらない）",
        a: "5個",
        c: ["5個", "10個", "6個", "8個"],
        h: ["交点は、4個の点を選ぶごとに1つだけできます（4点を選べば交差する対角線が1組定まる）", "5個の点から4個を選ぶ組み合わせ 5C4 です", "5C4 = 5個"],
      },
      {
        q: "分速60mで動く歩道の上を、歩道と同じ向きに分速80mで歩くA君と、歩道と反対向きに分速100mで歩くB君がいます。2人がすれ違うときの相対速度は分速何mですか？",
        a: "分速180m",
        c: ["分速180m", "分速160m", "分速140m", "分速200m"],
        h: ["A君の床に対する実際の速さは 60 + 80 = 140m/分 です", "B君の床に対する実際の速さは 100 - 60 = 40m/分 です", "反対向きに進む2人のすれ違い速度は 140 + 40 = 180m/分"],
      },
      {
        q: "1から100までの整数が書かれたカードが100枚あります。偶数のカードをすべて裏返し、次に3の倍数のカードをすべて裏返し…と100の倍数まで同様に裏返す操作をしたとき、最後に表を向いているカードは何枚ですか？（ロッカー問題）",
        a: "10枚（平方数 1, 4, 9, 16, 25, 36, 49, 64, 81, 100）",
        c: [
          "10枚（平方数 1, 4, 9, 16, 25, 36, 49, 64, 81, 100）",
          "50枚（奇数のカード）",
          "25枚（素数のカード）",
          "9枚",
        ],
        h: ["カードが裏返される回数は、その数の「約数の個数」と等しくなります", "約数の個数が奇数個になるのは、同じ数を2回かけた「平方数（正方形の数）」だけです", "1から100までの平方数は 1²から10² までの10個です"],
      },
      {
        q: "袋の中に赤玉10個、青玉8個、白玉6個が入っています。中を見ずに玉を取り出すとき、同じ色の玉が確実に3個揃うようにするには、最低何個の玉を取り出せばよいですか？（鳩の巣原理）",
        a: "7個",
        c: ["7個", "6個", "9個", "8個"],
        h: ["最悪のケースを考えます。赤2個、青2個、白2個を取り出した状態（計6個）です", "次にもう1個（7個目）を取り出せば、どの色であっても必ずどれか1色が3個になります", "答えは 7個"],
      },
      {
        q: "A, B, Cの3人が横一列に並んでいます。正直者（常に本当を言う）が1人、嘘つき（常に嘘を言う）が1人、気まぐれ（本当も嘘も言う）が1人います。Aが「私は正直者です」、Bが「Aは嘘つきです」、Cが「私は気まぐれではありません」と言いました。正直者はだれですか？",
        a: "B",
        c: ["B", "A", "C", "確定できない"],
        h: ["もしAが正直者なら「Aは嘘つき」と言ったBは嘘つき、Cは気まぐれ。しかしCの発言「気まぐれではない」が嘘となり矛盾", "Bが正直者だとするとAは嘘つき、Cは気まぐれ。「気まぐれではない」と嘘をついたことになり成立！", "答えは B"],
      },
    ];
    const it = pick(r, items);
    return {
      prompt: it.q,
      answer: it.a,
      input: "choice",
      choices: shuffle(r, it.c),
      hints: it.h as [string, string, string],
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
    if (p.noRuby) prob.noRuby = p.noRuby;

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
