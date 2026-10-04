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
      className="tap inline-flex items-center justify-center rounded-full bg-surface text-muted-foreground"
      aria-label={sound ? "おとを けす" : "おとを だす"}
    >
      {sound ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
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
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
      <header className="flex items-center gap-3 px-5 pt-5 pb-2">
        <div className="flex-1">{header}</div>
        <SoundToggle />
        <Link to="/parent/gate" className="tap inline-flex items-center rounded-full bg-surface px-4 text-sm font-bold text-muted-foreground">
          おうちの方へ
        </Link>
      </header>
      <main className="flex-1 px-5 pb-32">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-surface/95 backdrop-blur" aria-label="メニュー">
        <ul className="mx-auto grid max-w-3xl grid-cols-3">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex min-h-[72px] flex-col items-center justify-center gap-1 text-base font-bold text-muted-foreground"
                activeProps={{ className: "text-primary-dark" }}
              >
                <Icon className="size-7" aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
