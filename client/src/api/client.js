import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
});

// Attach access token if provided
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Attempt to load a token from localStorage (if your auth flow stores it there)
try {
  const saved = localStorage.getItem('token');
  if (saved) setAuthToken(saved);
} catch {}

// Global 401 handler: remember the event and navigate to /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try { sessionStorage.setItem('last401', String(Date.now())); } catch {}
      if (typeof window !== 'undefined') {
        const here = window.location.pathname;
        if (here !== '/login') {
          // Redirect to login, preserving where user was headed
          const to = '/login?next=' + encodeURIComponent(window.location.pathname + window.location.search);
          window.location.replace(to);
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
