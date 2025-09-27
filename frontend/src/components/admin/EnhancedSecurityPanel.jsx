import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaLock, FaKey, FaEye, FaBan,
  FaSearch, FaFilter, FaDownload, FaUserShield, FaClock, FaMapMarkerAlt,
  FaServer, FaTools, FaCog, FaChartLine, FaSpinner, FaPlay, FaPause,
  FaBell, FaHistory, FaGlobe, FaNetworkWired, FaDatabase, FaSyncAlt
} from 'react-icons/fa';
import enhancedAdminService from '../../services/enhancedAdminService';
import LoadingSpinner from '../common/LoadingSpinner';

const EnhancedSecurityPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [securityData, setSecurityData] = useState(null);
  const [threats, setThreats] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [securityConfig, setSecurityConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Form states
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardResponse, threatsResponse, blacklistResponse, maintenanceResponse, configResponse] = await Promise.all([
        enhancedAdminService.getSecurityDashboard(timeRange),
        enhancedAdminService.getThreats(),
        enhancedAdminService.getBlacklist(),
        enhancedAdminService.getMaintenanceStatus(),
        enhancedAdminService.getSecurityConfiguration()
      ]);
      
      if (dashboardResponse.success) {
        setSecurityData(dashboardResponse.data);
      }
      
      if (threatsResponse.success) {
        setThreats(threatsResponse.data);
      }
      
      if (blacklistResponse.success) {
        setBlacklist(blacklistResponse.data);
      }
      
      if (maintenanceResponse.success) {
        setMaintenanceStatus(maintenanceResponse.data);
      }
      
      if (configResponse.success) {
        setSecurityConfig(configResponse.data);
      }
      
    } catch (err) {
      console.error('Failed to load security data:', err);
      setError(err.message || 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const handleMitigateThreat = async (threatId, action) => {
    try {
      const response = await enhancedAdminService.mitigateThreat(threatId, action);
      if (response.success) {
        // Refresh threats data
        const threatsResponse = await enhancedAdminService.getThreats();
        if (threatsResponse.success) {
          setThreats(threatsResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to mitigate threat:', error);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      if (maintenanceStatus?.current_status?.is_enabled) {
        const response = await enhancedAdminService.disableMaintenance();
        if (response.success) {
          setMaintenanceStatus(prev => ({
            ...prev,
            current_status: { is_enabled: false }
          }));
        }
      } else {
        setShowMaintenanceModal(true);
      }
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    }
  };

  const SecurityMetricCard = ({ title, value, icon: Icon, color, status, description }) => (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem',
      transition: 'all 0.3s ease'
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
        {status && (
          <div style={{
            background: status === 'safe' ? '#10b98120' : status === 'warning' ? '#f59e0b20' : '#ef444420',
            color: status === 'safe' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {status.toUpperCase()}
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
      
      <p style={{
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#374151',
        margin: '0 0 0.25rem 0'
      }}>
        {title}
      </p>
      
      {description && (
        <p style={{
          fontSize: '0.8rem',
          color: '#6b7280',
          margin: 0
        }}>
          {description}
        </p>
      )}
    </div>
  );

  const DashboardTab = () => {
    if (!securityData) return <LoadingSpinner />;

    return (
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Security Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <SecurityMetricCard
            title="Active Threats"
            value={securityData.overview.active_threats}
            icon={FaExclamationTriangle}
            color={securityData.overview.active_threats > 0 ? '#ef4444' : '#10b981'}
            status={securityData.overview.active_threats > 0 ? 'danger' : 'safe'}
            description={`${securityData.overview.total_threats} total threats detected`}
          />
          <SecurityMetricCard
            title="Blocked IPs"
            value={securityData.overview.blocked_ips}
            icon={FaBan}
            color="var(--warning)"
            status="warning"
            description="Currently blocked IP addresses"
          />
          <SecurityMetricCard
            title="Failed Logins"
            value={securityData.overview.failed_logins}
            icon={FaLock}
            color="var(--error)"
            status={securityData.overview.failed_logins > 100 ? 'danger' : 'warning'}
            description={`Last ${timeRange} days`}
          />
          <SecurityMetricCard
            title="High Risk Events"
            value={securityData.overview.high_risk_events_24h}
            icon={FaShieldAlt}
            color="var(--primary-teal)"
            status={securityData.overview.high_risk_events_24h > 10 ? 'danger' : 'safe'}
            description="Last 24 hours"
          />
        </div>

        {/* Maintenance Mode Status */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#111827',
              margin: 0
            }}>
              🔧 Maintenance Mode
            </h3>
            <button
              onClick={handleToggleMaintenance}
              style={{
                background: maintenanceStatus?.current_status?.is_enabled ? '#ef4444' : 'var(--primary-teal)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {maintenanceStatus?.current_status?.is_enabled ? <FaPause /> : <FaPlay />}
              {maintenanceStatus?.current_status?.is_enabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          
          {maintenanceStatus?.current_status?.is_enabled ? (
            <div style={{
              background: '#f59e0b20',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FaExclamationTriangle style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: '600', color: '#f59e0b' }}>
                  Maintenance Mode Active
                </span>
              </div>
              <p style={{ color: '#374151', margin: '0 0 0.5rem 0' }}>
                {maintenanceStatus.current_status.message}
              </p>
              {maintenanceStatus.current_status.show_progress && (
                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'var(--primary-teal)',
                    height: '100%',
                    width: `${maintenanceStatus.current_status.progress_percentage || 0}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: '#10b98120',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCheckCircle style={{ color: '#10b981' }} />
                <span style={{ fontWeight: '600', color: '#10b981' }}>
                  Site Operating Normally
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Security Events */}
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
            Recent Security Events
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
            {securityData.recent_events.slice(0, 10).map((event, index) => (
              <div key={index} style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px',
                borderLeft: `4px solid ${
                  event.severity === 'critical' ? '#ef4444' :
                  event.severity === 'high' ? '#f59e0b' :
                  event.severity === 'medium' ? '#3b82f6' :
                  '#10b981'
                }`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#111827',
                      marginBottom: '0.25rem'
                    }}>
                      {event.description}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      {event.event_type} • {event.source_ip || 'Unknown IP'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: event.severity === 'critical' ? '#ef444420' :
                               event.severity === 'high' ? '#f59e0b20' :
                               event.severity === 'medium' ? '#3b82f620' :
                               '#10b98120',
                    color: event.severity === 'critical' ? '#ef4444' :
                           event.severity === 'high' ? '#f59e0b' :
                           event.severity === 'medium' ? '#3b82f6' :
                           '#10b981',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {event.severity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Threat Breakdown */}
        {securityData.threat_breakdown && securityData.threat_breakdown.length > 0 && (
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
              Threat Analysis
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {securityData.threat_breakdown.map((threat, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700',
                    color: threat.max_level === 'critical' ? '#ef4444' : 
                           threat.max_level === 'high' ? '#f59e0b' : 'var(--primary-teal)',
                    marginBottom: '0.5rem'
                  }}>
                    {threat.count}
                  </div>
                  <div style={{ 
                    fontWeight: '600',
                    color: '#111827',
                    textTransform: 'capitalize',
                    marginBottom: '0.25rem'
                  }}>
                    {threat.type.replace('_', ' ')}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    textTransform: 'uppercase'
                  }}>
                    {threat.max_level} Level
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ThreatsTab = () => (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '700',
          color: '#111827',
          margin: 0
        }}>
          Threat Detection
        </h3>
        <button
          onClick={handleRefresh}
          style={{
            background: 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FaSyncAlt />
          Refresh
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {threats.map((threat, index) => (
          <div key={index} style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            borderLeft: `4px solid ${
              threat.threat_level === 'critical' ? '#ef4444' :
              threat.threat_level === 'high' ? '#f59e0b' :
              threat.threat_level === 'medium' ? '#3b82f6' :
              '#10b981'
            }`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#111827',
                  marginBottom: '0.5rem'
                }}>
                  {threat.threat_type.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Source: {threat.source_ip} • Frequency: {threat.frequency}
                </div>
                {threat.target_endpoint && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#6b7280',
                    marginBottom: '0.5rem'
                  }}>
                    Target: {threat.target_endpoint}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  First seen: {new Date(threat.first_seen).toLocaleString()}
                  {threat.last_seen !== threat.first_seen && (
                    <> • Last seen: {new Date(threat.last_seen).toLocaleString()}</>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{
                  background: threat.threat_level === 'critical' ? '#ef444420' :
                             threat.threat_level === 'high' ? '#f59e0b20' :
                             threat.threat_level === 'medium' ? '#3b82f620' :
                             '#10b98120',
                  color: threat.threat_level === 'critical' ? '#ef4444' :
                         threat.threat_level === 'high' ? '#f59e0b' :
                         threat.threat_level === 'medium' ? '#3b82f6' :
                         '#10b981',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {threat.threat_level}
                </div>
                {threat.is_active && !threat.is_mitigated && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleMitigateThreat(threat.id, 'block_ip')}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Block IP
                    </button>
                    <button
                      onClick={() => handleMitigateThreat(threat.id, 'manual_review')}
                      style={{
                        background: 'var(--primary-teal)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Review
                    </button>
                  </div>
                )}
                {threat.is_mitigated && (
                  <div style={{
                    background: '#10b98120',
                    color: '#10b981',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    MITIGATED
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const BlacklistTab = () => (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '700',
          color: '#111827',
          margin: 0
        }}>
          IP Blacklist
        </h3>
        <button
          onClick={() => setShowAddBlacklistModal(true)}
          style={{
            background: 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Add IP
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {blacklist.map((entry, index) => (
          <div key={index} style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ 
                fontWeight: '600', 
                color: '#111827',
                marginBottom: '0.25rem'
              }}>
                {entry.ip_address}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#374151',
                marginBottom: '0.25rem'
              }}>
                {entry.reason}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                Added: {new Date(entry.created_at).toLocaleString()}
                {entry.hit_count > 0 && <> • Hits: {entry.hit_count}</>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: entry.threat_level === 'high' ? '#ef444420' :
                           entry.threat_level === 'medium' ? '#f59e0b20' :
                           '#10b98120',
                color: entry.threat_level === 'high' ? '#ef4444' :
                       entry.threat_level === 'medium' ? '#f59e0b' :
                       '#10b981',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {entry.threat_level}
              </div>
              <button
                onClick={() => enhancedAdminService.removeFromBlacklist(entry.id)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <LoadingSpinner size="lg" message="Loading security dashboard..." />
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
          Failed to Load Security Data
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
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#2d3748',
            margin: '0 0 0.5rem 0'
          }}>
            🛡️ Enhanced Security Center
          </h2>
          <p style={{
            color: '#718096',
            margin: 0
          }}>
            Advanced threat detection and security monitoring
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
            {refreshing ? <FaSpinner className="fa-spin" /> : <FaShieldAlt />}
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e2e8f0',
        overflowX: 'auto'
      }}>
        {[
          { id: 'dashboard', label: 'Security Dashboard', icon: FaShieldAlt },
          { id: 'threats', label: 'Threat Detection', icon: FaExclamationTriangle },
          { id: 'blacklist', label: 'IP Blacklist', icon: FaBan },
          { id: 'audit', label: 'Audit Logs', icon: FaHistory }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'threats' && <ThreatsTab />}
        {activeTab === 'blacklist' && <BlacklistTab />}
        {activeTab === 'audit' && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FaHistory style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }} />
            <h3>Audit Logs</h3>
            <p style={{ color: '#6b7280' }}>
              Audit logs functionality will be implemented here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSecurityPanel;