import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { seo } from './build/seo'

export default defineConfig({
  plugins: [react(), tailwindcss(), seo()],
  build: {
    // The 3D chunk is lazy-loaded (see App.tsx). It's large because R3F registers the whole
    // THREE namespace for JSX, which prevents tree-shaking three.js — expected, not a leak.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('/three/')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
          if (id.includes('/gsap/') || id.includes('/lenis/')) return 'motion'
        },
      },
    },
  },
})
