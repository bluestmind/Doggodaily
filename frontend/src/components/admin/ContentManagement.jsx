import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaEye, FaEyeSlash, FaSort, FaSearch, FaFilter } from 'react-icons/fa';

const ContentManagement = ({ adminService }) => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPage, setFilterPage] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newContent, setNewContent] = useState({
    page_name: '',
    section_name: '',
    content_key: '',
    content_value: '',
    content_type: 'text'
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPageContent();
      if (response.success) {
        setContent(response.content);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load content');
      console.error('Load content error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pageName, sectionName, contentKey, contentData) => {
    setEditingContent(`${pageName}.${sectionName}.${contentKey}`);
    setEditForm({
      id: contentData.id,
      content_value: contentData.value,
      content_type: contentData.type
    });
  };

  const handleSave = async () => {
    try {
      const response = await adminService.updatePageContent(editForm.id, editForm);
      if (response.success) {
        await loadContent();
        setEditingContent(null);
        setEditForm({});
      } else {
        alert('Failed to save content: ' + response.message);
      }
    } catch (err) {
      alert('Failed to save content');
      console.error('Save content error:', err);
    }
  };

  const handleCancel = () => {
    setEditingContent(null);
    setEditForm({});
  };

  const handleDelete = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        const response = await adminService.deletePageContent(contentId);
        if (response.success) {
          await loadContent();
        } else {
          alert('Failed to delete content: ' + response.message);
        }
      } catch (err) {
        alert('Failed to delete content');
        console.error('Delete content error:', err);
      }
    }
  };

  const handleCreate = async () => {
    try {
      const response = await adminService.createPageContent(newContent);
      if (response.success) {
        await loadContent();
        setShowModal(false);
        setNewContent({
          page_name: '',
          section_name: '',
          content_key: '',
          content_value: '',
          content_type: 'text'
        });
      } else {
        alert('Failed to create content: ' + response.message);
      }
    } catch (err) {
      alert('Failed to create content');
      console.error('Create content error:', err);
    }
  };

  const initializeDefaultContent = async () => {
    if (window.confirm('This will create default content for the book page. Continue?')) {
      try {
        const response = await adminService.initializePageContent();
        if (response.success) {
          alert(`Initialized ${response.created_count} default content items`);
          await loadContent();
        } else {
          alert('Failed to initialize content: ' + response.message);
        }
      } catch (err) {
        alert('Failed to initialize content');
        console.error('Initialize content error:', err);
      }
    }
  };

  const filteredContent = () => {
    let filtered = content;
    
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
              data.value.toLowerCase().includes(searchLower)
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
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
        <h3>Loading Content...</h3>
        <p>Please wait while we fetch the page content.</p>
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
          onClick={loadContent}
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

  const filtered = filteredContent();

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--gray-900)' }}>Content Management</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--gray-600)' }}>
            Manage all page content and text that appears on your website
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={initializeDefaultContent}
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
            <FaPlus />
            Initialize Default Content
          </button>
          
          <button
            onClick={() => setShowModal(true)}
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
            <FaPlus />
            Add New Content
          </button>
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
              placeholder="Search content..."
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
            {Object.keys(content).map(pageName => (
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3>No Content Found</h3>
          <p>No content matches your search criteria.</p>
          <button
            onClick={initializeDefaultContent}
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
            Initialize Default Content
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
                fontSize: '1.1rem'
              }}>
                {pageName.replace('_', ' ').toUpperCase()}
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
                      {Object.entries(items).map(([contentKey, contentData]) => (
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
                                marginBottom: '0.5rem'
                              }}>
                                {contentKey.replace('_', ' ').toUpperCase()}
                              </div>
                              
                              {editingContent === `${pageName}.${sectionName}.${contentKey}` ? (
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
                                  wordBreak: 'break-word'
                                }}>
                                  {contentData.value || '(Empty)'}
                                </div>
                              )}
                            </div>
                            
                            {editingContent !== `${pageName}.${sectionName}.${contentKey}` && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleEdit(pageName, sectionName, contentKey, contentData)}
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
                                  onClick={() => handleDelete(contentData.id)}
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

      {/* Create New Content Modal */}
      {showModal && (
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
              <h3 style={{ margin: 0 }}>Add New Content</h3>
              <button
                onClick={() => setShowModal(false)}
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
                <input
                  type="text"
                  value={newContent.page_name}
                  onChange={(e) => setNewContent({ ...newContent, page_name: e.target.value })}
                  placeholder="e.g., book_page"
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
                  Section Name
                </label>
                <input
                  type="text"
                  value={newContent.section_name}
                  onChange={(e) => setNewContent({ ...newContent, section_name: e.target.value })}
                  placeholder="e.g., hero, author"
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
                  Content Key
                </label>
                <input
                  type="text"
                  value={newContent.content_key}
                  onChange={(e) => setNewContent({ ...newContent, content_key: e.target.value })}
                  placeholder="e.g., title, description"
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
                  Content Value
                </label>
                <textarea
                  value={newContent.content_value}
                  onChange={(e) => setNewContent({ ...newContent, content_value: e.target.value })}
                  rows={4}
                  placeholder="Enter the content text..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Content Type
                </label>
                <select
                  value={newContent.content_type}
                  onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem'
                  }}
                >
                  <option value="text">Text</option>
                  <option value="html">HTML</option>
                  <option value="json">JSON</option>
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
                onClick={() => setShowModal(false)}
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
                onClick={handleCreate}
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
                <FaPlus />
                Create Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;


