import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexify_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexify_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
