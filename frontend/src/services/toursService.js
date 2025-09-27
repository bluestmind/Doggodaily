import { apiCall } from '../config/api.js';

class ToursService {
  /**
   * Get all tours
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 12)
   * @param {string} params.search - Search term
   * @param {string} params.category - Filter by category
   * @returns {Promise<Object>} Tours with pagination info
   */
  async getTours(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.lang) queryParams.append('lang', params.lang);
      
      const url = `/api/tours/?${queryParams.toString()}`;
      const response = await apiCall(url, 'GET');
      
      if (response.success) {
        return {
          success: true,
          data: response.data || [],
          meta: response.meta || {}
        };
      } else {
        console.error('Failed to fetch tours:', response.message);
        return {
          success: false,
          message: response.message || 'Failed to fetch tours',
          data: [],
          meta: {}
        };
      }
    } catch (error) {
      console.error('Tours service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tours',
        data: [],
        meta: {}
      };
    }
  }

  /**
   * Get a single tour by ID
   * @param {number} tourId - Tour ID
   * @param {string} lang - Language code (optional)
   * @returns {Promise<Object>} Tour data
   */
  async getTour(tourId, lang = null) {
    try {
      const queryParams = new URLSearchParams();
      if (lang) queryParams.append('lang', lang);
      
      const url = `/api/tours/${tourId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiCall(url, 'GET');
      
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || 'Tour not found'
        };
      }
    } catch (error) {
      console.error('Tour fetch error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tour'
      };
    }
  }

  /**
   * Book a tour
   * @param {number} tourId - Tour ID
   * @param {Object} bookingData - Booking information
   * @param {string} bookingData.guest_name - Guest name
   * @param {string} bookingData.guest_email - Guest email
   * @param {string} bookingData.guest_phone - Guest phone (optional)
   * @param {number} bookingData.number_of_guests - Number of guests
   * @param {string} bookingData.special_requests - Special requests (optional)
   * @returns {Promise<Object>} Booking response
   */
  async bookTour(tourId, bookingData) {
    try {
      const response = await apiCall(`/api/tours/${tourId}/book`, 'POST', bookingData);
      
      return {
        success: response.success,
        message: response.message,
        data: response.data
      };
    } catch (error) {
      console.error('Tour booking error:', error);
      return {
        success: false,
        message: error.message || 'Failed to book tour'
      };
    }
  }

  /**
   * Get available tour dates
   * @param {number} tourId - Tour ID (optional)
   * @returns {Promise<Object>} Available dates
   */
  async getAvailableDates(tourId = null) {
    try {
      const url = tourId ? `/api/tours/${tourId}/dates` : '/api/tours/dates';
      const response = await apiCall(url, 'GET');
      
      if (response.success) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to fetch available dates',
          data: []
        };
      }
    } catch (error) {
      console.error('Get available dates error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch available dates',
        data: []
      };
    }
  }

  /**
   * Get tour categories/types
   * @returns {Promise<Object>} Available tour categories
   */
  async getTourCategories() {
    try {
      const response = await apiCall('/api/tours/categories', 'GET');
      
      if (response.success) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        // Return default categories if backend doesn't provide them
        return {
          success: true,
          data: ['all', 'group', 'private', 'vip', 'family', 'educational']
        };
      }
    } catch (error) {
      console.error('Get tour categories error:', error);
      // Return default categories on error
      return {
        success: true,
        data: ['all', 'group', 'private', 'vip', 'family', 'educational']
      };
    }
  }

  /**
   * Check tour availability
   * @param {number} tourId - Tour ID
   * @param {string} date - Date in ISO format
   * @returns {Promise<Object>} Availability info
   */
  async checkAvailability(tourId, date) {
    try {
      const response = await apiCall(`/api/tours/${tourId}/availability?date=${date}`, 'GET');
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Check availability error:', error);
      return {
        success: false,
        message: error.message || 'Failed to check availability'
      };
    }
  }
}

export default new ToursService();