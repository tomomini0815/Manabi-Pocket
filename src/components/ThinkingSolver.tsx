import { useRef, useState, useLayoutEffect } from "react";
import { Lightbulb, PenTool, ChevronDown, ChevronUp, Plus, Minus, GripHorizontal, ArrowLeft } from "lucide-react";
import { DrawCanvas } from "./DrawCanvas";
import { Keypad } from "./Keypad";
import { Confetti } from "./Confetti";
import { MathFormula } from "./MathFormula";
import { playTone } from "@/lib/sound";
import { DIFFICULTY_LABEL, METHOD_TAGS, type ThinkProblem } from "@/lib/thinking";

export type ThinkOutcome = { solved: boolean; hintLevel: number; timeSec: number; methods: string[] };

const HINT_TITLE = ["", "ヒント1：といかけ", "ヒント2：ちゃくがんてん", "ヒント3：とちゅうまで"];

function Figure({ kind }: { kind: string }) {
  if (kind === "grid2") {
    return (
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="2×2の ごばんのめ">
        <rect x="10" y="10" width="120" height="120" rx="6" fill="#F7FAFC" stroke="var(--think-deep)" strokeWidth="4" />
        <line x1="70" y1="10" x2="70" y2="130" stroke="var(--think-deep)" strokeWidth="4" />
        <line x1="10" y1="70" x2="130" y2="70" stroke="var(--think-deep)" strokeWidth="4" />
      </svg>
    );
  }
  if (kind === "balance") {
    return (
      <svg width="270" height="135" viewBox="0 0 280 140" role="img" aria-label="てんびんとおもさ推理">
        <defs>
          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="100%" stopColor="#2D3748" />
          </linearGradient>
        </defs>
        {/* 台座と支点 */}
        <polygon points="140,55 120,118 160,118" fill="#4A5568" />
        <rect x="95" y="118" width="90" height="12" rx="4" fill="#2D3748" />
        <circle cx="140" cy="55" r="7" fill="#E2E8F0" stroke="#2D3748" strokeWidth="2.5" />
        {/* 天秤の竿 */}
        <rect x="20" y="52" width="240" height="7" rx="3.5" fill="url(#beamGrad)" />
        {/* 左の皿（チェーン＆皿） */}
        <line x1="55" y1="56" x2="30" y2="86" stroke="#718096" strokeWidth="2.5" />
        <line x1="55" y1="56" x2="80" y2="86" stroke="#718096" strokeWidth="2.5" />
        <ellipse cx="55" cy="88" rx="42" ry="10" fill="#EDF2F7" stroke="#4A5568" strokeWidth="2" />
        {/* 左の皿に乗っているもの：メロン */}
        <circle cx="55" cy="73" r="16" fill="#68D391" stroke="#276749" strokeWidth="2" />
        <path d="M48 67 Q55 73 62 67" stroke="#38A169" strokeWidth="1.5" fill="none" />
        <path d="M48 77 Q55 73 62 77" stroke="#38A169" strokeWidth="1.5" fill="none" />
        <path d="M55 57 Q58 52 63 53" stroke="#276749" strokeWidth="2" fill="none" />
        <rect x="20" y="100" width="70" height="22" rx="5" fill="#EBF8FF" stroke="#3182CE" strokeWidth="1.5" />
        <text x="55" y="115" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2B6CB0">メロン 1こ</text>

        {/* 右の皿（チェーン＆皿） */}
        <line x1="225" y1="56" x2="195" y2="86" stroke="#718096" strokeWidth="2.5" />
        <line x1="225" y1="56" x2="255" y2="86" stroke="#718096" strokeWidth="2.5" />
        <ellipse cx="225" cy="88" rx="46" ry="10" fill="#EDF2F7" stroke="#4A5568" strokeWidth="2" />
        {/* 右の皿に乗っているもの：りんご2こ＋みかん1こ */}
        <circle cx="210" cy="75" r="10" fill="#F56565" stroke="#9B2C2C" strokeWidth="1.5" />
        <path d="M210 65 Q213 62 216 63" stroke="#742A2A" strokeWidth="1.5" fill="none" />
        <circle cx="227" cy="73" r="10" fill="#F56565" stroke="#9B2C2C" strokeWidth="1.5" />
        <path d="M227 63 Q230 60 233 61" stroke="#742A2A" strokeWidth="1.5" fill="none" />
        <circle cx="243" cy="77" r="9" fill="#ED8936" stroke="#C05621" strokeWidth="1.5" />
        <circle cx="243" cy="69" r="1.5" fill="#276749" />
        <rect x="175" y="100" width="100" height="22" rx="5" fill="#FFFAF0" stroke="#DD6B20" strokeWidth="1.5" />
        <text x="225" y="115" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#C05621">りんご2 + みかん1</text>
      </svg>
    );
  }
  if (kind === "origami") {
    return (
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="4つ折りの紙">
        <rect x="25" y="25" width="90" height="90" fill="#EBF8FF" stroke="#3182CE" strokeWidth="3" rx="4" />
        <path d="M25 50 L50 25" stroke="#E53E3E" strokeWidth="3" strokeDasharray="4 4" />
        <circle cx="25" cy="25" r="18" fill="#FED7D7" stroke="#E53E3E" strokeWidth="2" />
        <text x="70" y="80" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2B6CB0">中心の角を切る</text>
      </svg>
    );
  }
  if (kind === "tri_div3") {
    return (
      <svg width="170" height="120" viewBox="0 0 180 120" role="img" aria-label="3つに区切られた三角形">
        <polygon points="90,15 15,105 165,105" fill="#F7FAFC" stroke="var(--think-deep)" strokeWidth="3.5" />
        <line x1="90" y1="15" x2="65" y2="105" stroke="var(--think-deep)" strokeWidth="3" />
        <line x1="90" y1="15" x2="115" y2="105" stroke="var(--think-deep)" strokeWidth="3" />
      </svg>
    );
  }
  if (kind === "dice_roll") {
    return (
      <svg
        width="400"
        height="185"
        viewBox="0 0 400 185"
        role="img"
        aria-label="サイコロの立体転がり図"
        className="select-none max-w-full h-auto"
      >
        <defs>
          <filter id="diceShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#8B5E3C" floodOpacity="0.25" />
          </filter>
          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* 1. 床のグリッドマス（アイソメトリック立体パース） */}
        {/* 左マス（スタートマス） */}
        <polygon
          points="35,130 95,98 155,130 95,160"
          fill="#F5EFE6"
          stroke="#D8CBBA"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text x="95" y="152" textAnchor="middle" fontSize="11" fontWeight="900" fill="#8C735D">
          スタートのマス
        </text>

        {/* 右マス（ゴールマス） */}
        <polygon
          points="245,130 305,98 365,130 305,160"
          fill="#FFF5ED"
          stroke="#EA6340"
          strokeWidth="2.5"
          strokeDasharray="5 3"
          strokeLinejoin="round"
        />
        <text x="305" y="152" textAnchor="middle" fontSize="11" fontWeight="900" fill="#EA6340">
          ゴールのマス
        </text>

        {/* 2. 左マスの3D立体サイコロ（転がる前の状態） */}
        <g filter="url(#diceShadow)">
          {/* 手前左面（2の目） */}
          <polygon
            points="48,64 95,86 95,136 48,114"
            fill="#F8FAFC"
            stroke="#2B303A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* 2の目（黒丸2つ） */}
          <circle cx="66" cy="87" r="5" fill="#2B303A" />
          <circle cx="78" cy="113" r="5" fill="#2B303A" />
          {/* 手前ラベル */}
          <g filter="url(#badgeShadow)">
            <rect x="52" y="121" width="46" height="16" rx="8" fill="#2B303A" />
            <text x="75" y="133" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#FFFFFF">
              手前: 2
            </text>
          </g>

          {/* 手前右面（3の目） */}
          <polygon
            points="95,86 142,64 142,114 95,136"
            fill="#EDF2F7"
            stroke="#2B303A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* 3の目（黒丸3つ） */}
          <circle cx="109" cy="115" r="4.5" fill="#2B303A" />
          <circle cx="118.5" cy="100" r="4.5" fill="#2B303A" />
          <circle cx="128" cy="85" r="4.5" fill="#2B303A" />
          {/* 右面ラベル */}
          <g filter="url(#badgeShadow)">
            <rect x="98" y="121" width="44" height="16" rx="8" fill="#4A5568" />
            <text x="120" y="133" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#FFFFFF">
              右面: 3
            </text>
          </g>

          {/* 上面（1の目・大きな赤丸） */}
          <polygon
            points="48,64 95,42 142,64 95,86"
            fill="#FFFFFF"
            stroke="#2B303A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* 1の目（鮮やかな大赤丸） */}
          <circle cx="95" cy="64" r="9" fill="#E53E3E" />
          {/* 上面ラベル */}
          <g filter="url(#badgeShadow)">
            <rect x="73" y="15" width="44" height="19" rx="9.5" fill="#FFF5F5" stroke="#E53E3E" strokeWidth="2" />
            <text x="95" y="29" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#E53E3E">
              上面: 1
            </text>
          </g>
        </g>

        {/* 隠れた左面の補助表示（7-3=4のヒント） */}
        <g opacity="0.95">
          <path d="M 34,90 Q 22,90 22,76" fill="none" stroke="#718096" strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x="2" y="60" width="52" height="17" rx="5" fill="#EDF2F7" stroke="#CBD5E0" strokeWidth="1" />
          <text x="28" y="72" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#4A5568">
            左面: 4
          </text>
        </g>

        {/* 3. 回転アクション矢印（右へ1回転） */}
        <path
          d="M 125,52 C 165,12 235,12 275,58"
          fill="none"
          stroke="#EA6340"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <polygon points="281,66 279,54 268,62" fill="#EA6340" />

        {/* 回転アクションバッジ */}
        <g transform="translate(146, 12)" filter="url(#badgeShadow)">
          <rect x="0" y="0" width="108" height="22" rx="11" fill="#EA6340" />
          <text x="54" y="15" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#FFFFFF">
            右へ 1回転 くるん!
          </text>
        </g>

        {/* 4. 右マスの点線サイコロ（転がった後・上面「？」） */}
        <g>
          {/* ゴースト手前面 */}
          <polygon
            points="258,64 305,86 305,136 258,114"
            fill="#FFFBF7"
            stroke="#EA6340"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
          {/* ゴースト右面 */}
          <polygon
            points="305,86 352,64 352,114 305,136"
            fill="#FFF7EF"
            stroke="#EA6340"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
          {/* ゴースト上面（注目ポイント） */}
          <polygon
            points="258,64 305,42 352,64 305,86"
            fill="#FFEEDD"
            stroke="#EA6340"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* 大きな「？」バッジ */}
          <circle cx="305" cy="64" r="14" fill="#EA6340" filter="url(#badgeShadow)" />
          <text x="305" y="70" textAnchor="middle" fontSize="17" fontWeight="900" fill="#FFFFFF">
            ?
          </text>

          {/* 指し示す吹き出しバッジ */}
          <g filter="url(#badgeShadow)">
            <rect x="277" y="15" width="56" height="19" rx="9.5" fill="#FFF5ED" stroke="#EA6340" strokeWidth="2" />
            <text x="305" y="29" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#EA6340">
              上は なに?
            </text>
          </g>
        </g>
      </svg>
    );
  }
  if (kind === "venn2") {
    return (
      <svg width="180" height="120" viewBox="0 0 180 120" role="img" aria-label="2つの重なる輪">
        <circle cx="65" cy="60" r="48" fill="#EBF8FF" fillOpacity="0.7" stroke="#3182CE" strokeWidth="3.5" />
        <circle cx="115" cy="60" r="48" fill="#FEFCBF" fillOpacity="0.7" stroke="#D69E2E" strokeWidth="3.5" />
        <text x="42" y="65" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#2B6CB0">輪 A</text>
        <text x="138" y="65" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#B7791F">輪 B</text>
        <text x="90" y="66" textAnchor="middle" fontSize="16" fontWeight="black" fill="#C53030">？</text>
      </svg>
    );
  }
  if (kind === "cubes_view") {
    return (
      <svg
        width="420"
        height="200"
        viewBox="0 0 420 200"
        role="img"
        aria-label="積み木の配置と3方向からの見取り図"
        className="select-none max-w-full h-auto"
      >
        <defs>
          <filter id="tileShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.07" />
          </filter>
        </defs>

        {/* ================= 左側：上から見た図（2×2の4マス） ================= */}
        <g transform="translate(6, 6)">
          {/* ヘッダーバッジ */}
          <rect x="12" y="4" width="132" height="22" rx="11" fill="#EDF2F7" stroke="#CBD5E0" strokeWidth="1.5" />
          <text x="78" y="19" textAnchor="middle" fontSize="11" fontWeight="900" fill="#4A5568">
            👁️ 上から見た図（4マス）
          </text>

          {/* 4つのマス目（ゆったり62×56px） */}
          {/* 奥・左 */}
          <rect x="14" y="34" width="62" height="54" rx="8" fill="#FFFFFF" stroke="#718096" strokeWidth="2" filter="url(#tileShadow)" />
          <text x="45" y="66" textAnchor="middle" fontSize="12" fontWeight="900" fill="#2D3748">奥・左</text>

          {/* 奥・右 */}
          <rect x="80" y="34" width="62" height="54" rx="8" fill="#FFFFFF" stroke="#718096" strokeWidth="2" filter="url(#tileShadow)" />
          <text x="111" y="66" textAnchor="middle" fontSize="12" fontWeight="900" fill="#2D3748">奥・右</text>

          {/* 手前・左 */}
          <rect x="14" y="92" width="62" height="54" rx="8" fill="#FFFFFF" stroke="#718096" strokeWidth="2" filter="url(#tileShadow)" />
          <text x="45" y="124" textAnchor="middle" fontSize="12" fontWeight="900" fill="#2D3748">手前・左</text>

          {/* 手前・右 */}
          <rect x="80" y="92" width="62" height="54" rx="8" fill="#FFFFFF" stroke="#718096" strokeWidth="2" filter="url(#tileShadow)" />
          <text x="111" y="124" textAnchor="middle" fontSize="12" fontWeight="900" fill="#2D3748">手前・右</text>

          {/* 前から見る視線矢印（下部） */}
          <path d="M 78,172 L 78,154" stroke="#3182CE" strokeWidth="3" strokeLinecap="round" />
          <polygon points="78,148 73,156 83,156" fill="#3182CE" />
          <text x="78" y="186" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#2B6CB0">
            ▲ まえから見る
          </text>

          {/* 右から見る視線矢印（右側） */}
          <path d="M 172,118 L 152,118" stroke="#DD6B20" strokeWidth="3" strokeLinecap="round" />
          <polygon points="146,118 154,113 154,123" fill="#DD6B20" />
          <text x="166" y="136" textAnchor="middle" fontSize="10" fontWeight="900" fill="#C05621">
            みぎから
          </text>
        </g>

        {/* ================= 右側上段：まえから見ると ================= */}
        <g transform="translate(196, 10)">
          <rect x="0" y="0" width="212" height="82" rx="14" fill="#EBF8FF" stroke="#90CDF4" strokeWidth="2" />
          <rect x="12" y="8" width="96" height="19" rx="9.5" fill="#3182CE" />
          <text x="60" y="21.5" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#FFFFFF">
            まえから見ると
          </text>

          {/* 積み木ミニブロック（左2段、右1段） */}
          <g transform="translate(18, 33)">
            {/* 左列（2階建て） */}
            <rect x="0" y="20" width="22" height="19" rx="3" fill="#3182CE" stroke="#2B6CB0" strokeWidth="1.5" />
            <rect x="0" y="0" width="22" height="19" rx="3" fill="#63B3ED" stroke="#2B6CB0" strokeWidth="1.5" />
            {/* 右列（1階建て） */}
            <rect x="25" y="20" width="22" height="19" rx="3" fill="#3182CE" stroke="#2B6CB0" strokeWidth="1.5" />
          </g>

          {/* 説明テキスト */}
          <g transform="translate(78, 39)">
            <text x="0" y="12" fontSize="11.5" fontWeight="900" fill="#2B6CB0">
              左列：<tspan fill="#C53030" fontSize="13">2だん</tspan>
            </text>
            <text x="0" y="30" fontSize="11" fontWeight="bold" fill="#4A5568">
              右列：1だん
            </text>
          </g>
        </g>

        {/* ================= 右側下段：みぎから見ると ================= */}
        <g transform="translate(196, 102)">
          <rect x="0" y="0" width="212" height="82" rx="14" fill="#FFF7ED" stroke="#FBD38D" strokeWidth="2" />
          <rect x="12" y="8" width="96" height="19" rx="9.5" fill="#DD6B20" />
          <text x="60" y="21.5" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#FFFFFF">
            みぎから見ると
          </text>

          {/* 積み木ミニブロック（奥1段、手前2段） */}
          <g transform="translate(18, 33)">
            {/* 奥列（1階建て） */}
            <rect x="0" y="20" width="22" height="19" rx="3" fill="#DD6B20" stroke="#C05621" strokeWidth="1.5" />
            {/* 手前列（2階建て） */}
            <rect x="25" y="20" width="22" height="19" rx="3" fill="#DD6B20" stroke="#C05621" strokeWidth="1.5" />
            <rect x="25" y="0" width="22" height="19" rx="3" fill="#F6AD55" stroke="#C05621" strokeWidth="1.5" />
          </g>

          {/* 説明テキスト */}
          <g transform="translate(78, 39)">
            <text x="0" y="12" fontSize="11" fontWeight="bold" fill="#4A5568">
              奥列：1だん
            </text>
            <text x="0" y="30" fontSize="11.5" fontWeight="900" fill="#C05621">
              手前：<tspan fill="#C53030" fontSize="13">2だん</tspan>
            </text>
          </g>
        </g>
      </svg>
    );
  }
  if (kind === "fukumen_add") {
    return (
      <svg
        width="350"
        height="195"
        viewBox="0 0 350 195"
        role="img"
        aria-label="覆面算の筆算図（AB ＋ BA ＝ 77）"
        className="select-none max-w-full h-auto"
      >
        <defs>
          <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* 左側：美しい筆算カード */}
        <g transform="translate(10, 8)">
          {/* 位取りヘッダー */}
          <text x="56" y="12" textAnchor="middle" fontSize="10" fontWeight="900" fill="#A0AEC0">十の位</text>
          <text x="110" y="12" textAnchor="middle" fontSize="10" fontWeight="900" fill="#A0AEC0">一の位</text>

          {/* 1行目: A B */}
          {/* タイル A (青) */}
          <rect x="34" y="20" width="44" height="42" rx="10" fill="#EBF8FF" stroke="#3182CE" strokeWidth="2.5" filter="url(#boxShadow)" />
          <text x="56" y="49" textAnchor="middle" fontSize="22" fontWeight="900" fill="#2B6CB0">A</text>

          {/* タイル B (オレンジ) */}
          <rect x="88" y="20" width="44" height="42" rx="10" fill="#FFF5ED" stroke="#EA6340" strokeWidth="2.5" filter="url(#boxShadow)" />
          <text x="110" y="49" textAnchor="middle" fontSize="22" fontWeight="900" fill="#EA6340">B</text>

          {/* 2行目: ＋ B A */}
          <text x="16" y="99" textAnchor="middle" fontSize="22" fontWeight="900" fill="#718096">＋</text>

          {/* タイル B (オレンジ) */}
          <rect x="34" y="70" width="44" height="42" rx="10" fill="#FFF5ED" stroke="#EA6340" strokeWidth="2.5" filter="url(#boxShadow)" />
          <text x="56" y="99" textAnchor="middle" fontSize="22" fontWeight="900" fill="#EA6340">B</text>

          {/* タイル A (青) */}
          <rect x="88" y="70" width="44" height="42" rx="10" fill="#EBF8FF" stroke="#3182CE" strokeWidth="2.5" filter="url(#boxShadow)" />
          <text x="110" y="99" textAnchor="middle" fontSize="22" fontWeight="900" fill="#2B6CB0">A</text>

          {/* 筆算の横線 */}
          <line x1="8" y1="122" x2="138" y2="122" stroke="#4A5568" strokeWidth="3" strokeLinecap="round" />

          {/* 3行目: 7 7 (答え) */}
          <rect x="34" y="130" width="44" height="42" rx="10" fill="#FFFFFF" stroke="#CBD5E0" strokeWidth="2" filter="url(#boxShadow)" />
          <text x="56" y="160" textAnchor="middle" fontSize="24" fontWeight="900" fill="#2D3748">7</text>

          <rect x="88" y="130" width="44" height="42" rx="10" fill="#FFFFFF" stroke="#CBD5E0" strokeWidth="2" filter="url(#boxShadow)" />
          <text x="110" y="160" textAnchor="middle" fontSize="24" fontWeight="900" fill="#2D3748">7</text>
        </g>

        {/* 右側：ルールのわかりやすいガイドカード */}
        <g transform="translate(165, 14)">
          <rect x="0" y="0" width="175" height="166" rx="16" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
          
          {/* ヘッダーチップ */}
          <rect x="12" y="12" width="104" height="22" rx="11" fill="#FEFCBF" stroke="#D69E2E" strokeWidth="1.5" />
          <text x="64" y="27" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#744210">
            💡 もんだいのヒント
          </text>

          {/* ルール説明 */}
          <g transform="translate(12, 46)">
            {/* ルール1: 同じ文字＝同じ数字 */}
            <circle cx="8" cy="8" r="8" fill="#3182CE" />
            <text x="8" y="12" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF">A</text>
            <text x="22" y="12" fontSize="11" fontWeight="bold" fill="#2D3748">同じ文字は同じ数字</text>

            <circle cx="8" cy="32" r="8" fill="#EA6340" />
            <text x="8" y="36" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF">B</text>
            <text x="22" y="36" fontSize="11" fontWeight="bold" fill="#2D3748">A と B は 別の数字</text>

            {/* 式のヒント */}
            <rect x="0" y="52" width="150" height="56" rx="10" fill="#EDF2F7" stroke="#CBD5E0" strokeWidth="1" />
            <text x="75" y="72" textAnchor="middle" fontSize="11" fontWeight="900" fill="#2B6CB0">
              一の位：B ＋ A ＝ 7
            </text>
            <text x="75" y="94" textAnchor="middle" fontSize="11" fontWeight="900" fill="#C53030">
              A ＋ B ＝ 7 になるよ！
            </text>
          </g>
        </g>
      </svg>
    );
  }
  if (kind === "square_in_square") {
    return (
      <svg width="130" height="130" viewBox="0 0 140 140" role="img" aria-label="正方形の中の正方形">
        <rect x="15" y="15" width="110" height="110" fill="#FFF5F5" stroke="#E53E3E" strokeWidth="3" rx="4" />
        <polygon points="70,15 125,70 70,125 15,70" fill="#EBF8FF" stroke="#3182CE" strokeWidth="3.5" />
        <text x="70" y="76" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2B6CB0">面積？</text>
      </svg>
    );
  }
  if (kind === "grid2x3") {
    return (
      <svg width="180" height="115" viewBox="0 0 190 125" role="img" aria-label="2×3の格子の道">
        <line x1="25" y1="25" x2="165" y2="25" stroke="#4A5568" strokeWidth="3.5" />
        <line x1="25" y1="65" x2="165" y2="65" stroke="#4A5568" strokeWidth="3.5" />
        <line x1="25" y1="105" x2="165" y2="105" stroke="#4A5568" strokeWidth="3.5" />
        <line x1="25" y1="25" x2="25" y2="105" stroke="#4A5568" strokeWidth="3.5" />
        <line x1="72" y1="25" x2="72" y2="105" stroke="#4A5568" strokeWidth="3.5" />
        <line x1="118" y1="25" x2="118" y2="105" stroke="#4A5568" strokeWidth="3.5" />
        <line x1="165" y1="25" x2="165" y2="105" stroke="#4A5568" strokeWidth="3.5" />
        <circle cx="25" cy="105" r="7" fill="#38A169" />
        <text x="25" y="120" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#38A169">スタート</text>
        <circle cx="165" cy="25" r="7" fill="#E53E3E" />
        <text x="165" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#E53E3E">ゴール</text>
      </svg>
    );
  }
  return null;
}

