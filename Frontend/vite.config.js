import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Backend Express berjalan di :3000 dan TIDAK memakai paket `cors`.
// Karena itu semua request /api di-proxy lewat dev server Vite,
// sehingga browser melihat origin yang sama -> bebas masalah CORS.
//
// Untuk build produksi, dua nilai ini bisa diatur lewat environment:
//   VITE_BASE     -> base path publik. GitHub Pages project site butuh
//                    "/nama-repo/" karena situs disajikan dari subfolder.
//   VITE_API_BASE -> alamat API backend di cloud, mis.
//                    "https://pengelola-bisnis-api.onrender.com/api".
//                    Dikosongkan -> otomatis "/api" (dev lewat proxy).
export default defineConfig(({ mode }) => {
    // Prefix "" -> ikut membaca variabel dari berkas .env, bukan hanya
    // process.env, supaya `npm run build` lokal juga gampang diatur.
    const env = loadEnv(mode, process.cwd(), "");

    return {
        base: env.VITE_BASE || "/",
        plugins: [react(), tailwindcss()],
        server: {
            port: 5173,
            strictPort: true,
            proxy: {
                "/api": {
                    target: "http://localhost:3000",
                    changeOrigin: true
                }
            }
        },
        build: {
            outDir: "dist",
            sourcemap: false
        }
    };
});
