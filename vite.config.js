import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/freetogame': {
        target: 'https://www.freetogame.com/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/freetogame/, ''),
      },
      '/api/cheapshark': {
        target: 'https://www.cheapshark.com/api/1.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cheapshark/, ''),
      },
    },
  },
})
