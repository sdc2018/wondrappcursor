import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Create Axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
  withCredentials: true, // Add this for CORS requests with credentials
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add detailed logging for debugging
    console.log('API Request:', {
      method: config.method,
      url: config.baseURL + (config.url || ''),
      headers: config.headers,
      data: config.data,
      withCredentials: config.withCredentials
    });
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Add success response logging
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error: AxiosError) => {
    // Enhanced error logging
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        withCredentials: error.config?.withCredentials
      }
    });
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    
    // Handle forbidden errors
    if (error.response?.status === 403) {
      console.error('Access denied. Insufficient permissions.');
    }
    
    // Handle server errors
    if (error.response?.status && error.response?.status >= 500) {
      console.error('Server error occurred. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

export default api;