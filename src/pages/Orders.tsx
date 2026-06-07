import { CheckCircle2, Package, PackageCheck, Truck } from "lucide-react";
import { useStore } from "../lib/store";
import { cn, formatRupiah, timeAgo } from "../lib/utils";
import { useT } from "../lib/i18n";
import type { OrderStatus } from "../lib/types";

const STEPS: { key: OrderStatus; label: string; icon: typeof Package }[] = [
  { key: "dikemas", label: "Dikemas", icon: Package },
  { key: "dikirim", label: "Dikirim", icon: Truck },
  { key: "selesai", label: "Selesai", icon: PackageCheck },
];

const PAYMENT_LABEL: Record<string, string> = {
  saldo: "Saldo SUUCHAT",
  transfer: "Transfer Bank",
  ewallet: "E-Wallet",
  cod: "Bayar di Tempat (COD)",
};

export function Orders() {
  const orders = useStore((s) => s.orders);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const tr = useT();

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <h2 className="flex items-center gap-2 px-1 text-lg font-bold">
        <Package size={20} className="text-fuchsia-600" /> {tr("page.orders")}
      </h2>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Belum ada pesanan. Yuk belanja! 🛍️
        </div>
      ) : (
        orders.map((o) => {
          const stepIdx = STEPS.findIndex((s) => s.key === o.status);
          return (
            <div key={o.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  #{o.id.slice(-6).toUpperCase()} · {timeAgo(o.createdAt)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                    o.status === "selesai"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300"
                  )}
                >
                  {o.status}
                </span>
              </div>

              {/* stepper status */}
              <div className="my-4 flex items-center">
                {STEPS.map((s, i) => {
                  const active = i <= stepIdx;
                  return (
                    <div key={s.key} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "grid h-9 w-9 place-items-center rounded-full",
                            active
                              ? "bg-fuchsia-600 text-white"
                              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                          )}
                        >
                          <s.icon size={18} />
                        </div>
                        <span className={cn("mt-1 text-[11px]", active ? "font-semibold text-fuchsia-600 dark:text-fuchsia-400" : "text-zinc-400")}>
                          {s.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={cn("mx-1 h-0.5 flex-1", i < stepIdx ? "bg-fuchsia-600" : "bg-zinc-200 dark:bg-zinc-800")} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* item */}
              <div className="space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {o.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {it.name} <span className="text-zinc-400">× {it.qty}</span>
                    </span>
                    <span className="font-medium">{formatRupiah(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="text-xs text-zinc-500">
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">{o.address.name} · {o.address.phone}</p>
                  <p className="line-clamp-1">{o.address.address}</p>
                  <p className="mt-0.5">💳 {PAYMENT_LABEL[o.payment] ?? o.payment}</p>
                  {o.discount ? (
                    <p className="mt-0.5 text-emerald-600">🏷️ Voucher {o.voucher} −{formatRupiah(o.discount)}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-base font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                  {formatRupiah(o.total)}
                </span>
              </div>

              {/* aksi demo: majukan status */}
              {o.status !== "selesai" && (
                <button
                  onClick={() =>
                    updateOrderStatus(o.id, o.status === "dikemas" ? "dikirim" : "selesai")
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-zinc-100 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {o.status === "dikemas" ? (
                    <><Truck size={16} /> Tandai Dikirim</>
                  ) : (
                    <><CheckCircle2 size={16} /> Pesanan Diterima</>
                  )}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
