import { useStore } from "./store";

type Lang = "id" | "en";

// Kamus: kunci -> { id, en }
const DICT: Record<string, { id: string; en: string }> = {
  // nav
  "nav.feed": { id: "Beranda", en: "Home" },
  "nav.explore": { id: "Jelajahi", en: "Explore" },
  "nav.reels": { id: "Reels", en: "Reels" },
  "nav.live": { id: "Live", en: "Live" },
  "nav.shop": { id: "Belanja", en: "Shop" },
  "nav.groups": { id: "Grup", en: "Groups" },
  "nav.wallet": { id: "Dompet", en: "Wallet" },
  "nav.messages": { id: "Pesan", en: "Messages" },
  "nav.notifications": { id: "Notifikasi", en: "Notifications" },
  "nav.saved": { id: "Tersimpan", en: "Saved" },
  "nav.profile": { id: "Profil", en: "Profile" },
  "nav.settings": { id: "Pengaturan", en: "Settings" },
  // umum
  "common.search": { id: "Cari di ChatLoop", en: "Search ChatLoop" },
  "common.darkMode": { id: "Mode Gelap", en: "Dark Mode" },
  "common.lightMode": { id: "Mode Terang", en: "Light Mode" },
  "common.reset": { id: "Reset", en: "Reset" },
  "common.logout": { id: "Keluar", en: "Log out" },
  "common.follow": { id: "Ikuti", en: "Follow" },
  "common.following": { id: "Mengikuti", en: "Following" },
  // settings
  "set.title": { id: "Pengaturan", en: "Settings" },
  "set.appearance": { id: "Tampilan", en: "Appearance" },
  "set.language": { id: "Bahasa", en: "Language" },
  "set.accent": { id: "Warna tema", en: "Theme color" },
  "set.fontSize": { id: "Ukuran teks", en: "Text size" },
  "set.small": { id: "Kecil", en: "Small" },
  "set.normal": { id: "Normal", en: "Normal" },
  "set.large": { id: "Besar", en: "Large" },
  // halaman & aksi umum
  "page.explore": { id: "Jelajahi", en: "Explore" },
  "page.notifications": { id: "Notifikasi", en: "Notifications" },
  "page.saved": { id: "Tersimpan", en: "Saved" },
  "page.messages": { id: "Pesan", en: "Messages" },
  "post.placeholder": { id: "Apa yang sedang kamu pikirkan?", en: "What's on your mind?" },
  "post.photo": { id: "Foto", en: "Photo" },
  "post.send": { id: "Posting", en: "Post" },
  "post.draft": { id: "Simpan draf", en: "Save draft" },
  "post.draftSaved": { id: "Draf tersimpan ✓", en: "Draft saved ✓" },
  "post.empty": { id: "Belum ada postingan. Mulai bagikan momenmu! 🔄", en: "No posts yet. Start sharing! 🔄" },
  "set.darkmode": { id: "Mode gelap", en: "Dark mode" },
  "set.darkmodeDesc": { id: "Tampilan nyaman saat malam hari", en: "Comfortable view at night" },
  "set.dataSaver": { id: "Mode hemat data", en: "Data saver" },
  "set.dataSaverDesc": { id: "Video tidak diputar otomatis & gambar lebih ringan", en: "Videos won't autoplay & lighter images" },
  "set.notifications": { id: "Notifikasi", en: "Notifications" },
  "set.push": { id: "Notifikasi perangkat", en: "Device notifications" },
  "set.pushDesc": { id: "Tampilkan notifikasi di perangkat ini", en: "Show notifications on this device" },
  "set.privacy": { id: "Privasi", en: "Privacy" },
  "set.security": { id: "Keamanan", en: "Security" },
  "set.creator": { id: "Kreator & Verifikasi", en: "Creator & Verification" },
  "set.app": { id: "Aplikasi", en: "App" },
  "set.account": { id: "Akun", en: "Account" },
  "set.about": { id: "Tentang", en: "About" },
};

export function t(key: string, lang: Lang): string {
  const e = DICT[key];
  return e ? e[lang] : key;
}

export function useT() {
  const lang = useStore((s) => s.settings.lang);
  return (key: string) => t(key, lang);
}
