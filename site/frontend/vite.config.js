import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-admin-url-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (
            req.url &&
            (req.url === '/admin' ||
              req.url.startsWith('/admin/') ||
              req.url.startsWith('/admin?')) &&
            !req.url.includes('.')
          ) {
            req.url = '/index.html';
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3333',
        changeOrigin: true,
      },
    },
  },
});
