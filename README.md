# ChatLoop 🔄💬

Aplikasi media sosial & chat ala **Facebook / Instagram**. Dibuat dengan React 19 + Vite 7 + TypeScript + TailwindCSS 4 + Zustand. Data tersimpan otomatis di `localStorage` browser — **tidak perlu backend / server**.

**Logo:** gelembung chat berisi satu loop ∞ (infinity) — wadah chat yang universal + simbol "loop" yang menerus, melambangkan percakapan yang terus berputar tanpa henti.

### 🎨 Aset brand (`public/`)
| File | Penggunaan |
|------|-----------|
| `chatloop.svg` | Logo ikon utama (favicon, PWA) — vektor, tajam di semua ukuran |
| `chatloop-wordmark.svg` | Logo horizontal (ikon + tulisan) untuk header/banner |
| `chatloop-mono.svg` | Versi 1 warna (`currentColor`) untuk watermark / latar polos |
| `icon-192.png`, `icon-512.png` | Ikon PWA standar |
| `maskable-512.png` | Ikon maskable (punya safe-zone, aman dipotong bulat oleh OS) |
| `apple-touch-icon.png` | Ikon home screen iOS (180×180) |

## ✨ Fitur

- **Beranda (Feed)** — postingan teks & foto, urut terbaru
- **Stories** — bar cerita dengan viewer fullscreen (ala IG)
- **Jelajahi (Explore)** — grid foto + pencarian, klik untuk buka postingan
- **Pesan / Chat** — daftar percakapan + ruang obrolan dua arah
- **Notifikasi** — dari suka, komentar, & follow pada akun Anda
- **Tersimpan** — bookmark postingan favorit (persisten)
- **Buat postingan** — tulis status + unggah foto dari perangkat
- **Suka & komentar** — like (double-tap foto juga bisa), komentar real-time
- **Mode gelap** 🌙 — toggle terang/gelap, tersimpan otomatis
- **Profil** — edit nama, bio, foto profil; statistik & galeri postingan
- **Ikuti / Mengikuti** — tersinkron di semua halaman
- **Navigasi mobile** — bottom nav bar responsif di layar kecil
- **PWA** 📱 — bisa di-install di HP/desktop, jalan offline
- **Persisten** — semua data tersimpan di browser; tombol reset untuk kembali ke data demo

> Catatan: fitur PWA (install & offline) aktif pada mode **build/preview**, bukan `dev`.
> Jalankan `npm run build && npm run preview` lalu buka di browser untuk mencoba install.

## 🚀 Menjalankan

```bash
cd loop
npm install
npm run dev
```

Buka alamat yang ditampilkan (biasanya http://localhost:5173).

## 🏗️ Build produksi

```bash
npm run build      # gabungkan semua kode jadi bundle teroptimasi di dist/
npm run preview    # uji hasil build (PWA aktif di sini)
```

## 🚀 Deploy online

Folder `dist/` adalah situs statis — bisa di-host gratis. Konfigurasi untuk 3 platform sudah disiapkan:

### Opsi 1 — Vercel (paling cepat)
1. Push repo ini ke GitHub.
2. Buka [vercel.com](https://vercel.com) → **Add New → Project** → pilih repo.
3. Vercel otomatis pakai [`vercel.json`](vercel.json) (framework Vite terdeteksi). Klik **Deploy**.

### Opsi 2 — Netlify
1. Push repo ke GitHub.
2. Buka [netlify.com](https://netlify.com) → **Add new site → Import** → pilih repo.
3. Pengaturan build otomatis dari [`netlify.toml`](netlify.toml). Klik **Deploy**.

> Tanpa GitHub: jalankan `npm run build`, lalu **drag-and-drop** folder `dist/` ke [app.netlify.com/drop](https://app.netlify.com/drop).

### Opsi 3 — GitHub Pages (otomatis via Actions)
1. Buat repo di GitHub & push (lihat di bawah).
2. Di repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) jalan otomatis tiap `push` ke `main`.
   Situs terbit di `https://<username>.github.io/<repo>/` (base path diatur otomatis).

```bash
# push pertama ke GitHub
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## 📁 Struktur

```
src/
  components/   # TopBar, Sidebar, RightBar, MobileNav, Stories, CreatePost, PostCard, Splash, Avatar
  pages/        # Auth, Feed, Explore, Messages, Notifications, Saved, Profile, Settings
  lib/          # store (Zustand), types, seed data, utils
  App.tsx       # splash → auth → navigasi antar halaman
```

## 🔌 Lanjut ke server sungguhan

Aplikasi ini frontend-only. Untuk multi-user nyata, ganti aksi di `src/lib/store.ts`
dengan panggilan API (mis. Laravel seperti project koi inventory, atau Supabase/Firebase).
Struktur tipe di `src/lib/types.ts` sudah siap dipetakan ke tabel database.

---
Dibuat dengan 💜
