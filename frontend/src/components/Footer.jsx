import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './common/LanguageSwitcher';
import { FaInstagram, FaTwitter, FaFacebook, FaYoutube, FaPaw, FaHeart, FaEnvelope, FaCrown, FaArrowUp, FaPaperPlane, FaStar } from 'react-icons/fa';

const Footer = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSignup = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getFooterLinks = () => ({
    company: [
      { name: t('footer.aboutUs'), path: '/' },
      { name: t('footer.ourStory'), path: '/stories' },
      { name: t('nav.tours'), path: '/tours' },
      { name: t('footer.contactUs'), path: '/contact' },
      { name: t('footer.careers'), path: '/contact' }
    ]
  });

  const footerLinks = getFooterLinks();

  const socialLinks = [
    { icon: FaInstagram, url: 'https://instagram.com', color: '#e1306c', name: 'Instagram' },
    { icon: FaTwitter, url: 'https://x.com', color: '#000000', name: 'X' },
    { icon: FaFacebook, url: 'https://facebook.com', color: '#1877f2', name: 'Facebook' },
    { icon: FaYoutube, url: 'https://youtube.com', color: '#ff0000', name: 'YouTube' }
  ];

  const contactInfo = [
    { icon: FaEnvelope, text: 'hello@DoggoDaily.com', href: 'mailto:hello@DoggoDaily.com' }
  ];

  return (
    <footer style={{
      background: 'var(--gradient-card)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 191, 174, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradient Top Border */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'var(--gradient-primary)',
        opacity: 0.8
      }} />

      {/* Main Footer Content */}
      <div style={{
        padding: '4rem 2rem 2rem 2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '3rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Section */}
          <div style={{ maxWidth: '350px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaPaw style={{ fontSize: '1.5rem', color: 'white' }} />
              </div>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                DoggoDaily
              </h3>
            </div>
            
            <p style={{
              color: 'var(--gray-600)',
              lineHeight: 1.6,
              marginBottom: '2rem',
              fontSize: '1rem'
            }}>
              {t('footer.brandDescription')}
            </p>

            {/* Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contactInfo.map((contact, index) => (
                <a
                  key={index}
                  href={contact.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: 'var(--gray-600)',
                    textDecoration: 'none',
                    transition: 'var(--transition-base)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-lg)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--primary-teal)';
                    e.target.style.background = 'rgba(0, 191, 174, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--gray-600)';
                    e.target.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <contact.icon style={{ fontSize: '1rem', color: 'white' }} />
                  </div>
                  <span style={{ fontSize: '0.95rem' }}>{contact.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--gray-900)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaCrown style={{ color: 'var(--primary-teal)' }} />
              {t('footer.company')}
            </h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.path}
                    style={{
                      color: 'var(--gray-600)',
                      textDecoration: 'none',
                      transition: 'var(--transition-base)',
                      padding: '0.5rem 0',
                      display: 'block',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.95rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = 'var(--primary-teal)';
                      e.target.style.paddingLeft = '1rem';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = 'var(--gray-600)';
                      e.target.style.paddingLeft = '0';
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links & Awards */}
        <div style={{
          padding: '2rem 0',
          borderTop: '1px solid rgba(0, 191, 174, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Awards & Certifications */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '1rem'
          }}>
            {[
              `🏆 ${t('footer.bestOf2024')}`,
              `⭐ ${t('footer.fiveStar')}`,
              `🛡️ ${t('footer.certified')}`,
              `👑 ${t('footer.vipAward')}`
            ].map((award, index) => (
              <div key={index} style={{
                background: 'var(--gradient-card)',
                border: '1px solid rgba(0, 191, 174, 0.2)',
                borderRadius: 'var(--radius-xl)',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--gray-700)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'var(--shadow-md)'
              }}>
                {award}
              </div>
            ))}
          </div>

          {/* Social Media Links */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                style={{
                  width: '50px',
                  height: '50px',
                  background: 'var(--gradient-card)',
                  border: '1px solid rgba(0, 191, 174, 0.2)',
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gray-600)',
                  fontSize: '1.3rem',
                  transition: 'var(--transition-smooth)',
                  backdropFilter: 'blur(10px)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = social.color;
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-3px) scale(1.1)';
                  e.target.style.boxShadow = `0 8px 24px ${social.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--gradient-card)';
                  e.target.style.color = 'var(--gray-600)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <social.icon />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid rgba(0, 191, 174, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem'
            }}>
              <p style={{
                color: 'var(--gray-600)',
                fontSize: '0.9rem',
                margin: 0
              }}>
                {t('footer.copyright')}
              </p>
              
              {/* Developer Credit */}
              <p style={{
                color: 'var(--gray-500)',
                fontSize: '0.8rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>Developed with</span>
                <FaHeart style={{ 
                  color: 'var(--primary-teal)', 
                  fontSize: '0.7rem',
                  animation: 'pulse 2s infinite'
                }} />
                <span>by</span>
                <a
                  href="https://github.com/bluestmind" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--primary-teal)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    transition: 'var(--transition-base)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--primary-blue)';
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'var(--primary-teal)';
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  najji
                </a>
              </p>
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher variant="footer" />
          </div>

          {/* Back to Top Button */}
          <button
            onClick={scrollToTop}
            style={{
              background: 'var(--gradient-primary)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.1)';
              e.target.style.boxShadow = 'var(--shadow-glow)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = 'var(--shadow-lg)';
            }}
            aria-label="Back to top"
          >
            <FaArrowUp />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 