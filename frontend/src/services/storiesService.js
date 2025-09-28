import { apiMethods, API_ENDPOINTS } from '../config/api';

class StoriesService {
  // Get all stories with filtering and pagination
  async getStories(params = {}) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.STORIES.LIST, params);
      return {
        success: true,
        data: response.data || [],
        meta: response.meta || {},
        message: response.message || 'Stories fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch stories'
      };
    }
  }

  // Get single story by ID
  async getStory(id) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.STORIES.GET(id));
      return {
        success: true,
        data: response.data,
        message: response.message || 'Story fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch story'
      };
    }
  }

  // Create new story
  async createStory(storyData) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.CREATE, storyData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Story created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create story'
      };
    }
  }

  // Update story
  async updateStory(id, storyData) {
    try {
      const response = await apiMethods.put(API_ENDPOINTS.STORIES.UPDATE(id), storyData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Story updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update story'
      };
    }
  }

  // Delete story
  async deleteStory(id) {
    try {
      const response = await apiMethods.delete(API_ENDPOINTS.STORIES.DELETE(id));
      return {
        success: true,
        message: response.message || 'Story deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete story'
      };
    }
  }

  // Publish story
  async publishStory(id) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.PUBLISH(id));
      return {
        success: true,
        data: response.data,
        message: response.message || 'Story published successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to publish story'
      };
    }
  }

  // Unpublish story
  async unpublishStory(id) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.UNPUBLISH(id));
      return {
        success: true,
        data: response.data,
        message: response.message || 'Story unpublished successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to unpublish story'
      };
    }
  }

  // Bulk actions on multiple stories
  async bulkAction(action, storyIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.BULK_ACTION, {
        action,
        story_ids: storyIds
      });
      return {
        success: true,
        data: response.data,
        message: response.message || `Bulk ${action} completed successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || `Failed to perform bulk ${action}`
      };
    }
  }

  // Like a story
  async likeStory(id) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.LIKE(id));
      return {
        success: true,
        data: response.data,
        message: response.message || 'Story liked successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to like story'
      };
    }
  }

  // Unlike a story
  async unlikeStory(id) {
    try {
      const response = await apiMethods.delete(API_ENDPOINTS.STORIES.UNLIKE(id));
      return {
        success: true,
        data: response.data,
        message: response.message || 'Story unliked successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to unlike story'
      };
    }
  }

  // Get comments for a story
  async getComments(storyId, params = {}) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.STORIES.COMMENT(storyId), params);
      return {
        success: true,
        data: response.data || [],
        meta: response.meta || {},
        message: response.message || 'Comments fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch comments'
      };
    }
  }

  // Add comment to a story
  async addComment(storyId, commentData) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.STORIES.COMMENT(storyId), commentData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Comment added successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to add comment'
      };
    }
  }


  // Upload story image/media
  async uploadStoryMedia(storyId, file, onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('story_id', storyId);

      const response = await apiMethods.upload(
        `${API_ENDPOINTS.STORIES.GET(storyId)}/media`, 
        formData, 
        onProgress
      );
      
      return {
        success: true,
        data: response.data,
        message: response.message || 'Media uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to upload media'
      };
    }
  }

  // Search stories
  async searchStories(query, filters = {}) {
    try {
      const params = {
        q: query,
        ...filters
      };
      
      const response = await apiMethods.get(API_ENDPOINTS.STORIES.LIST, params);
      return {
        success: true,
        data: response.data || [],
        meta: response.meta || {},
        message: response.message || 'Search completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Search failed'
      };
    }
  }

  // Get featured stories
  async getFeaturedStories(limit = 10, lang = 'en') {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.STORIES.LIST, { 
        featured: true,
        limit,
        lang 
      });
      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Featured stories fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch featured stories'
      };
    }
  }

  // Get popular stories
  async getPopularStories(limit = 10, timeframe = 'week', lang = 'en') {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.STORIES.LIST, { 
        popular: true,
        limit, 
        timeframe,
        lang
      });
      return {
        success: true,
        data: response.data || [],
        message: response.message || 'Popular stories fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch popular stories'
      };
    }
  }

  // Get story analytics
  async getStoryAnalytics(id) {
    try {
      const response = await apiMethods.get(`${API_ENDPOINTS.STORIES.GET(id)}/analytics`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Analytics fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch analytics'
      };
    }
  }
}

const storiesService = new StoriesService();
export default storiesService; 