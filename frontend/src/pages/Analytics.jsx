
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const COLORS = ["#315c40", "#80a984", "#c3d9b9", "#e5b96b", "#8b9eae"];

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function Analytics() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setError("");

      const [userResponse, habitsResponse] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/habits`, { withCredentials: true }),
      ]);

      setUser(userResponse.data.user);

      setHabits(
        Array.isArray(habitsResponse.data)
          ? habitsResponse.data
          : habitsResponse.data.habits || []
      );
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <main className="streakly-loading">
        <div className="loading-mark">S</div>
        <p>Loading analytics...</p>
      </main>
    );
  }

  const todayKey = dateKey(new Date());

  const completedToday = habits.filter((habit) =>
    (habit.completionDates || []).includes(todayKey)
  ).length;

  const totalCompletions = habits.reduce(
    (total, habit) =>
      total + (habit.completionDates || []).length,
    0
  );

  const completionRate = habits.length
    ? Math.round((completedToday / habits.length) * 100)
    : 0;

  const weeklyData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const key = dateKey(date);

    const completed = habits.reduce(
      (count, habit) =>
        count +
        ((habit.completionDates || []).includes(key) ? 1 : 0),
      0
    );

    return {
      day: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      completed,
    };
  });

  const categoryCounts = {};

  habits.forEach((habit) => {
    const category = habit.category || "Other";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <div className="streakly-app">
      <Sidebar user={user} />

      <main className="streakly-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">YOUR PERSONAL INSIGHTS</p>
            <h1>Analytics</h1>
            <p className="header-subtitle">
              See your progress, recognize patterns, and stay consistent.
            </p>
          </div>

          <div className="user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
        </header>

        {error && (
          <div className="dashboard-alert" role="alert">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Total habits</span>
            <strong>{habits.length}</strong>
          </article>

          <article className="stat-card">
            <span className="stat-label">Completed today</span>
            <strong>{completedToday}</strong>
          </article>

          <article className="stat-card">
            <span className="stat-label">Today's completion</span>
            <strong>{completionRate}%</strong>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </article>

          <article className="stat-card">
            <span className="stat-label">Recorded completions</span>
            <strong>{totalCompletions}</strong>
          </article>
        </section>

        <section className="habit-section" style={{ marginBottom: 22 }}>
          <p className="eyebrow">LAST SEVEN DAYS</p>
          <h2>Weekly activity</h2>
          <p className="header-subtitle">
            Number of recorded habit completions per day.
          </p>

          <div style={{ width: "100%", height: 300, marginTop: 25 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="completed"
                  name="Completions"
                  fill="#315c40"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="habit-section">
          <p className="eyebrow">YOUR ROUTINE</p>
          <h2>Habits by category</h2>

          {categoryData.length === 0 ? (
            <div className="empty-habits">
              <h3>No habits to analyze yet</h3>
              <p>Create habits on your dashboard to see this chart.</p>
            </div>
          ) : (
            <>
              <div style={{ width: "100%", height: 300, marginTop: 15 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {categoryData.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="habit-list">
                {categoryData.map((item, index) => (
                  <div className="habit-row" key={item.name}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 4,
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                    <div className="habit-details">
                      <h4>{item.name}</h4>
                    </div>
                    <span className="habit-status">
                      {item.value} habit(s)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
