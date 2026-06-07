import { useEffect, useRef } from "react";
import type { FaceLandmarker, ImageSegmenter } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "../lib/faceLandmarker";
import { getSelfieSegmenter, fillMaskCanvas, applyBodySkin, applyBackground, applyMakeup, applyGlow, reshapeFace, needsReshape, smoothInto, tintStrength, type MakeupCfg, type ReshapeParams } from "../lib/faceFx";
import { loadGender, detectGender } from "../lib/genderDetect";
import { applyLUT } from "../lib/lut";

export type GenderMode = "auto" | "cewek" | "cowok";

type Pt = { x: number; y: number; z: number };
type XY = { x: number; y: number };

// Efek wajah (AR) — dikelompokkan sesuai kategori Effect House
export const FACE_EFFECTS: { key: string; label: string; icon: string; group: string }[] = [
  { key: "none", label: "Tanpa", icon: "🚫", group: "" },
  // 3D Object / Topeng (kategori 5)
  { key: "pinkglass", label: "Pink Glass", icon: "🩷", group: "Topeng/3D" },
  { key: "barbieglass", label: "Barbie Glass", icon: "⭐", group: "Topeng/3D" },
  { key: "bandopink", label: "Bando Pink", icon: "🎀", group: "Topeng/3D" },
  { key: "butterflypink", label: "Butterfly Pink", icon: "🦋", group: "Topeng/3D" },
  { key: "revefairycap", label: "Reve Fairy Cap", icon: "🧚", group: "Topeng/3D" },
  { key: "tramp", label: "Tramp", icon: "🎩", group: "Topeng/3D" },
  // Distortion / Lucu (kategori 7)
  { key: "fusiinos1206", label: "Fusi Inos 1206", icon: "✨", group: "Distorsi" },
  { key: "matagede", label: "Mata Gede", icon: "👁️", group: "Distorsi" },
  { key: "balon", label: "Kepala Balon", icon: "🎈", group: "Distorsi" },
  // Particle / Efek (kategori 8)
  { key: "glitter", label: "Glitter", icon: "🌟", group: "Particle" },
  { key: "bunga", label: "Bunga Jatuh", icon: "🌸", group: "Particle" },
  { key: "salju", label: "Salju", icon: "❄️", group: "Particle" },
  { key: "hati", label: "Hati Terbang", icon: "💖", group: "Particle" },
  // Aksesori Fashion (kategori 12)
  { key: "anting", label: "Anting", icon: "💎", group: "Aksesori" },
  { key: "kalung", label: "Kalung", icon: "📿", group: "Aksesori" },
  // Game / Interactive (kategori 10)
  { key: "kedipgame", label: "Kedip Skor", icon: "👁️", group: "Game" },
];

// Particle: set emoji per jenis (kategori 8). hati = naik dari bawah, lainnya jatuh.
const PARTICLE: Record<string, string[]> = {
  glitter: ["✨", "🌟", "⭐"],
  bunga: ["🌸", "🌺", "💮"],
  salju: ["❄️", "🌨️"],
  hati: ["💖", "💗", "❤️"],
};
type Particle = { x: number; y: number; vx: number; vy: number; rot: number; spin: number; fz: number; g: string };

const dist = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);

// skala kekuatan riasan (untuk intensitas/gender)
function scaleMakeup(m: MakeupCfg | undefined, k: number): MakeupCfg | undefined {
  if (!m || k <= 0.02) return undefined;
  return {
    lip: m.lip, lipA: (m.lipA ?? 0.4) * k,
    blush: m.blush, blushA: (m.blushA ?? 0.2) * k,
    shadow: m.shadow, shadowA: (m.shadowA ?? 0.22) * k,
    liner: m.liner && k > 0.3,
    brow: m.brow != null ? m.brow * k : undefined,
  };
}

