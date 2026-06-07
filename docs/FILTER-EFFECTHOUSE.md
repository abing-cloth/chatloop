# Filter Kamera ChatLoop — 12 Kategori (Metode TikTok Effect House)

Peta lengkap **12 kategori** filter: **fungsi → node utama Effect House → kode inti GLSL → status di ChatLoop**.
ChatLoop berjalan di **web (Canvas2D + WebGL + MediaPipe)**, jadi ekuivalen Effect House diimplementasikan dengan MediaPipe FaceLandmarker/Segmenter + Canvas + shader. Status: ✅ ada · 🟡 versi ringkas/aproksimasi · 🔜 roadmap.

---

## 1. Beauty / Retouch ✅
- **Fungsi:** mulusin kulit, tirusin muka, cerahkan
- **Node Effect House:** Face Tracker + Beauty Retouch
- **Kode inti GLSL:** `bilateralBlur() + skinMask` → `color = mix(color, bilateral(color), skinMask)`
- **ChatLoop:** `lib/bilateral.ts` (shader bilateral) + mask wajah/badan (`faceFx.smoothInto`, `applyBodySkin`). Tint kulit ikut `tintStrength()` agar tak memucatkan.

## 2. Makeup AR ✅
- **Fungsi:** lipstik, blush, eyeshadow, eyeliner, alis
- **Node Effect House:** Face Mesh UV + Texture2D
- **Kode inti GLSL:** `color = mix(color, lipstickColor, lipMask)`
- **ChatLoop:** `faceFx.applyMakeup` (poligon landmark + blend) + preset `makeup` di `lib/filters.ts`

## 3. Face Reshape ✅
- **Fungsi:** tirusin pipi, gedein mata, hidung kecil, bibir berisi, V-line
- **Node Effect House:** Face Warp / Deformation
- **Kode inti GLSL:** `warpCoord = uv + offset * intensity; color = texture2D(tex, warpCoord)`
- **ChatLoop:** `lib/meshWarp.ts` (Delaunay + warp affine per segitiga). Guard anti-"hancur": skip segitiga terbalik, clamp pergeseran ≤0.1·faceW, cap ≤0.22.

## 4. Background / Scene ✅
- **Fungsi:** ganti latar (blur, scene, hologram, foto custom)
- **Node Effect House:** Background Segmentation
- **Kode inti GLSL:** `if (segMask < 0.5) color = texture2D(bgTex, uv);`
- **ChatLoop:** `faceFx.applyBackground` (MediaPipe Selfie Segmentation). Mode: Blur · Hologram · Studio · **Bokeh/Pantai/Senja/Alam** (scene prosedural) · **📷 Foto custom** (galeri)

## 5. 3D Object / Topeng ✅🟡
- **Fungsi:** topeng, mahkota, kacamata, topi
- **Node Effect House:** 3D Object + Face Anchor
- **Transform:** model di-anchor ke landmark (dahi **10**, dagu **152**), skala = jarak antar-mata
- **ChatLoop:** versi **2D vektor** di `LiveCamera.drawEffect` (Pink/Barbie Glass, Bando, Butterfly, Reve Fairy Cap, Tramp). 🔜 3D penuh (three.js + glTF).

## 6. Color Filter / LUT ✅🟡
- **Fungsi:** tone film, vintage, aesthetic
- **Node Effect House:** Color Correction + LUT Texture
- **Kode inti GLSL:** `color = texture2D(lutTex, vec2(color.rg));`
- **ChatLoop:** pendekatan **CSS filter** (`sepia/contrast/saturate/hue-rotate`) di kategori `Retro` (Vintage, Film 90s, B&W). 🔜 LUT PNG (`.png` Hald CLUT) untuk grading sinematik.

## 7. Distortion / Lucu ✅
- **Fungsi:** muka gepeng, mata gede, kepala balon, gelombang
- **Node Effect House:** UV Distortion + Sine Wave
- **Kode inti GLSL:** `uv.x += sin(uv.y*10.0)*0.1; color = texture2D(tex, uv);`
- **ChatLoop:** `LiveCamera` efek `matagede`, `balon`, `fusiinos1206` (liquify/magnify per landmark)

