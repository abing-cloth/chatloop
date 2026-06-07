import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Plus,
  ShoppingBag,
  Wallet as WalletIcon,
} from "lucide-react";
import { useStore } from "../lib/store";
import { cn, formatRupiah, timeAgo } from "../lib/utils";
import { useT } from "../lib/i18n";
import type { WalletTxType } from "../lib/types";

const TX_META: Record<WalletTxType, { label: string; icon: typeof Plus; color: string }> = {
  penjualan: { label: "Pendapatan penjualan", icon: ArrowDownLeft, color: "text-emerald-600" },
  topup: { label: "Top up", icon: Plus, color: "text-emerald-600" },
  tarik: { label: "Tarik dana", icon: ArrowUpRight, color: "text-red-500" },
  belanja: { label: "Belanja", icon: ShoppingBag, color: "text-red-500" },
};

export function Wallet() {
  const balance = useStore((s) => s.walletBalance);
  const tx = useStore((s) => s.walletTx);
  const topUp = useStore((s) => s.topUp);
  const withdraw = useStore((s) => s.withdraw);

  const [modal, setModal] = useState<null | "topup" | "tarik">(null);
  const tr = useT();

  const earnings = tx
    .filter((t) => t.type === "penjualan")
    .reduce((n, t) => n + t.amount, 0);

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <WalletIcon size={20} className="text-fuchsia-600" /> {tr("page.wallet")}
      </h2>

      {/* kartu saldo */}
      <div className="rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 p-5 text-white shadow-lg">
        <p className="text-sm text-white/80">Saldo SUUCHAT</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatRupiah(balance)}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setModal("topup")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/20 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
          >
            <Plus size={16} /> Top Up
          </button>
          <button
            onClick={() => setModal("tarik")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-fuchsia-700 transition hover:opacity-90"
          >
            <Banknote size={16} /> Tarik Dana
          </button>
        </div>
      </div>

      {/* ringkasan pendapatan */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <ArrowDownLeft size={22} />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Total pendapatan penjualan</p>
            <p className="text-lg font-bold text-emerald-600">{formatRupiah(earnings)}</p>
          </div>
        </div>
      </div>

      {/* riwayat transaksi */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-4 py-3 text-sm font-semibold dark:border-zinc-800">
          Riwayat transaksi
        </div>
        {tx.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-400">Belum ada transaksi.</p>
        ) : (
          tx.map((t) => {
            const meta = TX_META[t.type];
            return (
              <div key={t.id} className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800">
                <div className={cn("grid h-9 w-9 place-items-center rounded-full bg-zinc-100 dark:bg-zinc-800", meta.color)}>
                  <meta.icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.note}</p>
                  <p className="text-xs text-zinc-400">{meta.label} · {timeAgo(t.createdAt)}</p>
                </div>
                <span className={cn("shrink-0 text-sm font-bold", t.amount >= 0 ? "text-emerald-600" : "text-red-500")}>
                  {t.amount >= 0 ? "+" : "-"}{formatRupiah(Math.abs(t.amount))}
                </span>
              </div>
            );
          })
        )}
      </div>

      {modal && (
        <AmountModal
          mode={modal}
          balance={balance}
          onClose={() => setModal(null)}
          onSubmit={(amt) => {
            if (modal === "topup") {
              topUp(amt);
              setModal(null);
            } else {
              if (withdraw(amt)) setModal(null);
            }
          }}
        />
      )}
    </div>
  );
}

function AmountModal({
  mode,
  balance,
  onClose,
  onSubmit,
}: {
  mode: "topup" | "tarik";
  balance: number;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}) {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const amt = parseInt(val || "0", 10);
  const presets = mode === "topup" ? [50000, 100000, 250000, 500000] : [100000, 250000, 500000];

  function submit() {
    setError("");
    if (!amt || amt <= 0) return setError("Masukkan nominal yang valid.");
    if (mode === "tarik" && amt > balance) return setError("Saldo tidak cukup.");
    onSubmit(amt);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-5 sm:rounded-3xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold">{mode === "topup" ? "Top Up Saldo" : "Tarik Dana"}</h3>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 dark:bg-zinc-800">
          <span className="text-sm text-zinc-500">Rp</span>
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="0"
            className="w-full bg-transparent py-3 text-lg font-bold outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setVal(String(p))}
              className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {formatRupiah(p)}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button
          onClick={submit}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {mode === "topup" ? "Top Up" : "Tarik"} {amt > 0 && formatRupiah(amt)}
        </button>
      </div>
    </div>
  );
}
