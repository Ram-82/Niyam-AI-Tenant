import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  withCredentials: true,
});

// Attach access token from memory/localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use the same baseURL as the rest of the API — not a hardcoded relative path.
        // The hardcoded '/api/auth/refresh' would hit Vercel's domain, not Render.
        const refreshBase = import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api`
          : '/api';
        const { data } = await axios.post(`${refreshBase}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.accessToken;
        localStorage.setItem('accessToken', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 404 on an /api/ route almost always means VITE_API_URL is not set
    // and the request hit the Vercel frontend domain instead of the backend.
    if (error.response?.status === 404 && error.config?.url?.includes('/auth/')) {
      const msg =
        'Cannot connect to the server. ' +
        (import.meta.env.PROD && !import.meta.env.VITE_API_URL
          ? 'VITE_API_URL is not set in Vercel. Add it in Vercel → Settings → Environment Variables, then Redeploy.'
          : 'The backend server may be starting up (30–60 sec on free tier). Please try again.');
      error.userMessage = msg;
    }

    return Promise.reject(error);
  }
);

export default api;
