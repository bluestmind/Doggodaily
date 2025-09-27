import { apiCall } from '../config/api.js';

class EnhancedAdminService {
  // Gallery Management Enhanced
  async uploadMedia(formData) {
    try {
      // Add cache-busting parameter to ensure we hit the correct endpoint
      const endpoint = '/api/admin/gallery/upload';
      console.log('🚀 Uploading to admin endpoint:', endpoint);
      console.log('📋 FormData contents:', Array.from(formData.entries()));
      const response = await apiCall(endpoint, 'POST', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to upload media:', error);
      return { success: false, message: error.message || 'Failed to upload media' };
    }
  }

  async getGalleryItems(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/gallery?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get gallery items:', error);
      return { success: false, message: error.message || 'Failed to get gallery items' };
    }
  }

  async updateGalleryItem(itemId, updateData) {
    try {
      const response = await apiCall(`/api/admin/gallery/${itemId}`, 'PUT', updateData);
      return response;
    } catch (error) {
      console.error('Failed to update gallery item:', error);
      return { success: false, message: error.message || 'Failed to update gallery item' };
    }
  }

  async deleteGalleryItem(itemId) {
    try {
      const response = await apiCall(`/api/admin/gallery/${itemId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to delete gallery item:', error);
      return { success: false, message: error.message || 'Failed to delete gallery item' };
    }
  }

  async toggleHomepageFeatured(itemId) {
    try {
      const response = await apiCall(`/api/admin/gallery/${itemId}/toggle-homepage`, 'POST');
      return response;
    } catch (error) {
      console.error('Failed to toggle homepage featured:', error);
      return { success: false, message: error.message || 'Failed to toggle homepage featured status' };
    }
  }

  // Message Management
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

  async uploadMultipleMedia(files, metadata = {}) {
    try {
      const formData = new FormData();
      
      // Add files
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      
      // Add metadata for each file
      Object.keys(metadata).forEach(key => {
        formData.append(`metadata[${key}]`, JSON.stringify(metadata[key]));
      });
      
      const response = await apiCall('/api/gallery/upload-multiple', 'POST', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to upload multiple media:', error);
      return { success: false, message: error.message || 'Failed to upload multiple media' };
    }
  }

  // Album Management
  async createGalleryAlbum(albumData) {
    try {
      const response = await apiCall('/api/admin/albums', 'POST', albumData);
      return response;
    } catch (error) {
      console.error('Failed to create gallery album:', error);
      return { success: false, message: error.message || 'Failed to create gallery album' };
    }
  }

  async getGalleryAlbums(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/albums?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get gallery albums:', error);
      return { success: false, message: error.message || 'Failed to get gallery albums' };
    }
  }

  async getGalleryAlbum(albumId) {
    try {
      const response = await apiCall(`/api/admin/albums/${albumId}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get gallery album:', error);
      return { success: false, message: error.message || 'Failed to get gallery album' };
    }
  }

  async updateGalleryAlbum(albumId, albumData) {
    try {
      const response = await apiCall(`/api/admin/albums/${albumId}`, 'PUT', albumData);
      return response;
    } catch (error) {
      console.error('Failed to update gallery album:', error);
      return { success: false, message: error.message || 'Failed to update gallery album' };
    }
  }

  async deleteGalleryAlbum(albumId) {
    try {
      const response = await apiCall(`/api/admin/albums/${albumId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to delete gallery album:', error);
      return { success: false, message: error.message || 'Failed to delete gallery album' };
    }
  }

  async toggleAlbumLike(albumId) {
    try {
      const response = await apiCall(`/api/admin/albums/${albumId}/like`, 'POST');
      return response;
    } catch (error) {
      console.error('Failed to toggle album like:', error);
      return { success: false, message: error.message || 'Failed to toggle album like' };
    }
  }
  
  async getGalleryAnalytics(days = 30) {
    try {
      const response = await apiCall(`/api/gallery/analytics?days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get gallery analytics:', error);
      return { success: false, message: error.message || 'Failed to get gallery analytics' };
    }
  }
  
  async getGalleryStats() {
    try {
      const response = await apiCall('/api/gallery/statistics', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get gallery stats:', error);
      return { success: false, message: error.message || 'Failed to get gallery stats' };
    }
  }

  // Enhanced Analytics
  async getAnalyticsDashboard(days = 30) {
    try {
      const response = await apiCall(`/api/analytics/dashboard?days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get analytics dashboard:', error);
      return { success: false, message: error.message || 'Failed to get analytics dashboard' };
    }
  }
  
  async getPageViewAnalytics(days = 30) {
    try {
      const response = await apiCall(`/api/analytics/pageviews?days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get page view analytics:', error);
      return { success: false, message: error.message || 'Failed to get page view analytics' };
    }
  }
  
  async getUserBehaviorAnalytics(days = 30) {
    try {
      const response = await apiCall(`/api/analytics/user-behavior?days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get user behavior analytics:', error);
      return { success: false, message: error.message || 'Failed to get user behavior analytics' };
    }
  }
  
  async getContentPerformance(days = 30, type = 'all') {
    try {
      const response = await apiCall(`/api/analytics/content-performance?days=${days}&type=${type}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get content performance:', error);
      return { success: false, message: error.message || 'Failed to get content performance' };
    }
  }
  
  async trackEvent(eventData) {
    try {
      const response = await apiCall('/api/analytics/track-event', 'POST', eventData);
      return response;
    } catch (error) {
      console.error('Failed to track event:', error);
      return { success: false, message: error.message || 'Failed to track event' };
    }
  }
  
  async trackPageView(pageViewData) {
    try {
      const response = await apiCall('/api/analytics/track-pageview', 'POST', pageViewData);
      return response;
    } catch (error) {
      console.error('Failed to track page view:', error);
      return { success: false, message: error.message || 'Failed to track page view' };
    }
  }
  
  async trackInteraction(interactionData) {
    try {
      const response = await apiCall('/api/analytics/track-interaction', 'POST', interactionData);
      return response;
    } catch (error) {
      console.error('Failed to track interaction:', error);
      return { success: false, message: error.message || 'Failed to track interaction' };
    }
  }
  
  async exportAnalytics(type = 'events', format = 'json', days = 30) {
    try {
      const response = await apiCall(`/api/analytics/export?type=${type}&format=${format}&days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to export analytics:', error);
      return { success: false, message: error.message || 'Failed to export analytics' };
    }
  }

  // Enhanced Security
  async getSecurityDashboard(days = 30) {
    try {
      const response = await apiCall(`/api/security/dashboard?days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get security dashboard:', error);
      return { success: false, message: error.message || 'Failed to get security dashboard' };
    }
  }
  
  async getSecurityLogs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/security/logs?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get security logs:', error);
      return { success: false, message: error.message || 'Failed to get security logs' };
    }
  }
  
  async getThreats(activeOnly = true, threatLevel = null) {
    try {
      let url = `/api/security/threats?active_only=${activeOnly}`;
      if (threatLevel) {
        url += `&threat_level=${threatLevel}`;
      }
      const response = await apiCall(url, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get threats:', error);
      return { success: false, message: error.message || 'Failed to get threats' };
    }
  }
  
  async mitigateThreat(threatId, action = 'manual_review') {
    try {
      const response = await apiCall(`/api/security/threats/${threatId}/mitigate`, 'POST', { action });
      return response;
    } catch (error) {
      console.error('Failed to mitigate threat:', error);
      return { success: false, message: error.message || 'Failed to mitigate threat' };
    }
  }
  
  async getBlacklist(activeOnly = true) {
    try {
      const response = await apiCall(`/api/security/blacklist?active_only=${activeOnly}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get blacklist:', error);
      return { success: false, message: error.message || 'Failed to get blacklist' };
    }
  }
  
  async addToBlacklist(blacklistData) {
    try {
      const response = await apiCall('/api/security/blacklist', 'POST', blacklistData);
      return response;
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
      return { success: false, message: error.message || 'Failed to add to blacklist' };
    }
  }
  
  async removeFromBlacklist(blacklistId) {
    try {
      const response = await apiCall(`/api/security/blacklist/${blacklistId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to remove from blacklist:', error);
      return { success: false, message: error.message || 'Failed to remove from blacklist' };
    }
  }

  // Maintenance Mode Management
  async getMaintenanceStatus() {
    try {
      const response = await apiCall('/api/security/maintenance', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get maintenance status:', error);
      return { success: false, message: error.message || 'Failed to get maintenance status' };
    }
  }
  
  async enableMaintenance(maintenanceData) {
    try {
      const response = await apiCall('/api/security/maintenance/enable', 'POST', maintenanceData);
      return response;
    } catch (error) {
      console.error('Failed to enable maintenance:', error);
      return { success: false, message: error.message || 'Failed to enable maintenance' };
    }
  }
  
  async disableMaintenance() {
    try {
      const response = await apiCall('/api/security/maintenance/disable', 'POST');
      return response;
    } catch (error) {
      console.error('Failed to disable maintenance:', error);
      return { success: false, message: error.message || 'Failed to disable maintenance' };
    }
  }
  
  async updateMaintenanceProgress(progressData) {
    try {
      const response = await apiCall('/api/security/maintenance/progress', 'POST', progressData);
      return response;
    } catch (error) {
      console.error('Failed to update maintenance progress:', error);
      return { success: false, message: error.message || 'Failed to update maintenance progress' };
    }
  }
  
  async getSecurityConfiguration() {
    try {
      const response = await apiCall('/api/security/configuration', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get security configuration:', error);
      return { success: false, message: error.message || 'Failed to get security configuration' };
    }
  }
  
  async updateSecurityConfiguration(configData) {
    try {
      const response = await apiCall('/api/security/configuration', 'PUT', configData);
      return response;
    } catch (error) {
      console.error('Failed to update security configuration:', error);
      return { success: false, message: error.message || 'Failed to update security configuration' };
    }
  }
  
  async getAuditLogs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/security/audit-logs?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return { success: false, message: error.message || 'Failed to get audit logs' };
    }
  }
  
  async generateSecurityReport(reportData) {
    try {
      const response = await apiCall('/api/security/generate-report', 'POST', reportData);
      return response;
    } catch (error) {
      console.error('Failed to generate security report:', error);
      return { success: false, message: error.message || 'Failed to generate security report' };
    }
  }


  // Bulk Operations
  async bulkOperations(operationType, resourceType, resourceIds, operationData = {}) {
    try {
      const response = await apiCall(`/api/admin/bulk/${operationType}`, 'POST', {
        resource_type: resourceType,
        resource_ids: resourceIds,
        ...operationData
      });
      return response;
    } catch (error) {
      console.error('Failed to perform bulk operation:', error);
      return { success: false, message: error.message || 'Failed to perform bulk operation' };
    }
  }

  // System Health and Monitoring
  async getSystemHealth() {
    try {
      const response = await apiCall('/api/admin/system/health', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return { success: false, message: error.message || 'Failed to get system health' };
    }
  }
  
  async getSystemLogs(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/system/logs?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get system logs:', error);
      return { success: false, message: error.message || 'Failed to get system logs' };
    }
  }
  
  async performSystemBackup(backupType = 'full') {
    try {
      const response = await apiCall('/api/admin/system/backup', 'POST', { type: backupType });
      return response;
    } catch (error) {
      console.error('Failed to perform system backup:', error);
      return { success: false, message: error.message || 'Failed to perform system backup' };
    }
  }

  // Content Management Enhanced
  async getContentInsights(contentType, days = 30) {
    try {
      const response = await apiCall(`/api/admin/content/insights?type=${contentType}&days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get content insights:', error);
      return { success: false, message: error.message || 'Failed to get content insights' };
    }
  }
  
  async optimizeContent(contentType, optimizationType) {
    try {
      const response = await apiCall('/api/admin/content/optimize', 'POST', {
        content_type: contentType,
        optimization_type: optimizationType
      });
      return response;
    } catch (error) {
      console.error('Failed to optimize content:', error);
      return { success: false, message: error.message || 'Failed to optimize content' };
    }
  }

  // User Management Enhanced
  async getUserAnalytics(userId, days = 30) {
    try {
      const response = await apiCall(`/api/admin/users/${userId}/analytics?days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return { success: false, message: error.message || 'Failed to get user analytics' };
    }
  }
  
  async getUserActivityLog(userId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/users/${userId}/activity?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get user activity log:', error);
      return { success: false, message: error.message || 'Failed to get user activity log' };
    }
  }
  
  async moderateUser(userId, moderationAction, reason = '') {
    try {
      const response = await apiCall(`/api/admin/users/${userId}/moderate`, 'POST', {
        action: moderationAction,
        reason: reason
      });
      return response;
    } catch (error) {
      console.error('Failed to moderate user:', error);
      return { success: false, message: error.message || 'Failed to moderate user' };
    }
  }

  // Advanced Search and Filtering
  async advancedSearch(searchParams) {
    try {
      const response = await apiCall('/api/admin/search/advanced', 'POST', searchParams);
      return response;
    } catch (error) {
      console.error('Failed to perform advanced search:', error);
      return { success: false, message: error.message || 'Failed to perform advanced search' };
    }
  }

  // Performance Monitoring
  async getPerformanceMetrics(days = 7) {
    try {
      const response = await apiCall(`/api/admin/performance?days=${days}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return { success: false, message: error.message || 'Failed to get performance metrics' };
    }
  }
  
  async optimizePerformance(optimizationType) {
    try {
      const response = await apiCall('/api/admin/performance/optimize', 'POST', {
        type: optimizationType
      });
      return response;
    } catch (error) {
      console.error('Failed to optimize performance:', error);
      return { success: false, message: error.message || 'Failed to optimize performance' };
    }
  }

  // Story Moderation Enhanced
  async getStorySubmissions(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.per_page) params.append('per_page', filters.per_page);
      if (filters.search) params.append('search', filters.search);
      
      const url = `/api/admin/stories/submissions${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiCall(url, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get story submissions:', error);
      return { success: false, message: error.message || 'Failed to get story submissions' };
    }
  }

  // Book Management Enhanced
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

  async createBook(formData) {
    try {
      const response = await apiCall('/api/admin/books', 'POST', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to create book:', error);
      return { success: false, message: error.message || 'Failed to create book' };
    }
  }

  async updateBook(bookId, formData) {
    try {
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

  // Author Management Enhanced
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

  async createAuthor(formData) {
    try {
      const response = await apiCall('/api/admin/authors', 'POST', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to create author:', error);
      return { success: false, message: error.message || 'Failed to create author' };
    }
  }

  async updateAuthor(authorId, formData) {
    try {
      const response = await apiCall(`/api/admin/authors/${authorId}`, 'PUT', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to update author:', error);
      return { success: false, message: error.message || 'Failed to update author' };
    }
  }

  async getStorySubmissionStats() {
    try {
      const response = await apiCall('/api/admin/stories/submissions/stats', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get story submission stats:', error);
      return { success: false, message: error.message || 'Failed to get story submission stats' };
    }
  }

  async approveStorySubmission(submissionId, adminNotes = '') {
    try {
      const response = await apiCall(`/api/admin/stories/submissions/${submissionId}/approve`, 'POST', {
        admin_notes: adminNotes
      });
      return response;
    } catch (error) {
      console.error('Failed to approve story submission:', error);
      return { success: false, message: error.message || 'Failed to approve story submission' };
    }
  }

  async rejectStorySubmission(submissionId, rejectionReason, adminNotes = '') {
    try {
      const response = await apiCall(`/api/admin/stories/submissions/${submissionId}/reject`, 'POST', {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes
      });
      return response;
    } catch (error) {
      console.error('Failed to reject story submission:', error);
      return { success: false, message: error.message || 'Failed to reject story submission' };
    }
  }

  // Page Content Management Enhanced
  async getPageContent(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/page-content?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get page content:', error);
      return { success: false, message: error.message || 'Failed to get page content' };
    }
  }

  async createPageContent(formData) {
    try {
      const response = await apiCall('/api/admin/page-content', 'POST', formData);
      return response;
    } catch (error) {
      console.error('Failed to create page content:', error);
      return { success: false, message: error.message || 'Failed to create page content' };
    }
  }

  async updatePageContent(contentId, formData) {
    try {
      const response = await apiCall(`/api/admin/page-content/${contentId}`, 'PUT', formData);
      return response;
    } catch (error) {
      console.error('Failed to update page content:', error);
      return { success: false, message: error.message || 'Failed to update page content' };
    }
  }

  async deletePageContent(contentId) {
    try {
      const response = await apiCall(`/api/admin/page-content/${contentId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to delete page content:', error);
      return { success: false, message: error.message || 'Failed to delete page content' };
    }
  }

  async initializePageContent() {
    try {
      const response = await apiCall('/api/admin/page-content/initialize', 'POST');
      return response;
    } catch (error) {
      console.error('Failed to initialize page content:', error);
      return { success: false, message: error.message || 'Failed to initialize page content' };
    }
  }

  // Internationalization (i18n) Enhanced
  async getLanguages() {
    try {
      const response = await apiCall('/api/admin/languages', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get languages:', error);
      return { success: false, message: error.message || 'Failed to get languages' };
    }
  }

  async createLanguage(formData) {
    try {
      const response = await apiCall('/api/admin/languages', 'POST', formData);
      return response;
    } catch (error) {
      console.error('Failed to create language:', error);
      return { success: false, message: error.message || 'Failed to create language' };
    }
  }

  async getTranslations(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/admin/translations?${queryString}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get translations:', error);
      return { success: false, message: error.message || 'Failed to get translations' };
    }
  }

  async createTranslation(formData) {
    try {
      const response = await apiCall('/api/admin/translations', 'POST', formData);
      return response;
    } catch (error) {
      console.error('Failed to create translation:', error);
      return { success: false, message: error.message || 'Failed to create translation' };
    }
  }

  async updateTranslation(translationId, formData) {
    try {
      const response = await apiCall(`/api/admin/translations/${translationId}`, 'PUT', formData);
      return response;
    } catch (error) {
      console.error('Failed to update translation:', error);
      return { success: false, message: error.message || 'Failed to update translation' };
    }
  }

  async deleteTranslation(translationId) {
    try {
      const response = await apiCall(`/api/admin/translations/${translationId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to delete translation:', error);
      return { success: false, message: error.message || 'Failed to delete translation' };
    }
  }

  async autoTranslate(formData) {
    try {
      const response = await apiCall('/api/admin/translations/auto-translate', 'POST', formData);
      return response;
    } catch (error) {
      console.error('Failed to auto translate:', error);
      return { success: false, message: error.message || 'Failed to auto translate' };
    }
  }

  async bulkTranslate(formData) {
    try {
      const response = await apiCall('/api/admin/translations/bulk-translate', 'POST', formData);
      return response;
    } catch (error) {
      console.error('Failed to bulk translate:', error);
      return { success: false, message: error.message || 'Failed to bulk translate' };
    }
  }

  async initializeDefaultTranslations() {
    try {
      const response = await apiCall('/api/admin/translations/initialize-defaults', 'POST');
      return response;
    } catch (error) {
      console.error('Failed to initialize default translations:', error);
      return { success: false, message: error.message || 'Failed to initialize default translations' };
    }
  }
}

export default new EnhancedAdminService();