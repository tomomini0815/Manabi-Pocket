import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KidShell, useRequireChild } from "@/components/KidShell";
import { Pocket } from "@/components/Pocket";
import { Confetti } from "@/components/Confetti";
import {
  CREATURE_LIST,
  CreatureData,
  CreatureVisual,
  MysteryEgg,
  CreatureSubject,
} from "@/components/Creatures";
import { growthStage, studyDays, useApp, dayKey } from "@/lib/store";
import { playTone } from "@/lib/sound";
import { Sparkles, Calendar, Heart, X, BookOpen, Star, HelpCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "ごほうび・生き物図鑑｜まなびポケット" },
      { name: "description", content: "ふしぎなタマゴをあたためて、生き物たちを図鑑にあつめよう！" },
    ],
  }),
  component: Rewards,
});

const STAGES = [
  { need: 0, name: "たね", desc: "土の中で すやすや 眠っているよ🌱" },
  { need: 3, name: "め", desc: "小さな 可愛い めが 出てきたよ🌿" },
  { need: 10, name: "き", desc: "ぐんぐん 大きな 木に 育ったよ🌳" },
  { need: 25, name: "み", desc: "美味しそうな 実が たくさん なったよ🍎" },
];

const POCKET_VOICES = [
  "なでてくれて ありがとう！💖",
  "きょうも いっしょに まなぼうね！✨",
  "どんどん そだってきたよ！🌱",
  "いつも おうえん してるよ！⭐",
  "ぴょん！たのしいな！🎉",
];

const SUBJECT_TABS: { id: "all" | CreatureSubject; label: string; icon: string }[] = [
  { id: "all", label: "ぜんぶ", icon: "✨" },
  { id: "math", label: "さんすう", icon: "🔢" },
  { id: "ja", label: "こくご", icon: "📖" },
  { id: "en", label: "えいご", icon: "🔤" },
  { id: "think", label: "しこう", icon: "🧩" },
];

