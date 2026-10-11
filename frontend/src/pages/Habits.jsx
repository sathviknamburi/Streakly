
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToday() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function Habits() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const today = getToday();

  const loadHabits = useCallback(async () => {
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

      setError(err.response?.data?.message || "Unable to load habits.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  async function toggleHabit(id) {
    try {
      setError("");

      const response = await axios.patch(
        `${API}/habits/${id}/toggle`,
        {},
        { withCredentials: true }
      );

      setHabits((current) =>
        current.map((habit) =>
          String(habit._id) === String(id) ? response.data : habit
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update habit.");
    }
  }

  async function deleteHabit(id) {
    if (!window.confirm("Delete this habit permanently?")) return;

    try {
      await axios.delete(`${API}/habits/${id}`, {
        withCredentials: true,
      });

      setHabits((current) =>
        current.filter((habit) => String(habit._id) !== String(id))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete habit.");
    }
  }

  const filteredHabits = habits.filter((habit) => {
    const completed = (habit.completionDates || []).includes(today);

    const matchesFilter =
      filter === "All" ||
      (filter === "Completed" && completed) ||
      (filter === "Remaining" && !completed);

    const matchesSearch = `${habit.name} ${habit.category || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const completedCount = habits.filter((habit) =>
    (habit.completionDates || []).includes(today)
  ).length;

  if (loading) {
    return (
      <main className="streakly-loading">
        <div className="loading-mark">S</div>
        <p>Loading your habits...</p>
      </main>
    );
  }

  return (
    <div className="streakly-app">
      <Sidebar user={user} />

      <main className="streakly-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">YOUR PERSONAL ROUTINE</p>
            <h1>My Habits</h1>
            <p className="header-subtitle">
              Manage your habits and keep building consistency.
            </p>
          </div>

          <div className="user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
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

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Total habits</span>
            <strong>{habits.length}</strong>
          </article>

          <article className="stat-card">
            <span className="stat-label">Completed today</span>
            <strong>{completedCount}</strong>
          </article>

          <article className="stat-card">
            <span className="stat-label">Remaining</span>
            <strong>{habits.length - completedCount}</strong>
          </article>
        </section>

        <section className="habit-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR ROUTINE</p>
              <h2>Manage habits</h2>
            </div>
            <span className="habit-count">
              {completedCount}/{habits.length} done today
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="habit-search">Search habits</label>
            <input
              id="habit-search"
              type="search"
              placeholder="Search by habit name or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="habit-toolbar">
            <h3>Your routine</h3>

            <div className="habit-filters">
              {["All", "Remaining", "Completed"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`filter-button ${
                    filter === item ? "selected" : ""
                  }`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredHabits.length === 0 ? (
            <div className="empty-habits">
              <div className="empty-symbol">✳</div>
              <h3>No habits found</h3>
              <p>
                {habits.length === 0
                  ? "Add your first habit from the dashboard."
                  : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <div className="habit-list">
              {filteredHabits.map((habit) => {
                const id = habit._id;
                const completed = (habit.completionDates || []).includes(today);

                return (
                  <article
                    className={`habit-row ${completed ? "completed" : ""}`}
                    key={id}
                  >
                    <button
                      type="button"
                      className={`habit-check ${completed ? "checked" : ""}`}
                      aria-label={`Toggle ${habit.name}`}
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
                      {completed ? "Completed" : "Remaining"}
                    </span>

                    <button
                      type="button"
                      className="delete-habit-button"
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
      </main>
    </div>
  );
}
