import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";
import { useApp } from "@/lib/store";
import React from "react";

describe("SPA Router with basepath", () => {
  beforeEach(() => {
    useApp.setState({
      children: [
        {
          id: "c1",
          nickname: "テスト",
          grade: 1,
          rubyMode: "ruby",
          avatar: "pocket",
          recommendedLevel: "math-add-1",
          createdAt: Date.now(),
        },
      ],
      activeChildId: "c1",
      sessions: [],
      attempts: [],
      reviews: [],
      progress: {},
      hydrated: true,
    });
  });

  it("renders router provider with basepath", async () => {
    const queryClient = new QueryClient();
    const router = createRouter({
      routeTree,
      basepath: "/Manabi-Pocket",
      context: { queryClient },
    });

    // set history to /Manabi-Pocket/
    router.history.push("/Manabi-Pocket/");
    await router.load();

    render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );

    // Should render home screen with nickname
    expect(screen.getByText("こんにちは、")).toBeDefined();
    expect(screen.getByText("テスト")).toBeDefined();
  });
});
