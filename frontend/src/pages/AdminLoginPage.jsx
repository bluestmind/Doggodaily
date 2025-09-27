import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaExclamationTriangle, FaSpinner, FaShieldAlt } from 'react-icons/fa';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorToken: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Check if user is already authenticated and is admin
    const user = authService.getUser();
    const adminLevels = ['super_admin', 'admin', 'moderator'];
    const isAdminUser = user?.admin_level && adminLevels.includes(user.admin_level);
    
    if (isAuthenticated() && isAdminUser) {
      console.log('👑 User already authenticated as admin, redirecting to admin panel');
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password && !requires2FA) newErrors.password = 'Password is required';
    if (requires2FA && !formData.twoFactorToken) newErrors.twoFactorToken = 'Two-factor authentication code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      const loginData = {
        email: formData.email,
        password: formData.password,
        remember_me: formData.rememberMe,
        login_type: 'admin',
      };
      
      if (formData.twoFactorToken) {
        loginData.two_fa_token = formData.twoFactorToken;
      }
      
      console.log('🔐 Attempting admin login with:', { email: formData.email });
      const result = await login(loginData);
      
      if (result.success) {
        console.log('✅ Admin login successful');
        // Check if the user is an admin from the login result
        const adminLevels = ['super_admin', 'admin', 'moderator'];
        const isAdminUser = result.user?.admin_level && adminLevels.includes(result.user.admin_level);
        
        if (isAdminUser) {
          console.log('👑 User is admin, navigating to admin panel');
          navigate('/admin');
        } else {
          console.log('❌ User is not admin, access denied');
          setErrorMsg('Access denied. Admin privileges required.');
        }
      } else if (result.requires_2fa) {
        console.log('🔐 2FA required');
        setRequires2FA(true);
        setErrorMsg('');
      } else if (result.account_locked) {
        console.log('🔒 Account locked');
        setAccountLocked(true);
        setErrorMsg(result.message || 'Account is locked.');
      } else if (result.failed_attempts) {
        console.log('❌ Login failed');
        setFailedAttempts(result.failed_attempts);
        setErrorMsg(result.message || 'Login failed.');
      } else {
        console.log('❌ Login failed:', result.message);
        setErrorMsg(result.message || 'Login failed.');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gradient-primary)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <FaShieldAlt style={{
              fontSize: '2.5rem',
              color: 'var(--primary-teal)',
              marginRight: '0.75rem'
            }} />
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              {requires2FA ? 'Admin 2FA' : 'Admin Login'}
            </h1>
          </div>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1rem'
          }}>
            {requires2FA
              ? 'Enter the 2FA code for your admin account'
              : 'Sign in to your admin panel'
            }
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <FaExclamationTriangle style={{ color: '#dc2626', marginTop: '0.125rem' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: 500 }}>
                {errorMsg}
              </p>
            </div>
          </div>
        )}

        {/* Account Locked Warning */}
        {accountLocked && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <FaLock style={{ color: '#dc2626', marginTop: '0.125rem' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', fontWeight: 500 }}>
                Account Temporarily Locked
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#991b1b' }}>
                Too many failed login attempts. Please wait or reset your password.
              </p>
            </div>
          </div>
        )}

        {/* Failed Attempts Warning */}
        {failedAttempts > 0 && failedAttempts < 5 && !accountLocked && (
          <div style={{
            background: '#fef3cd',
            border: '1px solid #fecf47',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <FaExclamationTriangle style={{ color: '#f59e0b' }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
              Warning: {failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}. 
              Account will be locked after 5 attempts.
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Email Field - Hide when 2FA is required */}
          {!requires2FA && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--gray-400)',
                  fontSize: '1rem'
                }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your admin email"
                  disabled={accountLocked}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    border: `1px solid ${errors.email ? '#ef4444' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'var(--transition-base)',
                    background: accountLocked ? 'var(--gray-100)' : 'white',
                    opacity: accountLocked ? 0.7 : 1
                  }}
                  onFocus={(e) => {
                    if (!accountLocked) {
                      e.target.style.borderColor = 'var(--primary-teal)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 191, 174, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? '#ef4444' : 'var(--gray-300)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.email && (
                <p style={{
                  fontSize: '0.8rem',
                  color: '#ef4444',
                  marginTop: '0.25rem'
                }}>
                  {errors.email}
                </p>
              )}
            </div>
          )}

          {/* Password Field - Hide when 2FA is required */}
          {!requires2FA && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--gray-400)',
                  fontSize: '1rem'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={accountLocked}
                  style={{
                    width: '100%',
                    padding: '0.75rem 3rem 0.75rem 3rem',
                    border: `1px solid ${errors.password ? '#ef4444' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'var(--transition-base)',
                    background: accountLocked ? 'var(--gray-100)' : 'white',
                    opacity: accountLocked ? 0.7 : 1
                  }}
                  onFocus={(e) => {
                    if (!accountLocked) {
                      e.target.style.borderColor = 'var(--primary-teal)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 191, 174, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? '#ef4444' : 'var(--gray-300)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={accountLocked}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--gray-400)',
                    cursor: accountLocked ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    opacity: accountLocked ? 0.5 : 1
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p style={{
                  fontSize: '0.8rem',
                  color: '#ef4444',
                  marginTop: '0.25rem'
                }}>
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {/* Two-Factor Authentication Field */}
          {requires2FA && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Authentication Code
              </label>
              <div style={{ position: 'relative' }}>
                <FaSpinner style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--gray-400)',
                  fontSize: '1rem'
                }} />
                <input
                  type="text"
                  name="twoFactorToken"
                  value={formData.twoFactorToken}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    border: `1px solid ${errors.twoFactorToken ? '#ef4444' : 'var(--gray-300)'}`,
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1.5rem',
                    letterSpacing: '0.5rem',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'var(--transition-base)',
                    background: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-teal)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0, 191, 174, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.twoFactorToken ? '#ef4444' : 'var(--gray-300)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.twoFactorToken && (
                <p style={{
                  fontSize: '0.8rem',
                  color: '#ef4444',
                  marginTop: '0.25rem'
                }}>
                  {errors.twoFactorToken}
                </p>
              )}
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--gray-500)',
                marginTop: '0.5rem'
              }}>
                Open your authenticator app and enter the 6-digit code
              </p>
            </div>
          )}

          {/* Remember Me */}
          {!requires2FA && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'var(--gray-700)',
                cursor: accountLocked ? 'not-allowed' : 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={accountLocked}
                  style={{
                    width: '1rem',
                    height: '1rem',
                    cursor: accountLocked ? 'not-allowed' : 'pointer'
                  }}
                />
                Remember me
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || accountLocked}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: (isSubmitting || accountLocked) ? 'var(--gray-400)' : 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: (isSubmitting || accountLocked) ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                {requires2FA ? 'Verifying...' : 'Signing In...'}
              </>
            ) : (
              <>
                {requires2FA ? (
                  <><FaSpinner /> Verify & Sign In</>
                ) : (
                  'Sign In to Admin Panel'
                )}
              </>
            )}
          </button>

          {/* Back to credentials button for 2FA */}
          {requires2FA && (
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setFormData(prev => ({ ...prev, twoFactorToken: '' }));
                setErrors({});
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                color: 'var(--gray-600)',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-base)'
              }}
            >
              Back to Login
            </button>
          )}
        </form>

        {/* Admin Info */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{
            color: 'var(--gray-500)',
            fontSize: '0.8rem',
            marginBottom: '0.5rem'
          }}>
            Admin Access Required
          </p>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '0.9rem'
          }}>
            Only authorized administrators can access this panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage; 