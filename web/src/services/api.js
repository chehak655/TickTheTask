import axios from 'axios';

const getDefaultBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname.includes('loca.lt') || hostname.includes('trycloudflare.com')) {
      return 'https://rude-queens-grin.loca.lt';
    }
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8000`;
    }
  }
  return 'http://127.0.0.1:8000';
};

const apiClient = axios.create({
  baseURL: getDefaultBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tickthetask_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 if it wasn't a login attempt
      if (!error.config.url.includes('/api/auth/login')) {
        localStorage.removeItem('tickthetask_token');
        localStorage.removeItem('tickthetask_user');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
