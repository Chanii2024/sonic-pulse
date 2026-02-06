import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'VTM - Video to MP3',
        short_name: 'VTM',
        description: 'High-performance Video to MP3 converter',
        theme_color: '#000000'
      }
    })
  ],
})
