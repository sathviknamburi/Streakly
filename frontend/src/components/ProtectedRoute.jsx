
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    axios
      .get(`${API}/auth/me`, { withCredentials: true })
      .then(() => {
        if (active) setStatus("authenticated");
      })
      .catch(() => {
        if (active) setStatus("unauthenticated");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return <main className="auth-page">Checking your session...</main>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
