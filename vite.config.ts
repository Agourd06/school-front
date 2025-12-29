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
    host: 'appedusolfron.muntadaa.online',
    port: 3833,
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // Enable minification (esbuild is fast and included, or use 'terser' for better compression)
    minify: 'esbuild',
    // Optimize chunk splitting for better caching and smaller initial bundles
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks for better caching
          if (id.includes('node_modules')) {
            // CRITICAL: Bundle suneditor-react with React to access React internals
            // This must be checked BEFORE other react-* packages
            if (id.includes('suneditor-react')) {
              return 'react-vendor';
            }
            // React core libraries - check for exact package paths (most specific first)
            // Use path separators to match exact packages, not packages with "react" in name
            if (
              id.includes('/react/') || 
              id.includes('/react-dom/') ||
              id.includes('\\react\\') || 
              id.includes('\\react-dom\\')
            ) {
              return 'react-vendor';
            }
            // Other React ecosystem packages (check specific packages before general patterns)
            if (id.includes('react-router-dom')) {
              return 'react-router';
            }
            if (id.includes('lucide-react') || id.includes('react-select')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // SunEditor core (without react wrapper)
            if (id.includes('suneditor') && !id.includes('suneditor-react')) {
              return 'editor-vendor';
            }
            // Other vendor libraries
            if (id.includes('axios')) {
              return 'axios-vendor';
            }
            if (id.includes('@hello-pangea/dnd')) {
              return 'dnd-vendor';
            }
            if (id.includes('@react-pdf/renderer')) {
              return 'pdf-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion-vendor';
            }
            // Other vendor libraries
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production for smaller builds
    sourcemap: false,
    // Target modern browsers - updated to es2020 for better compatibility
    target: 'es2020',
    // CommonJS options to handle circular dependencies better
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'react-select',
      '@tanstack/react-query',
      'axios',
      'suneditor-react',
      'suneditor',
    ],
    // REMOVED force: true - it causes React duplication in production builds
    // which defeats resolve.dedupe and causes the "Activity" undefined error
  },
})
