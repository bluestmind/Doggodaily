import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaTimes, FaSync } from 'react-icons/fa';

const BackendStatusBanner = () => {
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline', 'partial'
  const [showBanner, setShowBanner] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const checkBackendStatus = async () => {
    try {
      // Check a simple endpoint to see if backend is responsive
      const response = await fetch('/api/health', {
        method: 'GET',
        credentials: 'include',
        timeout: 5000
      });
      
      if (response.ok) {
        setBackendStatus('online');
        setShowBanner(false);
      } else {
        setBackendStatus('partial');
        setShowBanner(true);
      }
    } catch (error) {
      console.warn('Backend health check failed:', error);
      setBackendStatus('offline');
      setShowBanner(true);
    }
    
    setLastCheck(new Date());
  };

  useEffect(() => {
    // Initial check
    checkBackendStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showBanner || backendStatus === 'online') {
    return null;
  }

  const getStatusInfo = () => {
    switch (backendStatus) {
      case 'offline':
        return {
          icon: FaExclamationTriangle,
          title: 'Backend Unavailable',
          message: 'Some features may not work properly. The backend server appears to be offline.',
          color: '#ef4444',
          bgColor: '#fef2f2',
          borderColor: '#fecaca'
        };
      case 'partial':
        return {
          icon: FaExclamationTriangle,
          title: 'Backend Issues',
          message: 'Some backend services are experiencing issues. You may see limited functionality.',
          color: '#f59e0b',
          bgColor: '#fffbeb',
          borderColor: '#fed7aa'
        };
      default:
        return {
          icon: FaSync,
          title: 'Checking Status',
          message: 'Checking backend status...',
          color: '#6b7280',
          bgColor: '#f9fafb',
          borderColor: '#e5e7eb'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: statusInfo.bgColor,
      borderBottom: `2px solid ${statusInfo.borderColor}`,
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flex: 1
      }}>
        <StatusIcon style={{
          color: statusInfo.color,
          fontSize: '1.25rem'
        }} />
        
        <div>
          <div style={{
            fontWeight: '600',
            color: statusInfo.color,
            fontSize: '0.9rem',
            marginBottom: '0.25rem'
          }}>
            {statusInfo.title}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#6b7280',
            lineHeight: '1.4'
          }}>
            {statusInfo.message}
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {lastCheck && (
          <div style={{
            fontSize: '0.75rem',
            color: '#9ca3af'
          }}>
            Last check: {lastCheck.toLocaleTimeString()}
          </div>
        )}
        
        <button
          onClick={checkBackendStatus}
          style={{
            background: 'none',
            border: 'none',
            color: statusInfo.color,
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}
          title="Refresh status"
        >
          <FaSync />
        </button>
        
        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem'
          }}
          title="Dismiss"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default BackendStatusBanner;

