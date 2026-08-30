import { defineConfig } from 'vite';
import process from 'node:process';

export default defineConfig({
  root: 'frontend',
  publicDir: '../public',
  define: {
    __BUILD_SHA__: JSON.stringify(process.env.BUILD_SHA ?? 'development'),
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
    },
  },
});
