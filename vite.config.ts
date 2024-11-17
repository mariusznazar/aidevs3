import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/xyz': {
        target: 'https://xyz.ag3nts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/xyz/, '')
      },
      '/central': {
        target: 'https://centrala.ag3nts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/central/, '')
      },
      '/audio': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/proxy': 'http://localhost:3000'
    }
  }
})