// プレミアムスタンプ（立体的な朱肉花丸／ゴールドクラウン）
function PremiumStamp({
  count = 1,
  size = 46,
  rotation = 0,
}: {
  count?: number;
  size?: number;
  rotation?: number;
}) {
  const isGold = count >= 2;

  if (isGold) {
    // 2回以上学習：ゴールド・プレミアムクラウンスタンプ
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation}deg)` }}
        className="select-none filter drop-shadow-sm transition-transform hover:scale-110 duration-200"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9DB" />
            <stop offset="25%" stopColor="#F6E05E" />
            <stop offset="50%" stopColor="#ECC94B" />
            <stop offset="75%" stopColor="#D69E2E" />
            <stop offset="100%" stopColor="#B7791F" />
          </linearGradient>
          <radialGradient id="goldGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FEFCBF" />
            <stop offset="70%" stopColor="#D69E2E" />
            <stop offset="100%" stopColor="#975A16" />
          </radialGradient>
        </defs>

        {/* 外枠のギザギザ・メダルリボン */}
        <circle cx="50" cy="50" r="46" fill="url(#goldGrad)" stroke="#975A16" strokeWidth="2" />
        <circle cx="50" cy="50" r="41" fill="#744210" opacity="0.15" />
        <circle cx="50" cy="50" r="39" fill="url(#goldGlow)" stroke="#FFF" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* 月桂樹（ローレル）の葉 */}
        <g stroke="#744210" strokeWidth="1.5" fill="#FFF9DB" opacity="0.9">
          <ellipse cx="24" cy="50" rx="4" ry="7" transform="rotate(-30 24 50)" />
          <ellipse cx="28" cy="65" rx="4" ry="6" transform="rotate(-50 28 65)" />
          <ellipse cx="76" cy="50" rx="4" ry="7" transform="rotate(30 76 50)" />
          <ellipse cx="72" cy="65" rx="4" ry="6" transform="rotate(50 72 65)" />
        </g>

        {/* 王冠（クラウン） */}
        <path
          d="M 32,58 L 30,40 L 40,48 L 50,33 L 60,48 L 70,40 L 68,58 Z"
          fill="#FFFDF0"
          stroke="#744210"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="30" cy="38" r="2.5" fill="#E53E3E" />
        <circle cx="50" cy="31" r="3" fill="#3182CE" />
        <circle cx="70" cy="38" r="2.5" fill="#E53E3E" />

        {/* GREAT! テキスト */}
        <text
          x="50"
          y="74"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          fill="#543109"
          letterSpacing="0.5"
        >
          GREAT!
        </text>

        {/* 星屑のきらめき */}
        <polygon points="50,14 52,19 57,20 53,23 54,28 50,25 46,28 47,23 43,20 48,19" fill="#FFF" />
      </svg>
    );
  }

  // 1回学習：プレミアム桜花丸朱肉スタンプ
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: `rotate(${rotation}deg)` }}
      className="select-none filter drop-shadow-sm transition-transform hover:scale-110 duration-200"
    >
      <defs>
        <radialGradient id="stampRedGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FC8181" />
          <stop offset="35%" stopColor="#E53E3E" />
          <stop offset="85%" stopColor="#C53030" />
          <stop offset="100%" stopColor="#9B2C2C" />
        </radialGradient>
      </defs>

      {/* 桜の10重花びら外枠 */}
      <path
        d="M 50,8
           C 56,8 60,15 65,13 C 71,11 74,18 78,22 C 83,26 89,27 91,33 C 93,39 88,44 91,50
           C 93,56 88,61 91,67 C 89,73 83,74 78,78 C 74,82 71,89 65,87 C 60,85 56,92 50,92
           C 44,92 40,85 35,87 C 29,89 26,82 22,78 C 17,74 11,73 9,67 C 7,61 12,56 9,50
           C 7,44 12,39 9,33 C 11,27 17,26 22,22 C 26,18 29,11 35,13 C 40,15 44,8 50,8 Z"
        fill="url(#stampRedGrad)"
        stroke="#742A2A"
        strokeWidth="2.5"
      />

      {/* 内側の白抜きサークルライン */}
      <circle cx="50" cy="50" r="33" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.85" strokeDasharray="4 2" />

      {/* 花丸の渦巻き（立体ライン） */}
      <path
        d="M 32,54
           C 30,36 46,26 58,32
           C 70,38 72,56 58,66
           C 48,74 38,68 40,56
           C 42,46 54,44 60,50"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* キラッと光る星 */}
      <circle cx="50" cy="50" r="3.5" fill="#FEFCBF" />
      <circle cx="28" cy="30" r="2.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="72" cy="30" r="2.5" fill="#FFFFFF" opacity="0.9" />
      <circle cx="70" cy="70" r="2" fill="#FFFFFF" opacity="0.8" />
      <circle cx="30" cy="70" r="2" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

export function Rewards() {
  const child = useRequireChild();
  const sessions = useApp((s) => s.sessions);
  const attempts = useApp((s) => s.attempts);

  // ぽけっと用状態
  const [pocketHappy, setPocketHappy] = useState(false);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ dateStr: string; studied: boolean; count: number } | null>(null);

  // 図鑑用状態
  const [filterSubject, setFilterSubject] = useState<"all" | CreatureSubject>("all");
  const [selectedCreature, setSelectedCreature] = useState<CreatureData | null>(null);
  const [isEggCracking, setIsEggCracking] = useState(false);
  const [isEggWobbling, setIsEggWobbling] = useState(false);
  const [eggFeedback, setEggFeedback] = useState<string | null>(null);
  const [hatchedCreature, setHatchedCreature] = useState<CreatureData | null>(null);

  if (!child) return null;

  const mine = sessions.filter((s) => s.childId === child.id);
  const ma = attempts.filter((a) => a.childId === child.id);
  const totalCount = mine.length + ma.length;
  const currentStage = growthStage(totalCount);
  const days = studyDays(child.id, sessions, attempts);

  const nextStage = STAGES[currentStage + 1];
  const progressToNext = nextStage
    ? Math.min(100, Math.round(((totalCount - STAGES[currentStage]!.need) / (nextStage.need - STAGES[currentStage]!.need)) * 100))
    : 100;

  // 各教科のクリア回数
  const mathClears = mine.filter((s) => s.subjectId === "math").length;
  const jaClears = mine.filter((s) => s.subjectId === "ja").length;
  const enClears = mine.filter((s) => s.subjectId === "en").length;
  const thinkClears = ma.length;

  // 各生き物のアンロック判定
  const getClearsForSubject = (subj: CreatureSubject) => {
    switch (subj) {
      case "math":
        return mathClears;
      case "ja":
        return jaClears;
      case "en":
        return enClears;
      case "think":
        return thinkClears;
      case "special":
        return totalCount;
    }
  };

  const unlockedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    CREATURE_LIST.forEach((c) => {
      const current = getClearsForSubject(c.subject);
      map.set(c.id, current >= c.needClears);
    });
    return map;
  }, [mathClears, jaClears, enClears, thinkClears, totalCount]);

  const unlockedCount = useMemo(() => {
    return CREATURE_LIST.filter((c) => unlockedMap.get(c.id)).length;
  }, [unlockedMap]);

  // 次に孵化する「いま温めているタマゴ」を決定
  const targetCreature = useMemo(() => {
    const lockedList = CREATURE_LIST.filter((c) => !unlockedMap.get(c.id));
    if (lockedList.length === 0) return null;
    // 最も現在のクリア数との差が小さい（進捗率が高い）生き物をターゲット
    let best = lockedList[0]!;
    let bestRatio = -1;
    for (const c of lockedList) {
      const current = getClearsForSubject(c.subject);
      const ratio = current / c.needClears;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = c;
      }
    }
    return best;
  }, [unlockedMap, mathClears, jaClears, enClears, thinkClears, totalCount]);

  const eggProgress = useMemo(() => {
    if (!targetCreature) return 100;
    const current = getClearsForSubject(targetCreature.subject);
    return Math.min(100, Math.round((current / targetCreature.needClears) * 100));
  }, [targetCreature, mathClears, jaClears, enClears, thinkClears, totalCount]);

  const remainingClears = useMemo(() => {
    if (!targetCreature) return 0;
    const current = getClearsForSubject(targetCreature.subject);
    return Math.max(0, targetCreature.needClears - current);
  }, [targetCreature, mathClears, jaClears, enClears, thinkClears, totalCount]);

  // 過去28日間のスタンプシート
  const cells = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (27 - i));
      const key = dayKey(d.getTime());
      const isToday = i === 27;
      const countOnDay = [...mine, ...ma].filter((x) => dayKey(x.at) === key).length;
      return {
        key,
        day: d.getDate(),
        dateStr: `${d.getMonth() + 1}月${d.getDate()}日`,
        isToday,
        countOnDay,
        studied: days.has(key),
      };
    });
  }, [mine, ma, days]);

  const handleTouchPocket = () => {
    playTone("correct");
    setPocketHappy(true);
    setVoiceIndex((prev) => (prev + 1) % POCKET_VOICES.length);
    setTimeout(() => setPocketHappy(false), 800);
  };

  const handleFeedSnack = () => {
    playTone("fanfare");
    setPocketHappy(true);
    setShowConfetti(true);
    setTimeout(() => {
      setPocketHappy(false);
      setShowConfetti(false);
    }, 1200);
  };

  // タマゴをタップしたときの処理
  const handleTapEgg = () => {
    if (!targetCreature) return;

    // まだ温め途中（残り回数がある）の場合は割れない！
    if (remainingClears > 0) {
      playTone("retry");
      setIsEggWobbling(true);
      setEggFeedback(`コツコツ… あと ${remainingClears}回 勉強すると生まれるよ！`);
      setTimeout(() => setIsEggWobbling(false), 500);
      setTimeout(() => setEggFeedback(null), 2500);
      return;
    }

    // 温め完了時（残り0回）のみ割れて誕生モーダルが出る！
    playTone("correct");
    setIsEggCracking(true);

    setTimeout(() => {
      setIsEggCracking(false);
      playTone("fanfare");
      setShowConfetti(true);
      setHatchedCreature(targetCreature);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 1200);
  };

  // フィルタした図鑑リスト
  const filteredCreatures = useMemo(() => {
    if (filterSubject === "all") return CREATURE_LIST;
    return CREATURE_LIST.filter((c) => c.subject === filterSubject || (filterSubject === "think" && c.subject === "special"));
  }, [filterSubject]);

  return (
    <KidShell
      header={
        <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap overflow-hidden">
          <h1 className="text-base sm:text-2xl font-black text-foreground shrink-0">
            ごほうび図鑑
          </h1>
          <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold border border-amber-300/60 shrink-0">
            {unlockedCount}/{CREATURE_LIST.length}種 発見
          </span>
          <span className="hidden sm:inline-block text-xs sm:text-sm font-bold text-muted-foreground shrink-0">
            がくしゅう日数：<span className="text-primary font-black text-sm sm:text-base">{days.size}</span>日
          </span>
        </div>
      }
    >
      {showConfetti && <Confetti />}

      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-8 sm:pb-12">
        {/* 1. いま温めているふしぎなタマゴ */}
        <section className="clay-card p-4 sm:p-7 relative overflow-hidden bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] border border-amber-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            {/* 左側：タマゴのビジュアルとインタラクション */}
            <div className="flex flex-col items-center text-center">
              <div
                onClick={handleTapEgg}
                className={`relative cursor-pointer transition-transform duration-300 ${
                  isEggWobbling
                    ? "rotate-6 scale-105"
                    : "hover:scale-105 active:scale-95"
                }`}
                title={remainingClears === 0 ? "タップしてタマゴを割ろう！" : "タマゴをあたためる（タップでコツコツ）"}
              >
                <MysteryEgg
                  subject={targetCreature ? targetCreature.subject : "special"}
                  progress={eggProgress}
                  isCracking={isEggCracking}
                  size={135}
                />
                {remainingClears === 0 && targetCreature && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-md animate-bounce whitespace-nowrap">
                    パカッ！とタップ
                  </div>
                )}
              </div>
              {eggFeedback ? (
                <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full mt-1.5 animate-bounce whitespace-nowrap shadow-xs">
                  {eggFeedback}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-muted-foreground mt-1.5 whitespace-nowrap">
                  {targetCreature ? `【${targetCreature.subjectLabel}のタマゴ】` : "すべてのタマゴが孵化！"}
                </span>
              )}
            </div>

            {/* 右側：孵化までの進捗・エネルギー */}
            <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
              <div>
                <span className="inline-block text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200/60 mb-1 whitespace-nowrap">
                  🐣 いま温めているタマゴ
                </span>
                <h2 className="text-sm sm:text-xl font-black text-foreground leading-snug">
                  {targetCreature ? (
                    remainingClears === 0 ? (
                      <span className="text-primary">エネルギー満タン！タップして割ろう！</span>
                    ) : (
                      <>
                        あと <span className="text-lg sm:text-2xl text-primary font-black">{remainingClears}</span> 回{" "}
                        <span className="text-amber-800">「{targetCreature.subjectLabel}」</span> で誕生！
                      </>
                    )
                  ) : (
                    "すべての生き物を発見！おめでとう！"
                  )}
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {targetCreature
                    ? `勉強エネルギーがたまると、殻にヒビが入って仲間が増えるよ。`
                    : "きみはまなびマスターだ！これからも楽しく続けよう！"}
                </p>
              </div>

              {/* エネルギーゲージ */}
              <div className="p-3 sm:p-3.5 clay-inset rounded-2xl bg-[#faf3e8]">
                <div className="flex justify-between items-center text-xs font-bold mb-1 px-1">
                  <span className="text-foreground flex items-center gap-1">
                    <Sparkles className="size-3.5 text-amber-500 fill-amber-500" />
                    タマゴの温まり具合
                  </span>
                  <span className="text-primary font-black text-sm">{eggProgress}%</span>
                </div>
                <div className="h-3 sm:h-3.5 w-full rounded-full bg-[#e8ded0] overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 shadow-xs"
                    style={{ width: `${eggProgress}%` }}
                  />
                </div>
              </div>

              {targetCreature && (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-amber-900 bg-amber-50/80 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-amber-200/60">
                  <span className="text-base shrink-0">🔮</span>
                  <span>予兆：何やら「{targetCreature.title}」の気配がしている…！</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. 生き物図鑑コレクション */}
        <section className="clay-card p-4 sm:p-7 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-xl font-black text-foreground flex items-center gap-2">
                <BookOpen className="size-5 text-primary" /> ふしぎな生き物図鑑
              </h2>
              <p className="text-xs text-muted-foreground">
                勉強して見つけた仲間たち。タップすると詳しい生態やストーリーが読めるよ！
              </p>
            </div>

            {/* カテゴリタブ（モバイルでは横スクロールで快適タップ） */}
            <div className="-mx-2 px-2 sm:mx-0 sm:px-0 flex overflow-x-auto scrollbar-none gap-1.5 p-1 clay-inset rounded-xl bg-[#f5ede1]">
              {SUBJECT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterSubject(tab.id)}
                  className={`tap shrink-0 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 min-h-[36px] sm:min-h-[40px] ${
                    filterSubject === tab.id
                      ? "bg-white text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 生き物グリッド（高クオリティカード・モバイル対応） */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
            {filteredCreatures.map((creature) => {
              const isUnlocked = unlockedMap.get(creature.id);

              return (
                <button
                  key={creature.id}
                  type="button"
                  onClick={() => {
                    playTone(isUnlocked ? "correct" : "retry");
                    setSelectedCreature(creature);
                  }}
                  className={`tap group relative rounded-2xl p-2.5 sm:p-3 text-center flex flex-col items-center justify-between transition-all duration-300 border cursor-pointer min-h-[145px] sm:min-h-[160px] ${
                    isUnlocked
                      ? "clay-tile-white hover:scale-105 active:scale-95 border-amber-200/80 shadow-sm"
                      : "bg-[#f2ece3] border-transparent opacity-80 hover:opacity-100 active:scale-95"
                  }`}
                >
                  {/* レア度バッジ */}
                  <div className="w-full flex justify-between items-center text-[10px] font-black px-0.5 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${
                        creature.subject === "math"
                          ? "bg-blue-100 text-blue-700"
                          : creature.subject === "ja"
                          ? "bg-rose-100 text-rose-700"
                          : creature.subject === "en"
                          ? "bg-emerald-100 text-emerald-700"
                          : creature.subject === "think"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {creature.subjectLabel}
                    </span>
                    <span className="text-amber-500 tracking-tighter text-[11px] sm:text-xs">
                      {"★".repeat(creature.rarity)}
                    </span>
                  </div>

                  {/* ビジュアル表示（アンロック済は高精度SVG、未開放はシルエット） */}
                  <div className="my-1.5 sm:my-2 relative flex items-center justify-center min-h-[78px] sm:min-h-[90px]">
                    {isUnlocked ? (
                      <div className="transition-transform group-hover:scale-110 duration-300">
                        <CreatureVisual id={creature.id} size={82} />
                      </div>
                    ) : (
                      <div className="relative flex flex-col items-center justify-center size-[78px] sm:size-[88px] rounded-full bg-[#e5ddd1] border-2 border-dashed border-[#c8bea9]">
                        <HelpCircle className="size-7 sm:size-8 text-[#9b907c]" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-[#837865] mt-0.5">未発見</span>
                      </div>
                    )}
                  </div>

                  {/* 名前 */}
                  <div className="w-full mt-0.5">
                    <h3 className="text-xs sm:text-sm font-black text-foreground truncate">
                      {isUnlocked ? creature.name : "？？？"}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">
                      {isUnlocked ? creature.title : `あと ${creature.needClears}回クリアで発見`}
                    </p>
                  </div>

                  {isUnlocked && (
                    <div className="absolute top-1.5 right-1.5 text-emerald-600">
                      <CheckCircle2 className="size-3.5 sm:size-4 fill-emerald-100" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. ぽけっとのお世話エリア */}
        <section className="clay-card p-4 sm:p-7 text-center relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              🌱 まなびの相棒「ぽけっと」
            </h2>
            <span className="text-xs font-bold text-muted-foreground">
              成長ステージ：{STAGES[currentStage]!.name}
            </span>
          </div>

          {/* セリフ吹き出し */}
          <div className="mb-2 min-h-7 flex items-center justify-center">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60 text-xs font-bold shadow-xs">
              {POCKET_VOICES[voiceIndex]}
            </span>
          </div>

          <div className="relative inline-block my-1">
            <button
              type="button"
              onClick={handleTouchPocket}
              className={`tap group cursor-pointer transition-transform duration-300 ${
                pocketHappy ? "scale-110 -translate-y-2" : "hover:scale-105 active:scale-95"
              }`}
              title="ぽけっとをタップ"
            >
              <Pocket stage={currentStage} size={130} happy={pocketHappy} />
            </button>

            {pocketHappy && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                <Heart className="size-5 text-rose-500 fill-rose-500 animate-bounce" />
                <Sparkles className="size-5 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {STAGES[currentStage]!.desc}
          </p>

          {/* 進化ゲージ */}
          <div className="max-w-md mx-auto mt-3 p-2.5 sm:p-3 clay-inset rounded-2xl bg-[#faf4ec]">
            <div className="flex justify-between items-center text-xs font-bold text-foreground mb-1.5 px-1">
              <span>ぽけっとの進化</span>
              <span className="text-primary font-black">
                {nextStage ? `あと ${nextStage.need - totalCount}回 で進化` : "最大まで育ったよ！"}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#e8ded0] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
          </div>

          {/* おやつボタン（タップしやすい44px以上） */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleFeedSnack}
              className="tap clay-tile-white min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-bold active:scale-95 cursor-pointer flex items-center gap-1.5 hover:scale-105 transition-transform"
            >
              <span>🍎 おやつをあげる</span>
            </button>
          </div>

          {/* ぽけっとの成長過程（シンプル表示・レスポンシブ） */}
          <div className="mt-5 pt-4 border-t border-amber-200/50">
            <p className="text-xs font-bold text-muted-foreground mb-2.5 text-center">
              成長のあゆみ
            </p>
            <div className="flex justify-center items-center gap-3 sm:gap-8">
              {STAGES.map((s, idx) => {
                const isReached = idx <= currentStage;
                return (
                  <div
                    key={s.name}
                    className={`flex flex-col items-center transition-opacity duration-200 ${
                      isReached ? "opacity-100" : "opacity-35 grayscale"
                    }`}
                  >
                    <Pocket stage={idx} size={42} />
                    <span className="text-xs font-bold text-foreground mt-1">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {s.need === 0 ? "0回" : `${s.need}回`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. スタンプ帳（28日間の努力カレンダー・プレミアムスタンプ） */}
        <section className="clay-card p-4 sm:p-7 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
            <h2 className="text-sm sm:text-lg font-black text-foreground flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="size-4 sm:size-5 text-primary shrink-0" />
              <span>スタンプ帳（28日分）</span>
            </h2>
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap shrink-0">
              {days.size}日達成
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 leading-relaxed">
            がんばった日にスタンプが届くよ！複数回クリアでゴールドに変化✨
          </p>

          {/* 7列スタンプグリッド（日付が絶対に欠けないレイアウト） */}
          <div className="clay-inset p-2 sm:p-4 rounded-2xl bg-[#f5ede1] grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((c) => {
              const studied = c.studied;
              const count = c.countOnDay;
              const isGold = count >= 2;
              // 日付ごとのスタンプ傾き（-4度〜+4度でランダムなリアル感を再現）
              const stampRotation = ((c.day * 13) % 9) - 4;

              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    playTone("correct");
                    setSelectedDayInfo({
                      dateStr: c.dateStr,
                      studied,
                      count,
                    });
                  }}
                  className={`tap aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5 relative transition-all cursor-pointer min-h-[42px] ${
                    studied
                      ? isGold
                        ? "bg-gradient-to-b from-[#FFFDF0] to-[#FEF3C7] border border-amber-300 shadow-xs hover:scale-105 active:scale-95"
                        : "bg-white border border-rose-200/80 shadow-xs hover:scale-105 active:scale-95"
                      : "bg-[#ece3d5] border border-transparent active:scale-95"
                  } ${c.isToday ? "ring-2 ring-primary ring-offset-1 z-10" : ""}`}
                >
                  {/* 今日のバッジ */}
                  {c.isToday && (
                    <span className="absolute top-1 right-1 text-[8px] sm:text-[9px] px-1 rounded bg-primary text-primary-foreground font-black leading-tight tracking-tighter">
                      今
                    </span>
                  )}

                  {studied ? (
                    // 学習した日：上部に日付数字＋中央にスタンプ
                    <div className="w-full h-full flex flex-col justify-between items-center py-0.5">
                      <span className="self-start pl-1 text-[9px] sm:text-[10px] font-black text-foreground/80 tabular-nums leading-none">
                        {c.day}
                      </span>
                      <div className="relative flex items-center justify-center my-auto">
                        <PremiumStamp
                          count={count}
                          size={30}
                          rotation={stampRotation}
                        />
                        {count >= 2 && (
                          <span className="absolute -bottom-1 -right-1 text-[8px] sm:text-[9px] font-black px-1 rounded-full bg-amber-500 text-white shadow-xs leading-tight">
                            x{count}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    // 未学習の日：中央に見やすく日付数字を配置（欠け・切れが一切起きない）
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-black text-[#8b7e6d]/75 tabular-nums select-none">
                        {c.day}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDayInfo && (
            <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold text-amber-950 animate-slide-in shadow-xs">
              <div className="flex items-center gap-3">
                {selectedDayInfo.studied ? (
                  <PremiumStamp count={selectedDayInfo.count} size={40} />
                ) : (
                  <span className="text-2xl shrink-0">💤</span>
                )}
                <div>
                  <span className="font-black">{selectedDayInfo.dateStr}</span>：
                  {selectedDayInfo.studied ? (
                    <span>
                      {selectedDayInfo.count}回 勉強したよ！
                      {selectedDayInfo.count >= 2 ? (
                        <span className="text-amber-700 font-black ml-1 block sm:inline">✨ ゴールドクラウン獲得！GREAT! ✨</span>
                      ) : (
                        <span className="text-rose-700 font-black ml-1 block sm:inline">🌸 たいへんよくできました！ 🌸</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">お休みの日でした。今日もがんばろう！</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayInfo(null)}
                className="self-end sm:self-auto text-muted-foreground hover:text-foreground p-1.5 cursor-pointer rounded-full hover:bg-black/5"
                aria-label="とじる"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* 生き物詳細モーダル（スマホで画面外にはみ出さないよう max-h-[85dvh] スクロール可能に） */}
      {selectedCreature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedCreature(null)}
        >
          <div
            className="clay-card max-w-md w-full p-5 sm:p-7 relative max-h-[85dvh] overflow-y-auto bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] border-2 border-amber-300 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 閉じるボタン（タッチターゲット確保） */}
            <button
              type="button"
              onClick={() => setSelectedCreature(null)}
              className="absolute top-3 right-3 size-10 sm:size-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors z-10"
              aria-label="とじる"
            >
              <X className="size-5" />
            </button>

            {unlockedMap.get(selectedCreature.id) ? (
              // 解放済み詳細カード
              <div className="text-center space-y-3 sm:space-y-4 pt-1">
                {/* レア度 & 科目 */}
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {selectedCreature.subjectLabel}
                  </span>
                  <div className="flex text-amber-500">
                    {Array.from({ length: selectedCreature.rarity }).map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                </div>

                {/* 生き物イラスト（特大・レスポンシブ） */}
                <div className="my-1 sm:my-2 flex justify-center py-1 sm:py-2 animate-bounce-short">
                  <CreatureVisual id={selectedCreature.id} size={130} />
                </div>

                {/* 名前 & 肩書 */}
                <div>
                  <span className="text-[11px] sm:text-xs font-bold text-amber-700 tracking-wider">
                    {selectedCreature.title}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                    {selectedCreature.name}
                  </h3>
                </div>

                {/* プロフィール表 */}
                <div className="clay-inset p-3 rounded-2xl bg-[#faf3e8] text-xs space-y-1.5 sm:space-y-2 text-left">
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground font-bold">せいかく：</span>
                    <span className="font-black text-foreground">{selectedCreature.personality}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground font-bold">すんでいる場所：</span>
                    <span className="font-black text-foreground">{selectedCreature.habitat}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground font-bold">だいすきな物：</span>
                    <span className="font-black text-foreground">{selectedCreature.favoriteFood}</span>
                  </div>
                </div>

                {/* 解説ストーリー */}
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed bg-amber-50/70 p-2.5 sm:p-3 rounded-xl border border-amber-200/60">
                  {selectedCreature.description}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    playTone("fanfare");
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 1500);
                  }}
                  className="tap clay-button-green w-full min-h-[44px] py-2.5 text-sm font-black active:scale-95 cursor-pointer shadow-md"
                >
                  🎉 なかよしタップ！
                </button>
              </div>
            ) : (
              // 未解放カード（ヒント情報）
              <div className="text-center space-y-3 sm:space-y-4 py-3">
                <div className="size-20 sm:size-24 mx-auto rounded-full bg-[#e8ded0] flex items-center justify-center border-2 border-dashed border-[#b8ab96]">
                  <HelpCircle className="size-10 sm:size-12 text-[#8c7f6b]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground">未発見の生き物</span>
                  <h3 className="text-lg sm:text-xl font-black text-foreground mt-1">？？？？？？</h3>
                </div>

                <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm font-bold text-amber-950 leading-relaxed">
                  <p>【発見のヒント】</p>
                  <p className="mt-1">
                    「{selectedCreature.subjectLabel}」をあと{" "}
                    <span className="text-base text-primary font-black">
                      {Math.max(0, selectedCreature.needClears - getClearsForSubject(selectedCreature.subject))}
                    </span>{" "}
                    回クリアすると姿をあらわすよ！
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* タマゴ孵化お祝いモーダル（スマホ対応） */}
      {hatchedCreature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setHatchedCreature(null)}
        >
          <div
            className="clay-card max-w-sm w-full p-5 sm:p-6 text-center space-y-3.5 sm:space-y-4 max-h-[85dvh] overflow-y-auto bg-gradient-to-b from-[#FFFDF9] to-[#FEF3C7] border-2 border-amber-400 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inline-block px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black animate-pulse">
              ✨ パカッ！タマゴが割れた！ ✨
            </div>

            <div className="my-1.5 sm:my-2 flex justify-center py-1 sm:py-2 animate-bounce">
              <CreatureVisual id={hatchedCreature.id} size={130} />
            </div>

            <div>
              <span className="text-xs font-bold text-amber-800">
                {hatchedCreature.title}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                {hatchedCreature.name} がうまれた！
              </h3>
            </div>

            <p className="text-xs text-muted-foreground">
              図鑑に新しい仲間が登録されたよ！いつでも図鑑から会いに来てね。
            </p>

            <button
              type="button"
              onClick={() => setHatchedCreature(null)}
              className="tap clay-button-green w-full min-h-[44px] py-2.5 text-sm font-black active:scale-95 cursor-pointer shadow-md"
            >
              やったね！図鑑をみる
            </button>
          </div>
        </div>
      )}
    </KidShell>
  );
}
