import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import pkg from './package.json';

const baseName = pkg.name.startsWith('/') ? pkg.name : `/${pkg.name}/`;

export default defineConfig({
  base: process.env.GITHUB_PAGES
    ? (process.env.BASE_PATH || baseName)
    : '/',

  ...(process.env.GITHUB_PAGES
    ? {
      build: {
        emptyOutDir: true,
        outDir: 'dist',
        rollupOptions: {
          external: ['__tests__/*', '__mocks__/*'],
          input: fileURLToPath(new URL('./demo/src/index.html', import.meta.url)),
        },
        sourcemap: true,
      },
    }
    : {
      esbuild: {
        exclude: [],
        include: /(src|__tests__)\/.*\.jsx?$/,
        loader: 'jsx',
      },
      optimizeDeps: {
        esbuildOptions: {
          plugins: [
            {
              name: 'load-js-files-as-jsx',

              setup(build) {
                build.onLoad({ filter: /(src|__tests__)\/.*\.js$/ }, async (args) => ({
                  contents: await fs.readFile(args.path, 'utf8'),
                  loader: 'jsx',
                }));
              },
            },
          ],
        },
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@tests': fileURLToPath(new URL('./__tests__', import.meta.url)),
        },
      },
      test: {
        coverage: {
          all: true,
          enabled: true,
        },
        environment: 'happy-dom',
        exclude: ['node_modules'],
        globals: true,
        include: ['**/*.test.js', '**/*.test.jsx'],
        sequence: {
          shuffle: true,
        },
        setupFiles: ['./setupTest.js'],
      },
    }
  ),
});
