import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaPaperPlane, FaCheckCircle, FaExclamationTriangle, FaLock, FaSignInAlt } from 'react-icons/fa';
import { apiCall } from '../config/api';

const ContactPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    subject: '',
    message: '',
    service: '',
    urgency: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  // Removed activeOffice state as locations section is removed

  // Update form data when user authentication changes
  useEffect(() => {
    if (user && user.id) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Set dynamic page title
  useEffect(() => {
    document.title = `${t('contact.getInTouch')} - DoggoDaily`;
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'DoggoDaily - Dog & Italy Adventures';
    };
  }, [t]);

  // Offices data removed as location selection is no longer needed

  const contactMethods = [
    {
      icon: FaEnvelope,
      title: 'Business Email',
      description: 'Send us your partnership proposals and business inquiries',
      action: "partnerships@DoggoDaily.com",
      color: "#0097a7"
    },
  ];

  const serviceTypes = [
    'Brand Partnership',
    'Sponsored Content',
    'Product Collaboration',
    'Event Partnership',
    'Advertising Inquiry',
    'Media Kit Request',
    'Business Development',
    'General Business Inquiry'
  ];



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user || !user.id) {
      setSubmitStatus('auth_required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit message to backend
      const response = await apiCall('/api/contact/submit', 'POST', formData);
      
      if (response.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          service: '',
          urgency: 'normal'
        });
        console.log('✅ Message submitted successfully:', response.message);
      } else {
        setSubmitStatus('error');
        console.error('❌ Failed to submit message:', response.message);
      }
    } catch (error) {
      console.error('❌ Error submitting message:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'var(--gradient-secondary)'
    }}>
      <style>{`
        .contact-card {
          transform: translateY(20px);
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .contact-card:nth-child(1) { animation-delay: 0.1s; }
        .contact-card:nth-child(2) { animation-delay: 0.2s; }
        .contact-card:nth-child(3) { animation-delay: 0.3s; }
        .contact-card:nth-child(4) { animation-delay: 0.4s; }
        
        .office-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .office-card.active {
          transform: scale(1.02);
          box-shadow: var(--shadow-glow);
        }
        
        
      `}</style>

      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'var(--gradient-hero)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="animate-fade-in-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem'
          }}>
            {t('contact.getInTouch')}
          </h1>
          
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: 'var(--gray-600)',
            fontWeight: 500,
            lineHeight: 1.6,
            marginBottom: '3rem'
          }}>
            {t('contact.description')}
          </p>

        </div>
      </section>

      {/* Contact Methods */}
      <section style={{
        padding: '4rem 2rem',
        background: 'var(--gradient-card)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1rem'
            }}>
              {t('contact.howCanWeHelp')}
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {contactMethods.map((method, index) => (
              <div key={index} className="contact-card hover-lift" style={{
                background: 'var(--gradient-card)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                textAlign: 'center',
                cursor: method.onClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden'
              }} onClick={method.onClick}>
                {method.urgent && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#ff6b6b',
                    color: 'white',
                    padding: '0.3rem 0.7rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
{t('contact.urgent')}
                  </div>
                )}

                <div style={{
                  width: '80px',
                  height: '80px',
                  background: `linear-gradient(135deg, ${method.color}20, ${method.color}10)`,
                  borderRadius: 'var(--radius-2xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem auto',
                  border: `2px solid ${method.color}30`
                }}>
                  <method.icon style={{
                    fontSize: '2rem',
                    color: method.color
                  }} />
                </div>

                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--gray-900)',
                  marginBottom: '0.5rem'
                }}>
                  {method.title}
                </h3>

                <p style={{
                  color: 'var(--gray-600)',
                  lineHeight: 1.6,
                  marginBottom: '1.5rem'
                }}>
                  {method.description}
                </p>

                <div style={{
                  background: `${method.color}15`,
                  color: method.color,
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  border: `1px solid ${method.color}30`
                }}>
                  {method.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section style={{
        padding: '6rem 2rem',
        background: 'var(--gradient-secondary)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="animate-fade-in-up">
            <div className="card" style={{
                padding: '3rem',
                height: 'fit-content'
              }}>
                <h3 style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: 'var(--gray-900)',
                  marginBottom: '1rem'
                }}>
                  {t('contact.sendMessage')}
                </h3>
                
                {/* Authentication Status */}
                {user && user.id ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#10b981'
                  }}>
                    <FaCheckCircle />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      Logged in as: {user.name || user.email}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#f59e0b'
                  }}>
                    <FaLock />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      You must be logged in to send messages
                    </span>
                    <button
                      onClick={() => navigate('/login')}
                      style={{
                        background: 'var(--primary-teal)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginLeft: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <FaSignInAlt />
                      Login
                    </button>
                  </div>
                )}
                
                <p style={{
                  color: 'var(--gray-600)',
                  marginBottom: '2rem',
                  lineHeight: 1.6
                }}>
                  {t('contact.formDescription')}
                </p>

                <form onSubmit={handleSubmit} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div className="form-group">
                      <label className="form-label">{t('contact.fullName')}</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder={t('contact.yourName')}
                        required
                        disabled={user && user.id}
                        style={{
                          backgroundColor: user && user.id ? 'var(--gray-100)' : 'white',
                          cursor: user && user.id ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('contact.emailAddress')}</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder={t('contact.yourEmail')}
                        required
                        disabled={user && user.id}
                        style={{
                          backgroundColor: user && user.id ? 'var(--gray-100)' : 'white',
                          cursor: user && user.id ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div className="form-group">
                      <label className="form-label">{t('contact.phoneNumber')}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder={t('contact.phone')}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('contact.serviceType')}</label>
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                      >
                        <option value="">{t('contact.selectService')}</option>
                        {serviceTypes.map(service => (
                          <option key={service} value={service}>{service}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('contact.subject')}</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('contact.subject')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('contact.priorityLevel')}</label>
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      {[
                        { value: 'low', label: t('contact.priority.low'), color: '#10b981' },
                        { value: 'normal', label: t('contact.priority.normal'), color: '#0097a7' },
                        { value: 'high', label: t('contact.priority.high'), color: '#f59e0b' },
                        { value: 'urgent', label: t('contact.priority.urgent'), color: '#ef4444' }
                      ].map(priority => (
                        <label key={priority.value} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="urgency"
                            value={priority.value}
                            checked={formData.urgency === priority.value}
                            onChange={handleInputChange}
                            style={{ accentColor: priority.color }}
                          />
                          <span style={{ color: priority.color, fontWeight: 600 }}>
                            {priority.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('contact.message')}</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={t('contact.message')}
                      rows="5"
                      required
                      style={{ resize: 'vertical', minHeight: '120px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !user || !user.id}
                    className="btn btn-primary"
                    style={{
                      padding: '1rem 2rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: (isSubmitting || !user || !user.id) ? 0.7 : 1,
                      cursor: (isSubmitting || !user || !user.id) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        {t('contact.sending')}
                      </>
                    ) : !user || !user.id ? (
                      <>
                        <FaLock />
                        Login Required
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        {t('contact.sendMessage')}
                      </>
                    )}
                  </button>

                  {submitStatus === 'success' && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#10b981'
                    }}>
                      <FaCheckCircle />
                      {t('contact.messageSent')}
                    </div>
                  )}
                  
                  {submitStatus === 'error' && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#ef4444'
                    }}>
                      <FaExclamationTriangle />
                      Failed to send message. Please try again.
                    </div>
                  )}
                  
                  {submitStatus === 'auth_required' && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#f59e0b'
                    }}>
                      <FaLock />
                      You must be logged in to send messages. 
                      <button
                        onClick={() => navigate('/login')}
                        style={{
                          background: 'var(--primary-teal)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginLeft: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <FaSignInAlt />
                        Login
                      </button>
                    </div>
                  )}
            </form>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
};

export default ContactPage;