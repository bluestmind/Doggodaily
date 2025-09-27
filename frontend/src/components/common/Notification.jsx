import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

// Notification context and provider
const NotificationContext = React.createContext();

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  };

  const showError = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 7000, // Errors stay longer
      ...options
    });
  };

  const showWarning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      ...options
    });
  };

  const showInfo = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Individual notification component
const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(notification.id), 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaExclamationTriangle />;
      case 'warning':
        return <FaExclamationTriangle />;
      default:
        return <FaInfoCircle />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return {
          background: 'rgba(16, 185, 129, 0.1)',
          border: '#10b981',
          icon: '#10b981',
          text: '#065f46'
        };
      case 'error':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          border: '#ef4444',
          icon: '#ef4444',
          text: '#7f1d1d'
        };
      case 'warning':
        return {
          background: 'rgba(245, 158, 11, 0.1)',
          border: '#f59e0b',
          icon: '#f59e0b',
          text: '#78350f'
        };
      default:
        return {
          background: 'rgba(59, 130, 246, 0.1)',
          border: '#3b82f6',
          icon: '#3b82f6',
          text: '#1e3a8a'
        };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg)',
        marginBottom: '0.5rem',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        transform: isRemoving ? 'translateX(100%)' : isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isRemoving ? 0 : isVisible ? 1 : 0,
        transition: 'all 0.3s ease',
        minWidth: '320px',
        maxWidth: '500px'
      }}
    >
      <div style={{
        fontSize: '1.2rem',
        color: colors.icon,
        marginTop: '0.1rem'
      }}>
        {getIcon()}
      </div>
      
      <div style={{ flex: 1 }}>
        {notification.title && (
          <h4 style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: colors.text,
            margin: '0 0 0.25rem 0'
          }}>
            {notification.title}
          </h4>
        )}
        <p style={{
          fontSize: '0.85rem',
          color: colors.text,
          margin: 0,
          lineHeight: 1.4
        }}>
          {notification.message}
        </p>
      </div>
      
      <button
        onClick={handleRemove}
        style={{
          background: 'none',
          border: 'none',
          color: colors.icon,
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      >
        <FaTimes />
      </button>
    </div>
  );
};

// Notification container component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
}; 