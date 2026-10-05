import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

// GitHub Pages等のベースパスを動的に検出（/Manabi-Pocket 等）
const basepath =
  typeof window !== "undefined" && window.location.pathname.startsWith("/Manabi-Pocket")
    ? "/Manabi-Pocket"
    : undefined;

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  basepath,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
