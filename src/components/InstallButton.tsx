import { useState } from "react";
import { CheckCircle2, Download, Share, SquarePlus, X } from "lucide-react";
import { useInstallPrompt } from "../lib/useInstallPrompt";
import { asset, cn } from "../lib/utils";

export function InstallButton({
  className,
  hideWhenInstalled = false,
}: {
  className?: string;
  hideWhenInstalled?: boolean;
}) {
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);

  if (installed) {
    if (hideWhenInstalled) return null;
    return (
      <div className={cn("flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", className)}>
        <CheckCircle2 size={16} /> Aplikasi terpasang
      </div>
    );
  }

  async function handleClick() {
    if (canInstall) {
      const ok = await promptInstall();
      if (!ok) setShowHelp(true);
    } else {
      setShowHelp(true);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90",
          className
        )}
      >
        <Download size={16} /> Pasang Aplikasi
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <img src={asset("chatloop.svg")} alt="" className="h-7 w-7" /> Pasang SUUCHAT
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                <li className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950">1</span>
                  <span>Ketuk tombol <Share size={15} className="inline -mt-0.5 text-sky-500" /> <b>Bagikan</b> di bilah Safari.</span>
                </li>
                <li className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950">2</span>
                  <span>Pilih <SquarePlus size={15} className="inline -mt-0.5" /> <b>Tambah ke Layar Utama</b>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950">3</span>
                  <span>Ketuk <b>Tambah</b> — ikon SUUCHAT muncul di layar utama. 🎉</span>
                </li>
              </ol>
            ) : (
              <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                <p>
                  Buka SUUCHAT di <b>Chrome</b> atau <b>Edge</b>, lalu:
                </p>
                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950">1</span>
                    <span>Klik ikon <Download size={15} className="inline -mt-0.5" /> <b>Install</b> di kanan bilah alamat (atau menu ⋮ → <b>Install SUUCHAT</b>).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fuchsia-100 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-950">2</span>
                    <span>Klik <b>Install</b> — SUUCHAT jadi aplikasi mandiri di perangkat Anda. 🎉</span>
                  </li>
                </ol>
                <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  💡 Tombol install muncul saat dibuka via <b>HTTPS</b> (situs yang sudah di-deploy) atau localhost build produksi.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
