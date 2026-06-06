import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Music2, Play, Plus, Share2, Volume2, VolumeX, X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { VerifiedBadge } from "../components/VerifiedBadge";
import type { Reel } from "../lib/types";

export function Reels() {
  const reels = useStore((s) => s.reels);
  const [muted, setMuted] = useState(true);
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold">Reels</h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
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

function ReelCard({
  reel,
  muted,
  onToggleMute,
}: {
  reel: Reel;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const user = useStore((s) => s.user);
  const me = useStore((s) => s.currentUserId);
  const toggleLike = useStore((s) => s.toggleReelLike);
  const author = user(reel.userId);
  const liked = reel.likedBy.includes(me);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);

  // putar otomatis saat reel terlihat di layar
  useEffect(() => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          v.play().catch(() => {});
          setPlaying(true);
        } else {
          v.pause();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full snap-start snap-always">
      <video
        ref={videoRef}
        src={reel.video}
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        className="h-full w-full rounded-2xl bg-black object-cover"
      />

      {!playing && (
        <button onClick={togglePlay} className="absolute inset-0 grid place-items-center">
          <Play size={56} className="fill-white/80 text-white/80" />
        </button>
      )}

      {/* mute */}
      <button
        onClick={onToggleMute}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      {/* gradient bawah */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent" />

      {/* info kiri-bawah */}
      <div className="absolute bottom-4 left-4 right-16 text-white">
        <div className="flex items-center gap-2">
          <img src={author.avatar} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
          <span className="text-sm font-semibold">{author.name}</span>
          {author.verified && <VerifiedBadge size={14} />}
        </div>
        <p className="mt-2 line-clamp-2 text-sm drop-shadow">{reel.caption}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/90">
          <Music2 size={13} /> {reel.music}
        </p>
      </div>

      {/* aksi kanan */}
      <div className="absolute bottom-4 right-3 flex flex-col items-center gap-4 text-white">
        <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1 transition active:scale-90">
          <Heart size={30} className={cn(liked && "fill-red-500 text-red-500")} />
          <span className="text-xs font-semibold">{reel.likedBy.length}</span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle size={28} />
          <span className="text-xs font-semibold">{reel.comments}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Share2 size={28} />
          <span className="text-xs font-semibold">Bagikan</span>
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
  const [music, setMusic] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setVideo(URL.createObjectURL(f));
    e.target.value = "";
  }

  function submit() {
    if (!video) return;
    addReel({ video, caption, music });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-5 sm:rounded-3xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Buat Reel</h3>
          <button onClick={onClose} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="mb-3 flex aspect-[9/12] max-h-64 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          {video ? (
            <video src={video} className="h-full w-full object-cover" muted autoPlay loop />
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm"><Plus size={28} /> Pilih video</span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={pick} />

        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Tulis caption..." className="mb-2 w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800" />
        <input value={music} onChange={(e) => setMusic(e.target.value)} placeholder="Judul musik (opsional)" className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800" />

        <button onClick={submit} disabled={!video} className="mt-4 w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
          Posting Reel
        </button>
        <p className="mt-2 text-center text-xs text-zinc-400">Video upload aktif selama sesi ini (demo tanpa server).</p>
      </div>
    </div>
  );
}
