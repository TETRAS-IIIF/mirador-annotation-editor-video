import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs/promises';
import pkg from './package.json';

export default defineConfig({
  plugins: [react(
    {
      jsxRuntime: 'automatic',
    },
  )],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'load-js-files-as-jsx',
          // TODO: rename all our files to .jsx ...

          // eslint-disable-next-line require-jsdoc
          setup(build) {
            build.onLoad({ filter: /(src|__tests__)\/.*\.js$/ }, async (args) => ({
              contents: await fs.readFile(args.path, 'utf8'),
              loader: 'jsx',
            }));
          },
        },
      ],
    },
    include: [
      '@emotion/react', '@mui/material/', 'mirador',
    ],
  },
  server: {
    open: './demo/src/index.html', // Öffnet den Browser automatisch
    port: 3000, // Der Port, auf dem die Entwicklungsumgebung läuft
  },
  build: {
    outDir: 'dist', // Der Ordner, in dem die Produktions-Build-Dateien gespeichert werden
    sourcemap: true,
    rollupOptions: {
      external: [...Object.keys(pkg.peerDependencies || {}), '__tests__/*', '__mocks__/*'],
      input: './demo/src/index.html',
    },
  },
  esbuild: {
    exclude: [],
    // Matches .js and .jsx in __tests__ and .jsx in src
    include: [/__tests__\/.*\.(js|jsx)$/, /src\/.*\.jsx?$/],
    loader: 'jsx',
  },
});
