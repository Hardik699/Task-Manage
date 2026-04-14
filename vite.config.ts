import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "index.html"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      try {
        // Lazy load the server to avoid issues during config initialization
        const { createServer } = await import("./server/index.ts");
        const app = await createServer();

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);
        console.log("✓ Express server middleware initialized");
      } catch (error) {
        console.warn("⚠️  Error initializing Express server:", (error as Error).message);
        console.warn("   Some API features may be unavailable. For full functionality:");
        console.warn("   1. Set MONGODB_URI environment variable");
        console.warn("   2. Ensure MongoDB is running");
      }
    },
  };
}
