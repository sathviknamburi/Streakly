
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categories = [
  "Health",
  "Learning",
  "Fitness",
  "Mindfulness",
  "Other",
];

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({
    name: "",
    category: "Learning",
    frequency: "Daily",
  });

  const today = getToday();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
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
        err.response?.data?.message ||
          "Could not load your dashboard. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const completedCount = habits.filter((habit) =>
    (habit.completionDates || []).includes(today)
  ).length;

  const progress =
    habits.length === 0
      ? 0
      : Math.round((completedCount / habits.length) * 100);

  const filteredHabits = habits.filter((habit) => {
    const completed = (habit.completionDates || []).includes(today);

    if (filter === "Completed") return completed;
    if (filter === "Remaining") return !completed;

    return true;
  });

  async function addHabit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter a habit name.");
      return;
    }

    setSaving(true);

    try {
      const response = await axios.post(
        `${API}/habits`,
        {
          name: form.name.trim(),
          category: form.category,
          frequency: form.frequency,
        },
        { withCredentials: true }
      );

      const newHabit = response.data.habit || response.data;

      if (newHabit?._id || newHabit?.id) {
        setHabits((current) => [newHabit, ...current]);
      } else {
        await loadDashboard();
      }

      setForm({
        name: "",
        category: "Learning",
        frequency: "Daily",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to add this habit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleHabit(id) {
    setError("");

    try {
      const response = await axios.patch(
        `${API}/habits/${id}/toggle`,
        {},
        { withCredentials: true }
      );

      const updatedHabit = response.data.habit || response.data;

      if (updatedHabit?.completionDates) {
        setHabits((current) =>
          current.map((habit) =>
            String(habit._id || habit.id) === String(id)
              ? updatedHabit
              : habit
          )
        );
      } else {
        await loadDashboard();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update this habit."
      );
    }
  }

  async function deleteHabit(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this habit?"
    );

    if (!confirmed) return;

    setError("");

    try {
      await axios.delete(`${API}/habits/${id}`, {
        withCredentials: true,
      });

      setHabits((current) =>
        current.filter(
          (habit) => String(habit._id || habit.id) !== String(id)
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this habit."
      );
    }
  }

  async function logout() {
    try {
      await axios.post(
        `${API}/auth/logout`,
        {},
        { withCredentials: true }
      );

      navigate("/login", { replace: true });
    } catch (err) {
      setError("Logout failed. Please try again.");
    }
  }

  if (loading) {
    return (
      <main className="streakly-loading">
        <div className="loading-mark">S</div>
        <p>Preparing your dashboard...</p>
      </main>
    );
  }

  return (
    <div className="streakly-app">
      <aside className="streakly-sidebar">
        <Link to="/dashboard" className="streakly-brand">
          <span className="brand-mark">S</span>
          <span>streakly</span>
        </Link>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="streakly-nav">
          <Link to="/dashboard" className="nav-item active">
            <span>▦</span> Dashboard
          </Link>
          <Link to="/habits" className="nav-item">
            <span>✓</span> My Habits
          </Link>
          <Link to="/analytics" className="nav-item">
            <span>▥</span> Analytics
          </Link>
          <Link to="/profile" className="nav-item">
            <span>◎</span> My Profile
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span>✦ Your daily reminder</span>
            <p>Small steps every day lead to big changes.</p>
          </div>

          <button className="logout-button" onClick={logout}>
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="streakly-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">YOUR PERSONAL SPACE</p>
            <h1>Good to see you{user?.name ? `, ${user.name}` : ""}!</h1>
            <p className="header-subtitle">
              Build consistency, one day at a time.
            </p>
          </div>

          <div className="user-avatar">
            {(user?.name || user?.email || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
        </header>

        {error && (
          <div className="dashboard-alert" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        <section className="welcome-banner">
          <div>
            <span className="banner-tag">TODAY'S FOCUS</span>
            <h2>Make today count.</h2>
            <p>
              You don't need to be perfect. Just keep showing up.
            </p>
          </div>

          <div className="banner-symbol" aria-hidden="true">
            ✳
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Total habits</span>
            <strong>{habits.length}</strong>
            <span className="stat-note">Habits you're building</span>
          </article>

          <article className="stat-card">
            <span className="stat-label">Completed today</span>
            <strong>{completedCount}</strong>
            <span className="stat-note">Out of {habits.length} habits</span>
          </article>

          <article className="stat-card">
            <span className="stat-label">Daily progress</span>
            <strong>{progress}%</strong>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </article>
        </section>

        <section className="habit-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STAY CONSISTENT</p>
              <h2>Today's habits</h2>
            </div>

            <span className="habit-count">
              {completedCount}/{habits.length} done
            </span>
          </div>

          <form className="add-habit-form" onSubmit={addHabit}>
            <div className="form-field habit-name-field">
              <label htmlFor="habit-name">New habit</label>
              <input
                id="habit-name"
                type="text"
                maxLength={80}
                placeholder="e.g. Read for 20 minutes"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="habit-category">Category</label>
              <select
                id="habit-category"
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="habit-frequency">Frequency</label>
              <select
                id="habit-frequency"
                value={form.frequency}
                onChange={(event) =>
                  setForm({ ...form, frequency: event.target.value })
                }
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            <button className="add-habit-button" type="submit" disabled={saving}>
              {saving ? "Adding..." : "+ Add habit"}
            </button>
          </form>

          <div className="habit-toolbar">
            <h3>Your routine</h3>

            <div className="habit-filters">
              {["All", "Remaining", "Completed"].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "filter-button selected" : "filter-button"}
                  onClick={() => setFilter(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredHabits.length === 0 ? (
            <div className="empty-habits">
              <div className="empty-symbol">✳</div>
              <h3>
                {habits.length === 0
                  ? "Start with one small habit"
                  : "Nothing to show here"}
              </h3>
              <p>
                {habits.length === 0
                  ? "Add a habit above and start building your routine."
                  : "Try another filter to see your habits."}
              </p>
            </div>
          ) : (
            <div className="habit-list">
              {filteredHabits.map((habit) => {
                const id = habit._id || habit.id;
                const completed = (habit.completionDates || []).includes(today);

                return (
                  <article
                    className={completed ? "habit-row completed" : "habit-row"}
                    key={id}
                  >
                    <button
                      className={
                        completed ? "habit-check checked" : "habit-check"
                      }
                      type="button"
                      aria-label={
                        completed
                          ? `Mark ${habit.name} incomplete`
                          : `Complete ${habit.name}`
                      }
                      onClick={() => toggleHabit(id)}
                    >
                      {completed ? "✓" : ""}
                    </button>

                    <div className="habit-details">
                      <h4>{habit.name}</h4>
                      <p>
                        {habit.category || "Other"} · {habit.frequency || "Daily"}
                      </p>
                    </div>

                    <span className="habit-status">
                      {completed ? "Completed" : "In progress"}
                    </span>

                    <button
                      className="delete-habit-button"
                      type="button"
                      aria-label={`Delete ${habit.name}`}
                      onClick={() => deleteHabit(id)}
                    >
                      ×
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          Made for progress, not perfection. <span>✦</span>
        </footer>
      </main>
    </div>
  );
}
