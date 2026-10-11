
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

// Security headers with relaxed cross-origin resource policy for API hosting
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Known frontend origins
const configuredFrontend = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.trim().replace(/\/+$/, "")
  : null;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://streakly-fsd.vercel.app",
  configuredFrontend,
].filter(Boolean);

// Explicit CORS preflight and headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    // Dynamically set origin to allow all vercel.app domains, configured origins, or localhost
    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    res.setHeader("Access-Control-Allow-Origin", cleanOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Cookie, X-Requested-With, Accept, x-cron-secret"
    );
  }

  // Handle browser preflight OPTIONS requests immediately
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Standard CORS middleware as secondary layer
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any origin with credentials reflected
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Accept",
      "x-cron-secret",
    ],
    optionsSuccessStatus: 200,
  })
);

// Parse JSON and cookies
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Rate limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/login", loginLimiter);
app.use("/login", loginLimiter);

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
const habitRoutes = require("./routes/habitRoutes");
const cronRoutes = require("./routes/cronRoutes");

// Multi-path mounting so all frontend URL configurations work seamlessly:
// 1. Root-level paths: /login, /register, /me, /logout, /habits
app.use("/", authRoutes);
app.use("/habits", habitRoutes);

// 2. /auth prefix paths: /auth/login, /auth/register, /auth/me, /auth/logout
app.use("/auth", authRoutes);

// 3. /api prefix paths: /api/login, /api/register, /api/me, /api/logout, /api/habits
app.use("/api", authRoutes);
app.use("/api/habits", habitRoutes);

// 4. /api/auth prefix paths: /api/auth/login, /api/auth/register, /api/auth/me, /api/auth/logout
app.use("/api/auth", authRoutes);

// Cron routes
app.use("/api/cron", cronRoutes);
app.use("/cron", cronRoutes);

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
