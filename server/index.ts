import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  createAnswer,
  vote,
  acceptAnswer,
} from "./routes/questions";
import { register, login, getProfile, authLimiter } from "./routes/auth";
import { authenticateToken, optionalAuth } from "./middleware/auth";
import { connectDB } from "./db/connection";
import { seedDatabase } from "./db/seed";

export async function createServer() {
  const app = express();

  // Initialize database (optional)
  let mongoConnected = false;
  try {
    mongoConnected = await connectDB();
    if (mongoConnected) {
      await seedDatabase();
    } else {
      console.log(
        "📦 Running with mock data - install and start MongoDB for persistence",
      );
    }
  } catch (error) {
    console.warn(
      "⚠️ Database initialization failed, using mock data:",
      error.message,
    );
  }

  // Store MongoDB connection status in app locals for routes to check
  app.locals.mongoConnected = mongoConnected;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", authLimiter, register);
  app.post("/api/auth/login", authLimiter, login);
  app.get("/api/auth/profile", authenticateToken, getProfile);

  // Questions API
  app.get("/api/questions", optionalAuth, getQuestions);
  app.get("/api/questions/:id", optionalAuth, getQuestionById);
  app.post("/api/questions", authenticateToken, createQuestion);
  app.post("/api/answers", authenticateToken, createAnswer);
  app.post("/api/vote", authenticateToken, vote);
  app.post("/api/answers/:id/accept", authenticateToken, acceptAnswer);

  return app;
}
