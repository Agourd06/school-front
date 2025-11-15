/**
 * Centralized API configuration utility
 * Use this to get the API base URL consistently across the application
 */

// Get API URL from environment variable, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
 */
export const getFileUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${baseUrl}${path}`;
};

