# ChatLoop 🔄💬

Aplikasi media sosial & chat ala **Facebook / Instagram**. Dibuat dengan React 19 + Vite 7 + TypeScript + TailwindCSS 4 + Zustand. Data tersimpan otomatis di `localStorage` browser — **tidak perlu backend / server**.

**Logo:** gelembung chat berisi dua cincin saling mengait — melambangkan percakapan dua arah yang terus berputar (loop).

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
npm run build
npm run preview
```

## 📁 Struktur

```
src/
  components/   # Avatar, TopBar, Sidebar, RightBar, Stories, CreatePost, PostCard
  pages/        # Feed, Profile
  lib/          # store (Zustand), types, seed data, utils
  App.tsx       # navigasi (Beranda / Profil)
```

## 🔌 Lanjut ke server sungguhan

Aplikasi ini frontend-only. Untuk multi-user nyata, ganti aksi di `src/lib/store.ts`
dengan panggilan API (mis. Laravel seperti project koi inventory, atau Supabase/Firebase).
Struktur tipe di `src/lib/types.ts` sudah siap dipetakan ke tabel database.

---
Dibuat dengan 💜
