import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        assetFileNames: '[name][extname]',
        entryFileNames: '[name].js'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      // String shorthand: /api -> http://localhost:5000/api
      '/api': {
        target: 'http://localhost:5000', // Your backend server address
        changeOrigin: true, // Needed for virtual hosted sites
        // secure: false, // Uncomment if your backend uses http (not https) locally - often needed
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if you DON'T want /api prefix forwarded
      },
      // You can add other proxies here if needed, for example for WebSockets
      // '/socket.io': {
      //   target: 'ws://localhost:5000',
      //   ws: true,
      // },
    }
  }
});
