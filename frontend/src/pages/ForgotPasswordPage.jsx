import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../components/common/Notification';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FaEnvelope, FaArrowLeft, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import authService from '../services/authService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

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

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
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
    
    try {
      const result = await authService.forgotPassword(formData.email);
      
      if (result.success) {
        setEmailSent(true);
        showSuccess(result.message || 'Password reset email sent successfully!');
      } else {
        showError(result.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (emailSent) {
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
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          {/* Success Icon */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <FaCheckCircle style={{
                fontSize: '2.5rem',
                color: 'white'
              }} />
            </div>
          </div>

          {/* Success Message */}
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            {t('auth.emailSent')}
          </h1>
          
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '2rem'
          }}>
            {t('auth.emailSentDescription', { email: formData.email })}
          </p>

          {/* Instructions */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#0369a1',
              marginBottom: '0.5rem'
            }}>
              {t('auth.nextSteps')}
            </h3>
            <ul style={{
              fontSize: '0.85rem',
              color: '#0369a1',
              margin: 0,
              paddingLeft: '1.2rem'
            }}>
              <li>{t('auth.checkEmailInbox')}</li>
              <li>{t('auth.checkSpamFolder')}</li>
              <li>{t('auth.clickResetLink')}</li>
              <li>{t('auth.createNewPassword')}</li>
            </ul>
          </div>

          {/* Back to Login Button */}
          <button
            onClick={handleBackToLogin}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <FaArrowLeft />
            {t('auth.backToLogin')}
          </button>

          {/* Resend Email Link */}
          <button
            onClick={() => {
              setEmailSent(false);
              setFormData({ email: '' });
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-teal)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {t('auth.resendEmail')}
          </button>
        </div>
      </div>
    );
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
            {t('auth.forgotPassword')}
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1rem'
          }}>
            {t('auth.forgotPasswordDescription')}
          </p>
        </div>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Email Field */}
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
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  border: `1px solid ${errors.email ? '#ef4444' : 'var(--gray-300)'}`,
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'var(--transition-base)',
                  background: 'white'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-teal)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 191, 174, 0.1)';
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.email.trim()}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: (isSubmitting || !formData.email.trim()) ? 'var(--gray-400)' : 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: (isSubmitting || !formData.email.trim()) ? 'not-allowed' : 'pointer',
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
                {t('common.sending')}...
              </>
            ) : (
              <>
                <FaSpinner />
                {t('auth.sendResetEmail')}
              </>
            )}
          </button>

          {/* Back to Login Button */}
          <button
            type="button"
            onClick={handleBackToLogin}
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
              transition: 'var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <FaArrowLeft />
            {t('auth.backToLogin')}
          </button>
        </form>

        {/* Help Text */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <FaExclamationTriangle style={{
              color: '#f59e0b',
              marginTop: '0.125rem',
              fontSize: '0.9rem'
            }} />
            <div>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#92400e',
                fontWeight: 500,
                marginBottom: '0.25rem'
              }}>
                {t('auth.needHelp')}
              </p>
              <p style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#92400e',
                lineHeight: 1.4
              }}>
                {t('auth.contactSupport')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
