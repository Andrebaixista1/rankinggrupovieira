import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 200,
    },
    proxy: {
      '/api/worldcup-games': {
        target: 'https://worldcup26.ir',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/get/games',
      },
      '/api/worldcup-stadiums': {
        target: 'https://worldcup26.ir',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/get/stadiums',
      },
    },
  },
})
