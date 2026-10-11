
require("dotenv").config({ quiet: true });

const dns = require("node:dns");
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("DNS server configuration skipped:", dnsErr.message);
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { initCronJobs } = require("./cron/cronJobs");

const app = express();

// Trust reverse proxy for cloud deployments (Render, Railway, Fly.io, Heroku)
// Required for accurate client IP detection with rate-limiting and secure HTTPS cookies
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// Frontend access configuration
const configuredFrontend = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/+$/, "")
  : null;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  configuredFrontend,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive callback while credentials match origin
    },
    credentials: true,
  })
);

// Parse JSON and cookies
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Rate limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/login", loginLimiter);

// Health check endpoints (used by keep-alive cron and uptime monitors)
app.get("/", (req, res) => {
  res.send("Streakly API is running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes); // Fallback so /api/login and /api/register are supported
app.use("/api/habits", require("./routes/habitRoutes"));
app.use("/api/cron", require("./routes/cronRoutes"));

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    // Initialize scheduled cron jobs
    initCronJobs();

    app.listen(PORT, () => {
      console.log(`Streakly server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
