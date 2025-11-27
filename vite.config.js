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
})
