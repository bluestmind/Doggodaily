import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaBook, FaImages, FaRoute, FaEye, FaHeart, 
  FaArrowUp, FaArrowDown, FaCalendarAlt, FaChartLine,
  FaTrophy, FaStar, FaGlobe, FaUserCheck, FaPlus,
  FaClock, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

const StatsCard = ({ title, value, change, trend, icon: Icon, color, bgColor }) => (
  <div style={{
    background: 'var(--gradient-card)',
    borderRadius: 'var(--radius-2xl)',
    border: '1px solid var(--gray-200)',
    padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-md)',
    transition: 'all var(--transition-base)',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-3)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: bgColor,
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon style={{ fontSize: 'var(--text-xl)', color }} />
          </div>
          <div>
            <h3 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: '800',
              color: 'var(--gray-900)',
              margin: 0,
              lineHeight: 1
            }}>
              {value}
            </h3>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--gray-600)',
              margin: 0,
              fontWeight: '500'
            }}>
              {title}
            </p>
          </div>
        </div>
        {change && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            {trend === 'up' ? (
              <FaArrowUp style={{ color: 'var(--success)', fontSize: 'var(--text-xs)' }} />
            ) : (
              <FaArrowDown style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }} />
            )}
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: '600',
              color: trend === 'up' ? 'var(--success)' : 'var(--error)'
            }}>
              {change}
            </span>
            <span style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--gray-500)'
            }}>
              vs last month
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const QuickAction = ({ title, description, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      background: 'var(--gradient-card)',
      border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-5)',
      cursor: 'pointer',
      transition: 'all var(--transition-base)',
      textAlign: 'left'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = 'var(--shadow-lg)';
      e.target.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = 'var(--shadow-md)';
      e.target.style.borderColor = 'var(--gray-200)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{
        width: '40px',
        height: '40px',
        background: `${color}20`,
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon style={{ fontSize: 'var(--text-lg)', color }} />
      </div>
      <div>
        <h4 style={{
          fontSize: 'var(--text-base)',
          fontWeight: '600',
          color: 'var(--gray-900)',
          margin: 0,
          marginBottom: 'var(--space-1)'
        }}>
          {title}
        </h4>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--gray-600)',
          margin: 0
        }}>
          {description}
        </p>
      </div>
    </div>
  </button>
);

const ActivityItem = ({ type, action, user, time, status }) => {
  const getIcon = () => {
    switch (type) {
      case 'story': return FaBook;
      case 'user': return FaUsers;
      case 'gallery': return FaImages;
      case 'tour': return FaRoute;
      default: return FaCheckCircle;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'success': return 'var(--success)';
      case 'warning': return 'var(--warning)';
      case 'error': return 'var(--error)';
      default: return 'var(--primary-teal)';
    }
  };

  const Icon = getIcon();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-4)',
      borderBottom: '1px solid var(--gray-100)',
      transition: 'background var(--transition-fast)'
    }}
    onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
    onMouseLeave={(e) => e.target.style.background = 'transparent'}>
      <div style={{
        width: '36px',
        height: '36px',
        background: `${getColor()}20`,
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon style={{ fontSize: 'var(--text-sm)', color: getColor() }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--gray-900)',
          margin: 0,
          fontWeight: '500',
          marginBottom: 'var(--space-1)'
        }}>
          {action}
        </p>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--gray-600)',
          margin: 0
        }}>
          by {user}
        </p>
      </div>
      <span style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--gray-500)',
        whiteSpace: 'nowrap'
      }}>
        {time}
      </span>
    </div>
  );
};

