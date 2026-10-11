import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Bundle every dependency into the server build so the API server needs no client node_modules.
  ssr: { noExternal: true },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5050',
      '/uploads': 'http://localhost:5050',
      '/sitemap.xml': 'http://localhost:5050',
      '/robots.txt': 'http://localhost:5050',
    },
  },
});
