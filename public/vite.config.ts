import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'main.html'),
        DaS: resolve(__dirname, 'datenschutz.html'),
        Imp: resolve(__dirname, 'impressum.html')
      },
    },
  },
});