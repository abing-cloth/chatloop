import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, RefreshCw, RotateCcw, SwitchCamera, X } from "lucide-react";
import { cn, fileToDataUrl } from "../lib/utils";
import { getFaceLandmarker } from "../lib/faceLandmarker";
import { renderBeauty, getSelfieSegmenter, fillMaskCanvas, MAKEUP, type BeautyFx } from "../lib/faceFx";
import type { FaceLandmarker, ImageSegmenter } from "@mediapipe/tasks-vision";

interface Filter extends BeautyFx { key: string; label: string; }

// Nama filter gaya viral + ubah fisik (mata/bibir/pipi/alis/hidung), selaras dgn Live
const FILTERS: Filter[] = [
  { key: "normal", label: "Normal", filterCss: "none", white: 0, tint: "#ffffff", eye: 1, lip: 1, body: 0, glow: 0, vignette: 0 },
  { key: "beautyfilter", label: "Beauty Filter", filterCss: "saturate(1.08)", white: 0.2, tint: "#fff5f2", eye: 1.18, lip: 1.08, cheek: 0.94, nose: 0.9, brow: 1.06, body: 0.16, glow: 0.18 },
  { key: "beautymouth", label: "Beauty Mouth", filterCss: "saturate(1.16) contrast(1.02)", white: 0.18, tint: "#ffdbe2", eye: 1.1, lip: 1.3, cheek: 0.95, nose: 0.92, brow: 1.04, body: 0.14, glow: 0.16 },
  { key: "blueblur", label: "Blue Blur", filterCss: "blur(1px) hue-rotate(-12deg) saturate(1.1) brightness(1.04)", white: 0.12, tint: "#dbe8ff", eye: 1.12, lip: 1.06, cheek: 0.96, nose: 0.94, body: 0.12, glow: 0.28, vignette: 0.15 },
  { key: "dontworry", label: "Don't Worry", filterCss: "sepia(0.18) saturate(1.3) brightness(1.06)", white: 0.12, tint: "#fff2dd", eye: 1.1, lip: 1.06, cheek: 0.97, body: 0.1, glow: 0.22 },
  { key: "overexposure", label: "Over Exposure", filterCss: "brightness(1.32) contrast(0.84) saturate(1.05)", white: 0.3, tint: "#ffffff", eye: 1.1, lip: 1.05, body: 0.24, glow: 0.34 },
  { key: "natural111", label: "Natural 111", filterCss: "saturate(1.08) contrast(1.03)", white: 0.12, tint: "#fffaf5", eye: 1.08, lip: 1.04, cheek: 0.97, nose: 0.95, body: 0.1, glow: 0.12 },
  { key: "kindofcute", label: "Kind of Cute", filterCss: "saturate(1.2) brightness(1.04)", white: 0.18, tint: "#ffd6ea", eye: 1.32, lip: 1.12, cheek: 0.9, nose: 0.88, brow: 1.08, body: 0.16, glow: 0.3, vignette: 0.1 },
  { key: "fusiinos", label: "Fusi Wajah Inos", filterCss: "saturate(1.15) contrast(1.02)", white: 0.24, tint: "#fff4f0", eye: 1.28, lip: 1.18, cheek: 0.9, nose: 0.88, brow: 1.06, body: 0.2, glow: 0.26, vignette: 0.12 },
  { key: "bw", label: "B&W", filterCss: "grayscale(1) contrast(1.1)", white: 0, tint: "#ffffff", eye: 1, lip: 1, body: 0, glow: 0, vignette: 0 },
];

