import axios from 'axios';

// Get API URL from environment variable, fallback to localhost for development
// Backend has global prefix 'api', so we append it to the base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // If sending FormData, let the browser set the correct multipart boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    } else {
      // Default JSON for non-FormData bodies
      if (config.headers && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
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
      // Get the request URL (could be full URL or relative path)
      const requestUrl = error.config?.url || '';
      const fullUrl = error.config?.baseURL 
        ? `${error.config.baseURL}${requestUrl}` 
        : requestUrl;
      
      // Don't redirect on 401 for auth endpoints (login, register, etc.) - let them handle errors
      const isAuthEndpoint = requestUrl.includes('/auth/login') || 
                            requestUrl.includes('/auth/register') ||
                            requestUrl.includes('/auth/forgot-password') ||
                            requestUrl.includes('/auth/reset-password') ||
                            fullUrl.includes('/auth/login') ||
                            fullUrl.includes('/auth/register') ||
                            fullUrl.includes('/auth/forgot-password') ||
                            fullUrl.includes('/auth/reset-password');
      
      // Don't redirect on 401 if we're on a public registration page
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/register' || 
                           currentPath === '/signup' ||
                           currentPath === '/auth' ||
                           currentPath.startsWith('/reset-password') ||
                           currentPath.startsWith('/login');
      
      // Only redirect if it's NOT an auth endpoint and NOT a public route
      // This means it's an authenticated request that failed (token expired, etc.)
      if (!isAuthEndpoint && !isPublicRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth?mode=login';
      }
      // For auth endpoints on public routes, just reject the error so the form can handle it
    }
    return Promise.reject(error);
  }
);

export default api;
