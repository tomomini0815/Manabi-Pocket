import React from "react";

export type CreatureSubject = "math" | "ja" | "en" | "think" | "special";

export type CreatureData = {
  id: string;
  name: string;
  title: string;
  subject: CreatureSubject;
  subjectLabel: string;
  rarity: 1 | 2 | 3 | 4 | 5;
  description: string;
  personality: string;
  habitat: string;
  favoriteFood: string;
  needClears: number;
};

export const CREATURE_LIST: CreatureData[] = [
  // 算数系
  {
    id: "pikoron",
    name: "ピコロン",
    title: "電脳サイコロうさぎ",
    subject: "math",
    subjectLabel: "さんすう",
    rarity: 1,
    description: "計算が大好きなサイコロうさぎ。耳をピコピコ動かして足し算の答えを計算するよ。",
    personality: "まじめで きちょうめん",
    habitat: "デジタルガーデン",
    favoriteFood: "四角い にんじんグラッセ",
    needClears: 1,
  },
  {
    id: "kakukakun",
    name: "カクカクン",
    title: "きらめく幾何学ドラゴン",
    subject: "math",
    subjectLabel: "さんすう",
    rarity: 2,
    description: "宙に浮かぶ正多面体のクリスタルをまとった小さなドラゴン。きれいな図形を見つけると踊りだす。",
    personality: "好奇心おうせい",
    habitat: "すいしょうの 洞窟",
    favoriteFood: "さんかくの コンペイトウ",
    needClears: 4,
  },
  {
    id: "mechafukuro",
    name: "ギヤ丸",
    title: "からくり時計フクロウ",
    subject: "math",
    subjectLabel: "さんすう",
    rarity: 3,
    description: "胸に金色の歯車を持つ賢いフクロウ。時間の計算や九九がとっても得意で、夜になるとカチカチ鳴くよ。",
    personality: "ものしりで おだやか",
    habitat: "時計台のてっぺん",
    favoriteFood: "ねじ巻きベリー",
    needClears: 9,
  },
  {
    id: "zero_king",
    name: "ゼロキング",
    title: "黄金のすうじ大王",
    subject: "math",
    subjectLabel: "さんすう",
    rarity: 5,
    description: "算数を極めし者にだけ姿を見せる伝説の王様スライム。頭上の王冠とまとうリングが神秘的に光り輝く。",
    personality: "いげんがあるが 優しい",
    habitat: "さんすうの 神殿",
    favoriteFood: "きんぴかドーナツ（0の形）",
    needClears: 18,
  },

  // 国語系
  {
    id: "shioris",
    name: "シオリス",
    title: "本のしおりリス",
    subject: "ja",
    subjectLabel: "こくご",
    rarity: 1,
    description: "しおりのような平べったい尻尾を持つリス。大好きな本のページに挟まって眠るのが日課。",
    personality: "おっとり 読書家",
    habitat: "としょかんの 本棚",
    favoriteFood: "どんぐりの ビスケット",
    needClears: 2,
  },
  {
    id: "kotonoha",
    name: "コトノハ鳥",
    title: "さくら言の葉バード",
    subject: "ja",
    subjectLabel: "こくご",
    rarity: 2,
    description: "桜の花びらのような美しい翼を持つ鳥。美しい言葉を聞くと、羽から甘い香りの花びらを散らす。",
    personality: "おだやかで 優しい",
    habitat: "ことばの桜なみき",
    favoriteFood: "みたらしだんご",
    needClears: 6,
  },
  {
    id: "fudeneko",
    name: "フデネコ",
    title: "墨文字の妖精キャット",
    subject: "ja",
    subjectLabel: "こくご",
    rarity: 3,
    description: "尻尾が大きな筆になっている不思議な白黒猫。地面をトコトコ歩くと可愛い漢字の足跡がつく。",
    personality: "きまぐれな 芸術家",
    habitat: "すずりの 小径",
    favoriteFood: "のり巻きおにぎり",
    needClears: 12,
  },

  // 英語系
  {
    id: "aeropoppo",
    name: "エアロポッポ",
    title: "そらとぶパイロットペンギン",
    subject: "en",
    subjectLabel: "えいご",
    rarity: 1,
    description: "冒険用ゴーグルと小型プロペラリュックを背負ったペンギン。「Hello!」と元気に挨拶しながら世界中を飛ぶ。",
    personality: "元気いっぱいの チャレンジャー",
    habitat: "青空エアポート",
    favoriteFood: "フィッシュ＆チップス",
    needClears: 3,
  },
  {
    id: "starpanda",
    name: "スターパンダ",
    title: "宇宙たんけんパンダ",
    subject: "en",
    subjectLabel: "えいご",
    rarity: 2,
    description: "キラキラ光るヘルメットをかぶった宇宙飛行士パンダ。英語で星たちとおしゃべりできるよ。",
    personality: "マイペースで 夢見がち",
    habitat: "ミルキーウェイステーション",
    favoriteFood: "ほしがた笹キャンディ",
    needClears: 8,
  },
  {
    id: "marinepuffin",
    name: "マリンパフィン",
    title: "七色の潮吹きクジラ",
    subject: "en",
    subjectLabel: "えいご",
    rarity: 4,
    description: "世界中の海を旅する七色のクジラの子。英語の歌を歌うと虹のしぶきを吹き上げて歓迎してくれる。",
    personality: "おおらかで 友達おもい",
    habitat: "グローバルオーシャン",
    favoriteFood: "シーソルトアイス",
    needClears: 15,
  },

  // しこうりょく系
  {
    id: "pazzdra",
    name: "パズドラ",
    title: "ひらめきベビードラゴン",
    subject: "think",
    subjectLabel: "しこうりょく",
    rarity: 2,
    description: "ひらめいた瞬間に頭の上の電球ホーンがピカッと灯るベビードラゴン。難しいパズルほど大好物！",
    personality: "あきらめない 熱血漢",
    habitat: "ひらめきの 火山",
    favoriteFood: "パズルピース型の クッキー",
    needClears: 5,
  },
  {
    id: "cosmofox",
    name: "コズモフォックス",
    title: "星屑の九尾ギツネ",
    subject: "think",
    subjectLabel: "しこうりょく",
    rarity: 4,
    description: "宇宙のちりから生まれた銀河のキツネ。ふわりと揺れる尾の中にきらめく小宇宙を宿している。",
    personality: "しずかで 神秘的",
    habitat: "星降る 丘",
    favoriteFood: "おつきさまの しずく",
    needClears: 14,
  },
  {
    id: "omega_titan",
    name: "オメガタイタン",
    title: "思考の神聖ガーディアン",
    subject: "special",
    subjectLabel: "でんせつ",
    rarity: 5,
    description: "すべての教科と深い思考を極めし者の前に現れる神々しい守護獣。世界の知恵を未来へ繋ぐ力を持つ。",
    personality: "全てをあたたかく 見守る",
    habitat: "天空の まなび庭園",
    favoriteFood: "知恵の 黄金リンゴ",
    needClears: 24,
  },
];

/** 美しく完成度の高いSVGキャラクターイラスト */
export function CreatureVisual({ id, size = 120, className = "" }: { id: string; size?: number; className?: string }) {
  // 1. ピコロン（電脳サイコロうさぎ）
  if (id === "pikoron") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <radialGradient id="pikoBody" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#81E6D9" />
            <stop offset="70%" stopColor="#319795" />
            <stop offset="100%" stopColor="#234E52" />
          </radialGradient>
          <filter id="pikoShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1D4044" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* 影 */}
        <ellipse cx="70" cy="126" rx="38" ry="8" fill="#000000" opacity="0.12" />
        
        {/* 左耳（サイコロアンテナ） */}
        <g transform="rotate(-15 45 40)">
          <rect x="36" y="16" width="22" height="34" rx="10" fill="#4FD1C5" stroke="#234E52" strokeWidth="2.5" />
          <circle cx="47" cy="27" r="3" fill="#FFFFFF" />
          <circle cx="47" cy="38" r="3" fill="#FFFFFF" />
        </g>
        {/* 右耳 */}
        <g transform="rotate(15 95 40)">
          <rect x="82" y="16" width="22" height="34" rx="10" fill="#4FD1C5" stroke="#234E52" strokeWidth="2.5" />
          <circle cx="93" cy="24" r="2.5" fill="#FFFFFF" />
          <circle cx="93" cy="33" r="2.5" fill="#FFFFFF" />
          <circle cx="93" cy="42" r="2.5" fill="#FFFFFF" />
        </g>
        {/* 頭部アンテナ */}
        <line x1="70" y1="45" x2="70" y2="28" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
        <circle cx="70" cy="25" r="5" fill="#F6AD55" stroke="#DD6B20" strokeWidth="2" />

        {/* まあるいボディ */}
        <circle cx="70" cy="82" r="42" fill="url(#pikoBody)" filter="url(#pikoShadow)" stroke="#234E52" strokeWidth="3" />
        {/* お腹の液晶パネル風ホワイトオーバル */}
        <ellipse cx="70" cy="92" rx="22" ry="18" fill="#E6FFFA" stroke="#319795" strokeWidth="1.5" />
        <text x="70" y="98" textAnchor="middle" fontSize="14" fontWeight="900" fill="#234E52">＋ −</text>

        {/* つぶらな瞳 */}
        <circle cx="56" cy="74" r="6" fill="#1A202C" />
        <circle cx="54" cy="72" r="2" fill="#FFFFFF" />
        <circle cx="84" cy="74" r="6" fill="#1A202C" />
        <circle cx="82" cy="72" r="2" fill="#FFFFFF" />

        {/* ほっぺ（ピンクのチーク） */}
        <ellipse cx="46" cy="82" rx="5" ry="3" fill="#FEB2B2" opacity="0.8" />
        <ellipse cx="94" cy="82" rx="5" ry="3" fill="#FEB2B2" opacity="0.8" />

        {/* おくち */}
        <path d="M 66,82 Q 70,86 74,82" fill="none" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" />

        {/* 手足 */}
        <circle cx="40" cy="98" r="7" fill="#4FD1C5" stroke="#234E52" strokeWidth="2" />
        <circle cx="100" cy="98" r="7" fill="#4FD1C5" stroke="#234E52" strokeWidth="2" />
        <ellipse cx="52" cy="122" rx="10" ry="6" fill="#4FD1C5" stroke="#234E52" strokeWidth="2" />
        <ellipse cx="88" cy="122" rx="10" ry="6" fill="#4FD1C5" stroke="#234E52" strokeWidth="2" />
      </svg>
    );
  }

  // 2. カクカクン（幾何学ドラゴン）
  if (id === "kakukakun") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="kakuBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#90CDF4" />
            <stop offset="60%" stopColor="#3182CE" />
            <stop offset="100%" stopColor="#1A365D" />
          </linearGradient>
          <linearGradient id="kakuGem" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEFCBF" />
            <stop offset="50%" stopColor="#F6E05E" />
            <stop offset="100%" stopColor="#D69E2E" />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="36" ry="7" fill="#000000" opacity="0.12" />

        {/* 翼（三角ポリゴン） */}
        <polygon points="35,65 10,40 28,80" fill="#63B3ED" stroke="#1A365D" strokeWidth="2" />
        <polygon points="105,65 130,40 112,80" fill="#63B3ED" stroke="#1A365D" strokeWidth="2" />

        {/* 尻尾 */}
        <path d="M 50,110 Q 30,125 18,116 Q 16,108 26,106" fill="#3182CE" stroke="#1A365D" strokeWidth="2" />
        <polygon points="16,108 8,114 14,122" fill="#F6E05E" stroke="#1A365D" strokeWidth="1.5" />

        {/* ドラゴンの体 */}
        <polygon points="70,42 98,72 88,116 52,116 42,72" fill="url(#kakuBody)" stroke="#1A365D" strokeWidth="2.5" strokeLinejoin="round" />

        {/* 胸のクリスタル（正八面体ダイヤ） */}
        <polygon points="70,72 82,86 70,102 58,86" fill="url(#kakuGem)" stroke="#B7791F" strokeWidth="2" />
        <polygon points="70,72 82,86 70,89" fill="#FFFDF0" opacity="0.8" />

        {/* つの（ポリゴンホーン） */}
        <polygon points="56,44 48,22 62,38" fill="#F6E05E" stroke="#1A365D" strokeWidth="1.5" />
        <polygon points="84,44 92,22 78,38" fill="#F6E05E" stroke="#1A365D" strokeWidth="1.5" />

        {/* 瞳 */}
        <polygon points="54,60 62,64 58,72 50,68" fill="#1A202C" />
        <circle cx="56" cy="64" r="1.5" fill="#FFFFFF" />
        <polygon points="86,60 78,64 82,72 90,68" fill="#1A202C" />
        <circle cx="84" cy="64" r="1.5" fill="#FFFFFF" />

        {/* 小さな手足 */}
        <polygon points="46,116 38,124 50,124" fill="#2B6CB0" stroke="#1A365D" strokeWidth="1.5" />
        <polygon points="94,116 102,124 90,124" fill="#2B6CB0" stroke="#1A365D" strokeWidth="1.5" />
      </svg>
    );
  }

  // 3. ギヤ丸（からくり時計フクロウ）
  if (id === "mechafukuro") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="gearBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9C4221" />
            <stop offset="100%" stopColor="#652B19" />
          </linearGradient>
          <radialGradient id="brassGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FBD38D" />
            <stop offset="60%" stopColor="#D69E2E" />
            <stop offset="100%" stopColor="#744210" />
          </radialGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="36" ry="6" fill="#000000" opacity="0.15" />
        <rect x="42" y="118" width="56" height="8" rx="4" fill="#4A5568" />

        {/* フクロウボディ */}
        <rect x="38" y="44" width="64" height="74" rx="32" fill="url(#gearBody)" stroke="#431407" strokeWidth="3" />

        {/* 耳羽（ぜんまい風） */}
        <path d="M 46,46 Q 38,26 30,34 Q 38,42 42,48" fill="#DD6B20" stroke="#431407" strokeWidth="2" />
        <path d="M 94,46 Q 102,26 110,34 Q 102,42 98,48" fill="#DD6B20" stroke="#431407" strokeWidth="2" />

        {/* 時計レンズの大きな目 */}
        <g filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))">
          {/* 左目 */}
          <circle cx="54" cy="62" r="14" fill="#EDF2F7" stroke="#D69E2E" strokeWidth="2.5" />
          <circle cx="54" cy="62" r="11" fill="#FEFCBF" />
          <circle cx="54" cy="62" r="5" fill="#2D3748" />
          <circle cx="56" cy="60" r="1.5" fill="#FFFFFF" />
          {/* 右目 */}
          <circle cx="86" cy="62" r="14" fill="#EDF2F7" stroke="#D69E2E" strokeWidth="2.5" />
          <circle cx="86" cy="62" r="11" fill="#FEFCBF" />
          <circle cx="86" cy="62" r="5" fill="#2D3748" />
          <circle cx="88" cy="60" r="1.5" fill="#FFFFFF" />
        </g>
        {/* くちばし */}
        <polygon points="70,68 65,77 75,77" fill="#DD6B20" stroke="#431407" strokeWidth="1.5" />

        {/* お腹の動くゴールド歯車 */}
        <g transform="translate(70,96)">
          <circle cx="0" cy="0" r="13" fill="url(#brassGrad)" stroke="#744210" strokeWidth="1.5" />
          {/* 歯車の突起 */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
            <rect
              key={ang}
              x="-2"
              y="-16"
              width="4"
              height="5"
              rx="1"
              fill="#D69E2E"
              stroke="#744210"
              strokeWidth="0.8"
              transform={`rotate(${ang})`}
            />
          ))}
          <circle cx="0" cy="0" r="4" fill="#2D3748" />
          {/* 時計の針 */}
          <line x1="0" y1="0" x2="0" y2="-8" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="6" y2="2" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // 4. ゼロキング（黄金のすうじ大王）
  if (id === "zero_king") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <radialGradient id="kingGold" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFF9DB" />
            <stop offset="35%" stopColor="#F6E05E" />
            <stop offset="75%" stopColor="#D69E2E" />
            <stop offset="100%" stopColor="#744210" />
          </radialGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <ellipse cx="70" cy="126" rx="42" ry="8" fill="#000000" opacity="0.2" />

        {/* 数字「0」の軌道リング（土星の輪風） */}
        <ellipse cx="70" cy="85" rx="58" ry="14" fill="none" stroke="#ECC94B" strokeWidth="4" strokeDasharray="16 4" opacity="0.8" transform="rotate(-12 70 85)" />

        {/* ぷるぷる王様スライムボディ */}
        <path
          d="M 32,88 C 28,60 52,48 70,48 C 88,48 112,60 108,88 C 106,116 88,124 70,124 C 52,124 34,116 32,88 Z"
          fill="url(#kingGold)"
          stroke="#744210"
          strokeWidth="3"
        />

        {/* まばゆい王冠 */}
        <g transform="translate(48, 22)" filter="url(#goldGlow)">
          <polygon points="0,24 8,6 22,18 36,6 44,24" fill="#FEFCBF" stroke="#975A16" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="22" cy="12" r="3.5" fill="#E53E3E" stroke="#9B2C2C" strokeWidth="1" />
          <circle cx="8" cy="6" r="2.5" fill="#3182CE" />
          <circle cx="36" cy="6" r="2.5" fill="#38A169" />
        </g>

        {/* 瞳 */}
        <ellipse cx="56" cy="80" rx="5" ry="7" fill="#2D3748" />
        <circle cx="54" cy="77" r="2" fill="#FFFFFF" />
        <ellipse cx="84" cy="80" rx="5" ry="7" fill="#2D3748" />
        <circle cx="82" cy="77" r="2" fill="#FFFFFF" />

        {/* にっこり */}
        <path d="M 64,90 Q 70,96 76,90" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="46" cy="88" rx="4" ry="2.5" fill="#ED8936" opacity="0.8" />
        <ellipse cx="94" cy="88" rx="4" ry="2.5" fill="#ED8936" opacity="0.8" />

        {/* キラキラ星 */}
        <polygon points="26,45 28,50 33,52 28,54 26,59 24,54 19,52 24,50" fill="#ECC94B" />
        <polygon points="115,40 117,44 121,46 117,48 115,52 113,48 109,46 113,44" fill="#ECC94B" />
      </svg>
    );
  }

  // 5. シオリス（本のしおりリス）
  if (id === "shioris") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="sqBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ED8936" />
            <stop offset="100%" stopColor="#C05621" />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="36" ry="6" fill="#000000" opacity="0.12" />

        {/* 巨大なしおりテール（リボン風） */}
        <path
          d="M 85,95 C 120,95 130,45 110,25 C 95,10 82,30 88,60"
          fill="#FED7D7"
          stroke="#9B2C2C"
          strokeWidth="2.5"
        />
        {/* しおりのリボン切れ込み */}
        <polygon points="110,25 125,15 120,35" fill="#E53E3E" stroke="#9B2C2C" strokeWidth="1.5" />

        {/* 丸い耳 */}
        <circle cx="48" cy="46" r="12" fill="#DD6B20" stroke="#7B341E" strokeWidth="2" />
        <circle cx="48" cy="46" r="7" fill="#FEEBC8" />
        <circle cx="86" cy="46" r="12" fill="#DD6B20" stroke="#7B341E" strokeWidth="2" />
        <circle cx="86" cy="46" r="7" fill="#FEEBC8" />

        {/* リスの顔と体 */}
        <circle cx="67" cy="74" r="32" fill="url(#sqBody)" stroke="#7B341E" strokeWidth="2.5" />
        <ellipse cx="67" cy="85" rx="18" ry="16" fill="#FFFAF0" />

        {/* クリクリおめめ */}
        <circle cx="56" cy="70" r="5.5" fill="#1A202C" />
        <circle cx="54" cy="68" r="2" fill="#FFFFFF" />
        <circle cx="78" cy="70" r="5.5" fill="#1A202C" />
        <circle cx="76" cy="68" r="2" fill="#FFFFFF" />

        {/* お鼻とおくち */}
        <polygon points="67,76 64,73 70,73" fill="#7B341E" />
        <path d="M 64,80 Q 67,83 70,80" fill="none" stroke="#7B341E" strokeWidth="2" strokeLinecap="round" />

        {/* 両手で小さな本を抱きしめている */}
        <g transform="translate(55, 88)">
          <rect x="0" y="0" width="24" height="18" rx="3" fill="#3182CE" stroke="#1A365D" strokeWidth="1.5" />
          <line x1="12" y1="0" x2="12" y2="18" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="-2" cy="8" r="4" fill="#ED8936" stroke="#7B341E" strokeWidth="1.5" />
          <circle cx="26" cy="8" r="4" fill="#ED8936" stroke="#7B341E" strokeWidth="1.5" />
        </g>
      </svg>
    );
  }

  // 6. コトノハ鳥（さくら言の葉バード）
  if (id === "kotonoha") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="sakuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF5F7" />
            <stop offset="50%" stopColor="#FED7E2" />
            <stop offset="100%" stopColor="#F687B3" />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="32" ry="6" fill="#000000" opacity="0.12" />

        {/* 桜の尾羽 */}
        <path d="M 40,88 C 20,88 12,106 18,114 C 28,116 38,104 46,96" fill="#FBB6CE" stroke="#B83280" strokeWidth="2" />
        <path d="M 42,94 C 26,102 24,120 32,122 C 40,122 46,110 50,102" fill="#F687B3" stroke="#B83280" strokeWidth="2" />

        {/* ふわふわ小鳥ボディ */}
        <circle cx="75" cy="75" r="32" fill="url(#sakuraGrad)" stroke="#B83280" strokeWidth="2.5" />

        {/* 桜の花びらの翼 */}
        <path
          d="M 68,70 C 85,70 102,82 96,96 C 82,102 70,88 68,70 Z"
          fill="#ED64A6"
          stroke="#B83280"
          strokeWidth="2"
        />

        {/* 頭の飾り羽（桜の花冠） */}
        <circle cx="72" cy="40" r="5" fill="#FBB6CE" />
        <circle cx="80" cy="38" r="6" fill="#ED64A6" />
        <circle cx="88" cy="42" r="5" fill="#FBB6CE" />
        <circle cx="80" cy="38" r="2" fill="#FEFCBF" />

        {/* 瞳 */}
        <circle cx="86" cy="68" r="4.5" fill="#4A5568" />
        <circle cx="85" cy="66" r="1.5" fill="#FFFFFF" />

        {/* くちばし（若草をくわえる） */}
        <polygon points="98,72 108,76 98,80" fill="#ECC94B" stroke="#B7791F" strokeWidth="1.5" />
        <path d="M 104,76 Q 112,70 118,74" fill="none" stroke="#48BB78" strokeWidth="2" strokeLinecap="round" />
        <circle cx="118" cy="74" r="3" fill="#48BB78" />

        {/* 足 */}
        <line x1="68" y1="107" x2="68" y2="124" stroke="#D69E2E" strokeWidth="2" />
        <line x1="78" y1="107" x2="78" y2="124" stroke="#D69E2E" strokeWidth="2" />
      </svg>
    );
  }

  // 7. フデネコ（墨文字の妖精キャット）
  if (id === "fudeneko") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="brushGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="60%" stopColor="#2D3748" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="36" ry="6" fill="#000000" opacity="0.15" />

        {/* 筆のしっぽ（木軸＋巨大な毛筆） */}
        <g transform="rotate(-25 80 80)">
          <rect x="90" y="40" width="8" height="35" rx="3" fill="#D69E2E" stroke="#744210" strokeWidth="1.5" />
          <path d="M 88,75 Q 94,110 94,115 Q 100,110 100,75 Z" fill="url(#brushGrad)" />
          {/* 筆先のツヤ */}
          <path d="M 94,115 Q 95,110 93,98" stroke="#CBD5E0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* ねこの耳 */}
        <polygon points="44,48 52,26 66,45" fill="#2D3748" stroke="#1A202C" strokeWidth="2" />
        <polygon points="50,45 54,32 62,44" fill="#FEB2B2" />
        <polygon points="96,48 88,26 74,45" fill="#FFFFFF" stroke="#1A202C" strokeWidth="2" />
        <polygon points="90,45 86,32 78,44" fill="#FEB2B2" />

        {/* ねこボディ（白黒ぶち） */}
        <circle cx="70" cy="76" r="32" fill="#FFFFFF" stroke="#1A202C" strokeWidth="2.5" />
        {/* 左顔の黒ぶち模様 */}
        <path d="M 40,68 C 42,50 62,50 68,60 C 62,75 48,82 40,68 Z" fill="#2D3748" />

        {/* ぱっちりエメラルドの瞳 */}
        <ellipse cx="58" cy="72" rx="5.5" ry="7" fill="#48BB78" stroke="#22543D" strokeWidth="1.5" />
        <ellipse cx="58" cy="72" rx="2" ry="6" fill="#1A202C" />
        <circle cx="56" cy="70" r="1.5" fill="#FFFFFF" />

        <ellipse cx="82" cy="72" rx="5.5" ry="7" fill="#48BB78" stroke="#22543D" strokeWidth="1.5" />
        <ellipse cx="82" cy="72" rx="2" ry="6" fill="#1A202C" />
        <circle cx="80" cy="70" r="1.5" fill="#FFFFFF" />

        {/* ひげ */}
        <line x1="42" y1="78" x2="32" y2="76" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="42" y1="82" x2="34" y2="84" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="98" y1="78" x2="108" y2="76" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="98" y1="82" x2="106" y2="84" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round" />

        {/* おくち */}
        <polygon points="70,78 68,76 72,76" fill="#ED64A6" />
        <path d="M 66,81 Q 70,84 74,81" fill="none" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" />

        {/* 前足（ちょこん） */}
        <ellipse cx="60" cy="106" rx="6" ry="8" fill="#FFFFFF" stroke="#1A202C" strokeWidth="2" />
        <ellipse cx="80" cy="106" rx="6" ry="8" fill="#FFFFFF" stroke="#1A202C" strokeWidth="2" />
      </svg>
    );
  }

  // 8. エアロポッポ（パイロットペンギン）
  if (id === "aeropoppo") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <ellipse cx="70" cy="126" rx="36" ry="6" fill="#000000" opacity="0.12" />

        {/* プロペラリュック */}
        <g transform="translate(70,42)">
          <rect x="-8" y="-6" width="16" height="24" rx="4" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
          <ellipse cx="0" cy="-6" rx="20" ry="3" fill="#ECC94B" stroke="#B7791F" strokeWidth="1.5" />
        </g>

        {/* ペンギンボディ（ネイビーブルー） */}
        <ellipse cx="70" cy="80" rx="34" ry="40" fill="#2B6CB0" stroke="#1A365D" strokeWidth="2.5" />
        {/* 白いおなか */}
        <ellipse cx="70" cy="88" rx="22" ry="28" fill="#FFFFFF" />

        {/* パイロットゴーグル */}
        <g transform="translate(70, 56)">
          <rect x="-28" y="-7" width="56" height="14" rx="7" fill="#744210" />
          {/* 左レンズ */}
          <circle cx="-12" cy="0" r="9" fill="#90CDF4" stroke="#ECC94B" strokeWidth="2" />
          <circle cx="-14" cy="-2" r="3" fill="#FFFFFF" opacity="0.8" />
          {/* 右レンズ */}
          <circle cx="12" cy="0" r="9" fill="#90CDF4" stroke="#ECC94B" strokeWidth="2" />
          <circle cx="10" cy="-2" r="3" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* くちばし */}
        <polygon points="70,68 62,77 78,77" fill="#ED8936" stroke="#C05621" strokeWidth="1.5" />

        {/* パタパタ翼 */}
        <path d="M 38,72 Q 22,76 18,88 Q 30,90 38,82" fill="#2B6CB0" stroke="#1A365D" strokeWidth="2" />
        <path d="M 102,72 Q 118,76 122,88 Q 110,90 102,82" fill="#2B6CB0" stroke="#1A365D" strokeWidth="2" />

        {/* 黄色い足 */}
        <ellipse cx="56" cy="120" rx="9" ry="5" fill="#ED8936" stroke="#C05621" strokeWidth="1.5" />
        <ellipse cx="84" cy="120" rx="9" ry="5" fill="#ED8936" stroke="#C05621" strokeWidth="1.5" />
      </svg>
    );
  }

  // 9. スターパンダ（宇宙探検パンダ）
  if (id === "starpanda") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="spaceHelmet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EBF8FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#90CDF4" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="36" ry="6" fill="#000000" opacity="0.12" />

        {/* パンダの黒い丸耳 */}
        <circle cx="44" cy="40" r="11" fill="#1A202C" />
        <circle cx="96" cy="40" r="11" fill="#1A202C" />

        {/* ヘルメット（ガラス球） */}
        <circle cx="70" cy="62" r="38" fill="url(#spaceHelmet)" stroke="#CBD5E0" strokeWidth="2" />

        {/* パンダの顔 */}
        <circle cx="70" cy="64" r="28" fill="#FFFFFF" />

        {/* 目のまわりの黒ぶち */}
        <ellipse cx="58" cy="62" rx="7" ry="9" fill="#1A202C" transform="rotate(-15 58 62)" />
        <circle cx="59" cy="62" r="3" fill="#FFFFFF" />
        <circle cx="60" cy="61" r="1.5" fill="#3182CE" />

        <ellipse cx="82" cy="62" rx="7" ry="9" fill="#1A202C" transform="rotate(15 82 62)" />
        <circle cx="81" cy="62" r="3" fill="#FFFFFF" />
        <circle cx="80" cy="61" r="1.5" fill="#3182CE" />

        {/* 鼻とおくち */}
        <ellipse cx="70" cy="71" rx="3.5" ry="2.5" fill="#1A202C" />
        <path d="M 67,75 Q 70,78 73,75" fill="none" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" />

        {/* 宇宙服のボディ */}
        <rect x="42" y="92" width="56" height="28" rx="14" fill="#EDF2F7" stroke="#CBD5E0" strokeWidth="2" />
        {/* 胸のエンブレム（星マーク） */}
        <circle cx="70" cy="106" r="7" fill="#3182CE" />
        <polygon points="70,102 71.5,105 75,105 72,107 73,110 70,108 67,110 68,107 65,105 68.5,105" fill="#ECC94B" />

        {/* 黒い腕と足 */}
        <circle cx="36" cy="102" r="7" fill="#1A202C" />
        <circle cx="104" cy="102" r="7" fill="#1A202C" />
        <ellipse cx="55" cy="122" rx="8" ry="6" fill="#1A202C" />
        <ellipse cx="85" cy="122" rx="8" ry="6" fill="#1A202C" />
      </svg>
    );
  }

  // 10. マリンパフィン（七色の潮吹きクジラ）
  if (id === "marinepuffin") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="whaleGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#4FD1C5" />
            <stop offset="50%" stopColor="#63B3ED" />
            <stop offset="100%" stopColor="#7F9CF5" />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="40" ry="7" fill="#000000" opacity="0.12" />

        {/* 七色の潮吹き（レインボースプラッシュ） */}
        <g transform="translate(68, 22)">
          <path d="M 0,20 Q -15,0 -24,8" fill="none" stroke="#FC8181" strokeWidth="3" strokeLinecap="round" />
          <path d="M 0,20 Q -5,-5 -6,2" fill="none" stroke="#F6E05E" strokeWidth="3" strokeLinecap="round" />
          <path d="M 0,20 Q 5,-5 6,2" fill="none" stroke="#68D391" strokeWidth="3" strokeLinecap="round" />
          <path d="M 0,20 Q 15,0 24,8" fill="none" stroke="#63B3ED" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-24" cy="8" r="2.5" fill="#FC8181" />
          <circle cx="24" cy="8" r="2.5" fill="#63B3ED" />
        </g>

        {/* クジラのふっくらボディ */}
        <path
          d="M 24,85 C 24,55 60,45 88,48 C 114,50 126,75 120,95 C 112,112 50,115 24,85 Z"
          fill="url(#whaleGrad)"
          stroke="#2B6CB0"
          strokeWidth="2.5"
        />
        {/* お腹の蛇腹模様 */}
        <path d="M 40,88 C 48,106 82,108 105,94" fill="#EBF8FF" stroke="#3182CE" strokeWidth="1.5" />

        {/* クジラの尾ビレ */}
        <path d="M 26,82 C 10,75 4,68 8,60 C 14,75 22,78 26,82 Z" fill="#63B3ED" stroke="#2B6CB0" strokeWidth="2" />
        <path d="M 26,82 C 10,88 4,96 8,104 C 14,88 22,86 26,82 Z" fill="#63B3ED" stroke="#2B6CB0" strokeWidth="2" />

        {/* つぶらな目 */}
        <circle cx="95" cy="68" r="4.5" fill="#1A202C" />
        <circle cx="94" cy="66" r="1.5" fill="#FFFFFF" />

        {/* にっこり口 */}
        <path d="M 88,78 Q 98,84 108,76" fill="none" stroke="#2B6CB0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="86" cy="76" r="3" fill="#FEB2B2" opacity="0.8" />

        {/* ヒレ */}
        <path d="M 62,88 Q 50,102 60,106 Q 70,102 68,90" fill="#4FD1C5" stroke="#2B6CB0" strokeWidth="2" />
      </svg>
    );
  }

  // 11. パズドラ（ひらめきベビードラゴン）
  if (id === "pazzdra") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="fireBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEB2B2" />
            <stop offset="50%" stopColor="#F56565" />
            <stop offset="100%" stopColor="#C53030" />
          </linearGradient>
          <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFF0" />
            <stop offset="60%" stopColor="#ECC94B" />
            <stop offset="100%" stopColor="#DD6B20" />
          </radialGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="36" ry="6" fill="#000000" opacity="0.15" />

        {/* 頭上のピカッと電球ホーン */}
        <g transform="translate(70, 28)">
          <path d="M -8,12 C -12,2 -4,-6 0,-6 C 4,-6 12,2 8,12 Z" fill="url(#bulbGlow)" stroke="#C05621" strokeWidth="1.5" />
          <rect x="-4" y="12" width="8" height="5" rx="1" fill="#CBD5E0" />
          {/* 光のスパーク */}
          <line x1="-12" y1="-2" x2="-18" y2="-6" stroke="#ECC94B" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="-2" x2="18" y2="-6" stroke="#ECC94B" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="-10" x2="0" y2="-16" stroke="#ECC94B" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* 小さなドラゴンの羽 */}
        <path d="M 46,74 Q 20,60 26,45 Q 40,55 46,65" fill="#ED8936" stroke="#9C4221" strokeWidth="2" />
        <path d="M 94,74 Q 120,60 114,45 Q 100,55 94,65" fill="#ED8936" stroke="#9C4221" strokeWidth="2" />

        {/* ドラゴンの頭と体 */}
        <circle cx="70" cy="74" r="32" fill="url(#fireBody)" stroke="#9B2C2C" strokeWidth="2.5" />
        <ellipse cx="70" cy="85" rx="18" ry="16" fill="#FEEBC8" stroke="#DD6B20" strokeWidth="1.5" />

        {/* まんまる瞳 */}
        <circle cx="56" cy="68" r="6" fill="#2D3748" />
        <circle cx="54" cy="66" r="2" fill="#FFFFFF" />
        <circle cx="84" cy="68" r="6" fill="#2D3748" />
        <circle cx="82" cy="66" r="2" fill="#FFFFFF" />

        {/* 元気な八重歯とおくち */}
        <path d="M 64,78 Q 70,86 76,78" fill="#C53030" stroke="#9B2C2C" strokeWidth="1.5" />
        <polygon points="66,78 68,82 70,78" fill="#FFFFFF" />

        {/* 尻尾のパズルピース */}
        <path d="M 88,96 Q 110,110 118,102" fill="none" stroke="#C53030" strokeWidth="5" strokeLinecap="round" />
        <rect x="112" y="94" width="12" height="12" rx="2" fill="#ECC94B" stroke="#B7791F" strokeWidth="1.5" />
      </svg>
    );
  }

  // 12. コズモフォックス（星屑の九尾ギツネ）
  if (id === "cosmofox") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="cosmoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D6BCFA" />
            <stop offset="50%" stopColor="#805AD5" />
            <stop offset="100%" stopColor="#322659" />
          </linearGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="42" ry="7" fill="#000000" opacity="0.15" />

        {/* 星屑の九尾（オーロラテール） */}
        <g opacity="0.85">
          <path d="M 70,95 Q 30,110 15,90 Q 25,75 55,88" fill="#9F7AEA" />
          <path d="M 70,95 Q 110,110 125,90 Q 115,75 85,88" fill="#9F7AEA" />
          <path d="M 70,95 Q 20,85 10,65 Q 30,55 58,80" fill="#B794F4" />
          <path d="M 70,95 Q 120,85 130,65 Q 110,55 82,80" fill="#B794F4" />
          <circle cx="15" cy="90" r="2.5" fill="#FEFCBF" />
          <circle cx="125" cy="90" r="2.5" fill="#FEFCBF" />
          <circle cx="10" cy="65" r="2" fill="#FEFCBF" />
          <circle cx="130" cy="65" r="2" fill="#FEFCBF" />
        </g>

        {/* キツネの尖った耳 */}
        <polygon points="46,55 36,24 62,42" fill="#6B46C1" stroke="#322659" strokeWidth="2" />
        <polygon points="44,48 40,30 54,42" fill="#FEFCBF" />
        <polygon points="94,55 104,24 78,42" fill="#6B46C1" stroke="#322659" strokeWidth="2" />
        <polygon points="96,48 100,30 86,42" fill="#FEFCBF" />

        {/* キツネフェイス */}
        <polygon points="70,94 42,60 98,60" fill="url(#cosmoGrad)" stroke="#322659" strokeWidth="2.5" strokeLinejoin="round" />
        {/* 白い頬毛 */}
        <polygon points="70,94 44,68 56,60" fill="#FAF5FF" />
        <polygon points="70,94 96,68 84,60" fill="#FAF5FF" />

        {/* 額の三日月シンボル */}
        <path d="M 68,50 A 4 4 0 0 0 72,58 A 3 3 0 0 1 68,50" fill="#F6E05E" />

        {/* 神秘的な金の瞳 */}
        <polygon points="56,68 62,66 60,72" fill="#ECC94B" />
        <circle cx="58" cy="68" r="1.5" fill="#2D3748" />
        <polygon points="84,68 78,66 80,72" fill="#ECC94B" />
        <circle cx="82" cy="68" r="1.5" fill="#2D3748" />

        {/* 鼻 */}
        <polygon points="70,92 68,89 72,89" fill="#1A202C" />
      </svg>
    );
  }

  // 13. オメガタイタン（思考の神聖ガーディアン）
  if (id === "omega_titan") {
    return (
      <svg width={size} height={size} viewBox="0 0 140 140" className={`select-none ${className}`}>
        <defs>
          <linearGradient id="titanGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="40%" stopColor="#ECC94B" />
            <stop offset="100%" stopColor="#B7791F" />
          </linearGradient>
          <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEFCBF" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#F6AD55" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C05621" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="70" cy="126" rx="44" ry="8" fill="#000000" opacity="0.2" />

        {/* 神聖な光の光背（ヘイローリング） */}
        <circle cx="70" cy="60" r="48" fill="url(#haloGlow)" />
        <circle cx="70" cy="60" r="42" fill="none" stroke="#ECC94B" strokeWidth="2.5" strokeDasharray="6 6" />

        {/* 巨大な黄金の翼 */}
        <path d="M 50,65 C 20,40 10,15 28,10 C 44,20 48,50 50,65 Z" fill="url(#titanGold)" stroke="#744210" strokeWidth="2" />
        <path d="M 90,65 C 120,40 130,15 112,10 C 96,20 92,50 90,65 Z" fill="url(#titanGold)" stroke="#744210" strokeWidth="2" />

        {/* 守護獣ボディ（白銀×黄金） */}
        <polygon points="70,38 96,65 84,116 56,116 44,65" fill="#FFFFFF" stroke="#744210" strokeWidth="2.5" strokeLinejoin="round" />

        {/* 胸のオメガエンブレム（Ω） */}
        <g transform="translate(70, 85)">
          <circle cx="0" cy="0" r="14" fill="#FEFCBF" stroke="#975A16" strokeWidth="2" />
          <text x="0" y="7" textAnchor="middle" fontSize="18" fontWeight="900" fill="#744210">Ω</text>
        </g>

        {/* 黄金の兜と角 */}
        <polygon points="70,22 84,40 56,40" fill="url(#titanGold)" stroke="#744210" strokeWidth="2" />
        <polygon points="46,38 32,24 48,32" fill="#ECC94B" stroke="#744210" strokeWidth="1.5" />
        <polygon points="94,38 108,24 92,32" fill="#ECC94B" stroke="#744210" strokeWidth="1.5" />

        {/* 凛々しい瞳 */}
        <polygon points="56,58 64,56 62,64" fill="#3182CE" />
        <circle cx="58" cy="58" r="1" fill="#FFFFFF" />
        <polygon points="84,58 76,56 78,64" fill="#3182CE" />
        <circle cx="82" cy="58" r="1" fill="#FFFFFF" />

        {/* 足元 */}
        <rect x="52" y="116" width="12" height="8" rx="3" fill="#D69E2E" stroke="#744210" strokeWidth="1.5" />
        <rect x="76" y="116" width="12" height="8" rx="3" fill="#D69E2E" stroke="#744210" strokeWidth="1.5" />
      </svg>
    );
  }

  // デフォルトフォールバック
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="40" fill="#E2E8F0" stroke="#718096" strokeWidth="3" />
      <text x="50" y="58" textAnchor="middle" fontSize="24" fill="#4A5568" fontWeight="bold">？</text>
    </svg>
  );
}

