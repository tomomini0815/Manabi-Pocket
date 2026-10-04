import { Delete } from "lucide-react";

export function Keypad({ value, onChange, onSubmit, disabled }: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const press = (k: string) => value.length < 5 && onChange(value + k);
  const btn = "card-kid tap h-16 text-3xl font-bold transition-transform active:scale-95 disabled:opacity-40";
  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3">
      {keys.map((k) => (
        <button key={k} type="button" className={btn} onClick={() => press(k)} disabled={disabled}>
          {k}
        </button>
      ))}
      <button type="button" className={`${btn} flex items-center justify-center text-muted-foreground`} onClick={() => onChange(value.slice(0, -1))} disabled={disabled} aria-label="けす">
        <Delete className="size-7" />
      </button>
      <button type="button" className={btn} onClick={() => press("0")} disabled={disabled}>0</button>
      <button type="button" className="btn-kid btn-primary h-16 min-h-16 px-2 text-xl" onClick={onSubmit} disabled={disabled || !value}>
        こたえる
      </button>
    </div>
  );
}
