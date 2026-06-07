import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { cn, formatRupiah } from "../lib/utils";
import { applyVoucher } from "../lib/vouchers";
import type { PaymentMethod } from "../lib/types";

type Step = "cart" | "address" | "done";

const PAYMENTS: { id: PaymentMethod; label: string; desc: string; icon: typeof Wallet }[] = [
  { id: "saldo", label: "Saldo SUUCHAT", desc: "Bayar pakai dompet", icon: Wallet },
  { id: "transfer", label: "Transfer Bank", desc: "BCA, BNI, Mandiri, dll", icon: CreditCard },
  { id: "ewallet", label: "E-Wallet", desc: "GoPay, OVO, DANA, ShopeePay", icon: Wallet },
  { id: "cod", label: "Bayar di Tempat (COD)", desc: "Bayar tunai saat barang tiba", icon: Banknote },
];

export function CartDrawer({
  open,
  onClose,
  onViewOrders,
}: {
  open: boolean;
  onClose: () => void;
  onViewOrders: () => void;
}) {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const me = useStore((s) => s.me());
  const setQty = useStore((s) => s.setQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const checkout = useStore((s) => s.checkout);
  const total = useStore((s) => s.cartTotal());
  const walletBalance = useStore((s) => s.walletBalance);

  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? "");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("transfer");
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState("");
  const [voucherOk, setVoucherOk] = useState(false);
  const [error, setError] = useState("");

  const grandTotal = Math.max(0, total - discount);

  function useVoucher() {
    const r = applyVoucher(voucherCode, total);
    setDiscount(r.discount);
    setVoucherOk(r.ok);
    setVoucherMsg(r.msg);
  }

  const items = cart
    .map((c) => {
      const p = products.find((pr) => pr.id === c.productId);
      return p ? { ...c, product: p } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  function close() {
    setStep("cart");
    setError("");
    onClose();
  }

  function placeOrder() {
    setError("");
    if (!name.trim()) return setError("Nama penerima wajib diisi.");
    if (phone.replace(/\D/g, "").length < 6) return setError("Nomor telepon tidak valid.");
    if (!address.trim()) return setError("Alamat pengiriman wajib diisi.");
    if (payment === "saldo" && walletBalance < grandTotal)
      return setError("Saldo tidak cukup. Pilih metode lain atau top up dompet.");
    checkout(
      { name: name.trim(), phone: phone.trim(), address: address.trim() },
      payment,
      { discount, voucher: voucherOk ? voucherCode.trim().toUpperCase() : undefined }
    );
    setStep("done");
  }

  return (
    <>
      <div
        className={
          "fixed inset-0 z-[85] bg-black/50 transition-opacity " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={close}
      />
      <aside
        className={
          "fixed right-0 top-0 z-[86] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform dark:bg-zinc-900 " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            {step === "address" ? (
              <button onClick={() => setStep("cart")} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <ArrowLeft size={20} />
              </button>
            ) : (
              <ShoppingCart size={20} className="text-fuchsia-600" />
            )}
            {step === "address" ? "Pengiriman" : "Keranjang"}
          </h2>
          <button onClick={close} className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>

        {step === "done" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <CheckCircle2 size={56} className="text-emerald-500" />
            <h3 className="text-lg font-bold">Pesanan berhasil! 🎉</h3>
            <p className="text-sm text-zinc-500">
              Pesananmu sedang dikemas penjual. Pantau statusnya di Pesanan Saya.
            </p>
            <button
              onClick={() => {
                close();
                onViewOrders();
              }}
              className="mt-2 rounded-full bg-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-700"
            >
              Lihat Pesanan
            </button>
            <button onClick={close} className="text-sm text-zinc-500 hover:underline">
              Lanjut Belanja
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-zinc-400">
            <ShoppingCart size={48} />
            <p>Keranjang masih kosong.</p>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {items.map(({ product, qty }) => (
                <div key={product.id} className="flex gap-3 rounded-2xl border border-zinc-200 p-2.5 dark:border-zinc-800">
                  <img src={product.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
                    <p className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400">
                      {formatRupiah(product.price)}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(product.id, qty - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800">
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                        <button onClick={() => setQty(product.id, qty + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800">
                          <Plus size={14} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(product.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-zinc-500">Total</span>
                <span className="text-xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400">{formatRupiah(total)}</span>
              </div>
              <button
                onClick={() => setStep("address")}
                className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Lanjut ke Pengiriman
              </button>
            </div>
          </>
        ) : (
          /* === LANGKAH ALAMAT === */
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                <MapPin size={16} className="text-fuchsia-600" /> Alamat pengiriman
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama penerima"
                className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="Nomor telepon"
                className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
              />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Alamat lengkap (jalan, no rumah, kota, kode pos)"
                className="w-full resize-none rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
              />

              <div className="flex items-center gap-2 pt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                <Wallet size={16} className="text-fuchsia-600" /> Metode pembayaran
              </div>
              {PAYMENTS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPayment(pm.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                    payment === pm.id
                      ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <pm.icon size={20} className={payment === pm.id ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-zinc-500"} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pm.label}</p>
                    <p className="text-xs text-zinc-500">
                      {pm.id === "saldo" ? `Saldo: ${formatRupiah(walletBalance)}` : pm.desc}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border-2",
                      payment === pm.id ? "border-fuchsia-600" : "border-zinc-300 dark:border-zinc-600"
                    )}
                  >
                    {payment === pm.id && <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-600" />}
                  </span>
                </button>
              ))}

              {error && <p className="text-sm text-red-500">{error}</p>}

              {/* voucher */}
              <div className="pt-1">
                <div className="flex gap-2">
                  <input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Kode voucher (mis. HEMAT10)"
                    className="flex-1 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
                  />
                  <button onClick={useVoucher} className="rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
                    Pakai
                  </button>
                </div>
                {voucherMsg && (
                  <p className={cn("mt-1.5 text-xs", voucherOk ? "text-emerald-600" : "text-red-500")}>{voucherMsg}</p>
                )}
                <p className="mt-1 text-[11px] text-zinc-400">Coba: HEMAT10 · NEWUSER · DISKON50K</p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal ({items.length} item)</span>
                  <span>{formatRupiah(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon voucher</span>
                    <span>−{formatRupiah(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500">
                  <span>Ongkir</span>
                  <span className="text-emerald-600">Gratis</span>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-zinc-500">Total bayar</span>
                <span className="text-xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400">{formatRupiah(grandTotal)}</span>
              </div>
              <button
                onClick={placeOrder}
                className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Buat Pesanan
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
