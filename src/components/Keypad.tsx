import { Delete } from "lucide-react";

export function Keypad({ value, onChange, onSubmit, disabled }: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const press = (k: string) => value.length < 5 && onChange(value + k);
  const btn = "clay-tile-white tap h-12 sm:h-14 md:h-15 text-2xl sm:text-3xl font-black text-foreground transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 flex items-center justify-center cursor-pointer select-none";
  return (
    <div className="mx-auto grid w-full max-w-sm sm:max-w-md grid-cols-3 gap-2.5 sm:gap-3">
      {keys.map((k) => (
        <button key={k} type="button" className={btn} onClick={() => press(k)} disabled={disabled}>
          {k}
        </button>
      ))}
      <button type="button" className={`${btn} text-muted-foreground`} onClick={() => onChange(value.slice(0, -1))} disabled={disabled} aria-label="けす">
        <Delete className="size-6 sm:size-7" />
      </button>
      <button type="button" className={btn} onClick={() => press("0")} disabled={disabled}>0</button>
      <button
        type="button"
        className="btn-kid btn-primary h-12 sm:h-14 md:h-15 min-h-0 px-2 text-base sm:text-lg md:text-xl font-black shadow-md cursor-pointer select-none"
        onClick={onSubmit}
        disabled={disabled || !value}
      >
        こたえる
      </button>
    </div>
  );
}
