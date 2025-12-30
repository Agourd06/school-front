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
    // Use terser instead of esbuild - more compatible with third-party libraries
    // esbuild is too aggressive and breaks libraries like SunEditor
    minify: 'terser',
    terserOptions: {
      compress: {
        defaults: false, // Avoid breaking third-party libs
      },
      mangle: false, // VERY IMPORTANT - prevents breaking runtime bindings
    } as any, // Type assertion needed - Vite's terser types may be incomplete
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 2500, // Increased to allow lazy-loaded PDF chunk (~2MB)
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
