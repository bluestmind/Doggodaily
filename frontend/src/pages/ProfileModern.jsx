import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FaUser, FaEnvelope, FaCalendarAlt, FaShieldAlt, FaCog, FaSignOutAlt,
  FaEdit, FaSave, FaTimes, FaEye, FaEyeSlash, FaCamera, FaUpload, FaTrash,
  FaHistory, FaLock, FaBell, FaPalette, FaGlobe, FaClock, FaKey,
  FaDesktop, FaMobile, FaTablet, FaCheck, FaExclamationTriangle, FaHeart,
  FaComment, FaBookOpen, FaRoute, FaChartLine, FaStar, FaTrophy, FaToggleOn,
  FaToggleOff, FaVolumeUp, FaVolumeMute,
  FaFingerprint, FaQrcode, FaWifi, FaDatabase, FaDownload, FaShare, FaPen,
  FaImage, FaVideo, FaPlay, FaPause, FaSpinner, FaFileContract, FaGavel, FaSync
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// Password validation function (matching SignupPage.jsx)
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

// Password Requirements Component (matching SignupPage.jsx)
const PasswordRequirements = ({ password, t }) => {
  const requirements = [
    { test: password.length >= 8, text: t('auth.atLeast8Characters') },
    { test: password.length <= 128, text: 'Password must be less than 128 characters' },
    { test: /[A-Z]/.test(password), text: t('auth.oneUppercase') },
    { test: /[a-z]/.test(password), text: t('auth.oneLowercase') },
    { test: /\d/.test(password), text: t('auth.oneNumber') },
    { test: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password), text: t('auth.oneSpecialChar') },
    { 
      test: !['password', '123456', 'qwerty', 'admin', 'user', 'letmein', 'welcome', 'monkey', 'dragon', 'master'].some(pattern => 
        password.toLowerCase().includes(pattern)
      ), 
      text: 'No common patterns' 
    },
    { 
      test: !Array.from({length: password.length - 2}, (_, i) => i).some(i => 
        password[i] === password[i+1] && password[i+1] === password[i+2]
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

// Custom API call function that doesn't trigger 401 redirects
const safeApiCall = async (url, options = {}) => {
  try {
    // Ensure we use the full backend URL
    const baseURL = import.meta.env.VITE_API_URL || 'http://46.101.244.203:5000';
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    
    console.log('🔍 Safe API call to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // If response is not JSON, it might be HTML (server error page)
        const text = await response.text();
        console.warn('Non-JSON response received:', text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (${response.status}): ${response.statusText}`);
      }
    } else {
      const text = await response.text();
      console.warn(`HTTP ${response.status} response:`, text.substring(0, 200));
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        const errorData = JSON.parse(text);
        throw new Error(`Rate limit exceeded. Please wait ${errorData.retry_after || 'a moment'} before trying again.`);
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn('Safe API call failed:', error);
    throw error;
  }
};

const ProfileModern = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { user: authUser, logout, isAuthenticated } = auth;
  const { t } = useLanguage();
  
  // Debug auth state
  console.log('🔍 ProfileModern - Auth object:', auth);
  console.log('🔍 ProfileModern - authUser:', authUser);
  console.log('🔍 ProfileModern - typeof authUser:', typeof authUser);
  
  const fileInputRef = useRef(null);
  
  // Main states
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  // Profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: ''
  });
  
  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: []
  });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Security states
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
    sessions: [],
    securityLogs: []
  });

  // Activity states  
  const [activityData, setActivityData] = useState({
    activities: [],
    stats: {}
  });


  // Story submission states
  const [storyData, setStoryData] = useState({
    title: '',
    content: '',
    location: '',
    tags: '',
    category: 'adventure',
    language: 'en'  // Default to English
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [submittingStory, setSubmittingStory] = useState(false);
  const [userStories, setUserStories] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Messages state
  const [userMessages, setUserMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  // Load initial data
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (authUser && authUser.id) {
        setUser(authUser);
        setProfileData({
          name: authUser.name || '',
          email: authUser.email || '',
          bio: authUser.bio || ''
        });
        
        // Try to load additional profile data from API (optional)
        try {
          // This is optional - if it fails, we still show the profile with auth data
          const data = await safeApiCall('/api/profile/');
          
          if (data.success && data.user) {
            setUser(data.user);
            setProfileData({
              name: data.user.name || '',
              email: data.user.email || '',
              bio: data.user.bio || ''
            });
          }
        } catch (apiError) {
          console.warn('Optional profile API call failed, using auth data:', apiError);
          // Continue with auth data - this is not critical
        }
      } else {
        console.warn('No authenticated user found, redirecting to login');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error(t('profile.stories.messages.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Check authentication before saving
      if (!authUser || !authUser.id) {
        toast.error('Please log in to update profile');
        return;
      }
      
      // Try to save to API, but don't fail if it doesn't work
      try {
        const data = await safeApiCall('/api/profile/', {
          method: 'PUT',
          body: JSON.stringify(profileData),
        });
        
        if (data.success && data.user) {
          setUser(data.user);
          toast.success(t('profile.stories.messages.profileUpdatedSuccessfully'));
        } else {
          throw new Error(data.message || 'Failed to update profile');
        }
      } catch (apiError) {
        console.warn('Profile API update failed, updating local data only:', apiError);
        // Update local data even if API fails
        setUser(prev => ({ ...prev, ...profileData }));
        toast.success('Profile updated locally (API unavailable)');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.stories.messages.failedToUpdateProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.stories.messages.pleaseSelectImageFile'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(t('profile.stories.messages.fileSizeMustBeLessThan5MB'));
      return;
    }

    try {
      setAvatarUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);

      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(t('profile.stories.messages.avatarUpdatedSuccessfully'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('profile.stories.messages.failedToUploadAvatar'));
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate new password
    const validation = validatePassword(passwordData.newPassword);
    if (!validation.isValid) {
      toast.error(validation.errors[0] || 'Password does not meet requirements');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('profile.stories.messages.newPasswordsDoNotMatch'));
      return;
    }

    // Check if new password is different from current
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    // Check authentication before changing password
    if (!authUser || !authUser.id) {
      toast.error('Please log in to change password');
      return;
    }

    try {
      setSaving(true);
      
      // Try to change password via API
      try {
        // First test authentication
        console.log('🔍 Testing authentication...');
        const authTest = await safeApiCall('/api/profile/password-test', {
          method: 'GET',
        });
        console.log('🔍 Auth test result:', authTest);
        
        const requestData = {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        };
        
        console.log('🔍 Password change request data:', requestData);
        console.log('🔍 Current password length:', passwordData.currentPassword.length);
        console.log('🔍 New password length:', passwordData.newPassword.length);
        
        const data = await safeApiCall('/api/profile/password', {
          method: 'PUT',
          body: JSON.stringify(requestData),
        });
        
        console.log('🔍 Password change response:', data);
        
        if (data.success) {
          toast.success(t('profile.stories.messages.passwordChangedSuccessfully'));
          setShowPasswordModal(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
          console.error('❌ Password change failed:', data.message);
          throw new Error(data.message || 'Failed to change password');
        }
      } catch (apiError) {
        console.error('❌ Password change API error:', apiError);
        console.error('❌ Error message:', apiError.message);
        toast.error(apiError.message || 'Password change failed. Please try again later.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(t('profile.stories.messages.failedToChangePassword'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success(t('profile.stories.messages.loggedOutSuccessfully'));
    navigate('/');
  };

  const loadUserMessages = async () => {
    // Prevent multiple simultaneous calls
    if (loadingMessages || messagesLoaded) {
      console.log('⏸️ Messages already loading or loaded, skipping...');
      return;
    }
    
    setLoadingMessages(true);
    try {
      if (!authUser || !authUser.id) {
        console.warn('User not authenticated, cannot load messages');
        setUserMessages([]);
        setMessagesLoaded(true);
        return;
      }
      
      try {
        console.log('📤 Loading user messages from /api/contact/messages...');
        const data = await safeApiCall('/api/contact/messages');
        console.log('📥 Messages response:', data);
        
        if (data.success && data.messages) {
          setUserMessages(data.messages);
          console.log('✅ User messages loaded:', data.messages.length);
        } else {
          console.warn('⚠️ Messages API returned unsuccessful response:', data.message);
          setUserMessages([]);
        }
        setMessagesLoaded(true);
      } catch (apiError) {
        console.warn('⚠️ Messages API failed, using empty array:', apiError.message);
        setUserMessages([]);
        
        // Show user-friendly error message
        if (apiError.message.includes('Rate limit exceeded')) {
          toast.error('Too many requests. Please wait a moment before refreshing.');
        } else if (apiError.message.includes('non-JSON response')) {
          toast.error('Backend server is not responding properly. Please check if the server is running.');
        } else if (apiError.message.includes('401')) {
          toast.error('Please log in to view your messages.');
        } else {
          toast.error('Failed to load messages. Please try again later.');
        }
        
        // Don't mark as loaded on error, allow retry
        setMessagesLoaded(false);
      }
    } catch (error) {
      console.error('❌ Error in loadUserMessages:', error);
      setUserMessages([]);
      setMessagesLoaded(false);
    } finally {
      setLoadingMessages(false);
    }
  };

  const tabs = [
    { id: 'profile', label: t('profile.tabs.profile'), icon: FaUser },
    { id: 'stories', label: t('profile.tabs.stories'), icon: FaPen },
    { id: 'messages', label: 'Messages', icon: FaEnvelope },
    { id: 'security', label: t('profile.tabs.security'), icon: FaShieldAlt },
    { id: 'activity', label: t('profile.tabs.activity'), icon: FaHistory }
  ];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gradient-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          border: '4px solid var(--gray-200)',
          borderTop: '4px solid var(--primary-teal)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-secondary)',
      padding: 'var(--space-8) 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 var(--space-4)'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: 'var(--space-8)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '800',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-2)'
          }}>
            {t('profile.title')}
          </h1>
          <p style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--gray-600)',
            margin: 0
          }}>
            {t('profile.subtitle')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 1024 ? 'minmax(250px, 300px) 1fr' : '1fr',
          gap: 'var(--space-8)'
        }}>
          {/* Sidebar */}
          <div style={{
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--space-6)',
            height: 'fit-content',
            position: window.innerWidth > 1024 ? 'sticky' : 'static',
            top: 'var(--space-4)'
          }}>
            {/* User Info */}
            <div style={{
              textAlign: 'center',
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-6)',
              borderBottom: '1px solid var(--gray-200)'
            }}>
              <div style={{
                position: 'relative',
                display: 'inline-block',
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: user?.avatar_url || avatarPreview ? 
                    `url(${avatarPreview || user.avatar_url})` : 
                    'var(--gradient-primary)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: 'white',
                  border: '4px solid white',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {!user?.avatar_url && !avatarPreview && user?.name?.charAt(0)?.toUpperCase()}
                  {avatarUploading && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary-teal)',
                    border: '2px solid white',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all var(--transition-base)'
                  }}
                >
                  <FaCamera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <h3 style={{
                fontSize: 'var(--text-xl)',
                fontWeight: '700',
                color: 'var(--gray-900)',
                margin: 0,
                marginBottom: 'var(--space-1)'
              }}>
                {user?.name}
              </h3>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--gray-600)',
                margin: 0,
                marginBottom: 'var(--space-1)'
              }}>
                {user?.email}
              </p>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--gray-500)',
                margin: 0
              }}>
{t('profile.memberSince')} {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t('profile.unknown')}
              </p>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ marginBottom: 'var(--space-6)' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    marginBottom: 'var(--space-2)',
                    background: activeTab === tab.id ? 'var(--primary-teal)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--gray-700)',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    textAlign: 'left'
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--red-600)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
            >
              <FaSignOutAlt size={16} />
{t('profile.logout')}
            </button>
          </div>

          {/* Main Content */}
          <div style={{
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--gray-200)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div style={{ padding: 'var(--space-8)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-8)'
                }}>
                  <div>
                    <h2 style={{
                      fontSize: 'var(--text-2xl)',
                      fontWeight: '800',
                      color: 'var(--gray-900)',
                      margin: 0,
                      marginBottom: 'var(--space-1)'
                    }}>
                      {t('profile.personalInfo.title')}
                    </h2>
                    <p style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--gray-600)',
                      margin: 0
                    }}>
                      {t('profile.personalInfo.subtitle')}
                    </p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--primary-teal)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)'
                      }}
                    >
                      <FaEdit size={14} />
{t('profile.editProfile')}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--green-600)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-lg)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: '600',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.7 : 1,
                          transition: 'all var(--transition-base)'
                        }}
                      >
                        <FaSave size={14} />
                        {saving ? t('profile.saving') : t('profile.save')}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--gray-600)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-lg)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all var(--transition-base)'
                        }}
                      >
                        <FaTimes size={14} />
{t('profile.cancel')}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: window.innerWidth > 768 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
                  gap: 'var(--space-6)'
                }}>
                  {/* Basic Information */}
                  <div>
                    <h3 style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: '700',
                      color: 'var(--gray-900)',
                      margin: 0,
                      marginBottom: 'var(--space-4)'
                    }}>
                      {t('profile.basicInfo')}
                    </h3>
                    
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-700)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        {t('profile.fullName')}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: 'var(--space-3)',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--text-sm)',
                            transition: 'all var(--transition-base)'
                          }}
                          placeholder={t('profile.enterFullName')}
                        />
                      ) : (
                        <p style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--gray-900)',
                          margin: 0,
                          padding: 'var(--space-3)',
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-lg)'
                        }}>
{user?.name || t('profile.notProvided')}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-700)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        {t('profile.emailAddress')}
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: 'var(--space-3)',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--text-sm)',
                            transition: 'all var(--transition-base)'
                          }}
                          placeholder={t('profile.enterEmail')}
                        />
                      ) : (
                        <p style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--gray-900)',
                          margin: 0,
                          padding: 'var(--space-3)',
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-lg)'
                        }}>
                          {user?.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-700)',
                        marginBottom: 'var(--space-2)'
                      }}>
                        {t('profile.bio')}
                      </label>
                      {isEditing ? (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                          rows={4}
                          style={{
                            width: '100%',
                            padding: 'var(--space-3)',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--text-sm)',
                            transition: 'all var(--transition-base)',
                            resize: 'vertical'
                          }}
                          placeholder={t('profile.tellAboutYourself')}
                        />
                      ) : (
                        <p style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--gray-900)',
                          margin: 0,
                          padding: 'var(--space-3)',
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-lg)',
                          minHeight: '96px'
                        }}>
{user?.bio || t('profile.noBioProvided')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div>
                    <h3 style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: '700',
                      color: 'var(--gray-900)',
                      margin: 0,
                      marginBottom: 'var(--space-4)'
                    }}>
                      {t('profile.accountStats')}
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-6)'
                    }}>
                      <StatsCard
                        icon={FaBookOpen}
                        label={t('profile.stats.stories')}
                        value={user?.total_stories || 0}
                        color="var(--blue-500)"
                      />
                      <StatsCard
                        icon={FaHeart}
                        label={t('profile.stats.likes')}
                        value={user?.total_likes_received || 0}
                        color="var(--red-500)"
                      />
                      <StatsCard
                        icon={FaComment}
                        label={t('profile.stats.comments')}
                        value={user?.total_comments_made || 0}
                        color="var(--green-500)"
                      />
                      <StatsCard
                        icon={FaRoute}
                        label={t('profile.stats.tours')}
                        value={user?.total_tours_booked || 0}
                        color="var(--purple-500)"
                      />
                    </div>

                    <div style={{
                      padding: 'var(--space-4)',
                      background: 'var(--amber-50)',
                      border: '1px solid var(--amber-200)',
                      borderRadius: 'var(--radius-lg)',
                      marginBottom: 'var(--space-4)'
                    }}>
                      <h4 style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: '700',
                        color: 'var(--amber-800)',
                        margin: 0,
                        marginBottom: 'var(--space-2)'
                      }}>
                        {t('profile.accountSecurity')}
                      </h4>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--amber-700)',
                        margin: 0,
                        marginBottom: 'var(--space-3)'
                      }}>
                        {t('profile.keepAccountSecure')}
                      </p>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--amber-600)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all var(--transition-base)'
                        }}
                      >
                        <FaLock size={12} style={{ marginRight: 'var(--space-1)' }} />
{t('profile.changePassword')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Stories Tab */}
            {activeTab === 'stories' && (
              <StoriesTab 
                storyData={storyData}
                setStoryData={setStoryData}
                mediaFiles={mediaFiles}
                setMediaFiles={setMediaFiles}
                submittingStory={submittingStory}
                setSubmittingStory={setSubmittingStory}
                userStories={userStories}
                setUserStories={setUserStories}
                termsAccepted={termsAccepted}
                setTermsAccepted={setTermsAccepted}
                onShowTerms={() => setShowTermsModal(true)}
              />
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <MessagesTab 
                userMessages={userMessages}
                loadingMessages={loadingMessages}
                loadUserMessages={loadUserMessages}
              />
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <SecurityTab 
                securityData={securityData}
                setSecurityData={setSecurityData}
                onPasswordChange={() => setShowPasswordModal(true)}
              />
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <ActivityTab 
                activityData={activityData}
                setActivityData={setActivityData}
              />
            )}

          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <PasswordModal
            passwordData={passwordData}
            setPasswordData={setPasswordData}
            showPasswords={showPasswords}
            setShowPasswords={setShowPasswords}
            saving={saving}
            onSave={handlePasswordChange}
            onClose={() => {
              setShowPasswordModal(false);
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setPasswordValidation({ isValid: false, errors: [] });
              setShowPasswordRequirements(false);
            }}
            t={t}
            passwordValidation={passwordValidation}
            setPasswordValidation={setPasswordValidation}
            showPasswordRequirements={showPasswordRequirements}
            setShowPasswordRequirements={setShowPasswordRequirements}
          />
        )}

        {/* Terms and Conditions Modal */}
        {showTermsModal && (
          <TermsModal
            onClose={() => setShowTermsModal(false)}
            onAccept={() => {
              setTermsAccepted(true);
              setShowTermsModal(false);
              toast.success(t('profile.stories.messages.termsAcceptedSuccessfully'));
            }}
          />
        )}
      </div>

      {/* CSS Animation Keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    padding: 'var(--space-4)',
    background: 'var(--gradient-card)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      background: color,
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <Icon size={16} />
    </div>
    <div>
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--gray-600)',
        margin: 0
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 'var(--text-lg)',
        fontWeight: '700',
        color: 'var(--gray-900)',
        margin: 0
      }}>
        {value}
      </p>
    </div>
  </div>
);

// Password Modal Component
const PasswordModal = ({ 
  passwordData, 
  setPasswordData, 
  showPasswords, 
  setShowPasswords, 
  saving, 
  onSave, 
  onClose, 
  t,
  passwordValidation,
  setPasswordValidation,
  showPasswordRequirements,
  setShowPasswordRequirements
}) => {
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Real-time password validation for new password
    if (field === 'newPassword') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  return (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  }}>
    <div style={{
      background: 'var(--gradient-card)',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--gray-200)',
      boxShadow: 'var(--shadow-2xl)',
      padding: 'var(--space-8)',
      width: '100%',
      maxWidth: '400px',
      margin: 'var(--space-4)'
    }}>
      <h3 style={{
        fontSize: 'var(--text-xl)',
        fontWeight: '700',
        color: 'var(--gray-900)',
        margin: 0,
        marginBottom: 'var(--space-6)'
      }}>
        {t('profile.changePassword')}
      </h3>
      
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--text-sm)',
          fontWeight: '600',
          color: 'var(--gray-700)',
          marginBottom: 'var(--space-2)'
        }}>
          {t('profile.currentPassword')}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              paddingRight: 'var(--space-10)',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)'
            }}
            placeholder={t('profile.enterCurrentPassword')}
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
            style={{
              position: 'absolute',
              right: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--gray-500)',
              cursor: 'pointer'
            }}
          >
            {showPasswords.current ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--text-sm)',
          fontWeight: '600',
          color: 'var(--gray-700)',
          marginBottom: 'var(--space-2)'
        }}>
          {t('profile.newPassword')}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            onFocus={() => setShowPasswordRequirements(true)}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              paddingRight: 'var(--space-10)',
              border: `1px solid ${passwordValidation.isValid ? 'var(--green-500)' : passwordData.newPassword ? 'var(--red-500)' : 'var(--gray-300)'}`,
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)'
            }}
            placeholder={t('profile.enterNewPassword')}
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
            style={{
              position: 'absolute',
              right: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--gray-500)',
              cursor: 'pointer'
            }}
          >
            {showPasswords.new ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <label style={{
          display: 'block',
          fontSize: 'var(--text-sm)',
          fontWeight: '600',
          color: 'var(--gray-700)',
          marginBottom: 'var(--space-2)'
        }}>
          {t('profile.confirmNewPassword')}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              paddingRight: 'var(--space-10)',
              border: `1px solid ${passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword ? 'var(--green-500)' : passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'var(--red-500)' : 'var(--gray-300)'}`,
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)'
            }}
            placeholder={t('profile.confirmNewPasswordPlaceholder')}
          />
          <button
            type="button"
            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
            style={{
              position: 'absolute',
              right: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--gray-500)',
              cursor: 'pointer'
            }}
          >
            {showPasswords.confirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        </div>
        {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem'
          }}>
            <FaCheck style={{ color: '#10b981', fontSize: '0.8rem' }} />
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>
              Passwords match
            </span>
          </div>
        )}
        {showPasswordRequirements && passwordData.newPassword && (
          <PasswordRequirements password={passwordData.newPassword} t={t} />
        )}
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--space-3)'
      }}>
        <button
          onClick={onSave}
          disabled={saving || !passwordValidation.isValid || passwordData.newPassword !== passwordData.confirmPassword}
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-4)',
            background: (saving || !passwordValidation.isValid || passwordData.newPassword !== passwordData.confirmPassword) ? 'var(--gray-400)' : 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            cursor: (saving || !passwordValidation.isValid || passwordData.newPassword !== passwordData.confirmPassword) ? 'not-allowed' : 'pointer',
            opacity: (saving || !passwordValidation.isValid || passwordData.newPassword !== passwordData.confirmPassword) ? 0.7 : 1,
            transition: 'all var(--transition-base)'
          }}
        >
          {saving ? t('profile.updating') : t('profile.updatePassword')}
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--gray-600)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all var(--transition-base)'
          }}
        >
          {t('profile.cancel')}
        </button>
      </div>
    </div>
  </div>
  );
};

// Security Tab Component
const SecurityTab = ({ securityData, setSecurityData, onPasswordChange }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load real security data
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    await Promise.all([
      loadSessions(),
      loadSecurityLogs()
    ]);
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await safeApiCall('/api/profile/sessions');
      if (data.success && data.sessions) {
        setSessions(data.sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.warn('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSecurityLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await safeApiCall('/api/profile/security-logs');
      if (data.success && data.logs) {
        setSecurityLogs(data.logs);
      } else {
        setSecurityLogs([]);
      }
    } catch (error) {
      console.warn('Failed to load security logs:', error);
      setSecurityLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleToggle2FA = async () => {
    setLoading(true);
    try {
      const data = await safeApiCall('/api/profile/toggle-2fa', {
        method: 'POST',
        body: JSON.stringify({ enabled: !securityData.twoFactorEnabled })
      });
      
      if (data.success) {
        setSecurityData(prev => ({
          ...prev,
          twoFactorEnabled: !prev.twoFactorEnabled
        }));
        toast.success(!securityData.twoFactorEnabled ? t('profile.stories.messages.twoFactorEnabledSuccessfully') : t('profile.stories.messages.twoFactorDisabledSuccessfully'));
        // Reload security logs to show the 2FA change
        loadSecurityLogs();
      } else {
        throw new Error(data.message || 'Failed to update 2FA settings');
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      toast.error(t('profile.stories.messages.failedToUpdate2FASettings'));
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      const data = await safeApiCall(`/api/profile/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (data.success) {
        toast.success('Session terminated successfully');
        loadSessions(); // Reload sessions
        loadSecurityLogs(); // Reload logs to show termination
      } else {
        throw new Error(data.message || 'Failed to terminate session');
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to terminate session');
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-8)'
      }}>
        <div>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '800',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-1)'
          }}>
            {t('profile.security.title')}
          </h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--gray-600)',
            margin: 0
          }}>
            {t('profile.security.subtitle')}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(2, 1fr)' : '1fr',
        gap: 'var(--space-8)'
      }}>
        {/* Security Options */}
        <div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-6)'
          }}>
            {t('profile.security.options')}
          </h3>

          {/* Password */}
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--gradient-card)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--blue-500)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <FaLock size={16} />
                </div>
                <div>
                  <h4 style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    margin: 0
                  }}>
                    {t('profile.password')}
                  </h4>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--gray-600)',
                    margin: 0
                  }}>
                    {t('profile.lastChanged')} 7 {t('profile.daysAgo')}
                  </p>
                </div>
              </div>
              <button
                onClick={onPasswordChange}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--primary-teal)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
{t('profile.change')}
              </button>
            </div>
          </div>

          {/* Two Factor Authentication */}
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--gradient-card)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--green-500)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <FaFingerprint size={16} />
                </div>
                <div>
                  <h4 style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    margin: 0
                  }}>
                    {t('profile.twoFactorAuth')}
                  </h4>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--gray-600)',
                    margin: 0
                  }}>
                    {securityData.twoFactorEnabled ? t('profile.enabled') : t('profile.disabled')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggle2FA}
                disabled={loading}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: securityData.twoFactorEnabled ? 'var(--red-600)' : 'var(--green-600)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
{loading ? t('profile.loading') : (securityData.twoFactorEnabled ? t('profile.disable') : t('profile.enable'))}
              </button>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-6)'
          }}>
            {t('profile.activeSessions')}
          </h3>

          {loadingSessions ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-8)'
            }}>
              <FaSpinner size={24} style={{
                color: 'var(--primary-teal)',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : sessions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              background: 'var(--gradient-card)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <FaDesktop size={48} style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }} />
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--gray-600)',
                margin: 0
              }}>
                No active sessions found
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} style={{
                padding: 'var(--space-4)',
                background: 'var(--gradient-card)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-3)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: session.is_current ? 'var(--green-500)' : 'var(--gray-500)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {session.device_type === 'mobile' ? <FaMobile size={12} /> : <FaDesktop size={12} />}
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                        margin: 0
                      }}>
                        {session.device_name} {session.is_current && `(${t('profile.current')})`}
                      </h4>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-600)',
                        margin: 0
                      }}>
                        {session.location} • {new Date(session.last_activity).toLocaleString()}
                      </p>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        margin: 0
                      }}>
                        IP: {session.ip_address}
                      </p>
                    </div>
                  </div>
                  {!session.is_current && (
                    <button 
                      onClick={() => terminateSession(session.id)}
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        background: 'var(--red-600)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {t('profile.end')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Logs */}
      <div style={{ marginTop: 'var(--space-8)' }}>
        <h3 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: '700',
          color: 'var(--gray-900)',
          margin: 0,
          marginBottom: 'var(--space-6)'
        }}>
          {t('profile.recentSecurityActivity')}
        </h3>
        
        {loadingLogs ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-8)'
          }}>
            <FaSpinner size={24} style={{
              color: 'var(--primary-teal)',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : securityLogs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            background: 'var(--gradient-card)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <FaShieldAlt size={48} style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }} />
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--gray-600)',
              margin: 0
            }}>
              No security logs found
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--gradient-card)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden'
          }}>
            {securityLogs.map((log, index) => (
              <div key={log.id} style={{
                padding: 'var(--space-4)',
                borderBottom: index < securityLogs.length - 1 ? '1px solid var(--gray-200)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: log.status === 'success' ? 'var(--green-500)' : 'var(--red-500)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <FaCheck size={12} />
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      color: 'var(--gray-900)',
                      margin: 0
                    }}>
                      {log.action}
                    </h4>
                    <p style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--gray-600)',
                      margin: 0
                    }}>
                      {log.device_name} • {log.location}
                    </p>
                    {log.ip_address && (
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        margin: 0
                      }}>
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                </div>
                <p style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-500)',
                  margin: 0
                }}>
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Activity Tab Component
const ActivityTab = ({ activityData, setActivityData }) => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalStories: 0,
    totalLikes: 0,
    totalComments: 0,
    totalTours: 0
  });
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load real activity data
  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    await Promise.all([
      loadActivities(),
      loadStats()
    ]);
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const data = await safeApiCall('/api/profile/activities');
      if (data.success && data.activities) {
        setActivities(data.activities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.warn('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await safeApiCall('/api/profile/stats');
      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        setStats({
          totalStories: 0,
          totalLikes: 0,
          totalComments: 0,
          totalTours: 0
        });
      }
    } catch (error) {
      console.warn('Failed to load stats:', error);
      setStats({
        totalStories: 0,
        totalLikes: 0,
        totalComments: 0,
        totalTours: 0
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'story_created': return FaBookOpen;
      case 'tour_booked': return FaRoute;
      case 'like_received': return FaHeart;
      case 'comment_made': return FaComment;
      case 'profile_updated': return FaUser;
      case 'password_changed': return FaLock;
      default: return FaHistory;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'story_created': return 'var(--blue-500)';
      case 'tour_booked': return 'var(--green-500)';
      case 'like_received': return 'var(--red-500)';
      case 'comment_made': return 'var(--purple-500)';
      case 'profile_updated': return 'var(--teal-500)';
      case 'password_changed': return 'var(--amber-500)';
      default: return 'var(--gray-500)';
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-8)'
      }}>
        <div>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '800',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-1)'
          }}>
            {t('profile.activity.title')}
          </h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--gray-600)',
            margin: 0
          }}>
            {t('profile.activity.subtitle')}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 1024 ? '2fr 1fr' : '1fr',
        gap: 'var(--space-8)'
      }}>
        {/* Activity Feed */}
        <div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-6)'
          }}>
            {t('profile.recentActivities')}
          </h3>

          {loadingActivities ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-8)'
            }}>
              <FaSpinner size={24} style={{
                color: 'var(--primary-teal)',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : activities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              background: 'var(--gradient-card)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <FaHistory size={48} style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }} />
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--gray-600)',
                margin: 0
              }}>
                No recent activities found
              </p>
            </div>
          ) : (
            <div style={{
              background: 'var(--gradient-card)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}>
              {activities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} style={{
                    padding: 'var(--space-4)',
                    borderBottom: index < activities.length - 1 ? '1px solid var(--gray-200)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: color,
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                        margin: 0,
                        marginBottom: 'var(--space-1)'
                      }}>
                        {activity.title}
                      </h4>
                      <p style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--gray-600)',
                        margin: 0,
                        marginBottom: 'var(--space-1)'
                      }}>
                        {activity.description}
                      </p>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        margin: 0
                      }}>
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Stats */}
        <div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-6)'
          }}>
            {t('profile.activityStats')}
          </h3>

          {loadingStats ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-8)'
            }}>
              <FaSpinner size={24} style={{
                color: 'var(--primary-teal)',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'var(--space-4)'
            }}>
              <StatsCard
                icon={FaBookOpen}
                label={t('profile.stats.storiesCreated')}
                value={stats.totalStories}
                color="var(--blue-500)"
              />
              <StatsCard
                icon={FaHeart}
                label={t('profile.stats.likesReceived')}
                value={stats.totalLikes}
                color="var(--red-500)"
              />
              <StatsCard
                icon={FaComment}
                label={t('profile.stats.commentsMade')}
                value={stats.totalComments}
                color="var(--purple-500)"
              />
              <StatsCard
                icon={FaRoute}
                label={t('profile.stats.toursBooked')}
                value={stats.totalTours}
                color="var(--green-500)"
              />
            </div>
          )}

          {/* Achievements */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <h4 style={{
              fontSize: 'var(--text-md)',
              fontWeight: '700',
              color: 'var(--gray-900)',
              margin: 0,
              marginBottom: 'var(--space-4)'
            }}>
              {t('profile.recentAchievements')}
            </h4>
            
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--amber-50)',
              border: '1px solid var(--amber-200)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-3)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)'
              }}>
                <FaTrophy style={{ color: 'var(--amber-600)', fontSize: '24px' }} />
                <div>
                  <h5 style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    color: 'var(--amber-800)',
                    margin: 0
                  }}>
                    {t('profile.achievements.storyteller')}
                  </h5>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--amber-700)',
                    margin: 0
                  }}>
                    {t('profile.achievements.createdStories')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--green-50)',
              border: '1px solid var(--green-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)'
              }}>
                <FaStar style={{ color: 'var(--green-600)', fontSize: '24px' }} />
                <div>
                  <h5 style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    color: 'var(--green-800)',
                    margin: 0
                  }}>
                    {t('profile.achievements.popularCreator')}
                  </h5>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--green-700)',
                    margin: 0
                  }}>
                    {t('profile.achievements.receivedLikes')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Stories Tab Component
const StoriesTab = ({ 
  storyData, setStoryData, mediaFiles, setMediaFiles, submittingStory, setSubmittingStory,
  userStories, setUserStories, termsAccepted, setTermsAccepted, onShowTerms 
}) => {
  const { t } = useLanguage();
  const { user: authUser, isAuthenticated } = useAuth(); // Get authUser and isAuthenticated directly in StoriesTab
  const fileInputRef = useRef(null);
  const [loadingStories, setLoadingStories] = useState(false);

  // Mock user stories with different statuses
  const mockUserStories = [
    {
      id: 1,
      title: 'Amazing Adventure in Tehran',
      status: 'approved',
      created_at: '2024-01-20',
      updated_at: '2024-01-22',
      views: 245,
      likes: 32,
      comments: 8
    },
    {
      id: 2,
      title: 'Journey through Isfahan',
      status: 'pending',
      created_at: '2024-01-23',
      updated_at: '2024-01-23',
      views: 0,
      likes: 0,
      comments: 0
    },
    {
      id: 3,
      title: 'Desert Experience in Yazd',
      status: 'rejected',
      created_at: '2024-01-18',
      updated_at: '2024-01-19',
      views: 0,
      likes: 0,
      comments: 0,
      rejection_reason: 'Content does not meet community guidelines'
    }
  ];

  useEffect(() => {
    loadUserStories();
  }, []);

  const loadUserStories = async () => {
    setLoadingStories(true);
    try {
      // Check if user is authenticated before making API calls
      if (!authUser || !authUser.id) {
        console.warn('User not authenticated, using mock data for stories');
        setUserStories(mockUserStories);
        return;
      }

      // Try to get real user submissions with safe API call
      try {
        const data = await safeApiCall('/api/profile/my-submissions');
        
        if (data.success && data.submissions) {
          setUserStories(data.submissions);
        } else {
          // Fallback to mock data
          console.warn('API call failed or returned no data, using mock data for user stories');
          setUserStories(mockUserStories);
        }
      } catch (apiError) {
        console.warn('Story submissions API failed, using mock data:', apiError);
        setUserStories(mockUserStories);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      // Fallback to mock data instead of failing
      console.warn('Using mock data for user stories due to error');
      setUserStories(mockUserStories);
    } finally {
      setLoadingStories(false);
    }
  };

  const handleMediaUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Check total file count limit
    if (mediaFiles.length + files.length > 10) {
      toast.error(t('profile.stories.messages.maximum10MediaFilesAllowed'));
      return;
    }
    
    // Validate files
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        invalidFiles.push(`${file.name} ${t('profile.stories.messages.isNotValidMediaFile')}`);
      } else if (!isValidSize) {
        invalidFiles.push(`${file.name} ${t('profile.stories.messages.isTooLarge')}`);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(error => toast.error(error));
    }
    
    if (validFiles.length === 0) {
      return;
    }

    // Create preview objects
    const mediaObjects = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      thumbnail: null, // For user-uploaded thumbnails
      thumbnailFile: null // Store the thumbnail file
    }));

    setMediaFiles(prev => [...prev, ...mediaObjects]);
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} ${t('profile.stories.messages.filesAddedSuccessfully')}`);
    }
  };

  const removeMedia = (id) => {
    setMediaFiles(prev => {
      const updated = prev.filter(media => media.id !== id);
      // Clean up object URLs
      const removed = prev.find(media => media.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      if (removed?.thumbnail) {
        URL.revokeObjectURL(removed.thumbnail);
      }
      return updated;
    });
  };

  const handleSubmitStory = useCallback(async () => {
    // Enhanced validation
    if (!storyData.title.trim()) {
      toast.error(t('profile.stories.messages.pleaseEnterStoryTitle'));
      return;
    }
    if (storyData.title.trim().length < 5) {
      toast.error(t('profile.stories.messages.storyTitleMustBeAtLeast5Chars'));
      return;
    }
    if (!storyData.content.trim()) {
      toast.error(t('profile.stories.messages.pleaseEnterStoryContent'));
      return;
    }
    if (storyData.content.trim().length < 50) {
      toast.error(t('profile.stories.messages.storyContentMustBeAtLeast50Chars'));
      return;
    }
    if (!termsAccepted) {
      toast.error(t('profile.stories.messages.pleaseAcceptTermsAndConditions'));
      return;
    }

    // Check authentication before submitting (use captured auth state)
    console.log('🔍 handleSubmitStory - Auth debug:');
    console.log('  - authUser:', authUser);
    console.log('  - authUser type:', typeof authUser);
    console.log('  - authUser?.id:', authUser?.id);
    console.log('  - isAuthenticated():', isAuthenticated?.());
    
    // Use captured auth state
    const userAuthenticated = authUser && authUser.id && isAuthenticated?.();
    
    if (!userAuthenticated) {
      console.warn('❌ User not authenticated, cannot submit story');
      console.warn('  - authUser exists:', !!authUser);
      console.warn('  - authUser.id exists:', !!authUser?.id);
      console.warn('  - isAuthenticated():', isAuthenticated?.());
      toast.error('Please log in to submit stories');
      return;
    }
    
    console.log('✅ Authentication check passed, submitting story...');

    // Validate media files
    const invalidFiles = mediaFiles.filter(media => {
      const file = media.file;
      if (!file) return true;
      
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB
      
      return !isValidType || !isValidSize;
    });

    if (invalidFiles.length > 0) {
      toast.error(t('profile.stories.messages.someMediaFilesInvalidOrTooLarge'));
      return;
    }

    setSubmittingStory(true);
    try {
      // Create FormData for story submission
      const formData = new FormData();
      formData.append('title', storyData.title);
      formData.append('content', storyData.content);
      formData.append('location', storyData.location || '');
      formData.append('category', storyData.category);
      formData.append('language', storyData.language);  // Add language field
      formData.append('tags', storyData.tags || '');
      formData.append('terms_accepted', 'true');
      
      // Add user info for debugging
      console.log('📤 Submitting story for user:', authUser.id, authUser.email);
      
      // Add media files
      mediaFiles.forEach((media) => {
        if (media.file) {
          formData.append('media_files', media.file);
          if (media.thumbnailFile) {
            formData.append('thumbnail_files', media.thumbnailFile);
          } else {
            formData.append('thumbnail_files', new File([], ''));
          }
        }
      });
      
      // Submit story with safe API call
      const data = await safeApiCall('/api/profile/submit', {
        method: 'POST',
        headers: {}, // Let fetch handle FormData headers
        body: formData,
      });
      
      if (data.success) {
        // Reset form
        setStoryData({
          title: '',
          content: '',
          location: '',
          tags: '',
          category: 'adventure',
          language: 'en'
        });
        setMediaFiles([]);
        setTermsAccepted(false);
        
        toast.success(t('profile.stories.messages.storySubmittedSuccessfully'));
        
        // Reload stories
        loadUserStories();
      } else {
        toast.error(data.message || t('profile.stories.messages.failedToSubmitStory'));
      }
    } catch (error) {
      console.error('Error submitting story:', error);
      toast.error(t('profile.stories.messages.failedToSubmitStoryTryAgain'));
    } finally {
      setSubmittingStory(false);
    }
  }, [storyData, termsAccepted, mediaFiles, authUser, isAuthenticated, t]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'var(--amber-500)', bg: 'var(--amber-50)', border: 'var(--amber-200)', text: 'Pending Review' },
      approved: { color: 'var(--green-500)', bg: 'var(--green-50)', border: 'var(--green-200)', text: 'Published' },
      rejected: { color: 'var(--red-500)', bg: 'var(--red-50)', border: 'var(--red-200)', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    
    return (
      <span style={{
        padding: 'var(--space-1) var(--space-2)',
        fontSize: 'var(--text-xs)',
        fontWeight: '600',
        color: badge.color,
        background: badge.bg,
        border: `1px solid ${badge.border}`,
        borderRadius: 'var(--radius-md)'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-8)'
      }}>
        <div>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '800',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-1)'
          }}>
            {t('profile.stories.title')}
          </h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--gray-600)',
            margin: 0
          }}>
            {t('profile.stories.subtitle')}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 1024 ? '1fr 400px' : '1fr',
        gap: 'var(--space-8)'
      }}>
        {/* Story Submission Form */}
        <div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-6)'
          }}>
            {t('profile.stories.submitNew')}
          </h3>

          <div style={{
            background: 'var(--gradient-card)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)'
          }}>
            {/* Title */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)'
              }}>
                <label style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: '600',
                  color: 'var(--gray-700)',
                  margin: 0
                }}>
                  {t('profile.stories.storyTitle')} *
                </label>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: storyData.title.length < 5 ? 'var(--red-500)' : 'var(--gray-500)',
                  fontWeight: '500'
                }}>
                  {storyData.title.length} {t('profile.stories.characters')} ({t('profile.stories.min')} 5)
                </span>
              </div>
              <input
                type="text"
                value={storyData.title}
                onChange={(e) => setStoryData(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: `1px solid ${storyData.title.length < 5 ? 'var(--red-300)' : 'var(--gray-300)'}`,
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-sm)',
                  transition: 'border-color var(--transition-base)'
                }}
                placeholder={t('profile.stories.enterStoryTitle')}
              />
            </div>

            {/* Category and Location */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-4)'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '600',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {t('profile.stories.category')}
                </label>
                <select
                  value={storyData.category}
                  onChange={(e) => setStoryData(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    background: 'white'
                  }}
                >
                  <option value="adventure">{t('profile.stories.adventure')}</option>
                  <option value="culture">{t('profile.stories.culture')}</option>
                  <option value="food">{t('profile.stories.food')}</option>
                  <option value="nature">{t('profile.stories.nature')}</option>
                  <option value="history">{t('profile.stories.history')}</option>
                  <option value="photography">{t('profile.stories.photography')}</option>
                </select>
              </div>
              
              {/* Language Selector */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '600',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {t('profile.stories.language')} *
                </label>
                <select
                  value={storyData.language}
                  onChange={(e) => setStoryData({ ...storyData, language: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    background: 'white'
                  }}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="it">🇮🇹 Italiano</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '600',
                  color: 'var(--gray-700)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {t('profile.stories.location')}
                </label>
                <input
                  type="text"
                  value={storyData.location}
                  onChange={(e) => setStoryData(prev => ({ ...prev, location: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)'
                  }}
                  placeholder={t('profile.stories.locationPlaceholder')}
                />
              </div>
            </div>

            {/* Content */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)'
              }}>
                <label style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: '600',
                  color: 'var(--gray-700)',
                  margin: 0
                }}>
                  {t('profile.stories.storyContent')} *
                </label>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  color: storyData.content.length < 50 ? 'var(--red-500)' : 'var(--gray-500)',
                  fontWeight: '500'
                }}>
                  {storyData.content.length} characters (min 50)
                </span>
              </div>
              <textarea
                value={storyData.content}
                onChange={(e) => setStoryData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: `1px solid ${storyData.content.length < 50 ? 'var(--red-300)' : 'var(--gray-300)'}`,
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-sm)',
                  resize: 'vertical',
                  transition: 'border-color var(--transition-base)'
                }}
                placeholder={t('profile.stories.storyContentPlaceholder')}
              />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                color: 'var(--gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('profile.stories.tags')}
              </label>
              <input
                type="text"
                value={storyData.tags}
                onChange={(e) => setStoryData(prev => ({ ...prev, tags: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-sm)'
                }}
                placeholder={t('profile.stories.tagsPlaceholder')}
              />
            </div>

            {/* Media Upload */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                color: 'var(--gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('profile.stories.media')}
              </label>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  marginBottom: mediaFiles.length > 0 ? 'var(--space-4)' : 0,
                  background: 'var(--gray-50)'
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = 'var(--primary-teal)';
                  e.target.style.background = 'var(--primary-teal-50)';
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = 'var(--gray-300)';
                  e.target.style.background = 'var(--gray-50)';
                }}
              >
                <FaUpload size={32} style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-2)' }} />
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gray-600)',
                  margin: 0,
                  marginBottom: 'var(--space-1)',
                  fontWeight: '600'
                }}>
                  {t('profile.stories.clickToUpload')}
                </p>
                <p style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-500)',
                  margin: 0,
                  marginBottom: 'var(--space-2)'
                }}>
                  {t('profile.stories.maxFileSize')}
                </p>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-400)',
                  margin: 0
                }}>
                  {t('profile.stories.supportedFormats')}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                style={{ display: 'none' }}
              />

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 'var(--space-3)'
                }}>
                  {mediaFiles.map((media) => (
                    <div key={media.id} style={{
                      position: 'relative',
                      background: 'var(--gray-100)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      aspectRatio: '16/9'
                    }}>
                      {media.type === 'image' ? (
                        <img
                          src={media.preview}
                          alt={media.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'var(--gray-800)',
                          color: 'white',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {media.thumbnail ? (
                            <img
                              src={media.thumbnail}
                              alt="Video thumbnail"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <FaVideo size={24} />
                            </div>
                          )}
                          
                          {/* Thumbnail Upload Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (event) => {
                                const file = event.target.files[0];
                                if (file && file.type.startsWith('image/')) {
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setMediaFiles(prev => prev.map(m => 
                                      m.id === media.id 
                                        ? { ...m, thumbnail: e.target.result, thumbnailFile: file }
                                        : m
                                    ));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              background: 'rgba(0, 0, 0, 0.8)',
                              border: 'none',
                              borderRadius: 'var(--radius-lg)',
                              padding: 'var(--space-2)',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: 'var(--text-xs)',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-1)',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <FaUpload size={12} />
                            {media.thumbnail ? 'Change' : 'Add'} Thumbnail
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(media.id)}
                        style={{
                          position: 'absolute',
                          top: 'var(--space-2)',
                          right: 'var(--space-2)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--red-600)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaTimes size={12} />
                      </button>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: 'var(--space-1)',
                        fontSize: 'var(--text-xs)'
                      }}>
                        {media.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Terms Acceptance */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
              padding: 'var(--space-4)',
              background: 'var(--blue-50)',
              border: '1px solid var(--blue-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <div>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gray-700)',
                  margin: 0
                }}>
                  {t('profile.stories.iAgreeTo')}{' '}
                  <button
                    onClick={onShowTerms}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-teal)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600'
                    }}
                  >
                    {t('profile.stories.termsAndConditions')}
                  </button>
                  {' '}{t('profile.stories.andUnderstand')}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitStory}
              disabled={submittingStory || !termsAccepted || storyData.title.length < 5 || storyData.content.length < 50}
              style={{
                width: '100%',
                padding: 'var(--space-4)',
                background: (submittingStory || !termsAccepted || storyData.title.length < 5 || storyData.content.length < 50) 
                  ? 'var(--gray-400)' 
                  : 'var(--primary-teal)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                cursor: (submittingStory || !termsAccepted || storyData.title.length < 5 || storyData.content.length < 50) 
                  ? 'not-allowed' 
                  : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                transition: 'all var(--transition-base)'
              }}
            >
              {submittingStory ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  {t('profile.stories.submittingStory')}
                </>
              ) : (
                <>
                  <FaPen />
                  {t('profile.stories.submitStoryForReview')}
                </>
              )}
            </button>
            
            {/* Validation Summary */}
            {(storyData.title.length < 5 || storyData.content.length < 50 || !termsAccepted) && (
              <div style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: 'var(--amber-50)',
                border: '1px solid var(--amber-200)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)',
                color: 'var(--amber-800)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: 'var(--space-1)' }}>
                  {t('profile.stories.completeFollowing')}
                </div>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                  {storyData.title.length < 5 && <li>{t('profile.stories.storyTitleMinChars')}</li>}
                  {storyData.content.length < 50 && <li>{t('profile.stories.storyContentMinChars')}</li>}
                  {!termsAccepted && <li>{t('profile.stories.acceptTermsConditions')}</li>}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* My Stories List */}
        <div>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: 'var(--space-6)'
          }}>
            {t('profile.stories.mySubmittedStories')}
          </h3>

          {loadingStories ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-8)'
            }}>
              <FaSpinner size={24} style={{
                color: 'var(--primary-teal)',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : userStories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              background: 'var(--gradient-card)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <FaBookOpen size={48} style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }} />
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--gray-600)',
                margin: 0
              }}>
                {t('profile.stories.noStoriesYet')}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: 'var(--space-4)'
            }}>
              {userStories.map((story) => (
                <div key={story.id} style={{
                  background: 'var(--gradient-card)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)'
                  }}>
                    <h4 style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      color: 'var(--gray-900)',
                      margin: 0,
                      flex: 1
                    }}>
                      {story.title}
                    </h4>
                    {getStatusBadge(story.status)}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        margin: 0
                      }}>{t('profile.stories.views')}</p>
                      <p style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                        margin: 0
                      }}>{story.views}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        margin: 0
                      }}>{t('profile.stories.likes')}</p>
                      <p style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                        margin: 0
                      }}>{story.likes}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        margin: 0
                      }}>{t('profile.stories.comments')}</p>
                      <p style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                        margin: 0
                      }}>{story.comments}</p>
                    </div>
                  </div>

                  {story.rejection_reason && (
                    <div style={{
                      padding: 'var(--space-3)',
                      background: 'var(--red-50)',
                      border: '1px solid var(--red-200)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-3)'
                    }}>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--red-700)',
                        margin: 0,
                        fontWeight: '600',
                        marginBottom: 'var(--space-1)'
                      }}>
                        {t('profile.stories.rejectionReason')}
                      </p>
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--red-600)',
                        margin: 0
                      }}>
                        {story.rejection_reason}
                      </p>
                    </div>
                  )}

                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--gray-500)',
                    margin: 0
                  }}>
                    {t('profile.stories.submitted')}: {new Date(story.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Terms and Conditions Modal
const TermsModal = ({ onClose, onAccept }) => {
  const { t } = useLanguage();
  return (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  }}>
    <div style={{
      background: 'var(--gradient-card)',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--gray-200)',
      boxShadow: 'var(--shadow-2xl)',
      padding: 'var(--space-8)',
      width: '100%',
      maxWidth: '600px',
      maxHeight: '80vh',
      margin: 'var(--space-4)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-6)'
      }}>
        <FaFileContract size={24} style={{ color: 'var(--primary-teal)' }} />
        <h3 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: '700',
          color: 'var(--gray-900)',
          margin: 0
        }}>
          {t('profile.stories.termsModal.title')}
        </h3>
      </div>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: 'var(--space-6)',
        padding: 'var(--space-4)',
        background: 'var(--gray-50)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)'
      }}>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-700)', lineHeight: 1.6 }}>
          <h4 style={{ color: 'var(--gray-900)', marginBottom: 'var(--space-3)' }}>
            {t('profile.stories.termsModal.contentGuidelines')}
          </h4>
          <p style={{ marginBottom: 'var(--space-3)' }}>
            {t('profile.stories.termsModal.introText')}
          </p>
          
          <h5 style={{ color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
            1. {t('profile.stories.termsModal.contentOwnership')}
          </h5>
          <ul style={{ marginBottom: 'var(--space-3)', paddingLeft: 'var(--space-4)' }}>
            {t('profile.stories.termsModal.contentOwnershipItems').map ? t('profile.stories.termsModal.contentOwnershipItems').map((item, index) => (
              <li key={index}>{item}</li>
            )) : (
              <>
                <li>You own the rights to all content and media you submit</li>
                <li>You grant NavidDoggy permission to publish and promote your content</li>
                <li>You may request removal of your content at any time</li>
              </>
            )}
          </ul>

          <h5 style={{ color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
            2. {t('profile.stories.termsModal.contentStandards')}
          </h5>
          <ul style={{ marginBottom: 'var(--space-3)', paddingLeft: 'var(--space-4)' }}>
            {t('profile.stories.termsModal.contentStandardsItems').map ? t('profile.stories.termsModal.contentStandardsItems').map((item, index) => (
              <li key={index}>{item}</li>
            )) : (
              <>
                <li>Content must be original and authentic</li>
                <li>No offensive, inappropriate, or harmful material</li>
                <li>Respect local cultures and communities</li>
                <li>Accurate information and honest experiences</li>
              </>
            )}
          </ul>

          <h5 style={{ color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
            3. {t('profile.stories.termsModal.reviewProcess')}
          </h5>
          <ul style={{ marginBottom: 'var(--space-3)', paddingLeft: 'var(--space-4)' }}>
            {t('profile.stories.termsModal.reviewProcessItems').map ? t('profile.stories.termsModal.reviewProcessItems').map((item, index) => (
              <li key={index}>{item}</li>
            )) : (
              <>
                <li>All submissions undergo editorial review</li>
                <li>Review process takes 2-5 business days</li>
                <li>We reserve the right to edit for clarity and style</li>
                <li>Rejection reasons will be provided if applicable</li>
              </>
            )}
          </ul>

          <h5 style={{ color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
            4. {t('profile.stories.termsModal.privacyData')}
          </h5>
          <ul style={{ marginBottom: 'var(--space-3)', paddingLeft: 'var(--space-4)' }}>
            {t('profile.stories.termsModal.privacyDataItems').map ? t('profile.stories.termsModal.privacyDataItems').map((item, index) => (
              <li key={index}>{item}</li>
            )) : (
              <>
                <li>Your personal information remains private</li>
                <li>Only your chosen display name appears publicly</li>
                <li>Media metadata may be processed for optimization</li>
              </>
            )}
          </ul>

          <h5 style={{ color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
            5. {t('profile.stories.termsModal.communityGuidelines')}
          </h5>
          <ul style={{ marginBottom: 'var(--space-3)', paddingLeft: 'var(--space-4)' }}>
            {t('profile.stories.termsModal.communityGuidelinesItems').map ? t('profile.stories.termsModal.communityGuidelinesItems').map((item, index) => (
              <li key={index}>{item}</li>
            )) : (
              <>
                <li>Promote positive travel experiences</li>
                <li>Respect cultural sensitivity</li>
                <li>Encourage responsible tourism</li>
                <li>Support local communities</li>
              </>
            )}
          </ul>

          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--amber-50)',
            border: '1px solid var(--amber-200)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-4)'
          }}>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--amber-800)',
              margin: 0,
              fontWeight: '600'
            }}>
              {t('profile.stories.termsModal.noteText')}
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 'var(--space-3)'
      }}>
        <button
          onClick={onAccept}
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <FaCheck />
          {t('profile.stories.termsModal.acceptContinue')}
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--gray-600)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all var(--transition-base)'
          }}
        >
          {t('profile.cancel')}
        </button>
      </div>
    </div>
  </div>
  );
};

const MessagesTab = ({ userMessages, loadingMessages, loadUserMessages }) => {
  const { t } = useLanguage();
  
  const handleRefresh = () => {
    // Reset the loaded state to allow refresh
    setMessagesLoaded(false);
    loadUserMessages();
  };
  
  useEffect(() => {
    loadUserMessages();
  }, [loadUserMessages]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return '#f59e0b';
      case 'read': return '#6b7280';
      case 'replied': return '#10b981';
      case 'closed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread': return <FaClock style={{ color: '#f59e0b' }} />;
      case 'read': return <FaEye style={{ color: '#6b7280' }} />;
      case 'replied': return <FaCheck style={{ color: '#10b981' }} />;
      case 'closed': return <FaTimes style={{ color: '#ef4444' }} />;
      default: return <FaEnvelope style={{ color: '#6b7280' }} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div style={{
      background: 'var(--gradient-card)',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--gray-200)',
      padding: 'var(--space-6)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-6)'
      }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: '700',
          color: 'var(--gray-900)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}>
          <FaEnvelope style={{ color: 'var(--primary-teal)' }} />
          Messages
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loadingMessages}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            cursor: loadingMessages ? 'not-allowed' : 'pointer',
            opacity: loadingMessages ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
        >
          {loadingMessages ? (
            <>
              <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
              Loading...
            </>
          ) : (
            <>
              <FaSync />
              Refresh
            </>
          )}
        </button>
      </div>

      {loadingMessages ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--space-8)',
          color: 'var(--gray-600)'
        }}>
          <FaSpinner style={{ 
            fontSize: 'var(--text-2xl)', 
            animation: 'spin 1s linear infinite',
            marginRight: 'var(--space-3)'
          }} />
          Loading messages...
        </div>
      ) : userMessages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-8)',
          color: 'var(--gray-600)'
        }}>
          <FaEnvelope style={{
            fontSize: 'var(--text-4xl)',
            marginBottom: 'var(--space-4)',
            opacity: 0.5
          }} />
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '600',
            margin: 0,
            marginBottom: 'var(--space-2)'
          }}>
            No messages yet
          </h3>
          <p style={{
            fontSize: 'var(--text-base)',
            margin: 0,
            color: 'var(--gray-500)'
          }}>
            When you contact us through the contact page, your messages and our responses will appear here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)'
        }}>
          {userMessages.map((message) => (
            <div
              key={message.id}
              style={{
                background: 'white',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--gray-200)',
                padding: 'var(--space-5)',
                transition: 'all var(--transition-base)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--space-3)'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    margin: 0,
                    marginBottom: 'var(--space-1)'
                  }}>
                    {message.subject}
                  </h3>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--gray-600)',
                    margin: 0
                  }}>
                    Sent: {formatDate(message.created_at)}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  {getStatusIcon(message.status)}
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: getStatusColor(message.status),
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {message.status}
                  </span>
                </div>
              </div>

              <div style={{
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-3)'
              }}>
                <p style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--gray-800)',
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.message}
                </p>
              </div>

              {message.admin_response && (
                <div style={{
                  background: 'rgba(0, 191, 174, 0.05)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  border: '1px solid rgba(0, 191, 174, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <FaCheck style={{ color: 'var(--primary-teal)' }} />
                    <span style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      color: 'var(--primary-teal)'
                    }}>
                      Admin Response
                    </span>
                    {message.responded_at && (
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        marginLeft: 'auto'
                      }}>
                        {formatDate(message.responded_at)}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--gray-800)',
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.admin_response}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileModern;