import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        shop: resolve(import.meta.dirname, 'shop.html'),
        checkout: resolve(import.meta.dirname, 'checkout.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
        showcase: resolve(import.meta.dirname, 'showcase.html'),
      },
    },
  },
});
