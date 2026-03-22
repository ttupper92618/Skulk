import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:52415',
        changeOrigin: true,
      },
      '/state': {
        target: 'http://localhost:52415',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://localhost:52415',
        changeOrigin: true,
      },
      '/config': {
        target: 'http://localhost:52415',
        changeOrigin: true,
      },
      '/store': {
        target: 'http://localhost:52415',
        changeOrigin: true,
      },
      '/models': {
        target: 'http://localhost:52415',
        changeOrigin: true,
      },
      '/node': {
        target: 'http://localhost:52415',
        changeOrigin: true,
      },
    },
  },
});
