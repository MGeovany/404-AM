import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Multi-page build for a Chrome DevTools extension.
// `manifest.json` lives in public/ and is copied verbatim into dist/.
// The manifest only references devtools.html (stable name); other chunks
// may be hashed because the HTML entries are rewritten by Vite.
//
// `@source` resolves to the DevTools data source here; the Safari build
// (vite.safari.config.ts) points it at the injected-content-script source.
export default defineConfig({
  publicDir: 'public',
  resolve: {
    alias: {
      '@source': fileURLToPath(new URL('./src/data/devtoolsSource.ts', import.meta.url)),
    },
  },
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
