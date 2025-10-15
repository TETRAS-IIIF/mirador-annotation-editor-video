// vite.config.js (or .ts)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

export default defineConfig({
  base: process.env.GITHUB_PAGES
    ? (process.env.BASE_PATH || `/${process.env.npm_package_name}/`)
    : "/",

  ...(process.env.GITHUB_PAGES
    ? {
      build: {
        emptyOutDir: true,
        outDir: fileURLToPath(new URL('./dist', import.meta.url)),
        sourcemap: true
      },
      plugins: [react()],
      root: fileURLToPath(new URL('./demo/src', import.meta.url))

    }
    : {
      // your library build stays as-is
    }),
});
