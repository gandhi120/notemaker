/**
 * API Configuration
 * Base URL and timeout settings for backend API
 */

import Config from 'react-native-config';

/**
 * API Base URL from environment variables
 * Fallback to production URL if not set
 * Note: Hardcoded temporarily until app is rebuilt to pick up .env file
 */
export const API_BASE_URL = 'https://note-taker-backend-c193.onrender.com';
// After rebuilding the app, you can change this back to:
// export const API_BASE_URL = Config.API_BASE_URL || 'https://note-taker-backend-c193.onrender.com';

// Debug log to verify API_BASE_URL is set correctly
if (__DEV__) {
  console.log('📍 API Configuration:', {
    configValue: Config.API_BASE_URL,
    finalURL: API_BASE_URL,
  });
}

/**
 * API Timeout in milliseconds
 * Default: 30 seconds
 */
export const API_TIMEOUT = parseInt(Config.API_TIMEOUT || '30000', 10);

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Notes endpoints
  NOTES: {
    CREATE: '/api/notes/create',
    GET_ALL: '/api/notes',
    GET_BY_ID: (id: string) => `/api/notes/${id}`,
    UPDATE_TITLE: (id: string) => `/api/notes/${id}/title`,
    UPDATE_CONTENT: (id: string) => `/api/notes/${id}/content`,
    DELETE: (id: string) => `/api/notes/${id}/delete`,
  },
} as const;

/**
 * API Error Codes
 */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_NAME: 'DUPLICATE_NAME',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
