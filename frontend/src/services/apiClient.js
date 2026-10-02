import axios from 'axios';
import { sanitizeApiError } from '../utils/errorHandler.js';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

/**
 * Centralized Axios instance for VELoop API requests
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 45000 // 45-second timeout to handle Render cold starts gracefully
});

// Request Interceptor: Attach JWT Bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('veloop_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle response and sanitize errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const sanitized = sanitizeApiError(error);

    // If 401 Unauthorized on protected routes, dispatch auth expired event
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');

    if (sanitized.status === 401 && !isAuthEndpoint) {
      // Clear token if corrupted or expired
      if (localStorage.getItem('veloop_auth_token')) {
        localStorage.removeItem('veloop_auth_token');
        window.dispatchEvent(new Event('veloop_auth_logout'));
      }
    }

    return Promise.reject(sanitized);
  }
);

export default apiClient;
