import React, { createContext, useContext, useState, useEffect } from 'react';

// Translation files
import enTranslations from '../locales/en.json';
import itTranslations from '../locales/it.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('it');
  const [translations, setTranslations] = useState(itTranslations);

  // Available languages
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  // Load language from backend or localStorage on mount
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        // First try to get from backend if user is logged in
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await fetch('/api/preferences', {
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.display && data.data.display.language) {
              changeLanguage(data.data.display.language);
              return;
            }
          }
        }
        
        // Fallback to localStorage
        const savedLanguage = localStorage.getItem('doggoDaily_language');
        if (savedLanguage && ['en', 'it'].includes(savedLanguage)) {
          changeLanguage(savedLanguage);
        } else {
          // Default to Italian if no saved language
          changeLanguage('it');
        }
      } catch (error) {
        console.warn('Failed to load user language preference:', error);
        // Fallback to localStorage
        const savedLanguage = localStorage.getItem('doggoDaily_language');
        if (savedLanguage && ['en', 'it'].includes(savedLanguage)) {
          changeLanguage(savedLanguage);
        } else {
          // Default to Italian if no saved language
          changeLanguage('it');
        }
      }
    };

    loadUserLanguage();
  }, []);

  // Change language function with backend sync
  const changeLanguage = async (languageCode) => {
    if (!['en', 'it'].includes(languageCode)) {
      console.warn(`Language ${languageCode} not supported, falling back to Italian`);
      languageCode = 'it';
    }

    setCurrentLanguage(languageCode);
    
    // Update translations
    switch (languageCode) {
      case 'en':
        setTranslations(enTranslations);
        break;
      case 'it':
      default:
        setTranslations(itTranslations);
        break;
    }

    // Save to localStorage
    localStorage.setItem('doggoDaily_language', languageCode);
    
    // Update document language attribute
    document.documentElement.lang = languageCode;

    // Sync with backend if user is logged in
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ 
            display: { 
              language: languageCode 
            } 
          })
        });
      }
    } catch (error) {
      console.warn('Failed to sync language preference to backend:', error);
    }
  };

  // Translation function with nested key support
  const t = (key, interpolations = {}) => {
    const keys = key.split('.');
    let translation = translations;

    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        console.warn(`Translation key "${key}" not found for language "${currentLanguage}"`);
        return key; // Return the key if translation not found
      }
    }

    // Handle interpolations (replace {variable} with values)
    if (typeof translation === 'string' && Object.keys(interpolations).length > 0) {
      return translation.replace(/\{(\w+)\}/g, (match, variable) => {
        return interpolations[variable] || match;
      });
    }

    return translation;
  };

  // Get current language info
  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[1]; // Default to Italian
  };

  // Check if language is RTL (for future Arabic/Hebrew support)
  const isRTL = () => {
    return ['ar', 'he', 'fa'].includes(currentLanguage);
  };

  // Format date according to locale
  const formatDate = (date, options = {}) => {
    const locale = currentLanguage === 'it' ? 'it-IT' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(new Date(date));
  };

  // Format number according to locale
  const formatNumber = (number, options = {}) => {
    const locale = currentLanguage === 'it' ? 'it-IT' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  };

  // Format currency according to locale
  const formatCurrency = (amount, currency = 'EUR') => {
    const locale = currentLanguage === 'it' ? 'it-IT' : 'en-US';
    const currencyCode = currentLanguage === 'it' ? 'EUR' : 'USD';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || currencyCode
    }).format(amount);
  };

  const value = {
    // Current state
    currentLanguage,
    translations,
    languages,
    
    // Functions
    changeLanguage,
    t,
    getCurrentLanguage,
    isRTL,
    
    // Formatting helpers
    formatDate,
    formatNumber,
    formatCurrency
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;