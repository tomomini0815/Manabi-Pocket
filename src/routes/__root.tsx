import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useApp } from "../lib/store";
import { Pocket } from "../components/Pocket";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <Pocket stage={1} size={120} />
        <h1 className="mt-4 text-3xl font-bold text-foreground">ページが みつからないよ</h1>
        <div className="mt-6">
          <Link to="/" className="btn-kid btn-primary">ホームへ</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">うまく ひらけなかったよ</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-kid btn-primary"
          >
            もういちど
          </button>
          <a href="/" className="btn-kid btn-outline">ホームへ</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FF7A3D" },
      { title: "まなびポケット｜おうちで まいにち 5ふん" },
      { name: "description", content: "算数・国語・英語・思考力をオリジナル問題で。ドリルと考えるモードで毎日続く家庭学習アプリ。" },
      { property: "og:title", content: "まなびポケット" },
      { property: "og:description", content: "ドリルで基礎、考えるモードで思考力。毎日5〜15分の家庭学習アプリ。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hydrated = useApp((s) => s.hydrated);
  useEffect(() => {
    void useApp.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {hydrated ? (
        <Outlet />
      ) : (
        <div className="flex min-h-screen items-center justify-center" aria-busy="true">
          <Pocket stage={0} size={96} />
        </div>
      )}
    </QueryClientProvider>
  );
}
