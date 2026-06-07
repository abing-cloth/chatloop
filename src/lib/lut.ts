// Color grading LUT (3D lookup table) via WebGL — gaya sinematik nyata.
// LUT dibangkitkan prosedural (512x512, 64 level, grid 8x8) lalu di-sample di shader
// dengan teknik GPUImage LookupTable. Di-cache per nama. Fallback: null (pakai apa adanya).

type RGB = [number, number, number];
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

// ── Transform warna per-piksel (r,g,b in 0..1) → grade ──
const GRADES: Record<string, (r: number, g: number, b: number) => RGB> = {
  // Teal di bayangan, oranye di highlight (sinematik blockbuster)
  sinematik: (r, g, b) => {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sh = 1 - smooth(0.0, 0.5, lum), hi = smooth(0.5, 1.0, lum);
    let R = r + hi * 0.10 - sh * 0.04;
    let G = g + hi * 0.03 + sh * 0.02;
    let B = b + sh * 0.10 - hi * 0.06;
    // kontras lembut
    R = clamp01((R - 0.5) * 1.12 + 0.5); G = clamp01((G - 0.5) * 1.12 + 0.5); B = clamp01((B - 0.5) * 1.12 + 0.5);
    return [R, G, B];
  },
  // Film vintage: black lifted, warm/kuning, sedikit fade
  vintagefilm: (r, g, b) => {
    let R = mix(r, 1, 0.0) * 0.96 + 0.06;
    let G = g * 0.97 + 0.045;
    let B = b * 0.9 + 0.02;
    R = clamp01(R + 0.04); G = clamp01(G + 0.015); B = clamp01(B - 0.02);
    // kurangi kontras (fade)
    R = clamp01((R - 0.5) * 0.9 + 0.52); G = clamp01((G - 0.5) * 0.9 + 0.5); B = clamp01((B - 0.5) * 0.9 + 0.48);
    return [R, G, B];
  },
  // Dingin / moody biru
  dingin: (r, g, b) => [clamp01(r * 0.92), clamp01(g * 0.99 + 0.01), clamp01(b * 1.08 + 0.02)],
  // Hangat / golden hour
  panas: (r, g, b) => [clamp01(r * 1.08 + 0.02), clamp01(g * 1.0 + 0.01), clamp01(b * 0.9)],
  // Drama: kontras tinggi + sedikit desaturasi
  drama: (r, g, b) => {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const R = mix(lum, r, 0.85), G = mix(lum, g, 0.85), B = mix(lum, b, 0.85);
    return [clamp01((R - 0.5) * 1.35 + 0.5), clamp01((G - 0.5) * 1.35 + 0.5), clamp01((B - 0.5) * 1.35 + 0.5)];
  },
};

export const LUT_NAMES = Object.keys(GRADES);

// bangun PNG LUT identitas (512x512, 64 level grid 8x8) lalu terapkan grade
const lutCache: Record<string, HTMLCanvasElement> = {};
function buildLUT(name: string): HTMLCanvasElement | null {
  if (lutCache[name]) return lutCache[name];
  const fn = GRADES[name]; if (!fn) return null;
  const N = 64, TILES = 8, SIZE = 512; // 8*64 = 512
  const cv = document.createElement("canvas"); cv.width = SIZE; cv.height = SIZE;
  const ctx = cv.getContext("2d"); if (!ctx) return null;
  const img = ctx.createImageData(SIZE, SIZE); const d = img.data;
  for (let bi = 0; bi < N; bi++) {
    const tileX = (bi % TILES) * N, tileY = Math.floor(bi / TILES) * N;
    const bb = bi / (N - 1);
    for (let gi = 0; gi < N; gi++) {
      const gg = gi / (N - 1);
      for (let ri = 0; ri < N; ri++) {
        const rr = ri / (N - 1);
        const [R, G, B] = fn(rr, gg, bb);
        const x = tileX + ri, y = tileY + gi, o = (y * SIZE + x) * 4;
        d[o] = Math.round(R * 255); d[o + 1] = Math.round(G * 255); d[o + 2] = Math.round(B * 255); d[o + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  lutCache[name] = cv;
  return cv;
}

// ── WebGL singleton ──
let gl: WebGLRenderingContext | null = null;
let glcv: HTMLCanvasElement | null = null;
let prog: WebGLProgram | null = null;
let srcTex: WebGLTexture | null = null, lutTex: WebGLTexture | null = null;
let uAmount: WebGLUniformLocation | null = null, uTex: WebGLUniformLocation | null = null, uLut: WebGLUniformLocation | null = null;
let lastLut = "";
let failed = false;

const VERT = `attribute vec2 p; varying vec2 v_uv; void main(){ v_uv = vec2((p.x+1.0)/2.0, (p.y+1.0)/2.0); gl_Position = vec4(p,0.0,1.0); }`;
const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform sampler2D u_lut;
uniform float u_amount;
void main(){
  vec4 src = texture2D(u_tex, vec2(v_uv.x, 1.0 - v_uv.y));
  float blue = src.b * 63.0;
  vec2 q1; q1.y = floor(floor(blue)/8.0); q1.x = floor(blue) - q1.y*8.0;
  vec2 q2; q2.y = floor(ceil(blue)/8.0); q2.x = ceil(blue) - q2.y*8.0;
  vec2 t1, t2;
  t1.x = (q1.x*0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0)*src.r);
  t1.y = (q1.y*0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0)*src.g);
  t2.x = (q2.x*0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0)*src.r);
  t2.y = (q2.y*0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0)*src.g);
  vec4 c1 = texture2D(u_lut, t1);
  vec4 c2 = texture2D(u_lut, t2);
  vec4 graded = mix(c1, c2, fract(blue));
  gl_FragColor = vec4(mix(src.rgb, graded.rgb, u_amount), src.a);
}`;

function compile(g: WebGLRenderingContext, type: number, src: string) {
  const s = g.createShader(type)!; g.shaderSource(s, src); g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) { g.deleteShader(s); return null; }
  return s;
}

function init(): boolean {
  if (gl) return true;
  if (failed) return false;
  glcv = document.createElement("canvas");
  gl = glcv.getContext("webgl", { premultipliedAlpha: false }) as WebGLRenderingContext | null;
  if (!gl) { failed = true; return false; }
  const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { failed = true; return false; }
  prog = gl.createProgram()!; gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { failed = true; return false; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  uTex = gl.getUniformLocation(prog, "u_tex"); uLut = gl.getUniformLocation(prog, "u_lut"); uAmount = gl.getUniformLocation(prog, "u_amount");
  srcTex = gl.createTexture(); lutTex = gl.createTexture();
  return true;
}

/** Terapkan LUT `name` ke `source` (WxH). Kembalikan kanvas GL hasil, atau null (fallback). */
export function applyLUT(source: TexImageSource, W: number, H: number, name: string, amount = 0.9): HTMLCanvasElement | null {
  if (!init() || !gl || !glcv || !prog) return null;
  const lutImg = buildLUT(name); if (!lutImg) return null;
  if (glcv.width !== W || glcv.height !== H) { glcv.width = W; glcv.height = H; }
  gl.viewport(0, 0, W, H);
  gl.useProgram(prog);
  // source -> unit 0
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source); } catch { return null; }
  gl.uniform1i(uTex, 0);
  // lut -> unit 1 (re-upload hanya jika ganti nama)
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, lutTex);
  if (lastLut !== name) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lutImg);
    lastLut = name;
  }
  gl.uniform1i(uLut, 1);
  gl.uniform1f(uAmount, amount);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return glcv;
}
