import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    outDir: '../custom_components/ha_file_explorer/www',
    emptyOutDir: true
  },
  plugins: [vue()],
  server: {
    proxy: {
      '/ha_file_explorer-api': 'http://localhost:8123'
    }
  },
  resolve: {
    alias: {
      "@": '/src/'
    }
  }
})