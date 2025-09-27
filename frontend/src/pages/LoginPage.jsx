import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../components/common/Notification';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock,  FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError, showWarning } = useNotification();

  // Local validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, error: t('validation.emailRequired') };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: t('validation.emailInvalid') };
    }
    return { isValid: true };
  };
  
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
  const [securityAlert, setSecurityAlert] = useState(null);
  const [accountLocked, setAccountLocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      setErrors({});
      setSecurityAlert(null);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired');
    }

    // 2FA validation when required
    if (requires2FA && !formData.twoFactorToken) {
      newErrors.twoFactorToken = t('auth.requires2FA');
    } else if (requires2FA && formData.twoFactorToken && !/^\d{6}$/.test(formData.twoFactorToken)) {
      newErrors.twoFactorToken = t('validation.invalidCode');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSecurityAlert(null);
    
    try {
      const loginCredentials = {
        email: formData.email,
        password: formData.password,
        remember_me: formData.rememberMe
      };
      if (formData.twoFactorToken) {
        loginCredentials.two_fa_token = formData.twoFactorToken;
      }
      const result = await login(loginCredentials);
      
      if (result.success) {
        // Handle security alerts
        if (result.security_alert) {
          setSecurityAlert(result.security_alert);
          showWarning(`Security Alert: ${result.security_alert}`);
        }

        // Handle password change requirement
        if (result.requires_password_change) {
          showWarning('Your password needs to be changed for security reasons');
          navigate('/change-password');
          return;
        }

        showSuccess(result.message || 'Login successful!');
        navigate('/');
      } else if (result.requires_2fa) {
        // Enable 2FA input
        setRequires2FA(true);
        showWarning('Please enter your two-factor authentication code');
      } else if (result.error) {
        // Handle various error types
        if (result.error.includes('locked')) {
          setAccountLocked(true);
          showError(result.error);
        } else if (result.error.includes('attempts')) {
          const attemptMatch = result.error.match(/(\d+)/);
          if (attemptMatch) {
            setFailedAttempts(parseInt(attemptMatch[1]));
          }
          showError(result.error);
        } else {
          showError(result.error);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

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
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            {requires2FA ? t('auth.requires2FA') : t('auth.welcomeBack')}
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1rem'
          }}>
            {requires2FA 
              ? 'Enter the 6-digit code from your authenticator app' 
              : 'Sign in to your DoggoDaily account'
            }
          </p>
        </div>

        {/* Security Alert */}
        {securityAlert && (
          <div style={{
            background: '#fef3cd',
            border: '1px solid #fecf47',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <FaExclamationTriangle style={{ color: '#f59e0b', marginTop: '0.125rem' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', fontWeight: 500 }}>
                Security Notice
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#92400e' }}>
                {securityAlert}
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
                {t('auth.email')}
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
                  placeholder={t('auth.email')}
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
                {t('auth.password')}
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
                  placeholder={t('auth.password')}
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
                < FaSpinner style={{
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

          {/* Remember Me and Forgot Password */}
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
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.9rem',
                  color: 'var(--primary-teal)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}
              >
                Forgot password?
              </button>
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
                  <>< FaSpinner /> Verify & Sign In</>
                ) : (
                  'Sign In'
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


        {/* Sign Up Link */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '0.9rem'
          }}>
            {t('auth.dontHaveAccount')}{' '}
            <Link
              to="/signup"
              style={{
                color: 'var(--primary-teal)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              {t('auth.signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 