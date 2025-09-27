import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';

const LanguageSwitcher = ({ variant = 'default', className = '' }) => {
  const { currentLanguage, languages, changeLanguage, getCurrentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = getCurrentLanguage();

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // Different variants for different parts of the app
  const getVariantStyles = () => {
    switch (variant) {
      case 'header':
        return {
          container: {
            position: 'relative',
            display: 'inline-block'
          },
          trigger: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--gray-700)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'all var(--transition-base)',
            ':hover': {
              background: 'var(--gray-50)',
              borderColor: 'var(--primary-teal)'
            }
          },
          dropdown: {
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '0.5rem',
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            minWidth: '150px',
            overflow: 'hidden'
          }
        };

      case 'footer':
        return {
          container: {
            position: 'relative',
            display: 'inline-block'
          },
          trigger: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--gray-300)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all var(--transition-base)'
          },
          dropdown: {
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '0.5rem',
            background: 'var(--gray-800)',
            border: '1px solid var(--gray-600)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            minWidth: '150px',
            overflow: 'hidden'
          }
        };

      case 'admin':
        return {
          container: {
            position: 'relative',
            display: 'inline-block'
          },
          trigger: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--gray-700)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            transition: 'all var(--transition-base)',
            boxShadow: 'var(--shadow-sm)'
          },
          dropdown: {
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '0.5rem',
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1000,
            minWidth: '180px',
            overflow: 'hidden'
          }
        };

      default:
        return {
          container: {
            position: 'relative',
            display: 'inline-block'
          },
          trigger: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'white',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--gray-700)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all var(--transition-base)'
          },
          dropdown: {
            position: 'absolute',
            top: '100%',
            left: '0',
            marginTop: '0.5rem',
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            minWidth: '150px',
            overflow: 'hidden'
          }
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      ref={dropdownRef}
      className={className}
      style={styles.container}
    >
      {/* Language Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.trigger,
          ...(isOpen && variant !== 'footer' ? {
            background: 'var(--gray-50)',
            borderColor: 'var(--primary-teal)'
          } : {}),
          ...(variant === 'footer' && isOpen ? {
            color: 'white'
          } : {})
        }}
        onMouseEnter={(e) => {
          if (variant === 'header') {
            e.target.style.background = 'var(--gray-50)';
            e.target.style.borderColor = 'var(--primary-teal)';
          } else if (variant === 'footer') {
            e.target.style.color = 'white';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            if (variant === 'header') {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'var(--gray-300)';
            } else if (variant === 'footer') {
              e.target.style.color = 'var(--gray-300)';
            }
          }
        }}
      >
        <FaGlobe />
        <span>{currentLang.flag} {currentLang.name}</span>
        <FaChevronDown 
          style={{
            fontSize: '0.7rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-base)'
          }}
        />
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <div style={styles.dropdown}>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: currentLanguage === language.code 
                  ? (variant === 'footer' ? 'var(--gray-700)' : 'var(--gray-50)') 
                  : 'transparent',
                border: 'none',
                color: variant === 'footer' 
                  ? (currentLanguage === language.code ? 'white' : 'var(--gray-300)')
                  : (currentLanguage === language.code ? 'var(--primary-teal)' : 'var(--gray-700)'),
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: currentLanguage === language.code ? '600' : '400',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                if (currentLanguage !== language.code) {
                  e.target.style.background = variant === 'footer' 
                    ? 'var(--gray-700)' 
                    : 'var(--gray-50)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentLanguage !== language.code) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{language.flag}</span>
              <span>{language.name}</span>
              {currentLanguage === language.code && (
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '0.8rem',
                  color: 'var(--primary-teal)'
                }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;