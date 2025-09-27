import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'var(--primary-teal)', 
  message = 'Loading...',
  fullScreen = false 
}) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  const spinnerStyle = {
    width: sizes[size],
    height: sizes[size],
    border: `3px solid rgba(0, 191, 174, 0.1)`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(5px)',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={containerStyle}>
        <div style={spinnerStyle}></div>
        {message && (
          <p style={{
            marginTop: '1rem',
            color: 'var(--gray-600)',
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            {message}
          </p>
        )}
      </div>
    </>
  );
};

export default LoadingSpinner; 