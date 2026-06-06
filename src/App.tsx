import { useEffect, useState } from "react";
import { RightBar } from "./components/RightBar";
import { Sidebar, type View } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { MobileNav } from "./components/MobileNav";
import { Feed } from "./pages/Feed";
import { Profile } from "./pages/Profile";
import { Messages } from "./pages/Messages";
import { Explore } from "./pages/Explore";
import { Notifications } from "./pages/Notifications";
import { Saved } from "./pages/Saved";
import { Settings } from "./pages/Settings";
import { Auth } from "./pages/Auth";
import { Splash } from "./components/Splash";
import { useStore } from "./lib/store";

export default function App() {
  const [view, setView] = useState<View>("feed");
  const [showSplash, setShowSplash] = useState(true);
  const theme = useStore((s) => s.theme);
  const isAuthed = useStore((s) => s.isAuthed);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;
  if (!isAuthed) return <Auth />;

  return (
    <div className="min-h-screen bg-zinc-50 pb-16 text-zinc-900 lg:pb-0 dark:bg-zinc-950 dark:text-zinc-100">
      <TopBar view={view} onNavigate={setView} />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <Sidebar view={view} onNavigate={setView} />
        <main className="min-w-0 flex-1">
          <div key={view} className="animate-fade">
            {view === "feed" && <Feed />}
            {view === "explore" && <Explore />}
            {view === "messages" && <Messages />}
            {view === "notifications" && <Notifications />}
            {view === "saved" && <Saved />}
            {view === "profile" && <Profile onNavigate={setView} />}
            {view === "settings" && <Settings />}
          </div>
        </main>
        {view === "feed" && <RightBar />}
      </div>
      <MobileNav view={view} onNavigate={setView} />
    </div>
  );
}
