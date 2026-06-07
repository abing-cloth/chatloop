// Efek wajah bersama (dipakai kamera foto/story): proses kulit + ubah fisik wajah.
import { getFaceLandmarker } from "./faceLandmarker";
import { getSelfieSegmenter } from "./selfieSegmenter";
import { reshapeFace, needsReshape, type ReshapeParams } from "./meshWarp";
import { bilateral } from "./bilateral";
import { applyLUT } from "./lut";
export { getSelfieSegmenter, reshapeFace, needsReshape, type ReshapeParams };

/** Isi buf dgn versi `source` yang dihaluskan (bilateral GLSL; fallback Gaussian) + brightness/saturate. */
export function smoothInto(buf: HTMLCanvasElement, source: CanvasImageSource, W: number, H: number, bright: number, sat: number) {
  const bctx = buf.getContext("2d"); if (!bctx) return;
  buf.width = W; buf.height = H;
  const b = bilateral(source as TexImageSource, W, H, 0.13);
  bctx.clearRect(0, 0, W, H);
  if (b) { bctx.filter = `brightness(${bright.toFixed(3)}) saturate(${sat})`; bctx.drawImage(b, 0, 0, W, H); bctx.filter = "none"; }
  else { bctx.filter = `blur(${Math.max(3, W * 0.007)}px) brightness(${bright.toFixed(3)}) saturate(${sat})`; bctx.drawImage(source, 0, 0, W, H); bctx.filter = "none"; }
}

export interface MakeupCfg {
  lip?: string; lipA?: number;       // lipstik warna + opacity
  blush?: string; blushA?: number;   // blush pipi
  shadow?: string; shadowA?: number; // eyeshadow
  liner?: boolean;                   // eyeliner
  brow?: number;                     // pertegas alis (opacity)
}

export interface BeautyFx {
  filterCss: string;
  white: number;   // kekuatan proses kulit (wajah)
  tint: string;    // warna kulit
  eye: number;     // >1 perbesar mata
  lip: number;     // >1 bibir berisi
  cheek?: number;  // <1 tiruskan pipi
  nose?: number;   // <1 perkecil hidung
  brow?: number;   // >1 pertegas alis (reshape)
  body?: number;   // kekuatan haluskan+cerahkan kulit SELURUH badan (mask orang)
  makeup?: MakeupCfg; // riasan
  glow?: number;   // bloom cahaya dreamy (0-1)
  vignette?: number; // gelap di tepi (0-1)
  lut?: string;    // color grading LUT (nama dari lib/lut.ts) — grade sinematik
}

interface MPMask { width: number; height: number; getAsFloat32Array(): Float32Array; close?: () => void }

/** Isi maskCanvas dgn alpha = probabilitas piksel orang (badan), lalu tutup mask. */
export function fillMaskCanvas(mask: MPMask, maskCanvas: HTMLCanvasElement) {
  const w = mask.width, h = mask.height;
  const arr = mask.getAsFloat32Array();
  maskCanvas.width = w; maskCanvas.height = h;
  const mctx = maskCanvas.getContext("2d"); if (!mctx) { mask.close?.(); return; }
  const img = mctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    d[i * 4] = 255; d[i * 4 + 1] = 255; d[i * 4 + 2] = 255;
    d[i * 4 + 3] = a > 0.35 ? Math.round(Math.min(1, a) * 255) : 0;
  }
  mctx.putImageData(img, 0, 0);
  mask.close?.();
}

/** Haluskan + cerahkan kulit SELURUH badan memakai mask orang (badan + wajah). */
export function applyBodySkin(
  ctx: CanvasRenderingContext2D, source: CanvasImageSource, maskCanvas: HTMLCanvasElement,
  W: number, H: number, strength: number, color: string, buf: HTMLCanvasElement, layer: HTMLCanvasElement,
) {
  smoothInto(buf, source, W, H, 1 + 0.22 * strength, 1.04);
  const lctx = layer.getContext("2d"); if (!lctx) return;
  layer.width = W; layer.height = H;
  lctx.clearRect(0, 0, W, H);
  lctx.drawImage(buf, 0, 0, W, H);
  const tA = 0.22 * tintStrength(color);
  if (tA > 0.01) {
    lctx.globalCompositeOperation = "source-atop"; lctx.globalAlpha = tA; lctx.fillStyle = color;
    lctx.fillRect(0, 0, W, H); lctx.globalAlpha = 1; lctx.globalCompositeOperation = "source-over";
  }
  lctx.globalCompositeOperation = "destination-in";
  lctx.imageSmoothingEnabled = true;
  lctx.drawImage(maskCanvas, 0, 0, W, H); // skala mask (256) -> WxH, tepi lembut
  lctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = Math.min(0.85, 0.5 + 0.4 * strength);
  ctx.drawImage(layer, 0, 0, W, H);
  ctx.globalAlpha = 1;
}

