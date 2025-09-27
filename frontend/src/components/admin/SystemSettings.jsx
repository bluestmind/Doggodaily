import React, { useState, useEffect } from 'react';
import { FaCog, FaDatabase, FaServer, FaSave, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const SystemSettings = ({ adminService }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteTitle: 'DoggODaily',
    allowRegistration: true,
    requireEmailVerification: true,
    maintenanceMode: false,
    maxFileSize: '10MB',
    sessionTimeout: 30
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real settings from backend
      try {
        const response = await adminService.getSystemSettings();
        
        if (response.success) {
          setSettings(response.data);
          console.log('✅ System settings loaded from backend');
        } else {
          throw new Error('Backend response unsuccessful');
        }
      } catch (backendError) {
        console.warn('⚠️ Backend settings unavailable, using defaults:', backendError.message);
        // Keep default settings
      }
    } catch (error) {
      console.error('❌ Error loading system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await adminService.updateSystemSettings(settings);
      
      if (response.success) {
        console.log('✅ Settings saved successfully');
                              alert('Settings saved successfully!');
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{
          fontSize: 'var(--text-4xl)',
          fontWeight: '800',
          color: 'var(--gray-900)',
          margin: 0,
          marginBottom: 'var(--space-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}>
          <FaCog style={{ color: 'var(--primary-teal)' }} />
          System Settings
        </h1>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--gray-600)',
          margin: 0
        }}>
          Configure global system preferences and security settings.
        </p>
      </div>
      
      <div style={{
        background: 'var(--gradient-card)',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--gray-200)',
          background: 'rgba(0, 191, 174, 0.02)'
        }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0
          }}>
            General Configuration
          </h2>
        </div>
        
        <div style={{ padding: 'var(--space-6)' }}>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
          gap: 'clamp(1rem, 3vw, 2rem)' 
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600', 
              color: '#4b5563',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Site Title
            </label>
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(e) => setSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
              style={{
                width: '100%',
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                background: 'white',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                transition: 'border-color 0.2s ease',
                ':focus': {
                  outline: 'none',
                  borderColor: '#667eea'
                }
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600', 
              color: '#4b5563',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Max File Size
            </label>
            <select
              value={settings.maxFileSize}
              onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
              style={{
                width: '100%',
                padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                background: 'white',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="5MB">5 MB</option>
              <option value="10MB">10 MB</option>
              <option value="25MB">25 MB</option>
              <option value="50MB">50 MB</option>
            </select>
          </div>
        </div>

          <div style={{
            borderTop: '1px solid var(--gray-200)',
            paddingTop: 'var(--space-6)'
          }}>
            <h3 style={{
              fontSize: 'var(--text-xl)',
              fontWeight: '700',
              color: 'var(--gray-900)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <FaToggleOn style={{ color: 'var(--primary-teal)' }} />
              Feature Toggles
            </h3>
            
            <div style={{
              display: 'grid',
              gap: 'var(--space-4)'
            }}>
              {[
                { key: 'allowRegistration', label: 'Allow New User Registration', description: 'Enable public user registration' },
                { key: 'requireEmailVerification', label: 'Require Email Verification', description: 'Users must verify email before access' },
                { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Temporarily disable public access' }
              ].map(({ key, label, description }) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  background: 'rgba(0, 191, 174, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)',
                  transition: 'all var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(0, 191, 174, 0.05)';
                  e.target.style.borderColor = 'var(--primary-teal)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(0, 191, 174, 0.02)';
                  e.target.style.borderColor = 'var(--gray-200)';
                }}>
                  <div>
                    <h4 style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: '600',
                      color: 'var(--gray-900)',
                      margin: 0,
                      marginBottom: 'var(--space-1)'
                    }}>
                      {label}
                    </h4>
                    <p style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--gray-600)',
                      margin: 0
                    }}>
                      {description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--text-2xl)',
                      color: settings[key] ? 'var(--success)' : 'var(--gray-400)',
                      transition: 'all var(--transition-base)',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-md)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = settings[key] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'none';
                    }}
                  >
                    {settings[key] ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{
          padding: 'var(--space-6)',
          borderTop: '1px solid var(--gray-200)',
          background: 'var(--gray-50)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            style={{
              padding: 'var(--space-3) var(--space-8)',
              background: 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-base)',
              transition: 'all var(--transition-base)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <FaSave />
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 