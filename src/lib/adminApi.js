import axios from 'axios';
import { API_URL } from './http';

// The backend's /admin/* routes are NOT protected by user JWTs — they're
// gated by a single static `X-Admin-Key` header that must equal the
// backend's SECRET_KEY env var (see app/admin/router.py: require_admin_key).
// This is a separate, session-only credential from normal user auth.

const STORAGE_KEY = 'enawga_admin_key';

export function getAdminKey() {
  return sessionStorage.getItem(STORAGE_KEY) || '';
}

export function setAdminKey(key) {
  if (key) sessionStorage.setItem(STORAGE_KEY, key);
  else sessionStorage.removeItem(STORAGE_KEY);
}

export const adminHttp = axios.create({ baseURL: API_URL });

adminHttp.interceptors.request.use((config) => {
  const key = getAdminKey();
  if (key) {
    config.headers = config.headers || {};
    config.headers['X-Admin-Key'] = key;
  }
  return config;
});

export const AdminAPI = {
  // Used to both "log in" (verify the key) and to refresh the stats dashboard.
  stats: () => adminHttp.get('/admin/stats'),
  listUsers: (params) => adminHttp.get('/admin/users', { params }),
  setPlan: (userId, plan) =>
    adminHttp.post(`/admin/users/${userId}/set-plan`, null, { params: { plan } }),
  deleteUser: (userId) => adminHttp.delete(`/admin/users/${userId}`),
  dbHealth: () => adminHttp.get('/admin/health/db'),
};