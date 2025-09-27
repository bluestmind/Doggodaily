import { apiMethods, API_ENDPOINTS } from '../config/api';

class UsersService {
  async getUsers(params = {}) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.USERS.LIST, params);
      return {
        success: true,
        data: response.data || [],
        meta: response.meta || {},
        message: response.message || 'Users fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch users'
      };
    }
  }

  async getUser(id) {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.USERS.GET(id));
      return {
        success: true,
        data: response.data,
        message: response.message || 'User fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user'
      };
    }
  }

  async createUser(userData) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.USERS.CREATE, userData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'User created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create user'
      };
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await apiMethods.put(API_ENDPOINTS.USERS.UPDATE(id), userData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'User updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update user'
      };
    }
  }

  async deleteUser(id) {
    try {
      const response = await apiMethods.delete(API_ENDPOINTS.USERS.DELETE(id));
      return {
        success: true,
        message: response.message || 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete user'
      };
    }
  }

  async bulkAction(action, userIds) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.USERS.BULK_ACTION, {
        action,
        user_ids: userIds
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
}

const usersService = new UsersService();
export default usersService; 