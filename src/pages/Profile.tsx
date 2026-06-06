import { useRef, useState } from "react";
import { ArrowLeft, BarChart3, Camera, Grid3x3, ImageIcon, LogOut, MessageCircle, Pencil, Play, Settings as SettingsIcon, Share2, ShieldCheck, Store } from "lucide-react";
import { PostCard } from "../components/PostCard";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { UserListModal } from "../components/UserListModal";
import { ShareModal } from "../components/ShareModal";
import { useStore } from "../lib/store";
import { cn, fileToDataUrl, formatRupiah } from "../lib/utils";
import type { View } from "../lib/types";

type Tab = "post" | "reels" | "produk";

export function Profile({ onNavigate }: { onNavigate: (v: View) => void }) {
  const profileUserId = useStore((s) => s.profileUserId);
  const me = useStore((s) => s.me());
  const target = useStore((s) => (profileUserId ? s.user(profileUserId) : s.me()));
  const isSelf = !profileUserId || profileUserId === me.id;

  const posts = useStore((s) => s.posts.filter((p) => p.userId === target.id));
  const reels = useStore((s) => s.reels.filter((r) => r.userId === target.id));
  const products = useStore((s) => s.products.filter((p) => p.sellerId === target.id));
  const allUsers = useStore((s) => s.users);
  const update = useStore((s) => s.updateProfile);
  const tryRename = useStore((s) => s.tryRename);
  const findByUsername = useStore((s) => s.findByUsername);
  const logout = useStore((s) => s.logout);
  const following = useStore((s) => s.followingIds);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const startChat = useStore((s) => s.startChat);
  const followerCount = useStore((s) => s.followerCount(target.id));
  const followingCount = useStore((s) => s.followingCount(target.id));

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("post");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(target.name);
  const [username, setUsername] = useState(target.username);
  const [bio, setBio] = useState(target.bio ?? "");
  const [err, setErr] = useState("");
  const [list, setList] = useState<null | "followers" | "following">(null);
  const [share, setShare] = useState(false);

  const likes = posts.reduce((n, p) => n + p.likedBy.length, 0);
  const isFollowing = following.includes(target.id);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) update({ avatar: await fileToDataUrl(f) });
    e.target.value = "";
  }
  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) update({ cover: await fileToDataUrl(f) });
    e.target.value = "";
  }

  function save() {
    setErr("");
    const uname = username.trim().toLowerCase().replace(/\s+/g, "");
    if (!uname) return setErr("Username tidak boleh kosong.");
    if (uname !== target.username) {
      const exists = findByUsername(uname);
      if (exists && exists.id !== target.id) return setErr("Username sudah dipakai.");
    }
    // ganti nama (dibatasi 1x / 30 hari)
    if (name.trim() !== target.name) {
      const r = tryRename(name);
      if (!r.ok) return setErr(r.msg);
    }
    update({ username: uname, bio: bio.trim() });
    setEditing(false);
  }

  // daftar untuk modal pengikut/mengikuti (sampel pengguna ChatLoop)
  const sample = allUsers.filter((u) => u.id !== target.id);
  const followingList = isSelf ? allUsers.filter((u) => following.includes(u.id)) : sample;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {!isSelf && (
        <button onClick={() => onNavigate("feed")} className="flex items-center gap-1 px-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <ArrowLeft size={16} /> Kembali
        </button>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* sampul */}
        <div className="relative h-36">
          {target.cover ? (
            <img src={target.cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500" />
          )}
          {isSelf && (
            <>
              <button onClick={() => coverRef.current?.click()} className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/60">
                <ImageIcon size={14} /> Sampul
              </button>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={onCover} />
            </>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <div className="relative">
              <img src={target.avatar} alt={target.name} className="h-24 w-24 rounded-full border-4 border-white object-cover shadow dark:border-zinc-900" />
              {isSelf && (
                <>
                  <button onClick={() => avatarRef.current?.click()} className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700"><Camera size={15} /></button>
                  <input ref={avatarRef} type="file" accept="image/*" hidden onChange={onAvatar} />
                </>
              )}
            </div>

            {isSelf ? (
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditing((v) => !v); setErr(""); }} className="flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"><Pencil size={15} /> Edit</button>
                <button onClick={() => onNavigate("insights")} title="Insight" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"><BarChart3 size={16} /></button>
                <button onClick={() => setShare(true)} title="Bagikan profil" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"><Share2 size={16} /></button>
                <button onClick={() => onNavigate("settings")} title="Pengaturan" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300 text-zinc-600 lg:hidden dark:border-zinc-700 dark:text-zinc-300"><SettingsIcon size={15} /></button>
                <button onClick={logout} title="Keluar" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300 text-red-600 lg:hidden dark:border-zinc-700"><LogOut size={15} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => toggleFollow(target.id)} className={cn("rounded-full px-5 py-2 text-sm font-semibold transition", isFollowing ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800" : "bg-fuchsia-600 text-white hover:bg-fuchsia-700")}>{isFollowing ? "Mengikuti" : "Ikuti"}</button>
                <button onClick={() => { startChat(target.id); onNavigate("messages"); }} title="Pesan" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"><MessageCircle size={18} /></button>
                <button onClick={() => setShare(true)} title="Bagikan profil" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"><Share2 size={16} /></button>
              </div>
            )}
          </div>

          {isSelf && editing ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Nama</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:bg-zinc-800" />
                <p className="mt-1 text-[11px] text-zinc-400">⚠️ Nama hanya bisa diganti 1× setiap 30 hari.</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Username</label>
                <div className="flex items-center rounded-xl bg-zinc-100 px-4 dark:bg-zinc-800">
                  <span className="text-sm text-zinc-400">@</span>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="w-full bg-transparent py-2.5 pl-1 text-sm outline-none" />
                </div>
              </div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={2} className="w-full resize-none rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:bg-zinc-800" />
              {err && <p className="text-sm text-red-500">{err}</p>}
              <div className="flex gap-2">
                <button onClick={save} className="rounded-full bg-fuchsia-600 px-5 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700">Simpan</button>
                <button onClick={() => { setEditing(false); setErr(""); setName(target.name); setUsername(target.username); }} className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Batal</button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h1 className="flex items-center gap-1.5 text-xl font-bold">{target.name} {target.verified && <VerifiedBadge size={18} />}</h1>
              <p className="text-sm text-zinc-500">@{target.username}</p>
              {target.verified && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"><ShieldCheck size={12} /> Terverifikasi</span>}
              {target.bio && <p className="mt-2 text-[15px] text-zinc-700 dark:text-zinc-300">{target.bio}</p>}
            </div>
          )}

          <div className="mt-5 flex gap-8 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Stat label="Postingan" value={posts.length} />
            <Stat label="Pengikut" value={followerCount} onClick={() => setList("followers")} />
            <Stat label="Mengikuti" value={followingCount} onClick={() => setList("following")} />
            <Stat label="Suka" value={likes} />
          </div>
        </div>
      </div>

      {/* tab */}
      <div className="flex rounded-2xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {([["post", "Postingan", Grid3x3], ["reels", "Reels", Play], ["produk", "Produk", Store]] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition", tab === k ? "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800")}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* konten tab */}
      {tab === "post" && (
        posts.length === 0 ? <Empty text={isSelf ? "Kamu belum punya postingan." : "Belum ada postingan."} />
          : <div className="space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}

      {tab === "reels" && (
        reels.length === 0 ? <Empty text="Belum ada reels." />
          : <div className="grid grid-cols-3 gap-1.5">
              {reels.map((r) => (
                <button key={r.id} onClick={() => onNavigate("reels")} className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
                  <video src={r.video} muted className="h-full w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center"><Play size={26} className="fill-white/90 text-white/90" /></span>
                </button>
              ))}
            </div>
      )}

      {tab === "produk" && (
        products.length === 0 ? <Empty text="Belum ada produk dijual." />
          : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((p) => (
                <button key={p.id} onClick={() => onNavigate("shop")} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left dark:border-zinc-800 dark:bg-zinc-900">
                  <img src={p.image} alt="" className="aspect-square w-full object-cover" />
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                    <p className="mt-1 font-bold text-fuchsia-600 dark:text-fuchsia-400">{formatRupiah(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
      )}

      {list && (
        <UserListModal
          title={list === "followers" ? "Pengikut" : "Mengikuti"}
          users={list === "followers" ? sample : followingList}
          onClose={() => setList(null)}
        />
      )}
      {share && <ShareModal user={target} onClose={() => setShare(false)} />}
    </div>
  );
}

function Stat({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} className={cn("text-center", onClick && "transition hover:opacity-70")}>
      <p className="text-lg font-bold">{value.toLocaleString("id-ID")}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">{text}</div>;
}
