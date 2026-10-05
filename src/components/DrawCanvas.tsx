import { useEffect, useRef, useState } from "react";
import { Eraser, Pencil, Trash2, Table2, Minus, Square } from "lucide-react";

type Tool = "pen" | "eraser";

/** Handwriting / ひらめきノート canvas. No recognition; drawing only. */
export function DrawCanvas({
  height = 260,
  className = "",
  templates = false,
  guide,
  autoFill = false,
}: {
  height?: number | string;
  className?: string;
  templates?: boolean;
  guide?: string;
  autoFill?: boolean;
}) {
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
      if (r.width === 0 || r.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      
      // 既存の描画内容を退避
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = c.width;
      tempCanvas.height = c.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx && c.width > 0 && c.height > 0) {
        tempCtx.drawImage(c, 0, 0);
      }

      c.width = r.width * dpr;
      c.height = r.height * dpr;
      const context = ctx();
      if (context) {
        context.scale(dpr, dpr);
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
          context.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr);
        }
      }
    };

    resize();

    // 画面幅やコンテナの広がりを検知して自動追従
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        resize();
      });
      observer.observe(c);

      return () => observer.disconnect();
    }
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
    `tap inline-flex items-center justify-center rounded-xl px-2.5 sm:px-3 py-1.5 transition-all text-xs sm:text-sm font-black whitespace-nowrap ${
      active
        ? "clay-tile-peach text-white shadow-xs scale-105"
        : "clay-badge bg-surface text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
    }`;

  return (
    <div className={`flex flex-col gap-2 ${autoFill ? "h-full flex-1 min-h-0" : ""}`}>
      <div className="flex items-center gap-1.5 sm:gap-2 px-1 py-1 overflow-x-hidden no-scrollbar shrink-0" role="toolbar" aria-label="ノートの どうぐ">
        <button
          type="button"
          className={toolBtn(tool === "pen" && color === "var(--foreground)")}
          onClick={() => { setTool("pen"); setColor("var(--foreground)"); }}
          aria-label="ペン"
        >
          <Pencil className="size-4 sm:size-5" />
        </button>
        <button
          type="button"
          className={toolBtn(tool === "pen" && color === "var(--primary)")}
          onClick={() => { setTool("pen"); setColor("var(--primary)"); }}
          aria-label="オレンジの ペン"
        >
          <span className="size-4 sm:size-5 rounded-full bg-primary inline-block" />
        </button>
        <button
          type="button"
          className={toolBtn(tool === "eraser")}
          onClick={() => setTool("eraser")}
          aria-label="けしごむ"
        >
          <Eraser className="size-4 sm:size-5" />
        </button>
        {templates && (
          <>
            <button
              type="button"
              className={toolBtn(false)}
              onClick={() => stamp("line")}
              aria-label="せんぶんず"
            >
              <Minus className="size-4" />
              <span className="ml-1">せんぶんず</span>
            </button>
            <button
              type="button"
              className={toolBtn(false)}
              onClick={() => stamp("table")}
              aria-label="ひょう"
            >
              <Table2 className="size-4" />
              <span className="ml-1">ひょう</span>
            </button>
            <button
              type="button"
              className={toolBtn(false)}
              onClick={() => stamp("box")}
              aria-label="しかく"
            >
              <Square className="size-4" />
              <span className="ml-1">しかく</span>
            </button>
          </>
        )}
        <button
          type="button"
          className="tap inline-flex items-center justify-center rounded-xl px-2.5 sm:px-3 py-1.5 transition-all text-xs sm:text-sm font-black whitespace-nowrap clay-badge bg-surface text-muted-foreground hover:text-destructive active:scale-95 ml-auto"
          onClick={clear}
          aria-label="ぜんぶ けす"
          title="ぜんぶ けす"
        >
          <Trash2 className="size-4 sm:size-5" />
        </button>
      </div>
      <div className={`relative ${autoFill ? "flex-1 min-h-0 flex flex-col" : ""}`}>
        {guide && (
          <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-bold text-border select-none">
            {guide}
          </span>
        )}
        <canvas
          ref={ref}
          style={{
            minHeight: typeof height === "number" ? `${height}px` : height,
            height: autoFill ? "100%" : height,
            touchAction: "none",
          }}
          className={`relative w-full rounded-xl border-2 border-dashed border-input bg-surface ${autoFill ? "flex-1 min-h-0" : ""} ${className}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
      </div>
    </div>
  );
}
