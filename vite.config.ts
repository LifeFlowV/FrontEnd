import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Em desenvolvimento, o proxy mantém front e API na mesma origem (cookies de sessão e CSRF funcionam sem CORS).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.VITE_API_TARGET ?? 'http://localhost:8080', changeOrigin: false } },
  },
});
