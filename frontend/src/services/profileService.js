/**
 * Profile Service - Handle all profile-related API calls
 */
import { apiCall } from '../config/api.js';

class ProfileService {
  // Get user profile
  async getProfile() {
    try {
      const response = await apiCall('/api/profile/profile', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return {
        success: false,
        message: error.message || 'Failed to get profile'
      };
    }
  }

  // Update profile information
  async updateProfile(profileData) {
    try {
      const response = await apiCall('/api/profile/profile', 'PUT', profileData);
      return response;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        message: error.message || 'Failed to update profile'
      };
    }
  }

  // Upload avatar
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload avatar'
      };
    }
  }

  // Get activity history
  async getActivityHistory(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiCall(`/api/profile/activity${queryString ? `?${queryString}` : ''}`, 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get activity history:', error);
      return {
        success: false,
        message: error.message || 'Failed to get activity history'
      };
    }
  }

  // Get security information
  async getSecurityInfo() {
    try {
      const response = await apiCall('/api/profile/security', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get security info:', error);
      return {
        success: false,
        message: error.message || 'Failed to get security information'
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiCall('/api/profile/password', 'PUT', {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response;
    } catch (error) {
      console.error('Failed to change password:', error);
      return {
        success: false,
        message: error.message || 'Failed to change password'
      };
    }
  }

  // Get user preferences
  async getPreferences() {
    try {
      const response = await apiCall('/api/preferences', 'GET');
      return response;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return {
        success: false,
        message: error.message || 'Failed to get preferences'
      };
    }
  }

  // Update user preferences
  async updatePreferences(preferences) {
    try {
      const response = await apiCall('/api/preferences', 'PUT', preferences);
      return response;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return {
        success: false,
        message: error.message || 'Failed to update preferences'
      };
    }
  }

  // End a specific session
  async endSession(sessionId) {
    try {
      const response = await apiCall(`/api/profile/sessions/${sessionId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to end session:', error);
      return {
        success: false,
        message: error.message || 'Failed to end session'
      };
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      const response = await apiCall('/api/users/delete-account', 'DELETE');
      return response;
    } catch (error) {
      console.error('Failed to delete account:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete account'
      };
    }
  }
}

const profileService = new ProfileService();
export default profileService;