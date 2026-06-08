// Topeng 3D asli dengan three.js — objek 3D bercahaya yang menempel di wajah &
// BERPUTAR mengikuti pose kepala (orientasi dari basis 3D landmark x/y/z).
// Lazy-load three (chunk terpisah). NO-OP sampai three termuat.
/* eslint-disable @typescript-eslint/no-explicit-any */

type XYZ = { x: number; y: number; z?: number };

let THREE: any = null;
let renderer: any, scene: any, camera: any, group: any;
let ready = false, loading = false;
const geo: Record<string, any> = {};
const mat: Record<string, any> = {};
const G = (k: string, make: () => any) => (geo[k] ??= make());
const M = (k: string, make: () => any) => (mat[k] ??= make());

async function ensure() {
  if (ready || loading) return;
  loading = true;
  try {
    THREE = await import("three");
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -5000, 5000);
    camera.position.set(0, 0, 1500); camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.85); d1.position.set(0.4, 0.7, 1); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0x9fbbff, 0.4); d2.position.set(-0.5, -0.2, 0.7); scene.add(d2);
    group = new THREE.Group(); scene.add(group);
    ready = true;
  } catch { /* gagal -> tetap tanpa 3D */ }
  loading = false;
}

// ── pembuat objek 3D (satuan lokal: 1 = jarak antar-mata) ──
function buildGlasses(): any {
  const g = new THREE.Group();
  const frame = M("gFrame", () => new THREE.MeshStandardMaterial({ color: 0x15151f, metalness: 0.75, roughness: 0.25 }));
  const lensMat = M("gLens", () => new THREE.MeshPhysicalMaterial({ color: 0x3aa0ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
  const ring = G("gRing", () => new THREE.TorusGeometry(0.42, 0.06, 14, 36));
  const lens = G("gLensGeo", () => new THREE.CircleGeometry(0.42, 36));
  for (const sx of [-0.55, 0.55]) {
    const r = new THREE.Mesh(ring, frame); r.position.set(sx, 0, 0); g.add(r);
    const l = new THREE.Mesh(lens, lensMat); l.position.set(sx, 0, -0.03); g.add(l);
  }
  const br = new THREE.Mesh(G("gBridge", () => new THREE.CylinderGeometry(0.05, 0.05, 0.32, 10)), frame);
  br.rotation.z = Math.PI / 2; br.position.set(0, 0.06, 0); g.add(br);
  for (const sx of [-0.98, 0.98]) { const a = new THREE.Mesh(G("gArm", () => new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8)), frame); a.rotation.x = Math.PI / 2; a.position.set(sx, 0.04, -0.38); g.add(a); }
  return g;
}

function buildCrown(): any {
  const g = new THREE.Group();
  const gold = M("crGold", () => new THREE.MeshStandardMaterial({ color: 0xffd34d, metalness: 0.9, roughness: 0.25, emissive: 0x3a2a00, side: THREE.DoubleSide }));
  const gem = M("crGem", () => new THREE.MeshPhysicalMaterial({ color: 0xff4f8b, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.85 }));
  const band = new THREE.Mesh(G("crBand", () => new THREE.CylinderGeometry(0.62, 0.62, 0.22, 28, 1, true)), gold);
  g.add(band);
  const spike = G("crSpike", () => new THREE.ConeGeometry(0.12, 0.42, 8));
  const gemGeo = G("crGemGeo", () => new THREE.SphereGeometry(0.06, 12, 12));
  const N = 7;
  for (let i = 0; i < N; i++) {
    const a = (i / (N - 1) - 0.5) * Math.PI * 1.1;
    const x = Math.sin(a) * 0.62;
    const s = new THREE.Mesh(spike, gold); s.position.set(x, 0.28, 0); g.add(s);
    const gm = new THREE.Mesh(gemGeo, gem); gm.position.set(x, 0.48, 0); g.add(gm);
  }
  return g;
}

function buildDog(): any {
  const g = new THREE.Group();
  const fur = M("dFur", () => new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.85 }));
  const dark = M("dDark", () => new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.6 }));
  const ear = G("dEar", () => new THREE.ConeGeometry(0.26, 0.7, 16));
  for (const sx of [-0.7, 0.7]) { const e = new THREE.Mesh(ear, fur); e.position.set(sx, 0.55, 0); e.rotation.z = sx > 0 ? -0.35 : 0.35; g.add(e); }
  // hidung di bawah (≈1.3 antar-mata dari dahi)
  const nose = new THREE.Mesh(G("dNose", () => new THREE.SphereGeometry(0.16, 18, 18)), dark); nose.position.set(0, -1.35, 0.35); g.add(nose);
  return g;
}

