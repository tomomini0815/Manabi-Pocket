/** Original character "ぽけっと" that grows: seed → sprout → tree → fruit. */
export function Pocket({ stage, size = 120, happy = false }: { stage: number; size?: number; happy?: boolean }) {
  const label = ["たね", "め", "き", "み"][stage] ?? "たね";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`ぽけっと（${label}）`}>
      <g className={happy ? "animate-pop" : "animate-sway"} style={{ transformOrigin: "60px 100px" }}>
        {stage === 0 && (
          <g>
            <ellipse cx="60" cy="82" rx="22" ry="18" fill="var(--soil)" />
            <path d="M60 64 q4 -8 10 -8" stroke="var(--thinking)" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        )}
        {stage === 1 && (
          <g>
            <path d="M60 92 V60" stroke="var(--thinking)" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="44" cy="56" rx="16" ry="9" fill="var(--thinking)" transform="rotate(-25 44 56)" />
            <ellipse cx="76" cy="56" rx="16" ry="9" fill="var(--thinking)" transform="rotate(25 76 56)" />
            <circle cx="60" cy="80" r="16" fill="var(--soil)" />
          </g>
        )}
        {stage >= 2 && (
          <g>
            <rect x="53" y="62" width="14" height="32" rx="5" fill="var(--soil)" />
            <circle cx="60" cy="50" r="34" fill="var(--thinking)" />
            {stage === 3 && (
              <g fill="var(--primary)">
                <circle cx="36" cy="40" r="7" />
                <circle cx="84" cy="42" r="7" />
                <circle cx="60" cy="22" r="7" />
                <circle cx="78" cy="68" r="6" />
                <circle cx="40" cy="66" r="6" />
              </g>
            )}
          </g>
        )}
        {/* face */}
        <g transform={stage >= 2 ? "translate(0,-28)" : stage === 1 ? "translate(0,0)" : "translate(0,2)"}>
          <circle cx="53" cy="78" r="3" fill="var(--foreground)" />
          <circle cx="67" cy="78" r="3" fill="var(--foreground)" />
          <path d={happy ? "M52 85 q8 9 16 0" : "M54 86 q6 5 12 0"} stroke="var(--foreground)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="47" cy="84" r="3" fill="var(--japanese)" opacity="0.5" />
          <circle cx="73" cy="84" r="3" fill="var(--japanese)" opacity="0.5" />
        </g>
      </g>
      <rect x="30" y="96" width="60" height="18" rx="6" fill="var(--primary)" />
      <rect x="26" y="92" width="68" height="8" rx="4" fill="var(--primary-dark)" />
    </svg>
  );
}
