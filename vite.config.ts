import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["chatloop.svg", "apple-touch-icon.png"],
      devOptions: { enabled: true },
      manifest: {
        id: "./",
        name: "SUUCHAT — Ngobrol, terhubung, tanpa henti",
        short_name: "SUUCHAT",
        description: "Media sosial untuk ngobrol, berbagi momen, cerita, live, belanja, dan tetap terhubung dengan teman.",
        theme_color: "#7c3aed",
        background_color: "#ffffff",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        // relatif terhadap lokasi manifest → benar di root (Netlify/Vercel)
        // maupun sub-path (GitHub Pages: /<repo>/)
        start_url: ".",
        scope: ".",
        lang: "id",
        dir: "ltr",
        categories: ["social", "communication", "lifestyle"],
        screenshots: [
          { src: "screenshot-wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide", label: "SUUCHAT" },
          { src: "screenshot-narrow.png", sizes: "720x1280", type: "image/png", form_factor: "narrow", label: "SUUCHAT" },
        ],
        shortcuts: [
          { name: "Pesan", short_name: "Pesan", url: "./", icons: [{ src: "icon-192.png", sizes: "192x192" }] },
          { name: "Belanja", short_name: "Belanja", url: "./", icons: [{ src: "icon-192.png", sizes: "192x192" }] },
          { name: "Live", short_name: "Live", url: "./", icons: [{ src: "icon-192.png", sizes: "192x192" }] },
        ],
        icons: [
          {
            src: "chatloop.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(picsum\.photos|i\.pravatar\.cc)\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "loop-images",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    watch: { usePolling: true },
  },
});
