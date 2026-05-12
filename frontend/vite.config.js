import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During dev, proxy /api → FastAPI so we don't have to deal with CORS in the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
