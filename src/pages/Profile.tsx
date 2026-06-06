import { useRef, useState } from "react";
import { ArrowLeft, Camera, Grid3x3, LogOut, MessageCircle, Pencil, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { PostCard } from "../components/PostCard";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { useStore } from "../lib/store";
import { cn, fileToDataUrl } from "../lib/utils";
import type { View } from "../lib/types";

export function Profile({ onNavigate }: { onNavigate: (v: View) => void }) {
  const profileUserId = useStore((s) => s.profileUserId);
  const me = useStore((s) => s.me());
  const target = useStore((s) => (profileUserId ? s.user(profileUserId) : s.me()));
  const isSelf = !profileUserId || profileUserId === me.id;

  const posts = useStore((s) => s.posts.filter((p) => p.userId === target.id));
  const update = useStore((s) => s.updateProfile);
  const logout = useStore((s) => s.logout);
  const followingIds = useStore((s) => s.followingIds);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const startChat = useStore((s) => s.startChat);
  const followerCount = useStore((s) => s.followerCount(target.id));
  const followingCount = useStore((s) => s.followingCount(target.id));
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(target.name);
  const [bio, setBio] = useState(target.bio ?? "");

  const likes = posts.reduce((n, p) => n + p.likedBy.length, 0);
  const isFollowing = followingIds.includes(target.id);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) update({ avatar: await fileToDataUrl(file) });
    e.target.value = "";
  }
  function save() {
    update({ name: name.trim() || target.name, bio: bio.trim() });
    setEditing(false);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {!isSelf && (
        <button onClick={() => onNavigate("feed")} className="flex items-center gap-1 px-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <ArrowLeft size={16} /> Kembali
        </button>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-36 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <div className="relative">
              <img src={target.avatar} alt={target.name} className="h-24 w-24 rounded-full border-4 border-white object-cover shadow dark:border-zinc-900" />
              {isSelf && (
                <>
                  <button onClick={() => fileRef.current?.click()} className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700">
                    <Camera size={15} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
                </>
              )}
            </div>

            {isSelf ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing((v) => !v)} className="flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                  <Pencil size={15} /> Edit Profil
                </button>
                <button onClick={() => onNavigate("settings")} title="Pengaturan" className="flex items-center gap-2 rounded-full border border-zinc-300 p-2.5 text-zinc-600 hover:bg-zinc-50 lg:hidden dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <SettingsIcon size={15} />
                </button>
                <button onClick={logout} title="Keluar" className="flex items-center gap-2 rounded-full border border-zinc-300 p-2.5 text-red-600 hover:bg-red-50 lg:hidden dark:border-zinc-700 dark:hover:bg-red-950/40">
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFollow(target.id)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-semibold transition",
                    isFollowing ? "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800" : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                  )}
                >
                  {isFollowing ? "Mengikuti" : "Ikuti"}
                </button>
                <button onClick={() => { startChat(target.id); onNavigate("messages"); }} title="Pesan" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                  <MessageCircle size={18} />
                </button>
              </div>
            )}
          </div>

          {isSelf && editing ? (
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:bg-zinc-800" />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={2} className="w-full resize-none rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-200 dark:bg-zinc-800" />
              <div className="flex gap-2">
                <button onClick={save} className="rounded-full bg-fuchsia-600 px-5 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700">Simpan</button>
                <button onClick={() => setEditing(false)} className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Batal</button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h1 className="flex items-center gap-1.5 text-xl font-bold">
                {target.name}
                {target.verified && <VerifiedBadge size={18} />}
              </h1>
              <p className="text-sm text-zinc-500">@{target.username}</p>
              {target.verified && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <ShieldCheck size={12} /> Terverifikasi
                </span>
              )}
              {target.bio && <p className="mt-2 text-[15px] text-zinc-700 dark:text-zinc-300">{target.bio}</p>}
            </div>
          )}

          <div className="mt-5 flex gap-8 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Stat label="Postingan" value={posts.length} />
            <Stat label="Pengikut" value={followerCount} />
            <Stat label="Mengikuti" value={followingCount} />
            <Stat label="Suka" value={likes} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
        <Grid3x3 size={18} /> Postingan
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          {isSelf ? "Kamu belum punya postingan." : "Belum ada postingan."}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold">{value.toLocaleString("id-ID")}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
