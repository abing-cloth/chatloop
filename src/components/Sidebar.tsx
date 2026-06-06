import {
  Bell,
  Bookmark,
  Clapperboard,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  Radio,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  Store,
  Sun,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { InstallButton } from "./InstallButton";
import { useT } from "../lib/i18n";
import type { View } from "../lib/types";
export type { View } from "../lib/types";

const NAV = [
  { id: "feed", icon: Home },
  { id: "explore", icon: Search },
  { id: "reels", icon: Clapperboard },
  { id: "live", icon: Radio },
  { id: "shop", icon: Store },
  { id: "groups", icon: Users },
  { id: "wallet", icon: Wallet },
  { id: "messages", icon: MessageCircle },
  { id: "notifications", icon: Bell },
  { id: "saved", icon: Bookmark },
  { id: "liked", icon: Heart },
  { id: "admin", icon: ShieldAlert },
  { id: "profile", icon: UserIcon },
  { id: "settings", icon: SettingsIcon },
] as const;

export function Sidebar({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  const me = useStore((s) => s.me());
  const reset = useStore((s) => s.resetAll);
  const logout = useStore((s) => s.logout);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const liveCount = useStore((s) => s.liveStreams.length);
  const tr = useT();

  return (
    <aside className="sticky top-20 hidden h-fit w-64 shrink-0 lg:block">
      <nav className="space-y-1">
        {NAV.map((item) => {
          if (item.id === "admin" && !me.admin) return null;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as View)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium transition",
                active
                  ? "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon size={22} className={active ? "text-fuchsia-600 dark:text-fuchsia-400" : ""} />
              {tr(`nav.${item.id}`)}
              {item.id === "live" && liveCount > 0 && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-live-dot" /> {liveCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <button
        onClick={toggleTheme}
        className="mt-2 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        {theme === "dark" ? tr("common.lightMode") : tr("common.darkMode")}
      </button>

      <InstallButton hideWhenInstalled className="mt-3 w-full" />

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <img src={me.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{me.name}</p>
            <p className="truncate text-xs text-zinc-500">@{me.username}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={reset}
            title="Reset data demo"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <RotateCcw size={14} /> {tr("common.reset")}
          </button>
          <button
            onClick={logout}
            title="Keluar / ganti akun"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40"
          >
            <LogOut size={14} /> {tr("common.logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
