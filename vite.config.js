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
      '/api/update-metrics': {
        target: 'http://85.31.61.242:3099',
        changeOrigin: true,
        rewrite: () => '/',
      },
      '/api': {
        target: 'http://85.31.61.242:3066',
        changeOrigin: true,
      },
    },
  },
})
