import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiPort = process.env.API_PORT || 8787

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
          ui: ['react', 'react-dom', 'framer-motion'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': `http://localhost:${apiPort}`,
    },
  },
})
