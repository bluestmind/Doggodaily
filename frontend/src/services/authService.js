import { apiMethods, API_ENDPOINTS } from '../config/api';

class AuthService {
  constructor() {
    this.userKey = 'user_data';
    this.deviceFingerprintKey = 'device_fingerprint';
    this.sessionKey = 'session_info';
    // Cookie-based sessions: no token storage/refresh
    this.initializeDeviceFingerprint();
  }

  // Device Fingerprinting
  initializeDeviceFingerprint() {
    try {
      const existing = localStorage.getItem(this.deviceFingerprintKey);
      if (existing) {
        return existing;
      }

      // Generate device fingerprint
      const fingerprint = this.generateDeviceFingerprint();
      localStorage.setItem(this.deviceFingerprintKey, fingerprint);
      return fingerprint;
    } catch (error) {
      console.error('Device fingerprint initialization failed:', error);
      return null;
    }
  }

  generateDeviceFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',
      navigator.maxTouchPoints || 'unknown'
    ];
    
    return this.hashString(components.join('|'));
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  getDeviceFingerprint() {
    return localStorage.getItem(this.deviceFingerprintKey);
  }

  // No token management in session mode
  getToken() { return null; }

  getRefreshToken() { return null; }

  setToken(_) { /* noop in session mode */ }

  setRefreshToken(_) { /* noop */ }

  removeTokens() { /* noop in session mode */ }

  isTokenExpired(_) { return true; }

  getTokenExpiration(token) {
    try {
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Token expiration parsing error:', error);
      return null;
    }
  }

  // Automatic Token Refresh
  setupAutoRefresh() { /* noop */ }

  clearAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  async refreshTokenSilently() { return { success: false }; }

  async performTokenRefresh() { return { success: false }; }

  // User Data Management
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  setUser(user) {
    if (user) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.userKey);
    }
  }

  getSessionInfo() {
    const sessionData = localStorage.getItem(this.sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  setSessionInfo(sessionInfo) {
    if (sessionInfo) {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionInfo));
    } else {
      localStorage.removeItem(this.sessionKey);
    }
  }

  // Enhanced Authentication Status
  isAuthenticated() {
    const user = this.getUser();
    const result = !!user;
    
    console.log('🔐 isAuthenticated check:');
    console.log('  - Cookie session mode');
    console.log('  - User present:', !!user);
    console.log('  - Result:', result);
    
    return result;
  }

  isAdmin() {
    const user = this.getUser();
    const adminLevels = ['super_admin', 'admin', 'moderator'];
    const result = user?.admin_level && adminLevels.includes(user.admin_level);
    
    console.log('👑 isAdmin check:');
    console.log('  - User:', user ? 'present' : 'null');
    console.log('  - User admin_level:', user?.admin_level);
    console.log('  - Valid admin levels:', adminLevels);
    console.log('  - Result:', result);
    
    return result;
  }

  // Session Validation
  setupSessionValidation() {
    // Check session validity every 5 minutes
    setInterval(() => {
      this.validateSession();
    }, 5 * 60 * 1000);
  }

  async validateSession() {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      const response = await apiMethods.get(API_ENDPOINTS.AUTH.PROFILE);
      if (!response.success) {
        console.log('⚠️ Session validation failed, logging out...');
        this.removeTokens();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Enhanced API Methods
  async login(credentials) {
    try {
      console.log('🚀 Enhanced login attempt with:', { email: credentials.email });
      
      // Add device fingerprint
      const loginData = {
        ...credentials,
        device_fingerprint: this.getDeviceFingerprint()
      };
      
      // Choose endpoint based on login_type
      const isAdminLogin = credentials.login_type === 'admin';
      const endpoint = isAdminLogin ? API_ENDPOINTS.AUTH.ADMIN_LOGIN : API_ENDPOINTS.AUTH.LOGIN;
      const response = await apiMethods.post(endpoint, loginData);
      
      console.log('📦 Login response received:', response);
      
      if (response.success) {
        console.log('✅ Login successful, processing response...');
        
        // Store user data
        if (response.user) {
          this.setUser(response.user);
        }
        
        // Handle 2FA requirement
        if (response.requires_2fa) {
          return {
            success: false,
            requires_2fa: true,
            message: response.message || 'Two-factor authentication required'
          };
        }
        
        // Handle security alerts
        if (response.security_alert) {
          console.warn('🚨 Security alert:', response.security_alert);
        }
        
        return {
          success: true,
          user: response.user,
          message: response.message || 'Login successful',
          security_alert: response.security_alert,
          requires_password_change: response.requires_password_change
        };
      } else if (response.success === false) {
        // Handle error responses
        console.log('❌ Login failed:', response.message);
        return {
          success: false,
          message: response.message || 'Login failed',
          requires_2fa: response.requires_2fa,
          account_locked: response.account_locked,
          failed_attempts: response.failed_attempts
        };
      }
      
      return {
        success: false,
        message: 'Unexpected response format'
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  async startGoogleLogin() {
    try {
      // Start OAuth by redirecting to backend endpoint
      window.location.href = `${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`;
    } catch (error) {
      return { success: false, message: 'Failed to start Google login' };
    }
  }

  async register(userData) {
    try {
      console.log('📝 Registration attempt for:', userData.email);
      
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      if (response.success) {
        console.log('✅ Registration successful');
        
        // Store user data if provided
        if (response.user) {
          this.setUser(response.user);
        }
        
        return {
          success: true,
          user: response.user,
          message: response.message || 'Registration successful',
          requires_email_verification: response.requires_email_verification,
          password_strength: response.password_strength
        };
      } else {
        return {
          success: false,
          message: response.message || 'Registration failed',
          errors: response.errors
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }

  async logout() {
    try {
      console.log('👋 Logout initiated...');
      
      // Call logout endpoint
      await apiMethods.post(API_ENDPOINTS.AUTH.LOGOUT);
      
      // Clear local storage
      this.setUser(null);
      this.setSessionInfo(null);
      try {
        document.cookie = `${encodeURIComponent('session')}=; Max-Age=0; path=/;`;
        document.cookie = `${encodeURIComponent('remember_token')}=; Max-Age=0; path=/;`;
      } catch (e) {
        // ignore
      }
      
      console.log('✅ Logout completed');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      this.setUser(null);
      this.setSessionInfo(null);
      return { success: true, message: 'Logged out successfully' };
    }
  }

  async logoutAll() {
    try {
      console.log('👋 Logout all sessions initiated...');
      
      await apiMethods.post(API_ENDPOINTS.AUTH.LOGOUT);
      
      // Clear local storage
      this.removeTokens();
      this.setUser(null);
      this.setSessionInfo(null);
      
      console.log('✅ Logout all completed');
      return { success: true, message: 'Logged out from all sessions' };
    } catch (error) {
      console.error('Logout all error:', error);
      // Still clear local state
      this.removeTokens();
      this.setUser(null);
      this.setSessionInfo(null);
      return { success: true, message: 'Logged out from all sessions' };
    }
  }

  async getProfile() {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.AUTH.PROFILE);
      
      if (response.success) {
        // Update user data
        this.setUser(response.user);
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: 'Failed to get profile' };
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await apiMethods.put(API_ENDPOINTS.AUTH.PROFILE, profileData);
      
      if (response.success) {
        // Update user data
        this.setUser(response.user);
        return { success: true, user: response.user, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  }

  async changePassword(currentPassword, newPassword, logoutAllSessions = true) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: newPassword,
        logout_all_sessions: logoutAllSessions
      });
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message, errors: response.errors };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  }

  async forgotPassword(email) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Failed to send reset email' };
    }
  }

  async resetPassword(token, password, passwordConfirmation) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password,
        confirm_password: passwordConfirmation
      });
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  }

  async verifyEmail(token) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
      return response;
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, message: 'Failed to verify email' };
    }
  }

  async resendVerificationEmail(email) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
      return response;
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, message: 'Failed to resend verification email' };
    }
  }

  // 2FA Methods
  async setup2FA(password) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.SETUP_2FA, { password });
      return response;
    } catch (error) {
      console.error('Setup 2FA error:', error);
      return { success: false, message: 'Failed to setup 2FA' };
    }
  }

  async verify2FA(token) {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.VERIFY_2FA, { token });
      return response;
    } catch (error) {
      console.error('Verify 2FA error:', error);
      return { success: false, message: 'Failed to verify 2FA' };
    }
  }

  async disable2FA(password, token = null) {
    try {
      const data = { password };
      if (token) data.token = token;
      
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.DISABLE_2FA, data);
      return response;
    } catch (error) {
      console.error('Disable 2FA error:', error);
      return { success: false, message: 'Failed to disable 2FA' };
    }
  }

  // Session Management
  async getSessions() {
    try {
      const response = await apiMethods.get(API_ENDPOINTS.AUTH.SESSIONS);
      return response;
    } catch (error) {
      console.error('Get sessions error:', error);
      return { success: false, message: 'Failed to get sessions' };
    }
  }

  async endSession(sessionId) {
    try {
      const response = await apiMethods.delete(`/auth/sessions/${sessionId}`);
      return response;
    } catch (error) {
      console.error('End session error:', error);
      return { success: false, message: 'Failed to end session' };
    }
  }

  async endAllSessions() {
    try {
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.LOGOUT_ALL);
      return response;
    } catch (error) {
      console.error('End all sessions error:', error);
      return { success: false, message: 'Failed to end all sessions' };
    }
  }

  // Security Info
  async getSecurityInfo() {
    try {
      const response = await apiMethods.get('/api/security/info');
      return response;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get security information'
      };
    }
  }

  // Validation Helpers
  validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    // Length contribution
    score += Math.min(password.length * 4, 40);
    
    // Character variety
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    
    // Complexity bonus
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);
    
    // Penalty for common patterns
    const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'user'];
    const passwordLower = password.toLowerCase();
    for (const pattern of commonPatterns) {
      if (passwordLower.includes(pattern)) {
        score -= 30;
        break;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      error: emailRegex.test(email) ? null : 'Please enter a valid email address'
    };
  }

  // Debug and Monitoring
  debugAuth() {
    console.log('🐛 ENHANCED AUTH DEBUG REPORT:');
    console.log('============================');
    
    const token = localStorage.getItem(this.tokenKey);
    const user = localStorage.getItem(this.userKey);
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    const deviceFingerprint = localStorage.getItem(this.deviceFingerprintKey);
    const sessionInfo = localStorage.getItem(this.sessionKey);
    const lastRefresh = localStorage.getItem(this.lastRefreshKey);
    
    console.log('📦 LocalStorage Contents:');
    console.log('  - auth_token:', token ? `${token.substring(0, 30)}...` : 'NULL');
    console.log('  - user_data:', user ? 'Present' : 'NULL');
    console.log('  - refresh_token:', refreshToken ? `${refreshToken.substring(0, 30)}...` : 'NULL');
    console.log('  - device_fingerprint:', deviceFingerprint || 'NULL');
    console.log('  - session_info:', sessionInfo ? 'Present' : 'NULL');
    console.log('  - last_refresh:', lastRefresh ? new Date(parseInt(lastRefresh)).toISOString() : 'NULL');
    
    console.log('🔐 Auth Status:');
    console.log('  - isAuthenticated():', this.isAuthenticated());
    console.log('  - isAdmin():', this.isAdmin());
    console.log('  - token expired:', token ? this.isTokenExpired(token) : 'N/A');
    
    if (token) {
      const expiration = this.getTokenExpiration(token);
      console.log('  - token expires:', expiration ? expiration.toLocaleString() : 'Unknown');
    }
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('👤 User Data:', userData);
      } catch (e) {
        console.error('❌ Failed to parse user data:', e);
      }
    }
    
    console.log('============================');
    return {
      token: !!token,
      user: !!user,
      refreshToken: !!refreshToken,
      deviceFingerprint: !!deviceFingerprint,
      isAuthenticated: this.isAuthenticated(),
      isAdmin: this.isAdmin(),
      tokenExpired: token ? this.isTokenExpired(token) : null
    };
  }
}

// Create and export singleton instance
const authService = new AuthService();

// Make available globally for debugging (only in development)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.authService = authService;
  console.log('🐛 Enhanced AuthService available globally as window.authService');
  console.log('🐛 Run: authService.debugAuth() to debug authentication');
}

export default authService; 