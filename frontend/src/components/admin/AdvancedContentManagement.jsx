import React, { useState, useEffect } from 'react';
import { 
  FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaEye, FaEyeSlash, 
  FaSearch, FaFilter, FaLanguage, FaRobot, FaCheckCircle, 
  FaExclamationTriangle, FaGlobe, FaCopy, FaSync, FaDownload, FaUpload
} from 'react-icons/fa';

const AdvancedContentManagement = ({ adminService }) => {
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState({});
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logging
  console.log('🌍 AdvancedContentManagement loaded!', { adminService });
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPage, setFilterPage] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBulkTranslateModal, setShowBulkTranslateModal] = useState(false);
  const [newLanguage, setNewLanguage] = useState({
    code: '',
    name: '',
    native_name: '',
    flag_emoji: '',
    is_default: false
  });
  const [bulkTranslateData, setBulkTranslateData] = useState({
    page_name: '',
    source_language: 'en',
    target_language: ''
  });

  useEffect(() => {
    loadData();
  }, [currentLanguage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [languagesResponse, translationsResponse] = await Promise.all([
        adminService.getLanguages(),
        adminService.getTranslations({ language_code: currentLanguage })
      ]);
      
      if (languagesResponse.success) {
        setLanguages(languagesResponse.languages);
        if (!currentLanguage && languagesResponse.languages.length > 0) {
          const defaultLang = languagesResponse.languages.find(lang => lang.is_default) || languagesResponse.languages[0];
          setCurrentLanguage(defaultLang.code);
        }
      }
      
      if (translationsResponse.success) {
        setTranslations(translationsResponse.translations);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pageName, sectionName, contentKey, translationData) => {
    setEditingTranslation(`${pageName}.${sectionName}.${contentKey}`);
    setEditForm({
      id: translationData.id,
      content_value: translationData.content_value,
      content_type: translationData.content_type,
      needs_review: translationData.needs_review
    });
  };

  const handleSave = async () => {
    try {
      const response = await adminService.updateTranslation(editForm.id, editForm);
      if (response.success) {
        await loadData();
        setEditingTranslation(null);
        setEditForm({});
      } else {
        alert('Failed to save translation: ' + response.message);
      }
    } catch (err) {
      alert('Failed to save translation');
      console.error('Save translation error:', err);
    }
  };

  const handleCancel = () => {
    setEditingTranslation(null);
    setEditForm({});
  };

  const handleDelete = async (translationId) => {
    if (window.confirm('Are you sure you want to delete this translation?')) {
      try {
        const response = await adminService.deleteTranslation(translationId);
        if (response.success) {
          await loadData();
        } else {
          alert('Failed to delete translation: ' + response.message);
        }
      } catch (err) {
        alert('Failed to delete translation');
        console.error('Delete translation error:', err);
      }
    }
  };

  const handleAutoTranslate = async (pageName, sectionName, contentKey, sourceText) => {
    try {
      const response = await adminService.autoTranslate({
        source_language: 'en',
        target_language: currentLanguage,
        page_name: pageName,
        section_name: sectionName,
        content_key: contentKey,
        source_text: sourceText
      });
      
      if (response.success) {
        await loadData();
        alert('Translation generated successfully!');
      } else {
        alert('Failed to generate translation: ' + response.message);
      }
    } catch (err) {
      alert('Failed to generate translation');
      console.error('Auto translate error:', err);
    }
  };

  const handleBulkTranslate = async () => {
    try {
      const response = await adminService.bulkTranslate(bulkTranslateData);
      if (response.success) {
        await loadData();
        setShowBulkTranslateModal(false);
        alert(`Bulk translation completed! ${response.translated_count} translations created.`);
      } else {
        alert('Failed to perform bulk translation: ' + response.message);
      }
    } catch (err) {
      alert('Failed to perform bulk translation');
      console.error('Bulk translate error:', err);
    }
  };

  const handleCreateLanguage = async () => {
    try {
      const response = await adminService.createLanguage(newLanguage);
      if (response.success) {
        await loadData();
        setShowLanguageModal(false);
        setNewLanguage({
          code: '',
          name: '',
          native_name: '',
          flag_emoji: '',
          is_default: false
        });
      } else {
        alert('Failed to create language: ' + response.message);
      }
    } catch (err) {
      alert('Failed to create language');
      console.error('Create language error:', err);
    }
  };

  const initializeDefaultTranslations = async () => {
    if (window.confirm('This will create default translations for all supported languages. Continue?')) {
      try {
        const response = await adminService.initializeDefaultTranslations();
        if (response.success) {
          alert(`Initialized ${response.created_count} default translations`);
          await loadData();
        } else {
          alert('Failed to initialize translations: ' + response.message);
        }
      } catch (err) {
        alert('Failed to initialize translations');
        console.error('Initialize translations error:', err);
      }
    }
  };

  const filteredTranslations = () => {
    let filtered = translations;
    
    if (filterPage) {
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([pageName]) => 
          pageName.toLowerCase().includes(filterPage.toLowerCase())
        )
      );
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const newFiltered = {};
      
      Object.entries(filtered).forEach(([pageName, sections]) => {
        const newSections = {};
        Object.entries(sections).forEach(([sectionName, items]) => {
          const newItems = {};
          Object.entries(items).forEach(([key, data]) => {
            if (
              key.toLowerCase().includes(searchLower) ||
              data.content_value.toLowerCase().includes(searchLower)
            ) {
              newItems[key] = data;
            }
          });
          if (Object.keys(newItems).length > 0) {
            newSections[sectionName] = newItems;
          }
        });
        if (Object.keys(newSections).length > 0) {
          newFiltered[pageName] = newSections;
        }
      });
      
      filtered = newFiltered;
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌍</div>
        <h3>Loading Multi-Language Content...</h3>
        <p>Please wait while we fetch translations and language data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--red-500)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <h3>Error Loading Content</h3>
        <p>{error}</p>
        <button
          onClick={loadData}
          style={{
            background: 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const filtered = filteredTranslations();
  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--gray-900)' }}>Multi-Language Content Management</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--gray-600)' }}>
            Manage content across multiple languages with automatic translation support
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={initializeDefaultTranslations}
            style={{
              background: 'var(--primary-teal)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaGlobe />
            Initialize Defaults
          </button>
          
          <button
            onClick={() => setShowBulkTranslateModal(true)}
            style={{
              background: 'var(--blue-500)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaRobot />
            Bulk Translate
          </button>
          
          <button
            onClick={() => setShowLanguageModal(true)}
            style={{
              background: 'var(--green-500)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaLanguage />
            Add Language
          </button>
        </div>
      </div>

      {/* Language Selector */}
      <div style={{
        background: 'var(--gray-50)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--gray-800)' }}>Select Language</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setCurrentLanguage(lang.code)}
              style={{
                background: currentLanguage === lang.code ? 'var(--primary-teal)' : 'white',
                color: currentLanguage === lang.code ? 'white' : 'var(--gray-800)',
                border: `2px solid ${currentLanguage === lang.code ? 'var(--primary-teal)' : 'var(--gray-200)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'var(--transition-base)'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{lang.flag_emoji}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600' }}>{lang.native_name}</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{lang.name}</div>
              </div>
              {lang.is_default && (
                <FaCheckCircle style={{ marginLeft: 'auto', color: 'var(--green-500)' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '1.5rem',
        background: 'var(--gray-50)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Search Content
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search translations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 2.5rem 0.75rem 1rem',
                border: '1px solid var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '1rem'
              }}
            />
            <FaSearch style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)'
            }} />
          </div>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Filter by Page
          </label>
          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem'
            }}
          >
            <option value="">All Pages</option>
            {Object.keys(translations).map(pageName => (
              <option key={pageName} value={pageName}>{pageName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content List */}
      {Object.keys(filtered).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--gray-600)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌍</div>
          <h3>No Translations Found</h3>
          <p>No translations match your search criteria for {currentLang?.native_name || currentLanguage}.</p>
          <button
            onClick={initializeDefaultTranslations}
            style={{
              background: 'var(--primary-teal)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Initialize Default Translations
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {Object.entries(filtered).map(([pageName, sections]) => (
            <div key={pageName} style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                padding: '1rem 1.5rem',
                fontWeight: '700',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{pageName.replace('_', ' ').toUpperCase()}</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                  {currentLang?.flag_emoji} {currentLang?.native_name}
                </span>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                {Object.entries(sections).map(([sectionName, items]) => (
                  <div key={sectionName} style={{ marginBottom: '2rem' }}>
                    <h4 style={{
                      color: 'var(--gray-800)',
                      marginBottom: '1rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid var(--gray-200)'
                    }}>
                      {sectionName.replace('_', ' ').toUpperCase()}
                    </h4>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {Object.entries(items).map(([contentKey, translationData]) => (
                        <div key={contentKey} style={{
                          background: 'var(--gray-50)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1rem',
                          border: '1px solid var(--gray-200)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: '600',
                                color: 'var(--gray-800)',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                {contentKey.replace('_', ' ').toUpperCase()}
                                {translationData.needs_review && (
                                  <FaExclamationTriangle style={{ color: 'var(--orange-500)' }} title="Needs Review" />
                                )}
                                {translationData.is_auto_translated && (
                                  <FaRobot style={{ color: 'var(--blue-500)' }} title="Auto-translated" />
                                )}
                              </div>
                              
                              {editingTranslation === `${pageName}.${sectionName}.${contentKey}` ? (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                  <textarea
                                    value={editForm.content_value}
                                    onChange={(e) => setEditForm({
                                      ...editForm,
                                      content_value: e.target.value
                                    })}
                                    rows={4}
                                    style={{
                                      width: '100%',
                                      padding: '0.75rem',
                                      border: '1px solid var(--gray-300)',
                                      borderRadius: 'var(--radius-lg)',
                                      fontSize: '1rem',
                                      resize: 'vertical'
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={handleSave}
                                      style={{
                                        background: 'var(--green-500)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '0.5rem 1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <FaSave />
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancel}
                                      style={{
                                        background: 'var(--gray-500)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '0.5rem 1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <FaTimes />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  color: 'var(--gray-700)',
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  marginBottom: '0.5rem'
                                }}>
                                  {translationData.content_value || '(Empty)'}
                                </div>
                              )}
                              
                              {translationData.is_auto_translated && (
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--gray-500)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <FaRobot />
                                  Auto-translated (Confidence: {Math.round(translationData.translation_confidence * 100)}%)
                                </div>
                              )}
                            </div>
                            
                            {editingTranslation !== `${pageName}.${sectionName}.${contentKey}` && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleEdit(pageName, sectionName, contentKey, translationData)}
                                  style={{
                                    background: 'var(--primary-teal)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px'
                                  }}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleAutoTranslate(pageName, sectionName, contentKey, translationData.content_value)}
                                  style={{
                                    background: 'var(--blue-500)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px'
                                  }}
                                >
                                  <FaRobot />
                                </button>
                                <button
                                  onClick={() => handleDelete(translationData.id)}
                                  style={{
                                    background: 'var(--red-500)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '0.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px'
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Language Modal */}
      {showLanguageModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{ margin: 0 }}>Add New Language</h3>
              <button
                onClick={() => setShowLanguageModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--gray-500)'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Language Code (ISO 639-1)
                </label>
                <input
                  type="text"
                  value={newLanguage.code}
                  onChange={(e) => setNewLanguage({ ...newLanguage, code: e.target.value })}
                  placeholder="e.g., fr, de, ja"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Language Name (English)
                </label>
                <input
                  type="text"
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                  placeholder="e.g., French, German, Japanese"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Native Name
                </label>
                <input
                  type="text"
                  value={newLanguage.native_name}
                  onChange={(e) => setNewLanguage({ ...newLanguage, native_name: e.target.value })}
                  placeholder="e.g., Français, Deutsch, 日本語"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Flag Emoji
                </label>
                <input
                  type="text"
                  value={newLanguage.flag_emoji}
                  onChange={(e) => setNewLanguage({ ...newLanguage, flag_emoji: e.target.value })}
                  placeholder="e.g., 🇫🇷, 🇩🇪, 🇯🇵"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={newLanguage.is_default}
                  onChange={(e) => setNewLanguage({ ...newLanguage, is_default: e.target.checked })}
                />
                <label style={{ fontWeight: '600' }}>Set as default language</label>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowLanguageModal(false)}
                style={{
                  background: 'var(--gray-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLanguage}
                style={{
                  background: 'var(--green-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaLanguage />
                Add Language
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Translate Modal */}
      {showBulkTranslateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{ margin: 0 }}>Bulk Translate</h3>
              <button
                onClick={() => setShowBulkTranslateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--gray-500)'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Page Name
                </label>
                <select
                  value={bulkTranslateData.page_name}
                  onChange={(e) => setBulkTranslateData({ ...bulkTranslateData, page_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select Page</option>
                  {Object.keys(translations).map(pageName => (
                    <option key={pageName} value={pageName}>{pageName}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Source Language
                </label>
                <select
                  value={bulkTranslateData.source_language}
                  onChange={(e) => setBulkTranslateData({ ...bulkTranslateData, source_language: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.native_name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Target Language
                </label>
                <select
                  value={bulkTranslateData.target_language}
                  onChange={(e) => setBulkTranslateData({ ...bulkTranslateData, target_language: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select Target Language</option>
                  {languages.filter(lang => lang.code !== bulkTranslateData.source_language).map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.native_name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowBulkTranslateModal(false)}
                style={{
                  background: 'var(--gray-500)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkTranslate}
                disabled={!bulkTranslateData.page_name || !bulkTranslateData.target_language}
                style={{
                  background: bulkTranslateData.page_name && bulkTranslateData.target_language ? 'var(--blue-500)' : 'var(--gray-400)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.75rem 1.5rem',
                  cursor: bulkTranslateData.page_name && bulkTranslateData.target_language ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaRobot />
                Bulk Translate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedContentManagement;
