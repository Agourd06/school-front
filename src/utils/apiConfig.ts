/**
 * Centralized API configuration utility
 * Use this to get the API base URL consistently across the application
 */

// Get API URL from environment variable, fallback to localhost for development
// Backend has global prefix 'api', so we append it to the base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_BASE_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

/**
 * Get the full URL for an API endpoint
 * @param endpoint - The API endpoint (e.g., '/students', '/teachers')
 * @returns The full URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

/**
 * Get the base URL for file/image URLs
 * Use this when constructing URLs for images or files served by the API
 * Files are served from the base URL (without /api prefix)
 */
export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // Use the base URL without /api prefix for file paths
  // Files are typically served from the root, not from /api
  const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${baseUrl}${path}`;
};

