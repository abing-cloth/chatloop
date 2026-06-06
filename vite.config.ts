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
        name: "ChatLoop — Ngobrol, terhubung, tanpa henti",
        short_name: "ChatLoop",
        description: "Media sosial untuk ngobrol, berbagi momen, cerita, dan tetap terhubung.",
        theme_color: "#7c3aed",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        // relatif terhadap lokasi manifest → benar di root (Netlify/Vercel)
        // maupun sub-path (GitHub Pages: /<repo>/)
        start_url: ".",
        lang: "id",
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
