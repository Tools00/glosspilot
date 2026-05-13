import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  // .env lives at the repo root
  const env = loadEnv(mode, resolve(process.cwd(), "../.."), "VITE_");
  return {
    plugins: [react(), tailwindcss()],
    envDir: resolve(process.cwd(), "../.."),
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://127.0.0.1:3001",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
      },
    },
  };
});
