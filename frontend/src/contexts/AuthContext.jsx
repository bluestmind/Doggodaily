import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [securityInfo, setSecurityInfo] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Enhanced authentication initialization
  const initializeAuth = useCallback(async () => {
    try {
      console.log('🔄 ENHANCED AUTH INITIALIZATION STARTED');
      console.log('🔄 Page reload detected:', window.performance.navigation.type === 1);
      
      // Add a small delay to ensure localStorage is fully accessible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for user data in localStorage (session-based auth)
      const userData = authService.getUser();
      
      console.log('🔍 Session-based auth check - User:', !!userData);
      console.log('🔍 User data:', userData);
      
      // In session mode, we only need to check for user data
      if (userData && typeof userData === 'object' && userData.id) {
        console.log('✅ User data found, setting user in context');
        setUser(userData);
        
        // Validate session with backend (optional)
        try {
          console.log('🔄 Validating session with backend...');
          const isSessionValid = await authService.validateSession();
          if (!isSessionValid) {
            console.log('⚠️ Session validation failed, but keeping user data');
          } else {
            console.log('✅ Session validation successful');
          }
        } catch (sessionError) {
          console.log('⚠️ Session validation failed:', sessionError.message);
          // Don't fail authentication just because session validation failed
        }
        
        // Get security info (don't block on this)
        try {
          const secInfo = await authService.getSecurityInfo();
          setSecurityInfo(secInfo);
        } catch (error) {
          console.warn('⚠️ Security info fetch failed (non-critical):', error);
          // Don't fail authentication just because security info failed
        }
        
        // Optionally refresh user data from server
        try {
          const profileResult = await authService.getProfile();
          if (profileResult.success) {
            console.log('✅ Profile refreshed from server');
            setUser(profileResult.user);
          } else {
            console.log('⚠️ Profile refresh failed, keeping local data');
          }
        } catch (profileError) {
          console.log('⚠️ Profile refresh failed (non-critical):', profileError.message);
          // Don't fail authentication just because profile refresh failed
        }
      } else {
        console.log('❌ No user data found in localStorage');
        // Clear any invalid data
        setUser(null);
        setSecurityInfo(null);
      }
      
      console.log('✅ ENHANCED AUTH INITIALIZATION COMPLETED');
      setIsInitialized(true);
      
    } catch (error) {
      console.error('💥 Auth initialization error:', error);
      setAuthError(error.message);
      setUser(null);
      setSecurityInfo(null);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Enhanced login function
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('🚀 Enhanced login attempt');
      const result = await authService.login(credentials);
      
      if (result.success) {
        setUser(result.user);
        
        // Handle security alerts
        if (result.security_alert) {
          toast(result.security_alert.message, { 
            icon: '⚠️',
            duration: 6000,
            style: {
              background: '#fbbf24',
              color: '#92400e'
            }
          });
        }
        
        // Handle password change requirement
        if (result.requires_password_change) {
          toast('Password change required', {
            icon: '🔐',
            duration: 5000,
            style: {
              background: '#f59e0b',
              color: '#92400e'
            }
          });
        }
        
        toast.success(result.message || 'Login successful');
        return { success: true, user: result.user };
      } else {
        // Handle specific error cases
        if (result.requires_2fa) {
          return { success: false, requires_2fa: true, message: result.message };
        }
        
        if (result.account_locked) {
          toast.error(`Account locked until ${new Date(result.unlock_time).toLocaleString()}`);
          return { success: false, account_locked: true, message: result.message };
        }
        
        toast.error(result.message || 'Login failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message);
      toast.error('Login failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced admin login function
  const adminLogin = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('🚀 Enhanced admin login attempt');
      const result = await authService.login({ ...credentials, login_type: 'admin' });
      
      if (result.success) {
        setUser(result.user);
        toast.success(result.message || 'Admin login successful');
        return { success: true, user: result.user };
      } else {
        if (result.requires_2fa) {
          return { success: false, requires_2fa: true, message: result.message };
        }
        
        toast.error(result.message || 'Admin login failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setAuthError(error.message);
      toast.error('Admin login failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced register function
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('📝 Enhanced registration attempt');
      const result = await authService.register(userData);
      
      if (result.success) {
        setUser(result.user);
        toast.success(result.message || 'Registration successful');
        return { success: true };
      } else {
        toast.error(result.message || 'Registration failed');
        return { success: false, message: result.message, errors: result.errors };
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(error.message);
      toast.error('Registration failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      console.log('👋 Enhanced logout initiated');
      
      const result = await authService.logout();
      
      setUser(null);
      setSecurityInfo(null);
      setAuthError(null);
      
      toast.success(result.message || 'Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state
      setUser(null);
      setSecurityInfo(null);
      setAuthError(null);
      toast.success('Logged out successfully');
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced logout all sessions
  const logoutAll = useCallback(async () => {
    try {
      setLoading(true);
      console.log('👋 Enhanced logout all sessions initiated');
      
      const result = await authService.logoutAll();
      
      setUser(null);
      setSecurityInfo(null);
      setAuthError(null);
      
      toast.success(result.message || 'Logged out from all sessions');
      return { success: true };
    } catch (error) {
      console.error('Logout all error:', error);
      // Still clear local state
      setUser(null);
      setSecurityInfo(null);
      setAuthError(null);
      toast.success('Logged out from all sessions');
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced profile update
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.updateProfile(profileData);
      
      if (result.success) {
        setUser(result.user);
        toast.success(result.message || 'Profile updated successfully');
        return { success: true };
      } else {
        toast.error(result.message || 'Profile update failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setAuthError(error.message);
      toast.error('Profile update failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced password change
  const changePassword = useCallback(async (currentPassword, newPassword, logoutAllSessions = true) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.changePassword(currentPassword, newPassword, logoutAllSessions);
      
      if (result.success) {
        toast.success(result.message || 'Password changed successfully');
        return { success: true };
      } else {
        toast.error(result.message || 'Password change failed');
        return { success: false, message: result.message, errors: result.errors };
      }
    } catch (error) {
      console.error('Password change error:', error);
      setAuthError(error.message);
      toast.error('Password change failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced forgot password
  const forgotPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.forgotPassword(email);
      
      if (result.success) {
        toast.success(result.message || 'Password reset email sent');
        return { success: true };
      } else {
        toast.error(result.message || 'Failed to send reset email');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setAuthError(error.message);
      toast.error('Failed to send reset email');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced reset password
  const resetPassword = useCallback(async (token, password, passwordConfirmation) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.resetPassword(token, password, passwordConfirmation);
      
      if (result.success) {
        toast.success(result.message || 'Password reset successfully');
        return { success: true };
      } else {
        toast.error(result.message || 'Password reset failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setAuthError(error.message);
      toast.error('Password reset failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced email verification
  const verifyEmail = useCallback(async (token) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.verifyEmail(token);
      
      if (result.success) {
        setUser(result.user);
        toast.success(result.message || 'Email verified successfully');
        return { success: true };
      } else {
        toast.error(result.message || 'Email verification failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setAuthError(error.message);
      toast.error('Email verification failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced resend verification email
  const resendVerificationEmail = useCallback(async (email) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.resendVerificationEmail(email);
      
      if (result.success) {
        toast.success(result.message || 'Verification email sent');
        return { success: true };
      } else {
        toast.error(result.message || 'Failed to send verification email');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setAuthError(error.message);
      toast.error('Failed to send verification email');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // 2FA functions
  const setup2FA = useCallback(async (password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.setup2FA(password);
      
      if (result.success) {
        toast.success(result.message || '2FA setup initiated');
        return { success: true, ...result };
      } else {
        toast.error(result.message || '2FA setup failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setAuthError(error.message);
      toast.error('2FA setup failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (token) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.verify2FA(token);
      
      if (result.success) {
        // Update user data to reflect 2FA status
        setUser(prev => prev ? { ...prev, two_factor_enabled: true } : null);
        toast.success(result.message || '2FA enabled successfully');
        return { success: true };
      } else {
        toast.error(result.message || '2FA verification failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setAuthError(error.message);
      toast.error('2FA verification failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const disable2FA = useCallback(async (password, token = null) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await authService.disable2FA(password, token);
      
      if (result.success) {
        // Update user data to reflect 2FA status
        setUser(prev => prev ? { ...prev, two_factor_enabled: false } : null);
        toast.success(result.message || '2FA disabled successfully');
        return { success: true };
      } else {
        toast.error(result.message || '2FA disable failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      setAuthError(error.message);
      toast.error('2FA disable failed');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Session management functions
  const getSessions = useCallback(async () => {
    try {
      const result = await authService.getSessions();
      return result;
    } catch (error) {
      console.error('Get sessions error:', error);
      return { success: false, message: 'Failed to get sessions' };
    }
  }, []);

  const endSession = useCallback(async (sessionId) => {
    try {
      const result = await authService.endSession(sessionId);
      
      if (result.success) {
        toast.success(result.message || 'Session ended successfully');
      } else {
        toast.error(result.message || 'Failed to end session');
      }
      
      return result;
    } catch (error) {
      console.error('End session error:', error);
      toast.error('Failed to end session');
      return { success: false, message: 'Failed to end session' };
    }
  }, []);

  // Authentication status functions
  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  const isAdmin = useCallback(() => {
    return authService.isAdmin();
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Debug function
  const debugAuth = useCallback(() => {
    return authService.debugAuth();
  }, []);

  // Context value
  const value = {
    // State
    user,
    loading,
    securityInfo,
    authError,
    isInitialized,
    
    // Authentication functions
    login,
    adminLogin,
    register,
    logout,
    logoutAll,
    
    // Profile functions
    updateProfile,
    changePassword,
    
    // Password reset functions
    forgotPassword,
    resetPassword,
    
    // Email verification functions
    verifyEmail,
    resendVerificationEmail,
    
    // 2FA functions
    setup2FA,
    verify2FA,
    disable2FA,
    
    // Session management
    getSessions,
    endSession,
    
    // Status functions
    isAuthenticated,
    isAdmin,
    
    // Utility functions
    clearError,
    debugAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 