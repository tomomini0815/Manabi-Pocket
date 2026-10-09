import { useEffect, useRef, useState, useCallback } from "react";
import {
  Eraser,
  Pencil,
  Trash2,
  Table2,
  Minus,
  Square,
  Circle,
  Triangle,
  Grid3X3,
  Move,
  ChevronDown,
  Plus,
  ArrowRight,
  GripHorizontal,
  X,
  Check,
} from "lucide-react";

export type Tool = "pen" | "eraser" | "select";

export type ShapeType =
  | "table"       // ひょう（表）
  | "line"        // せんぶんず（線分図）
  | "numberline"  // すうせん（数直線）
  | "grid"        // マス目（方眼・筆算枠）
  | "box"         // しかく（四角・面積図）
  | "circle"      // まる（円）
  | "triangle";   // さんかく（三角形）

export interface CanvasShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  cols?: number;       // table用 列数
  rows?: number;       // table用 行数
  divisions?: number;  // line用 分割数
  subdivisions?: number; // numberline用 目盛り数
  gridCols?: number;   // grid用
  gridRows?: number;   // grid用
}

/** Handwriting / ひらめきノート canvas. Interactive learning shapes with mobile-optimized menu */
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("var(--foreground)");

  // 学習用図形オブジェクトのリスト
  const [shapes, setShapes] = useState<CanvasShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // 図形追加ドロップダウンの開閉
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  // ポップオーバー位置の動的計算（画面端からのはみ出しを確実に防止）
  const updateMenuCoords = useCallback(() => {
    if (!shapeMenuRef.current) return;
    const rect = shapeMenuRef.current.getBoundingClientRect();
    const screenW = typeof window !== "undefined" ? window.innerWidth : 360;
    const menuWidth = Math.min(270, Math.max(220, screenW - 24));

    // ボタン中央揃えを基準としつつ、画面左右端12px以内に収める
    let left = rect.left + rect.width / 2 - menuWidth / 2;
    if (left < 12) left = 12;
    if (left + menuWidth > screenW - 12) {
      left = Math.max(12, screenW - menuWidth - 12);
    }

    const screenH = typeof window !== "undefined" ? window.innerHeight : 600;
    const estimatedMenuHeight = 250;
    let top = rect.bottom + 6;
    if (top + estimatedMenuHeight > screenH - 12 && rect.top > estimatedMenuHeight + 12) {
      top = rect.top - estimatedMenuHeight - 6;
    }

    setMenuCoords({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(menuWidth),
    });
  }, []);

  const toggleShapeMenu = () => {
    if (!isShapeMenuOpen) {
      updateMenuCoords();
      setIsShapeMenuOpen(true);
    } else {
      setIsShapeMenuOpen(false);
    }
  };

  useEffect(() => {
    if (!isShapeMenuOpen) return;
    updateMenuCoords();
    window.addEventListener("resize", updateMenuCoords);
    window.addEventListener("scroll", updateMenuCoords, true);
    return () => {
      window.removeEventListener("resize", updateMenuCoords);
      window.removeEventListener("scroll", updateMenuCoords, true);
    };
  }, [isShapeMenuOpen, updateMenuCoords]);

  // ドラッグ操作（移動・リサイズ）の状態
  const dragRef = useRef<{
    kind: "move" | "resize-se" | "resize-e" | "resize-s";
    shapeId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const ctx = () => canvasRef.current?.getContext("2d") ?? null;

  // キャンバスのリサイズ対応（無限ResizeObserverループ防止ガード付き）
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    let rafId: number | null = null;

    const resize = () => {
      const r = c.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(r.width * dpr);
      const targetH = Math.round(r.height * dpr);

      // すでに同一サイズなら何もしない（無限ループ防止ガード）
      if (c.width === targetW && c.height === targetH) return;

      // 既存の手書き内容を退避
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = c.width;
      tempCanvas.height = c.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx && c.width > 0 && c.height > 0) {
        tempCtx.drawImage(c, 0, 0);
      }

      c.width = targetW;
      c.height = targetH;
      const context = ctx();
      if (context) {
        context.scale(dpr, dpr);
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
          context.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr);
        }
      }
    };

    resize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(resize);
      });
      observer.observe(c);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ポップオーバー外クリック検知
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (!isShapeMenuOpen) return;
      const target = e.target as Node;
      if (
        shapeMenuRef.current &&
        !shapeMenuRef.current.contains(target) &&
        (!menuRef.current || !menuRef.current.contains(target))
      ) {
        setIsShapeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isShapeMenuOpen]);

  const resolveColor = useCallback((v: string) => {
    if (!v.startsWith("var(")) return v;
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(v.slice(4, -1))
        .trim() || "#2b2b3a"
    );
  }, []);

  // 図形の配置完了（図形選択を解除し、すぐにペンで書き込めるようにペンモードに戻す）
  const finishShapePlacement = useCallback(() => {
    setSelectedShapeId(null);
    setTool("pen");
  }, []);

  // 図形選択時、図形やツールバー以外の外部領域をクリック/タップしたときも配置完了にする
  useEffect(() => {
    if (!selectedShapeId && tool !== "select") return;

    const handleOutsidePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // コンテナ内のボタンや図形、シェイプメニューなら除外
      if (
        target.closest("[data-shape-id]") ||
        target.closest("button") ||
        target.closest("[data-resize-handle]") ||
        (menuRef.current && menuRef.current.contains(target))
      ) {
        return;
      }
      finishShapePlacement();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [selectedShapeId, tool, finishShapePlacement]);

  // 手書きペンのポインター座標
  const getCanvasPos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDownCanvas = (e: React.PointerEvent) => {
    // 選択中または「うごかす」モード時は、余白タップで即座に配置完了（ペンに切り替え）
    if (tool === "select" || selectedShapeId !== null) {
      finishShapePlacement();
      return;
    }

    const c = ctx();
    if (!c) return;
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = getCanvasPos(e);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    c.lineWidth = tool === "eraser" ? 24 : 5;
    c.strokeStyle = resolveColor(color);
  };

  const onPointerMoveCanvas = (e: React.PointerEvent) => {
    if (!drawing.current || tool === "select") return;
    const c = ctx();
    const p = getCanvasPos(e);
    c?.lineTo(p.x, p.y);
    c?.stroke();
  };

  const onPointerUpCanvas = () => {
    drawing.current = false;
  };

  // 全消去
  const clearAll = () => {
    const c = canvasRef.current;
    if (c) {
      ctx()?.clearRect(0, 0, c.width, c.height);
    }
    setShapes([]);
    setSelectedShapeId(null);
  };

  // 新しい図形を追加する
  const addShape = (type: ShapeType) => {
    setIsShapeMenuOpen(false);

    const c = canvasRef.current;
    const containerWidth = c ? c.getBoundingClientRect().width : 340;
    const containerHeight = c ? c.getBoundingClientRect().height : 240;

    let initW = 180;
    let initH = 100;
    let extraProps: Partial<CanvasShape> = {};

    switch (type) {
      case "table":
        initW = Math.min(260, containerWidth - 40);
        initH = 110;
        extraProps = { cols: 3, rows: 3 };
        break;
      case "line":
        initW = Math.min(260, containerWidth - 40);
        initH = 44;
        extraProps = { divisions: 4 };
        break;
      case "numberline":
        initW = Math.min(260, containerWidth - 40);
        initH = 50;
        extraProps = { subdivisions: 5 };
        break;
      case "grid":
        initW = 160;
        initH = 160;
        extraProps = { gridCols: 4, gridRows: 4 };
        break;
      case "box":
        initW = 150;
        initH = 110;
        break;
      case "circle":
        initW = 130;
        initH = 130;
        break;
      case "triangle":
        initW = 150;
        initH = 120;
        break;
    }

    // キャンバス中央付近に配置
    const x = Math.max(16, (containerWidth - initW) / 2);
    const y = Math.max(16, (containerHeight - initH) / 2);

    const newShape: CanvasShape = {
      id: "shape-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      type,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(initW),
      height: Math.round(initH),
      ...extraProps,
    };

    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
    setTool("select"); // 直感的に動かせるように選択モードへ
  };

  // 図形の削除
  const removeShape = (id: string) => {
    setShapes((prev) => prev.filter((s) => s.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  };

  // 図形のプロパティ更新
  const updateShape = (id: string, updates: Partial<CanvasShape>) => {
    setShapes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  // 移動・リサイズのポインタ制御（モバイルでも指が外れず滑らかに追従するグローバルリスナー方式）
  const startDrag = (
    e: React.PointerEvent,
    shape: CanvasShape,
    kind: "move" | "resize-se" | "resize-e" | "resize-s"
  ) => {
    e.stopPropagation();
    // モバイルでのスクロールやテキスト選択の誤爆を防止
    if (e.cancelable) e.preventDefault();

    setSelectedShapeId(shape.id);
    dragRef.current = {
      kind,
      shapeId: shape.id,
      startX:
        typeof e.clientX === "number"
          ? e.clientX
          : ((e as any).pageX ?? (e as any).touches?.[0]?.clientX ?? 0),
      startY:
        typeof e.clientY === "number"
          ? e.clientY
          : ((e as any).pageY ?? (e as any).touches?.[0]?.clientY ?? 0),
      origX: shape.x,
      origY: shape.y,
      origW: shape.width,
      origH: shape.height,
    };

    const handlePointerMove = (ev: PointerEvent | MouseEvent) => {
      if (!dragRef.current) return;
      const { kind: currentKind, shapeId, startX, startY, origX, origY, origW, origH } = dragRef.current;
      const clientX =
        typeof ev.clientX === "number"
          ? ev.clientX
          : ((ev as any).pageX ?? (ev as any).touches?.[0]?.clientX ?? startX);
      const clientY =
        typeof ev.clientY === "number"
          ? ev.clientY
          : ((ev as any).pageY ?? (ev as any).touches?.[0]?.clientY ?? startY);
      const dx = clientX - startX;
      const dy = clientY - startY;

      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== shapeId) return s;

          if (currentKind === "move") {
            return {
              ...s,
              x: Math.max(0, Math.round(origX + dx)),
              y: Math.max(0, Math.round(origY + dy)),
            };
          } else if (currentKind === "resize-se") {
            return {
              ...s,
              width: Math.max(50, Math.round(origW + dx)),
              height: Math.max(30, Math.round(origH + dy)),
            };
          } else if (currentKind === "resize-e") {
            return {
              ...s,
              width: Math.max(50, Math.round(origW + dx)),
            };
          } else if (currentKind === "resize-s") {
            return {
              ...s,
              height: Math.max(30, Math.round(origH + dy)),
            };
          }
          return s;
        })
      );
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove as EventListener);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("mousemove", handlePointerMove as EventListener);
      window.removeEventListener("mouseup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove as EventListener, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("mousemove", handlePointerMove as EventListener, { passive: false });
    window.addEventListener("mouseup", handlePointerUp);
  };

  const onDragPointerMove = (_e: React.PointerEvent) => {
    // windowリスナー側で処理されるため互換性維持
  };

  const endDrag = (_e: React.PointerEvent) => {
    dragRef.current = null;
  };

  // ツールバーボタン用のクラス定義（clay-badgeの固定パディングを!p-0/!px-で上書き）
  const toolBtn = (active: boolean, isSquare = true) =>
    `tap inline-flex items-center justify-center rounded-xl transition-all font-black shrink-0 whitespace-nowrap cursor-pointer select-none text-xs ${
      isSquare ? "size-7.5 sm:size-8 !p-0" : "h-7.5 sm:h-8 !px-2 sm:!px-2.5 !py-0"
    } ${
      active
        ? "clay-tile-peach text-white shadow-xs scale-105"
        : "clay-badge bg-surface text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
    }`;

  // 選択中図形の情報を取得
  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-1.5 relative w-full max-w-full min-w-0 ${autoFill ? "h-full flex-1 min-h-0" : ""}`}
    >
      {/* ツールバー：モバイル時はテキストを隠してコンパクトに集約、カードからはみ出ない設計 */}
      <div
        className="w-full max-w-full flex items-center justify-between gap-1 px-0.5 py-0.5 shrink-0 z-20 min-w-0"
        role="toolbar"
        aria-label="ノートの どうぐ"
      >
        {/* 左側ツール群 */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
          {/* ペン（黒） */}
          <button
            type="button"
            className={toolBtn(tool === "pen" && color === "var(--foreground)", true)}
            onClick={() => {
              setTool("pen");
              setColor("var(--foreground)");
            }}
            aria-label="黒のペン"
            title="黒ペンで手書き"
          >
            <Pencil className="size-3.5 sm:size-4" />
          </button>

          {/* ペン（オレンジ） */}
          <button
            type="button"
            className={toolBtn(tool === "pen" && color === "var(--primary)", true)}
            onClick={() => {
              setTool("pen");
              setColor("var(--primary)");
            }}
            aria-label="オレンジのペン"
            title="オレンジペンで手書き"
          >
            <span className="size-3 sm:size-3.5 rounded-full bg-primary inline-block shrink-0 shadow-2xs" />
          </button>

          {/* けしごむ */}
          <button
            type="button"
            className={toolBtn(tool === "eraser", true)}
            onClick={() => {
              setTool("eraser");
              setSelectedShapeId(null);
            }}
            aria-label="けしごむ"
            title="ペンで書いた線を消す"
          >
            <Eraser className="size-3.5 sm:size-4" />
          </button>

          {/* うごかす（図形の選択・移動・広げるモード：モバイルはアイコンのみ） */}
          <button
            type="button"
            className={`tap inline-flex items-center justify-center rounded-xl transition-all font-black shrink-0 whitespace-nowrap cursor-pointer select-none text-xs h-7.5 sm:h-8 w-7.5 sm:w-auto !p-0 sm:!px-2.5 ${
              tool === "select"
                ? "clay-tile-peach text-white shadow-xs scale-105"
                : "clay-badge bg-surface text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
            }`}
            onClick={() => {
              setTool("select");
              if (!selectedShapeId && shapes.length > 0) {
                const last = shapes[shapes.length - 1];
                if (last) setSelectedShapeId(last.id);
              }
            }}
            aria-label="うごかす"
            title="図形を選んで移動したり広げたりする"
          >
            <Move className="size-3.5 sm:size-4" />
            <span className="hidden sm:inline ml-1 text-xs">うごかす</span>
          </button>

          {/* 集約された「ずけい」メニュー（templates有効時：モバイルはアイコン＋矢印のみでコンパクト） */}
          {templates && (
            <div className="relative inline-block shrink-0" ref={shapeMenuRef}>
              <button
                type="button"
                className={`tap inline-flex items-center justify-center rounded-xl transition-all font-black shrink-0 whitespace-nowrap cursor-pointer select-none text-xs h-7.5 sm:h-8 !px-1.5 sm:!px-2.5 !py-0 ${
                  isShapeMenuOpen
                    ? "clay-tile-peach text-white shadow-xs scale-105"
                    : "clay-badge bg-surface text-foreground hover:scale-105 active:scale-95"
                }`}
                onClick={toggleShapeMenu}
                aria-expanded={isShapeMenuOpen}
                aria-label="学習図形を追加する"
                title="表や線分図などの学習図形を追加"
              >
                <Table2 className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline ml-1 text-xs">ずけい</span>
                <ChevronDown
                  className={`size-2.5 sm:size-3 ml-0.5 transition-transform duration-200 ${
                    isShapeMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* 図形選択ドロップダウンメニュー（画面端からのはみ出しを確実に防止） */}
              {isShapeMenuOpen && (
                <div
                  ref={menuRef}
                  style={
                    menuCoords
                      ? {
                          position: "fixed",
                          top: `${menuCoords.top}px`,
                          left: `${menuCoords.left}px`,
                          width: `${menuCoords.width}px`,
                        }
                      : {
                          position: "fixed",
                          top: "60px",
                          left: "12px",
                          width: "270px",
                        }
                  }
                  className="fixed z-50 p-2.5 rounded-2xl bg-surface/98 border-2 border-primary/20 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 max-w-[calc(100vw-24px)]"
                  role="menu"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/60">
                    <span className="text-[11px] font-black text-muted-foreground flex items-center gap-1">
                      📐 学習に役立つ図形
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsShapeMenuOpen(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded-lg cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* 表 */}
                    <button
                      type="button"
                      onClick={() => addShape("table")}
                      className="flex items-center gap-2 p-2 rounded-xl text-left bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-black border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <Table2 className="size-4 text-secondary shrink-0" />
                      <div>
                        <div>ひょう（表）</div>
                        <div className="text-[10px] text-muted-foreground font-normal">つるかめ算・集計</div>
                      </div>
                    </button>

                    {/* 線分図 */}
                    <button
                      type="button"
                      onClick={() => addShape("line")}
                      className="flex items-center gap-2 p-2 rounded-xl text-left bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-black border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <Minus className="size-4 text-secondary shrink-0 stroke-[3]" />
                      <div>
                        <div>せんぶんず</div>
                        <div className="text-[10px] text-muted-foreground font-normal">和差算・比・文章題</div>
                      </div>
                    </button>

                    {/* 数直線 */}
                    <button
                      type="button"
                      onClick={() => addShape("numberline")}
                      className="flex items-center gap-2 p-2 rounded-xl text-left bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-black border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <ArrowRight className="size-4 text-secondary shrink-0" />
                      <div>
                        <div>すうせん（数直線）</div>
                        <div className="text-[10px] text-muted-foreground font-normal">正負・分数・目盛り</div>
                      </div>
                    </button>

                    {/* マス目 */}
                    <button
                      type="button"
                      onClick={() => addShape("grid")}
                      className="flex items-center gap-2 p-2 rounded-xl text-left bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-black border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <Grid3X3 className="size-4 text-secondary shrink-0" />
                      <div>
                        <div>マス目（筆算）</div>
                        <div className="text-[10px] text-muted-foreground font-normal">位取り・方眼ノート</div>
                      </div>
                    </button>

                    {/* 四角 */}
                    <button
                      type="button"
                      onClick={() => addShape("box")}
                      className="flex items-center gap-2 p-2 rounded-xl text-left bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-black border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <Square className="size-4 text-secondary shrink-0" />
                      <div>
                        <div>しかく（面積図）</div>
                        <div className="text-[10px] text-muted-foreground font-normal">たて×よこの計算</div>
                      </div>
                    </button>

                    {/* 丸 */}
                    <button
                      type="button"
                      onClick={() => addShape("circle")}
                      className="flex items-center gap-2 p-2 rounded-xl text-left bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-black border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <Circle className="size-4 text-secondary shrink-0" />
                      <div>
                        <div>まる（円）</div>
                        <div className="text-[10px] text-muted-foreground font-normal">集合・分数円グラフ</div>
                      </div>
                    </button>

                    {/* 三角 */}
                    <button
                      type="button"
                      onClick={() => addShape("triangle")}
                      className="flex items-center gap-2 p-2 rounded-xl text-left bg-muted/40 hover:bg-primary-soft hover:text-primary transition-all text-xs font-black border border-transparent hover:border-primary/20 col-span-2 cursor-pointer"
                    >
                      <Triangle className="size-4 text-secondary shrink-0" />
                      <div>
                        <div>さんかく（三角形）</div>
                        <div className="text-[10px] text-muted-foreground font-normal">底辺×高さの図形思考</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右側：ぜんぶ消すボタン（モバイルは正方形アイコンで横幅を最小化） */}
        <button
          type="button"
          className="tap inline-flex items-center justify-center rounded-xl size-7.5 sm:size-8 sm:w-auto !p-0 sm:!px-2.5 transition-all text-xs font-black shrink-0 whitespace-nowrap clay-badge bg-surface text-muted-foreground hover:text-destructive active:scale-95 cursor-pointer ml-auto"
          onClick={clearAll}
          aria-label="ぜんぶ けす"
          title="メモと図形をぜんぶ消す"
        >
          <Trash2 className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline ml-1 text-xs">ぜんぶ消す</span>
        </button>
      </div>

      {/* キャンバスおよび図形描画エリア */}
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed border-[#d8cdbf] bg-[#faf6f0] select-none ${
          autoFill ? "flex-1 min-h-0 flex flex-col" : ""
        }`}
        style={{
          minHeight: typeof height === "number" ? `${height}px` : height,
          height: autoFill ? "100%" : height,
          backgroundImage: "radial-gradient(#d3c6b5 1.1px, transparent 1.1px)",
          backgroundSize: "20px 20px",
        }}
        onPointerDown={(e) => {
          // タップされた要素が図形本体・ボタン・リサイズハンドルでなければ即座に配置完了（ペンに切り替え）
          const target = e.target as HTMLElement;
          if (
            target.closest("[data-shape-id]") ||
            target.closest("button") ||
            target.closest("[data-resize-handle]")
          ) {
            return;
          }
          if (selectedShapeId !== null || tool === "select") {
            finishShapePlacement();
          }
        }}
      >
        {guide && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-bold text-border select-none"
          >
            {guide}
          </span>
        )}

        {/* 手書きHTML5 Canvas レイヤー */}
        <canvas
          ref={canvasRef}
          style={{ touchAction: "none" }}
          className={`absolute inset-0 w-full h-full ${
            tool === "select" ? "cursor-default" : "cursor-crosshair"
          } ${className}`}
          onPointerDown={onPointerDownCanvas}
          onPointerMove={onPointerMoveCanvas}
          onPointerUp={onPointerUpCanvas}
          onPointerLeave={onPointerUpCanvas}
        />

        {/* インタラクティブ図形（Shapes）レイヤー */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          onPointerMove={onDragPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {shapes.map((s) => {
            const isSelected = s.id === selectedShapeId;
            return (
              <div
                key={s.id}
                data-shape-id={s.id}
                style={{
                  left: `${s.x}px`,
                  top: `${s.y}px`,
                  width: `${s.width}px`,
                  height: `${s.height}px`,
                  touchAction: "none",
                }}
                className={`absolute group transition-shadow select-none ${
                  // ペン描画時でも選択中なら操作可能、あるいはうごかすモードなら常に操作可能
                  tool === "select" || isSelected
                    ? "pointer-events-auto cursor-grab active:cursor-grabbing"
                    : "pointer-events-none"
                }`}
                onPointerDown={(e) => {
                  const target = e.target as HTMLElement;
                  // ボタン類やリサイズハンドルをタップした時は移動ドラッグを開始しない
                  if (target.closest("button") || target.closest("[data-resize-handle]")) {
                    return;
                  }
                  if (tool === "select" || isSelected) {
                    startDrag(e, s, "move");
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedShapeId(s.id);
                }}
              >
                {/* 選択中の外枠ハイライト */}
                {isSelected && (
                  <div className="absolute -inset-1.5 rounded-xl border-2 border-primary/80 bg-primary/5 pointer-events-none z-10 shadow-xs" />
                )}

                {/* 選択時の中央ドラッグ移動グリップ表示（モバイルでどこを触ればいいか一目でわかる） */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
                    <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shadow-xs backdrop-blur-xs opacity-75 group-hover:opacity-100 transition-opacity">
                      <Move className="size-4.5" />
                    </div>
                  </div>
                )}

                {/* 図形本体の描画 */}
                <div className="w-full h-full relative">
                  {s.type === "table" && (
                    <div
                      className="w-full h-full border-[2.5px] border-[#74a48f] rounded-md grid bg-[#74a48f]/5"
                      style={{
                        gridTemplateColumns: `repeat(${s.cols || 3}, 1fr)`,
                        gridTemplateRows: `repeat(${s.rows || 3}, 1fr)`,
                      }}
                    >
                      {Array.from({ length: (s.cols || 3) * (s.rows || 3) }).map((_, idx) => (
                        <div
                          key={idx}
                          className="border-r border-b border-[#74a48f] last:border-r-0"
                          style={{
                            borderRight:
                              (idx + 1) % (s.cols || 3) === 0 ? "none" : "1.5px solid #74a48f",
                            borderBottom:
                              idx >= (s.cols || 3) * ((s.rows || 3) - 1)
                                ? "none"
                                : "1.5px solid #74a48f",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {s.type === "line" && (
                    <div className="w-full h-full flex flex-col justify-center">
                      <div className="w-full h-7 border-[2.5px] border-[#74a48f] bg-[#74a48f]/5 rounded-sm flex">
                        {Array.from({ length: s.divisions || 4 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="flex-1 border-r border-[#74a48f] last:border-r-0 h-full"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {s.type === "numberline" && (() => {
                    const sub = s.subdivisions || 5;
                    return (
                      <div className="w-full h-full flex flex-col justify-center relative select-none">
                        {/* 横軸 */}
                        <div className="w-full h-[3px] bg-[#74a48f] relative">
                          {/* 矢印 */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-[#74a48f]" />
                        </div>
                        {/* 目盛り（矢印の手前まで均等に配置） */}
                        <div className="absolute left-1 right-3.5 top-1/2 -translate-y-1/2 flex justify-between">
                          {Array.from({ length: sub + 1 }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`bg-[#74a48f] ${
                                idx === 0 || idx === sub
                                   ? "w-[2.5px] h-4.5 -mt-2.5"
                                   : "w-[1.5px] h-3 -mt-1.5"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="absolute left-1 bottom-0 text-[10px] font-black text-[#74a48f]">
                          0
                        </span>
                      </div>
                    );
                  })()}

                  {s.type === "grid" && (
                    <div
                      className="w-full h-full border-[2.5px] border-[#74a48f] rounded-md grid bg-[#74a48f]/5"
                      style={{
                        gridTemplateColumns: `repeat(${s.gridCols || 4}, 1fr)`,
                        gridTemplateRows: `repeat(${s.gridRows || 4}, 1fr)`,
                      }}
                    >
                      {Array.from({ length: (s.gridCols || 4) * (s.gridRows || 4) }).map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            borderRight:
                              (idx + 1) % (s.gridCols || 4) === 0 ? "none" : "1px dashed #74a48f",
                            borderBottom:
                              idx >= (s.gridCols || 4) * ((s.gridRows || 4) - 1)
                                ? "none"
                                : "1px dashed #74a48f",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {s.type === "box" && (
                    <div className="w-full h-full border-[2.5px] border-[#74a48f] rounded-md bg-[#74a48f]/5" />
                  )}

                  {s.type === "circle" && (
                    <div className="w-full h-full border-[2.5px] border-[#74a48f] rounded-full bg-[#74a48f]/5 flex items-center justify-center">
                      <span className="size-1 rounded-full bg-[#74a48f]" />
                    </div>
                  )}

                  {s.type === "triangle" && (
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polygon
                        points="10,90 90,90 10,10"
                        fill="rgba(116, 164, 143, 0.05)"
                        stroke="#74a48f"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      {/* 直角マーク */}
                      <polyline
                        points="10,75 25,75 25,90"
                        fill="none"
                        stroke="#74a48f"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>

                {/* 選択時の上部ドラッグ移動バー ＆ ツールバー */}
                {isSelected && (
                  <div
                    className={`absolute ${
                      s.y < 46 ? "top-full mt-2" : "-top-10"
                    } left-0 flex items-center gap-1.5 bg-surface/95 px-2.5 py-1 rounded-2xl shadow-md border border-primary/40 z-30 pointer-events-auto max-w-[calc(100vw-32px)] overflow-x-auto`}
                    onPointerDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.closest("button")) {
                        startDrag(e, s, "move");
                      }
                    }}
                  >
                    <div
                      className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-primary font-black text-xs select-none py-1 px-2 rounded-xl bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors shrink-0 touch-none"
                      title="ドラッグしていどう"
                    >
                      <Move className="size-3.5 sm:size-4" />
                      <span>いどう</span>
                    </div>

                    <div className="h-3.5 w-px bg-border/60 mx-0.5 shrink-0" />

                    {/* 表：列・行の増減ボタン */}
                    {s.type === "table" && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, { cols: Math.min(8, (s.cols || 3) + 1) });
                          }}
                          title="列をふやす"
                        >
                          +列
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, { cols: Math.max(1, (s.cols || 3) - 1) });
                          }}
                          title="列をへらす"
                        >
                          -列
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, { rows: Math.min(8, (s.rows || 3) + 1) });
                          }}
                          title="行をふやす"
                        >
                          +行
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, { rows: Math.max(1, (s.rows || 3) - 1) });
                          }}
                          title="行をへらす"
                        >
                          -行
                        </button>
                      </div>
                    )}

                    {/* 線分図：分割数の増減ボタン */}
                    {s.type === "line" && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, { divisions: Math.min(10, (s.divisions || 4) + 1) });
                          }}
                          title="区切りをふやす"
                        >
                          +区切り
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, { divisions: Math.max(1, (s.divisions || 4) - 1) });
                          }}
                          title="区切りをへらす"
                        >
                          -区切り
                        </button>
                      </div>
                    )}

                    {/* 数直線：マス（目盛り）の増減ボタン */}
                    {s.type === "numberline" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateShape(s.id, {
                                subdivisions: Math.min(20, (s.subdivisions || 5) + 1),
                              });
                            }}
                            title="マス（目盛り）をふやす"
                            aria-label="数直線のマスを増やす"
                          >
                            +マス
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateShape(s.id, {
                                subdivisions: Math.max(1, (s.subdivisions || 5) - 1),
                              });
                            }}
                            title="マス（目盛り）をへらす"
                            aria-label="数直線のマスを減らす"
                          >
                            -マス
                          </button>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap px-0.5">
                          {s.subdivisions || 5}マス
                        </span>
                      </div>
                    )}

                    {/* マス目：列・行の増減ボタン */}
                    {s.type === "grid" && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, {
                              gridCols: Math.min(10, (s.gridCols || 4) + 1),
                            });
                          }}
                          title="列をふやす"
                        >
                          +列
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, {
                              gridCols: Math.max(1, (s.gridCols || 4) - 1),
                            });
                          }}
                          title="列をへらす"
                        >
                          -列
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, {
                              gridRows: Math.min(10, (s.gridRows || 4) + 1),
                            });
                          }}
                          title="行をふやす"
                        >
                          +行
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-muted/70 hover:bg-muted active:scale-95 text-[11px] font-black rounded-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateShape(s.id, {
                              gridRows: Math.max(1, (s.gridRows || 4) - 1),
                            });
                          }}
                          title="行をへらす"
                        >
                          -行
                        </button>
                      </div>
                    )}

                    {/* 削除ボタン */}
                    <button
                      type="button"
                      className="p-1.5 text-muted-foreground hover:text-destructive active:scale-95 rounded-lg transition-colors ml-0.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeShape(s.id);
                      }}
                      title="この図形を消す"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    {/* 配置完了ボタン */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white hover:bg-primary-dark active:scale-95 rounded-xl text-[11px] font-black transition-all ml-1 cursor-pointer shadow-2xs shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        finishShapePlacement();
                      }}
                      title="配置を完了する（ペンに戻る）"
                    >
                      <Check className="size-3.5" />
                      <span>完了</span>
                    </button>
                  </div>
                )}

                {/* リサイズハンドル（広げる：モバイルタッチ判定をbeforeで拡大） */}
                {isSelected && (
                  <>
                    {/* 東南（幅・高さ両方）：タッチしやすい大きめ丸ボタン */}
                    <div
                      data-resize-handle="se"
                      className="absolute -right-3 -bottom-3 size-7 sm:size-6 rounded-full bg-primary text-white flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-110 active:scale-95 z-30 pointer-events-auto touch-none before:absolute before:-inset-3 before:content-['']"
                      onPointerDown={(e) => startDrag(e, s, "resize-se")}
                      title="ドラッグして広げる"
                    >
                      <Plus className="size-4 sm:size-3.5" />
                    </div>

                    {/* 東（横幅を広げる） */}
                    <div
                      data-resize-handle="e"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-7 rounded-full bg-primary/80 hover:bg-primary cursor-ew-resize shadow-xs z-30 pointer-events-auto touch-none before:absolute before:-inset-2.5 before:content-['']"
                      onPointerDown={(e) => startDrag(e, s, "resize-e")}
                      title="横に広げる"
                    />

                    {/* 南（縦幅を広げる） */}
                    <div
                      data-resize-handle="s"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-3.5 rounded-full bg-primary/80 hover:bg-primary cursor-ns-resize shadow-xs z-30 pointer-events-auto touch-none before:absolute before:-inset-2.5 before:content-['']"
                      onPointerDown={(e) => startDrag(e, s, "resize-s")}
                      title="縦に広げる"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 選択中図形のガイドメッセージ（控えめに表示） */}
      {selectedShape && (
        <div className="flex items-center justify-between px-2 py-0.5 text-[11px] text-muted-foreground font-bold shrink-0">
          <span>
            💡 図形をスライドして移動できます。余白をタップすると配置完了します
          </span>
          <button
            type="button"
            className="text-primary hover:underline font-black cursor-pointer ml-2 shrink-0"
            onClick={finishShapePlacement}
          >
            完了
          </button>
        </div>
      )}
    </div>
  );
}
