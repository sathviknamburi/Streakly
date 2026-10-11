
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API}/auth/register`, form, {
        withCredentials: true,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Account created! Please log in." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p>Start building better habits with Streakly.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <label htmlFor="name">Full name</label>
        <input
          id="name"
          type="text"
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={50}
          value={form.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
