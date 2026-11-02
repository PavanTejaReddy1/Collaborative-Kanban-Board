import { defineConfig } from 'vite'

/**
 * Vite 8 handles React JSX natively — no @vitejs/plugin-react needed.
 * The dev proxy forwards /api and /socket.io to the Express server,
 * eliminating CORS complexity during local development.
 */
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
