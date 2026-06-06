import { useEffect, useRef, useState } from "react";
import { Eraser, Eye, Heart, Power, Smile, Sparkles, VideoOff, X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import type { LiveStream } from "../lib/types";

interface LiveComment {
  id: number;
  name: string;
  avatar: string;
  text: string;
}
interface FloatHeart {
  id: number;
  drift: number;
}
interface Sticker {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rot: number;
}

const CHATTER = [
  "Halo semuanya! 👋", "Keren banget nih 🔥", "Hadir dari Bandung 🙌",
  "Mantap, lanjutkan! 💪", "Salam kenal semua 😊", "Wah seru ya 😍",
  "Suaranya jernih banget", "Pertama kali nonton, suka! ❤️", "Bagi tips dong kak",
  "Ditunggu konten berikutnya 🙏", "LFG! 🚀", "Halo dari Surabaya 👋",
  "Ngakak 🤣", "Setuju banget sih ini", "Auto follow 🔔",
];

const FILTERS = [
  { key: "normal", label: "Normal", css: "none" },
  { key: "cerah", label: "Cerah", css: "brightness(1.12) contrast(1.05) saturate(1.18)" },
  { key: "mulus", label: "Mulus", css: "brightness(1.1) saturate(1.1) contrast(1.02) blur(0.6px)" },
  { key: "vivid", label: "Vivid", css: "saturate(1.6) contrast(1.12)" },
  { key: "bw", label: "B&W", css: "grayscale(1) contrast(1.1)" },
  { key: "sepia", label: "Sepia", css: "sepia(0.7)" },
  { key: "vintage", label: "Vintage", css: "sepia(0.4) contrast(0.92) brightness(1.05) saturate(1.25)" },
  { key: "dingin", label: "Dingin", css: "hue-rotate(-18deg) saturate(1.25) brightness(1.05)" },
  { key: "hangat", label: "Hangat", css: "sepia(0.25) saturate(1.35) brightness(1.05)" },
];

const STICKERS = ["😎", "🤪", "🐶", "👑", "🔥", "💀", "🤡", "👽", "🦄", "🥸", "🤖", "😂", "🎉", "💅", "🐸", "🍌"];

let cid = 1;
let hid = 1;
let sid = 1;

export function LiveRoom({
  mode,
  stream,
  title,
  category,
  onClose,
}: {
  mode: "host" | "viewer";
  stream?: LiveStream;
  title?: string;
  category?: string;
  onClose: () => void;
}) {
  const me = useStore((s) => s.me());
  const user = useStore((s) => s.user);
  const users = useStore((s) => s.users).filter((u) => u.id !== "me");

  const host = mode === "viewer" && stream ? user(stream.userId) : me;
  const liveTitle = stream?.title ?? title;
  const liveCategory = stream?.category ?? category;
  const [viewers, setViewers] = useState(stream?.viewers ?? 1);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [hearts, setHearts] = useState<FloatHeart[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [filter, setFilter] = useState("normal");
  const [showFilters, setShowFilters] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [text, setText] = useState("");
  const [camError, setCamError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const filterCss = FILTERS.find((f) => f.key === filter)?.css ?? "none";

  useEffect(() => {
    if (mode !== "host") return;
    let media: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        media = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCamError(true));
    return () => media?.getTracks().forEach((t) => t.stop());
  }, [mode]);

  useEffect(() => {
    const c = setInterval(() => {
      const u = users[Math.floor(Math.random() * users.length)];
      setComments((prev) =>
        [...prev, { id: cid++, name: u.name, avatar: u.avatar, text: CHATTER[Math.floor(Math.random() * CHATTER.length)] }].slice(-40)
      );
    }, 2200);
    const v = setInterval(() => setViewers((n) => Math.max(1, n + Math.floor(Math.random() * 9) - 3)), 3000);
    const h = setInterval(() => { if (Math.random() > 0.4) popHeart(); }, 1300);
    return () => { clearInterval(c); clearInterval(v); clearInterval(h); };
  }, [users]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  function popHeart() {
    const id = hid++;
    setHearts((prev) => [...prev, { id, drift: Math.floor(Math.random() * 60) - 30 }]);
    setTimeout(() => setHearts((prev) => prev.filter((x) => x.id !== id)), 2200);
  }

  function addSticker(emoji: string) {
    const id = sid++;
    const s: Sticker = {
      id,
      emoji,
      x: 15 + Math.random() * 60,
      y: 25 + Math.random() * 45,
      rot: Math.random() * 40 - 20,
    };
    setStickers((prev) => [...prev.slice(-7), s]);
    setTimeout(() => setStickers((prev) => prev.filter((x) => x.id !== id)), 6000);
  }

  function send() {
    if (!text.trim()) return;
    setComments((prev) => [...prev, { id: cid++, name: me.name, avatar: me.avatar, text: text.trim() }].slice(-40));
    setText("");
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black">
      <div className="relative h-full w-full max-w-md overflow-hidden bg-zinc-900 sm:h-[92vh] sm:rounded-2xl">
        {/* latar */}
        {mode === "host" ? (
          camError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400">
              <VideoOff size={40} />
              <p className="px-8 text-center text-sm">Kamera tidak aktif / izin ditolak.<br />Siaran tetap berjalan (mode demo).</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" style={{ filter: filterCss }} />
          )
        ) : (
          <img src={stream?.thumbnail} alt="" className="h-full w-full object-cover" style={{ filter: filterCss }} />
        )}

        {/* stiker emoji overlay */}
        <div className="pointer-events-none absolute inset-0">
          {stickers.map((s) => (
            <span
              key={s.id}
              className="animate-pop absolute select-none text-5xl drop-shadow-lg"
              style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.rot}deg)` }}
            >
              {s.emoji}
            </span>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/80 to-transparent" />

        {/* bar atas */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
          <img src={host.avatar} alt="" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{host.name}</p>
            <p className="truncate text-xs text-white/70">@{host.username}</p>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-live-dot" /> LIVE
          </span>
          <span className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            <Eye size={13} /> {viewers.toLocaleString("id-ID")}
          </span>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">
            <X size={18} />
          </button>
        </div>

        {/* judul */}
        {liveTitle && (
          <div className="absolute left-3 top-16 max-w-[65%]">
            {liveCategory && (
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">{liveCategory}</span>
            )}
            <p className="mt-1.5 text-sm font-medium text-white drop-shadow">{liveTitle}</p>
          </div>
        )}

        {/* tombol AKHIRI SIARAN (host) */}
        {mode === "host" && (
          <button
            onClick={onClose}
            className="absolute right-3 top-28 flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-95"
          >
            <Power size={16} /> Akhiri Siaran
          </button>
        )}

        {/* komentar langsung */}
        <div className="absolute inset-x-0 bottom-28 max-h-44 space-y-2 overflow-hidden px-3">
          {comments.map((c) => (
            <div key={c.id} className="animate-fade flex items-start gap-2">
              <img src={c.avatar} alt="" className="mt-0.5 h-7 w-7 rounded-full object-cover" />
              <p className="text-sm text-white drop-shadow">
                <span className="font-semibold">{c.name}</span> <span className="text-white/90">{c.text}</span>
              </p>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* hati melayang */}
        <div className="pointer-events-none absolute bottom-28 right-3 h-48 w-16">
          {hearts.map((h) => (
            <Heart key={h.id} size={30} className="animate-heart-float absolute bottom-0 right-2 fill-pink-500 text-pink-500" style={{ "--drift": `${h.drift}px` } as React.CSSProperties} />
          ))}
        </div>

        {/* panel filter kamera */}
        {showFilters && (
          <div className="absolute inset-x-0 bottom-16 flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur transition",
                  filter === f.key ? "bg-white text-zinc-900" : "bg-white/20 text-white hover:bg-white/30"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* panel stiker emoji */}
        {showStickers && (
          <div className="absolute inset-x-0 bottom-16 flex items-center gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STICKERS.map((e) => (
              <button key={e} onClick={() => addSticker(e)} className="shrink-0 rounded-full px-1.5 py-1 text-2xl transition active:scale-90 hover:bg-white/10">
                {e}
              </button>
            ))}
            <button onClick={() => setStickers([])} title="Bersihkan stiker" className="ml-1 shrink-0 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white">
              <Eraser size={16} />
            </button>
          </div>
        )}

        {/* baris bawah: input + aksi */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tambahkan komentar..."
            className="min-w-0 flex-1 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur placeholder:text-white/60 focus:border-white/60"
          />
          <button
            onClick={() => { setShowStickers((v) => !v); setShowFilters(false); }}
            className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full backdrop-blur transition", showStickers ? "bg-amber-400 text-zinc-900" : "bg-white/15 text-white hover:bg-white/25")}
            title="Stiker lucu"
          >
            <Smile size={20} />
          </button>
          {mode === "host" && (
            <button
              onClick={() => { setShowFilters((v) => !v); setShowStickers(false); }}
              className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full backdrop-blur transition", showFilters ? "bg-fuchsia-500 text-white" : "bg-white/15 text-white hover:bg-white/25")}
              title="Filter kamera"
            >
              <Sparkles size={20} />
            </button>
          )}
          <button onClick={popHeart} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink-600 text-white transition active:scale-90 hover:bg-pink-500" title="Suka">
            <Heart size={20} className="fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
