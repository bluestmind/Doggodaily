import React from 'react';
import { FaTimes, FaImage, FaUser, FaEnvelope, FaLink, FaQuoteLeft } from 'react-icons/fa';

const AuthorModal = ({ authorForm, setAuthorForm, onSubmit, onClose, onFileChange, editing, loading }) => {
  const handleInputChange = (field, value) => {
    setAuthorForm(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field, value) => {
    // Convert comma-separated string to array and back to JSON
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setAuthorForm(prev => ({ ...prev, [field]: JSON.stringify(array) }));
  };

  const handleJsonFieldChange = (field, value) => {
    try {
      // Validate JSON
      JSON.parse(value);
      setAuthorForm(prev => ({ ...prev, [field]: value }));
    } catch (e) {
      // If invalid JSON, store as is for now
      setAuthorForm(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(20px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-2xl)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 1rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0
          }}>
            {editing ? 'Edit Author' : 'Add New Author'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--gray-500)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--gray-100)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ padding: '2rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Basic Information */}
            <div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaUser />
                Basic Information
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={authorForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Title/Profession
                </label>
                <input
                  type="text"
                  value={authorForm.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Artist • Stories of Italy's Dogs"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={authorForm.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="author@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Contact Link
                </label>
                <input
                  type="url"
                  value={authorForm.contact_link}
                  onChange={(e) => handleInputChange('contact_link', e.target.value)}
                  placeholder="https://linktr.ee/author"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>
            </div>

            {/* Bio & Quote */}
            <div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaQuoteLeft />
                Bio & Quote
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Biography
                </label>
                <textarea
                  value={authorForm.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  placeholder="Tell the story of the author..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Inspirational Quote
                </label>
                <textarea
                  value={authorForm.quote}
                  onChange={(e) => handleInputChange('quote', e.target.value)}
                  rows={3}
                  placeholder="A memorable quote from the author..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>
            </div>
          </div>

          {/* Credentials & Achievements */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1rem'
            }}>
              Credentials & Achievements
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Credentials (JSON format)
              </label>
              <textarea
                value={authorForm.credentials}
                onChange={(e) => handleJsonFieldChange('credentials', e.target.value)}
                rows={3}
                placeholder='["Verified Instagram creator (@username)", "Based in Italy • street photography", "Community storytelling expert"]'
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Achievements (JSON format)
              </label>
              <textarea
                value={authorForm.achievements}
                onChange={(e) => handleJsonFieldChange('achievements', e.target.value)}
                rows={3}
                placeholder='["≈797 posts", "≈1.6M followers", "151 following"]'
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
          </div>

          {/* Social Links */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaLink />
              Social Links
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Social Links (JSON format)
              </label>
              <textarea
                value={authorForm.social_links}
                onChange={(e) => handleJsonFieldChange('social_links', e.target.value)}
                rows={4}
                placeholder='[{"platform": "Instagram", "url": "https://instagram.com/username"}, {"platform": "Twitter", "url": "https://twitter.com/username"}]'
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
          </div>

          {/* Book Page Customization */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaQuoteLeft />
              Book Page Customization
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Hero Section Title
              </label>
              <input
                type="text"
                value={authorForm.hero_title}
                onChange={(e) => handleInputChange('hero_title', e.target.value)}
                placeholder="Custom title for the hero section"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Hero Section Subtitle
              </label>
              <input
                type="text"
                value={authorForm.hero_subtitle}
                onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                placeholder="Custom subtitle for the hero section"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Books Section Title
              </label>
              <input
                type="text"
                value={authorForm.book_section_title}
                onChange={(e) => handleInputChange('book_section_title', e.target.value)}
                placeholder="Custom title for the books section"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Books Section Subtitle
              </label>
              <input
                type="text"
                value={authorForm.book_section_subtitle}
                onChange={(e) => handleInputChange('book_section_subtitle', e.target.value)}
                placeholder="Custom subtitle for the books section"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaImage />
              Author Photo
            </h3>
            
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px dashed var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                cursor: 'pointer'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
            />
            
            {authorForm.image && (
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--primary-teal)',
                marginTop: '0.5rem',
                fontWeight: '500'
              }}>
                Selected: {authorForm.image.name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid var(--gray-200)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--gray-200)',
                color: 'var(--gray-700)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--gray-300)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--gray-200)'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--gray-400)' : 'var(--primary-teal)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? 'Saving...' : (editing ? 'Update Author' : 'Create Author')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthorModal;




