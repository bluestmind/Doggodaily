import React, { useState, useEffect } from 'react';
import { 
  FaChartLine, FaUsers, FaEye, FaClock, FaMobileAlt, FaDesktop, FaTablet,
  FaGlobe, FaArrowUp, FaArrowDown, FaDownload, FaFilter, FaCalendarAlt,
  FaHeart, FaShare, FaComment, FaEquals,
  FaSpinner, FaExclamationTriangle, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import enhancedAdminService from '../../services/enhancedAdminService';
import LoadingSpinner from '../common/LoadingSpinner';

// Mobile responsive styles
const mobileStyles = `
  <style>
    @media (max-width: 768px) {
      .analytics-dashboard {
        padding: 1rem !important;
      }
      
      .analytics-header {
        flex-direction: column !important;
        gap: 1rem !important;
        text-align: center !important;
      }
      
      .analytics-header-controls {
        flex-direction: column !important;
        width: 100% !important;
        gap: 0.5rem !important;
      }
      
      .analytics-header-controls select,
      .analytics-header-controls button {
        width: 100% !important;
        justify-content: center !important;
      }
      
      .analytics-title {
        font-size: 1.4rem !important;
      }
      
      .analytics-tab-nav {
        flex-wrap: wrap !important;
        gap: 0.25rem !important;
      }
      
      .analytics-tab-button {
        flex: 1 !important;
        min-width: calc(50% - 0.125rem) !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 0.8rem !important;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
      }
      
      .metrics-grid-2col {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.75rem !important;
      }
      
      .metric-card {
        padding: 1rem !important;
      }
      
      .metric-card h3 {
        font-size: 1.5rem !important;
      }
      
      .metric-card .metric-title {
        font-size: 0.8rem !important;
      }
      
      .metric-card .metric-description {
        font-size: 0.7rem !important;
      }
      
      .real-time-grid {
        grid-template-columns: 1fr !important;
        gap: 0.75rem !important;
      }
      
      .device-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.75rem !important;
      }
      
      .chart-container {
        padding: 0.5rem 0 !important;
      }
      
      .page-list,
      .traffic-list,
      .content-list {
        gap: 0.5rem !important;
      }
      
      .page-item,
      .traffic-item,
      .content-item {
        padding: 0.75rem !important;
        flex-direction: column !important;
        text-align: center !important;
      }
      
      .page-item-content {
        margin-bottom: 0.5rem !important;
      }
      
      .performance-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.5rem !important;
        font-size: 0.7rem !important;
      }
      
      .content-summary-grid {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
      }
      
      .user-journey-item {
        flex-direction: column !important;
        text-align: center !important;
        gap: 0.5rem !important;
      }
    }
    
    @media (max-width: 480px) {
      .analytics-dashboard {
        padding: 0.75rem !important;
      }
      
      .analytics-title {
        font-size: 1.2rem !important;
      }
      
      .analytics-tab-button {
        padding: 0.5rem !important;
        font-size: 0.75rem !important;
      }
      
      .metric-card {
        padding: 0.75rem !important;
      }
      
      .metric-card h3 {
        font-size: 1.2rem !important;
      }
      
      .device-grid {
        grid-template-columns: 1fr !important;
      }
      
      .performance-grid {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
`;

const EnhancedAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [overviewData, setOverviewData] = useState(null);
  const [pageViewData, setPageViewData] = useState(null);
  const [userBehaviorData, setUserBehaviorData] = useState(null);
  const [contentPerformance, setContentPerformance] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewResponse, pageViewResponse, behaviorResponse, contentResponse] = await Promise.all([
        enhancedAdminService.getAnalyticsDashboard(timeRange),
        enhancedAdminService.getPageViewAnalytics(timeRange),
        enhancedAdminService.getUserBehaviorAnalytics(timeRange),
        enhancedAdminService.getContentPerformance(timeRange)
      ]);
      
      // Handle overview data
      if (overviewResponse.success) {
        setOverviewData(overviewResponse.data);
        setRealTimeData(overviewResponse.data.real_time);
      } else {
        console.warn('Overview analytics failed:', overviewResponse.message);
        // Set fallback data instead of throwing error
        setOverviewData({
          overview: {
            total_users: 0,
            active_users: 0,
            total_sessions: 0,
            avg_session_duration: 0,
            bounce_rate: 0,
            conversion_rate: 0,
            total_conversions: 0
          },
          traffic_sources: [],
          device_breakdown: []
        });
        setRealTimeData({
          active_sessions: 0,
          page_views_last_hour: 0,
          new_users_last_hour: 0
        });
      }
      
      // Handle page view data
      if (pageViewResponse.success) {
        setPageViewData(pageViewResponse.data);
      } else {
        console.warn('Page view analytics failed:', pageViewResponse.message);
        setPageViewData(null);
      }
      
      // Handle behavior data
      if (behaviorResponse.success) {
        setUserBehaviorData(behaviorResponse.data);
      } else {
        console.warn('User behavior analytics failed:', behaviorResponse.message);
        setUserBehaviorData(null);
      }
      
      // Handle content performance data
      if (contentResponse.success) {
        setContentPerformance(contentResponse.data);
      } else {
        console.warn('Content performance analytics failed:', contentResponse.message);
        setContentPerformance(null);
      }
      
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const exportData = async (type) => {
    try {
      setRefreshing(true);
      const response = await enhancedAdminService.exportAnalytics(type, 'json', timeRange);
      
      if (response.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const MetricCard = ({ title, value, change, trend, icon: Icon, color, description }) => (
    <div className="metric-card" style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{
          background: `${color}20`,
          borderRadius: '12px',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ fontSize: '1.25rem', color }} />
        </div>
        {change !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            background: trend === 'up' ? '#10b98120' : trend === 'down' ? '#ef444420' : '#6b728020',
            color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280',
            padding: '0.25rem 0.5rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {trend === 'up' ? <FaArrowUp /> : trend === 'down' ? <FaArrowDown /> : <FaEquals />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <h3 style={{
        fontSize: '2rem',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 0.5rem 0'
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      
      <p className="metric-title" style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 0.25rem 0'
      }}>
        {title}
      </p>
      
      {description && (
        <p className="metric-description" style={{
          fontSize: '0.8rem',
          color: '#6b7280',
          margin: 0
        }}>
          {description}
        </p>
      )}
    </div>
  );

  const OverviewTab = () => {
    if (!overviewData) return <LoadingSpinner />;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Real-time Stats */}
        {realTimeData && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              🔴 Real-time Activity
            </h3>
            <div className="real-time-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
                  {realTimeData.active_sessions || 0}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Active Sessions
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
                  {realTimeData.page_views_last_hour || 0}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Page Views (1h)
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-teal)' }}>
                  {realTimeData.new_users_last_hour || 0}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  New Users (1h)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <MetricCard
            title="Total Users"
            value={overviewData.overview?.total_users || 0}
            change={12}
            trend="up"
            icon={FaUsers}
            color="var(--primary-teal)"
            description={`${overviewData.overview?.active_users || 0} active users`}
          />
          <MetricCard
            title="Total Sessions"
            value={overviewData.overview?.total_sessions || 0}
            change={8}
            trend="up"
            icon={FaEye}
            color="var(--primary-blue)"
            description={`${overviewData.overview?.avg_session_duration || 0} min avg duration`}
          />
          <MetricCard
            title="Bounce Rate"
            value={`${overviewData.overview?.bounce_rate || 0}%`}
            change={-3}
            trend="down"
            icon={FaArrowDown}
            color="var(--success)"
            description="Lower is better"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${overviewData.overview?.conversion_rate || 0}%`}
            change={15}
            trend="up"
            icon={FaArrowUp}
            color="var(--accent-teal)"
            description={`${overviewData.overview?.total_conversions || 0} total conversions`}
          />
        </div>

        {/* Traffic Sources */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Traffic Sources
          </h3>
          <div className="traffic-list" style={{ display: 'grid', gap: '0.75rem' }}>
            {(overviewData.traffic_sources || []).map((source, index) => (
              <div key={index} className="traffic-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#111827' }}>
                    {source.source || 'Direct'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {source.users} users
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--primary-teal)' }}>
                  {source.sessions}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Device Breakdown
          </h3>
          <div className="device-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {(overviewData.device_breakdown || []).map((device, index) => {
              const DeviceIcon = device.device === 'mobile' ? FaMobileAlt : 
                                device.device === 'tablet' ? FaTablet : FaDesktop;
              return (
                <div key={index} style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '12px'
                }}>
                  <DeviceIcon style={{ 
                    fontSize: '2rem', 
                    color: 'var(--primary-teal)', 
                    marginBottom: '0.5rem' 
                  }} />
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '1.2rem',
                    color: '#111827',
                    marginBottom: '0.25rem' 
                  }}>
                    {device.sessions}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem',
                    color: '#374151',
                    textTransform: 'capitalize',
                    marginBottom: '0.25rem'
                  }}>
                    {device.device}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {device.users} users
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const PageViewsTab = () => {
    if (!pageViewData) return <LoadingSpinner />;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Daily Page Views Chart */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Daily Page Views
          </h3>
          {/* Simple line representation - in a real app, you'd use a charting library */}
          <div className="chart-container" style={{ 
            height: '200px', 
            display: 'flex', 
            alignItems: 'end', 
            gap: '4px',
            padding: '1rem 0'
          }}>
            {pageViewData.daily_views.map((day, index) => (
              <div 
                key={index}
                style={{
                  flex: 1,
                  background: 'var(--primary-teal)',
                  height: `${(day.views / Math.max(...pageViewData.daily_views.map(d => d.views))) * 100}%`,
                  minHeight: '4px',
                  borderRadius: '2px',
                  opacity: 0.8,
                  transition: 'all 0.3s ease'
                }}
                title={`${day.date}: ${day.views} views`}
                onMouseEnter={(e) => {
                  e.target.style.opacity = 1;
                  e.target.style.transform = 'scaleY(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = 0.8;
                  e.target.style.transform = 'scaleY(1)';
                }}
              />
            ))}
          </div>
        </div>

        {/* Top Pages */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Top Pages
          </h3>
          <div className="page-list" style={{ display: 'grid', gap: '0.75rem' }}>
            {pageViewData.top_pages.slice(0, 10).map((page, index) => (
              <div key={index} className="page-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div className="page-item-content" style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '0.25rem'
                  }}>
                    {page.url}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {page.unique_views} unique views
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--primary-teal)' }}>
                  {page.views.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        {pageViewData.performance && pageViewData.performance.length > 0 && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Page Performance
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {pageViewData.performance.slice(0, 5).map((perf, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    {perf.url}
                  </div>
                  <div className="performance-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '1rem',
                    fontSize: '0.8rem'
                  }}>
                    <div>
                      <div style={{ color: '#6b7280' }}>Load Time</div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {perf.avg_load_time.toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>FCP</div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {perf.avg_fcp.toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>LCP</div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {perf.avg_lcp.toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280' }}>Samples</div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {perf.sample_size}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const UserBehaviorTab = () => {
    if (!userBehaviorData) return <LoadingSpinner />;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Engagement Metrics */}
        <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <MetricCard
            title="Avg Session Duration"
            value={`${userBehaviorData.engagement.avg_session_duration.toFixed(1)} min`}
            icon={FaClock}
            color="var(--primary-teal)"
          />
          <MetricCard
            title="Pages per Session"
            value={userBehaviorData.engagement.avg_pages_per_session.toFixed(1)}
            icon={FaEye}
            color="var(--primary-blue)"
          />
          <MetricCard
            title="Bounce Rate"
            value={`${userBehaviorData.engagement.bounce_rate.toFixed(1)}%`}
            icon={FaArrowDown}
            color={userBehaviorData.engagement.bounce_rate < 40 ? 'var(--success)' : 'var(--warning)'}
          />
        </div>

        {/* Interaction Heatmap */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Content Interactions
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {userBehaviorData.interaction_heatmap.map((interaction, index) => {
              const InteractionIcon = interaction.interaction_type === 'like' ? FaHeart :
                                    interaction.interaction_type === 'share' ? FaShare :
                                    interaction.interaction_type === 'comment' ? FaComment :
                                    FaEye;
              return (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <InteractionIcon style={{ color: 'var(--primary-teal)' }} />
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>
                        {interaction.interaction_type.charAt(0).toUpperCase() + interaction.interaction_type.slice(1)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {interaction.content_type}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', color: 'var(--primary-teal)' }}>
                    {interaction.count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Journey */}
        {userBehaviorData.user_journeys && userBehaviorData.user_journeys.length > 0 && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Popular User Journeys
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {userBehaviorData.user_journeys.slice(0, 10).map((journey, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div className="user-journey-item" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ color: '#374151' }}>
                      {journey.from_page}
                    </span>
                    <span style={{ color: 'var(--primary-teal)' }}>→</span>
                    <span style={{ color: '#374151' }}>
                      {journey.to_page}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#6b7280' 
                  }}>
                    {journey.frequency} times
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ContentTab = () => {
    if (!contentPerformance) return <LoadingSpinner />;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Content Summary */}
        <div className="content-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-teal)' }}>
              {contentPerformance.summary.total_content_items}
            </div>
            <div style={{ color: '#374151' }}>
              Total Content Items
            </div>
          </div>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
              {contentPerformance.summary.total_interactions.toLocaleString()}
            </div>
            <div style={{ color: '#374151' }}>
              Total Interactions
            </div>
          </div>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-teal)' }}>
              {contentPerformance.summary.unique_users_engaged.toLocaleString()}
            </div>
            <div style={{ color: '#374151' }}>
              Engaged Users
            </div>
          </div>
        </div>

        {/* Content Performance List */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Content Performance
          </h3>
          <div className="content-list" style={{ display: 'grid', gap: '0.75rem' }}>
            {contentPerformance.content_performance.slice(0, 20).map((content, index) => (
              <div key={index} className="content-item" style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      marginBottom: '0.25rem'
                    }}>
                      {content.content_title}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6b7280' 
                    }}>
                      {content.content_type} • {content.interaction_type}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary-teal)' }}>
                      {content.total_interactions}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {content.unique_users} users
                    </div>
                  </div>
                </div>
                {content.avg_duration > 0 && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#6b7280' 
                  }}>
                    Avg duration: {content.avg_duration.toFixed(1)}s
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <LoadingSpinner size="lg" message="Loading enhanced analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px'
      }}>
        <FaExclamationTriangle style={{ fontSize: '3rem', color: 'var(--error)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
          Failed to Load Analytics
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          {error}
        </p>
        <button
          onClick={handleRefresh}
          style={{
            background: 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Inject mobile responsive styles */}
      <div dangerouslySetInnerHTML={{ __html: mobileStyles }} />
      
      <div className="analytics-dashboard" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {/* Header */}
        <div className="analytics-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div>
            <h2 className="analytics-title" style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#2d3748',
              margin: '0 0 0.5rem 0'
            }}>
              📊 Enhanced Analytics Dashboard
            </h2>
            <p style={{
              color: '#718096',
              margin: 0
            }}>
              Comprehensive insights and real-time analytics
            </p>
          </div>
          <div className="analytics-header-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            style={{
              padding: '0.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#2d3748'
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'var(--primary-teal)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            {refreshing ? <FaSpinner className="fa-spin" /> : <FaChartLine />}
            Refresh
          </button>
          <button
            onClick={() => exportData('events')}
            style={{
              background: 'var(--primary-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <FaDownload />
            Export
          </button>
        </div>
      </div>

        {/* Tab Navigation */}
        <div className="analytics-tab-nav" style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e2e8f0',
          overflowX: 'auto'
        }}>
        {[
          { id: 'overview', label: 'Overview', icon: FaChartLine },
          { id: 'pageviews', label: 'Page Views', icon: FaEye },
          { id: 'behavior', label: 'User Behavior', icon: FaUsers },
          { id: 'content', label: 'Content Performance', icon: FaHeart }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="analytics-tab-button"
            style={{
              background: activeTab === tab.id ? 'var(--primary-teal)' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#718096',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap',
              borderBottom: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
              marginBottom: activeTab === tab.id ? '1px' : '0'
            }}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'pageviews' && <PageViewsTab />}
          {activeTab === 'behavior' && <UserBehaviorTab />}
          {activeTab === 'content' && <ContentTab />}
        </div>
      </div>
    </>
  );
};

export default EnhancedAnalyticsDashboard;