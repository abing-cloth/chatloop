// Mesh-warp reshape: jaring segitiga (Delaunay) di-warp affine per segitiga.
// Halus & tanpa artefak lingkaran. Mendukung banyak wajah (mesh lokal per wajah + ring tetap).
type P = { x: number; y: number };

const OVAL = [10, 338, 332, 389, 356, 454, 361, 397, 365, 379, 378, 400, 152, 176, 150, 136, 172, 132, 93, 234, 127, 162, 21, 54, 103, 109];
const REYE = [33, 159, 158, 133, 145, 153];
const LEYE = [362, 386, 387, 263, 374, 380];
const LIPS = [61, 40, 0, 270, 291, 321, 17, 91];
const NOSE = [48, 278];
const GROUPS: { idx: number[]; kind: string }[] = [
  { idx: OVAL, kind: "oval" }, { idx: REYE, kind: "reye" }, { idx: LEYE, kind: "leye" },
  { idx: LIPS, kind: "lip" }, { idx: NOSE, kind: "nose" },
];
const RING_N = 12;

export interface ReshapeParams { slim?: number; vline?: number; eye?: number; lip?: number; nose?: number; }

let TRIS: number[][] | null = null; // triangulasi (topologi tetap) -> cache global

function circum(a: P, b: P, c: P) {
  const ax = a.x, ay = a.y, bx = b.x, by = b.y, cx = c.x, cy = c.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-9) return { x: 0, y: 0, r2: Infinity };
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const dx = ax - ux, dy = ay - uy;
  return { x: ux, y: uy, r2: dx * dx + dy * dy };
}

function triangulate(points: P[]): number[][] {
  const n = points.length;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  const dmax = Math.max(maxX - minX, maxY - minY) || 1, midx = (minX + maxX) / 2, midy = (minY + maxY) / 2;
  const v = points.slice();
  const i0 = n, i1 = n + 1, i2 = n + 2;
  v.push({ x: midx - 20 * dmax, y: midy - dmax }, { x: midx, y: midy + 20 * dmax }, { x: midx + 20 * dmax, y: midy - dmax });
  let tris: number[][] = [[i0, i1, i2]];
  for (let i = 0; i < n; i++) {
    const p = v[i];
    const edges: number[][] = [];
    tris = tris.filter((t) => {
      const cc = circum(v[t[0]], v[t[1]], v[t[2]]);
      const dx = p.x - cc.x, dy = p.y - cc.y;
      if (dx * dx + dy * dy < cc.r2) { edges.push([t[0], t[1]], [t[1], t[2]], [t[2], t[0]]); return false; }
      return true;
    });
    const uniq: number[][] = [];
    for (let a = 0; a < edges.length; a++) {
      let shared = false;
      for (let b = 0; b < edges.length; b++) {
        if (a !== b && ((edges[a][0] === edges[b][0] && edges[a][1] === edges[b][1]) || (edges[a][0] === edges[b][1] && edges[a][1] === edges[b][0]))) { shared = true; break; }
      }
      if (!shared) uniq.push(edges[a]);
    }
    for (const e of uniq) tris.push([e[0], e[1], i]);
  }
  return tris.filter((t) => t[0] < n && t[1] < n && t[2] < n);
}

