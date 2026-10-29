import { defineConfig } from 'vite';

// base './' keeps asset paths relative so the build works on GitHub Pages sub-paths.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
});
