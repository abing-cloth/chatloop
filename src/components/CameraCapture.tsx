import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, RefreshCw, RotateCcw, SwitchCamera, X } from "lucide-react";
import { cn, fileToDataUrl } from "../lib/utils";

interface Filter {
  key: string;
  label: string;
  css: string;
  glow?: boolean;
  white?: number; // kekuatan lapisan warna (0-1) untuk proses kulit
  tint?: string;  // warna lapisan (default putih)
}

// Nama filter gaya viral (selaras dengan filter Live)
const FILTERS: Filter[] = [
  { key: "normal", label: "Normal", css: "none" },
  { key: "beautyfilter", label: "Beauty Filter", css: "brightness(1.12) saturate(1.08) blur(0.6px)", white: 0.18, tint: "#fff5f2" },
  { key: "beautymouth", label: "Beauty Mouth", css: "brightness(1.1) saturate(1.18) contrast(1.02)", white: 0.16, tint: "#ffdbe2" },
  { key: "blueblur", label: "Blue Blur", css: "blur(1.4px) hue-rotate(-12deg) saturate(1.1) brightness(1.08)", white: 0.08, tint: "#dbe8ff" },
  { key: "dontworry", label: "Don't Worry", css: "sepia(0.18) saturate(1.3) brightness(1.12)", white: 0.08, tint: "#fff2dd" },
  { key: "overexposure", label: "Over Exposure", css: "brightness(1.5) contrast(0.8) saturate(1.05)", white: 0.26 },
  { key: "natural111", label: "Natural 111", css: "brightness(1.06) saturate(1.1) contrast(1.03)", white: 0.08 },
  { key: "kindofcute", label: "Kind of Cute", css: "brightness(1.12) saturate(1.2)", glow: true, white: 0.14, tint: "#ffd6ea" },
  { key: "fusiinos", label: "Fusi Wajah Inos", css: "brightness(1.16) saturate(1.12) blur(0.9px)", glow: true, white: 0.2, tint: "#fff4f0" },
  { key: "bw", label: "B&W", css: "grayscale(1) contrast(1.1) brightness(1.05)" },
];

export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [filter, setFilter] = useState("beautyfilter");
  const [bright, setBright] = useState(1);
  const [shot, setShot] = useState<string | null>(null); // hasil capture (sebelum dipakai)
  const [galleryImg, setGalleryImg] = useState<string | null>(null); // foto galeri untuk difilter
  const [camError, setCamError] = useState(false);

  const flt = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const cssStr = (((flt.css === "none" ? "" : flt.css) + (bright !== 1 ? ` brightness(${bright})` : "")).trim()) || "none";

  // mulai/ganti kamera
  useEffect(() => {
    if (shot || galleryImg) return;
    let cancelled = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamError(false);
      })
      .catch(() => setCamError(true));
    return () => { cancelled = true; };
  }, [facing, shot, galleryImg]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  function drawGlow(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    const g = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.1, w / 2, h / 2, h * 0.7);
    g.addColorStop(0, "rgba(255,225,210,0.55)");
    g.addColorStop(1, "rgba(255,200,220,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const w = v.videoWidth || 720;
    const h = v.videoHeight || 1280;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = cssStr;
    if (facing === "user") { ctx.translate(w, 0); ctx.scale(-1, 1); } // cermin selfie
    ctx.drawImage(v, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = "none";
    if (flt.glow) drawGlow(ctx, w, h);
    if (flt.white) { ctx.globalAlpha = flt.white; ctx.fillStyle = flt.tint ?? "#ffffff"; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
    setShot(canvas.toDataURL("image/jpeg", 0.9));
  }

  function applyToImage(src: string) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = cssStr;
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";
      if (flt.glow) drawGlow(ctx, canvas.width, canvas.height);
      if (flt.white) { ctx.globalAlpha = flt.white; ctx.fillStyle = flt.tint ?? "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1; }
      setShot(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = src;
  }

  async function pickGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      const d = await fileToDataUrl(f);
      setGalleryImg(d);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
    e.target.value = "";
  }

  return (
    <div className="fixed inset-0 z-[96] flex flex-col bg-black">
      {/* preview area */}
      <div className="relative flex-1 overflow-hidden">
        {shot ? (
          <img src={shot} alt="hasil" className="h-full w-full object-contain" />
        ) : galleryImg ? (
          <img src={galleryImg} alt="galeri" className="h-full w-full object-contain" style={{ filter: cssStr }} />
        ) : camError ? (
          <div className="grid h-full w-full place-items-center px-8 text-center text-white/70">
            Kamera tidak bisa diakses. Coba ambil dari galeri di bawah, atau izinkan kamera.
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ filter: cssStr, transform: facing === "user" ? "scaleX(-1)" : "none" }}
          />
        )}
        {/* lapisan warna untuk filter memproses kulit */}
        {!shot && flt.white ? (
          <div className="pointer-events-none absolute inset-0" style={{ opacity: flt.white, backgroundColor: flt.tint ?? "#ffffff" }} />
        ) : null}

        <button onClick={onClose} className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
          <X size={20} />
        </button>
        {!shot && !galleryImg && !camError && (
          <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} title="Ganti kamera" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
            <SwitchCamera size={20} />
          </button>
        )}
      </div>

      {/* slider terang (edit) */}
      {!shot && (
        <div className="flex items-center gap-3 bg-black px-4 pt-2 text-white">
          <span className="text-xs">☀️ Terang</span>
          <input type="range" min="0.7" max="1.6" step="0.01" value={bright} onChange={(e) => setBright(parseFloat(e.target.value))} className="flex-1 accent-fuchsia-500" />
          <button onClick={() => setBright(1)} className="text-xs text-white/60">reset</button>
        </div>
      )}

      {/* filter strip */}
      {!shot && (
        <div className="flex gap-2 overflow-x-auto bg-black px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                filter === f.key ? "bg-white text-zinc-900" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* kontrol bawah */}
      <div className="flex items-center justify-around bg-black px-4 pb-6 pt-3">
        {shot ? (
          <>
            <button onClick={() => setShot(null)} className="flex flex-col items-center gap-1 text-white">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15"><RotateCcw size={22} /></span>
              <span className="text-xs">Ulangi</span>
            </button>
            <button onClick={() => onCapture(shot)} className="flex flex-col items-center gap-1 text-white">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500"><Check size={30} /></span>
              <span className="text-xs">Gunakan</span>
            </button>
            <span className="w-12" />
          </>
        ) : (
          <>
            <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1 text-white">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15"><ImagePlus size={22} /></span>
              <span className="text-xs">Galeri</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickGallery} />

            {galleryImg ? (
              <button onClick={() => applyToImage(galleryImg)} className="flex flex-col items-center gap-1 text-white">
                <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-fuchsia-600"><Check size={28} /></span>
                <span className="text-xs">Terapkan filter</span>
              </button>
            ) : (
              <button onClick={capture} disabled={camError} className="flex flex-col items-center gap-1 text-white disabled:opacity-40">
                <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-white"><Camera size={28} /></span>
                <span className="text-xs">Ambil</span>
              </button>
            )}

            {galleryImg ? (
              <button onClick={() => setGalleryImg(null)} className="flex flex-col items-center gap-1 text-white">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15"><RefreshCw size={22} /></span>
                <span className="text-xs">Kamera</span>
              </button>
            ) : (
              <span className="w-12" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
