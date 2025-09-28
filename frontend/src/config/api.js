import axios from 'axios';

// API Configuration
const API_CONFIG = {
  // Force HTTPS URLs for production
  baseURL: 'https://doggodaiily.com/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    // Explicitly allow credentials for cross-site cookies in dev
    'X-Requested-With': 'XMLHttpRequest',
  },
};

// File upload base URL configuration
export const FILE_BASE_URL = 'https://doggodaiily.com';

// Helper function to construct file URLs
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // If it's a relative path starting with uploads/, construct full URL
  if (filePath.startsWith('uploads/')) {
    return `${FILE_BASE_URL}/${filePath}`;
  }
  
  // If it's just a filename, assume it's in uploads/
  return `${FILE_BASE_URL}/uploads/${filePath}`;
};

// Create axios instance
const api = axios.create(API_CONFIG);

export const API_BASE_URL = api.defaults.baseURL;

// Debug: Log the actual API base URL being used
console.log('🔍 API Base URL:', API_BASE_URL);

// Request interceptor: cookie-based session, no Authorization header
api.interceptors.request.use(
  (config) => {
    console.log('🔍 Cookie-session request:', config.method?.toUpperCase(), config.url);
    
    console.log('📤 Request:', config.method?.toUpperCase(), config.url);
    console.log('📤 Headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to appropriate login
          console.error('🚨 401 Unauthorized - Token might be missing or invalid');
          console.error('🔍 Current URL:', window.location.pathname);
          console.error('🔍 All localStorage keys:', Object.keys(localStorage));
          
          // Clear authentication data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('session_info');
          
          // Redirect to appropriate login page
          if (window.location.pathname.includes('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden:', data.message);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', data.message);
          break;
        case 422:
          // Validation error
          console.error('Validation error:', data.errors);
          break;
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
        default:
          console.error('API Error:', data.message || 'Unknown error');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - no response received');
    } else {
      // Request setup error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
        LOGIN: '/api/auth/login',
        ADMIN_LOGIN: '/api/auth/admin/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        // REFRESH removed in session mode
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
        VERIFY_EMAIL: '/api/auth/verify-email',
        PROFILE: '/api/auth/profile',
        SETUP_2FA: '/api/auth/setup-2fa',
        VERIFY_2FA: '/api/auth/verify-2fa',
        DISABLE_2FA: '/api/auth/disable-2fa',
        SESSIONS: '/api/auth/sessions',
        LOGOUT_ALL: '/api/auth/logout-all',
        GOOGLE_LOGIN: '/api/auth/google/login',
        GOOGLE_CALLBACK: '/api/auth/google/callback',
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    GET: (id) => `/api/users/${id}`,
    UPDATE: (id) => `/api/users/${id}`,
    DELETE: (id) => `/api/users/${id}`,
    BULK_ACTION: '/api/users/bulk',
  },
  
  // Admin Users
  ADMIN_USERS: {
    LIST: '/api/admin/users',
    CREATE: '/api/admin/users',
    GET: (id) => `/api/admin/users/${id}`,
    UPDATE: (id) => `/api/admin/users/${id}`,
    DELETE: (id) => `/api/admin/users/${id}`,
    BULK_ACTION: '/api/admin/users/bulk',
    STATS: '/api/admin/users/stats',
    TOGGLE_STATUS: (id) => `/api/admin/users/${id}/toggle-status`,
    UPDATE_ROLE: (id) => `/api/admin/users/${id}/role`,
  },
  
  // Stories
  STORIES: {
    LIST: '/api/stories',
    ADMIN_LIST: '/api/admin/stories',
    CREATE: '/api/stories',
    GET: (id) => `/api/stories/${id}`,
    UPDATE: (id) => `/api/stories/${id}`,
    DELETE: (id) => `/api/stories/${id}`,
    PUBLISH: (id) => `/api/stories/${id}/publish`,
    UNPUBLISH: (id) => `/api/stories/${id}/unpublish`,
    BULK_ACTION: '/api/stories/bulk',
    LIKE: (id) => `/api/stories/${id}/like`,
    UNLIKE: (id) => `/api/stories/${id}/unlike`,
    COMMENT: (id) => `/api/stories/${id}/comments`,
  },
  
  // Gallery
  GALLERY: {
    LIST: '/api/gallery',
    ADMIN_LIST: '/api/admin/gallery',
    UPLOAD: '/api/admin/gallery/upload',
    GET: (id) => `/api/gallery/${id}`,
    UPDATE: (id) => `/api/gallery/${id}`,
    DELETE: (id) => `/api/gallery/${id}`,
    BULK_ACTION: '/api/gallery/bulk',
    DOWNLOAD: (id) => `/api/gallery/${id}/download`,
  },
  
  // Tours
  TOURS: {
    LIST: '/api/tours',
    ADMIN_LIST: '/api/admin/tours',
    CREATE: '/api/tours',
    GET: (id) => `/api/tours/${id}`,
    UPDATE: (id) => `/api/tours/${id}`,
    DELETE: (id) => `/api/tours/${id}`,
    BULK_ACTION: '/api/tours/bulk',
    BOOK: (id) => `/api/tours/${id}/book`,
    CANCEL_BOOKING: (id) => `/api/tours/${id}/cancel-booking`,
    BOOKINGS: (id) => `/api/tours/${id}/bookings`,
  },
  
  // Analytics
  ANALYTICS: {
    OVERVIEW: '/api/analytics/overview',
    TRAFFIC: '/api/analytics/traffic',
    USERS: '/api/analytics/users',
    CONTENT: '/api/analytics/content',
    DEMOGRAPHICS: '/api/analytics/demographics',
    EXPORT: '/api/analytics/export',
  },
  
  // Security
  SECURITY: {
    LOGS: '/api/security/logs',
    SETTINGS: '/api/security/settings',
    SESSIONS: '/api/security/sessions',
    THREATS: '/api/security/threats',
  },
  
  // Communications
  COMMUNICATIONS: {
    MESSAGES: '/api/communications/messages',
    NOTIFICATIONS: '/api/communications/notifications',
    CAMPAIGNS: '/api/communications/campaigns',
    SEND_MESSAGE: '/api/communications/send',
    MARK_READ: (id) => `/api/communications/messages/${id}/read`,
  },
  
  // Settings
  SETTINGS: {
    GENERAL: '/api/settings/general',
    SECURITY: '/api/settings/security',
    NOTIFICATIONS: '/api/settings/notifications',
    BACKUP: '/api/settings/backup',
  },
};

// API response helpers
export const handleApiResponse = (response) => {
  return response.data;
};

export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  } else if (error.response?.data?.errors) {
    // Handle validation errors
    const errorMessages = Object.values(error.response.data.errors).flat();
    throw new Error(errorMessages.join(', '));
  } else if (error.message) {
    throw new Error(error.message);
  } else {
    throw new Error('An unexpected error occurred');
  }
};

