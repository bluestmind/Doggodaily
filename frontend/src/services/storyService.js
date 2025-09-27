/**
 * Story Service - Handle all story submission and management API calls
 */
import { apiCall } from '../config/api.js';

class StoryService {
  // Submit a new story for review
  async submitStory(storyData, mediaFiles = []) {
    try {
      const formData = new FormData();
      
      // Add story data
      formData.append('title', storyData.title);
      formData.append('content', storyData.content);
      formData.append('location', storyData.location || '');
      formData.append('category', storyData.category);
      formData.append('tags', storyData.tags || '');
      formData.append('terms_accepted', 'true');
      
      // Add media files and thumbnails
      mediaFiles.forEach((media, index) => {
        if (media.file) {
          formData.append('media_files', media.file);
          
          // Add thumbnail file if it exists (for videos)
          if (media.thumbnailFile) {
            formData.append('thumbnail_files', media.thumbnailFile);
          } else {
            // Add empty file to maintain index alignment
            formData.append('thumbnail_files', new File([], ''));
          }
        }
      });
      
      // Use apiCall with FormData support
      const response = await apiCall('/api/profile/submit', 'POST', formData, true);
      return response;
    } catch (error) {
      console.error('Failed to submit story:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit story'
      };
    }
  }

  // Get current user's story submissions
  async getMySubmissions() {
    try {
      const response = await apiCall('/api/profile/my-submissions', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get submissions:', error);
      return {
        success: false,
        message: error.message || 'Failed to get submissions'
      };
    }
  }

  // Get available story categories
  async getCategories() {
    try {
      const response = await apiCall('/api/profile/categories', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get categories:', error);
      return {
        success: false,
        message: error.message || 'Failed to get categories',
        categories: [
          { value: 'adventure', label: 'Adventure' },
          { value: 'culture', label: 'Culture' },
          { value: 'food', label: 'Food' },
          { value: 'nature', label: 'Nature' },
          { value: 'history', label: 'History' },
          { value: 'photography', label: 'Photography' }
        ]
      };
    }
  }

  // Admin functions
  
  // Get all story submissions (admin only)
  async getSubmissions(filters = {}) {
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
      return {
        success: false,
        message: error.message || 'Failed to get story submissions'
      };
    }
  }

  // Get detailed submission info (admin only)
  async getSubmissionDetails(submissionId) {
    try {
      const response = await apiCall(`/api/admin/stories/submissions/${submissionId}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get submission details:', error);
      return {
        success: false,
        message: error.message || 'Failed to get submission details'
      };
    }
  }

  // Approve a story submission (admin only)
  async approveSubmission(submissionId, adminNotes = '') {
    try {
      const response = await apiCall(`/api/admin/stories/submissions/${submissionId}/approve`, 'POST', {
        admin_notes: adminNotes
      });
      return response;
    } catch (error) {
      console.error('Failed to approve submission:', error);
      return {
        success: false,
        message: error.message || 'Failed to approve submission'
      };
    }
  }

  // Reject a story submission (admin only)
  async rejectSubmission(submissionId, rejectionReason, adminNotes = '') {
    try {
      const response = await apiCall(`/api/admin/stories/submissions/${submissionId}/reject`, 'POST', {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes
      });
      return response;
    } catch (error) {
      console.error('Failed to reject submission:', error);
      return {
        success: false,
        message: error.message || 'Failed to reject submission'
      };
    }
  }

  // Get submission statistics (admin only)
  async getSubmissionStats() {
    try {
      const response = await apiCall('/api/admin/stories/submissions/stats', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get submission stats:', error);
      return {
        success: false,
        message: error.message || 'Failed to get submission stats',
        stats: {
          pending: 0,
          approved: 0,
          rejected: 0,
          total: 0,
          recent_week: 0
        }
      };
    }
  }
}

export default new StoryService();