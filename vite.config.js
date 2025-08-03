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
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: (id) => {
        // Handle Rollup native binary resolution issues
        if (id.includes('@rollup/rollup-')) {
          return false;
        }
        return false;
      },
      output: {
        manualChunks: {
          'deck.gl': ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/react', '@deck.gl/aggregation-layers'],
          'mapbox': ['mapbox-gl', 'react-map-gl'],
          'charts': ['recharts', 'd3'],
          'ui': ['lucide-react', '@radix-ui/react-slot', 'rc-slider']
        }
      }
    }
  }
});
