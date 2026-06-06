import { Bookmark, Home, MessageCircle, Search } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import type { View } from "./Sidebar";

const ITEMS = [
  { id: "feed", icon: Home },
  { id: "explore", icon: Search },
  { id: "messages", icon: MessageCircle },
  { id: "saved", icon: Bookmark },
] as const;

export function MobileNav({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  const me = useStore((s) => s.me());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-zinc-200 bg-white/90 px-2 py-1.5 backdrop-blur-md lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
      {ITEMS.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "rounded-xl p-3 transition",
              active ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-zinc-500"
            )}
          >
            <item.icon size={24} />
          </button>
        );
      })}
      <button
        onClick={() => onNavigate("profile")}
        className={cn(
          "rounded-full p-1",
          view === "profile" && "ring-2 ring-fuchsia-500"
        )}
      >
        <img src={me.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
      </button>
    </nav>
  );
}
