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
        target: 'http://177.153.62.236:3032',
        changeOrigin: true,
        rewrite: () => '/status',
      },
    },
  },
})
