import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import pkg from './package.json';

const safeName = pkg.name.replace(/[^a-zA-Z0-9]/g, '');

export default defineConfig({
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
        /^react(\/.*)?$/,        // ensure all react subpaths stay external
        /^react-dom(\/.*)?$/,
      ],
      output: {
        assetFileNames: `${pkg.name}.[ext]`,
        exports: 'named',        // silences "named + default" warning
        globals: {               // silences "guessing global" warnings
          react: 'React',
          'react-dom': 'ReactDOM',
          'prop-types': 'PropTypes',
          uuid: 'uuid',
        },
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

});
