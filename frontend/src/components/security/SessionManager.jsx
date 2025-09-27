import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/Notification';
import { 
  FaDesktop, FaMobile, FaTablet, FaGlobe, FaClock, FaMapMarkerAlt,
  FaTrash, FaShield, FaExclamationTriangle, FaArrowLeft, FaUsers
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const SessionManager = ({ onBack }) => {
  const { getSessions, endSession, endAllSessions } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [endingSession, setEndingSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const result = await getSessions();
      if (result.success) {
        setSessions(result.sessions || []);
      } else {
        showError(result.error || 'Failed to load sessions');
      }
    } catch (error) {
      showError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async (sessionId) => {
    setEndingSession(sessionId);
    try {
      const result = await endSession(sessionId);
      if (result.success) {
        showSuccess('Session ended successfully');
        setSessions(prev => prev.filter(session => session.id !== sessionId));
      } else {
        showError(result.error || 'Failed to end session');
      }
    } catch (error) {
      showError('Failed to end session');
    } finally {
      setEndingSession(null);
    }
  };

  const handleEndAllSessions = async () => {
    if (!window.confirm('This will log you out of all devices. Continue?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await endAllSessions();
      if (result.success) {
        showSuccess('All sessions have been ended');
        // The user will be logged out, so we don't need to update sessions
      } else {
        showError(result.error || 'Failed to end all sessions');
        setIsLoading(false);
      }
    } catch (error) {
      showError('Failed to end all sessions');
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return FaDesktop;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return FaMobile;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return FaTablet;
    }
    return FaDesktop;
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return { browser: 'Unknown Browser', os: 'Unknown OS' };

    const ua = userAgent.toLowerCase();
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Browser detection
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    // OS detection
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { browser, os };
  };

  const formatLastActivity = (lastActivity) => {
    if (!lastActivity) return 'Unknown';
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner message="Loading active sessions..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary-teal)',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}
        >
          <FaArrowLeft />
          Back to Security Settings
        </button>

        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--gray-900)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <FaUsers style={{ color: 'var(--primary-teal)' }} />
          Active Sessions
        </h2>
        <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          Manage your active sessions across all devices. End suspicious sessions immediately.
        </p>
      </div>

      {/* Security Warning */}
      <div style={{
        background: '#fef3cd',
        border: '1px solid #fecf47',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <FaExclamationTriangle style={{ color: '#f59e0b', marginTop: '0.125rem' }} />
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#92400e', fontWeight: 500 }}>
            Security Notice
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
            If you see any sessions you don't recognize, end them immediately and change your password.
          </p>
        </div>
      </div>

      {/* Sessions Summary */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--gray-900)',
              margin: 0
            }}>
              Session Overview
            </h3>
            <p style={{
              margin: '0.25rem 0 0 0',
              color: 'var(--gray-600)',
              fontSize: '0.9rem'
            }}>
              {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {sessions.length > 1 && (
            <button
              onClick={handleEndAllSessions}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaTrash />
              End All Sessions
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--gray-600)' }}>Total Sessions</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--gray-900)' }}>
              {sessions.length}
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--gray-600)' }}>Current Session</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary-teal)' }}>
              <FaShield />
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--gray-600)' }}>Device Types</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--gray-900)' }}>
              {new Set(sessions.map(s => getDeviceInfo(s.user_agent).os)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sessions.length === 0 ? (
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <FaUsers style={{ fontSize: '3rem', color: 'var(--gray-400)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              No Active Sessions
            </h3>
            <p style={{ color: 'var(--gray-600)' }}>
              There are currently no active sessions for your account.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const DeviceIcon = getDeviceIcon(session.user_agent);
            const deviceInfo = getDeviceInfo(session.user_agent);
            const isCurrentSession = session.is_current;

            return (
              <div
                key={session.id}
                style={{
                  background: 'white',
                  border: `1px solid ${isCurrentSession ? 'var(--primary-teal)' : '#e2e8f0'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  position: 'relative'
                }}
              >
                {/* Current Session Badge */}
                {isCurrentSession && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'var(--primary-teal)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <FaShield />
                    Current Session
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Device Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: isCurrentSession ? 'var(--primary-teal)' : 'var(--gray-100)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <DeviceIcon style={{
                      color: isCurrentSession ? 'white' : 'var(--gray-600)',
                      fontSize: '1.25rem'
                    }} />
                  </div>

                  {/* Session Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'var(--gray-900)',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {deviceInfo.browser} on {deviceInfo.os}
                        </h4>
                        <p style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          color: 'var(--gray-600)'
                        }}>
                          {session.user_agent || 'Unknown device'}
                        </p>
                      </div>

                      {/* End Session Button */}
                      {!isCurrentSession && (
                        <button
                          onClick={() => handleEndSession(session.id)}
                          disabled={endingSession === session.id}
                          style={{
                            padding: '0.5rem 1rem',
                            background: endingSession === session.id ? 'var(--gray-400)' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            cursor: endingSession === session.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {endingSession === session.id ? (
                            <LoadingSpinner size="small" />
                          ) : (
                            <FaTrash />
                          )}
                          {endingSession === session.id ? 'Ending...' : 'End Session'}
                        </button>
                      )}
                    </div>

                    {/* Session Info Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaMapMarkerAlt style={{ color: 'var(--gray-400)' }} />
                        <div>
                          <p style={{ margin: 0, color: 'var(--gray-600)' }}>Location</p>
                          <p style={{ margin: 0, fontWeight: 500, color: 'var(--gray-900)' }}>
                            {session.ip_address || 'Unknown'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaClock style={{ color: 'var(--gray-400)' }} />
                        <div>
                          <p style={{ margin: 0, color: 'var(--gray-600)' }}>Last Activity</p>
                          <p style={{ margin: 0, fontWeight: 500, color: 'var(--gray-900)' }}>
                            {formatLastActivity(session.last_activity)}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaGlobe style={{ color: 'var(--gray-400)' }} />
                        <div>
                          <p style={{ margin: 0, color: 'var(--gray-600)' }}>Created</p>
                          <p style={{ margin: 0, fontWeight: 500, color: 'var(--gray-900)' }}>
                            {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Additional Security Tips */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h4 style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#0369a1',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaShield />
          Security Tips
        </h4>
        <ul style={{
          margin: 0,
          paddingLeft: '1.5rem',
          color: '#0369a1',
          fontSize: '0.9rem',
          lineHeight: '1.5'
        }}>
          <li>Regularly review your active sessions and end any you don't recognize</li>
          <li>Always log out from shared or public computers</li>
          <li>Enable two-factor authentication for enhanced security</li>
          <li>Use strong, unique passwords for your account</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionManager; 