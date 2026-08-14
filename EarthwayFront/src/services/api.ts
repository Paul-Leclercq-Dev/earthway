import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors (offline, timeout, etc.)
    if (!error.response) {
      // No response received - likely network error
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Network error detected:', error.message);
        // Check if actually offline
        if (!navigator.onLine) {
          return Promise.reject({
            message: 'Vous êtes hors ligne. Veuillez vérifier votre connexion internet.',
            isOffline: true,
            originalError: error,
          });
        }
        return Promise.reject({
          message: 'Erreur de connexion au serveur. Veuillez réessayer.',
          isNetworkError: true,
          originalError: error,
        });
      }
      
      // Timeout error
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          message: 'La requête a pris trop de temps. Veuillez réessayer.',
          isTimeout: true,
          originalError: error,
        });
      }
      
      return Promise.reject(error);
    }

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
