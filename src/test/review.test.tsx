import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useApp } from "@/lib/store";
import { Route } from "@/routes/review";
import React from "react";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<any>("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe("Review Route", () => {
  beforeEach(() => {
    useApp.setState({
      children: [{ id: "c1", nickname: "テスト", grade: 6, rubyMode: "ruby", avatar: "pocket", recommendedLevel: "think-5" }],
      activeChildId: "c1",
      sessions: [],
      attempts: [],
      reviews: [
        {
          id: "r1",
          childId: "c1",
          levelId: "think-5",
          stepId: "s04",
          seed: 12345,
          due: Date.now() - 1000,
          interval: 0,
        },
      ],
      progress: {},
    });
  });

  it("renders ThinkingSolver for thinking review problem", () => {
    const Component = Route.options.component!;
    render(<Component />);
    // Should render thinking problem view with header
    expect(screen.getByText(/ふくしゅう 1 \/ 1/)).toBeDefined();
  });

  it("renders DrillSession for math review problem", () => {
    useApp.setState({
      reviews: [
        {
          id: "r2",
          childId: "c1",
          levelId: "math-add-1",
          stepId: "s01",
          seed: 999,
          due: Date.now() - 1000,
          interval: 0,
        },
      ],
    });
    const Component = Route.options.component!;
    render(<Component />);
    expect(screen.getByText("ふくしゅう")).toBeDefined();
  });
});