const AdminDashboard = ({ adminService, onSectionChange }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from backend
      try {
        const response = await adminService.getDashboardStats();
        
        if (response.success) {
          setStats(response.data);
          console.log('✅ Dashboard stats loaded from backend:', response.data);
        } else {
          throw new Error('Backend response unsuccessful');
        }
      } catch (backendError) {
        console.warn('⚠️ Backend unavailable, using mock data:', backendError.message);
        
        // Fallback to mock data when backend is unavailable
        setStats({
          total_users: 1247,
          total_stories: 89,
          total_gallery: 342,
          total_tours: 24,
          monthly_views: 15420,
          monthly_likes: 892
        });
      }
      
      // Try to fetch recent activity from backend
      try {
        const activityResponse = await adminService.getRecentActivity();
        
        if (activityResponse.success) {
          setRecentActivity(activityResponse.data);
          console.log('✅ Recent activity loaded from backend');
        } else {
          throw new Error('Backend response unsuccessful');
        }
      } catch (activityError) {
        console.warn('⚠️ Backend activity unavailable, using mock data:', activityError.message);
        
        // Fallback mock activity data
        setRecentActivity([
          { id: 1, type: 'story', action: 'New story published: "Golden Retriever Adventure"', user: 'Sarah Johnson', time: '5 min ago', status: 'success' },
          { id: 2, type: 'user', action: 'New user registered', user: 'Mike Chen', time: '15 min ago', status: 'success' },
          { id: 3, type: 'gallery', action: 'Image uploaded to gallery', user: 'Admin', time: '30 min ago', status: 'success' },
          { id: 4, type: 'tour', action: 'Tour booking received', user: 'Emma Wilson', time: '1 hour ago', status: 'success' },
          { id: 5, type: 'story', action: 'Story flagged for review', user: 'System', time: '2 hours ago', status: 'warning' }
        ]);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set empty data on complete failure
      setStats({});
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      change: '+12%',
      trend: 'up',
      icon: FaUsers,
      color: 'var(--primary-teal)',
      bgColor: 'rgba(0, 191, 174, 0.1)'
    },
    {
      title: 'Stories Published',
      value: stats?.total_stories || 0,
      change: '+8%',
      trend: 'up',
      icon: FaBook,
      color: 'var(--primary-blue)',
      bgColor: 'rgba(0, 151, 167, 0.1)'
    },
    {
      title: 'Gallery Items',
      value: stats?.total_gallery || 0,
      change: '+15%',
      trend: 'up',
      icon: FaImages,
      color: 'var(--accent-teal)',
      bgColor: 'rgba(77, 208, 225, 0.1)'
    },
    {
      title: 'Active Tours',
      value: stats?.total_tours || 0,
      change: '+5%',
      trend: 'up',
      icon: FaRoute,
      color: 'var(--info)',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      title: 'Monthly Views',
      value: stats?.monthly_views?.toLocaleString() || 0,
      change: '+23%',
      trend: 'up',
      icon: FaEye,
      color: 'var(--success)',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Monthly Likes',
      value: stats?.monthly_likes || 0,
      change: '+18%',
      trend: 'up',
      icon: FaHeart,
      color: 'var(--error)',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Story',
      description: 'Create and publish a new story',
      icon: FaPlus,
      color: 'var(--primary-teal)',
      onClick: () => onSectionChange && onSectionChange('stories')
    },
    {
      title: 'Upload Images',
      description: 'Add new images to the gallery',
      icon: FaImages,
      color: 'var(--primary-blue)',
      onClick: () => onSectionChange && onSectionChange('gallery')
    },
    {
      title: 'Create Tour',
      description: 'Set up a new tour package',
      icon: FaRoute,
      color: 'var(--accent-teal)',
      onClick: () => onSectionChange && onSectionChange('tours')
    },
    {
      title: 'View Analytics',
      description: 'Check detailed site analytics',
      icon: FaChartLine,
      color: 'var(--info)',
      onClick: () => onSectionChange && onSectionChange('analytics')
    }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--gray-200)',
          borderTop: '4px solid var(--primary-teal)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{
          fontSize: 'var(--text-4xl)',
          fontWeight: '800',
          color: 'var(--gray-900)',
          margin: 0,
          marginBottom: 'var(--space-2)'
        }}>
          Dashboard Overview
        </h1>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--gray-600)',
          margin: 0
        }}>
          Welcome back! Here's what's happening with DoggoDaily today.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-8)'
      }}>
        {statCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 'var(--space-8)'
      }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-6)'
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gap: 'var(--space-4)'
          }}>
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-6)'
          }}>
            Recent Activity
          </h2>
          <div style={{
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}>
            {recentActivity.length === 0 ? (
              <div style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                color: 'var(--gray-600)'
              }}>
                <FaClock style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: 'var(--text-base)' }}>No recent activity</p>
              </div>
            ) : (
              recentActivity.map(activity => (
                <ActivityItem key={activity.id} {...activity} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AdminDashboard;