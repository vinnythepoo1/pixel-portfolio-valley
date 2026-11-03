import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' keeps asset paths relative so the build works on GitHub Pages sub-paths.
// Two pages: the Data Observatory (index.html) and the original pixel town (town.html).
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        town: resolve(import.meta.dirname, 'town.html'),
      },
    },
  },
});
