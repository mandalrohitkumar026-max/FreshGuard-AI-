import axios from 'axios';

// Centralized API Base URL configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardized frontend error handling
    const customError = {
      message: error.response?.data?.error?.message || error.message || 'An unexpected network error occurred.',
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      status: error.response?.status,
      details: error.response?.data?.error?.details,
    };
    return Promise.reject(customError);
  },
);

export default apiClient;
