// Efek wajah bersama (dipakai kamera foto/story): proses kulit + ubah fisik wajah.
import { getFaceLandmarker } from "./faceLandmarker";
import { getSelfieSegmenter } from "./selfieSegmenter";
export { getSelfieSegmenter };

export interface BeautyFx {
  filterCss: string;
  white: number;   // kekuatan proses kulit (wajah)
  tint: string;    // warna kulit
  eye: number;     // >1 perbesar mata
  lip: number;     // >1 bibir berisi
  cheek?: number;  // <1 tiruskan pipi
  nose?: number;   // <1 perkecil hidung
  brow?: number;   // >1 pertegas alis
  body?: number;   // kekuatan haluskan+cerahkan kulit SELURUH badan (mask orang)
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
  const bctx = buf.getContext("2d"); if (!bctx) return;
  buf.width = W; buf.height = H;
  bctx.filter = `blur(${Math.max(2, W * 0.005)}px) brightness(${(1 + 0.22 * strength).toFixed(3)}) saturate(1.04) contrast(0.98)`;
  bctx.drawImage(source, 0, 0, W, H);
  bctx.filter = "none";
  const lctx = layer.getContext("2d"); if (!lctx) return;
  layer.width = W; layer.height = H;
  lctx.clearRect(0, 0, W, H);
  lctx.drawImage(buf, 0, 0, W, H);
  if (color.toLowerCase() !== "#ffffff") {
    lctx.globalCompositeOperation = "source-atop"; lctx.globalAlpha = 0.28; lctx.fillStyle = color;
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

type XY = { x: number; y: number };
const dist = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);

export async function detectFaces(src: CanvasImageSource & { videoWidth?: number }, ts: number) {
  const lm = await getFaceLandmarker();
  if (!lm) return [];
  try { return (lm.detectForVideo(src as HTMLVideoElement, ts).faceLandmarks ?? []) as unknown as XY[][]; }
  catch { return []; }
}

// liquify lingkaran (perbesar/perkecil bagian wajah pakai piksel sendiri)
function warp(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cx: number, cy: number, r: number, factor: number) {
  if (r < 2 || Math.abs(factor - 1) < 0.02) return;
  const dw = r * 2 * factor;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r * factor * 0.95, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(canvas, cx - r, cy - r, r * 2, r * 2, cx - dw / 2, cy - dw / 2, dw, dw);
  ctx.restore();
}

interface Geo { faceW: number; nose: XY; mouth: XY; lEyeC: XY; rEyeC: XY; lBrow: XY; rBrow: XY; lCheek: XY; rCheek: XY; eyeR: number; cx: number; cy: number; rx: number; ry: number; }
function geoOf(lm: XY[], W: number, H: number): Geo {
  const P = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H });
  const left = P(234), right = P(454), top = P(10), bottom = P(152);
  const faceW = dist(left, right) || dist(P(33), P(263)) * 2.5;
  const rEyeC = { x: (P(33).x + P(133).x) / 2, y: (P(33).y + P(133).y) / 2 };
  const lEyeC = { x: (P(263).x + P(362).x) / 2, y: (P(263).y + P(362).y) / 2 };
  const eyeR = Math.max(dist(P(33), P(133)), dist(P(263), P(362))) * 0.6;
  const mouth = { x: (P(13).x + P(14).x) / 2, y: (P(13).y + P(14).y) / 2 };
  const cx = (left.x + right.x) / 2, cy = (top.y + bottom.y) / 2;
  const rx = (dist(left, right) / 2) * 1.1, ry = (dist(top, bottom) / 2) * 1.15;
  return {
    faceW, nose: P(1), mouth, lEyeC, rEyeC, eyeR,
    lBrow: { x: lEyeC.x, y: lEyeC.y - eyeR * 1.15 },
    rBrow: { x: rEyeC.x, y: rEyeC.y - eyeR * 1.15 },
    lCheek: { x: P(330).x, y: P(330).y }, rCheek: { x: P(101).x, y: P(101).y },
    cx, cy, rx, ry,
  };
}

function blendSkin(ctx: CanvasRenderingContext2D, source: CanvasImageSource, g: Geo, W: number, H: number, strength: number, color: string, buf: HTMLCanvasElement, fbuf: HTMLCanvasElement) {
  const bctx = buf.getContext("2d"); if (!bctx) return;
  buf.width = W; buf.height = H;
  bctx.filter = `blur(${Math.max(3, W * 0.008)}px) brightness(${(1 + 0.3 * strength).toFixed(3)}) saturate(1.05) contrast(0.97)`;
  bctx.drawImage(source, 0, 0, W, H);
  bctx.filter = "none";
  const pad = 1.18, fw = Math.max(8, g.rx * 2 * pad), fh = Math.max(8, g.ry * 2 * pad);
  const x0 = g.cx - fw / 2, y0 = g.cy - fh / 2;
  fbuf.width = Math.round(fw); fbuf.height = Math.round(fh);
  const fctx = fbuf.getContext("2d"); if (!fctx) return;
  fctx.clearRect(0, 0, fbuf.width, fbuf.height);
  fctx.drawImage(buf, x0, y0, fw, fh, 0, 0, fbuf.width, fbuf.height);
  fctx.globalAlpha = color.toLowerCase() === "#ffffff" ? Math.min(0.3, strength * 0.55) : 0.4;
  fctx.fillStyle = color; fctx.fillRect(0, 0, fbuf.width, fbuf.height);
  fctx.globalAlpha = 1;
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
    // tiruskan pipi & hidung (perkecil)
    if (fx.cheek && fx.cheek < 1) { warp(ctx, canvas, g.lCheek.x, g.lCheek.y, g.faceW * 0.26, fx.cheek); warp(ctx, canvas, g.rCheek.x, g.rCheek.y, g.faceW * 0.26, fx.cheek); }
    if (fx.nose && fx.nose < 1) warp(ctx, canvas, g.nose.x, g.nose.y, g.faceW * 0.2, fx.nose);
    // pertegas alis & perbesar mata, bibir berisi
    if (fx.brow && fx.brow > 1) { warp(ctx, canvas, g.lBrow.x, g.lBrow.y, g.eyeR * 0.95, fx.brow); warp(ctx, canvas, g.rBrow.x, g.rBrow.y, g.eyeR * 0.95, fx.brow); }
    if (fx.eye > 1) { warp(ctx, canvas, g.lEyeC.x, g.lEyeC.y, g.eyeR, fx.eye); warp(ctx, canvas, g.rEyeC.x, g.rEyeC.y, g.eyeR, fx.eye); }
    if (fx.lip > 1) warp(ctx, canvas, g.mouth.x, g.mouth.y, g.faceW * 0.2, fx.lip);
  }
}