export function CameraCapture({
  onCapture, onClose,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<HTMLCanvasElement | null>(null);
  const fbufRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lmRef = useRef<FaceLandmarker | null>(null);
  const segRef = useRef<ImageSegmenter | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLCanvasElement | null>(null);
  const facesRef = useRef<any[]>([]);
  const rafRef = useRef(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [filter, setFilter] = useState("beautyfilter");
  const [bright, setBright] = useState(1);
  const [shot, setShot] = useState<string | null>(null);
  const [galleryImg, setGalleryImg] = useState<string | null>(null);
  const [camError, setCamError] = useState(false);

  const flt = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const filterRef = useRef(flt); filterRef.current = flt;
  const brightRef = useRef(bright); brightRef.current = bright;
  const galleryRef = useRef<string | null>(galleryImg); galleryRef.current = galleryImg;
  const shotRef = useRef<string | null>(shot); shotRef.current = shot;
  const facingRef = useRef(facing); facingRef.current = facing;

  // model wajah + segmentasi badan
  useEffect(() => {
    getFaceLandmarker().then((lm) => { lmRef.current = lm; });
    getSelfieSegmenter().then((s) => { segRef.current = s; });
  }, []);

  // kamera
  useEffect(() => {
    if (shot || galleryImg) return;
    let cancelled = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}); }
        setCamError(false);
      })
      .catch(() => setCamError(true));
    return () => { cancelled = true; };
  }, [facing, shot, galleryImg]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  // muat gambar galeri
  useEffect(() => {
    if (!galleryImg) { imgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imgRef.current = img; };
    img.src = galleryImg;
  }, [galleryImg]);

  // loop render kanvas (preview = hasil)
  useEffect(() => {
    if (!bufRef.current) bufRef.current = document.createElement("canvas");
    if (!fbufRef.current) fbufRef.current = document.createElement("canvas");
    if (!maskCanvasRef.current) maskCanvasRef.current = document.createElement("canvas");
    if (!layerRef.current) layerRef.current = document.createElement("canvas");
    let lastDetect = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (shotRef.current) return;
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext("2d"); if (!ctx) return;
      const gal = galleryRef.current;
      const img = imgRef.current, v = videoRef.current;
      const useImg = !!gal && !!img && img.complete && img.naturalWidth > 0;
      const source: CanvasImageSource | null = useImg ? img : (v && v.videoWidth ? v : null);
      if (!source) return;
      const W = useImg ? img!.naturalWidth : v!.videoWidth;
      const H = useImg ? img!.naturalHeight : v!.videoHeight;
      if (c.width !== W) { c.width = W; c.height = H; }
      const f = filterRef.current;
      const css = ((f.filterCss === "none" ? "" : f.filterCss) + (brightRef.current !== 1 ? ` brightness(${brightRef.current})` : "")).trim() || "none";
      const now = performance.now();
      const fresh = now - lastDetect > 55;
      if (fresh) lastDetect = now;
      // deteksi wajah
      const lm = lmRef.current;
      if (lm && fresh) { try { facesRef.current = (lm.detectForVideo(source as HTMLVideoElement, now).faceLandmarks ?? []) as any[]; } catch { /* */ } }
      // segmentasi badan (mask orang)
      const seg = segRef.current;
      if (seg && fresh && (f.body ?? 0) > 0) {
        try {
          const res = seg.segmentForVideo(source as HTMLVideoElement, now);
          const mask = res.confidenceMasks?.[0];
          if (mask) fillMaskCanvas(mask as any, maskCanvasRef.current!);
          res.close?.();
        } catch { /* */ }
      }
      renderBeauty(ctx, c, source, W, H, facesRef.current, { ...f, filterCss: css, makeup: MAKEUP[f.key] }, bufRef.current!, fbufRef.current!, maskCanvasRef.current, layerRef.current);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function snapshot(): string | null {
    const c = canvasRef.current; if (!c || !c.width) return null;
    const mirror = !galleryImg && facing === "user";
    const out = document.createElement("canvas");
    out.width = c.width; out.height = c.height;
    const octx = out.getContext("2d"); if (!octx) return null;
    if (mirror) { octx.translate(out.width, 0); octx.scale(-1, 1); }
    octx.drawImage(c, 0, 0);
    return out.toDataURL("image/jpeg", 0.92);
  }

  function capture() { const d = snapshot(); if (d) setShot(d); }

  async function pickGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      const d = await fileToDataUrl(f);
      setGalleryImg(d);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
    e.target.value = "";
  }

  const isCam = !shot && !galleryImg;

  return (
    <div className="fixed inset-0 z-[96] flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        {shot ? (
          <img src={shot} alt="hasil" className="h-full w-full object-contain" />
        ) : camError && !galleryImg ? (
          <div className="grid h-full w-full place-items-center px-8 text-center text-white/70">
            Kamera tidak bisa diakses. Ambil dari galeri di bawah, atau izinkan kamera.
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={cn("h-full w-full", galleryImg ? "object-contain" : "object-cover")}
            style={{ transform: !galleryImg && facing === "user" ? "scaleX(-1)" : "none" }}
          />
        )}

        <button onClick={onClose} className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
          <X size={20} />
        </button>
        {isCam && !camError && (
          <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} title="Ganti kamera" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
            <SwitchCamera size={20} />
          </button>
        )}
      </div>

      {/* slider terang */}
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
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition", filter === f.key ? "bg-white text-zinc-900" : "bg-white/20 text-white hover:bg-white/30")}>
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
              <button onClick={capture} className="flex flex-col items-center gap-1 text-white">
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
