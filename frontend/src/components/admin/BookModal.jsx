import React from 'react';
import { FaTimes, FaImage, FaTag, FaLink, FaStar, FaDollarSign } from 'react-icons/fa';

const BookModal = ({ bookForm, setBookForm, onSubmit, onClose, onFileChange, editing, loading }) => {
  const handleInputChange = (field, value) => {
    setBookForm(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field, value) => {
    // Convert comma-separated string to array and back to JSON
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setBookForm(prev => ({ ...prev, [field]: JSON.stringify(array) }));
  };

  const handleExternalLinksChange = (value) => {
    try {
      // Validate JSON
      JSON.parse(value);
      setBookForm(prev => ({ ...prev, external_links: value }));
    } catch (e) {
      // If invalid JSON, store as is for now
      setBookForm(prev => ({ ...prev, external_links: value }));
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
            {editing ? 'Edit Book' : 'Add New Book'}
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
                <FaImage />
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
                  Title *
                </label>
                <input
                  type="text"
                  value={bookForm.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
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
                  Title (Italian)
                </label>
                <input
                  type="text"
                  value={bookForm.title_it}
                  onChange={(e) => handleInputChange('title_it', e.target.value)}
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
                  Subtitle
                </label>
                <input
                  type="text"
                  value={bookForm.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
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
                  Subtitle (Italian)
                </label>
                <input
                  type="text"
                  value={bookForm.subtitle_it}
                  onChange={(e) => handleInputChange('subtitle_it', e.target.value)}
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
                  Category
                </label>
                <input
                  type="text"
                  value={bookForm.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
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
                  Category (Italian)
                </label>
                <input
                  type="text"
                  value={bookForm.category_it}
                  onChange={(e) => handleInputChange('category_it', e.target.value)}
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
                  Order Index
                </label>
                <input
                  type="number"
                  value={bookForm.order_index}
                  onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
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

            {/* Pricing & Status */}
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
                <FaDollarSign />
                Pricing & Status
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Current Price
                </label>
                <input
                  type="text"
                  value={bookForm.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="e.g., 29.99"
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
                  Original Price (for discount display)
                </label>
                <input
                  type="text"
                  value={bookForm.original_price}
                  onChange={(e) => handleInputChange('original_price', e.target.value)}
                  placeholder="e.g., 39.99 (leave empty if no discount)"
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
                  Currency
                </label>
                <select
                  value={bookForm.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
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
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  Availability
                </label>
                <select
                  value={bookForm.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
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
                >
                  <option value="available">Available</option>
                  <option value="sold_out">Sold Out</option>
                  <option value="coming_soon">Coming Soon</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--gray-700)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={bookForm.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <FaStar />
                  Featured Book
                </label>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1rem'
            }}>
              Content
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Description
              </label>
              <textarea
                value={bookForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
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
                Description (Italian)
              </label>
              <textarea
                value={bookForm.description_it}
                onChange={(e) => handleInputChange('description_it', e.target.value)}
                rows={4}
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
                Preview Text
              </label>
              <textarea
                value={bookForm.preview}
                onChange={(e) => handleInputChange('preview', e.target.value)}
                rows={3}
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

          {/* Tags & Links */}
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
              <FaTag />
              Tags & Links
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={bookForm.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="photography, dogs, italy, travel"
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
                Amazon Link
              </label>
              <input
                type="url"
                value={bookForm.amazon_link}
                onChange={(e) => handleInputChange('amazon_link', e.target.value)}
                placeholder="https://amazon.com/your-book"
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
                Barnes & Noble Link
              </label>
              <input
                type="url"
                value={bookForm.barnes_noble_link}
                onChange={(e) => handleInputChange('barnes_noble_link', e.target.value)}
                placeholder="https://barnesandnoble.com/your-book"
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
                Additional External Links (JSON format)
              </label>
              <textarea
                value={bookForm.external_links}
                onChange={(e) => handleExternalLinksChange(e.target.value)}
                rows={3}
                placeholder='[{"platform": "Bookshop", "url": "https://bookshop.org/book"}, {"platform": "IndieBound", "url": "https://indiebound.org/book"}]'
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
              Book Cover Image
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
            
            {bookForm.image && (
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--primary-teal)',
                marginTop: '0.5rem',
                fontWeight: '500'
              }}>
                Selected: {bookForm.image.name}
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
              {loading ? 'Saving...' : (editing ? 'Update Book' : 'Create Book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;


