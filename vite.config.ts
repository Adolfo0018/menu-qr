import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // El SDK de Firebase pesa ~570 kB, pero se descarga aparte y solo al enviar un pedido o abrir el mostrador.
  build: { chunkSizeWarningLimit: 700 },
})
