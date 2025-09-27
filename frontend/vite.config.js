import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0', // Allow external connections
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '46.101.244.203',
      'www.doggodaiily.com',
      'doggodaiily.com'
    ],
  },
  build: {
    outDir: 'dist',
  },
  env: {
    VITE_API_URL: 'https://www.doggodaiily.com/api'
  }
})
