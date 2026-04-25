import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      // Prevent Phaser's dynamic require() from being tree-shaken
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ["phaser"],
  },
});