## 8. Particle / Efek ✅
- **Fungsi:** glitter, bunga jatuh, salju, hati terbang
- **Node Effect House:** Particle System + GPU Instancing
- **Kode inti:** spawn partikel (gravitasi/melayang), update tiap frame, emit dari atas/bawah layar
- **ChatLoop:** `LiveCamera.stepParticles` + map `PARTICLE` (Glitter 🌟, Bunga 🌸, Salju ❄️, Hati 💖). Dirender di lapisan paling atas.

## 9. Animation / Character ✅🟡
- **Fungsi:** jadi anime, kartun, AI art
- **Node Effect House:** Style Transfer Shader
- **Kode inti GLSL:** `color = cnnStyleTransfer(color, styleTex);`
- **ChatLoop:** kategori **Seni** — Kartun, Pop Art, Anime (aproksimasi via CSS filter + makeup/reshape, **bukan** style-transfer ML). 🔜 style-transfer asli (tfjs/WebGL CNN) butuh model & GPU lebih berat.

## 10. Game / Interactive 🔜
- **Fungsi:** tangkap bola, kedip mata, skor
- **Node Effect House:** Logic Script + Face Tracking
- **Kode inti:** `if (eyeBlink > 0.8) score++;` (deteksi kedip dari rasio kelopak mata: landmark 159/145 & 386/374)
- **ChatLoop:** 🔜 belum ada. Fondasi siap: FaceLandmarker sudah jalan; tinggal tambah logika kedip + state skor + objek jatuh.

## 11. Text / Typografi ✅🟡
- **Fungsi:** nama 3D, lirik berjalan, komentar
- **Node Effect House:** 2D Text + Animation
- **Kode inti:** `textPos += time * speed`
- **ChatLoop:** komentar real-time + stiker emoji sudah ada. 🔜 overlay "Nama 3D"/teks animasi yang dibakar ke kanvas.

## 12. Aksesori Fashion ✅🟡
- **Fungsi:** anting, kalung, hiasan kepala
- **Node Effect House:** 3D Model + PBR Material + Face Anchor
- **Transform:** model di-anchor ke landmark telinga (**234**/**454**) & leher/dagu (**152**)
- **ChatLoop:** versi **2D vektor** `LiveCamera.drawEffect` (Anting 💎 di telinga, Kalung 📿 di bawah dagu). 🔜 model 3D PBR (mis. anting brand) via three.js.

---

## Pemetaan ke UI ChatLoop (Live → ✨ Efek)
| Tab / Kontrol | Kategori tercakup |
|---------------|-------------------|
| **Filter** (chip kategori) | Beauty (1) · Viral · Estetik · Retro=LUT/Color (6) · **Seni**=Animation/Character (9) |
| Setiap filter membawa | Makeup AR (2) + Face Reshape (3) + Glow/Vignette |
| **Efek Wajah** (grup) | **Topeng/3D** (5) · **Distorsi** (7) · **Particle** (8) · **Aksesori** (12) |
| **🖼️ Latar** | Background/Scene (4): Blur·Bokeh·Pantai·Senja·Alam·Hologram·Studio·Foto |
| **Komentar/Stiker** | Text/Typografi (11) |
| Kontrol | 🤖 Auto/👩/👨 gender · ✨ slider intensitas |
| 🔜 Roadmap | Game/Interactive (10) · LUT PNG (6) · 3D penuh (5/12) · Style-transfer ML (9) |

## Cara menambah (template)
- **Filter/Beauty/LUT/Makeup/Seni:** salin 1 objek di `src/lib/filters.ts` (ada TEMPLATE berkomentar) — isi `category`, `filterCss`, `white/tint`, `eye/lip/cheek/nose`, `makeup`, `glow/vignette`.
- **Efek wajah/Topeng/Distorsi/Aksesori:** tambah entry di `FACE_EFFECTS` (beri `group`) + handler di `drawEffect` (`src/components/LiveCamera.tsx`).
- **Particle:** tambah entry `FACE_EFFECTS` group "Particle" + set emoji di map `PARTICLE`.
- **Background:** tambah mode di `faceFx.applyBackground` (scene prosedural → `sceneBg`).
