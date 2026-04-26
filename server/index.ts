import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/task";
import expenseRoutes from "./routes/expense";
import policyRoutes from "./routes/policy";
import paymentRoutes from "./routes/payment";
import goalRoutes from "./routes/goal";
import incomeRoutes from "./routes/income";
import adminRoutes from "./routes/admin";
import { connectDB } from "./config/db";

let dbConnected = false;

export async function createServer() {
  const app = express();

  // Connect to MongoDB
  try {
    dbConnected = await connectDB();
  } catch (error) {
    console.warn('⚠️  Database connection failed. API routes will return 503.');
  }

  // Security & Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for file uploads
    crossOriginEmbedderPolicy: false, // Allow embedding
  }));
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' })); // Increase limit for base64 files
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Middleware to check database connection
  const requireDB = (req: any, res: any, next: any) => {
    if (!dbConnected) {
      // In development mode without DB, return 503 to trigger client-side localStorage fallback
      console.warn('⚠️  Database not connected. Set MONGODB_URI environment variable or use free MongoDB Atlas.');
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database not connected. Using client-side storage. Set MONGODB_URI to use MongoDB.',
      });
    }
    next();
  };

  // Initialize Telegram Bot and Cron Jobs (only in production or if explicitly enabled)
  if (process.env.NODE_ENV === "production" && process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const { initializeCronJobs } = await import("./services/cronJobs");
      initializeCronJobs();
      console.log("🤖 Telegram bot and cron jobs initialized");
    } catch (error) {
      console.warn("⚠️  Telegram bot initialization skipped:", (error as Error).message);
    }
  }

  // Special admin setup endpoint (public but requires admin key)
  app.post("/api/setup/make-admin", requireDB, async (req, res) => {
    try {
      const { email, adminKey } = req.body;

      // Simple security check
      const expectedAdminKey = process.env.ADMIN_SETUP_KEY || 'make-admin-2024';
      
      if (adminKey !== expectedAdminKey) {
        return res.status(401).json({ error: 'Invalid admin key' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const { User } = await import('./models/User');
      
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({ error: `User with email "${email}" not found` });
      }

      if (user.role === 'superadmin') {
        return res.json({ 
          message: `User "${email}" is already a superadmin`,
          user: user.toJSON()
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { role: 'superadmin' },
        { new: true }
      ).select('-passwordHash');

      return res.json({ 
        message: `Successfully made "${email}" a superadmin`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Make user admin error:', error);
      return res.status(500).json({ error: 'Failed to make user admin' });
    }
  });

  // API Routes (protected with DB check)
  app.use("/api/auth", requireDB, authRoutes);
  app.use("/api/tasks", requireDB, taskRoutes);
  app.use("/api/expenses", requireDB, expenseRoutes);
  app.use("/api/policies", requireDB, policyRoutes);
  app.use("/api/payments", requireDB, paymentRoutes);
  app.use("/api/goals", requireDB, goalRoutes);
  app.use("/api/income", requireDB, incomeRoutes);
  app.use("/api/admin", requireDB, adminRoutes);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
