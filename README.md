# Streakly 🚀

Streakly is a modern, full-stack habit tracking web application designed to help users build consistency and track daily streaks across personal routines.

---

## 🛠 Tech Stack

- **Frontend**: React (Vite), React Router v7, Recharts, Axios, Vanilla CSS design system.
- **Backend**: Node.js, Express 5, MongoDB (Mongoose), JWT authentication with HttpOnly cookies & Bearer fallback, Helmet, Rate Limiting.
- **Cron Engine**: `node-cron` scheduled background workers, dedicated HTTP webhook endpoints (`/api/cron/*`), and GitHub Actions keep-alive workflows.

---

## ⏰ Cron Jobs System

Streakly includes a multi-tiered cron system tailored for production and cloud hosting:

### 1. Internal Scheduled Cron (`backend/cron/cronJobs.js`)
- **Daily Streak Maintenance (`0 0 * * *`)**:
  - Runs automatically every day at midnight (`00:00`).
  - Scans active habits across all users, logs daily completion rates, checks streak progression, and provides maintenance statistics.
  - Timezone can be configured via `CRON_TIMEZONE` (defaults to `UTC`).
- **Keep-Alive Self-Ping (`*/14 * * * *`)**:
  - Runs every 14 minutes.
  - Automatically pings `${SERVER_URL}/api/health` so free-tier servers (e.g. Render, Railway) do not go to sleep when active.

### 2. External HTTP Cron Webhook (`backend/routes/cronRoutes.js`)
For services like [cron-job.org](https://cron-job.org), Render Cron Jobs, EasyCron, or cloud schedulers:
- `GET /api/cron/keep-alive`: Lightweight ping endpoint for uptime monitors.
- `GET/POST /api/cron/daily-check`: Triggers the daily streak maintenance routine on demand.
  - Protected by `CRON_SECRET` header (`x-cron-secret`) or query param (`?secret=...`).

### 3. GitHub Actions Cron Workflow (`.github/workflows/keep-alive.yml`)
- Free cloud tiers (such as Render) put servers into sleep mode after 15 minutes of inactivity, which pauses internal `node-cron`.
- This GitHub Actions workflow runs on GitHub's infrastructure every 14 minutes and pings your deployed backend URL (`secrets.BACKEND_URL`), keeping your backend awake 24/7 without paid hosting.

---

## 🚀 Deployment Guide

### A. Deploy Backend (e.g., Render / Railway)

1. **Create Web Service**:
   - Connect your GitHub repository.
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
2. **Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production security flags |
   | `PORT` | `5000` | (Or host assigned port) |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB connection string |
   | `JWT_SECRET` | `your_secure_secret_key` | Secret key for JWT signing (>= 32 chars) |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` | **Exact** frontend URL without trailing slash |
   | `SERVER_URL` | `https://your-backend.onrender.com` | Deployed backend URL for self-ping keep-alive |
   | `CRON_TIMEZONE` | `UTC` | Timezone for midnight reset (optional, e.g. `Asia/Kolkata`) |
   | `CRON_SECRET` | `your_random_secret_token` | Optional secret to secure external cron triggers |

---

### B. Deploy Frontend (e.g., Vercel / Netlify)

1. **Create Project**:
   - Connect your GitHub repository.
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. **Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` | Deployed backend API URL with `/api` and **no trailing slash** |
3. **SPA Routing**:
   - `frontend/vercel.json` is already configured with rewrite rules so direct page refreshes on `/dashboard`, `/habits`, `/analytics`, and `/profile` route cleanly to `index.html`.

---

### C. Enable GitHub Actions Keep-Alive Ping (Render Free Tier)

1. Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Name: `BACKEND_URL`
4. Value: `https://your-backend.onrender.com` (your deployed backend base URL).
5. The scheduled action will automatically ping your server every 14 minutes to prevent cold starts!

---

## 💻 Local Development

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```