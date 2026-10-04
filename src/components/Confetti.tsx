const COLORS = ["var(--primary)", "var(--secondary)", "var(--correct)", "var(--japanese)", "var(--english)", "var(--retry)"];

export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 block h-3 w-2 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % COLORS.length], animationDelay: `${(i % 6) * 40}ms` }}
        />
      ))}
    </div>
  );
}
