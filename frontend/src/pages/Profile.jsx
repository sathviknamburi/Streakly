
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
      });

      setUser(response.data.user);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <main className="streakly-loading">
        <div className="loading-mark">S</div>
        <p>Loading your profile...</p>
      </main>
    );
  }

  return (
    <div className="streakly-app">
      <Sidebar user={user} />

      <main className="streakly-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h1>My Profile</h1>
            <p className="header-subtitle">
              Manage and review your Streakly account.
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

        {user && (
          <section className="habit-section">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: 22,
                borderRadius: 14,
                background: "#e9f1e8",
                marginBottom: 28,
              }}
            >
              <div className="user-avatar" style={{ width: 64, height: 64 }}>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: "0 0 8px", overflowWrap: "anywhere" }}>
                  {user.name}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#697568",
                    overflowWrap: "anywhere",
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>

            <p className="eyebrow">ACCOUNT INFORMATION</p>
            <h2 style={{ marginBottom: 22 }}>Personal details</h2>

            <div className="form-field" style={{ marginBottom: 18 }}>
              <label htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                value={user.name || ""}
                readOnly
              />
            </div>

            <div className="form-field" style={{ marginBottom: 18 }}>
              <label htmlFor="profile-email">Email address</label>
              <input
                id="profile-email"
                type="email"
                value={user.email || ""}
                readOnly
              />
            </div>

            <div className="form-field">
              <label>Account status</label>
              <p style={{ color: "#315c40", fontWeight: 700 }}>
                ✓ Authenticated
              </p>
            </div>

            <p className="header-subtitle" style={{ marginTop: 28 }}>
              Your account details are retrieved from the server.
              Profile editing and password changes are not enabled yet.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
