import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy editor deps in their own chunk
          'editor-core':    ['@tiptap/react', '@tiptap/starter-kit'],
          // Firebase into one chunk
          'firebase':       ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          // React ecosystem
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