function buildMask(): any {
  const g = new THREE.Group();
  const visorMat = M("mkVisor", () => new THREE.MeshPhysicalMaterial({ color: 0x6a3df0, metalness: 0.6, roughness: 0.15, transparent: true, opacity: 0.78, emissive: 0x1a0a3a, side: THREE.DoubleSide }));
  const visor = new THREE.Mesh(G("mkVisorGeo", () => new THREE.SphereGeometry(0.85, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62)), visorMat);
  visor.rotation.x = Math.PI / 2; visor.position.set(0, -0.1, 0.35); visor.scale.set(1, 0.9, 0.55); g.add(visor);
  const eyeMat = M("mkEye", () => new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00bcd4, emissiveIntensity: 1.2 }));
  for (const sx of [-0.32, 0.32]) { const e = new THREE.Mesh(G("mkEyeGeo", () => new THREE.SphereGeometry(0.1, 16, 16)), eyeMat); e.position.set(sx, 0.05, 0.7); e.scale.set(1.6, 0.7, 0.4); g.add(e); }
  return g;
}

function build(kind: string): any {
  if (kind === "glasses3d") return buildGlasses();
  if (kind === "crown3d") return buildCrown();
  if (kind === "dog3d") return buildDog();
  return buildMask();
}

export const TOPENG_3D = ["glasses3d", "crown3d", "dog3d", "mask3d"];

/** Render topeng 3D utk semua wajah -> kembalikan kanvas WebGL (atau null jika belum siap). */
export function topeng3dRender(faces: XYZ[][], W: number, H: number, kind: string): HTMLCanvasElement | null {
  if (!ready) { ensure(); return null; }
  try {
    if (renderer.domElement.width !== W || renderer.domElement.height !== H) renderer.setSize(W, H, false);
    camera.left = -W / 2; camera.right = W / 2; camera.top = H / 2; camera.bottom = -H / 2; camera.updateProjectionMatrix();
    while (group.children.length) group.remove(group.children[group.children.length - 1]);
    const wv = (p: XYZ) => new THREE.Vector3((p.x - 0.5) * W, -(p.y - 0.5) * H, -(p.z || 0) * W);
    for (const f of faces) {
      if (!f || f.length < 468) continue;
      const L = wv(f[33]), R = wv(f[263]), T = wv(f[10]), B = wv(f[152]);
      const ex = R.clone().sub(L); const inter = ex.length(); if (inter < 1) continue; ex.normalize();
      const ey0 = T.clone().sub(B).normalize();
      const ez = ex.clone().cross(ey0).normalize();
      const ey = ez.clone().cross(ex).normalize();
      const basis = new THREE.Matrix4().makeBasis(ex, ey, ez);
      const anchor = kind === "glasses3d" ? wv(f[168]) : kind === "mask3d" ? wv(f[1]) : wv(f[10]);
      const obj = build(kind);
      obj.scale.setScalar(inter);
      obj.quaternion.setFromRotationMatrix(basis);
      obj.position.copy(anchor);
      group.add(obj);
    }
    renderer.render(scene, camera);
    return renderer.domElement;
  } catch { return null; }
}
