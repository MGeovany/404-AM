import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Multi-page build for a Chrome DevTools extension.
// `manifest.json` lives in public/ and is copied verbatim into dist/.
// The manifest only references devtools.html (stable name); other chunks
// may be hashed because the HTML entries are rewritten by Vite.
export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        devtools: 'devtools.html',
        panel: 'panel.html',
      },
    },
  },
  plugins: [react()],
})
