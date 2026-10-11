import axios from "axios";

// Read and normalize API base URL
const rawEnvUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_URL = rawEnvUrl.trim().replace(/\/+$/, "");

// Ensure axios always sends credentials (cookies)
axios.defaults.withCredentials = true;

// Request interceptor to attach Bearer token fallback for cross-site cookie restrictions
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("streakly_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to clean up stored token on unauthorized responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("streakly_token");
    }
    return Promise.reject(error);
  }
);

export default axios;
