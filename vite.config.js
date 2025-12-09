import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true, // Allows access from network (e.g. mobile)
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
  },
  resolve: {
    alias: {
      // This maps 'buffer' imports to the 'buffer' package
      buffer: 'buffer/',
    },
  },
  define: {
    // This makes 'global' and 'process.env.NODE_ENV' available
    global: 'globalThis', // Use globalThis for browser compatibility
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
})
