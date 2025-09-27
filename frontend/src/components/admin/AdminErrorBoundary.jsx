import React from 'react';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Admin Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRefresh = () => {
    // Clear the error state and refresh the page
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '600px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <FaExclamationTriangle style={{
              fontSize: '4rem',
              marginBottom: '1.5rem',
              color: '#fbbf24'
            }} />
            
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: 'white'
            }}>
              Something went wrong
            </h2>
            
            <p style={{
              fontSize: '1.1rem',
              marginBottom: '2rem',
              color: '#e5e7eb',
              lineHeight: '1.6'
            }}>
              The admin panel encountered an unexpected error. This might be due to a network issue or a temporary server problem.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleRefresh}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <FaSync />
                Refresh Page
              </button>
              
              <button
                onClick={() => window.location.href = '/admin/login'}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Go to Login
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                  Error Details (Development Mode)
                </summary>
                <pre style={{
                  color: '#fca5a5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
