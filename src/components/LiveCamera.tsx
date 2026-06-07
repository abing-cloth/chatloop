import { useEffect, useRef } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "../lib/faceLandmarker";

type Pt = { x: number; y: number; z: number };
type XY = { x: number; y: number };

// daftar efek (label/icon untuk picker)
export const FACE_EFFECTS: { key: string; label: string; icon: string }[] = [
  { key: "none", label: "Tanpa", icon: "🚫" },
  { key: "kacamata", label: "Kacamata", icon: "🕶️" },
  { key: "topi", label: "Topi Koboy", icon: "🤠" },
  { key: "mahkota", label: "Mahkota", icon: "👑" },
  { key: "kucing", label: "Kucing", icon: "🐱" },
  { key: "anjing", label: "Anjing", icon: "🐶" },
  { key: "babi", label: "Babi", icon: "🐷" },
  { key: "matabesar", label: "Mata Besar", icon: "👀" },
  { key: "melotot", label: "Melotot", icon: "😳" },
  { key: "monyong", label: "Bibir Monyong", icon: "💋" },
  { key: "tongos", label: "Gigi Tongos", icon: "🦷" },
  { key: "bengkak", label: "Kepala Bengkak", icon: "🎈" },
];

const dist = (a: XY, b: XY) => Math.hypot(a.x - b.x, a.y - b.y);

