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
    port: 5174,
    strictPort: true,
    proxy: {
      '/api/worldcup-games': {
        target: 'https://site.api.espn.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719',
      },
      '/api/europa5-stats': {
        target: 'https://app.apivieiracred.com.br',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/webhook/api/saldo',
      },
    },
  },
})
