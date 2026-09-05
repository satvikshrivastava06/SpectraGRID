import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// cssMinify: 'esbuild' — pins CSS minification to esbuild instead of the
// Vite 8 default (lightningcss) which has a confirmed bug that drops the
// standard `backdrop-filter` property when `-webkit-backdrop-filter` is also
// present, breaking the frosted-glass effect on Chromium in production builds.
export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: 'esbuild',
  },
})
