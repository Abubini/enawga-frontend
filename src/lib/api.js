import { http, API_URL } from './http';

/* ─────────────────────────── Auth ─────────────────────────── */
export const AuthAPI = {
  register: (data) => http.post('/auth/register', data),
  verifyEmail: (data) => http.post('/auth/verify-email', data),
  resendVerify: (userId) => http.post(`/auth/resend-verify`, null, { params: { user_id: userId } }),
  login: (data) => http.post('/auth/login', data),
  refresh: () => http.post('/auth/refresh'),
  logout: () => http.post('/auth/logout'),
  forgotPassword: (data) => http.post('/auth/forgot-password', data),
  resetPassword: (data) => http.post('/auth/reset-password', data),
  changePassword: (data) => http.post('/auth/change-password', data),
  googleLoginUrl: () => `${API_URL}/auth/google/login`,
};

/* ─────────────────────────── Users ─────────────────────────── */
export const UsersAPI = {
  me: () => http.get('/users/me'),
  update: (params) => http.put('/users/me', null, { params }),
  remove: () => http.delete('/users/me'),
  usage: () => http.get('/users/me/usage'),
  projects: () => http.get('/users/me/projects'),
};

/* ─────────────────────────── Billing ─────────────────────────── */
export const BillingAPI = {
  createPayment: (data) => http.post('/billing/create-payment', data),
  subscription: () => http.get('/billing/subscription'),
  cancel: () => http.post('/billing/cancel'),
  history: () => http.get('/billing/history'),
};

/* ─────────────────────────── Dashboard ─────────────────────────── */
export const DashboardAPI = {
  overview: (days = 30) => http.get('/dashboard/overview', { params: { days } }),
  project: (projectId, days = 30, faqMin = 25) =>
    http.get(`/dashboard/projects/${projectId}`, { params: { days, faq_min: faqMin } }),
  projectUsage: (projectId) => http.get(`/dashboard/projects/${projectId}/usage`),
  // CSV of frequently asked questions. Omit projectId to export every project.
  exportFaq: ({ projectId, days = 90, minCount = 25 }) =>
    http.get('/dashboard/faq.csv', {
      params: { project_id: projectId || undefined, days, min_count: minCount },
      responseType: 'blob',
    }),
};

/* ─────────────────────────── Notifications ─────────────────────────── */
export const NotificationsAPI = {
  list: (params) => http.get('/notifications/', { params }),
  unreadCount: () => http.get('/notifications/unread-count'),
  markRead: (id) => http.post(`/notifications/${id}/read`),
  markAllRead: () => http.post('/notifications/read-all'),
  remove: (id) => http.delete(`/notifications/${id}`),
};

/* ─────────────────────────── Documents ─────────────────────────── */
export const DocumentsAPI = {
  listForProject: (projectId) => http.get(`/projects/${projectId}/documents`),
  get: (documentId) => http.get(`/documents/${documentId}`),
  status: (documentId) => http.get(`/documents/${documentId}/status`),
  remove: (documentId) => http.delete(`/documents/${documentId}`),
  reIngest: (documentId) => http.post(`/documents/${documentId}/re-ingest`),
};

/* ─────────────────────────── Instant Chat ─────────────────────────── */
export const InstantAPI = {
  upload: (files, onUploadProgress) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return http.post('/instant/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  status: (sessionId) => http.get(`/instant/session/${sessionId}/status`),
  deleteSession: (sessionId) => http.delete(`/instant/session/${sessionId}`),
  chatStreamUrl: () => `${API_URL}/instant/chat`,
};

/* ─────────────────────────── Hosted Chatbot ─────────────────────────── */
export const HostedAPI = {
  create: (data) => http.post('/hosted/create', data),
  upload: (botId, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return http.post(`/hosted/${botId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  config: (botId) => http.get(`/hosted/${botId}/config`),
  updateSettings: (botId, data) => http.put(`/hosted/${botId}/settings`, data),
  analytics: (botId) => http.get(`/hosted/${botId}/analytics`),
  remove: (botId) => http.delete(`/hosted/${botId}`),
  verifyPassword: (botId, password) => http.post(`/hosted/${botId}/verify-password`, { password }),
  chatStreamUrl: (botId) => `${API_URL}/hosted/${botId}/chat`,
  publicInfo: (idOrSlug) => http.get(`/hosted/public/${idOrSlug}`),
};

/* ─────────────────────────── Plug & Play API ─────────────────────────── */
export const PluginAPI = {
  createProject: (data) => http.post('/plugin/projects', data),
  upload: (projectId, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return http.post(`/plugin/projects/${projectId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  status: (projectId) => http.get(`/plugin/projects/${projectId}/status`),
  listKeys: (projectId) => http.get(`/plugin/projects/${projectId}/keys`),
  createKey: (projectId, label) => http.post(`/plugin/projects/${projectId}/keys`, { label }),
  revokeKey: (projectId, keyId) => http.delete(`/plugin/projects/${projectId}/keys/${keyId}`),
  embedScript: (projectId) => http.get(`/plugin/projects/${projectId}/embed-script`, { responseType: 'text' }),
  remove: (projectId) => http.delete(`/plugin/projects/${projectId}`),
  chatStreamUrl: (projectId) => `${API_URL}/v1/chat/${projectId}`,
  rotatePublicKey: (projectId) => http.post(`/plugin/projects/${projectId}/keys/public/rotate`),
};

/* ─────────────────────────── GitHub Ingestion ─────────────────────────── */
export const GitHubAPI = {
  connect: (data) => http.post('/github/connect', data),
  list: () => http.get('/github/repos'),
  status: (repoId) => http.get(`/github/repos/${repoId}/status`),
  resync: (repoId) => http.post(`/github/repos/${repoId}/resync`),
  updateSettings: (repoId, data) => http.put(`/github/repos/${repoId}/settings`, data),
  remove: (repoId) => http.delete(`/github/repos/${repoId}`),
  publishStatus: (repoId) => http.get(`/github/repos/${repoId}/publish`),
};

/* ─────────────────────────── Health ─────────────────────────── */
export const HealthAPI = {
  check: () => http.get('/health'),
};

/* ── SSE-style streaming chat helper (fetch + ReadableStream, since axios
   doesn't stream well in-browser). Works for /instant/chat, /hosted/{id}/chat,
   /v1/chat/{projectId}. ── */
export async function streamChat(url, body, { headers = {}, onToken, onDone, onError } = {}) {
  try {
    const token = localStorage.getItem('enawga_access_token');
    const authHeaders = {};
    if (token && url.includes('/instant/chat') === false && headers.Authorization === undefined) {
      // Instant chat is public; other endpoints may optionally use bearer/api key via `headers`.
    }
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: JSON.stringify(body),
    });

        if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      let detail = 'Chat request failed.';
      try {
        const d = JSON.parse(text)?.detail;
        if (typeof d === 'string') detail = d;
        else if (Array.isArray(d) && d[0]?.msg) detail = d[0].msg;
      } catch {
        /* ignore */
      }
      onError?.(detail);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const dataLines = [];
        for (const line of part.split('\n')) {
          if (!line.startsWith('data:')) continue;
          let value = line.slice(5);
          if (value.startsWith(' ')) value = value.slice(1); // SSE spec: drop exactly one leading space
          dataLines.push(value);
        }
        if (dataLines.length === 0) continue;
        const payload = dataLines.join('\n');
        if (payload === '[DONE]') {
          onDone?.();
          return;
        }
        onToken?.(payload);
      }
    }
    onDone?.();
  } catch (err) {
    onError?.(err?.message || 'Connection lost while streaming the response.');
  }
}
