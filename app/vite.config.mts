import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@mysten/walrus', '@mysten/walrus-wasm'],
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Don't externalize @mysten/walrus-wasm
        if (id.includes('@mysten/walrus-wasm')) {
          return false;
        }
        return false;
      }
    }
  }
});
