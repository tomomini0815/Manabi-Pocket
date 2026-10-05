import { Link, useNavigate } from "@tanstack/react-router";
import { Home, BookOpen, Award, Volume2, VolumeX } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useActiveChild, useApp } from "@/lib/store";

export function useRequireChild() {
  const child = useActiveChild();
  const navigate = useNavigate();
  useEffect(() => {
    if (!child) navigate({ to: "/onboarding" });
  }, [child, navigate]);
  return child;
}

export function SoundToggle() {
  const sound = useApp((s) => s.sound);
  const setSound = useApp((s) => s.setSound);
  return (
    <button
      type="button"
      onClick={() => setSound(!sound)}
      className="tap clay-tile-white size-11 transition-transform hover:scale-105 active:scale-95"
      aria-label={sound ? "おとを けす" : "おとを だす"}
    >
      {sound ? <Volume2 className="size-5 text-primary" /> : <VolumeX className="size-5 text-muted-foreground" />}
    </button>
  );
}

const tabs = [
  { to: "/", label: "ホーム", icon: Home },
  { to: "/learn", label: "がくしゅう", icon: BookOpen },
  { to: "/rewards", label: "ごほうび", icon: Award },
] as const;

export function KidShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
      <header className="flex items-center gap-3 px-4 sm:px-6 md:px-8 pt-5 pb-2">
        <div className="flex-1">{header}</div>
        <SoundToggle />
        <Link
          to="/parent/gate"
          className="tap clay-badge inline-flex items-center px-4 py-2 text-xs sm:text-sm font-black text-muted-foreground bg-surface/90 hover:text-foreground transition-transform hover:scale-105 active:scale-95"
        >
          おうちの方へ
        </Link>
      </header>
      <main className="flex-1 px-4 sm:px-6 md:px-8 pb-36 pt-2">{children}</main>

      {/* フローティング・クレイナビゲーションバー（参考画像準拠の立体粘土バー） */}
      <nav className="fixed inset-x-0 bottom-4 z-20 px-4" aria-label="メニュー">
        <div className="mx-auto max-w-md clay-board p-2 bg-[#f9f5ed]/95 backdrop-blur-md">
          <ul className="grid grid-cols-3 gap-2">
            {tabs.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-xs sm:text-sm font-black text-muted-foreground transition-all duration-150 hover:text-foreground active:scale-95"
                  activeProps={{
                    className:
                      "clay-tile-white !text-primary-dark scale-[1.03] shadow-[0_10px_20px_-3px_rgba(150,120,95,0.28),inset_0_3px_4px_rgba(255,255,255,0.98),inset_0_-3px_5px_rgba(140,110,85,0.16)]",
                  }}
                >
                  <Icon className="size-5 sm:size-6" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
