import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to ensure credentials are sent
apiClient.interceptors.request.use(
  (config) => {
    // Ensure credentials are always included for cookie-based auth
    config.withCredentials = true;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        withCredentials: config.withCredentials,
        hasCookies: document.cookie ? document.cookie.substring(0, 100) : 'none'
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - authentication failed', {
        url: error.config?.url,
        message: error.response?.data?.message,
        hasCookies: document.cookie ? 'yes' : 'no'
      });
      
      // Clear user state if token is invalid
      // The AuthContext will handle this via checkAuthStatus
    }
    return Promise.reject(error);
  }
);

export default apiClient;
