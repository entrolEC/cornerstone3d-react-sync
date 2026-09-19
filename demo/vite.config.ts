import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // The demo runs against the library source, not dist — what you read in the
  // code panels is what is executing on the page.
  resolve: {
    alias: {
      'react-cornerstone3d': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
  esbuild: { jsx: 'automatic' },
  // The DICOM loader spawns `new Worker(new URL('./decodeImageFrameWorker.js',
  // import.meta.url))`. Pre-bundled into .vite/deps that URL points at a file
  // that isn't there, and every image decode fails silently.
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    // Excluding the loader takes its CommonJS dependencies out of
    // pre-bundling too, and the browser can't import those raw.
    include: [
      'dicom-parser',
      '@cornerstonejs/codec-charls/decodewasmjs',
      '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
      '@cornerstonejs/codec-openjpeg/decodewasmjs',
      '@cornerstonejs/codec-openjph/wasmjs',
    ],
  },
  worker: { format: 'es' },
  base: './',
});
