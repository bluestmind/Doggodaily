import { apiCall } from '../config/api.js';

class GalleryService {
  /**
   * Get all gallery items
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 12)
   * @param {string} params.category - Filter by category
   * @param {string} params.search - Search term
   * @returns {Promise<Object>} Gallery items with pagination info
   */
  async getGalleryItems(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      if (params.page) queryParams.append('page', params.page);
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.category) queryParams.append('category', params.category);
      if (params.search) queryParams.append('search', params.search);
      
      const url = `/api/admin/public/gallery?${queryParams.toString()}`;
      const response = await apiCall(url, 'GET');
      
      if (response.success) {
        return {
          success: true,
          data: response.data || [],
          meta: response.meta || {}
        };
      } else {
        console.error('Failed to fetch gallery items:', response.message);
        return {
          success: false,
          message: response.message || 'Failed to fetch gallery items',
          data: [],
          meta: {}
        };
      }
    } catch (error) {
      console.error('Gallery service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch gallery items',
        data: [],
        meta: {}
      };
    }
  }

  /**
   * Get a single gallery item by ID
   * @param {number} itemId - Gallery item ID
   * @returns {Promise<Object>} Gallery item data
   */
  async getGalleryItem(itemId) {
    try {
      const response = await apiCall(`/api/admin/public/gallery/${itemId}`, 'GET');
      
      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || 'Gallery item not found'
        };
      }
    } catch (error) {
      console.error('Gallery item fetch error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch gallery item'
      };
    }
  }

  /**
   * Check if a gallery item is liked by current user/IP
   * @param {number} itemId - Gallery item ID
   * @returns {Promise<Object>} Response with liked status
   */
  async getLikeStatus(itemId) {
    try {
      const response = await apiCall(`/api/admin/public/gallery/${itemId}/like-status`, 'GET');
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('Get like status error:', error);
      return {
        success: false,
        data: { liked: false }
      };
    }
  }

  /**
   * Like/unlike a gallery item
   * @param {number} itemId - Gallery item ID
   * @returns {Promise<Object>} Response
   */
  async toggleLike(itemId) {
    try {
      const response = await apiCall(`/api/admin/public/gallery/${itemId}/like`, 'POST');
      return {
        success: response.success,
        message: response.message,
        data: response.data
      };
    } catch (error) {
      console.error('Toggle like error:', error);
      return {
        success: false,
        message: error.message || 'Failed to toggle like'
      };
    }
  }

  /**
   * Increment view count for a gallery item
   * @param {number} itemId - Gallery item ID
   * @returns {Promise<Object>} Response
   */
  async incrementViews(itemId) {
    try {
      const response = await apiCall(`/api/admin/public/gallery/${itemId}/view`, 'POST');
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('Increment views error:', error);
      return {
        success: false,
        message: error.message || 'Failed to increment views'
      };
    }
  }

  /**
   * Get gallery categories
   * @returns {Promise<Object>} Available categories
   */
  async getCategories() {
    try {
      const response = await apiCall('/api/admin/public/gallery/categories', 'GET');
      
      if (response.success) {
        return {
          success: true,
          data: response.data || []
        };
      } else {
        // Return default categories if backend doesn't provide them
        return {
          success: true,
          data: ['all', 'facilities', 'grooming', 'training', 'events', 'moments']
        };
      }
    } catch (error) {
      console.error('Get categories error:', error);
      // Return default categories on error
      return {
        success: true,
        data: ['all', 'facilities', 'grooming', 'training', 'events', 'moments']
      };
    }
  }
}

export default new GalleryService();