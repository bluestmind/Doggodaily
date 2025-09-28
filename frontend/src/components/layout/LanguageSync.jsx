import React, { useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * LanguageSync component - automatically syncs user language preferences
 * This component should be included in the main App to ensure language sync
 */
const LanguageSync = () => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const syncLanguageWithUser = async () => {
      // Only sync when user logs in and we have authentication
      if (isAuthenticated() && user) {
        try {
          // Get user's preferred language from backend
          const response = await fetch('/api/preferences', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.display && data.data.display.language && data.data.display.language !== currentLanguage) {
              // Update language if different from current
              await changeLanguage(data.data.display.language);
            }
          }
        } catch (error) {
          console.warn('Failed to sync language with backend:', error);
        }
      }
    };

    syncLanguageWithUser();
  }, [user, isAuthenticated, currentLanguage, changeLanguage]);

  // This component doesn't render anything, it just handles sync
  return null;
};

export default LanguageSync;