
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      includeAssets: ['icon-512.svg', 'icon-192.svg', 'metadata.json'],
      manifest: {
        short_name: "Tha Booth",
        name: "Tha Booth",
        description: "AI Audio Enhancer for real-time processing of calls, meetings, and any system audio. Process sound from any tab or application.",
        icons: [
          {
            "src": "/icon-192.svg",
            "type": "image/svg+xml",
            "sizes": "192x192",
            "purpose": "any maskable"
          },
          {
            "src": "/icon-512.svg",
            "type": "image/svg+xml",
            "sizes": "512x512",
            "purpose": "any maskable"
          }
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#111827",
        background_color: "#111827"
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
