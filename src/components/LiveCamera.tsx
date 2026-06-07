import { useEffect, useRef } from "react";
import type { FaceLandmarker, ImageSegmenter } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "../lib/faceLandmarker";
import { getSelfieSegmenter, fillMaskCanvas, applyBodySkin, applyMakeup, type MakeupCfg } from "../lib/faceFx";

type Pt = { x: number; y: number; z: number };
type XY = { x: number; y: number };

// Efek wajah (AR) — nama gaya filter viral
export const FACE_EFFECTS: { key: string; label: string; icon: string }[] = [
  { key: "none", label: "Tanpa", icon: "🚫" },
  { key: "pinkglass", label: "Pink Glass", icon: "🩷" },
  { key: "barbieglass", label: "Barbie Glass", icon: "⭐" },
  { key: "bandopink", label: "Bando Pink", icon: "🎀" },
  { key: "butterflypink", label: "Butterfly Pink", icon: "🦋" },
  { key: "revefairycap", label: "Reve Fairy Cap", icon: "🧚" },
  { key: "tramp", label: "Tramp", icon: "🎩" },
  { key: "fusiinos1206", label: "Fusi Inos 1206", icon: "✨" },
];

const dist = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);

export function LiveCamera({
  filterCss,
  whiteOverlay = 0,
  tint = "#ffffff",
  eyeScale = 1,
  lipScale = 1,
  bodyStrength = 0,
  makeup,
  effect,
  facing,
  onReady,
  onError,
}: {
  filterCss: string;
  whiteOverlay?: number; // kekuatan proses kulit wajah (haluskan+cerahkan+tint)
  tint?: string;
  eyeScale?: number; // perbesar mata (ubah fisik)
  lipScale?: number; // berisi bibir (ubah fisik)
  bodyStrength?: number; // haluskan+cerahkan kulit seluruh badan (mask orang)
  makeup?: MakeupCfg; // riasan
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
  const bodyRef = useRef(bodyStrength);
  const makeupRef = useRef(makeup);
  effRef.current = effect; fltRef.current = filterCss; whiteRef.current = whiteOverlay;
  tintRef.current = tint; eyeRef.current = eyeScale; lipRef.current = lipScale; bodyRef.current = bodyStrength; makeupRef.current = makeup;

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

  useEffect(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (!bufRef.current) bufRef.current = document.createElement("canvas");
    if (!maskRef.current) maskRef.current = document.createElement("canvas");
    if (!layerRef.current) layerRef.current = document.createElement("canvas");
    if (!fbufRef.current) fbufRef.current = document.createElement("canvas");
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
      const bctx = buf.getContext("2d"); if (!bctx) return;
      buf.width = W; buf.height = H;
      bctx.filter = `blur(${Math.max(3, W * 0.008)}px) brightness(${(1 + 0.3 * strength).toFixed(3)}) saturate(1.05) contrast(0.97)`;
      bctx.drawImage(v!, 0, 0, W, H);
      bctx.filter = "none";

      const pad = 1.18, fw = Math.max(8, g.rx * 2 * pad), fh = Math.max(8, g.ry * 2 * pad);
      const x0 = g.cx - fw / 2, y0 = g.cy - fh / 2;
      fbuf.width = Math.round(fw); fbuf.height = Math.round(fh);
      const fctx = fbuf.getContext("2d"); if (!fctx) return;
      fctx.clearRect(0, 0, fbuf.width, fbuf.height);
      fctx.drawImage(buf, x0, y0, fw, fh, 0, 0, fbuf.width, fbuf.height); // kulit halus+cerah
      // tint warna kulit (lembut)
      fctx.globalAlpha = color.toLowerCase() === "#ffffff" ? Math.min(0.3, strength * 0.55) : 0.4;
      fctx.fillStyle = color; fctx.fillRect(0, 0, fbuf.width, fbuf.height);
      fctx.globalAlpha = 1;
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
    function reshape(g: Geo) {
      if (eyeRef.current > 1) { magnify(g.lEyeC.x, g.lEyeC.y, g.eyeR, eyeRef.current); magnify(g.rEyeC.x, g.rEyeC.y, g.eyeR, eyeRef.current); }
      if (lipRef.current > 1) magnify(g.mouth.x, g.mouth.y, g.faceW * 0.2, lipRef.current);
    }

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
    }

    interface Geo { angle: number; faceW: number; nose: XY; mouth: XY; head: XY; lEyeC: XY; rEyeC: XY; eyeR: number; cx: number; cy: number; rx: number; ry: number; }
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
      return { angle, faceW, nose: P(1), mouth, head, lEyeC, rEyeC, eyeR, cx, cy, rx, ry };
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
      const fresh = now - lastDetect > 55;
      if (fresh) lastDetect = now;

      // kulit seluruh badan (mask orang) dulu
      if (bodyRef.current > 0) {
        const seg = segRef.current;
        if (seg && fresh) {
          try {
            const res = seg.segmentForVideo(v, now);
            const mask = res.confidenceMasks?.[0];
            if (mask) fillMaskCanvas(mask as unknown as { width: number; height: number; getAsFloat32Array(): Float32Array; close?: () => void }, maskRef.current!);
            (res as { close?: () => void }).close?.();
          } catch { /* */ }
        }
        if (maskRef.current && maskRef.current.width > 0) {
          applyBodySkin(ctx, v, maskRef.current, W, H, bodyRef.current, tintRef.current, bufRef.current!, layerRef.current!);
        }
      }

      const beauty = whiteRef.current > 0 || eyeRef.current > 1 || lipRef.current > 1;
      const needFaces = effRef.current !== "none" || beauty;
      const lm = lmRef.current;
      if (needFaces && lm) {
        if (fresh) { try { facesRef.current = (lm.detectForVideo(v, now).faceLandmarks ?? []) as unknown as Pt[][]; } catch { /* */ } }
        for (const face of facesRef.current) {
          const g = geoOf(face, W, H);
          if (whiteRef.current > 0) blendSkin(g, W, H, whiteRef.current, tintRef.current);
          if (makeupRef.current) applyMakeup(ctx, face as unknown as { x: number; y: number }[], W, H, makeupRef.current, g.faceW);
          reshape(g);
          if (effRef.current !== "none") drawEffect(g);
        }
      }
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
