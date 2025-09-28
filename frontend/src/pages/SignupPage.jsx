import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../components/common/Notification';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaCheck, FaTimes,  FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const SignupPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError, showWarning } = useNotification();

  // Local validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  };

  const validatePassword = (password) => {
    const errors = [];
    let isValid = true;

    if (!password) {
      errors.push('Password is required');
      isValid = false;
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
        isValid = false;
      }
      if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
        isValid = false;
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
        isValid = false;
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
        isValid = false;
      }
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
        isValid = false;
      }
      // Updated special characters to match backend
      if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
        errors.push('Password must contain at least one special character');
        isValid = false;
      }
      
      // Check for common patterns (matching backend)
      const commonPatterns = [
        'password', '123456', 'qwerty', 'admin', 'user',
        'letmein', 'welcome', 'monkey', 'dragon', 'master'
      ];
      
      const passwordLower = password.toLowerCase();
      for (const pattern of commonPatterns) {
        if (passwordLower.includes(pattern)) {
          errors.push('Password contains common patterns');
          isValid = false;
          break;
        }
      }
      
      // Check for repeated characters (matching backend)
      for (let i = 0; i < password.length - 2; i++) {
        if (password[i] === password[i+1] && password[i+1] === password[i+2]) {
          errors.push('Password contains too many repeated characters');
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    privacyAccepted: false,
    marketingConsent: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: []
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // Set dynamic page title
  React.useEffect(() => {
    document.title = `${t('auth.joinDoggoDaily')} - DoggoDaily`;
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'DoggoDaily - Dog & Italy Adventures';
    };
  }, [t]);

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

    // Real-time password validation
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }
    
    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }
    
    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Privacy policy validation
    if (!formData.privacyAccepted) {
      newErrors.privacyAccepted = 'You must accept the privacy policy to continue';
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
      const result = await register({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        privacy_accepted: formData.privacyAccepted,
        marketing_consent: formData.marketingConsent
      });
      
      if (result.success) {
        showSuccess(result.message || 'Account created successfully!');
        
        // Handle email verification requirement
        if (result.requires_email_verification) {
          showWarning('Please check your email and click the verification link to activate your account.');
        }

        // Show password strength feedback
        if (result.password_strength) {
          console.log('Password strength:', result.password_strength);
        }

        navigate('/');
      } else {
        // Handle specific registration errors
        if (result.errors) {
          // Display field-specific errors
          setErrors(result.errors);
        }
        showError(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Password requirement checker
  const PasswordRequirements = () => {
    const requirements = [
      { test: formData.password.length >= 8, text: t('auth.atLeast8Characters') },
      { test: formData.password.length <= 128, text: 'Password must be less than 128 characters' },
      { test: /[A-Z]/.test(formData.password), text: t('auth.oneUppercase') },
      { test: /[a-z]/.test(formData.password), text: t('auth.oneLowercase') },
      { test: /\d/.test(formData.password), text: t('auth.oneNumber') },
      { test: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password), text: t('auth.oneSpecialChar') },
      { 
        test: !['password', '123456', 'qwerty', 'admin', 'user', 'letmein', 'welcome', 'monkey', 'dragon', 'master'].some(pattern => 
          formData.password.toLowerCase().includes(pattern)
        ), 
        text: 'No common patterns' 
      },
      { 
        test: !Array.from({length: formData.password.length - 2}, (_, i) => i).some(i => 
          formData.password[i] === formData.password[i+1] && formData.password[i+1] === formData.password[i+2]
        ), 
        text: 'No repeated characters' 
      }
    ];

    return (
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        marginTop: '0.5rem'
      }}>
        <p style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--gray-700)'
        }}>
          {t('auth.passwordRequirements')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {requirements.map((req, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem'
            }}>
              {req.test ? (
                <FaCheck style={{ color: '#10b981', fontSize: '0.75rem' }} />
              ) : (
                <FaTimes style={{ color: '#ef4444', fontSize: '0.75rem' }} />
              )}
              <span style={{ color: req.test ? '#10b981' : '#6b7280' }}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
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
        maxWidth: '480px',
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
            {t('auth.joinDoggoDaily')}
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1rem'
          }}>
            {t('auth.createAccountDescription')}
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Name Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--gray-700)',
              marginBottom: '0.5rem'
            }}>
              {t('auth.fullName')} *
            </label>
            <div style={{ position: 'relative' }}>
              <FaUser style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
                fontSize: '1rem'
              }} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  border: `1px solid ${errors.name ? '#ef4444' : 'var(--gray-300)'}`,
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
                  e.target.style.borderColor = errors.name ? '#ef4444' : 'var(--gray-300)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            {errors.name && (
              <p style={{
                fontSize: '0.8rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--gray-700)',
              marginBottom: '0.5rem'
            }}>
              {t('auth.email')} *
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
                placeholder="Enter your email"
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

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--gray-700)',
              marginBottom: '0.5rem'
            }}>
              {t('auth.password')} *
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
                placeholder="Create a strong password"
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-teal)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 191, 174, 0.1)';
                  setShowPasswordRequirements(true);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 3rem',
                  border: `1px solid ${errors.password ? '#ef4444' : 'var(--gray-300)'}`,
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'var(--transition-base)',
                  background: 'white'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.password ? '#ef4444' : 'var(--gray-300)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  fontSize: '1rem'
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
            {showPasswordRequirements && formData.password && <PasswordRequirements />}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--gray-700)',
              marginBottom: '0.5rem'
            }}>
              {t('auth.confirmPassword')} *
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
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 3rem',
                  border: `1px solid ${errors.confirmPassword ? '#ef4444' : 'var(--gray-300)'}`,
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
                  e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : 'var(--gray-300)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p style={{
                fontSize: '0.8rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}>
                {errors.confirmPassword}
              </p>
            )}
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <FaCheck style={{ color: '#10b981', fontSize: '0.8rem' }} />
                <span style={{ fontSize: '0.8rem', color: '#10b981' }}>
                  {t('auth.passwordsMatch')}
                </span>
              </div>
            )}
          </div>

          {/* Privacy Policy Acceptance */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.9rem',
              color: 'var(--gray-700)',
              cursor: 'pointer',
              lineHeight: '1.5'
            }}>
              <input
                type="checkbox"
                name="privacyAccepted"
                checked={formData.privacyAccepted}
                onChange={handleChange}
                style={{
                  width: '1rem',
                  height: '1rem',
                  cursor: 'pointer',
                  marginTop: '0.125rem'
                }}
              />
              <span>
                {t('auth.acceptTerms', {
                  privacyPolicy: t('auth.privacyPolicy'),
                  termsOfService: t('auth.termsOfService')
                })}*
              </span>
            </label>
            {errors.privacyAccepted && (
              <p style={{
                fontSize: '0.8rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}>
                {errors.privacyAccepted}
              </p>
            )}
          </div>

          {/* Marketing Consent */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.9rem',
              color: 'var(--gray-700)',
              cursor: 'pointer',
              lineHeight: '1.5'
            }}>
              <input
                type="checkbox"
                name="marketingConsent"
                checked={formData.marketingConsent}
                onChange={handleChange}
                style={{
                  width: '1rem',
                  height: '1rem',
                  cursor: 'pointer',
                  marginTop: '0.125rem'
                }}
              />
              <span>
                {t('auth.marketingConsent')}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim() || !formData.privacyAccepted}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: (isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim() || !formData.privacyAccepted) ? 'var(--gray-400)' : 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: (isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim() || !formData.privacyAccepted) ? 'not-allowed' : 'pointer',
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
                {t('common.loading')}...
              </>
            ) : (
              <>
                <FaSpinner />
                {t('auth.createSecureAccount')}
              </>
            )}
          </button>
        </form>


        {/* Login Link */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '0.9rem'
          }}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              style={{
                color: 'var(--primary-teal)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 