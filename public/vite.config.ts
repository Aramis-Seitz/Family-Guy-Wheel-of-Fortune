import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'html/index.html'),
        main: resolve(__dirname, 'html/main.html'),
        DaS: resolve(__dirname, 'html/privacy.html'),
        login: resolve(__dirname, 'html/login.html'),
        signup: resolve(__dirname, 'html/signup.html'),
        Imp: resolve(__dirname, 'html/imprint.html')
      },
    },
  },
});