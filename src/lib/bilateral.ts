// Bilateral filter via WebGL/GLSL — haluskan kulit tapi pertahankan tepi (mata/bibir/rambut tajam).
// Jauh lebih baik dari Gaussian blur. Dijalankan pada resolusi diperkecil (cepat di HP).
let gl: WebGLRenderingContext | null = null;
let glCanvas: HTMLCanvasElement | null = null;
let prog: WebGLProgram | null = null;
let tex: WebGLTexture | null = null;
let uTexel: WebGLUniformLocation | null = null;
let uSigmaR: WebGLUniformLocation | null = null;
let failed = false;

const RAD = 3;
const VERT = "attribute vec2 p; varying vec2 v_uv; void main(){ v_uv = vec2(p.x*0.5+0.5, p.y*0.5+0.5); gl_Position = vec4(p,0.0,1.0); }";
const FRAG = `precision mediump float;
uniform sampler2D u_tex; uniform vec2 u_texel; uniform float u_sigmaR;
varying vec2 v_uv;
void main(){
  vec3 c0 = texture2D(u_tex, v_uv).rgb;
  vec3 sum = vec3(0.0); float ws = 0.0;
  for (int i=-${RAD}; i<=${RAD}; i++) {
    for (int j=-${RAD}; j<=${RAD}; j++) {
      vec2 o = vec2(float(i), float(j)) * u_texel;
      vec3 c = texture2D(u_tex, v_uv + o).rgb;
      float ds = float(i*i + j*j);
      vec3 d = c - c0; float dr = dot(d, d);
      float w = exp(-ds/8.0 - dr/(2.0*u_sigmaR*u_sigmaR));
      sum += c * w; ws += w;
    }
  }
  gl_FragColor = vec4(sum/ws, 1.0);
}`;

function compile(g: WebGLRenderingContext, type: number, src: string) {
  const s = g.createShader(type)!;
  g.shaderSource(s, src); g.compileShader(s);
  if (!g.getShaderParameter(s, g.COMPILE_STATUS)) { g.deleteShader(s); return null; }
  return s;
}

function init(): boolean {
  if (gl) return true;
  if (failed) return false;
  try {
    glCanvas = document.createElement("canvas");
    gl = glCanvas.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: false }) as WebGLRenderingContext | null;
    if (!gl) { failed = true; return false; }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { failed = true; return false; }
    prog = gl.createProgram()!;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { failed = true; return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pLoc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    uTexel = gl.getUniformLocation(prog, "u_texel");
    uSigmaR = gl.getUniformLocation(prog, "u_sigmaR");
    return true;
  } catch { failed = true; return false; }
}

/** Hasilkan kanvas WebGL berisi `source` yang sudah di-bilateral. Null bila WebGL tak ada. */
export function bilateral(source: TexImageSource, srcW: number, srcH: number, sigmaR = 0.13): HTMLCanvasElement | null {
  if (!init() || !gl || !glCanvas) return null;
  try {
    const maxSide = 480;
    const sc = Math.min(1, maxSide / Math.max(srcW, srcH));
    const w = Math.max(2, Math.round(srcW * sc)), h = Math.max(2, Math.round(srcH * sc));
    if (glCanvas.width !== w || glCanvas.height !== h) { glCanvas.width = w; glCanvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.uniform2f(uTexel, 1 / w, 1 / h);
    gl.uniform1f(uSigmaR, sigmaR);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return glCanvas;
  } catch { return null; }
}
