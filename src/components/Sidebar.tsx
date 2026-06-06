import {
  Bell,
  Bookmark,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  Radio,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { InstallButton } from "./InstallButton";

export type View =
  | "feed"
  | "explore"
  | "live"
  | "messages"
  | "notifications"
  | "saved"
  | "profile"
  | "settings";

const NAV = [
  { id: "feed", label: "Beranda", icon: Home },
  { id: "explore", label: "Jelajahi", icon: Search },
  { id: "live", label: "Live", icon: Radio },
  { id: "messages", label: "Pesan", icon: MessageCircle },
  { id: "notifications", label: "Notifikasi", icon: Bell },
  { id: "saved", label: "Tersimpan", icon: Bookmark },
  { id: "profile", label: "Profil", icon: UserIcon },
  { id: "settings", label: "Pengaturan", icon: SettingsIcon },
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

  return (
    <aside className="sticky top-20 hidden h-fit w-64 shrink-0 lg:block">
      <nav className="space-y-1">
        {NAV.map((item) => {
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
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={toggleTheme}
        className="mt-2 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-[15px] font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
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
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={logout}
            title="Keluar / ganti akun"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40"
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}
