import { useEffect, useRef, useState } from "react";
import { Eraser, Eye, Glasses, Heart, Power, Smile, Sparkles, SwitchCamera, VideoOff, X } from "lucide-react";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { LiveCamera, FACE_EFFECTS } from "./LiveCamera";
import type { LiveStream } from "../lib/types";

interface LiveComment { id: number; name: string; avatar: string; text: string }
interface FloatHeart { id: number; drift: number }
interface Sticker { id: number; emoji: string; x: number; y: number; rot: number }

const CHATTER = [
  "Halo semuanya! 👋", "Keren banget nih 🔥", "Hadir dari Bandung 🙌",
  "Mantap, lanjutkan! 💪", "Salam kenal semua 😊", "Wah seru ya 😍",
  "Suaranya jernih banget", "Pertama kali nonton, suka! ❤️", "Bagi tips dong kak",
  "Ditunggu konten berikutnya 🙏", "LFG! 🚀", "Ngakak 🤣", "Auto follow 🔔",
];

// Filter (nama gaya viral). `white` = kekuatan proses kulit, `tint` = warna nuansa kulit.
const FILTERS = [
  { key: "normal", label: "Normal", css: "none", white: 0, tint: "#ffffff" },
  { key: "beautyfilter", label: "Beauty Filter", css: "saturate(1.1)", white: 0.2, tint: "#fff5f2" },
  { key: "beautymouth", label: "Beauty Mouth", css: "saturate(1.16) contrast(1.02)", white: 0.16, tint: "#ffdbe2" },
  { key: "blueblur", label: "Blue Blur", css: "blur(1.2px) hue-rotate(-12deg) saturate(1.1) brightness(1.04)", white: 0.08, tint: "#dbe8ff" },
  { key: "dontworry", label: "Don't Worry", css: "sepia(0.18) saturate(1.3) brightness(1.08)", white: 0.1, tint: "#fff2dd" },
  { key: "overexposure", label: "Over Exposure", css: "brightness(1.4) contrast(0.82) saturate(1.05)", white: 0.3, tint: "#ffffff" },
  { key: "natural111", label: "Natural 111", css: "saturate(1.08) contrast(1.03)", white: 0.1, tint: "#fffaf5" },
  { key: "kindofcute", label: "Kind of Cute", css: "saturate(1.2) brightness(1.05)", white: 0.16, tint: "#ffd6ea" },
  { key: "fusiinos", label: "Fusi Wajah Inos", css: "saturate(1.15) contrast(1.02)", white: 0.24, tint: "#fff4f0" },
  { key: "bw", label: "B&W", css: "grayscale(1) contrast(1.1)", white: 0, tint: "#ffffff" },
];

const STICKERS = ["😎", "🤪", "🐶", "👑", "🔥", "💀", "🤡", "👽", "🦄", "🥸", "🤖", "😂", "🎉", "💅", "🐸", "🍌"];

let cid = 1, hid = 1, sid = 1;
const clamp = (n: number) => Math.max(4, Math.min(96, n));

