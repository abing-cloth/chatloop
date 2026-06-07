// Registry filter terpusat (gaya TikTok: berkategori).
// TEMPLATE — tambah filter baru cukup salin satu objek di bawah & isi field-nya.
import type { BeautyFx } from "./faceFx";

export interface FilterDef extends BeautyFx {
  key: string;       // id unik
  label: string;     // teks di chip
  category: string;  // salah satu FILTER_CATEGORIES
}

export const FILTER_CATEGORIES = ["Beauty", "Viral", "Estetik", "Retro"] as const;

/*
  ┌─ TEMPLATE FILTER (salin & ubah) ───────────────────────────────┐
  {
    key: "namaunik", label: "Nama Tampil", category: "Beauty",
    filterCss: "saturate(1.1)",   // CSS filter warna dasar
    white: 0.2, tint: "#fff5f2",  // proses kulit WAJAH (kekuatan + warna)
    body: 0.16,                   // proses kulit BADAN (mask orang)
    eye: 1.2, lip: 1.08,          // ubah fisik: mata, bibir
    cheek: 0.94, nose: 0.9,       // ubah fisik: pipi tirus, hidung kecil
    glow: 0.18, vignette: 0,      // finishing
    makeup: {                     // riasan (opsional)
      lip: "#d9637a", lipA: 0.32, blush: "#ff8fa3", blushA: 0.18,
      shadow: "#caa0b0", shadowA: 0.22, liner: true, brow: 0.18,
    },
  },
  └────────────────────────────────────────────────────────────────┘
*/

