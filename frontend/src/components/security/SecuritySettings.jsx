import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/Notification';
import TwoFactorSetup from './TwoFactorSetup';
import SessionManager from './SessionManager';
import { 
  FaShield, FaKey, FaHistory, FaExclamationTriangle, FaCheck, FaTimes,
  FaLock, FaUnlock, FaEye, FaEyeSlash, FaCog, FaUsers, FaCalendarAlt,
  FaFingerprint, FaGlobe, FaEnvelope, FaBell, FaDownload
} from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const SecuritySettings = () => {
  const { 
    user, 
    changePassword, 
    disable2FA, 
    getSecurityInfo,
    resendVerificationEmail,
    getSessions,
    endAllSessions
  } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [securityInfo, setSecurityInfo] = useState(null);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    logoutAllSessions: true
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // 2FA disable form
  const [disable2FAForm, setDisable2FAForm] = useState({
    password: '',
    showPassword: false
  });

  useEffect(() => {
    loadSecurityInfo();
  }, []);

  const loadSecurityInfo = async () => {
    try {
      const info = getSecurityInfo();
      setSecurityInfo(info);
    } catch (error) {
      console.error('Failed to load security info:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    // Validation
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_new_password: passwordForm.confirmPassword,
        logout_all_sessions: passwordForm.logoutAllSessions
      });

      if (result.success) {
        showSuccess('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          logoutAllSessions: true
        });
      } else {
        showError(result.error || 'Failed to change password');
      }
    } catch (error) {
      showError('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async (e) => {
    e.preventDefault();
    if (!disable2FAForm.password) {
      showError('Password is required to disable 2FA');
      return;
    }

    setIsLoading(true);
    try {
      const result = await disable2FA(disable2FAForm.password);
      if (result.success) {
        showSuccess('Two-factor authentication has been disabled');
        setDisable2FAForm({ password: '', showPassword: false });
        loadSecurityInfo();
      } else {
        showError(result.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      showError('Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        showSuccess('Verification email sent successfully');
      } else {
        showError(result.error || 'Failed to send verification email');
      }
    } catch (error) {
      showError('Failed to send verification email');
    } finally {
      setIsLoading(false);
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
      } else {
        showError(result.error || 'Failed to end sessions');
      }
    } catch (error) {
      showError('Failed to end sessions');
    } finally {
      setIsLoading(false);
    }
  };

  // Security Overview Component
  const SecurityOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Security Score */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--gray-900)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaShield style={{ color: 'var(--primary-teal)' }} />
          Security Status
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email Verification */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: user?.email_verified ? '#10b981' : '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user?.email_verified ? 
                  <FaCheck style={{ color: 'white', fontSize: '1rem' }} /> :
                  <FaTimes style={{ color: 'white', fontSize: '1rem' }} />
                }
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--gray-900)' }}>
                  Email Verification
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  {user?.email_verified ? 'Your email is verified' : 'Please verify your email address'}
                </p>
              </div>
            </div>
            {!user?.email_verified && (
              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-teal)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Resend Email
              </button>
            )}
          </div>

          {/* Two-Factor Authentication */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: user?.two_factor_enabled ? '#10b981' : '#f59e0b',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaShield style={{ color: 'white', fontSize: '1rem' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--gray-900)' }}>
                  Two-Factor Authentication
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  {user?.two_factor_enabled ? 
                    'Extra security with authenticator app' : 
                    'Recommended for enhanced security'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => user?.two_factor_enabled ? setActiveTab('2fa') : setShow2FASetup(true)}
              style={{
                padding: '0.5rem 1rem',
                background: user?.two_factor_enabled ? '#ef4444' : 'var(--primary-teal)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {user?.two_factor_enabled ? 'Manage' : 'Enable'}
            </button>
          </div>

          {/* Password Strength */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaKey style={{ color: 'white', fontSize: '1rem' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--gray-900)' }}>
                  Password Security
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  Strong password with secure encryption
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('password')}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--gray-600)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--gray-900)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaHistory style={{ color: 'var(--primary-teal)' }} />
          Recent Security Activity
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaFingerprint style={{ color: 'var(--gray-400)' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gray-900)' }}>
                Last login from {securityInfo?.last_ip || 'Unknown location'}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                {securityInfo?.last_login ? new Date(securityInfo.last_login).toLocaleString() : 'Unknown time'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSessionManager(true)}
            style={{
              padding: '0.75rem',
              background: 'var(--gray-100)',
              color: 'var(--gray-700)',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            View all active sessions →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--gray-900)',
          marginBottom: '1rem'
        }}>
          Quick Actions
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button
            onClick={handleEndAllSessions}
            disabled={isLoading}
            style={{
              padding: '1rem',
              background: '#fef3cd',
              color: '#92400e',
              border: '1px solid #fecf47',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaUsers />
            End All Sessions
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            style={{
              padding: '1rem',
              background: '#f0f9ff',
              color: '#0369a1',
              border: '1px solid #bae6fd',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaGlobe />
            Manage Sessions
          </button>
        </div>
      </div>
    </div>
  );

  // Password Change Component
  const PasswordChange = () => (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      maxWidth: '500px'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--gray-900)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <FaKey style={{ color: 'var(--primary-teal)' }} />
        Change Password
      </h3>

      <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Current Password */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--gray-700)',
            marginBottom: '0.5rem'
          }}>
            Current Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 3rem 0.75rem 0.75rem',
                border: `1px solid ${passwordErrors.currentPassword ? '#ef4444' : 'var(--gray-300)'}`,
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gray-400)'
              }}
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordErrors.currentPassword && (
            <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>
              {passwordErrors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--gray-700)',
            marginBottom: '0.5rem'
          }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 3rem 0.75rem 0.75rem',
                border: `1px solid ${passwordErrors.newPassword ? '#ef4444' : 'var(--gray-300)'}`,
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gray-400)'
              }}
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordErrors.newPassword && (
            <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>
              {passwordErrors.newPassword}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--gray-700)',
            marginBottom: '0.5rem'
          }}>
            Confirm New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem 3rem 0.75rem 0.75rem',
                border: `1px solid ${passwordErrors.confirmPassword ? '#ef4444' : 'var(--gray-300)'}`,
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gray-400)'
              }}
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordErrors.confirmPassword && (
            <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>
              {passwordErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Logout All Sessions Option */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
            color: 'var(--gray-700)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={passwordForm.logoutAllSessions}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, logoutAllSessions: e.target.checked }))}
              style={{ width: '1rem', height: '1rem' }}
            />
            Log out all other sessions after password change
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: isLoading ? 'var(--gray-400)' : 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" />
              Changing Password...
            </>
          ) : (
            <>
              <FaKey />
              Change Password
            </>
          )}
        </button>
      </form>
    </div>
  );

  // 2FA Management Component
  const TwoFactorManagement = () => (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      maxWidth: '500px'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--gray-900)',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <FaShield style={{ color: 'var(--primary-teal)' }} />
        Two-Factor Authentication
      </h3>

      {user?.two_factor_enabled ? (
        <div>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              margin: 0,
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaCheck style={{ color: '#10b981' }} />
              Two-factor authentication is currently enabled for your account.
            </p>
          </div>

          <form onSubmit={handleDisable2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Enter your password to disable 2FA
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={disable2FAForm.showPassword ? 'text' : 'password'}
                  value={disable2FAForm.password}
                  onChange={(e) => setDisable2FAForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setDisable2FAForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gray-400)'
                  }}
                >
                  {disable2FAForm.showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div style={{
              background: '#fef3cd',
              border: '1px solid #fecf47',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem'
            }}>
              <p style={{
                margin: 0,
                color: '#92400e',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <FaExclamationTriangle style={{ marginTop: '0.125rem' }} />
                Disabling 2FA will make your account less secure. Make sure your password is strong and unique.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !disable2FAForm.password}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: (isLoading || !disable2FAForm.password) ? 'var(--gray-400)' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: (isLoading || !disable2FAForm.password) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  Disabling 2FA...
                </>
              ) : (
                <>
                  <FaUnlock />
                  Disable Two-Factor Authentication
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div style={{
            background: '#fef3cd',
            border: '1px solid #fecf47',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              margin: 0,
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaExclamationTriangle />
              Two-factor authentication is not enabled. Enable it for better security.
            </p>
          </div>

          <button
            onClick={() => setShow2FASetup(true)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'var(--primary-teal)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <FaShield />
            Enable Two-Factor Authentication
          </button>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaShield },
    { id: 'password', label: 'Password', icon: FaKey },
    { id: '2fa', label: '2FA', icon: FaLock },
    { id: 'sessions', label: 'Sessions', icon: FaUsers }
  ];

  if (show2FASetup) {
    return (
      <TwoFactorSetup
        onComplete={() => {
          setShow2FASetup(false);
          loadSecurityInfo();
        }}
        onCancel={() => setShow2FASetup(false)}
      />
    );
  }

  if (showSessionManager) {
    return (
      <SessionManager
        onBack={() => setShowSessionManager(false)}
      />
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--gray-900)',
          marginBottom: '0.5rem'
        }}>
          Security Settings
        </h1>
        <p style={{ color: 'var(--gray-600)', fontSize: '1.1rem' }}>
          Manage your account security and privacy settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e2e8f0',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-teal)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary-teal)' : 'var(--gray-600)',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <SecurityOverview />}
        {activeTab === 'password' && <PasswordChange />}
        {activeTab === '2fa' && <TwoFactorManagement />}
        {activeTab === 'sessions' && (
          <SessionManager onBack={() => setActiveTab('overview')} />
        )}
      </div>
    </div>
  );
};

export default SecuritySettings; 