export function LiveRoom({
  mode, stream, title, category, onClose,
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
  const [ar, setAr] = useState("none");
  const [panel, setPanel] = useState<null | "sticker" | "efek">(null);
  const [efekTab, setEfekTab] = useState<"filter" | "wajah">("filter");
  const [text, setText] = useState("");
  const [camError, setCamError] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");

  const endRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<number | null>(null);

  const fltDef = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const filterCss = fltDef.css ?? "none";
  const whiteOverlay = fltDef.white ?? 0;
  const tint = fltDef.tint ?? "#ffffff";

  useEffect(() => {
    const c = setInterval(() => {
      const u = users[Math.floor(Math.random() * users.length)];
      setComments((prev) => [...prev, { id: cid++, name: u.name, avatar: u.avatar, text: CHATTER[Math.floor(Math.random() * CHATTER.length)] }].slice(-40));
    }, 2200);
    const v = setInterval(() => setViewers((n) => Math.max(1, n + Math.floor(Math.random() * 9) - 3)), 3000);
    const h = setInterval(() => { if (Math.random() > 0.4) popHeart(); }, 1300);
    return () => { clearInterval(c); clearInterval(v); clearInterval(h); };
  }, [users]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments.length]);

  // geser stiker
  useEffect(() => {
    function move(e: PointerEvent) {
      if (dragId.current == null || !stageRef.current) return;
      const r = stageRef.current.getBoundingClientRect();
      const x = clamp(((e.clientX - r.left) / r.width) * 100);
      const y = clamp(((e.clientY - r.top) / r.height) * 100);
      setStickers((prev) => prev.map((s) => (s.id === dragId.current ? { ...s, x, y } : s)));
    }
    function up() { dragId.current = null; }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  function popHeart() {
    const id = hid++;
    setHearts((prev) => [...prev, { id, drift: Math.floor(Math.random() * 60) - 30 }]);
    setTimeout(() => setHearts((prev) => prev.filter((x) => x.id !== id)), 2200);
  }

  function addSticker(emoji: string) {
    setStickers((prev) => [...prev.slice(-9), { id: sid++, emoji, x: 50, y: 45, rot: Math.random() * 30 - 15 }]);
  }

  function send() {
    if (!text.trim()) return;
    setComments((prev) => [...prev, { id: cid++, name: me.name, avatar: me.avatar, text: text.trim() }].slice(-40));
    setText("");
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black">
      <div ref={stageRef} className="relative h-full w-full max-w-md touch-none overflow-hidden bg-zinc-900 sm:h-[92vh] sm:rounded-2xl">
        {/* latar */}
        {mode === "host" ? (
          camError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400">
              <VideoOff size={40} />
              <p className="px-8 text-center text-sm">Kamera tidak aktif / izin ditolak.<br />Siaran tetap berjalan (mode demo).</p>
            </div>
          ) : (
            <LiveCamera filterCss={filterCss} whiteOverlay={whiteOverlay} tint={tint} effect={ar} facing={facing} onError={() => setCamError(true)} />
          )
        ) : (
          <img src={stream?.thumbnail} alt="" className="h-full w-full object-cover" style={{ filter: filterCss }} />
        )}

        {/* stiker (bisa digeser; klik-ganda untuk hapus) */}
        {stickers.map((s) => (
          <span
            key={s.id}
            onPointerDown={(e) => { e.preventDefault(); dragId.current = s.id; }}
            onDoubleClick={() => setStickers((prev) => prev.filter((x) => x.id !== s.id))}
            className="absolute z-10 cursor-grab touch-none select-none text-5xl drop-shadow-lg active:cursor-grabbing"
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%,-50%) rotate(${s.rot}deg)` }}
          >
            {s.emoji}
          </span>
        ))}

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

        {liveTitle && (
          <div className="absolute left-3 top-16 max-w-[65%]">
            {liveCategory && <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">{liveCategory}</span>}
            <p className="mt-1.5 text-sm font-medium text-white drop-shadow">{liveTitle}</p>
          </div>
        )}

        {mode === "host" && (
          <>
            <button onClick={onClose} className="absolute right-3 top-28 flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 active:scale-95">
              <Power size={16} /> Akhiri Siaran
            </button>
            <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} title="Ganti kamera" className="absolute right-3 top-40 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">
              <SwitchCamera size={20} />
            </button>
          </>
        )}

        {/* komentar */}
        <div className="absolute inset-x-0 bottom-28 max-h-40 space-y-2 overflow-hidden px-3">
          {comments.map((c) => (
            <div key={c.id} className="animate-fade flex items-start gap-2">
              <img src={c.avatar} alt="" className="mt-0.5 h-7 w-7 rounded-full object-cover" />
              <p className="text-sm text-white drop-shadow"><span className="font-semibold">{c.name}</span> <span className="text-white/90">{c.text}</span></p>
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

        {/* panel stiker */}
        {panel === "sticker" && (
          <div className="absolute inset-x-0 bottom-16 flex items-center gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STICKERS.map((e) => (
              <button key={e} onClick={() => addSticker(e)} className="shrink-0 rounded-full px-1.5 py-1 text-2xl transition active:scale-90 hover:bg-white/10">{e}</button>
            ))}
            <button onClick={() => setStickers([])} title="Bersihkan" className="ml-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-white"><Eraser size={16} /></button>
          </div>
        )}

        {/* panel efek (filter + wajah) */}
        {panel === "efek" && (
          <div className="absolute inset-x-0 bottom-16 px-3 pb-2">
            <div className="mb-2 flex gap-2">
              <button onClick={() => setEfekTab("filter")} className={cn("rounded-full px-3 py-1 text-xs font-semibold backdrop-blur", efekTab === "filter" ? "bg-white text-zinc-900" : "bg-white/20 text-white")}>Filter</button>
              <button onClick={() => setEfekTab("wajah")} className={cn("rounded-full px-3 py-1 text-xs font-semibold backdrop-blur", efekTab === "wajah" ? "bg-white text-zinc-900" : "bg-white/20 text-white")}>Efek Wajah</button>
            </div>
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {efekTab === "filter"
                ? FILTERS.map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur transition", filter === f.key ? "bg-white text-zinc-900" : "bg-white/20 text-white hover:bg-white/30")}>{f.label}</button>
                  ))
                : FACE_EFFECTS.map((a) => (
                    <button key={a.key} onClick={() => setAr(a.key)} className={cn("flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur transition", ar === a.key ? "bg-white text-zinc-900" : "bg-white/20 text-white hover:bg-white/30")}>
                      <span className="text-base">{a.icon}</span>{a.label}
                    </button>
                  ))}
            </div>
          </div>
        )}

        {/* baris bawah */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Tambahkan komentar..." className="min-w-0 flex-1 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur placeholder:text-white/60 focus:border-white/60" />
          <button onClick={() => setPanel((p) => (p === "sticker" ? null : "sticker"))} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full backdrop-blur transition", panel === "sticker" ? "bg-amber-400 text-zinc-900" : "bg-white/15 text-white hover:bg-white/25")} title="Stiker lucu"><Smile size={20} /></button>
          <button onClick={() => setPanel((p) => (p === "efek" ? null : "efek"))} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full backdrop-blur transition", panel === "efek" ? "bg-fuchsia-500 text-white" : "bg-white/15 text-white hover:bg-white/25")} title="Filter & efek wajah">
            {efekTab === "wajah" ? <Glasses size={20} /> : <Sparkles size={20} />}
          </button>
          <button onClick={popHeart} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink-600 text-white transition active:scale-90 hover:bg-pink-500" title="Suka"><Heart size={20} className="fill-white" /></button>
        </div>
      </div>
    </div>
  );
}
