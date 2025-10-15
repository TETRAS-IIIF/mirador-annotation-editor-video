import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  base: process.env.BASE_PATH || `/${process.env.npm_package_name}/`,
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      external: ['__tests__/*', '__mocks__/*'],
      input: fileURLToPath(new URL('./demo/src/index.html', import.meta.url)),
    },
    sourcemap: true,
  },
});
