import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DrawCanvas } from "../components/DrawCanvas";

// Canvas getContext mock
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});

describe("DrawCanvas", () => {
  it("renders toolbar with aggregated shape menu button when templates is enabled", () => {
    render(<DrawCanvas templates={true} />);

    // ペン、けしごむ、うごかす、ずけい、ぜんぶ消す ボタンが存在すること
    expect(screen.getByRole("button", { name: /黒のペン/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /けしごむ/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /うごかす/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /学習図形を追加する/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ぜんぶ けす/ })).toBeInTheDocument();
  });

  it("opens shape dropdown menu when clicking 'ずけい' button", () => {
    render(<DrawCanvas templates={true} />);

    const shapeMenuBtn = screen.getByRole("button", { name: /学習図形を追加する/ });
    expect(screen.queryByText("ひょう（表）")).not.toBeInTheDocument();

    // クリックでドロップダウン展開
    fireEvent.click(shapeMenuBtn);

    expect(screen.getByText("ひょう（表）")).toBeInTheDocument();
    expect(screen.getByText("せんぶんず")).toBeInTheDocument();
    expect(screen.getByText("すうせん（数直線）")).toBeInTheDocument();
    expect(screen.getByText("マス目（筆算）")).toBeInTheDocument();
    expect(screen.getByText("しかく（面積図）")).toBeInTheDocument();
    expect(screen.getByText("まる（円）")).toBeInTheDocument();
    expect(screen.getByText("さんかく（三角形）")).toBeInTheDocument();
  });

  it("adds a table shape and allows modifying columns/rows", () => {
    render(<DrawCanvas templates={true} />);

    // メニューを開いて「ひょう」を追加
    fireEvent.click(screen.getByRole("button", { name: /学習図形を追加する/ }));
    fireEvent.click(screen.getByText("ひょう（表）"));

    // 選択ガイドと「いどう」バーが表示される
    expect(screen.getByText("いどう")).toBeInTheDocument();
    expect(screen.getByTitle("列をふやす")).toBeInTheDocument();
    expect(screen.getByTitle("行をふやす")).toBeInTheDocument();

    // 列・行を増やす
    fireEvent.click(screen.getByTitle("列をふやす"));
    fireEvent.click(screen.getByTitle("行をふやす"));

    // 削除できること
    const deleteBtn = screen.getByTitle("この図形を消す");
    fireEvent.click(deleteBtn);
    expect(screen.queryByText("いどう")).not.toBeInTheDocument();
  });

  it("adds a line segment (せんぶんず) shape and adjusts divisions", () => {
    render(<DrawCanvas templates={true} />);

    fireEvent.click(screen.getByRole("button", { name: /学習図形を追加する/ }));
    fireEvent.click(screen.getByText("せんぶんず"));

    expect(screen.getByText("いどう")).toBeInTheDocument();
    expect(screen.getByTitle("区切りをふやす")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("区切りをふやす"));
    expect(screen.getByTitle("ドラッグして広げる")).toBeInTheDocument();
  });

  it("adds a number line (すうせん) shape and allows increasing and decreasing cells (マス)", () => {
    render(<DrawCanvas templates={true} />);

    // メニューを開いて「すうせん（数直線）」を追加
    fireEvent.click(screen.getByRole("button", { name: /学習図形を追加する/ }));
    fireEvent.click(screen.getByText("すうせん（数直線）"));

    // 選択ツールバーとマス増減ボタンが表示されること
    expect(screen.getByText("いどう")).toBeInTheDocument();
    expect(screen.getByTitle("マス（目盛り）をふやす")).toBeInTheDocument();
    expect(screen.getByTitle("マス（目盛り）をへらす")).toBeInTheDocument();
    expect(screen.getByText("5マス")).toBeInTheDocument();

    // マスを増やす (5 -> 6)
    fireEvent.click(screen.getByTitle("マス（目盛り）をふやす"));
    expect(screen.getByText("6マス")).toBeInTheDocument();

    // マスを減らす (6 -> 5)
    fireEvent.click(screen.getByTitle("マス（目盛り）をへらす"));
    expect(screen.getByText("5マス")).toBeInTheDocument();
  });

  it("adds a grid (マス目) shape and allows modifying columns and rows", () => {
    render(<DrawCanvas templates={true} />);

    fireEvent.click(screen.getByRole("button", { name: /学習図形を追加する/ }));
    fireEvent.click(screen.getByText("マス目（筆算）"));

    expect(screen.getByText("いどう")).toBeInTheDocument();
    expect(screen.getByTitle("列をふやす")).toBeInTheDocument();
    expect(screen.getByTitle("行をふやす")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("列をふやす"));
    fireEvent.click(screen.getByTitle("行をふやす"));
  });

  it("clears all canvas and shapes when clicking clear all", () => {
    render(<DrawCanvas templates={true} />);

    // 図形を追加
    fireEvent.click(screen.getByRole("button", { name: /学習図形を追加する/ }));
    fireEvent.click(screen.getByText("しかく（面積図）"));
    expect(screen.getByText("いどう")).toBeInTheDocument();

    // 全消去
    fireEvent.click(screen.getByRole("button", { name: /ぜんぶ けす/ }));
    expect(screen.queryByText("いどう")).not.toBeInTheDocument();
  });

  it("supports direct touch dragging on shape body to move coordinates smoothly", () => {
    const { container } = render(<DrawCanvas templates={true} />);

    // 図形（まる）を追加
    fireEvent.click(screen.getByRole("button", { name: /学習図形を追加する/ }));
    fireEvent.click(screen.getByText("まる（円）"));

    // 図形本体（data-shape-id要素）を取得
    const shapeEl = container.querySelector("[data-shape-id]") as HTMLElement;
    expect(shapeEl).toBeTruthy();

    const initialStyle = shapeEl.getAttribute("style") || "";
    expect(initialStyle).toContain("left:");

    // 図形本体を直接 pointerDown -> window mousemove -> window mouseup でスライド
    act(() => {
      fireEvent.pointerDown(shapeEl, { clientX: 100, clientY: 100 });
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 160, clientY: 150 }));
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    // スタイル上の left/top が移動後の座標に更新されていること
    const updatedEl = container.querySelector("[data-shape-id]") as HTMLElement;
    const updatedStyle = updatedEl.getAttribute("style") || "";
    expect(updatedStyle).not.toBe(initialStyle);
  });

  it("completes shape placement and switches back to pen when clicking outside the shape", () => {
    const { container } = render(<DrawCanvas templates={true} />);

    // 図形（まる）を追加
    fireEvent.click(screen.getByRole("button", { name: /学習図形を追加する/ }));
    fireEvent.click(screen.getByText("まる（円）"));

    // 図形が選択状態で「いどう」バーや「完了」ボタンが表示されていることを確認
    expect(screen.getByText("いどう")).toBeInTheDocument();
    expect(screen.getAllByText("完了").length).toBeGreaterThan(0);

    // 図形以外の場所（手書きキャンバス要素）をクリック/タップ
    const canvasEl = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvasEl).toBeTruthy();
    act(() => {
      fireEvent.pointerDown(canvasEl);
    });

    // 選択状態が解除され、「いどう」バーが消えて配置完了（ペンモードに復帰）していること
    expect(screen.queryByText("いどう")).not.toBeInTheDocument();

    // ツールバーの「うごかす」ボタンを押すと、図形を再選択可能
    fireEvent.click(screen.getByRole("button", { name: /うごかす/ }));
    const shapeEl = container.querySelector("[data-shape-id]") as HTMLElement;
    act(() => {
      fireEvent.pointerDown(shapeEl);
    });
    expect(screen.getByText("いどう")).toBeInTheDocument();

    // documentの外部領域をpointerDownすると再度配置完了になることの検証
    act(() => {
      const outsideDiv = document.createElement("div");
      document.body.appendChild(outsideDiv);
      fireEvent.pointerDown(outsideDiv);
      document.body.removeChild(outsideDiv);
    });

    // 外部タップによっても選択解除（配置完了）されること
    expect(screen.queryByText("いどう")).not.toBeInTheDocument();
  });
});
