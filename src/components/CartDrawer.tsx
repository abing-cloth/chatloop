import { useState } from "react";
import { CheckCircle2, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useStore } from "../lib/store";
import { formatRupiah } from "../lib/utils";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const setQty = useStore((s) => s.setQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const checkout = useStore((s) => s.checkout);
  const total = useStore((s) => s.cartTotal());
  const [done, setDone] = useState(false);

  const items = cart
    .map((c) => {
      const p = products.find((pr) => pr.id === c.productId);
      return p ? { ...c, product: p } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  function close() {
    setDone(false);
    onClose();
  }

  function doCheckout() {
    checkout();
    setDone(true);
  }

  return (
    <>
      {/* overlay */}
      <div
        className={
          "fixed inset-0 z-[85] bg-black/50 transition-opacity " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={close}
      />
      {/* panel */}
      <aside
        className={
          "fixed right-0 top-0 z-[86] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform dark:bg-zinc-900 " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart size={20} className="text-fuchsia-600" /> Keranjang
          </h2>
          <button onClick={close} className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <CheckCircle2 size={56} className="text-emerald-500" />
            <h3 className="text-lg font-bold">Pesanan berhasil! 🎉</h3>
            <p className="text-sm text-zinc-500">
              Terima kasih sudah berbelanja di ChatLoop. Penjual akan segera memproses pesananmu.
            </p>
            <button
              onClick={close}
              className="mt-2 rounded-full bg-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-700"
            >
              Lanjut Belanja
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-zinc-400">
            <ShoppingCart size={48} />
            <p>Keranjang masih kosong.</p>
          </div>
        ) : (
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
                        <button
                          onClick={() => setQty(product.id, qty - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                        <button
                          onClick={() => setQty(product.id, qty + 1)}
                          className="grid h-7 w-7 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
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
                <span className="text-xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                  {formatRupiah(total)}
                </span>
              </div>
              <button
                onClick={doCheckout}
                className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Checkout ({items.length} item)
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
