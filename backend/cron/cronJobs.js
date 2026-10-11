const cron = require("node-cron");
const Habit = require("../models/Habit");

/**
 * Calculates YYYY-MM-DD string for a given date offset.
 */
function getDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Daily maintenance routine:
 * - Evaluates habit completion status across all users
 * - Logs streak health and summaries
 * - Can be triggered automatically by cron or externally via API
 */
async function runDailyStreakMaintenance() {
  const timestamp = new Date().toISOString();
  console.log(`[CRON ${timestamp}] Starting daily habit and streak maintenance...`);

  try {
    const yesterday = getDateString(-1);
    const today = getDateString(0);

    const habits = await Habit.find({});
    let completedYesterday = 0;
    let completedToday = 0;

    for (const habit of habits) {
      const dates = habit.completionDates || [];
      if (dates.includes(yesterday)) {
        completedYesterday++;
      }
      if (dates.includes(today)) {
        completedToday++;
      }
    }

    const summary = {
      timestamp,
      totalHabits: habits.length,
      completedYesterday,
      completedToday,
      status: "completed",
    };

    console.log(
      `[CRON ${timestamp}] Maintenance finished: ${habits.length} habits tracked, ` +
      `${completedYesterday} completed yesterday (${yesterday}), ${completedToday} completed today (${today}).`
    );

    return summary;
  } catch (error) {
    console.error(`[CRON ${timestamp}] Daily streak maintenance failed:`, error.message);
    throw error;
  }
}

/**
 * Keep-alive ping:
 * Prevents free-tier hosting (Render, Railway, etc.) from sleeping.
 */
async function pingServerKeepAlive() {
  const targetUrl = process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL;

  if (!targetUrl) {
    // If no public URL is configured, skip external ping
    return;
  }

  const cleanUrl = targetUrl.replace(/\/+$/, "");
  const pingUrl = `${cleanUrl}/api/health`;

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      headers: { "User-Agent": "Streakly-Cron-KeepAlive/1.0" },
    });

    console.log(`[CRON ${new Date().toISOString()}] Keep-alive ping to ${pingUrl} status: ${res.status}`);
  } catch (error) {
    console.warn(`[CRON ${new Date().toISOString()}] Keep-alive ping to ${pingUrl} warning: ${error.message}`);
  }
}

/**
 * Initializes all scheduled cron jobs.
 */
function initCronJobs() {
  const timezone = process.env.CRON_TIMEZONE || "UTC";

  // 1. Midnight Daily Maintenance: Runs every day at 00:00 (midnight)
  // Schedule: '0 0 * * *'
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        await runDailyStreakMaintenance();
      } catch (err) {
        console.error("[CRON] Daily job execution error:", err.message);
      }
    },
    {
      scheduled: true,
      timezone: timezone,
    }
  );

  console.log(`[CRON] Daily streak maintenance scheduled for midnight (00:00 ${timezone})`);

  // 2. Keep-Alive Ping: Runs every 14 minutes
  // Schedule: '*/14 * * * *'
  cron.schedule(
    "*/14 * * * *",
    async () => {
      await pingServerKeepAlive();
    },
    {
      scheduled: true,
    }
  );

  console.log("[CRON] Keep-alive ping job scheduled for every 14 minutes");
}

module.exports = {
  initCronJobs,
  runDailyStreakMaintenance,
  pingServerKeepAlive,
};
