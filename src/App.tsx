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
import { Live } from "./pages/Live";
import { Auth } from "./pages/Auth";
import { Splash } from "./components/Splash";
import { LockScreen } from "./components/LockScreen";
import { useStore } from "./lib/store";

export default function App() {
  const [view, setView] = useState<View>("feed");
  const [showSplash, setShowSplash] = useState(true);
  const [unlocked, setUnlocked] = useState(true);
  const theme = useStore((s) => s.theme);
  const isAuthed = useStore((s) => s.isAuthed);
  const settings = useStore((s) => s.settings);

  const lockActive = settings.appLockEnabled && !!settings.pin;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // saat app pertama dibuka & sudah login dengan kunci aktif → minta buka kunci
  useEffect(() => {
    const st = useStore.getState();
    if (st.isAuthed && st.settings.appLockEnabled && st.settings.pin) {
      setUnlocked(false);
    }
  }, []);

  // auto-lock setelah tidak ada aktivitas
  useEffect(() => {
    if (!lockActive || !unlocked || settings.autoLockMinutes <= 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setUnlocked(false), settings.autoLockMinutes * 60_000);
    };
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [lockActive, unlocked, settings.autoLockMinutes]);

  if (showSplash) return <Splash onDone={() => setShowSplash(false)} />;
  if (!isAuthed) return <Auth />;
  if (lockActive && !unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-zinc-50 pb-16 text-zinc-900 lg:pb-0 dark:bg-zinc-950 dark:text-zinc-100">
      <TopBar view={view} onNavigate={setView} />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <Sidebar view={view} onNavigate={setView} />
        <main className="min-w-0 flex-1">
          <div key={view} className="animate-fade">
            {view === "feed" && <Feed />}
            {view === "explore" && <Explore />}
            {view === "live" && <Live />}
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
