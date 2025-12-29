// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    devSourcemap: true,
  },
  
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        camera: resolve(__dirname, 'camera.html')
      }
    }
  }
})
