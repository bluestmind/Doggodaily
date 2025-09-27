import { apiMethods, API_ENDPOINTS } from '../config/api';
import { apiCall } from '../config/api';
import api from '../config/api';

class AdminService {
  // Dashboard & Analytics
  async getDashboardStats() {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.ANALYTICS.OVERVIEW);
      return response;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch dashboard statistics',
        data: {
          total_users: 0,
          total_stories: 0,
          total_gallery_items: 0,
          total_tours: 0,
          new_users_30d: 0,
          new_stories_30d: 0,
          active_users: 0,
          featured_stories: 0
        }
      };
    }
  }

  async getAnalyticsData(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.ANALYTICS.TRAFFIC}${queryString ? `?${queryString}` : ''}`;
      const response = await apiMethods.get(url);
      return response;
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch analytics data',
        data: []
      };
    }
  }

  // User Management
  async getUsers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
      const response = await apiMethods.get(url);
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch users',
        data: [],
        meta: { total: 0, page: 1, pages: 1, per_page: 10 }
      };
    }
  }

  async getUser(userId) {
    try {
      const response = await apiMethods.get(`/api/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch user details'
      };
    }
  }

  async createUser(userData) {
    try {
      const response = await apiMethods.post('/api/admin/users', userData);
      return response;
    } catch (error) {
      console.error('Failed to create user:', error);
      return {
        success: false,
        message: error.message || 'Failed to create user'
      };
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await apiMethods.put(`/api/admin/users/${userId}`, userData);
      return response;
    } catch (error) {
      console.error('Failed to update user:', error);
      return {
        success: false,
        message: error.message || 'Failed to update user'
      };
    }
  }

  async deleteUser(userId) {
    try {
      const response = await apiMethods.delete(`/api/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete user'
      };
    }
  }

  async bulkUserAction(action, userIds) {
    try {
      const response = await apiMethods.post('/api/admin/users/bulk', {
        action,
        item_ids: userIds
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk user action:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform bulk action'
      };
    }
  }

  // Stories Management
  async getStories(params = {}) {
    try {
      console.log('🔍 AdminService.getStories called with params:', params);
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.STORIES.ADMIN_LIST}${queryString ? `?${queryString}` : ''}`;
      console.log('🔍 Making request to:', url);
      const response = await apiMethods.get(url);
      console.log('🔍 Stories response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch stories:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch stories',
        data: [],
        meta: { total: 0, page: 1, pages: 1, per_page: 10 }
      };
    }
  }

  async getStory(storyId) {
    try {
      // Use admin endpoint for getting story details (includes drafts and archived)
      const response = await apiMethods.get(`/api/admin/stories/${storyId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch story:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch story details'
      };
    }
  }

  async createStory(storyData) {
    try {
      console.log('🔍 createStory called with:', storyData);
      
      // Extract media files from FormData
      const mediaFiles = [];
      const thumbnailFiles = [];
      
      // Convert FormData to regular object for JSON submission
      const jsonData = {};
      for (let [key, value] of storyData.entries()) {
        if (key === 'media_files') {
          mediaFiles.push(value);
        } else if (key === 'thumbnail_files') {
          thumbnailFiles.push(value);
        } else {
          jsonData[key] = value;
        }
      }
      
      console.log('🔍 JSON data for story:', jsonData);
      console.log('🔍 Media files:', mediaFiles.length);
      
      // Use existing story endpoint (admins can use it)
      const response = await apiMethods.post('/api/stories', jsonData);
      console.log('🔍 createStory response:', response);
      return response;
    } catch (error) {
      console.error('Failed to create story:', error);
      return {
        success: false,
        message: error.message || 'Failed to create story'
      };
    }
  }

  async updateStory(storyId, storyData) {
    try {
      console.log('🔍 updateStory called with:', storyId, storyData);
      
      // Extract media files from FormData
      const mediaFiles = [];
      const thumbnailFiles = [];
      
      // Convert FormData to regular object for JSON submission
      const jsonData = {};
      for (let [key, value] of storyData.entries()) {
        if (key === 'media_files') {
          mediaFiles.push(value);
        } else if (key === 'thumbnail_files') {
          thumbnailFiles.push(value);
        } else {
          jsonData[key] = value;
        }
      }
      
      console.log('🔍 JSON data for story update:', jsonData);
      console.log('🔍 Media files:', mediaFiles.length);
      
      // Use existing story endpoint (admins can use it)
      const response = await apiMethods.put(`/api/stories/${storyId}`, jsonData);
      console.log('🔍 updateStory response:', response);
      return response;
    } catch (error) {
      console.error('Failed to update story:', error);
      return {
        success: false,
        message: error.message || 'Failed to update story'
      };
    }
  }

  async deleteStory(storyId) {
    try {
      const response = await apiMethods.delete(API_ENDPOINTS.STORIES.DELETE(storyId));
      return response;
    } catch (error) {
      console.error('Failed to delete story:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete story'
      };
    }
  }

  async publishStory(storyId) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.PUBLISH(storyId));
      return response;
    } catch (error) {
      console.error('Failed to publish story:', error);
      return {
        success: false,
        message: error.message || 'Failed to publish story'
      };
    }
  }

  async unpublishStory(storyId) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.UNPUBLISH(storyId));
      return response;
    } catch (error) {
      console.error('Failed to unpublish story:', error);
      return {
        success: false,
        message: error.message || 'Failed to unpublish story'
      };
    }
  }

  async bulkStoryAction(action, storyIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.BULK_ACTION, {
        action,
        item_ids: storyIds
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk story action:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform bulk action'
      };
    }
  }

  async bulkGalleryAction(action, itemIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.BULK.GALLERY, {
        action,
        item_ids: itemIds
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk gallery action:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform bulk action'
      };
    }
  }

  async bulkTourAction(action, tourIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.BULK.TOURS, {
        action,
        item_ids: tourIds
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk tour action:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform bulk action'
      };
    }
  }

  async bulkUserAction(action, userIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.BULK.USERS, {
        action,
        item_ids: userIds
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk user action:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform bulk action'
      };
    }
  }

  // Gallery Management
  async getGalleryItems(params = {}) {
    try {
      console.log('🔍 AdminService.getGalleryItems called with params:', params);
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.GALLERY.ADMIN_LIST}${queryString ? `?${queryString}` : ''}`;
      console.log('🔍 Making request to:', url);
      const response = await apiMethods.get(url);
      console.log('🔍 Gallery response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch gallery items:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch gallery items',
        data: [],
        meta: { total: 0, page: 1, pages: 1, per_page: 20 }
      };
    }
  }

  async getGalleryItem(itemId) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.GALLERY.GET(itemId));
      return response;
    } catch (error) {
      console.error('Failed to fetch gallery item:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch gallery item details'
      };
    }
  }

  async uploadMedia(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await apiMethods.upload(API_ENDPOINTS.GALLERY.UPLOAD, formData);
      return response;
    } catch (error) {
      console.error('Failed to upload media:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload media'
      };
    }
  }

  async updateGalleryItem(itemId, itemData) {
    try {
      const response = await apiMethods.put(API_ENDPOINTS.GALLERY.UPDATE(itemId), itemData);
      return response;
    } catch (error) {
      console.error('Failed to update gallery item:', error);
      return {
        success: false,
        message: error.message || 'Failed to update gallery item'
      };
    }
  }

  async deleteGalleryItem(itemId) {
    try {
      const response = await apiMethods.delete(API_ENDPOINTS.GALLERY.DELETE(itemId));
      return response;
    } catch (error) {
      console.error('Failed to delete gallery item:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete gallery item'
      };
    }
  }

  async bulkGalleryAction(action, itemIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.GALLERY.BULK_ACTION, {
        action,
        item_ids: itemIds
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk gallery action:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform bulk action'
      };
    }
  }

  async toggleHomepageFeatured(itemId) {
    try {
      const response = await apiMethods.post(`/api/admin/gallery/${itemId}/toggle-homepage`);
      return response;
    } catch (error) {
      console.error('Failed to toggle homepage featured:', error);
      return {
        success: false,
        message: error.message || 'Failed to toggle homepage featured status'
      };
    }
  }

  // Tours Management
  async getTours(params = {}) {
    try {
      console.log('🔍 AdminService.getTours called with params:', params);
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.TOURS.ADMIN_LIST}${queryString ? `?${queryString}` : ''}`;
      console.log('🔍 Making request to:', url);
      const response = await apiMethods.get(url);
      console.log('🔍 Tours response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch tours:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tours',
        data: [],
        meta: { total: 0, page: 1, pages: 1, per_page: 10 }
      };
    }
  }

  async getTour(tourId) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.TOURS.GET(tourId));
      return response;
    } catch (error) {
      console.error('Failed to fetch tour:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tour details'
      };
    }
  }

  async createTour(tourData) {
    try {
      console.log('🔍 createTour called with:', tourData);
      
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(tourData).forEach(key => {
        if (key !== 'image' && tourData[key] !== null && tourData[key] !== undefined) {
          if (typeof tourData[key] === 'object') {
            formData.append(key, JSON.stringify(tourData[key]));
          } else {
            formData.append(key, tourData[key]);
          }
        }
      });
      
      // Append image file if present
      if (tourData.image) {
        console.log('🔍 Appending tour image file:', tourData.image);
        formData.append('image', tourData.image);
      }
      
      console.log('🔍 Tour FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      // Additional debugging for Italian fields
      console.log('🔍 Italian fields check:');
      console.log('  title_it:', tourData.title_it);
      console.log('  description_it:', tourData.description_it);
      console.log('  short_description_it:', tourData.short_description_it);
      console.log('  location_it:', tourData.location_it);
      
      const response = await apiMethods.upload('/api/admin/tours', formData);
      return response;
    } catch (error) {
      console.error('Failed to create tour:', error);
      return {
        success: false,
        message: error.message || 'Failed to create tour'
      };
    }
  }

  async updateTour(tourId, tourData) {
    try {
      console.log('🔍 updateTour called with tourId:', tourId, 'tourData:', tourData);
      
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(tourData).forEach(key => {
        if (key !== 'image' && tourData[key] !== null && tourData[key] !== undefined) {
          if (typeof tourData[key] === 'object') {
            formData.append(key, JSON.stringify(tourData[key]));
          } else {
            formData.append(key, tourData[key]);
          }
        }
      });
      
      // Append image file if present
      if (tourData.image) {
        console.log('🔍 Appending tour image file:', tourData.image);
        formData.append('image', tourData.image);
      }
      
      console.log('🔍 Tour Update FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      // Additional debugging for Italian fields
      console.log('🔍 Italian fields check (update):');
      console.log('  title_it:', tourData.title_it);
      console.log('  description_it:', tourData.description_it);
      console.log('  short_description_it:', tourData.short_description_it);
      console.log('  location_it:', tourData.location_it);
      
      // Use PUT method for updates
      const response = await api.put(`/api/admin/tours/${tourId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update tour:', error);
      return {
        success: false,
        message: error.message || 'Failed to update tour'
      };
    }
  }

  async deleteTour(tourId) {
    try {
      console.log('🔍 adminService.deleteTour called with tourId:', tourId);
      console.log('🔍 API_ENDPOINTS.TOURS.DELETE(tourId):', API_ENDPOINTS.TOURS.DELETE(tourId));
      
      // Use standard DELETE method
      const response = await apiMethods.delete(API_ENDPOINTS.TOURS.DELETE(tourId));
      
      console.log('🔍 Delete tour response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to delete tour:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response,
        request: error.request
      });
      return {
        success: false,
        message: error.message || 'Failed to delete tour'
      };
    }
  }

  async getTourBookings(tourId) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.TOURS.BOOKINGS(tourId));
      return response;
    } catch (error) {
      console.error('Failed to fetch tour bookings:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tour bookings',
        data: []
      };
    }
  }

  async bulkTourAction(action, tourIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.TOURS.BULK_ACTION, {
        action,
        item_ids: tourIds
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk tour action:', error);
      return {
        success: false,
        message: error.message || 'Failed to perform bulk action'
      };
    }
  }

  // Security & Audit
  async getSecurityLogs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.SECURITY.LOGS}${queryString ? `?${queryString}` : ''}`;
      const response = await apiMethods.get(url);
      return response;
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch security logs',
        data: [],
        meta: { total: 0, page: 1, pages: 1, per_page: 50 }
      };
    }
  }

  // Communications
  async getMessages(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.COMMUNICATIONS.MESSAGES}${queryString ? `?${queryString}` : ''}`;
      const response = await apiMethods.get(url);
      return response;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch messages',
        data: [],
        meta: { total: 0, page: 1, pages: 1, per_page: 20 }
      };
    }
  }

  async sendMessage(messageData) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.COMMUNICATIONS.SEND_MESSAGE, messageData);
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        success: false,
        message: error.message || 'Failed to send message'
      };
    }
  }

  // Export functionality
  async exportData(type, format = 'csv', filters = {}) {
    try {
      const params = {
        type,
        format,
        ...filters
      };
      const queryString = new URLSearchParams(params).toString();
      const response = await apiMethods.get(`${API_ENDPOINTS.ANALYTICS.EXPORT}?${queryString}`);
      return response;
    } catch (error) {
      console.error('Failed to export data:', error);
      return {
        success: false,
        message: error.message || 'Failed to export data'
      };
    }
  }

  // System Health
  async getSystemHealth() {
    try {
      const response = await apiMethods.get('/health');
      return response;
    } catch (error) {
      console.error('Failed to check system health:', error);
      return {
        success: false,
        message: error.message || 'Failed to check system health'
      };
    }
  }

  // Cache management - TODO: Implement in backend
  async clearCache() {
    try {
      // const response = await apiMethods.post('/api/settings/cache/clear');
      // return response;
      return {
        success: false,
        message: 'Cache clearing not implemented yet'
      };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return {
        success: false,
        message: error.message || 'Failed to clear cache'
      };
    }
  }

  // Backup and restore - TODO: Implement in backend
  async createBackup() {
    try {
      // const response = await apiMethods.post('/api/settings/backup');
      // return response;
      return {
        success: false,
        message: 'Backup functionality not implemented yet'
      };
    } catch (error) {
      console.error('Failed to create backup:', error);
      return {
        success: false,
        message: error.message || 'Failed to create backup'
      };
    }
  }

  async restoreBackup(backupId) {
    try {
      // const response = await apiMethods.post(`/api/settings/backup/${backupId}/restore`);
      // return response;
      return {
        success: false,
        message: 'Backup restore not implemented yet'
      };
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return {
        success: false,
        message: error.message || 'Failed to restore backup'
      };
    }
  }

  // Dashboard and Stats
  async getDashboardStats() {
    try {
      const response = await apiCall('/api/admin/dash/stats', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to get dashboard statistics'
      };
    }
  }

  async getRecentActivity() {
    try {
      const response = await apiCall('/api/admin/dash/activity', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return {
        success: false,
        message: error.message || 'Failed to get recent activity'
      };
    }
  }

  // Communications
  async getMessages() {
    try {
      const response = await apiCall('/api/admin/comms/messages', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get messages:', error);
      return {
        success: false,
        message: error.message || 'Failed to get messages'
      };
    }
  }

  async getCommunicationStats() {
    try {
      const response = await apiCall('/api/admin/comms/stats', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get communication stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to get communication statistics'
      };
    }
  }

  // Analytics
  async getAnalytics(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/stats${queryString ? `?${queryString}` : ''}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        success: false,
        message: error.message || 'Failed to get analytics data'
      };
    }
  }

  // Notifications
  async getNotifications(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/notifications${queryString ? `?${queryString}` : ''}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return {
        success: false,
        message: error.message || 'Failed to get notifications'
      };
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const response = await apiCall(`/api/admin/notifications/${notificationId}/read`, 'POST');
      return response;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        success: false,
        message: error.message || 'Failed to mark notification as read'
      };
    }
  }

  async markAllNotificationsRead() {
    try {
      const response = await apiCall('/api/admin/notifications/mark-all-read', 'POST');
      return response;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        message: error.message || 'Failed to mark all notifications as read'
      };
    }
  }

  async getNotificationStats() {
    try {
      const response = await apiCall('/api/admin/notifications/stats', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to get notification statistics'
      };
    }
  }

  // Security
  async getSecurityLogs() {
    try {
      const response = await apiCall('/api/admin/security/logs', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get security logs:', error);
      return {
        success: false,
        message: error.message || 'Failed to get security logs'
      };
    }
  }

  async getSecuritySettings() {
    try {
      const response = await apiCall('/api/admin/security/settings', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get security settings:', error);
      return {
        success: false,
        message: error.message || 'Failed to get security settings'
      };
    }
  }

  async updateSecuritySettings(settings) {
    try {
      const response = await apiCall('/api/admin/security/settings', 'PUT', settings);
      return response;
    } catch (error) {
      console.error('Failed to update security settings:', error);
      return {
        success: false,
        message: error.message || 'Failed to update security settings'
      };
    }
  }

  // System Settings
  async getSystemSettings() {
    try {
      const response = await apiCall('/api/admin/system/settings', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get system settings:', error);
      return {
        success: false,
        message: error.message || 'Failed to get system settings'
      };
    }
  }

  async updateSystemSettings(settings) {
    try {
      const response = await apiCall('/api/admin/system/settings', 'PUT', settings);
      return response;
    } catch (error) {
      console.error('Failed to update system settings:', error);
      return {
        success: false,
        message: error.message || 'Failed to update system settings'
      };
    }
  }


  // Communication Management
  async getMessages() {
    try {
      const response = await apiCall('/api/admin/comms/messages', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get messages:', error);
      return { success: false, message: error.message || 'Failed to get messages' };
    }
  }

  async getCommunicationStats() {
    try {
      const response = await apiCall('/api/admin/comms/stats', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get communication stats:', error);
      return { success: false, message: error.message || 'Failed to get communication stats' };
    }
  }

  async markMessageAsRead(messageId) {
    try {
      const response = await apiCall(`/api/admin/comms/messages/${messageId}/read`, 'POST');
      return response;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      return { success: false, message: error.message || 'Failed to mark message as read' };
    }
  }

  async replyToMessage(messageId, replyText) {
    try {
      const response = await apiCall(`/api/admin/comms/messages/${messageId}/reply`, 'POST', {
        reply: replyText
      });
      return response;
    } catch (error) {
      console.error('Failed to reply to message:', error);
      return { success: false, message: error.message || 'Failed to send reply' };
    }
  }

  // Book Management
  async getBooks(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/books?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get books:', error);
      return { success: false, message: error.message || 'Failed to get books' };
    }
  }

  async getBook(bookId) {
    try {
      const response = await apiCall(`/api/admin/books/${bookId}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get book:', error);
      return { success: false, message: error.message || 'Failed to get book' };
    }
  }

  async createBook(bookData) {
    try {
      console.log('🔍 createBook called with:', bookData);
      
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(bookData).forEach(key => {
        if (key !== 'image' && bookData[key] !== null && bookData[key] !== undefined) {
          if (typeof bookData[key] === 'object') {
            formData.append(key, JSON.stringify(bookData[key]));
          } else {
            formData.append(key, bookData[key]);
          }
        }
      });
      
      // Append image file if present
      if (bookData.image) {
        console.log('🔍 Appending image file:', bookData.image);
        formData.append('image', bookData.image);
      }
      
      console.log('🔍 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const response = await apiMethods.upload('/api/admin/books', formData);
      console.log('🔍 createBook response:', response);
      return response;
    } catch (error) {
      console.error('Failed to create book:', error);
      return { success: false, message: error.message || 'Failed to create book' };
    }
  }

  async updateBook(bookId, bookData) {
    try {
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(bookData).forEach(key => {
        if (key !== 'image' && bookData[key] !== null && bookData[key] !== undefined) {
          if (typeof bookData[key] === 'object') {
            formData.append(key, JSON.stringify(bookData[key]));
          } else {
            formData.append(key, bookData[key]);
          }
        }
      });
      
      // Append image file if present
      if (bookData.image) {
        formData.append('image', bookData.image);
      }
      
      const response = await apiCall(`/api/admin/books/${bookId}`, 'PUT', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to update book:', error);
      return { success: false, message: error.message || 'Failed to update book' };
    }
  }

  async deleteBook(bookId) {
    try {
      const response = await apiCall(`/api/admin/books/${bookId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to delete book:', error);
      return { success: false, message: error.message || 'Failed to delete book' };
    }
  }

  // Author Management
  async getAuthors() {
    try {
      const response = await apiCall('/api/admin/authors', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get authors:', error);
      return { success: false, message: error.message || 'Failed to get authors' };
    }
  }

  async getAuthor(authorId) {
    try {
      const response = await apiCall(`/api/admin/authors/${authorId}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get author:', error);
      return { success: false, message: error.message || 'Failed to get author' };
    }
  }

  async createAuthor(authorData) {
    try {
      console.log('🔍 createAuthor called with:', authorData);
      
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(authorData).forEach(key => {
        if (key !== 'image' && authorData[key] !== null && authorData[key] !== undefined) {
          if (typeof authorData[key] === 'object') {
            formData.append(key, JSON.stringify(authorData[key]));
          } else {
            formData.append(key, authorData[key]);
          }
        }
      });
      
      // Append image file if present
      if (authorData.image) {
        console.log('🔍 Appending image file:', authorData.image);
        formData.append('image', authorData.image);
      }
      
      console.log('🔍 FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      
      const response = await apiMethods.upload('/api/admin/authors', formData);
      console.log('🔍 createAuthor response:', response);
      return response;
    } catch (error) {
      console.error('Failed to create author:', error);
      return { success: false, message: error.message || 'Failed to create author' };
    }
  }

  async updateAuthor(authorId, authorData) {
    try {
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(authorData).forEach(key => {
        if (key !== 'image' && authorData[key] !== null && authorData[key] !== undefined) {
          if (typeof authorData[key] === 'object') {
            formData.append(key, JSON.stringify(authorData[key]));
          } else {
            formData.append(key, authorData[key]);
          }
        }
      });
      
      // Append image file if present
      if (authorData.image) {
        formData.append('image', authorData.image);
      }
      
      const response = await apiCall(`/api/admin/authors/${authorId}`, 'PUT', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to update author:', error);
      return { success: false, message: error.message || 'Failed to update author' };
    }
  }

  async deleteAuthor(authorId) {
    try {
      const response = await apiCall(`/api/admin/authors/${authorId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to delete author:', error);
      return { success: false, message: error.message || 'Failed to delete author' };
    }
  }

  // =============================================================================
  // ADDITIONAL USER MANAGEMENT METHODS (using ADMIN_USERS endpoints)
  // =============================================================================

  async getUserStats() {
    try {
      console.log('🔍 AdminService.getUserStats called');
      
      const response = await apiCall('/api/admin/users/stats', 'GET');
      console.log('🔍 getUserStats response:', response);
      
      return response;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return { success: false, message: error.message || 'Failed to get user statistics' };
    }
  }

  async updateUserStatus(userId, status) {
    try {
      const response = await apiCall(`/api/admin/users/${userId}/toggle-status`, 'POST');
      return response;
    } catch (error) {
      console.error('Failed to update user status:', error);
      return { success: false, message: error.message || 'Failed to update user status' };
    }
  }

  async updateUserRole(userId, role) {
    try {
      const response = await apiCall(`/api/admin/users/${userId}/role`, 'PUT', { admin_level: role });
      return response;
    } catch (error) {
      console.error('Failed to update user role:', error);
      return { success: false, message: error.message || 'Failed to update user role' };
    }
  }
}

const adminService = new AdminService();
export default adminService; 