/** 孵化前のタマゴビジュアル */
export function MysteryEgg({
  subject,
  progress,
  size = 140,
  isCracking = false,
}: {
  subject: CreatureSubject;
  progress: number; // 0 to 100
  size?: number;
  isCracking?: boolean;
}) {
  const eggColor =
    subject === "math"
      ? { from: "#EBF8FF", mid: "#90CDF4", to: "#3182CE", spot: "#2B6CB0" }
      : subject === "ja"
      ? { from: "#FFF5F5", mid: "#FEB2B2", to: "#E53E3E", spot: "#C53030" }
      : subject === "en"
      ? { from: "#F0FFF4", mid: "#9AE6B4", to: "#38A169", spot: "#276749" }
      : { from: "#FAF5FF", mid: "#D6BCFA", to: "#805AD5", spot: "#553C9A" };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 160"
      className={`select-none transition-transform duration-300 ${
        isCracking ? "animate-bounce scale-110" : progress >= 100 ? "animate-pulse" : ""
      }`}
    >
      <defs>
        <radialGradient id={`eggGrad-${subject}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={eggColor.from} />
          <stop offset="50%" stopColor={eggColor.mid} />
          <stop offset="100%" stopColor={eggColor.to} />
        </radialGradient>
        <filter id="eggShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* 影 */}
      <ellipse cx="70" cy="148" rx="42" ry="9" fill="#000000" opacity="0.15" />

      {/* タマゴ本体（滑らかなたまご型ベジェ曲線） */}
      <path
        d="M 70,16 C 105,16 122,65 122,100 C 122,130 98,144 70,144 C 42,144 18,130 18,100 C 18,65 35,16 70,16 Z"
        fill={`url(#eggGrad-${subject})`}
        stroke={eggColor.spot}
        strokeWidth="3.5"
        filter="url(#eggShadow)"
      />

      {/* タマゴの可愛い水玉模様 */}
      <circle cx="50" cy="65" r="9" fill="#FFFFFF" opacity="0.6" />
      <circle cx="92" cy="78" r="11" fill="#FFFFFF" opacity="0.5" />
      <circle cx="62" cy="115" r="12" fill="#FFFFFF" opacity="0.4" />
      <circle cx="42" cy="120" r="6" fill="#FFFFFF" opacity="0.5" />
      <circle cx="80" cy="40" r="7" fill="#FFFFFF" opacity="0.5" />

      {/* ハイライト */}
      <path
        d="M 40,35 C 55,24 75,24 85,28"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* ひび割れ（進捗80%以上または孵化時） */}
      {(progress >= 80 || isCracking) && (
        <path
          d="M 70,60 L 64,72 L 76,82 L 68,98 L 74,110"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
