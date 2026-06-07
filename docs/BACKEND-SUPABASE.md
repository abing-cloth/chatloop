# Backend SUUCHAT — Supabase (sinkronisasi antar-perangkat)

SUUCHAT saat ini PWA sisi-klien (data per-perangkat). Untuk membuat **postingan, live,
pengguna, & pesan tersinkron antar-HP / antar-negara secara real-time**, pasang backend
**Supabase** (gratis untuk mulai). Integrasi sudah disiapkan & *feature-flagged*: tanpa
kunci, app tetap berjalan seperti sekarang.

## Langkah pasang (sekali, ~10 menit)

1. **Buat proyek** di https://supabase.com (gratis). Tunggu hingga aktif.
2. **Jalankan skema**: buka **SQL Editor** → tempel isi [`supabase/schema.sql`](../supabase/schema.sql) → Run.
   (membuat tabel `profiles`, `posts`, `lives`, `messages` + RLS + realtime.)
3. **Ambil kunci**: Project Settings → **API** → salin `Project URL` & `anon public key`.
4. **Isi env**: salin `.env.example` → `.env`, isi:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
   Untuk GitHub Actions/deploy: tambahkan keduanya sebagai **Secrets** & inject saat build.
5. **(Opsional) Storage**: buat bucket publik `media` untuk foto/audio.

Begitu kunci terisi, `src/lib/supabase.ts` → `supabaseEnabled` menjadi `true` dan klien
dimuat otomatis (via CDN, tak menambah bundle).

## Yang akan disinkronkan (langkah implementasi berikutnya)

| Fitur     | Tabel       | Arah |
|-----------|-------------|------|
| Auth      | `auth.users` + `profiles` | daftar/masuk lintas-perangkat |
| Postingan | `posts`     | tulis → muncul di beranda SEMUA pengguna (realtime) |
| Live      | `lives`     | Mulai Siaran → kartu live tampil di beranda semua orang |
| Pesan     | `messages`  | chat 1:1 realtime |

Wiring ke `lib/store.ts` (mengganti seed lokal dengan query + langganan realtime Supabase)
dikerjakan setelah kunci tersedia agar bisa diuji end-to-end. Mode lokal tetap jadi
fallback bila offline / backend mati.

## Catatan keamanan
- RLS aktif: postingan & live publik dibaca semua, tapi hanya pemilik yang bisa ubah/hapus;
  pesan hanya bisa dibaca pengirim/penerima.
- `anon key` aman dipakai di klien (bukan rahasia), keamanan dijaga oleh RLS.
- Jangan commit `.env` (sudah di-`.gitignore`).