export function LiveCamera({
  filterCss,
  whiteOverlay = 0,
  tint = "#ffffff",
  eyeScale = 1,
  lipScale = 1,
  cheek = 1,
  nose = 1,
  bodyStrength = 0,
  makeup,
  glow = 0,
  vignette = 0,
  genderMode = "auto",
  intensity = 1,
  background = "none",
  bgImage,
  bgVideo,
  lut,
  effect,
  facing,
  onReady,
  onError,
  onScore,
  onCanvasReady,
}: {
  filterCss: string;
  genderMode?: GenderMode;
  intensity?: number; // 0..1.5 kekuatan keseluruhan beauty
  background?: string; // none|blur|hologram|studio|image|video
  bgImage?: string | null; // dataURL latar custom (mode image)
  bgVideo?: string | null; // objectURL video latar (mode video)
  lut?: string | null; // color grading LUT (nama dari lib/lut.ts)
  onScore?: (n: number) => void; // skor game kedip
  onCanvasReady?: (c: HTMLCanvasElement) => void; // ekspos kanvas utk capture
  whiteOverlay?: number; // kekuatan proses kulit wajah (haluskan+cerahkan+tint)
  tint?: string;
  eyeScale?: number; // perbesar mata (ubah fisik)
  lipScale?: number; // berisi bibir (ubah fisik)
  cheek?: number; // <1 tiruskan pipi (slim/V-line)
  nose?: number; // <1 perkecil hidung
  bodyStrength?: number; // haluskan+cerahkan kulit seluruh badan (mask orang)
  makeup?: MakeupCfg; // riasan
  glow?: number; // bloom dreamy
  vignette?: number; // gelap tepi
  effect: string;
  facing: "user" | "environment";
  onReady?: () => void;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<HTMLCanvasElement | null>(null);
  const fbufRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lmRef = useRef<FaceLandmarker | null>(null);
  const segRef = useRef<ImageSegmenter | null>(null);
  const facesRef = useRef<Pt[][]>([]);
  const rafRef = useRef(0);
  const effRef = useRef(effect);
  const fltRef = useRef(filterCss);
  const whiteRef = useRef(whiteOverlay);
  const tintRef = useRef(tint);
  const eyeRef = useRef(eyeScale);
  const lipRef = useRef(lipScale);
  const cheekRef = useRef(cheek);
  const noseRef = useRef(nose);
  const bodyRef = useRef(bodyStrength);
  const makeupRef = useRef(makeup);
  const glowRef = useRef(glow);
  const vigRef = useRef(vignette);
  const rbufRef = useRef<HTMLCanvasElement | null>(null);
  const genderModeRef = useRef(genderMode);
  const detectedRef = useRef<"male" | "female" | null>(null);
  const intenRef = useRef(intensity);
  const bgRef = useRef(background);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const bgVidRef = useRef<HTMLVideoElement | null>(null);
  const smoothRef = useRef<Pt[][]>([]); // landmark ter-smoothing (anti-jitter)
  const particlesRef = useRef<Particle[]>([]);
  const lutRef = useRef(lut);
  const scoreRef = useRef(0);
  const blinkRef = useRef(false); // mata sedang tertutup?
  const onScoreRef = useRef(onScore);
  lutRef.current = lut; onScoreRef.current = onScore;
  effRef.current = effect; fltRef.current = filterCss; whiteRef.current = whiteOverlay;
  tintRef.current = tint; eyeRef.current = eyeScale; lipRef.current = lipScale; bodyRef.current = bodyStrength; makeupRef.current = makeup;
  glowRef.current = glow; vigRef.current = vignette; cheekRef.current = cheek; noseRef.current = nose; genderModeRef.current = genderMode; intenRef.current = intensity; bgRef.current = background;

  useEffect(() => {
    let cancelled = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}); }
        onReady?.();
      })
      .catch(() => onError?.());
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  useEffect(() => {
    getFaceLandmarker().then((lm) => { lmRef.current = lm; });
    getSelfieSegmenter().then((s) => { segRef.current = s; });
  }, []);

  // reset skor saat masuk/keluar game kedip
  useEffect(() => {
    scoreRef.current = 0; blinkRef.current = false; onScore?.(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect]);

  // muat gambar latar custom
  useEffect(() => {
    if (!bgImage) { bgImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { bgImgRef.current = img; };
    img.src = bgImage;
  }, [bgImage]);

  // muat video latar custom (loop, mute) -> latar bergerak "hidup"
  useEffect(() => {
    if (!bgVideo) { bgVidRef.current?.pause(); bgVidRef.current = null; return; }
    const vid = document.createElement("video");
    vid.src = bgVideo; vid.loop = true; vid.muted = true; vid.playsInline = true;
    vid.play().catch(() => {});
    bgVidRef.current = vid;
    return () => { vid.pause(); vid.src = ""; };
  }, [bgVideo]);

  // auto-deteksi gender (cewek/cowok) tiap ~2 detik saat mode "auto"
  useEffect(() => {
    if (genderMode !== "auto") { detectedRef.current = genderMode === "cowok" ? "male" : "female"; return; }
    let alive = true; let timer: ReturnType<typeof setInterval> | null = null;
    loadGender().then((ok) => {
      if (!ok || !alive) return;
      const tick = async () => { const v = videoRef.current; if (v) { const g = await detectGender(v); if (alive && g) detectedRef.current = g; } };
      tick(); timer = setInterval(tick, 2000);
    });
    return () => { alive = false; if (timer) clearInterval(timer); };
  }, [genderMode]);

  useEffect(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    onCanvasReady?.(c); // ekspos kanvas ke induk (untuk capture foto/video)
    if (!bufRef.current) bufRef.current = document.createElement("canvas");
    if (!maskRef.current) maskRef.current = document.createElement("canvas");
    if (!layerRef.current) layerRef.current = document.createElement("canvas");
    if (!fbufRef.current) fbufRef.current = document.createElement("canvas");
    if (!rbufRef.current) rbufRef.current = document.createElement("canvas");
    const buf = bufRef.current, fbuf = fbufRef.current;

    // perbesar bagian wajah (liquify) pakai piksel orang itu sendiri -> ubah fisik
    function magnify(cx: number, cy: number, r: number, factor: number) {
      if (r < 2 || factor <= 1.001) return;
      const dw = r * 2 * factor;
      ctx!.save();
      ctx!.beginPath(); ctx!.arc(cx, cy, r * factor * 0.95, 0, Math.PI * 2); ctx!.clip();
      ctx!.drawImage(c!, cx - r, cy - r, r * 2, r * 2, cx - dw / 2, cy - dw / 2, dw, dw);
      ctx!.restore();
    }

    // proses KULIT: haluskan + cerahkan + tint, di-blend HALUS (feather) -> tanpa bulatan
    function blendSkin(g: Geo, W: number, H: number, strength: number, color: string) {
      smoothInto(buf, v!, W, H, 1 + 0.3 * strength, 1.05);

      const pad = 1.18, fw = Math.max(8, g.rx * 2 * pad), fh = Math.max(8, g.ry * 2 * pad);
      const x0 = g.cx - fw / 2, y0 = g.cy - fh / 2;
      fbuf.width = Math.round(fw); fbuf.height = Math.round(fh);
      const fctx = fbuf.getContext("2d"); if (!fctx) return;
      fctx.clearRect(0, 0, fbuf.width, fbuf.height);
      fctx.drawImage(buf, x0, y0, fw, fh, 0, 0, fbuf.width, fbuf.height); // kulit halus+cerah
      // tint warna kulit (lembut) — kekuatan ikut seberapa berwarna tint (near-white tak memucatkan)
      const tA = Math.min(0.28, strength * 0.5) * tintStrength(color);
      if (tA > 0.01) { fctx.globalAlpha = tA; fctx.fillStyle = color; fctx.fillRect(0, 0, fbuf.width, fbuf.height); fctx.globalAlpha = 1; }
      // mask feather elips -> tepi memudar (tidak ada lingkaran keras)
      fctx.globalCompositeOperation = "destination-in";
      const cx2 = fbuf.width / 2, cy2 = fbuf.height / 2, rr = Math.min(cx2, cy2);
      const grd = fctx.createRadialGradient(cx2, cy2, rr * 0.1, cx2, cy2, rr);
      grd.addColorStop(0, "rgba(0,0,0,1)"); grd.addColorStop(0.6, "rgba(0,0,0,1)"); grd.addColorStop(1, "rgba(0,0,0,0)");
      fctx.save(); fctx.translate(cx2, cy2); fctx.scale(1, fbuf.height / fbuf.width); fctx.translate(-cx2, -cy2);
      fctx.fillStyle = grd; fctx.fillRect(0, 0, fbuf.width, fbuf.height); fctx.restore();
      fctx.globalCompositeOperation = "source-over";
      // tempel ke wajah
      ctx!.globalAlpha = Math.min(0.92, 0.62 + 0.38 * strength);
      ctx!.drawImage(fbuf, x0, y0, fw, fh);
      ctx!.globalAlpha = 1;
    }

    // ubah fisik: mata besar + bibir berisi
    function ellipse(x: number, y: number, rx: number, ry: number, a: number, fill: string) { ctx!.fillStyle = fill; ctx!.beginPath(); ctx!.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); ctx!.fill(); }
    function heartPath(cx: number, cy: number, s: number) { ctx!.beginPath(); ctx!.moveTo(cx, cy + s * 0.35); ctx!.bezierCurveTo(cx + s, cy - s * 0.5, cx + s * 0.55, cy - s, cx, cy - s * 0.35); ctx!.bezierCurveTo(cx - s * 0.55, cy - s, cx - s, cy - s * 0.5, cx, cy + s * 0.35); ctx!.closePath(); }
    function starPath(cx: number, cy: number, r: number) { ctx!.beginPath(); for (let i = 0; i < 10; i++) { const rad = i % 2 === 0 ? r : r * 0.45; const a = (Math.PI / 5) * i - Math.PI / 2; const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad; i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y); } ctx!.closePath(); }

    function drawEffect(g: Geo) {
      const k = effRef.current;
      const { angle, faceW, nose, mouth, head, lEyeC, rEyeC, eyeR } = g;
      const rot = (fn: () => void, at: XY, a = angle) => { ctx!.save(); ctx!.translate(at.x, at.y); ctx!.rotate(a); fn(); ctx!.restore(); };

      if (k === "pinkglass") {
        for (const e of [lEyeC, rEyeC]) { ctx!.lineWidth = eyeR * 0.18; ctx!.strokeStyle = "#ff4fa3"; ellipse(e.x, e.y, eyeR * 1.2, eyeR * 1.0, angle, "rgba(255,90,170,0.38)"); ctx!.beginPath(); ctx!.ellipse(e.x, e.y, eyeR * 1.2, eyeR * 1.0, angle, 0, Math.PI * 2); ctx!.stroke(); }
        rot(() => { ctx!.strokeStyle = "#ff4fa3"; ctx!.lineWidth = eyeR * 0.16; ctx!.beginPath(); ctx!.moveTo(-(dist(lEyeC, rEyeC) / 2 - eyeR), 0); ctx!.lineTo(dist(lEyeC, rEyeC) / 2 - eyeR, 0); ctx!.stroke(); }, { x: (lEyeC.x + rEyeC.x) / 2, y: (lEyeC.y + rEyeC.y) / 2 });
        return;
      }
      if (k === "barbieglass") { for (const e of [lEyeC, rEyeC]) { ctx!.fillStyle = "rgba(255,105,180,0.45)"; heartPath(e.x, e.y, eyeR * 1.3); ctx!.fill(); ctx!.lineWidth = eyeR * 0.16; ctx!.strokeStyle = "#ff2e88"; ctx!.stroke(); } return; }
      if (k === "bandopink") {
        rot(() => {
          ctx!.strokeStyle = "#ff5fa8"; ctx!.lineWidth = faceW * 0.13; ctx!.lineCap = "round";
          ctx!.beginPath(); ctx!.arc(0, -faceW * 0.02, faceW * 0.56, Math.PI * 1.12, Math.PI * 1.88); ctx!.stroke();
          ctx!.fillStyle = "#ff4fa3"; const bx = faceW * 0.5, by = -faceW * 0.32;
          ctx!.beginPath(); ctx!.moveTo(bx, by); ctx!.lineTo(bx + faceW * 0.18, by - faceW * 0.12); ctx!.lineTo(bx + faceW * 0.18, by + faceW * 0.12); ctx!.closePath(); ctx!.fill();
          ctx!.beginPath(); ctx!.moveTo(bx, by); ctx!.lineTo(bx + faceW * 0.34, by - faceW * 0.12); ctx!.lineTo(bx + faceW * 0.34, by + faceW * 0.12); ctx!.closePath(); ctx!.fill();
          ctx!.fillStyle = "#ff8ec5"; ctx!.beginPath(); ctx!.arc(bx + faceW * 0.17, by, faceW * 0.05, 0, Math.PI * 2); ctx!.fill();
        }, head); return;
      }
      if (k === "butterflypink") {
        rot(() => { const s = faceW * 0.22; for (const sg of [-1, 1]) { ellipse(sg * s * 0.7, -faceW * 0.5, s * 0.7, s * 0.55, sg * 0.4, "rgba(255,120,190,0.85)"); ellipse(sg * s * 0.8, -faceW * 0.36, s * 0.5, s * 0.4, sg * -0.3, "rgba(255,170,215,0.85)"); } ctx!.fillStyle = "#d12f7e"; ctx!.fillRect(-s * 0.06, -faceW * 0.6, s * 0.12, s); }, head); return;
      }
      if (k === "revefairycap") {
        rot(() => { const w = faceW * 0.85; ctx!.fillStyle = "#ffd1ec"; ctx!.beginPath(); ctx!.moveTo(-w / 2, -faceW * 0.34); ctx!.lineTo(-w / 4, -faceW * 0.66); ctx!.lineTo(0, -faceW * 0.4); ctx!.lineTo(w / 4, -faceW * 0.66); ctx!.lineTo(w / 2, -faceW * 0.34); ctx!.closePath(); ctx!.fill(); ctx!.fillStyle = "#ff7ac0"; ctx!.beginPath(); ctx!.arc(0, -faceW * 0.45, faceW * 0.05, 0, Math.PI * 2); ctx!.fill(); }, head);
        ctx!.fillStyle = "rgba(255,255,255,0.95)"; for (const [dx, dy, r] of [[-0.5, -0.5, 0.05], [0.55, -0.4, 0.04], [0.3, -0.7, 0.035]] as const) { starPath(nose.x + faceW * dx, nose.y + faceW * dy, faceW * r); ctx!.fill(); }
        return;
      }
      if (k === "tramp") {
        rot(() => { ctx!.fillStyle = "#1a1a1a"; ctx!.beginPath(); ctx!.ellipse(0, -faceW * 0.4, faceW * 0.55, faceW * 0.12, 0, 0, Math.PI * 2); ctx!.fill(); ctx!.beginPath(); ctx!.ellipse(0, -faceW * 0.5, faceW * 0.34, faceW * 0.28, 0, Math.PI, Math.PI * 2); ctx!.fill(); ctx!.fillRect(-faceW * 0.34, -faceW * 0.5, faceW * 0.68, faceW * 0.1); }, head);
        ctx!.fillStyle = "#111"; for (const sg of [-1, 1]) { ctx!.beginPath(); ctx!.ellipse(nose.x + sg * faceW * 0.08, nose.y + faceW * 0.12, faceW * 0.1, faceW * 0.05, sg * 0.3, 0, Math.PI * 2); ctx!.fill(); }
        return;
      }
      if (k === "fusiinos1206") { magnify(lEyeC.x, lEyeC.y, eyeR, 1.5); magnify(rEyeC.x, rEyeC.y, eyeR, 1.5); magnify(mouth.x, mouth.y, faceW * 0.22, 1.3); return; }
      if (k === "matagede") { magnify(lEyeC.x, lEyeC.y, eyeR, 1.85); magnify(rEyeC.x, rEyeC.y, eyeR, 1.85); return; }
      if (k === "balon") { magnify(nose.x, nose.y, faceW * 0.62, 1.5); return; }
      // Aksesori Fashion (kategori 12): anting di telinga (234/454), kalung di bawah dagu (152)
      if (k === "anting") {
        for (const e of [g.earR, g.earL]) {
          const x = e.x, y = e.y + faceW * 0.04, gy = y + faceW * 0.15;
          ctx!.strokeStyle = "#ffd86b"; ctx!.lineWidth = faceW * 0.012;
          ctx!.beginPath(); ctx!.moveTo(x, y); ctx!.lineTo(x, gy - faceW * 0.05); ctx!.stroke();
          const grd = ctx!.createRadialGradient(x - faceW * 0.012, gy - faceW * 0.012, 0, x, gy, faceW * 0.055);
          grd.addColorStop(0, "#ffffff"); grd.addColorStop(0.4, "#7fe9ff"); grd.addColorStop(1, "#1aa0d0");
          ctx!.fillStyle = grd; ctx!.beginPath(); ctx!.arc(x, gy, faceW * 0.05, 0, Math.PI * 2); ctx!.fill();
          ctx!.strokeStyle = "rgba(255,255,255,0.85)"; ctx!.lineWidth = faceW * 0.006; ctx!.stroke();
        }
        return;
      }
      if (k === "kalung") {
        const cx2 = g.chin.x, cy2 = g.chin.y + faceW * 0.18;
        ctx!.strokeStyle = "#ffd86b"; ctx!.lineWidth = faceW * 0.022; ctx!.lineCap = "round";
        ctx!.beginPath(); ctx!.arc(cx2, cy2 - faceW * 0.16, faceW * 0.46, Math.PI * 0.22, Math.PI * 0.78); ctx!.stroke();
        const py = cy2 + faceW * 0.16;
        const grd = ctx!.createRadialGradient(cx2, py - faceW * 0.03, 0, cx2, py, faceW * 0.1);
        grd.addColorStop(0, "#ffffff"); grd.addColorStop(0.4, "#ff9ed6"); grd.addColorStop(1, "#d0247f");
        ctx!.fillStyle = grd; heartPath(cx2, py, faceW * 0.1); ctx!.fill();
        return;
      }
    }

    // Burst perayaan (game kedip): hamburkan partikel dari satu titik.
    function burst(cx: number, cy: number, W: number) {
      const set = ["💖", "⭐", "✨", "🎉", "🌟"];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4, sp = (0.5 + Math.random() * 0.9) * W * 0.012;
        particlesRef.current.push({
          x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - W * 0.004,
          rot: Math.random() * 6, spin: (Math.random() - 0.5) * 0.22,
          fz: W * (0.04 + Math.random() * 0.03), g: set[(Math.random() * set.length) | 0],
        });
      }
    }

    // Particle layer (kategori 8 & burst game): jatuh/terbang, di-update tiap frame.
    function stepParticles(W: number, H: number, spawn: boolean) {
      const kind = effRef.current;
      const set = PARTICLE[kind];
      const isGame = kind === "kedipgame";
      const ps = particlesRef.current;
      if (!set && !isGame) { if (ps.length) particlesRef.current = []; return; }
      const rise = kind === "hati", snow = kind === "salju";
      if (set && spawn && ps.length < 70) {
        for (let i = 0; i < 2; i++) {
          ps.push({
            x: Math.random() * W, y: rise ? H + 24 : -24,
            vx: (Math.random() - 0.5) * (snow ? 0.6 : 1.2) * W * 0.004,
            vy: (rise ? -1 : 1) * (0.4 + Math.random() * 0.8) * H * 0.006,
            rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.12,
            fz: W * (0.035 + Math.random() * 0.03), g: set[(Math.random() * set.length) | 0],
          });
        }
      }
      ctx!.save(); ctx!.textAlign = "center"; ctx!.textBaseline = "middle";
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.x += p.vx; p.y += p.vy; p.rot += p.spin;
        if (!snow) p.vy += H * 0.00018; // gravitasi (salju melayang)
        if (p.y > H + 48 || p.y < -48) { ps.splice(i, 1); continue; }
        ctx!.save(); ctx!.translate(p.x, p.y); ctx!.rotate(p.rot);
        ctx!.font = `${p.fz}px serif`; ctx!.fillText(p.g, 0, 0); ctx!.restore();
      }
      ctx!.restore();
    }

    interface Geo { angle: number; faceW: number; nose: XY; mouth: XY; head: XY; lEyeC: XY; rEyeC: XY; eyeR: number; earR: XY; earL: XY; chin: XY; cx: number; cy: number; rx: number; ry: number; }
    function geoOf(lm: Pt[], W: number, H: number): Geo {
      const P = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H });
      const eR = P(33), eL = P(263);
      const angle = Math.atan2(eL.y - eR.y, eL.x - eR.x);
      const left = P(234), right = P(454), top = P(10), bottom = P(152);
      const faceW = dist(left, right) || dist(eR, eL) * 2.5;
      const rEyeC = { x: (P(33).x + P(133).x) / 2, y: (P(33).y + P(133).y) / 2 };
      const lEyeC = { x: (P(263).x + P(362).x) / 2, y: (P(263).y + P(362).y) / 2 };
      const eyeR = Math.max(dist(P(33), P(133)), dist(P(263), P(362))) * 0.6;
      const mouth = { x: (P(13).x + P(14).x) / 2, y: (P(13).y + P(14).y) / 2 };
      const head = { x: top.x, y: top.y - faceW * 0.05 };
      const cx = (left.x + right.x) / 2, cy = (top.y + bottom.y) / 2;
      const rx = (dist(left, right) / 2) * 1.1, ry = (dist(top, bottom) / 2) * 1.15;
      return { angle, faceW, nose: P(1), mouth, head, lEyeC, rEyeC, eyeR, earR: left, earL: right, chin: bottom, cx, cy, rx, ry };
    }

    let lastDetect = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!v.videoWidth) return;
      if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
      const W = c.width, H = c.height;
      ctx.filter = fltRef.current || "none";
      ctx.drawImage(v, 0, 0, W, H);
      ctx.filter = "none";

      const now = performance.now();
      const fresh = now - lastDetect > 45;
      if (fresh) lastDetect = now;

      // gender -> femaleness (1=cewek penuh, 0=cowok natural) + intensitas keseluruhan
      const gm = genderModeRef.current;
      const fem = gm === "cewek" ? 1 : gm === "cowok" ? 0 : (detectedRef.current === "male" ? 0 : 1);
      const I = intenRef.current;

      // segmentasi orang (untuk ganti Background &/atau kulit badan)
      const needSeg = bgRef.current !== "none" || (bodyRef.current > 0 && I > 0.02);
      if (needSeg) {
        const seg = segRef.current;
        if (seg && fresh) {
          try {
            const res = seg.segmentForVideo(v, now);
            const mask = res.confidenceMasks?.[0];
            if (mask) fillMaskCanvas(mask as unknown as { width: number; height: number; getAsFloat32Array(): Float32Array; close?: () => void }, maskRef.current!);
            (res as { close?: () => void }).close?.();
          } catch { /* */ }
        }
      }
      const haveMask = !!maskRef.current && maskRef.current.width > 0;
      // 0) ganti latar (Background) — termasuk foto & video custom
      if (bgRef.current !== "none" && haveMask) {
        let mode = bgRef.current; let bgSrc: CanvasImageSource | null = null, bw = 0, bh = 0;
        if (bgRef.current === "image") { const bi = bgImgRef.current; bgSrc = bi; bw = bi?.naturalWidth || 0; bh = bi?.naturalHeight || 0; }
        else if (bgRef.current === "video") {
          const vd = bgVidRef.current;
          if (vd && vd.readyState >= 2 && vd.videoWidth) { mode = "image"; bgSrc = vd; bw = vd.videoWidth; bh = vd.videoHeight; }
          else mode = "blur"; // fallback selagi video belum siap
        }
        applyBackground(ctx, v, maskRef.current!, W, H, mode, bufRef.current!, bgSrc, bw, bh);
      }
      // 1) kulit seluruh badan
      if (bodyRef.current > 0 && I > 0.02 && haveMask) {
        applyBodySkin(ctx, v, maskRef.current!, W, H, Math.min(0.6, bodyRef.current * I), tintRef.current, bufRef.current!, layerRef.current!);
      }

      const effWhite = (whiteRef.current > 0 && I > 0.02) ? Math.min(0.6, Math.max(0.04, whiteRef.current * (0.5 + 0.5 * fem) * I)) : 0;
      const effGlow = glowRef.current * (0.4 + 0.6 * fem) * I;
      const effMakeup = fem >= 0.4 ? scaleMakeup(makeupRef.current, fem * I) : undefined; // cowok: tanpa makeup
      const rp: ReshapeParams = {
        eye: 1 + (eyeRef.current - 1) * fem * I,    // cowok: tak membesarkan mata
        lip: 1 + (lipRef.current - 1) * fem * I,
        nose: 1 - (1 - noseRef.current) * (0.4 + 0.6 * fem) * I,
        slim: cheekRef.current < 1 ? (1 - cheekRef.current) * 1.4 * fem * I : 0,
        vline: cheekRef.current < 1 ? (1 - cheekRef.current) * 0.9 * fem * I : 0,
      };
      const beauty = effWhite > 0 || effMakeup != null || needsReshape(rp);
      const needFaces = effRef.current !== "none" || beauty;
      const lm = lmRef.current;
      if (needFaces && lm) {
        if (fresh) { try { facesRef.current = (lm.detectForVideo(v, now).faceLandmarks ?? []) as unknown as Pt[][]; } catch { /* */ } }
        // === SMOOTHING temporal (EMA) -> efek stabil, tak gemetar ===
        const raw = facesRef.current, sm = smoothRef.current;
        if (sm.length !== raw.length) {
          smoothRef.current = raw.map((f) => f.map((p) => ({ x: p.x, y: p.y, z: p.z })));
        } else {
          const a = 0.5; // 0..1: kecil=lebih halus/lambat, besar=lebih responsif
          for (let i = 0; i < raw.length; i++) {
            const s = sm[i], t = raw[i];
            if (!s || !t || s.length !== t.length) { sm[i] = t.map((p) => ({ x: p.x, y: p.y, z: p.z })); continue; }
            for (let j = 0; j < t.length; j++) { s[j].x += (t[j].x - s[j].x) * a; s[j].y += (t[j].y - s[j].y) * a; s[j].z += (t[j].z - s[j].z) * a; }
          }
        }
        const faces = smoothRef.current;
        // 1) kulit wajah + makeup
        for (const face of faces) {
          const g = geoOf(face, W, H);
          if (effWhite > 0) blendSkin(g, W, H, effWhite, tintRef.current);
          if (effMakeup) applyMakeup(ctx, face as unknown as { x: number; y: number }[], W, H, effMakeup, g.faceW);
        }
        // 2) mesh-warp reshape (slim/V-line, mata, hidung, bibir)
        if (faces.length && needsReshape(rp)) {
          const rb = rbufRef.current!, rctx = rb.getContext("2d");
          if (rctx) {
            rb.width = W; rb.height = H; rctx.clearRect(0, 0, W, H); rctx.drawImage(c, 0, 0, W, H);
            for (const face of faces) reshapeFace(ctx, rb, face as unknown as { x: number; y: number }[], W, H, rp);
          }
        }
        // 3) efek AR
        if (effRef.current !== "none") for (const face of faces) drawEffect(geoOf(face, W, H));
        // 4) game kedip: deteksi kedip (EAR) — pakai landmark RAW (lebih responsif utk kedip cepat)
        const fr = facesRef.current[0];
        if (effRef.current === "kedipgame" && fr) {
          const ar = (Math.abs(fr[159].y - fr[145].y) / (Math.abs(fr[33].x - fr[133].x) || 1e-6)
            + Math.abs(fr[386].y - fr[374].y) / (Math.abs(fr[362].x - fr[263].x) || 1e-6)) / 2;
          if (ar < 0.15 && !blinkRef.current) blinkRef.current = true;
          else if (ar > 0.25 && blinkRef.current) {
            blinkRef.current = false; scoreRef.current += 1; onScoreRef.current?.(scoreRef.current);
            const g = geoOf(faces[0] ?? fr, W, H); burst(g.cx, g.cy, W);
          }
        }
      }
      if (effGlow > 0 || vigRef.current > 0) applyGlow(ctx, c, W, H, bufRef.current!, effGlow, vigRef.current);
      // grade LUT sinematik (lapisan akhir, sebelum partikel)
      const ln = lutRef.current;
      if (ln) { const gcv = applyLUT(c, W, H, ln, 0.92); if (gcv) ctx.drawImage(gcv, 0, 0, W, H); }
      stepParticles(W, H, fresh); // particle/burst di lapisan paling atas
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="h-full w-full object-cover" style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }} />
    </>
  );
}
