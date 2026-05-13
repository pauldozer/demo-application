import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// ── Token refresh interceptor ───────────────────────────
let refreshing = false;
let queue = [];

const flush = (err) => {
  queue.forEach(({ resolve, reject }) => err ? reject(err) : resolve());
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (
      err.response?.status === 401 &&
      err.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      if (refreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(() => api(original));
      }

      original._retry = true;
      refreshing = true;

      try {
        await api.post('/auth/refresh');
        flush(null);
        return api(original);
      } catch (refreshErr) {
        flush(refreshErr);
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