// gambar `img` menutupi WxH (cover-fit)
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, iw: number, ih: number, W: number, H: number) {
  const s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

// ── Latar bawaan (digambar prosedural, di-cache per ukuran biar hemat) ──
export const SCENE_BG = ["bokeh", "beach", "sunset", "nature"] as const;
let _scene: HTMLCanvasElement | null = null;
let _sceneKey = "";
// pseudo-acak deterministik (mulberry32) -> bokeh tak berkedip antar frame
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function vGrad(g: CanvasRenderingContext2D, W: number, H: number, stops: [number, string][]) {
  const lg = g.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of stops) lg.addColorStop(o, c);
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
}
function sceneBg(mode: string, W: number, H: number): HTMLCanvasElement {
  const key = `${mode}@${W}x${H}`;
  if (_scene && _sceneKey === key) return _scene;
  const cv = _scene ?? (_scene = document.createElement("canvas"));
  cv.width = W; cv.height = H; _sceneKey = key;
  const g = cv.getContext("2d")!; const S = Math.min(W, H);
  if (mode === "bokeh") {
    vGrad(g, W, H, [[0, "#241433"], [0.55, "#160d28"], [1, "#0a0613"]]);
    const cols = ["#ff7ac0", "#ffd27a", "#7adfff", "#b58cff", "#ff9a8c"];
    const r = rng(7);
    for (let i = 0; i < 46; i++) {
      const x = r() * W, y = r() * H, rad = S * (0.03 + r() * 0.1), c = cols[(r() * cols.length) | 0];
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, hexA(c, 0.5 + r() * 0.3)); rg.addColorStop(0.7, hexA(c, 0.12)); rg.addColorStop(1, hexA(c, 0));
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
  } else if (mode === "beach") {
    vGrad(g, W, H, [[0, "#aee3ff"], [0.5, "#dff4ff"], [0.62, "#5cc2e0"], [0.74, "#3ba6cf"], [0.75, "#f4e4b8"], [1, "#e8cf92"]]);
    const sun = g.createRadialGradient(W * 0.74, H * 0.2, 0, W * 0.74, H * 0.2, S * 0.22);
    sun.addColorStop(0, "rgba(255,250,220,0.95)"); sun.addColorStop(1, "rgba(255,250,220,0)");
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
  } else if (mode === "sunset") {
    vGrad(g, W, H, [[0, "#3a1c6b"], [0.35, "#b5478f"], [0.6, "#ff8a5c"], [0.8, "#ffc56b"], [1, "#ffe3a6"]]);
    const sun = g.createRadialGradient(W * 0.5, H * 0.7, 0, W * 0.5, H * 0.7, S * 0.4);
    sun.addColorStop(0, "rgba(255,240,200,0.85)"); sun.addColorStop(1, "rgba(255,240,200,0)");
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
  } else if (mode === "nature") {
    vGrad(g, W, H, [[0, "#d7f0c8"], [0.5, "#a6d68a"], [1, "#5f9e58"]]);
    const r = rng(11);
    g.filter = `blur(${S * 0.04}px)`;
    for (let i = 0; i < 14; i++) {
      const x = r() * W, y = H * (0.3 + r() * 0.7), rad = S * (0.08 + r() * 0.12);
      g.fillStyle = hexA(r() > 0.5 ? "#6fae5c" : "#cfe8a8", 0.5);
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
    g.filter = "none";
  }
  return cv;
}

/** Ganti latar (Background): orang dipertahankan via mask, latar diganti. mode: blur/studio/hologram/image. */
export function applyBackground(ctx: CanvasRenderingContext2D, source: CanvasImageSource, maskCanvas: HTMLCanvasElement, W: number, H: number, mode: string, buf: HTMLCanvasElement, bgImg?: CanvasImageSource | null, bgW = 0, bgH = 0) {
  const bctx = buf.getContext("2d"); if (!bctx) return;
  // layer orang (sumber di-mask)
  buf.width = W; buf.height = H;
  bctx.clearRect(0, 0, W, H);
  bctx.drawImage(source, 0, 0, W, H);
  bctx.globalCompositeOperation = "destination-in";
  bctx.drawImage(maskCanvas, 0, 0, W, H);
  bctx.globalCompositeOperation = "source-over";
  // gambar latar baru
  if (mode === "image" && bgImg && bgW && bgH) {
    drawCover(ctx, bgImg, bgW, bgH, W, H);
  } else if (mode === "image") {
    ctx.save(); ctx.filter = `blur(${Math.max(6, W * 0.03)}px)`; ctx.drawImage(source, 0, 0, W, H); ctx.filter = "none"; ctx.restore();
  } else if (mode === "blur") {
    ctx.save(); ctx.filter = `blur(${Math.max(6, W * 0.03)}px) brightness(0.92)`; ctx.drawImage(source, 0, 0, W, H); ctx.filter = "none"; ctx.restore();
  } else if (mode === "studio") {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2b2b40"); g.addColorStop(1, "#101018");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (mode === "hologram") {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0a2540"); g.addColorStop(0.5, "#1b3a6b"); g.addColorStop(1, "#3a1b6b");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(120,220,255,0.07)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  } else if ((SCENE_BG as readonly string[]).includes(mode)) {
    ctx.drawImage(sceneBg(mode, W, H), 0, 0, W, H);
  }
  // orang di atas latar
  ctx.drawImage(buf, 0, 0, W, H);
}

// ===== Makeup (riasan) =====
const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
const REYE_UP = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const LEYE_UP = [263, 466, 388, 387, 386, 385, 384, 398, 362];
const RBROW = [70, 63, 105, 66, 107];
const LBROW = [336, 296, 334, 293, 300];

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Seberapa "berwarna" tint dibanding putih (0 = putih → nyaris tak mewarnai, 1 = kuat).
 *  Mencegah tint near-white (mis. #fff5f2) memucatkan kulit saat di-overlay. */
export function tintStrength(hex: string) {
  if (!hex || hex[0] !== "#") return 0;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return Math.min(1, (255 - Math.min(r, g, b)) / 70);
}

/** Riasan: lipstik, blush, eyeshadow, eyeliner, alis — pakai 468 titik wajah. */
export function applyMakeup(ctx: CanvasRenderingContext2D, lm: XY[], W: number, H: number, m: MakeupCfg, faceW: number) {
  const P = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H });
  const path = (idx: number[]) => idx.forEach((i, k) => { const p = P(i); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
  ctx.save();
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  // lipstik (cincin bibir, evenodd -> tak mewarnai dalam mulut)
  if (m.lip) {
    ctx.beginPath(); path(LIPS_OUTER); ctx.closePath(); path(LIPS_INNER); ctx.closePath();
    ctx.fillStyle = hexA(m.lip, m.lipA ?? 0.4); ctx.fill("evenodd");
  }
  // blush pipi (gradien lembut)
  if (m.blush) {
    for (const ci of [50, 280]) {
      const c = P(ci), r = faceW * 0.2;
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
      g.addColorStop(0, hexA(m.blush, m.blushA ?? 0.2)); g.addColorStop(1, hexA(m.blush, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  // eyeshadow (gradien di atas kelopak)
  if (m.shadow) {
    for (const eye of [REYE_UP, LEYE_UP]) {
      const a = P(eye[0]), b = P(eye[eye.length - 1]);
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 - faceW * 0.03;
      const rx = (Math.hypot(b.x - a.x, b.y - a.y) * 0.6) || faceW * 0.12, ry = rx * 0.6;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      g.addColorStop(0, hexA(m.shadow, m.shadowA ?? 0.22)); g.addColorStop(1, hexA(m.shadow, 0));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.translate(-cx, -cy);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  // eyeliner (garis lash line atas)
  if (m.liner) {
    ctx.strokeStyle = "rgba(20,15,15,0.7)"; ctx.lineWidth = Math.max(1, faceW * 0.012);
    for (const eye of [REYE_UP, LEYE_UP]) { ctx.beginPath(); path(eye); ctx.stroke(); }
  }
  // alis (pertegas)
  if (m.brow) {
    ctx.strokeStyle = `rgba(70,45,30,${m.brow})`; ctx.lineWidth = faceW * 0.045;
    for (const bw of [RBROW, LBROW]) { ctx.beginPath(); path(bw); ctx.stroke(); }
  }
  ctx.restore();
}

/** Glow/finishing: bloom (sorot highlight dilembutkan) + vignette. Dipakai di akhir. */
export function applyGlow(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, W: number, H: number, buf: HTMLCanvasElement, strength: number, vignette: number) {
  if (strength > 0) {
    const bctx = buf.getContext("2d");
    if (bctx) {
      buf.width = W; buf.height = H;
      // isolasi highlight lalu lembutkan -> bloom
      bctx.filter = `brightness(1.35) contrast(1.7) blur(${Math.max(4, W * 0.02)}px)`;
      bctx.drawImage(canvas, 0, 0, W, H);
      bctx.filter = "none";
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = Math.min(0.6, strength);
      ctx.drawImage(buf, 0, 0, W, H);
      ctx.restore();
    }
  }
  if (vignette > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${vignette})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}

/** Preset riasan per filter (key sama dgn FILTERS). */
export const MAKEUP: Record<string, MakeupCfg> = {
  beautyfilter: { lip: "#d9637a", lipA: 0.32, blush: "#ff8fa3", blushA: 0.18, shadow: "#caa0b0", shadowA: 0.22, liner: true, brow: 0.18 },
  beautymouth: { lip: "#e0354f", lipA: 0.5, blush: "#ff8fb0", blushA: 0.2, liner: true, brow: 0.16 },
  blueblur: { lip: "#cf6f86", lipA: 0.3, shadow: "#9fb6e0", shadowA: 0.22, liner: true },
  dontworry: { lip: "#e07a86", lipA: 0.34, blush: "#ffb38f", blushA: 0.2 },
  overexposure: { lip: "#d98a96", lipA: 0.28, blush: "#ffd0c0", blushA: 0.16 },
  natural111: { lip: "#cf8a86", lipA: 0.26, blush: "#ffb0a0", blushA: 0.14, brow: 0.14 },
  kindofcute: { lip: "#ff5d86", lipA: 0.42, blush: "#ff7fb0", blushA: 0.26, shadow: "#ffaad0", shadowA: 0.28, liner: true, brow: 0.2 },
  fusiinos: { lip: "#d94f6e", lipA: 0.44, blush: "#ff8fa8", blushA: 0.22, shadow: "#d2a3c0", shadowA: 0.24, liner: true, brow: 0.2 },
};

type XY = { x: number; y: number };
const dist = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);

export async function detectFaces(src: CanvasImageSource & { videoWidth?: number }, ts: number) {
  const lm = await getFaceLandmarker();
  if (!lm) return [];
  try { return (lm.detectForVideo(src as HTMLVideoElement, ts).faceLandmarks ?? []) as unknown as XY[][]; }
  catch { return []; }
}

interface Geo { faceW: number; cx: number; cy: number; rx: number; ry: number; }
function geoOf(lm: XY[], W: number, H: number): Geo {
  const P = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H });
  const left = P(234), right = P(454), top = P(10), bottom = P(152);
  const faceW = dist(left, right) || dist(P(33), P(263)) * 2.5;
  const cx = (left.x + right.x) / 2, cy = (top.y + bottom.y) / 2;
  const rx = (dist(left, right) / 2) * 1.1, ry = (dist(top, bottom) / 2) * 1.15;
  return {
    faceW,
    cx, cy, rx, ry,
  };
}

function blendSkin(ctx: CanvasRenderingContext2D, source: CanvasImageSource, g: Geo, W: number, H: number, strength: number, color: string, buf: HTMLCanvasElement, fbuf: HTMLCanvasElement) {
  smoothInto(buf, source, W, H, 1 + 0.3 * strength, 1.05);
  const pad = 1.18, fw = Math.max(8, g.rx * 2 * pad), fh = Math.max(8, g.ry * 2 * pad);
  const x0 = g.cx - fw / 2, y0 = g.cy - fh / 2;
  fbuf.width = Math.round(fw); fbuf.height = Math.round(fh);
  const fctx = fbuf.getContext("2d"); if (!fctx) return;
  fctx.clearRect(0, 0, fbuf.width, fbuf.height);
  fctx.drawImage(buf, x0, y0, fw, fh, 0, 0, fbuf.width, fbuf.height);
  const tA = Math.min(0.28, strength * 0.5) * tintStrength(color);
  if (tA > 0.01) { fctx.globalAlpha = tA; fctx.fillStyle = color; fctx.fillRect(0, 0, fbuf.width, fbuf.height); fctx.globalAlpha = 1; }
  fctx.globalCompositeOperation = "destination-in";
  const cx2 = fbuf.width / 2, cy2 = fbuf.height / 2, rr = Math.min(cx2, cy2);
  const grd = fctx.createRadialGradient(cx2, cy2, rr * 0.1, cx2, cy2, rr);
  grd.addColorStop(0, "rgba(0,0,0,1)"); grd.addColorStop(0.6, "rgba(0,0,0,1)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  fctx.save(); fctx.translate(cx2, cy2); fctx.scale(1, fbuf.height / fbuf.width); fctx.translate(-cx2, -cy2);
  fctx.fillStyle = grd; fctx.fillRect(0, 0, fbuf.width, fbuf.height); fctx.restore();
  fctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = Math.min(0.92, 0.62 + 0.38 * strength);
  ctx.drawImage(fbuf, x0, y0, fw, fh);
  ctx.globalAlpha = 1;
}

/** Gambar `source` ke ctx (WxH) dgn filter, proses kulit BADAN (mask) lalu wajah + ubah fisik. */
export function renderBeauty(
  ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, source: CanvasImageSource,
  W: number, H: number, faces: XY[][], fx: BeautyFx, buf: HTMLCanvasElement, fbuf: HTMLCanvasElement,
  maskCanvas?: HTMLCanvasElement | null, layer?: HTMLCanvasElement | null,
) {
  ctx.filter = fx.filterCss || "none";
  ctx.drawImage(source, 0, 0, W, H);
  ctx.filter = "none";
  // kulit seluruh badan (mask orang) dulu
  if (maskCanvas && layer && (fx.body ?? 0) > 0 && maskCanvas.width > 0) {
    applyBodySkin(ctx, source, maskCanvas, W, H, fx.body!, fx.tint, buf, layer);
  }
  for (const lm of faces) {
    if (!lm || lm.length < 468) continue;
    const g = geoOf(lm, W, H);
    if (fx.white > 0) blendSkin(ctx, source, g, W, H, fx.white, fx.tint, buf, fbuf);
    if (fx.makeup) applyMakeup(ctx, lm, W, H, fx.makeup, g.faceW);
  }
  // ubah fisik: mesh-warp halus (slim/V-line, mata, hidung, bibir) — tanpa artefak lingkaran
  const rp: ReshapeParams = {
    eye: fx.eye, lip: fx.lip, nose: fx.nose,
    slim: fx.cheek && fx.cheek < 1 ? (1 - fx.cheek) * 1.4 : 0,
    vline: fx.cheek && fx.cheek < 1 ? (1 - fx.cheek) * 0.9 : 0,
  };
  if (faces.length && needsReshape(rp)) {
    const bctx = buf.getContext("2d");
    if (bctx) {
      buf.width = W; buf.height = H;
      bctx.clearRect(0, 0, W, H); bctx.drawImage(canvas, 0, 0, W, H);
      for (const lm of faces) if (lm && lm.length >= 468) reshapeFace(ctx, buf, lm, W, H, rp);
    }
  }
  if ((fx.glow ?? 0) > 0 || (fx.vignette ?? 0) > 0) applyGlow(ctx, canvas, W, H, buf, fx.glow ?? 0, fx.vignette ?? 0);
  if (fx.lut) { const g = applyLUT(canvas, W, H, fx.lut, 0.92); if (g) ctx.drawImage(g, 0, 0, W, H); }
}