/** S11 考える問題 + S12 ふりかえり */
export function ThinkingSolver({ problem, onDone }: { problem: ThinkProblem; onDone: (o: ThinkOutcome) => void }) {
  const [hint, setHint] = useState(0);
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<"solve" | "reflect" | "explain">("solve");
  const [solved, setSolved] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [methods, setMethods] = useState<string[]>([]);
  // 右の解答カードと下端が綺麗に一直線に揃う初期高さ
  const [memoHeight, setMemoHeight] = useState(250);
  const rightColRef = useRef<HTMLDivElement>(null);
  const [initialRightHeight, setInitialRightHeight] = useState<number | null>(null);
  const hintBtnContainerRef = useRef<HTMLDivElement>(null);

  // 初期表示（hint === 0）の右カラム高さを計測し、左カラムの初期高さとしてボトムをぴったり揃える
  useLayoutEffect(() => {
    if (hint === 0 && rightColRef.current) {
      const h = rightColRef.current.offsetHeight;
      if (h > 0) {
        setInitialRightHeight(h);
      }
    }
  }, [problem.id]);

  // ヒントボタンを押した時は、ヒントボタン自体が画面内にしっかり見えるように自動スクロール
  const handleNextHint = () => {
    setHint((prev) => {
      const next = prev + 1;
      setTimeout(() => {
        hintBtnContainerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);
      return next;
    });
  };

  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(250);
  const start = useRef(Date.now());
  const elapsed = () => Math.round((Date.now() - start.current) / 1000);

  const check = (given: string) => {
    if (given.trim() === problem.answer) {
      playTone("correct");
      setSolved(true);
      setPhase("reflect");
    } else {
      playTone("retry");
      setValue("");
      setMsg("おしい！ もういちど かんがえてみよう");
    }
  };

  const finish = () => onDone({ solved, hintLevel: solved ? hint : 4, timeSec: elapsed(), methods });

  // メモ欄の下方向ドラッグリサイズハンドラー
  const handleDragDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartHeight.current = memoHeight;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dy = e.clientY - dragStartY.current;
    const nextH = Math.max(180, Math.min(850, dragStartHeight.current + dy));
    setMemoHeight(nextH);
  };
  const handleDragUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div className="relative w-full">
      {phase === "reflect" && <Confetti />}

      {phase === "solve" && (
        <div className="w-full flex flex-col gap-4 sm:gap-5">
          {/* 上部1カラム：問題文 & 図形（超立体アイボリー粘土カード） */}
          <section className="clay-card p-5 sm:p-7 w-full relative overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="clay-badge text-xs font-black bg-primary-soft text-primary-dark">
                {problem.typeTag}
              </span>
              <span className="clay-badge text-xs font-black bg-amber-100 text-amber-900 border border-amber-300/40">
                {DIFFICULTY_LABEL[problem.difficulty]}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-5 lg:gap-7">
              <div className="flex-1 text-left flex flex-col gap-3 min-w-0">
                {(() => {
                  // 改行や「。このとき」で自然なブロックに分割
                  const rawLines = problem.question.split("\n").flatMap((line) => {
                    const idx = line.indexOf("このとき");
                    if (idx > 0 && !line.startsWith("【")) {
                      return [line.slice(0, idx).trim(), line.slice(idx).trim()];
                    }
                    return [line.trim()];
                  }).filter(Boolean);

                  return rawLines.map((trimmed, idx) => {
                    // 【...ルール】等の前提条件カード
                    const isRule =
                      /^【.*?(ルール|きまり|条件).*?】/.test(trimmed) ||
                      trimmed.includes("向かい合う面の 目の合計は 必ず「7」") ||
                      trimmed.includes("向かい合う面の和が7");

                    if (isRule) {
                      return (
                        <div
                          key={idx}
                          className="clay-inset p-3 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-300/50 flex items-start gap-2.5 shadow-2xs"
                        >
                          <span className="shrink-0 clay-badge !py-0.5 !px-2.5 text-xs font-black bg-amber-200 text-amber-950 border border-amber-300 shadow-2xs">
                            💡 ルール
                          </span>
                          <p className="text-sm sm:text-base font-bold text-amber-950 leading-relaxed">
                            {trimmed.replace(/^【.*?】/, "").trim()}
                          </p>
                        </div>
                      );
                    }

                    // 最後の問いかけ行（「〜なに？」「〜いくつ？」など）
                    const isQuestion =
                      trimmed.startsWith("このとき") ||
                      /(なに|いくつ|なん|どれ|どうなる)[\?？]$/.test(trimmed);

                    if (isQuestion) {
                      return (
                        <div
                          key={idx}
                          className="mt-1 p-3 rounded-2xl bg-primary-soft/50 border border-primary/20 flex items-start gap-2.5"
                        >
                          <span className="shrink-0 clay-badge !py-0.5 !px-2.5 text-xs font-black bg-primary text-white shadow-2xs">
                            とい
                          </span>
                          <MathFormula
                            text={trimmed}
                            className="text-lg sm:text-xl md:text-2xl font-black text-foreground leading-relaxed"
                          />
                        </div>
                      );
                    }

                    // 通常の状況・条件文
                    return (
                      <div key={idx} className="text-base sm:text-lg md:text-xl font-bold text-foreground/90 leading-relaxed px-1">
                        <MathFormula text={trimmed} />
                      </div>
                    );
                  });
                })()}
              </div>

              {problem.figure && (
                <div className="w-full lg:w-auto lg:min-w-[400px] shrink-0 flex items-center justify-center p-3.5 sm:p-5 clay-tile-white !rounded-3xl border-2 border-white shadow-sm self-center lg:self-start">
                  <Figure kind={problem.figure} />
                </div>
              )}
            </div>
          </section>

          {/* 下部2カラム：左＝ひらめきメモ（初期表示は右とボトム同期・ヒント時は固定）、右＝答え（ヒント展開で自然に広がる） */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_380px] gap-4 lg:gap-6 items-start w-full">
            {/* 左カラム：ひらめきメモ（ヒントボタンを押す前の縦幅を厳密に固定保持） */}
            <div
              className="clay-card min-w-0 w-full flex flex-col justify-between p-4 sm:p-5"
              style={{
                height: initialRightHeight
                  ? `${Math.max(initialRightHeight, memoHeight + 170)}px`
                  : undefined,
              }}
            >
              <div className="flex flex-col gap-2.5 flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-sm sm:text-base font-black text-foreground flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <PenTool className="size-4 text-primary" /> ひらめきメモ（手書き）
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-muted-foreground hidden sm:inline whitespace-nowrap">
                      図や計算を自由に書こう
                    </span>
                    <button
                      type="button"
                      className="tap clay-badge text-xs font-black bg-surface text-foreground hover:scale-105 active:scale-95 whitespace-nowrap"
                      onClick={() => setMemoHeight((h) => Math.min(850, h + 100))}
                      title="メモ欄を下へ広げる"
                    >
                      <Plus className="size-3.5" />
                      <span>広げる</span>
                    </button>
                    {memoHeight > 250 && (
                      <button
                        type="button"
                        className="tap clay-badge text-xs font-black bg-muted/60 text-muted-foreground hover:scale-105 active:scale-95 whitespace-nowrap"
                        onClick={() => setMemoHeight(250)}
                        title="初期サイズに戻す"
                      >
                        <Minus className="size-3.5" />
                        <span>もどす</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 描画キャンバス（初期表示で右カラムとボトムを揃えるautoFill） */}
                <div className="clay-inset p-1.5 rounded-2xl bg-[#faf6f0] flex-1 min-h-0 flex flex-col">
                  <DrawCanvas height={memoHeight} templates autoFill />
                </div>
              </div>

              {/* 下方向にドラッグして広げられるハンドルバー */}
              <div
                className="mt-2.5 flex flex-col items-center justify-center py-1 cursor-row-resize select-none group touch-none rounded-xl hover:bg-muted/40 transition-colors"
                onPointerDown={handleDragDown}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragUp}
                onPointerCancel={handleDragUp}
                title="上下にドラッグしてメモ欄を自由に伸縮できます"
              >
                <div className="clay-badge !rounded-xl text-[11px] font-black text-muted-foreground group-hover:text-foreground !py-0.5 !px-3">
                  <GripHorizontal className="size-3.5" />
                  <span>ドラッグして下へ広げる ({memoHeight}px)</span>
                </div>
              </div>
            </div>

            {/* 右カラム：答え（初期高さを計測し、ヒントを押した時だけ下へ縦幅が広がる） */}
            <div ref={rightColRef} className="clay-card min-w-0 w-full flex flex-col p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                <span className="text-xs sm:text-sm font-black text-muted-foreground block">こたえを 入力</span>

                {problem.answerType === "choice" ? (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {problem.choices?.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="clay-tile-white min-h-14 sm:min-h-16 px-2 text-lg sm:text-xl font-black text-foreground active:scale-95 flex items-center justify-center"
                        onClick={() => check(c)}
                      >
                        <MathFormula text={c} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div
                      className="clay-inset mx-auto mb-1 min-h-14 sm:min-h-16 w-full rounded-2xl text-center text-3xl sm:text-4xl font-black text-foreground bg-[#ede5d8] flex items-center justify-center shadow-inner tracking-wider"
                      aria-live="polite"
                    >
                      {value || <span className="text-muted-foreground/40 text-xl font-bold">数字を入力</span>}
                    </div>
                    <Keypad value={value} onChange={setValue} onSubmit={() => check(value)} />
                  </>
                )}

                {/* おしいメッセージ */}
                {msg && (
                  <div className="clay-card-peach p-3 text-xs sm:text-sm font-black text-center text-[#592518]" role="status">
                    {msg}
                  </div>
                )}

                {/* ヒント表示（現在開いているもの） */}
                {hint > 0 && (
                  <div className="space-y-2 pt-1">
                    {problem.hints.slice(0, hint).map((h, i) => (
                      <div
                        key={i}
                        className="clay-card p-3 text-xs sm:text-sm font-bold"
                      >
                        <span className="clay-badge text-[10px] font-black bg-primary-soft text-primary-dark mb-1">
                          {HINT_TITLE[i + 1]}
                        </span>
                        <p className="mt-1 text-foreground leading-relaxed">{h}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ヒント＆解説ボタン（カード最下部：スクロール目標地点） */}
              <div
                ref={hintBtnContainerRef}
                className="flex items-center justify-between gap-2 pt-3 border-t border-border/60 mt-auto scroll-mb-6"
              >
                {hint < 3 ? (
                  <button
                    type="button"
                    className="tap clay-badge text-xs sm:text-sm font-black bg-surface text-foreground hover:scale-105 active:scale-95"
                    onClick={handleNextHint}
                  >
                    <Lightbulb className="size-4 text-amber-500" /> ヒント（{hint + 1}/3）
                  </button>
                ) : <span />}
                <button
                  type="button"
                  className="tap clay-badge text-xs sm:text-sm font-black bg-surface text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 ml-auto"
                  onClick={() => setPhase("explain")}
                >
                  かいせつをみる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === "reflect" && (
        <div className="max-w-xl mx-auto clay-card p-6 sm:p-8 text-center">
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--correct)" }}>
            ◎ せいかい！ {hint === 0 ? "じぶんの ちからで とけたね！" : ""}
          </p>
          <p className="mt-3 text-lg sm:text-xl font-black text-foreground">どうやって かんがえた？</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {METHOD_TAGS.map((m) => {
              const on = methods.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMethods(on ? methods.filter((x) => x !== m) : [...methods, m])}
                  className={`min-h-12 rounded-2xl px-3 text-base sm:text-lg font-black transition-all ${
                    on
                      ? "clay-tile-peach text-white shadow-md scale-102"
                      : "clay-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn-kid btn-primary mt-6 w-full py-3 text-base sm:text-lg font-black"
            onClick={() => setPhase("explain")}
          >
            かいせつと べつの ときかた
          </button>
        </div>
      )}

      {phase === "explain" && (
        <div className="max-w-xl mx-auto space-y-3.5 sm:space-y-4">
          <div className="clay-card p-5 sm:p-6 text-left">
            <span className="clay-badge text-xs font-black bg-primary-soft text-primary-dark">
              こたえ
            </span>
            <p className="text-3xl sm:text-4xl font-black text-primary mt-2">{problem.answer}</p>
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-foreground font-medium">{problem.explanation}</p>
          </div>
          {problem.altSolutions.map((a, i) => (
            <div key={i} className="clay-card p-4 sm:p-5 text-left">
              <span className="clay-badge text-xs font-black bg-muted/70 text-muted-foreground">
                べつの ときかた {i + 1}
              </span>
              <p className="text-sm sm:text-base leading-relaxed mt-2 text-foreground font-medium">{a}</p>
            </div>
          ))}

          {/* 下部：もんだいにもどる ＆ つぎへ ボタン */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              className="clay-card !rounded-2xl flex-1 py-3.5 text-base sm:text-lg font-black text-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform text-center flex items-center justify-center gap-2 border-2 border-white shadow-sm"
              onClick={() => setPhase("solve")}
            >
              <ArrowLeft className="size-5 text-primary" />
              <span>もんだいに もどる</span>
            </button>
            <button
              type="button"
              className="btn-kid btn-primary flex-1 py-3.5 text-base sm:text-lg font-black text-center flex items-center justify-center gap-2"
              onClick={finish}
            >
              <span>つぎへ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
