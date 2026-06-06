import { useState } from "react";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "../lib/useInstallPrompt";
import { InstallButton } from "./InstallButton";

const DISMISS_KEY = "chatloop-install-banner-dismissed";

export function InstallBanner() {
  const { installed } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (installed || dismissed) return null;

  function close() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="animate-fade relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 p-4 text-white">
      <button
        onClick={close}
        className="absolute right-2 top-2 rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white"
        aria-label="Tutup"
      >
        <X size={16} />
      </button>
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
          <Download size={24} />
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-sm font-bold">Pasang ChatLoop di perangkatmu</p>
          <p className="text-xs text-white/85">
            Akses lebih cepat, layar penuh, & bisa dipakai offline.
          </p>
        </div>
      </div>
      <InstallButton
        hideWhenInstalled
        className="mt-3 w-full !bg-white !from-white !to-white !text-fuchsia-700"
      />
    </div>
  );
}
