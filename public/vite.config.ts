import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'public/html/index.html'),
        main: resolve(__dirname, 'public/html/main.html'),
        DaS: resolve(__dirname, 'public/html/datenschutz.html'),
        login: resolve(__dirname, 'public/html/login.html'),
        signup: resolve(__dirname, 'public/html/signup.html'),
        Imp: resolve(__dirname, 'public/html/impressum.html')
      },
    },
  },
});