// Generic API methods
export const apiMethods = {
  get: async (endpoint, params = {}) => {
    try {
      const response = await api.get(endpoint, { params });
      return handleApiResponse(response);
    } catch (error) {
      // Return error response instead of throwing
      if (error.response?.data) {
        return error.response.data;
      } else if (error.message) {
        return {
          success: false,
          message: error.message
        };
      } else {
        return {
          success: false,
          message: 'An unexpected error occurred'
        };
      }
    }
  },
  
  post: async (endpoint, data = {}) => {
    try {
      const response = await api.post(endpoint, data);
      return handleApiResponse(response);
    } catch (error) {
      // Return error response instead of throwing
      if (error.response?.data) {
        return error.response.data;
      } else if (error.message) {
        return {
          success: false,
          message: error.message
        };
      } else {
        return {
          success: false,
          message: 'An unexpected error occurred'
        };
      }
    }
  },
  
  put: async (endpoint, data = {}) => {
    try {
      const response = await api.put(endpoint, data);
      return handleApiResponse(response);
    } catch (error) {
      // Return error response instead of throwing
      if (error.response?.data) {
        return error.response.data;
      } else if (error.message) {
        return {
          success: false,
          message: error.message
        };
      } else {
        return {
          success: false,
          message: 'An unexpected error occurred'
        };
      }
    }
  },
  
  patch: async (endpoint, data = {}) => {
    try {
      const response = await api.patch(endpoint, data);
      return handleApiResponse(response);
    } catch (error) {
      // Return error response instead of throwing
      if (error.response?.data) {
        return error.response.data;
      } else if (error.message) {
        return {
          success: false,
          message: error.message
        };
      } else {
        return {
          success: false,
          message: 'An unexpected error occurred'
        };
      }
    }
  },
  
  delete: async (endpoint) => {
    try {
      console.log('🔍 apiMethods.delete called with endpoint:', endpoint);
      console.log('🔍 Full URL will be:', `${api.defaults.baseURL}${endpoint}`);
      
      const response = await api.delete(endpoint);
      console.log('🔍 apiMethods.delete response:', response);
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ apiMethods.delete error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      // Return error response instead of throwing
      if (error.response?.data) {
        return error.response.data;
      } else if (error.message) {
        return {
          success: false,
          message: error.message
        };
      } else {
        return {
          success: false,
          message: 'An unexpected error occurred'
        };
      }
    }
  },
  
  upload: async (endpoint, formData, onProgress = null) => {
    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        } : undefined,
      });
      return handleApiResponse(response);
    } catch (error) {
      // Return error response instead of throwing
      if (error.response?.data) {
        return error.response.data;
      } else if (error.message) {
        return {
          success: false,
          message: error.message
        };
      } else {
        return {
          success: false,
          message: 'An unexpected error occurred'
        };
      }
    }
  },
};

// Unified API call function
export const apiCall = async (endpoint, method = 'GET', data = null, isFormData = false) => {
  try {
    const config = {
      method: method.toLowerCase(),
      url: endpoint,
    };

    // Handle different data types
    if (data) {
      if (method.toLowerCase() === 'get') {
        config.params = data;
      } else {
        config.data = data;
        
        // Set appropriate headers for form data
        if (isFormData) {
          config.headers = {
            'Content-Type': 'multipart/form-data'
          };
        }
      }
    }

    const response = await api(config);
    return handleApiResponse(response);
  } catch (error) {
    // Return error response instead of throwing
    if (error.response?.data) {
      return error.response.data;
    } else if (error.message) {
      return {
        success: false,
        message: error.message
      };
    } else {
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }
};

export default api; 