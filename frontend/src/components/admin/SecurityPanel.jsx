import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaLock, FaKey, FaEye, FaBan,
  FaSearch, FaFilter, FaDownload, FaUserShield, FaClock, FaMapMarkerAlt
} from 'react-icons/fa';

const SecurityPanel = ({ adminService }) => {
  const [activeTab, setActiveTab] = useState('logs');
  const [loading, setLoading] = useState(true);
  const [securityData, setSecurityData] = useState(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real security data from backend
      try {
        const logsResponse = await adminService.getSecurityLogs();
        const settingsResponse = await adminService.getSecuritySettings();
        
        if (logsResponse.success && settingsResponse.success) {
          setSecurityData({
            logs: logsResponse.data.logs || [],
            settings: settingsResponse.data.settings || {}
          });
          console.log('✅ Security data loaded from backend');
        } else {
          throw new Error('Backend response unsuccessful');
        }
        

      } catch (backendError) {
        console.warn('⚠️ Backend security data unavailable, using mock data:', backendError.message);
        
        // Fallback mock security data
        setSecurityData({
          logs: [
            {
              id: 1,
              type: 'warning',
              event: 'Multiple failed login attempts',
              user: 'unknown@suspicious.com',
              ip: '192.168.1.100',
              location: 'Unknown',
              timestamp: '2024-01-15 14:30:25',
              details: '5 failed attempts in 2 minutes'
            },
            {
              id: 2,
              type: 'success',
              event: 'Admin login successful',
              user: 'admin@daggodaily.com',
              ip: '10.0.0.50',
              location: 'Office Network',
              timestamp: '2024-01-15 14:25:10',
              details: 'Login from trusted device'
            }
          ],
          settings: {
            passwordPolicy: {
              minLength: 8,
              requireNumbers: true,
              requireSymbols: true,
              requireUppercase: true,
              passwordExpiry: 90
            },
            sessionSettings: {
              sessionTimeout: 30,
              maxConcurrentSessions: 3,
              logoutOnClose: true
            },
            accessControl: {
              twoFactorRequired: true,
              ipWhitelist: ['10.0.0.0/24', '192.168.1.0/24'],
              maxLoginAttempts: 5,
              lockoutDuration: 15
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const securityLogs = securityData?.logs || [];

  const securitySettings = securityData?.settings || {
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true,
      passwordExpiry: 90
    },
    sessionSettings: {
      sessionTimeout: 30,
      maxConcurrentSessions: 3,
      logoutOnClose: true
    },
    accessControl: {
      twoFactorRequired: true,
      ipWhitelist: ['10.0.0.0/24', '192.168.1.0/24'],
      maxLoginAttempts: 5,
      lockoutDuration: 15
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--gray-900)',
            marginBottom: '0.5rem'
          }}>
            Security Center
          </h2>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
            Monitor security events and manage access controls
          </p>
        </div>
      </div>

      {/* Security Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {[
          { label: 'Security Score', value: '94%', icon: FaShieldAlt, color: '#10b981', status: 'Excellent' },
          { label: 'Active Threats', value: '2', icon: FaExclamationTriangle, color: '#f59e0b', status: 'Low Risk' },
          { label: 'Failed Logins', value: '15', icon: FaBan, color: '#ef4444', status: 'Today' },
          { label: 'Active Sessions', value: '23', icon: FaUserShield, color: '#0ea5e9', status: 'Current' }
        ].map((metric, index) => (
          <div key={index} className="card" style={{
            padding: '2rem',
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: `${metric.color}20`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <metric.icon style={{ fontSize: '1.5rem', color: metric.color }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: 'var(--gray-900)',
                  margin: 0
                }}>
                  {metric.value}
                </h3>
                <p style={{
                  color: 'var(--gray-600)',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  {metric.label}
                </p>
              </div>
            </div>
            <span style={{
              background: `${metric.color}20`,
              color: metric.color,
              padding: '0.3rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              {metric.status}
            </span>
          </div>
        ))}
      </div>

      {/* Security Logs */}
      <div className="card" style={{
        padding: '2rem',
        background: 'var(--gradient-card)',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <h4 style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: 'var(--gray-900)',
          marginBottom: '2rem'
        }}>
          Recent Security Events
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0, 191, 174, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-700)' }}>
                  Event
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-700)' }}>
                  User/IP
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-700)' }}>
                  Time
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: 'var(--gray-700)' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {securityLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(0, 191, 174, 0.1)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                        {log.event}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                        {log.details}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                      <div>{log.user}</div>
                      <div>{log.ip}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                    {log.timestamp}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: log.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: log.type === 'warning' ? '#f59e0b' : '#10b981',
                      padding: '0.3rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {log.type === 'warning' ? 'Warning' : 'Success'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel; 