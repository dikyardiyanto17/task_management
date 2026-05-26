import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBase';
import { appPath } from '../utils/appBase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = appPath('login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;
