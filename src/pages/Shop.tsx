import { useRef, useState } from "react";
import { ImagePlus, MessageCircle, Package, Plus, ShoppingCart, Store, Trash2, X } from "lucide-react";
import { useStore } from "../lib/store";
import { PRODUCT_CATEGORIES } from "../lib/seed";
import { cn, fileToDataUrl, formatRupiah, timeAgo } from "../lib/utils";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { Stars, StarInput } from "../components/Stars";
import type { Product } from "../lib/types";
import type { View } from "../components/Sidebar";

export function Shop({
  onOpenCart,
  onNavigate,
}: {
  onOpenCart: () => void;
  onNavigate: (v: View) => void;
}) {
  const products = useStore((s) => s.products);
  const user = useStore((s) => s.user);
  const me = useStore((s) => s.currentUserId);
  const addToCart = useStore((s) => s.addToCart);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const startChat = useStore((s) => s.startChat);
  const cartCount = useStore((s) => s.cartCount());
  const reviews = useStore((s) => s.reviews);

  const ratingFor = (productId: string) => {
    const rs = reviews.filter((r) => r.productId === productId);
    return { avg: rs.length ? rs.reduce((n, r) => n + r.rating, 0) / rs.length : 0, count: rs.length };
  };

  const [cat, setCat] = useState("Semua");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const [selling, setSelling] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const cats = ["Semua", ...PRODUCT_CATEGORIES];
  const filtered = products.filter(
    (p) =>
      (cat === "Semua" || p.category === cat) &&
      (query.trim() === "" || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  function add(p: Product) {
    addToCart(p.id);
    setAdded(p.id);
    setTimeout(() => setAdded((a) => (a === p.id ? null : a)), 1200);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Store size={20} className="text-fuchsia-600" /> Belanja
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelling(true)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={16} /> Jual
          </button>
          <button
            onClick={() => onNavigate("orders")}
            title="Pesanan Saya"
            className="rounded-full bg-zinc-100 p-2.5 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <Package size={20} />
          </button>
          <button
            onClick={onOpenCart}
            className="relative rounded-full bg-zinc-100 p-2.5 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari produk..."
        className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:border-zinc-800 dark:bg-zinc-900"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
              cat === c
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          Tidak ada produk.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((p) => {
            const seller = user(p.sellerId);
            return (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <button onClick={() => setDetail(p)} className="block w-full">
                  <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  </div>
                </button>
                <div className="p-2.5">
                  <button onClick={() => setDetail(p)} className="block w-full text-left">
                    <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                    <p className="mt-1 font-bold text-fuchsia-600 dark:text-fuchsia-400">
                      {formatRupiah(p.price)}
                    </p>
                    {ratingFor(p.id).count > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <Stars value={ratingFor(p.id).avg} size={12} />
                        <span className="text-[11px] text-zinc-400">({ratingFor(p.id).count})</span>
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                      <img src={seller.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                      <span className="truncate">{seller.name}</span>
                      {seller.verified && <VerifiedBadge size={11} />}
                    </div>
                  </button>
                  <button
                    onClick={() => add(p)}
                    className={cn(
                      "mt-2 w-full rounded-lg py-1.5 text-xs font-semibold transition",
                      added === p.id
                        ? "bg-emerald-500 text-white"
                        : "bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:text-fuchsia-300"
                    )}
                  >
                    {added === p.id ? "✓ Ditambahkan" : "+ Keranjang"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* detail produk */}
      {detail && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img src={detail.image} alt={detail.name} className="aspect-square w-full object-cover sm:rounded-t-3xl" />
              <button onClick={() => setDetail(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                {detail.category}
              </span>
              <h3 className="mt-2 text-lg font-bold">{detail.name}</h3>
              <p className="mt-1 text-2xl font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                {formatRupiah(detail.price)}
              </p>
              <div className="mt-3 flex items-center gap-2 border-y border-zinc-100 py-3 dark:border-zinc-800">
                <img src={user(detail.sellerId).avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold">{user(detail.sellerId).name}</span>
                  {user(detail.sellerId).verified && <VerifiedBadge size={14} />}
                </div>
                {detail.sellerId === me ? (
                  <span className="ml-auto text-xs text-zinc-400">Produk Anda</span>
                ) : (
                  <button
                    onClick={() => {
                      startChat(detail.sellerId);
                      setDetail(null);
                      onNavigate("messages");
                    }}
                    className="ml-auto flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <MessageCircle size={14} /> Hubungi
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{detail.description}</p>

              <div className="mt-5 flex gap-2">
                {detail.sellerId === me ? (
                  <button
                    onClick={() => {
                      deleteProduct(detail.id);
                      setDetail(null);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-50 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/40"
                  >
                    <Trash2 size={16} /> Hapus produk
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => add(detail)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-fuchsia-600 py-3 text-sm font-semibold text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40"
                    >
                      <ShoppingCart size={16} /> + Keranjang
                    </button>
                    <button
                      onClick={() => {
                        addToCart(detail.id);
                        setDetail(null);
                        onOpenCart();
                      }}
                      className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Beli Sekarang
                    </button>
                  </>
                )}
              </div>

              <Reviews productId={detail.id} canReview={detail.sellerId !== me} />
            </div>
          </div>
        </div>
      )}

      {/* form jual */}
      {selling && <SellForm onClose={() => setSelling(false)} />}
    </div>
  );
}

function Reviews({ productId, canReview }: { productId: string; canReview: boolean }) {
  const reviews = useStore((s) => s.reviews.filter((r) => r.productId === productId));
  const user = useStore((s) => s.user);
  const addReview = useStore((s) => s.addReview);
  const me = useStore((s) => s.currentUserId);

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const alreadyReviewed = reviews.some((r) => r.userId === me);

  function submit() {
    if (!text.trim()) return;
    addReview({ productId, rating, text });
    setText("");
    setRating(5);
    setOpen(false);
  }

  return (
    <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold">Ulasan ({reviews.length})</h4>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Stars value={avg} size={15} />
            <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
          </div>
        )}
      </div>

      {canReview && !alreadyReviewed && (
        <div className="mt-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
          {open ? (
            <>
              <StarInput value={rating} onChange={setRating} size={26} />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Bagikan pengalamanmu dengan produk ini..."
                className="mt-2 w-full resize-none rounded-lg bg-white px-3 py-2 text-sm outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-900 dark:ring-zinc-700"
              />
              <div className="mt-2 flex gap-2">
                <button onClick={submit} disabled={!text.trim()} className="rounded-full bg-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                  Kirim Ulasan
                </button>
                <button onClick={() => setOpen(false)} className="rounded-full bg-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  Batal
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">
              ⭐ Tulis ulasan
            </button>
          )}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {reviews.length === 0 && (
          <p className="py-2 text-center text-sm text-zinc-400">Belum ada ulasan. Jadi yang pertama!</p>
        )}
        {reviews.map((r) => {
          const u = user(r.userId);
          return (
            <div key={r.id} className="flex gap-2.5">
              <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{u.name}</span>
                  <span className="text-xs text-zinc-400">{timeAgo(r.createdAt)}</span>
                </div>
                <Stars value={r.rating} size={12} />
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">{r.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SellForm({ onClose }: { onClose: () => void }) {
  const addProduct = useStore((s) => s.addProduct);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setImage(await fileToDataUrl(f));
    e.target.value = "";
  }

  function submit() {
    setError("");
    const p = parseInt(price, 10);
    if (!name.trim()) return setError("Nama produk wajib diisi.");
    if (!p || p <= 0) return setError("Harga tidak valid.");
    if (!image) return setError("Tambahkan foto produk.");
    addProduct({ name, price: p, image, description, category });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Store size={18} className="text-fuchsia-600" /> Jual Produk
          </h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="mb-3 flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm">
              <ImagePlus size={28} /> Tambah foto produk
            </span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama produk"
            className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
          />
          <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 dark:bg-zinc-800">
            <span className="text-sm text-zinc-500">Rp</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Harga"
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi produk"
            rows={3}
            className="w-full resize-none rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          onClick={submit}
          className="mt-4 w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Pasang Jualan
        </button>
      </div>
    </div>
  );
}
