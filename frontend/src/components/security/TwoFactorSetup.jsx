import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/Notification';
import { FaShield, FaCopy, FaCheck, FaQrcode, FaKey, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';

const TwoFactorSetup = ({ onComplete, onCancel }) => {
  const { setup2FA, verify2FA, user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  
  const [step, setStep] = useState('setup'); // setup, verify, complete
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Start 2FA setup when component mounts
  useEffect(() => {
    initiate2FASetup();
  }, []);

  const initiate2FASetup = async () => {
    setIsLoading(true);
    try {
      const result = await setup2FA();
      if (result.success) {
        setSetupData(result.data);
        setStep('verify');
      } else {
        showError(result.error || '2FA setup failed');
        onCancel();
      }
    } catch (error) {
      showError('Failed to initialize 2FA setup');
      onCancel();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verify2FA(verificationCode);
      if (result.success) {
        setStep('complete');
        showSuccess('Two-factor authentication has been enabled successfully!');
      } else {
        showError(result.error || 'Verification failed. Please check your code and try again.');
      }
    } catch (error) {
      showError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else if (type === 'backup') {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
      showSuccess(`${type === 'secret' ? 'Secret key' : 'Backup codes'} copied to clipboard`);
    } catch (error) {
      showError('Failed to copy to clipboard');
    }
  };

  const handleComplete = () => {
    onComplete && onComplete();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <LoadingSpinner message="Setting up two-factor authentication..." />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      background: 'white',
      borderRadius: 'var(--radius-xl)',
      padding: '2rem',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'var(--gradient-primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <FaShield style={{ color: 'white', fontSize: '1.5rem' }} />
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--gray-900)',
          marginBottom: '0.5rem'
        }}>
          {step === 'setup' && 'Setting up Two-Factor Authentication'}
          {step === 'verify' && 'Verify Your Authenticator App'}
          {step === 'complete' && 'Two-Factor Authentication Enabled'}
        </h2>
        <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
          {step === 'setup' && 'Preparing your authenticator app setup...'}
          {step === 'verify' && 'Scan the QR code and enter the verification code'}
          {step === 'complete' && 'Your account is now secured with 2FA'}
        </p>
      </div>

      {/* Step 1: QR Code and Manual Setup */}
      {step === 'verify' && setupData && (
        <div style={{ marginBottom: '2rem' }}>
          {/* QR Code */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--gray-900)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FaQrcode /> Scan QR Code
            </h3>
            
            {/* QR Code Image */}
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid #e2e8f0',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              <img 
                src={setupData.qr_code} 
                alt="2FA QR Code"
                style={{
                  width: '200px',
                  height: '200px',
                  border: 'none'
                }}
              />
            </div>

            <p style={{
              fontSize: '0.9rem',
              color: 'var(--gray-600)',
              marginBottom: '0'
            }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
          </div>

          {/* Manual Setup Option */}
          <div style={{
            background: '#fef3cd',
            border: '1px solid #fecf47',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#92400e',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaKey /> Can't scan? Enter manually
            </h4>
            
            <div style={{
              background: 'white',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fecf47',
              marginBottom: '0.75rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>
                Account: {user?.email}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#fef3cd',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all'
              }}>
                <span style={{ flex: 1, color: '#92400e' }}>{setupData.secret}</span>
                <button
                  onClick={() => copyToClipboard(setupData.secret, 'secret')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#92400e',
                    padding: '0.25rem'
                  }}
                  title="Copy secret key"
                >
                  {copiedSecret ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
            </div>
          </div>

          {/* Verification Code Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--gray-700)',
              marginBottom: '0.75rem'
            }}>
              Enter the 6-digit code from your app
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'var(--transition-base)',
                  fontFamily: 'monospace'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-teal)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 191, 174, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--gray-300)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: 'transparent',
                color: 'var(--gray-600)',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition-base)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleVerification}
              disabled={verificationCode.length !== 6 || isVerifying}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: (verificationCode.length !== 6 || isVerifying) 
                  ? 'var(--gray-400)' 
                  : 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: (verificationCode.length !== 6 || isVerifying) 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isVerifying ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Verifying...
                </>
              ) : (
                <>
                  <FaShield />
                  Enable 2FA
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Success and Backup Codes */}
      {step === 'complete' && setupData && (
        <div>
          {/* Success Message */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <FaCheck style={{ color: 'white', fontSize: '1.25rem' }} />
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#065f46',
              marginBottom: '0.5rem'
            }}>
              Two-Factor Authentication Enabled!
            </h3>
            <p style={{
              color: '#059669',
              fontSize: '1rem',
              marginBottom: '0'
            }}>
              Your account is now protected with an additional layer of security.
            </p>
          </div>

          {/* Backup Codes */}
          {setupData.backup_codes && (
            <div style={{
              background: '#fef3cd',
              border: '1px solid #fecf47',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <FaExclamationTriangle style={{ color: '#f59e0b' }} />
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#92400e',
                  margin: 0
                }}>
                  Important: Save Your Backup Codes
                </h4>
              </div>
              
              <p style={{
                color: '#92400e',
                fontSize: '0.9rem',
                marginBottom: '1rem'
              }}>
                These backup codes can be used to access your account if you lose your authenticator device. 
                Store them in a safe place - each code can only be used once.
              </p>

              <div style={{
                background: 'white',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fecf47',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}>
                  {setupData.backup_codes.map((code, index) => (
                    <div key={index} style={{
                      background: '#fef3cd',
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      color: '#92400e',
                      fontWeight: 500
                    }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(setupData.backup_codes.join('\n'), 'backup')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {copiedBackupCodes ? <FaCheck /> : <FaCopy />}
                {copiedBackupCodes ? 'Backup Codes Copied!' : 'Copy Backup Codes'}
              </button>
            </div>
          )}

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-base)'
            }}
          >
            Complete Setup
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup; 