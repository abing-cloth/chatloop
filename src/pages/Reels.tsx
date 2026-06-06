import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Music2, Play, Plus, Send, Share2, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn, timeAgo } from "../lib/utils";
import { useT } from "../lib/i18n";
import { VerifiedBadge } from "../components/VerifiedBadge";
import type { Reel } from "../lib/types";

const FILTERS = [
  { key: "normal", label: "Normal", css: "none" },
  { key: "vivid", label: "Vivid", css: "saturate(1.6) contrast(1.12)" },
  { key: "cerah", label: "Cerah", css: "brightness(1.12) saturate(1.18)" },
  { key: "bw", label: "B&W", css: "grayscale(1) contrast(1.1)" },
  { key: "sepia", label: "Sepia", css: "sepia(0.7)" },
  { key: "vintage", label: "Vintage", css: "sepia(0.4) contrast(0.92) brightness(1.05) saturate(1.25)" },
  { key: "dingin", label: "Dingin", css: "hue-rotate(-18deg) saturate(1.25)" },
  { key: "hangat", label: "Hangat", css: "sepia(0.25) saturate(1.35) brightness(1.05)" },
];

const TRACKS = ["Suara asli", "Lo-fi Chill 🎧", "Energetic Beat 🔥", "Calm Piano 🎹", "Dangdut Koplo 🪕", "Pop Galau 💔", "EDM Party 🎉", "Akustik Senja 🌇"];

export function Reels() {
  const reels = useStore((s) => s.reels);
  const [muted, setMuted] = useState(true);
  const [creating, setCreating] = useState(false);
  const tr = useT();

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold">{tr("page.reels")}</h2>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
          <Plus size={16} /> Buat Reel
        </button>
      </div>

      <div className="h-[calc(100vh-9.5rem)] snap-y snap-mandatory overflow-y-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reels.map((reel) => (
          <ReelCard key={reel.id} reel={reel} muted={muted} onToggleMute={() => setMuted((m) => !m)} />
        ))}
      </div>

      {creating && <CreateReel onClose={() => setCreating(false)} />}
    </div>
  );
}

function ReelCard({ reel, muted, onToggleMute }: { reel: Reel; muted: boolean; onToggleMute: () => void }) {
  const user = useStore((s) => s.user);
  const me = useStore((s) => s.currentUserId);
  const toggleLike = useStore((s) => s.toggleReelLike);
  const commentCount = useStore((s) => s.reelComments.filter((c) => c.reelId === reel.id).length);
  const author = user(reel.userId);
  const liked = reel.likedBy.includes(me);

  const dataSaver = useStore((s) => s.settings.dataSaver);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(!dataSaver);
  const [filter, setFilter] = useState("normal");
  const [showFilter, setShowFilter] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const filterCss = FILTERS.find((f) => f.key === filter)?.css ?? "none";

  useEffect(() => {
    const v = videoRef.current, wrap = wrapRef.current;
    if (!v || !wrap) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !dataSaver) { v.play().catch(() => {}); setPlaying(true); }
      else { v.pause(); if (!e.isIntersecting) setPlaying(false); }
    }, { threshold: 0.6 });
    io.observe(wrap);
    return () => io.disconnect();
  }, [dataSaver]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full snap-start snap-always">
      <video ref={videoRef} src={reel.video} loop muted={muted} playsInline preload={dataSaver ? "none" : "metadata"} onClick={togglePlay} className="h-full w-full rounded-2xl bg-black object-cover" style={{ filter: filterCss }} />

      {!playing && <button onClick={togglePlay} className="absolute inset-0 grid place-items-center"><Play size={56} className="fill-white/80 text-white/80" /></button>}

      <button onClick={onToggleMute} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent" />

      <div className="absolute bottom-4 left-4 right-16 text-white">
        <div className="flex items-center gap-2">
          <img src={author.avatar} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
          <span className="text-sm font-semibold">{author.name}</span>
          {author.verified && <VerifiedBadge size={14} />}
        </div>
        <p className="mt-2 line-clamp-2 text-sm drop-shadow">{reel.caption}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/90"><Music2 size={13} /> {reel.music}</p>
      </div>

      {/* aksi kanan */}
      <div className="absolute bottom-4 right-3 flex flex-col items-center gap-4 text-white">
        <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1 transition active:scale-90">
          <Heart size={30} className={cn(liked && "fill-red-500 text-red-500")} />
          <span className="text-xs font-semibold">{reel.likedBy.length}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 transition active:scale-90">
          <MessageCircle size={28} />
          <span className="text-xs font-semibold">{reel.comments + commentCount}</span>
        </button>
        <button onClick={() => setShowFilter((v) => !v)} className={cn("flex flex-col items-center gap-1 transition active:scale-90", showFilter && "text-fuchsia-400")}>
          <Sparkles size={28} />
          <span className="text-xs font-semibold">Efek</span>
        </button>
        <div className="flex flex-col items-center gap-1"><Share2 size={28} /><span className="text-xs font-semibold">Bagikan</span></div>
      </div>

      {/* strip filter */}
      {showFilter && (
        <div className="absolute inset-x-0 bottom-24 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur transition", filter === f.key ? "bg-white text-zinc-900" : "bg-white/20 text-white hover:bg-white/30")}>{f.label}</button>
          ))}
        </div>
      )}

      {showComments && <ReelComments reelId={reel.id} onClose={() => setShowComments(false)} />}
    </div>
  );
}

