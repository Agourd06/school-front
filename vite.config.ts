import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: Force single React instance to prevent "Cannot set properties of undefined" errors
  // This ensures suneditor-react and other libraries use the same React instance
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5174, // Frontend dev server port
  },
  preview: {
    // Use localhost for local testing, or remove host to use default
    host: 'localhost',
    port: 3833,
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // Let Vite/Rollup handle chunking automatically - avoids circular dependency issues
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    // ⛔ NO manualChunks - let Vite decide to avoid TDZ errors
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'suneditor-react',
      'suneditor',
    ],
    // REMOVED force: true - it causes React duplication in production builds
    // which defeats resolve.dedupe and causes the "Activity" undefined error
  },
})
