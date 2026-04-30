import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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