# Filter Kamera Live — Kategori, Node Effect House, Kode Inti GLSL

Peta lengkap 7 kategori filter: **fungsi → node utama (TikTok Effect House) → kode inti GLSL → status di ChatLoop**.
ChatLoop berjalan di **web (Canvas2D + WebGL)** sehingga ekuivalen Effect House diimplementasikan dengan MediaPipe + Canvas + shader.

---

## 1. Beauty / Retouch
- **Fungsi:** mulusin kulit, tirusin muka, cerahkan
- **Node Effect House:** Retouch / Face Stretch
- **Kode inti GLSL:** `bilateralBlur() + skinMask` → `color = mix(color, bilateral(color), skinMask)`
- **ChatLoop:** ✅ `lib/bilateral.ts` (shader bilateral) + mask wajah/badan (`faceFx.smoothInto`, `applyBodySkin`)

## 2. Makeup AR
- **Fungsi:** lipstik, blush, eyeshadow, eyeliner, alis
- **Node Effect House:** Face Mesh → UV → Texture 2D
- **Kode inti GLSL:** `color = mix(color, lipstickColor, lipMask)` (mask dari UV bibir/mata/pipi)
- **ChatLoop:** ✅ `faceFx.applyMakeup` (poligon landmark + blend) + preset di `lib/filters.ts`

## 3. Face Reshape
- **Fungsi:** tirusin pipi, gedein mata, hidung kecil, bibir berisi, V-line
- **Node Effect House:** Face Warp / Deformation
- **Kode inti GLSL:** `warpCoord = uv + intensity * dir; color = texture2D(tex, warpCoord)`
- **ChatLoop:** ✅ `lib/meshWarp.ts` (jaring segitiga Delaunay + warp affine per segitiga)

## 4. Background / Scene
- **Fungsi:** ganti latar (blur, warna, hologram, studio)
- **Node Effect House:** Background Segmentation
- **Kode inti GLSL:** `if (segMask < 0.5) color = texture2D(bgTex, uv);`
- **ChatLoop:** ✅ `faceFx.applyBackground` (MediaPipe Selfie Segmentation → komposit orang di atas latar). Mode: Blur · Hologram · Studio · **Bokeh/Pantai/Senja/Alam** (scene prosedural, cache per-ukuran) · **📷 Foto custom** (dari galeri)

## 5. 3D Object / Topeng
- **Fungsi:** topeng, mahkota, kacamata, topi
- **Node Effect House:** 3D Object + Face Anchor
- **Kode inti GLSL/Transform:** pasang model ke landmark anchor (mis. dahi **10**, dagu **152**), skala = jarak antar-mata
- **ChatLoop:** ✅ versi 2D vektor di `LiveCamera.drawEffect` (kacamata/topi/mahkota dll, anchor landmark). 3D penuh → roadmap (three.js)

## 6. Color Filter / LUT
- **Fungsi:** tone film, vintage, aesthetic
- **Node Effect House:** Color Correction + LUT Texture
- **Kode inti GLSL:** `color = texture2D(lutTex, vec2(color.rg)); // sample LUT`
- **ChatLoop:** ✅ pendekatan CSS filter (`sepia/contrast/saturate/hue-rotate`) di preset `Retro` (Vintage, Film 90s). LUT PNG → roadmap

## 7. Distortion / Lucu
- **Fungsi:** muka gepeng, mata gede, kepala balon, gelombang
- **Node Effect House:** UV Distortion
- **Kode inti GLSL:** `uv.x += sin(uv.y * 10.0) * 0.1; color = texture2D(tex, uv);`
- **ChatLoop:** ✅ `LiveCamera` efek `matagede`, `balon`, `fusiinos1206` (liquify/magnify per landmark)

---

## Pemetaan ke UI ChatLoop (Live → ✨ Efek)
| Tab | Kategori |
|-----|----------|
| **Filter** (chip kategori) | Beauty · Viral · Estetik · Retro (LUT/Color) |
| **Efek Wajah** | Makeup (via preset filter) · Topeng/3D (kacamata/topi/mahkota) · Lucu/Distortion |
| **Background** | None · Blur · Hologram · Studio |
| Kontrol | 🤖 Auto/👩/👨 gender · ✨ slider intensitas |

## Cara menambah (template)
- **Filter/Beauty/LUT/Makeup:** salin 1 objek di `src/lib/filters.ts` (ada TEMPLATE berkomentar).
- **Efek wajah/Topeng/Distortion:** tambah entry di `FACE_EFFECTS` + handler di `drawEffect` (`src/components/LiveCamera.tsx`).
- **Background:** tambah mode di `faceFx.applyBackground`.
