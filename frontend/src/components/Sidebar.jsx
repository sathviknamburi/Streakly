
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Sidebar({ user }) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await axios.post(
        `${API}/auth/logout`,
        {},
        { withCredentials: true }
      );

      navigate("/login", { replace: true });
    } catch {
      alert("Unable to log out. Please try again.");
    }
  }

  const links = [
    { to: "/dashboard", icon: "▦", label: "Dashboard" },
    { to: "/habits", icon: "✓", label: "My Habits" },
    { to: "/analytics", icon: "▥", label: "Analytics" },
    { to: "/profile", icon: "◎", label: "My Profile" },
  ];

  return (
    <aside className="streakly-sidebar">
      <NavLink to="/dashboard" className="streakly-brand">
        <span className="brand-mark">S</span>
        <span>streakly</span>
      </NavLink>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="streakly-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-item${isActive ? " active" : ""}`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <span>✦ Your daily reminder</span>
          <p>Small steps every day lead to big changes.</p>
        </div>

        {user && (
          <p className="sidebar-user">
            Signed in as <strong>{user.name}</strong>
          </p>
        )}

        <button className="logout-button" onClick={handleLogout}>
          ↪ Log out
        </button>
      </div>
    </aside>
  );
}
