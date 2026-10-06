import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
});