function ReelComments({ reelId, onClose }: { reelId: string; onClose: () => void }) {
  const comments = useStore((s) => s.reelComments.filter((c) => c.reelId === reelId));
  const user = useStore((s) => s.user);
  const add = useStore((s) => s.addReelComment);
  const [text, setText] = useState("");

  function send() { if (!text.trim()) return; add(reelId, text); setText(""); }

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end" onClick={onClose}>
      <div className="flex max-h-[70%] flex-col rounded-t-2xl bg-white dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-bold">Komentar ({comments.length})</h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {comments.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">Belum ada komentar. Jadi yang pertama!</p>}
          {comments.map((c) => {
            const u = user(c.userId);
            return (
              <div key={c.id} className="flex gap-2.5">
                <img src={u.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-semibold">{u.name} <span className="ml-1 font-normal text-zinc-400">{timeAgo(c.createdAt)}</span></p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-200">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Tulis komentar..." className="flex-1 rounded-full bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800" />
          <button onClick={send} disabled={!text.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-fuchsia-600 text-white disabled:opacity-40"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function CreateReel({ onClose }: { onClose: () => void }) {
  const addReel = useStore((s) => s.addReel);
  const fileRef = useRef<HTMLInputElement>(null);
  const [video, setVideo] = useState<string | undefined>();
  const [caption, setCaption] = useState("");
  const [music, setMusic] = useState(TRACKS[0]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setVideo(URL.createObjectURL(f));
    e.target.value = "";
  }
  function submit() { if (!video) return; addReel({ video, caption, music }); onClose(); }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Buat Reel</h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={20} /></button>
        </div>

        <button onClick={() => fileRef.current?.click()} className="mb-3 flex aspect-[9/12] max-h-56 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50">
          {video ? <video src={video} className="h-full w-full object-cover" muted autoPlay loop /> : <span className="flex flex-col items-center gap-1 text-sm"><Plus size={28} /> Pilih video</span>}
        </button>
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={pick} />

        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Tulis caption..." className="mb-3 w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800" />

        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500"><Music2 size={13} /> Pilih musik</p>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <button key={t} onClick={() => setMusic(t)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", music === t ? "bg-fuchsia-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300")}>{t}</button>
          ))}
        </div>

        <button onClick={submit} disabled={!video} className="mt-4 w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">Posting Reel</button>
        <p className="mt-2 text-center text-xs text-zinc-400">Video upload aktif selama sesi ini (demo tanpa server).</p>
      </div>
    </div>
  );
}
