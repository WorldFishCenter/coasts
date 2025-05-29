import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Polyfill node modules
      "child_process": path.resolve(__dirname, "./src/polyfills/child_process.js"),
      "fs": path.resolve(__dirname, "./src/nodePolyfills.js"),
      "path": path.resolve(__dirname, "./src/nodePolyfills.js"),
      "crypto": path.resolve(__dirname, "./src/nodePolyfills.js"),
      "stream": path.resolve(__dirname, "./src/nodePolyfills.js"),
      "util": path.resolve(__dirname, "./src/nodePolyfills.js")
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor chunks more granularly
          if (id.includes('node_modules')) {
            if (id.includes('mapbox-gl') || id.includes('react-map-gl')) {
              return 'mapbox';
            }
            if (id.includes('@deck.gl')) {
              return 'deck';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('@loaders.gl')) {
              return 'loaders';
            }
            // Other libraries in a separate chunk
            return 'libs';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    exclude: ['@loaders.gl/worker-utils'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'global': 'globalThis',
    'process.platform': '"browser"',
    'process.version': '""'
  }
});
