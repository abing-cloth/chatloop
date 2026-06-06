import { useEffect, useState } from "react";
import { Delete, Fingerprint, LogOut } from "lucide-react";
import { useStore } from "../lib/store";
import { verifyBiometric } from "../lib/biometric";
import { cn } from "../lib/utils";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const me = useStore((s) => s.me());
  const settings = useStore((s) => s.settings);
  const logout = useStore((s) => s.logout);

  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);

  const PIN_LEN = settings.pin?.length ?? 6;

  function press(d: string) {
    if (entry.length >= PIN_LEN) return;
    const next = entry + d;
    setEntry(next);
    setError(false);
    if (next.length === PIN_LEN) {
      if (next === settings.pin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setEntry(""), 500);
      }
    }
  }

  async function bio() {
    if (!settings.biometricCredId) return;
    const ok = await verifyBiometric(settings.biometricCredId);
    if (ok) onUnlock();
    else setError(true);
  }

  // auto-trigger biometrik saat layar kunci muncul (jika aktif)
  useEffect(() => {
    if (settings.biometricEnabled && settings.biometricCredId) {
      bio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-700 via-purple-700 to-indigo-700 px-8 text-white">
      <img src="/chatloop.svg" alt="ChatLoop" className="h-16 w-16" />
      <h1 className="mt-4 text-xl font-bold">Halo, {me.name.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-sm text-white/80">Masukkan PIN untuk membuka ChatLoop</p>

      {/* titik PIN */}
      <div className={cn("mt-6 flex gap-3", error && "animate-pop")}>
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3.5 w-3.5 rounded-full border-2 border-white/70 transition",
              i < entry.length && "bg-white",
              error && "border-red-300 bg-red-300"
            )}
          />
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-200">PIN salah, coba lagi.</p>}

      {/* keypad */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {keys.map((k) => (
          <KeyBtn key={k} onClick={() => press(k)}>
            {k}
          </KeyBtn>
        ))}
        {settings.biometricEnabled && settings.biometricCredId ? (
          <KeyBtn onClick={bio} ghost>
            <Fingerprint size={26} />
          </KeyBtn>
        ) : (
          <span />
        )}
        <KeyBtn onClick={() => press("0")}>0</KeyBtn>
        <KeyBtn onClick={() => setEntry((e) => e.slice(0, -1))} ghost>
          <Delete size={24} />
        </KeyBtn>
      </div>

      <button
        onClick={logout}
        className="mt-10 flex items-center gap-2 text-sm text-white/70 hover:text-white"
      >
        <LogOut size={15} /> Keluar dari akun
      </button>
    </div>
  );
}

function KeyBtn({
  children,
  onClick,
  ghost,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ghost?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-16 w-16 place-items-center rounded-full text-2xl font-semibold transition active:scale-90",
        ghost ? "text-white/90 hover:bg-white/10" : "bg-white/15 backdrop-blur hover:bg-white/25"
      )}
    >
      {children}
    </button>
  );
}