export function LiveCamera({
  filterCss,
  whiteOverlay = 0,
  effect,
  facing,
  onReady,
  onError,
}: {
  filterCss: string;
  whiteOverlay?: number; // kekuatan memutihkan KULIT (area wajah saja)
  effect: string;
  facing: "user" | "environment";
  onReady?: () => void;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lmRef = useRef<FaceLandmarker | null>(null);
  const facesRef = useRef<Pt[][]>([]);
  const rafRef = useRef(0);
  const effRef = useRef(effect);
  const fltRef = useRef(filterCss);
  const whiteRef = useRef(whiteOverlay);
  effRef.current = effect;
  fltRef.current = filterCss;
  whiteRef.current = whiteOverlay;

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

  useEffect(() => { getFaceLandmarker().then((lm) => { lmRef.current = lm; }); }, []);

  useEffect(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (!bufRef.current) bufRef.current = document.createElement("canvas");
    const buf = bufRef.current;

    // ===== util =====
    // perbesar (liquify) bagian wajah memakai piksel orang itu sendiri
    function magnify(cx: number, cy: number, r: number, factor: number) {
      if (r < 2) return;
      const dw = r * 2 * factor, dh = r * 2 * factor;
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, r * factor * 0.96, 0, Math.PI * 2);
      ctx!.clip();
      ctx!.drawImage(c!, cx - r, cy - r, r * 2, r * 2, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx!.restore();
    }
    function tri(p1: XY, p2: XY, p3: XY, fill: string) {
      ctx!.fillStyle = fill;
      ctx!.beginPath(); ctx!.moveTo(p1.x, p1.y); ctx!.lineTo(p2.x, p2.y); ctx!.lineTo(p3.x, p3.y); ctx!.closePath(); ctx!.fill();
    }

    function drawEffect(g: Geo) {
      const k = effRef.current;
      const { eyeMid, angle, faceW, nose, mouth, head, lEyeC, rEyeC, eyeR, mouthW } = g;
      const rot = (fn: () => void, at: XY, a = angle) => { ctx!.save(); ctx!.translate(at.x, at.y); ctx!.rotate(a); fn(); ctx!.restore(); };

      if (k === "matabesar" || k === "melotot") {
        const f = k === "melotot" ? 1.85 : 1.55;
        magnify(lEyeC.x, lEyeC.y, eyeR, f);
        magnify(rEyeC.x, rEyeC.y, eyeR, f);
        if (k === "melotot") { drawGoogly(lEyeC, eyeR * f); drawGoogly(rEyeC, eyeR * f); }
        return;
      }
      if (k === "monyong") { magnify(mouth.x, mouth.y, mouthW * 0.62, 1.8); return; }
      if (k === "tongos") {
        magnify(mouth.x, mouth.y, mouthW * 0.6, 1.4);
        // gigi depan
        ctx!.save(); ctx!.translate(mouth.x, mouth.y + faceW * 0.04); ctx!.rotate(angle);
        const tw = faceW * 0.16, th = faceW * 0.22;
        ctx!.fillStyle = "#fffdf5"; ctx!.strokeStyle = "#d9d2bf"; ctx!.lineWidth = faceW * 0.012;
        roundRect(-tw, 0, tw * 2, th, faceW * 0.04); ctx!.fill(); ctx!.stroke();
        ctx!.beginPath(); ctx!.moveTo(0, 0); ctx!.lineTo(0, th); ctx!.stroke();
        ctx!.restore();
        return;
      }
      if (k === "bengkak") { magnify(nose.x, nose.y, faceW * 0.62, 1.5); return; }

      if (k === "kacamata") {
        ctx!.save(); ctx!.strokeStyle = "#0a0a0a"; ctx!.lineWidth = eyeR * 0.22; ctx!.fillStyle = "rgba(15,15,20,0.82)";
        for (const e of [lEyeC, rEyeC]) { ctx!.beginPath(); ctx!.ellipse(e.x, e.y, eyeR * 1.15, eyeR * 0.95, angle, 0, Math.PI * 2); ctx!.fill(); ctx!.stroke(); }
        ctx!.beginPath(); ctx!.moveTo(lEyeC.x, lEyeC.y); ctx!.lineTo(rEyeC.x, rEyeC.y); ctx!.stroke();
        ctx!.restore(); return;
      }
      if (k === "topi") {
        rot(() => {
          const w = faceW * 1.7;
          ctx!.fillStyle = "#7a4a22"; // coklat
          ctx!.beginPath(); ctx!.ellipse(0, -faceW * 0.42, w * 0.6, faceW * 0.16, 0, 0, Math.PI * 2); ctx!.fill();
          ctx!.beginPath();
          ctx!.moveTo(-w * 0.27, -faceW * 0.42);
          ctx!.quadraticCurveTo(-w * 0.3, -faceW * 0.95, 0, -faceW * 1.0);
          ctx!.quadraticCurveTo(w * 0.3, -faceW * 0.95, w * 0.27, -faceW * 0.42);
          ctx!.closePath(); ctx!.fill();
          ctx!.fillStyle = "#4a2c12"; ctx!.fillRect(-w * 0.27, -faceW * 0.56, w * 0.54, faceW * 0.08);
        }, head);
        return;
      }
      if (k === "mahkota") {
        rot(() => {
          const w = faceW * 0.9;
          ctx!.fillStyle = "#f5c518";
          ctx!.beginPath();
          ctx!.moveTo(-w / 2, -faceW * 0.35); ctx!.lineTo(-w / 2, -faceW * 0.62);
          ctx!.lineTo(-w / 4, -faceW * 0.45); ctx!.lineTo(0, -faceW * 0.72);
          ctx!.lineTo(w / 4, -faceW * 0.45); ctx!.lineTo(w / 2, -faceW * 0.62);
          ctx!.lineTo(w / 2, -faceW * 0.35); ctx!.closePath(); ctx!.fill();
        }, head);
        return;
      }
      if (k === "kucing") {
        // telinga
        rot(() => {
          const s = faceW * 0.42;
          for (const sg of [-1, 1]) {
            tri({ x: sg * s * 0.5, y: -faceW * 0.32 }, { x: sg * s * 1.15, y: -faceW * 0.95 }, { x: sg * s * 1.25, y: -faceW * 0.3 }, "#5b5b5b");
            tri({ x: sg * s * 0.62, y: -faceW * 0.36 }, { x: sg * s * 1.02, y: -faceW * 0.78 }, { x: sg * s * 1.08, y: -faceW * 0.34 }, "#f7a8c4");
          }
        }, head);
        // hidung kucing (segitiga pink)
        tri({ x: nose.x - faceW * 0.06, y: nose.y }, { x: nose.x + faceW * 0.06, y: nose.y }, { x: nose.x, y: nose.y + faceW * 0.06 }, "#ec4899");
        // kumis
        ctx!.strokeStyle = "rgba(255,255,255,0.9)"; ctx!.lineWidth = faceW * 0.012;
        for (const sg of [-1, 1]) for (const dy of [-0.03, 0.0, 0.03]) {
          ctx!.beginPath();
          ctx!.moveTo(nose.x + sg * faceW * 0.08, nose.y + faceW * dy);
          ctx!.lineTo(nose.x + sg * faceW * 0.42, nose.y + faceW * (dy * 2 - 0.01));
          ctx!.stroke();
        }
        return;
      }
      if (k === "anjing") {
        rot(() => {
          for (const sg of [-1, 1]) { ctx!.fillStyle = "#6b4423"; ctx!.beginPath(); ctx!.ellipse(sg * faceW * 0.5, -faceW * 0.1, faceW * 0.18, faceW * 0.42, sg * 0.3, 0, Math.PI * 2); ctx!.fill(); }
        }, head);
        ctx!.fillStyle = "#2b2b2b"; ctx!.beginPath(); ctx!.ellipse(nose.x, nose.y, faceW * 0.07, faceW * 0.055, 0, 0, Math.PI * 2); ctx!.fill();
        ctx!.fillStyle = "#ef4444"; roundRect(mouth.x - faceW * 0.06, mouth.y + faceW * 0.05, faceW * 0.12, faceW * 0.14, faceW * 0.05); ctx!.fill();
        return;
      }
      if (k === "babi") {
        rot(() => { for (const sg of [-1, 1]) tri({ x: sg * faceW * 0.35, y: -faceW * 0.32 }, { x: sg * faceW * 0.6, y: -faceW * 0.62 }, { x: sg * faceW * 0.62, y: -faceW * 0.3 }, "#f9a8d4"); }, head);
        ctx!.fillStyle = "#f472b6"; ctx!.beginPath(); ctx!.ellipse(nose.x, nose.y, faceW * 0.12, faceW * 0.09, 0, 0, Math.PI * 2); ctx!.fill();
        ctx!.fillStyle = "#be185d";
        ctx!.beginPath(); ctx!.ellipse(nose.x - faceW * 0.04, nose.y, faceW * 0.02, faceW * 0.035, 0, 0, Math.PI * 2); ctx!.fill();
        ctx!.beginPath(); ctx!.ellipse(nose.x + faceW * 0.04, nose.y, faceW * 0.02, faceW * 0.035, 0, 0, Math.PI * 2); ctx!.fill();
        return;
      }
      void eyeMid;
    }

    function drawGoogly(c2: XY, r: number) {
      ctx!.fillStyle = "#fff"; ctx!.beginPath(); ctx!.arc(c2.x, c2.y, r * 0.5, 0, Math.PI * 2); ctx!.fill();
      ctx!.fillStyle = "#000"; ctx!.beginPath(); ctx!.arc(c2.x, c2.y + r * 0.1, r * 0.22, 0, Math.PI * 2); ctx!.fill();
    }
    function roundRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y); ctx!.arcTo(x + w, y, x + w, y + h, r); ctx!.arcTo(x + w, y + h, x, y + h, r);
      ctx!.arcTo(x, y + h, x, y, r); ctx!.arcTo(x, y, x + w, y, r); ctx!.closePath();
    }

    interface Geo { eyeMid: XY; angle: number; faceW: number; nose: XY; mouth: XY; head: XY; lEyeC: XY; rEyeC: XY; eyeR: number; mouthW: number; cx: number; cy: number; rx: number; ry: number; }
    function geoOf(lm: Pt[], W: number, H: number): Geo {
      const P = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H });
      const eR = P(33), eL = P(263);
      const eyeMid = { x: (eR.x + eL.x) / 2, y: (eR.y + eL.y) / 2 };
      const angle = Math.atan2(eL.y - eR.y, eL.x - eR.x);
      const left = P(234), right = P(454), top = P(10), bottom = P(152);
      const faceW = dist(left, right) || dist(eR, eL) * 2.5;
      const rEyeC = { x: (P(33).x + P(133).x) / 2, y: (P(33).y + P(133).y) / 2 };
      const lEyeC = { x: (P(263).x + P(362).x) / 2, y: (P(263).y + P(362).y) / 2 };
      const eyeR = Math.max(dist(P(33), P(133)), dist(P(263), P(362))) * 0.62;
      const mouth = { x: (P(13).x + P(14).x) / 2, y: (P(13).y + P(14).y) / 2 };
      const mouthW = dist(P(61), P(291)) || faceW * 0.4;
      const head = { x: top.x, y: top.y - faceW * 0.05 };
      const cx = (left.x + right.x) / 2, cy = (top.y + bottom.y) / 2;
      const rx = (dist(left, right) / 2) * 1.12, ry = (dist(top, bottom) / 2) * 1.15;
      return { eyeMid, angle, faceW, nose: P(1), mouth, head, lEyeC, rEyeC, eyeR, mouthW, cx, cy, rx, ry };
    }

    // pemutih + penghalus KULIT (hanya area wajah)
    function beautifySkin(g: Geo, W: number, H: number, strength: number) {
      buf.width = W; buf.height = H;
      const bctx = buf.getContext("2d");
      if (!bctx) return;
      bctx.filter = `blur(${Math.max(3, W * 0.006)}px)`;
      bctx.drawImage(v!, 0, 0, W, H);
      bctx.filter = "none";
      ctx!.save();
      ctx!.beginPath(); ctx!.ellipse(g.cx, g.cy, g.rx, g.ry, 0, 0, Math.PI * 2); ctx!.clip();
      ctx!.globalAlpha = 0.55; ctx!.drawImage(buf, 0, 0); ctx!.globalAlpha = 1; // haluskan
      ctx!.fillStyle = "#fff"; ctx!.globalAlpha = Math.min(0.5, strength); ctx!.fillRect(0, 0, W, H); // putihkan kulit
      ctx!.globalAlpha = 1;
      ctx!.restore();
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

      const needFaces = effRef.current !== "none" || whiteRef.current > 0;
      const lm = lmRef.current;
      if (needFaces && lm) {
        const now = performance.now();
        if (now - lastDetect > 55) {
          lastDetect = now;
          try { facesRef.current = (lm.detectForVideo(v, now).faceLandmarks ?? []) as unknown as Pt[][]; }
          catch { /* skip */ }
        }
        for (const face of facesRef.current) {
          const g = geoOf(face, W, H);
          if (whiteRef.current > 0) beautifySkin(g, W, H, whiteRef.current);
          if (effRef.current !== "none") drawEffect(g);
        }
        // fallback putih global jika wajah tak terdeteksi
        if (whiteRef.current > 0 && facesRef.current.length === 0) {
          ctx.fillStyle = "#fff"; ctx.globalAlpha = whiteRef.current * 0.5; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        }
      } else if (whiteRef.current > 0) {
        ctx.fillStyle = "#fff"; ctx.globalAlpha = whiteRef.current * 0.5; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
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
