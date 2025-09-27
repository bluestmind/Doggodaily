import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaExclamationTriangle, FaSignInAlt } from 'react-icons/fa';

const AuthCheck = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();

  useEffect(() => {
    // Check authentication status
    if (!isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to admin login');
      navigate('/admin/login');
      return;
    }

    if (!isAdmin()) {
      console.log('❌ User not admin, redirecting to home');
      navigate('/');
      return;
    }

    console.log('✅ Admin user authenticated:', user?.name);
  }, [isAuthenticated, isAdmin, user, navigate]);

  // Show loading or redirect message while checking
  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '500px',
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
            Authentication Required
          </h2>
          
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '2rem',
            color: '#e5e7eb',
            lineHeight: '1.6'
          }}>
            {!isAuthenticated() 
              ? 'You need to log in to access the admin panel.'
              : 'You need admin privileges to access this area.'
            }
          </p>
          
          <button
            onClick={() => navigate('/admin/login')}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto',
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
            <FaSignInAlt />
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthCheck;

