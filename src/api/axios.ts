import axios from 'axios';

// Get API URL from environment variable
// Backend has global prefix 'api', so we append it to the base URL
const API_BASE = import.meta.env.VITE_API_URL;
if (!API_BASE) {
  throw new Error('VITE_API_URL environment variable is not set. Please configure it in your .env file or Vercel environment variables.');
}
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Check if an endpoint is public (doesn't require authentication)
const isPublicEndpoint = (url: string | undefined, method: string = 'GET'): boolean => {
  if (!url) return false;
  
  // Explicitly list public auth endpoints (login, register, password reset, etc.)
  // IMPORTANT: /auth/change-password requires authentication and should NOT be in this list
  const publicAuthEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/set-password',
    '/auth/validate-token', // Used for password setup tokens, doesn't require user auth
  ];
  
  // Check if this is a public auth endpoint
  const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint => url.includes(endpoint));
  if (isPublicAuthEndpoint) {
    return true;
  }
  
  // /auth/change-password requires authentication - explicitly exclude it
  if (url.includes('/auth/change-password')) {
    return false;
  }
  
  // CAPTCHA endpoints are always public
  if (url.includes('/captcha/')) {
    return true;
  }
  
  // For POST requests to /company or /users, check if we're on registration page
  // These are public during initial registration
  if (method === 'POST') {
    const currentPath = window.location.pathname;
    const isRegistrationPage = currentPath === '/registerMyschool' || currentPath === '/signup';
    
    // POST /company or POST /users during registration are public
    if (isRegistrationPage && (url === '/company' || url === '/users' || url.endsWith('/company') || url.endsWith('/users'))) {
      return true;
    }
  }
  
  return false;
};

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
    
    // Only add auth token if:
    // 1. There's a token in localStorage
    // 2. The endpoint is NOT a public endpoint
    const token = localStorage.getItem('token');
    const requestUrl = config.url || '';
    const method = config.method?.toUpperCase() || 'GET';
    const isPublic = isPublicEndpoint(requestUrl, method);
    
    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isPublic) {
      // Explicitly remove Authorization header for public endpoints
      // This ensures no auth header is sent even if a token exists
      if (config.headers) {
        delete config.headers.Authorization;
      }
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
      
      // Check if this is a public registration endpoint (company/user creation during registration)
      const isPublicRegistrationEndpoint = (requestUrl.includes('/company') || requestUrl.includes('/users')) &&
                                          (requestUrl.endsWith('/company') || requestUrl.endsWith('/users') || 
                                           !requestUrl.includes('/company/') && !requestUrl.includes('/users/'));
      
      // Don't redirect on 401 if we're on a public registration page
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/registerMyschool' || 
                           currentPath === '/signup' ||
                           currentPath === '/auth' ||
                           currentPath.startsWith('/reset-password') ||
                           currentPath.startsWith('/set-password') ||
                           currentPath.startsWith('/login');
      
      // Only redirect if it's NOT an auth endpoint, NOT a public registration endpoint, and NOT a public route
      // This means it's an authenticated request that failed (token expired, etc.)
      if (!isAuthEndpoint && !isPublicRegistrationEndpoint && !isPublicRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('allowedPages');
        window.location.href = '/auth?mode=login';
      }
      // For auth endpoints and public registration endpoints on public routes, just reject the error so the form can handle it
    }
    return Promise.reject(error);
  }
);

export default api;
