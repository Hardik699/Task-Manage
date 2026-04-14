import path from "node:path";
import { createServer } from "./index";
import express from "express";
import { seedAdmin } from "./seed/adminSeed";

const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

async function start() {
  try {
    // Seed admin user if not exists (production only)
    if (process.env.NODE_ENV === "production") {
      await seedAdmin().catch((err) => {
        console.warn("Admin seed warning:", err.message);
      });
    }

    const app = await createServer();

    // Serve static files
    app.use(express.static(distPath));

    // Handle React Router - serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      res.sendFile(path.join(distPath, "index.html"));
    });

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Fusion Starter server running on port ${port}`);
      console.log(`📱 Frontend: http://localhost:${port}`);
      console.log(`🔧 API: http://localhost:${port}/api`);
      console.log(`✅ Server is ready to accept connections`);
    });

    // Keep the process alive
    server.on('error', (error) => {
      console.error('Server error:', error);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🛑 Received SIGTERM, shutting down gracefully");
      server.close(() => {
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("🛑 Received SIGINT, shutting down gracefully");
      server.close(() => {
        process.exit(0);
      });
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit the process
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Don't exit the process
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
