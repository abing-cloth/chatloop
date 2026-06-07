import { useEffect, useRef } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "../lib/faceLandmarker";

type Pt = { x: number; y: number; z: number };

interface Part {
  emoji: string;
  anchor: "eyes" | "head" | "nose" | "mouth" | "face";
  scale: number;
  rotate?: boolean;
  dy?: number;
}

// efek AR yang mengikuti wajah (banyak orang sekaligus)
export const FACE_EFFECTS: { key: string; label: string; icon: string; parts: Part[] }[] = [
  { key: "none", label: "Tanpa", icon: "🚫", parts: [] },
  { key: "kacamata", label: "Kacamata", icon: "🕶️", parts: [{ emoji: "🕶️", anchor: "eyes", scale: 2.3, rotate: true }] },
  { key: "kacamata2", label: "Bulat", icon: "👓", parts: [{ emoji: "👓", anchor: "eyes", scale: 2.3, rotate: true }] },
  { key: "topi", label: "Topi Koboy", icon: "🤠", parts: [{ emoji: "🤠", anchor: "head", scale: 2.8 }] },
  { key: "mahkota", label: "Mahkota", icon: "👑", parts: [{ emoji: "👑", anchor: "head", scale: 1.9 }] },
  { key: "kucing", label: "Kucing", icon: "🐱", parts: [{ emoji: "🐱", anchor: "head", scale: 2.4 }, { emoji: "🐱", anchor: "nose", scale: 0.7 }] },
  { key: "anjing", label: "Anjing", icon: "🐶", parts: [{ emoji: "🐶", anchor: "head", scale: 2.4 }, { emoji: "👅", anchor: "mouth", scale: 1.0, dy: 0.45 }] },
  { key: "babi", label: "Babi", icon: "🐽", parts: [{ emoji: "🐷", anchor: "head", scale: 2.3 }, { emoji: "🐽", anchor: "nose", scale: 0.9 }] },
  { key: "matabesar", label: "Mata Besar", icon: "👀", parts: [{ emoji: "👀", anchor: "eyes", scale: 2.7, rotate: true }] },
  { key: "melotot", label: "Melotot", icon: "😳", parts: [{ emoji: "😳", anchor: "face", scale: 3.6 }] },
  { key: "monyong", label: "Monyong", icon: "💋", parts: [{ emoji: "💋", anchor: "mouth", scale: 1.4, dy: 0.1 }] },
  { key: "tongos", label: "Gigi Tongos", icon: "🦷", parts: [{ emoji: "🦷", anchor: "mouth", scale: 1.2, dy: 0.45 }] },
  { key: "bengkak", label: "Kepala Bengkak", icon: "🎈", parts: [{ emoji: "🫧", anchor: "head", scale: 4.5, dy: 0.3 }] },
  { key: "konyol", label: "Konyol", icon: "🤪", parts: [{ emoji: "🤪", anchor: "face", scale: 3.6 }] },
  { key: "badut", label: "Badut", icon: "🤡", parts: [{ emoji: "🔴", anchor: "nose", scale: 0.8 }, { emoji: "🤡", anchor: "head", scale: 2.4 }] },
];

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export function LiveCamera({
  filterCss,
  whiteOverlay = 0,
  effect,
  facing,
  onReady,
  onError,
}: {
  filterCss: string;
  whiteOverlay?: number;
  effect: string;
  facing: "user" | "environment";
  onReady?: () => void;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastFaces = useRef<Pt[][]>([]);
  const rafRef = useRef<number>(0);
  const effectRef = useRef(effect);
  const filterRef = useRef(filterCss);
  const whiteRef = useRef(whiteOverlay);
  effectRef.current = effect;
  filterRef.current = filterCss;
  whiteRef.current = whiteOverlay;

  // kamera
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

  // muat model wajah
  useEffect(() => {
    getFaceLandmarker().then((lm) => { landmarkerRef.current = lm; });
  }, []);

  // loop render
  useEffect(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    function drawEmoji(emoji: string, x: number, y: number, size: number, angle = 0) {
      ctx!.save();
      ctx!.translate(x, y);
      if (angle) ctx!.rotate(angle);
      ctx!.font = `${size}px serif`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText(emoji, 0, 0);
      ctx!.restore();
    }

    function drawFace(lm: Pt[], W: number, H: number) {
      const def = FACE_EFFECTS.find((e) => e.key === effectRef.current);
      if (!def || def.parts.length === 0) return;
      const P = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H });
      const eyeR = P(33), eyeL = P(263);
      const eyeMid = { x: (eyeR.x + eyeL.x) / 2, y: (eyeR.y + eyeL.y) / 2 };
      const eyeDist = dist(eyeR, eyeL) || 1;
      const angle = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x);
      const faceW = dist(P(234), P(454)) || eyeDist * 2.5;
      const nose = P(1);
      const upLip = P(13), loLip = P(14);
      const mouth = { x: (upLip.x + loLip.x) / 2, y: (upLip.y + loLip.y) / 2 };
      const head = { x: P(10).x, y: P(10).y - faceW * 0.45 };
      const faceC = { x: nose.x, y: nose.y };

      for (const part of def.parts) {
        let pos = eyeMid, base = eyeDist, rot = 0;
        if (part.anchor === "eyes") { pos = eyeMid; base = eyeDist; rot = part.rotate ? angle : 0; }
        else if (part.anchor === "head") { pos = head; base = faceW; }
        else if (part.anchor === "nose") { pos = nose; base = faceW; }
        else if (part.anchor === "mouth") { pos = mouth; base = eyeDist; }
        else if (part.anchor === "face") { pos = faceC; base = faceW; }
        const size = base * part.scale;
        const y = pos.y + (part.dy ? part.dy * faceW : 0);
        drawEmoji(part.emoji, pos.x, y, size, rot);
      }
    }

    let lastDetect = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!v.videoWidth) return;
      if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
      const W = c.width, H = c.height;
      // gambar video + filter
      ctx.filter = filterRef.current || "none";
      ctx.drawImage(v, 0, 0, W, H);
      ctx.filter = "none";
      if (whiteRef.current > 0) { ctx.fillStyle = `rgba(255,255,255,${whiteRef.current})`; ctx.fillRect(0, 0, W, H); }
      // deteksi wajah (jika ada efek)
      const lmker = landmarkerRef.current;
      if (lmker && effectRef.current !== "none") {
        const now = performance.now();
        if (now - lastDetect > 60) {
          lastDetect = now;
          try {
            const res = lmker.detectForVideo(v, now);
            lastFaces.current = (res.faceLandmarks ?? []) as unknown as Pt[][];
          } catch { /* abaikan frame */ }
        }
        for (const face of lastFaces.current) drawFace(face, W, H);
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
