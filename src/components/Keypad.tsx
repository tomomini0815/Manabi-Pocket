import { Delete } from "lucide-react";

export function Keypad({ value, onChange, onSubmit, disabled }: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const press = (k: string) => value.length < 5 && onChange(value + k);
  const btn = "clay-tile-white tap h-10 sm:h-11 md:h-11 text-xl sm:text-2xl font-black text-foreground transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 flex items-center justify-center cursor-pointer select-none";
  return (
    <div className="mx-auto grid w-full max-w-[280px] sm:max-w-xs md:max-w-sm grid-cols-3 gap-1.5 sm:gap-2">
      {keys.map((k) => (
        <button key={k} type="button" className={btn} onClick={() => press(k)} disabled={disabled}>
          {k}
        </button>
      ))}
      <button type="button" className={`${btn} text-muted-foreground`} onClick={() => onChange(value.slice(0, -1))} disabled={disabled} aria-label="けす">
        <Delete className="size-5 sm:size-6" />
      </button>
      <button type="button" className={btn} onClick={() => press("0")} disabled={disabled}>0</button>
      <button
        type="button"
        className="tap h-10 sm:h-11 md:h-11 rounded-[20px] border-2 border-white/90 bg-gradient-to-b from-[#ff9233] to-[#ff6b00] text-white shadow-[0_8px_16px_-2px_rgba(255,107,0,0.35),inset_0_3px_4px_rgba(255,255,255,0.8),inset_0_-3.5px_5px_rgba(180,55,0,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 flex items-center justify-center cursor-pointer select-none text-xs sm:text-sm md:text-sm font-black"
        onClick={onSubmit}
        disabled={disabled || !value}
      >
        こたえる
      </button>
    </div>
  );
}
