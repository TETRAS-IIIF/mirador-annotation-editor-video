import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

export default defineConfig({
  base: process.env.BASE_PATH || `/${process.env.npm_package_name}/`,
  root: fileURLToPath(new URL("./demo/src", import.meta.url)),   // adjust to your demo folder
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),   // write to project ./dist
    emptyOutDir: true,
    rollupOptions: { input: "index.html" },
    sourcemap: true,
  },
  plugins: [react()],
});
