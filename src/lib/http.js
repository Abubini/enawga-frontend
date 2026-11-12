import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let accessToken = localStorage.getItem('enawga_access_token') || null;
let onUnauthorized = null;

export function setAccessToken(token) {
  accessToken = token;
  if (token) localStorage.setItem('enawga_access_token', token);
  else localStorage.removeItem('enawga_access_token');
}

export function getAccessToken() {
  return accessToken;
}

export function registerUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly refresh_token cookie
});

http.interceptors.request.use((config) => {
  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.access_token);
        return res.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    const skipRefresh =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/verify-email');

    if (status === 401 && !original._retry && !skipRefresh) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch (refreshErr) {
        setAccessToken(null);
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  }
  if (err?.message === 'Network Error') {
    return 'Cannot reach the Enawga backend. Check that the API server is running and reachable.';
  }
  return fallback;
}

export { refreshAccessToken };
