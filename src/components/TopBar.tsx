import { Heart, Home, MessageCircle, Moon, Search, ShoppingCart, Sun } from "lucide-react";
import { useStore } from "../lib/store";
import { asset, cn } from "../lib/utils";
import { useT } from "../lib/i18n";
import type { View } from "./Sidebar";

export function TopBar({
  view,
  onNavigate,
  onOpenCart,
}: {
  view: View;
  onNavigate: (v: View) => void;
  onOpenCart: () => void;
}) {
  const me = useStore((s) => s.me());
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const cartCount = useStore((s) => s.cartCount());
  const tr = useT();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        {/* logo */}
        <button onClick={() => onNavigate("feed")} className="flex items-center gap-2">
          <img src={asset("chatloop.svg")} alt="ChatLoop" className="h-9 w-9" />
          <span className="bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            ChatLoop
          </span>
        </button>

        {/* search */}
        <div className="relative ml-2 hidden flex-1 max-w-md sm:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            readOnly
            onFocus={() => onNavigate("explore")}
            onClick={() => onNavigate("explore")}
            placeholder={tr("common.search")}
            className="w-full cursor-pointer rounded-full bg-zinc-100 py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-zinc-50 focus:ring-2 focus:ring-fuchsia-200 dark:bg-zinc-800 dark:focus:bg-zinc-800"
          />
        </div>

        <div className="flex-1 sm:hidden" />

        {/* actions */}
        <nav className="flex items-center gap-1">
          <IconBtn active={view === "feed"} onClick={() => onNavigate("feed")}>
            <Home size={22} />
          </IconBtn>
          <IconBtn active={view === "messages"} onClick={() => onNavigate("messages")}>
            <MessageCircle size={22} />
          </IconBtn>
          <IconBtn
            active={view === "notifications"}
            onClick={() => onNavigate("notifications")}
          >
            <Heart size={22} />
          </IconBtn>
          <button
            onClick={onOpenCart}
            className="relative rounded-full p-2.5 text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <IconBtn onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
          </IconBtn>
          <button
            onClick={() => onNavigate("profile")}
            className={cn(
              "ml-1 rounded-full p-0.5",
              view === "profile" && "ring-2 ring-fuchsia-500"
            )}
          >
            <img src={me.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          </button>
        </nav>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full p-2.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800",
        active ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-zinc-700 dark:text-zinc-300"
      )}
    >
      {children}
    </button>
  );
}
