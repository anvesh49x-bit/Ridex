import "dotenv/config";
import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.js";
import ridesRouter from "./routes/rides.js";
import { db } from "./config/database.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());

// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use("/api/auth", authRouter);
app.use("/api/rides", ridesRouter);

// --------------------------------------------------
// Basic health check
// --------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "RIDEX Backend",
    status: "healthy",
  });
});

// --------------------------------------------------
// Database health check
// --------------------------------------------------

app.get("/health/database", async (_req, res) => {
  try {
    const result = await db.query("SELECT NOW() AS current_time");

    return res.json({
      success: true,
      database: "connected",
      timestamp: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return res.status(500).json({
      success: false,
      database: "unreachable",
      error: "Unable to connect to database",
    });
  }
});

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// --------------------------------------------------
// Global error handler
// --------------------------------------------------

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled server error:", error);

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
);

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`RIDEX backend running on http://localhost:${PORT}`);
});