export const FILTERS: FilterDef[] = [
  // ── Beauty ──────────────────────────────────────────────
  { key: "normal", label: "Normal", category: "Beauty", filterCss: "none", white: 0, tint: "#ffffff", eye: 1, lip: 1 },
  { key: "beautyfilter", label: "Beauty Filter", category: "Beauty", filterCss: "saturate(1.1)", white: 0.22, tint: "#fff5f2", body: 0.16, eye: 1.2, lip: 1.08, cheek: 0.94, nose: 0.9, glow: 0.18,
    makeup: { lip: "#d9637a", lipA: 0.32, blush: "#ff8fa3", blushA: 0.18, shadow: "#caa0b0", shadowA: 0.22, liner: true, brow: 0.18 } },
  { key: "beautymouth", label: "Beauty Mouth", category: "Beauty", filterCss: "saturate(1.16) contrast(1.02)", white: 0.18, tint: "#ffdbe2", body: 0.14, eye: 1.12, lip: 1.32, cheek: 0.95, nose: 0.92, glow: 0.16,
    makeup: { lip: "#e0354f", lipA: 0.5, blush: "#ff8fb0", blushA: 0.2, liner: true, brow: 0.16 } },
  { key: "mulus", label: "Mulus", category: "Beauty", filterCss: "saturate(1.04)", white: 0.2, tint: "#fff7f4", body: 0.16, eye: 1.1, lip: 1.05, cheek: 0.95, nose: 0.93, glow: 0.14,
    makeup: { lip: "#cf8a86", lipA: 0.24, blush: "#ffb0a0", blushA: 0.14 } },
  { key: "natural111", label: "Natural 111", category: "Beauty", filterCss: "saturate(1.08) contrast(1.03)", white: 0.12, tint: "#fffaf5", body: 0.1, eye: 1.1, lip: 1.04, cheek: 0.97, nose: 0.95, glow: 0.12,
    makeup: { lip: "#cf8a86", lipA: 0.26, blush: "#ffb0a0", blushA: 0.14, brow: 0.14 } },

  // ── Viral ───────────────────────────────────────────────
  { key: "fusiinos", label: "Fusi Wajah Inos", category: "Viral", filterCss: "saturate(1.15) contrast(1.02)", white: 0.26, tint: "#fff4f0", body: 0.2, eye: 1.32, lip: 1.2, cheek: 0.9, nose: 0.88, glow: 0.26, vignette: 0.12,
    makeup: { lip: "#d94f6e", lipA: 0.44, blush: "#ff8fa8", blushA: 0.22, shadow: "#d2a3c0", shadowA: 0.24, liner: true, brow: 0.2 } },
  { key: "kindofcute", label: "Kind of Cute", category: "Viral", filterCss: "saturate(1.2) brightness(1.04)", white: 0.18, tint: "#ffd6ea", body: 0.16, eye: 1.35, lip: 1.14, cheek: 0.9, nose: 0.88, glow: 0.3, vignette: 0.1,
    makeup: { lip: "#ff5d86", lipA: 0.42, blush: "#ff7fb0", blushA: 0.26, shadow: "#ffaad0", shadowA: 0.28, liner: true, brow: 0.2 } },
  { key: "overexposure", label: "Over Exposure", category: "Viral", filterCss: "brightness(1.32) contrast(0.84) saturate(1.05)", white: 0.32, tint: "#ffffff", body: 0.24, eye: 1.12, lip: 1.06, glow: 0.34 },
  { key: "dontworry", label: "Don't Worry", category: "Viral", filterCss: "sepia(0.18) saturate(1.3) brightness(1.06)", white: 0.12, tint: "#fff2dd", body: 0.1, eye: 1.12, lip: 1.06, cheek: 0.97, glow: 0.22,
    makeup: { lip: "#e07a86", lipA: 0.34, blush: "#ffb38f", blushA: 0.2 } },

  // ── Estetik ─────────────────────────────────────────────
  { key: "blueblur", label: "Blue Blur", category: "Estetik", filterCss: "blur(1px) hue-rotate(-12deg) saturate(1.1) brightness(1.04)", white: 0.12, tint: "#dbe8ff", body: 0.12, eye: 1.14, lip: 1.06, cheek: 0.96, nose: 0.94, glow: 0.28, vignette: 0.15,
    makeup: { lip: "#cf6f86", lipA: 0.3, shadow: "#9fb6e0", shadowA: 0.22, liner: true } },
  { key: "softpink", label: "Soft Pink", category: "Estetik", filterCss: "saturate(1.12) brightness(1.03)", white: 0.16, tint: "#ffd9ea", body: 0.12, eye: 1.2, lip: 1.12, cheek: 0.93, nose: 0.9, glow: 0.24, vignette: 0.08,
    makeup: { lip: "#ff6f9a", lipA: 0.4, blush: "#ff8fc0", blushA: 0.24, shadow: "#ffc0dd", shadowA: 0.22, liner: true, brow: 0.16 } },
  { key: "cleangirl", label: "Clean Girl", category: "Estetik", filterCss: "saturate(1.06)", white: 0.14, tint: "#fff3ec", body: 0.12, eye: 1.12, lip: 1.06, cheek: 0.95, nose: 0.95, glow: 0.18,
    makeup: { lip: "#d98f86", lipA: 0.26, blush: "#ffb8a8", blushA: 0.16, brow: 0.18 } },
  { key: "glowup", label: "Glow Up", category: "Estetik", filterCss: "brightness(1.1) saturate(1.12)", white: 0.22, tint: "#fffaf8", body: 0.2, eye: 1.22, lip: 1.1, cheek: 0.92, nose: 0.9, glow: 0.36, vignette: 0.06,
    makeup: { lip: "#e06a82", lipA: 0.38, blush: "#ff90ad", blushA: 0.22, shadow: "#e0b0c0", shadowA: 0.22, liner: true, brow: 0.18 } },

  // ── Retro ───────────────────────────────────────────────
  { key: "vintage", label: "Vintage", category: "Retro", filterCss: "sepia(0.4) contrast(0.92) brightness(1.05) saturate(1.25)", white: 0.06, tint: "#fff", eye: 1, lip: 1, glow: 0.1, vignette: 0.18 },
  { key: "film90", label: "Film 90s", category: "Retro", filterCss: "sepia(0.2) contrast(1.05) saturate(1.2) brightness(1.02)", white: 0.08, tint: "#fff", eye: 1, lip: 1, glow: 0.12, vignette: 0.2 },
  { key: "bw", label: "B&W", category: "Retro", filterCss: "grayscale(1) contrast(1.1)", white: 0, tint: "#ffffff", eye: 1, lip: 1, vignette: 0.16 },
];

export const filterByKey = (key: string) => FILTERS.find((f) => f.key === key) ?? FILTERS[0];
