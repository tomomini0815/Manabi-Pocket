import { useEffect, useRef, useState } from "react";
import { Eraser, Pencil, Trash2, Table2, Minus, Square } from "lucide-react";

type Tool = "pen" | "eraser";

/** Handwriting / ひらめきノート canvas. No recognition; drawing only. */
export function DrawCanvas({ height = 260, templates = false, guide }: { height?: number; templates?: boolean; guide?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("var(--foreground)");

  const ctx = () => ref.current?.getContext("2d") ?? null;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr;
      c.height = r.height * dpr;
      ctx()?.scale(dpr, dpr);
    };
    resize();
  }, []);

  const resolve = (v: string) => {
    if (!v.startsWith("var(")) return v;
    return getComputedStyle(document.documentElement).getPropertyValue(v.slice(4, -1)).trim() || "#2b2b3a";
  };

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    const c = ctx();
    if (!c) return;
    ref.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    c.lineWidth = tool === "eraser" ? 24 : 5;
    c.strokeStyle = resolve(color);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = ctx();
    const p = pos(e);
    c?.lineTo(p.x, p.y);
    c?.stroke();
  };
  const up = () => (drawing.current = false);

  const clear = () => {
    const c = ref.current;
    c && ctx()?.clearRect(0, 0, c.width, c.height);
  };

  const stamp = (kind: "line" | "table" | "box") => {
    const c = ctx();
    const el = ref.current;
    if (!c || !el) return;
    const w = el.getBoundingClientRect().width;
    c.globalCompositeOperation = "source-over";
    c.strokeStyle = resolve("var(--secondary)");
    c.lineWidth = 3;
    if (kind === "line") {
      const y = 40 + Math.random() * 40;
      c.strokeRect(24, y, w - 48, 24);
      for (let i = 1; i < 5; i++) {
        const x = 24 + ((w - 48) / 5) * i;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 24);
        c.stroke();
      }
    } else if (kind === "table") {
      const cols = 4, rows = 3, cw = Math.min(80, (w - 48) / cols), rh = 40;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) c.strokeRect(24 + k * cw, 110 + r * rh, cw, rh);
    } else {
      c.strokeRect(w / 2 - 50, 60, 100, 100);
    }
  };

  const toolBtn = (active: boolean) =>
    `tap inline-flex items-center justify-center rounded-md px-3 ${active ? "bg-think-deep text-surface" : "bg-surface text-muted-foreground"}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="ノートの どうぐ">
        <button type="button" className={toolBtn(tool === "pen" && color === "var(--foreground)")} onClick={() => { setTool("pen"); setColor("var(--foreground)"); }} aria-label="ペン">
          <Pencil className="size-5" />
        </button>
        <button type="button" className={toolBtn(tool === "pen" && color === "var(--primary)")} onClick={() => { setTool("pen"); setColor("var(--primary)"); }} aria-label="オレンジの ペン">
          <span className="size-5 rounded-full bg-primary" />
        </button>
        <button type="button" className={toolBtn(tool === "eraser")} onClick={() => setTool("eraser")} aria-label="けしごむ">
          <Eraser className="size-5" />
        </button>
        {templates && (
          <>
            <button type="button" className={toolBtn(false)} onClick={() => stamp("line")} aria-label="せんぶんず"><Minus className="size-5" /><span className="ml-1 text-sm">せんぶんず</span></button>
            <button type="button" className={toolBtn(false)} onClick={() => stamp("table")} aria-label="ひょう"><Table2 className="size-5" /><span className="ml-1 text-sm">ひょう</span></button>
            <button type="button" className={toolBtn(false)} onClick={() => stamp("box")} aria-label="しかく"><Square className="size-5" /></button>
          </>
        )}
        <button type="button" className={`${toolBtn(false)} ml-auto`} onClick={clear} aria-label="ぜんぶ けす">
          <Trash2 className="size-5" />
        </button>
      </div>
      <div className="relative">
        {guide && (
          <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-bold text-border select-none">
            {guide}
          </span>
        )}
        <canvas
          ref={ref}
          style={{ height, touchAction: "none" }}
          className="relative w-full rounded-xl border-2 border-dashed border-input bg-surface"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
      </div>
    </div>
  );
}
