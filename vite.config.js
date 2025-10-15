import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import pkg from './package.json';

const safeName = pkg.name.replace(/[^a-zA-Z0-9]/g, '');
const baseName = pkg.name.startsWith('/') ? pkg.name : `/${pkg.name}/`;

export default defineConfig({
  base: process.env.GITHUB_PAGES
    ? (process.env.BASE_PATH || baseName)
    : '/',

  ...(process.env.GITHUB_PAGES
    ? {
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          external: ['__tests__/*', '__mocks__/*'],
          input: fileURLToPath(new URL('./demo/src/index.html', import.meta.url)),
        },
        sourcemap: true,
      },
    }
    : {
      build: {
        lib: {
          entry: './src/index.js',
          fileName: (format) => (format === 'umd'
            ? `${pkg.name}.js`
            : `${pkg.name}.es.js`),
          formats: ['es', 'umd'],
          name: safeName,
        },
        rollupOptions: {
          external: [
            ...Object.keys(pkg.peerDependencies || {}),
            '__tests__/*',
            '__mocks__/*',
          ],
          output: {
            assetFileNames: `${pkg.name}.[ext]`,
          },
        },
        sourcemap: true,
      },
      esbuild: {
        exclude: [],
        include: [/__tests__\/.*\.(js|jsx)$/, /src\/.*\.jsx?$/],
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
        include: ['@emotion/react'],
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@tests/': fileURLToPath(new URL('./__tests__', import.meta.url)),
        },
      },
      server: {
        open: '/demo/src/index.html',
        port: 4444,
      },
    }),
});
