import { apiMethods, API_ENDPOINTS } from '../config/api';

class AnalyticsService {
  async getOverview(timeRange = '7d') {
    try {
      // No explicit overview endpoint; derive from performance analytics
      const response = await apiMethods.get(API_ENDPOINTS.ANALYTICS.PERFORMANCE, { days: timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90 });
      return {
        success: true,
        data: response.analytics,
        message: response.message || 'Analytics overview fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch analytics overview'
      };
    }
  }

  async getTrafficData(timeRange = '7d') {
    try {
      // Use performance daily_active_users as traffic proxy
      const response = await apiMethods.get(API_ENDPOINTS.ANALYTICS.PERFORMANCE, { days: timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90 });
      return {
        success: true,
        data: response.analytics?.daily_active_users || [],
        message: response.message || 'Traffic data fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch traffic data'
      };
    }
  }

  async getUserAnalytics(timeRange = '7d') {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.ANALYTICS.USERS, { days: timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90 });
      return {
        success: true,
        data: response.analytics,
        message: response.message || 'User analytics fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch user analytics'
      };
    }
  }

  async getContentAnalytics(timeRange = '7d') {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.ANALYTICS.CONTENT, { days: timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90 });
      return {
        success: true,
        data: response.analytics,
        message: response.message || 'Content analytics fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch content analytics'
      };
    }
  }

  async getDemographics(timeRange = '7d') {
    try {
      // Not implemented in backend; return empty structure
      const response = { data: { demographics: {} } };
      return {
        success: true,
        data: response.data,
        message: response.message || 'Demographics fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch demographics'
      };
    }
  }

  async exportReport(format = 'pdf', timeRange = '30d') {
    try {
      // Not implemented in backend; return error placeholder
      const response = { success: false, message: 'Export not implemented' };
      return {
        success: false,
        message: response.message || 'Export not implemented'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to export report'
      };
    }
  }

  async getPerformanceAnalytics(timeRange = '7d') {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.ANALYTICS.PERFORMANCE, { days: timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90 });
      return {
        success: true,
        data: response.analytics,
        message: response.message || 'Performance analytics fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch performance analytics'
      };
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService; 