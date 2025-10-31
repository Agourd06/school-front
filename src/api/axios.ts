import axios from 'axios';

console.log('API Base URL:', import.meta.env.VITE_API_URL);
console.log('All env vars:', import.meta.env);

const api = axios.create({
  baseURL: 'http://localhost:3000', // Hardcoded for now
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // If sending FormData, let the browser set the correct multipart boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    } else {
      // Default JSON for non-FormData bodies
      if (config.headers && !(config.headers as any)['Content-Type']) {
        (config.headers as any)['Content-Type'] = 'application/json';
      }
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
