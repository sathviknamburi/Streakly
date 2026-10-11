const express = require("express");
const { runDailyStreakMaintenance } = require("../cron/cronJobs");

const router = express.Router();

/**
 * GET /api/cron/keep-alive
 * Lightweight ping route for keep-alive pings and uptime monitors
 */
router.get("/keep-alive", (req, res) => {
  res.json({
    status: "alive",
    message: "Streakly keep-alive ping successful",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

/**
 * POST or GET /api/cron/daily-check
 * Triggers daily streak & habit maintenance
 * Can be called by external cron services (cron-job.org, EasyCron, Render Cron, GitHub Actions)
 */
async function handleDailyCheck(req, res) {
  try {
    const configuredSecret = process.env.CRON_SECRET;
    const providedSecret =
      req.headers["x-cron-secret"] ||
      req.query.secret ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    // If CRON_SECRET is configured in .env, enforce authorization
    if (configuredSecret && providedSecret !== configuredSecret) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or missing CRON_SECRET.",
      });
    }

    const result = await runDailyStreakMaintenance();
    return res.json({
      success: true,
      message: "Daily streak maintenance executed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Cron daily-check endpoint error:", error.message);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
}

router.get("/daily-check", handleDailyCheck);
router.post("/daily-check", handleDailyCheck);

module.exports = router;
