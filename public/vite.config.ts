import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import { cpSync, mkdirSync } from 'fs';

function copyStaticAssets(): Plugin {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      mkdirSync('dist/assets', { recursive: true });
      cpSync('assets', 'dist/assets', { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [copyStaticAssets()],
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