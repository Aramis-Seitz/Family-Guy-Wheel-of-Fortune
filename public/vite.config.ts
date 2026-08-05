import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  optimizeDeps: {
    // "shared" is a linked workspace package (CJS build). Vite skips
    // dependency pre-bundling for linked packages by default, so it gets
    // served as raw CommonJS during dev and the browser's native ESM
    // loader can't see any named exports from it. Forcing it through the
    // optimizer runs it through esbuild's CJS->ESM interop instead.
    include: ['shared'],
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'html/index.html'),
        main: resolve(__dirname, 'html/main.html'),
        privacy: resolve(__dirname, 'html/privacy.html'),
        login: resolve(__dirname, 'html/login.html'),
        signup: resolve(__dirname, 'html/signup.html'),
        imprint: resolve(__dirname, 'html/imprint.html')
      },
    },
  },
});