/**
 * Axios API Client
 * Configured instance with interceptors for request/response handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT, API_ERROR_CODES } from '../config/api';

/**
 * Create Axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor
 * Add authentication token and logging
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log request in development
    if (__DEV__) {
      console.log('🌐 API Request:', {
        method: config.method?.toUpperCase(),
        baseURL: config.baseURL,
        url: config.url,
        fullURL: `${config.baseURL}${config.url}`,
        data: config.data,
      });
    }

    // TODO: Add authentication token when auth is implemented
    // const token = await getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle success and error responses
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject({
        success: false,
        error: {
          code: API_ERROR_CODES.NETWORK_ERROR,
          message: 'Network error. Please check your internet connection.',
        },
      });
    }

    // Log error in development
    if (__DEV__) {
      console.error('❌ API Error:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });
    }

    // Return standardized error response
    return Promise.reject(error.response.data);
  }
);

export default apiClient;
