const fs = require('fs');
const path = require('path');

// 1. 辞書と単漢字マップを読み込み
const dict = require('../src/data/furigana-dictionary.json');
const singleKanji = require('../src/data/kanji-single-map.json');

// 最長一致用のルールソート
const KANJI_RULES = dict.sort(
  (a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0], 'ja')
);
const escapedRules = KANJI_RULES.map(([pat]) => pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const DICT_REGEX = new RegExp(
  `(\\[([^\\]|]+)\\|([^\\]]+)\\])|(${escapedRules.join('|')})`,
  'g'
);
const RULE_MAP = new Map();
for (const r of KANJI_RULES) {
  if (!RULE_MAP.has(r[0])) RULE_MAP.set(r[0], r);
}

// 2. 全テキストの収集
const allTexts = new Set();

function extractStrings(obj) {
  if (typeof obj === 'string') {
    if (/[\u4e00-\u9faf]/.test(obj)) allTexts.add(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(extractStrings);
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(extractStrings);
  }
}

// curriculum.json & thinking-problems.json
extractStrings(require('../src/data/curriculum.json'));
extractStrings(require('../src/data/thinking-problems.json'));

// generators.ts
const genCode = fs.readFileSync(path.join(__dirname, '../src/lib/generators.ts'), 'utf8');
const strRegex = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
let m;
while ((m = strRegex.exec(genCode)) !== null) {
  const str = m[2];
  if (str && /[\u4e00-\u9faf]/.test(str)) {
    allTexts.add(str);
  }
}

console.log('Total texts with kanji:', allTexts.size);

// 3. テキストごとに、ルビ付与のシミュレーションを行い、
// (A) 辞書にヒットせず単漢字フォールバックされた連続漢字（熟語）
// (B) 送り仮名巻き込み等の怪しい分割
// を検出する
const kanjiCompoundRegex = /[\u4e00-\u9faf]{2,}/g;
const suspiciousCompounds = new Map(); // compound -> count

for (const text of allTexts) {
  // 手動タグを除外
  const cleanText = text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, ' ');

  // 最長一致でマッチした領域をマスクする
  DICT_REGEX.lastIndex = 0;
  let match;
  let lastIdx = 0;
  const unhandledIntervals = [];

  while ((match = DICT_REGEX.exec(cleanText)) !== null) {
    if (match.index > lastIdx) {
      unhandledIntervals.push(cleanText.slice(lastIdx, match.index));
    }
    lastIdx = DICT_REGEX.lastIndex;
  }
  if (lastIdx < cleanText.length) {
    unhandledIntervals.push(cleanText.slice(lastIdx));
  }

  // マッチしなかった区間にある2文字以上の漢字（＝単漢字フォールバックに落ちている熟語！）を抽出
  for (const interval of unhandledIntervals) {
    let cm;
    while ((cm = kanjiCompoundRegex.exec(interval)) !== null) {
      const compound = cm[0];
      suspiciousCompounds.set(compound, (suspiciousCompounds.get(compound) || 0) + 1);
    }
  }
}

console.log('Found', suspiciousCompounds.size, 'kanji compounds falling back to single kanji!');
const sorted = Array.from(suspiciousCompounds.entries()).sort((a, b) => b[1] - a[1]);
fs.writeFileSync(path.join(__dirname, 'unhandled_compounds.json'), JSON.stringify(sorted, null, 2), 'utf8');
console.log('Top 30 unhandled compounds:');
console.log(sorted.slice(0, 30));
