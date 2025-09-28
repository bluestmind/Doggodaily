import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'


export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    // Define environment variables for build - force HTTPS
    'import.meta.env.VITE_API_URL': JSON.stringify('https://doggodaiily.com/api'),
    'import.meta.env.VITE_FILE_BASE_URL': JSON.stringify('https://doggodaiily.com'),
    // Additional fallback definitions
    'process.env.VITE_API_URL': JSON.stringify('https://doggodaiily.com/api'),
    'process.env.VITE_FILE_BASE_URL': JSON.stringify('https://doggodaiily.com')
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
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
  }
})
