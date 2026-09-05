import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./config/supabase.js";

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
// Supabase database health check
// --------------------------------------------------

app.get("/health/database", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("health_check")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase response:", error);

      return res.status(200).json({
        success: true,
        supabase: "reachable",
        database: "connection_attempted",
        error: error.message,
        code: error.code,
      });
    }

    return res.json({
      success: true,
      supabase: "reachable",
      database: "connected",
      data,
    });
  } catch (error) {
    console.error("Supabase connection error:", error);

    return res.status(500).json({
      success: false,
      supabase: "unreachable",
    });
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`RIDEX backend running on http://localhost:${PORT}`);
});