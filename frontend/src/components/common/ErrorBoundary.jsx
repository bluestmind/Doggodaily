import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console or external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <FaExclamationTriangle style={{
              fontSize: '2.5rem',
              color: '#ef4444'
            }} />
          </div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--gray-900)',
            marginBottom: '1rem'
          }}>
            Oops! Something went wrong
          </h2>
          
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1rem',
            marginBottom: '2rem',
            maxWidth: '500px',
            lineHeight: 1.6
          }}>
            We encountered an unexpected error. This has been reported to our team.
            You can try refreshing the page or going back to the previous page.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginBottom: '2rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              maxWidth: '600px',
              textAlign: 'left'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: 600,
                color: '#ef4444',
                marginBottom: '1rem'
              }}>
                Error Details (Development Mode)
              </summary>
              <pre style={{
                fontSize: '0.8rem',
                color: 'var(--gray-700)',
                whiteSpace: 'pre-wrap',
                overflow: 'auto'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={this.handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Try Again
            </button>
            
            <button
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--gray-600)',
                border: '1px solid rgba(0, 191, 174, 0.2)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 191, 174, 0.05)';
                e.target.style.color = 'var(--primary-teal)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--gray-600)';
              }}
            >
              <FaExclamationTriangle />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 