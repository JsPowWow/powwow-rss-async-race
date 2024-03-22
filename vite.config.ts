import { defineConfig } from 'vite';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        race: resolve(__dirname, 'app/pages/race/index.html'),
      },
    },
  },
});
