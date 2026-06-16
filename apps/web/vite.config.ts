import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

function manualChunks(id: string) {
  if (!id.includes("/node_modules/")) {
    return undefined;
  }

  if (
    id.includes("/node_modules/react/") ||
    id.includes("/node_modules/react-dom/") ||
    id.includes("/node_modules/scheduler/")
  ) {
    return "react-vendor";
  }

  if (
    id.includes("/node_modules/konva/") ||
    id.includes("/node_modules/react-konva/")
  ) {
    return "canvas-vendor";
  }

  if (
    id.includes("/node_modules/yjs/") ||
    id.includes("/node_modules/y-websocket/") ||
    id.includes("/node_modules/y-indexeddb/") ||
    id.includes("/node_modules/y-protocols/") ||
    id.includes("/node_modules/lib0/")
  ) {
    return "collaboration-vendor";
  }

  return "vendor";
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  },
  server: {
    host: "127.0.0.1"
  },
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"]
  }
});