function drawTri(ctx: CanvasRenderingContext2D, img: CanvasImageSource, s0: P, s1: P, s2: P, d0: P, d1: P, d2: P) {
  const denom = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
  if (Math.abs(denom) < 1e-6) return;
  // guard anti-"hancur": jangan gambar segitiga tujuan yang terbalik (orientasi flip) atau gepeng
  const ddenom = (d1.x - d0.x) * (d2.y - d0.y) - (d2.x - d0.x) * (d1.y - d0.y);
  if (Math.abs(ddenom) < 1e-6 || (ddenom > 0) !== (denom > 0)) return;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(d0.x, d0.y); ctx.lineTo(d1.x, d1.y); ctx.lineTo(d2.x, d2.y); ctx.closePath(); ctx.clip();
  const a = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / denom;
  const c = ((d2.x - d0.x) * (s1.x - s0.x) - (d1.x - d0.x) * (s2.x - s0.x)) / denom;
  const b = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / denom;
  const d = ((d2.y - d0.y) * (s1.x - s0.x) - (d1.y - d0.y) * (s2.x - s0.x)) / denom;
  const e = d0.x - a * s0.x - c * s0.y;
  const f = d0.y - b * s0.x - d * s0.y;
  ctx.setTransform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

const mid = (a: P, b: P) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Warp satu wajah dari `img` (salinan kanvas) ke ctx. */
export function reshapeFace(ctx: CanvasRenderingContext2D, img: CanvasImageSource, lm: P[], W: number, H: number, prm: ReshapeParams) {
  const Pt = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H });
  const pts: P[] = [], kinds: string[] = [];
  for (const g of GROUPS) for (const i of g.idx) { pts.push(Pt(i)); kinds.push(g.kind); }
  const ovalPts = pts.slice(0, OVAL.length);
  let cx = 0, cy = 0, top = Infinity, bot = -Infinity, left = Infinity, right = -Infinity;
  for (const p of ovalPts) { cx += p.x; cy += p.y; top = Math.min(top, p.y); bot = Math.max(bot, p.y); left = Math.min(left, p.x); right = Math.max(right, p.x); }
  cx /= ovalPts.length; cy /= ovalPts.length;
  const faceW = right - left || 1, faceH = bot - top || 1;
  // ring tetap mengelilingi wajah (batas warp -> halus, isi area kosong)
  const ringStart = pts.length;
  for (let k = 0; k < RING_N; k++) { const a = (k / RING_N) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * faceW * 0.92, y: cy + Math.sin(a) * faceH * 1.02 }); kinds.push("ring"); }
  const rEyeC = mid(Pt(33), Pt(133)), lEyeC = mid(Pt(263), Pt(362)), mouthC = mid(Pt(13), Pt(14)), noseC = Pt(1);
  // batasi kekuatan agar segitiga tak terbalik -> tak "hancur"
  const slim = Math.min(0.18, prm.slim ?? 0), vline = Math.min(0.18, prm.vline ?? 0);
  const eF = Math.min(0.22, (prm.eye ?? 1) - 1), lF = Math.min(0.22, (prm.lip ?? 1) - 1), nF = Math.min(0.22, 1 - (prm.nose ?? 1));
  const cap = faceW * 0.1; // pergeseran maks tiap titik (cegah titik melompati wajah)
  const clamp = (p: P, x: number, y: number): P => {
    let dx = x - p.x, dy = y - p.y; const m = Math.hypot(dx, dy);
    if (m > cap) { dx = dx / m * cap; dy = dy / m * cap; }
    return { x: p.x + dx, y: p.y + dy };
  };
  const dst = pts.map((p, i) => {
    const k = kinds[i];
    if (k === "oval") { const w = Math.pow(Math.max(0, (p.y - top) / faceH), 1.2); return clamp(p, p.x + (cx - p.x) * slim * w, p.y - vline * faceH * w * 0.4); }
    if (k === "reye") return clamp(p, p.x + (p.x - rEyeC.x) * eF, p.y + (p.y - rEyeC.y) * eF);
    if (k === "leye") return clamp(p, p.x + (p.x - lEyeC.x) * eF, p.y + (p.y - lEyeC.y) * eF);
    if (k === "lip") return clamp(p, p.x + (p.x - mouthC.x) * lF * 0.6, p.y + (p.y - mouthC.y) * lF);
    if (k === "nose") return clamp(p, p.x + (noseC.x - p.x) * nF, p.y + (noseC.y - p.y) * nF);
    return p; // ring tetap
  });
  void ringStart;
  if (!TRIS || TRIS.some((t) => t[0] >= pts.length || t[1] >= pts.length || t[2] >= pts.length)) TRIS = triangulate(pts);
  for (const t of TRIS) drawTri(ctx, img, pts[t[0]], pts[t[1]], pts[t[2]], dst[t[0]], dst[t[1]], dst[t[2]]);
}

/** Perlu reshape? */
export function needsReshape(prm: ReshapeParams) {
  return (prm.eye ?? 1) > 1.001 || (prm.lip ?? 1) > 1.001 || (prm.slim ?? 0) > 0.001 || (prm.nose ?? 1) < 0.999;
}
