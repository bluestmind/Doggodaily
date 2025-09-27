import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaSort, FaUpload, FaDownload,
  FaImage, FaVideo, FaCalendarAlt, FaUser, FaTags, FaTimes, FaSync, FaStar
} from 'react-icons/fa';
import { useNotification } from '../common/Notification';
import LoadingSpinner from '../common/LoadingSpinner';

const GalleryManagement = ({ adminService }) => {
  const { showSuccess, showError } = useNotification();
  
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadGalleryItems();
  }, [currentPage, searchTerm, filterType, sortBy, sortOrder]);

  const loadGalleryItems = async () => {
    try {
      setRefreshing(true);
      const params = {
        page: currentPage,
        per_page: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await adminService.getGalleryItems(params);
      if (response.success) {
        setGalleryItems(response.data || []);
        setTotalPages(response.meta?.pages || 1);
      } else {
        showError(response.message || 'Failed to load gallery items');
        setGalleryItems([]);
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
      showError('Failed to load gallery items');
      setGalleryItems([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleViewItem = async (item) => {
    try {
      const response = await adminService.getGalleryItem(item.id);
      if (response.success) {
        setEditingItem(response.data);
        setModalType('view');
        setShowModal(true);
      } else {
        showError(response.message || 'Failed to fetch item details');
      }
    } catch (error) {
      showError('Failed to fetch item details');
    }
  };

  const handleEditItem = async (item) => {
    try {
      const response = await adminService.getGalleryItem(item.id);
      if (response.success) {
        setEditingItem(response.data);
        setModalType('edit');
        setShowModal(true);
      } else {
        showError(response.message || 'Failed to fetch item details');
      }
    } catch (error) {
      showError('Failed to fetch item details');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setRefreshing(true);
      const response = await adminService.deleteGalleryItem(item.id);
      if (response.success) {
        showSuccess('Gallery item deleted successfully');
        await loadGalleryItems();
      } else {
        showError(response.message || 'Failed to delete gallery item');
      }
    } catch (error) {
      showError('Failed to delete gallery item');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUploadMedia = () => {
    setEditingItem(null);
    setModalType('upload');
    setShowModal(true);
  };

  const handleSaveItem = async (itemData) => {
    try {
      setRefreshing(true);
      let response;
      
      if (modalType === 'upload') {
        // Handle file upload
        if (itemData.file) {
          const metadata = {
            title: itemData.title,
            description: itemData.description,
            category: itemData.category,
            tags: itemData.tags,
            photographer: itemData.photographer,
            location: itemData.location,
            is_featured: itemData.is_featured
          };
          response = await adminService.uploadMedia(itemData.file, metadata);
        } else {
          showError('Please select a file to upload');
          return;
        }
      } else if (editingItem && editingItem.id) {
        // Update existing item
        const updateData = {
          title: itemData.title,
          description: itemData.description,
          category: itemData.category,
          tags: itemData.tags,
          photographer: itemData.photographer,
          location: itemData.location,
          is_featured: itemData.is_featured
        };
        response = await adminService.updateGalleryItem(editingItem.id, updateData);
      }

      if (response.success) {
        showSuccess(modalType === 'upload' ? 'Media uploaded successfully' : 'Gallery item updated successfully');
        setShowModal(false);
        setEditingItem(null);
        await loadGalleryItems();
      } else {
        showError(response.message || 'Failed to save gallery item');
      }
    } catch (error) {
      showError('Failed to save gallery item');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.size === 0) {
      showError('Please select items first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedItems.size} selected items?`)) {
      return;
    }

    try {
      setRefreshing(true);
      const response = await adminService.bulkGalleryAction(action, Array.from(selectedItems));
      if (response.success) {
        showSuccess(`Bulk ${action} completed successfully`);
        setSelectedItems(new Set());
        await loadGalleryItems();
      } else {
        showError(response.message || `Failed to perform bulk ${action}`);
      }
    } catch (error) {
      showError(`Failed to perform bulk ${action}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === galleryItems.length && galleryItems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(galleryItems.map(item => item.id)));
    }
  };

  const handleItemSelect = (itemId, checked) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const MediaModal = () => {
    const [formData, setFormData] = useState({
      title: editingItem?.title || '',
      description: editingItem?.description || '',
      category: editingItem?.category || 'general',
      tags: editingItem?.tags || '',
      photographer: editingItem?.photographer || '',
      location: editingItem?.location || '',
      is_featured: editingItem?.is_featured || false,
      file: null
    });

    const [errors, setErrors] = useState({});
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
      if (editingItem) {
        setFormData({
          title: editingItem.title || '',
          description: editingItem.description || '',
          category: editingItem.category || 'general',
          tags: Array.isArray(editingItem.tags) ? editingItem.tags.join(', ') : editingItem.tags || '',
          photographer: editingItem.photographer || '',
          location: editingItem.location || '',
          is_featured: editingItem.is_featured || false,
          file: null
        });
      }
    }, [editingItem]);

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }

      if (modalType === 'upload' && !formData.file) {
        newErrors.file = 'Please select a file to upload';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        const submitData = {
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        };
        handleSaveItem(submitData);
      }
    };

    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };

    const handleFileSelect = (file) => {
      if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
          showError('Only image (JPEG, PNG, GIF) and video (MP4, WebM) files are allowed');
          return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          showError('File size must be less than 50MB');
          return;
        }

        handleInputChange('file', file);
        if (!formData.title) {
          handleInputChange('title', file.name.split('.')[0]);
        }
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      setDragOver(true);
    };

    const handleDragLeave = () => {
      setDragOver(false);
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: 0,
              color: '#2d3748'
            }}>
              {modalType === 'view' ? 'View Media' : 
               modalType === 'edit' ? 'Edit Media' : 'Upload Media'}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#718096'
              }}
            >
              <FaTimes />
            </button>
          </div>

          {modalType === 'view' ? (
            // View mode - read only
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editingItem?.file_url && (
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  {editingItem.file_type?.startsWith('image/') ? (
                    <img 
                      src={editingItem.file_url} 
                      alt={editingItem.title}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <video 
                      src={editingItem.file_url} 
                      controls
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '8px'
                      }}
                    />
                  )}
                </div>
              )}
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#718096'
                }}>
                  Title
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748'
                }}>
                  {editingItem?.title}
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#718096'
                }}>
                  Description
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748',
                  minHeight: '80px'
                }}>
                  {editingItem?.description || 'No description'}
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#718096'
                }}>
                  Photographer
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748'
                }}>
                  {editingItem?.photographer || 'Unknown'}
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#718096'
                }}>
                  Location
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748'
                }}>
                  {editingItem?.location || 'Not specified'}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Category
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.category}
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    File Size
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.file_size ? `${(editingItem.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit/Upload mode - form
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {modalType === 'upload' && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: 500,
                      color: '#718096'
                    }}>
                      File Upload *
                    </label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      style={{
                        border: `2px dashed ${dragOver ? '#00bfae' : (errors.file ? '#ef4444' : '#e2e8f0')}`,
                        borderRadius: '8px',
                        padding: '2rem',
                        textAlign: 'center',
                        background: dragOver ? '#f8fafc' : '#f9fafb',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => document.getElementById('file-upload').click()}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      <FaUpload style={{ 
                        fontSize: '2rem', 
                        color: '#718096',
                        marginBottom: '1rem'
                      }} />
                      <div style={{ color: '#2d3748', marginBottom: '0.5rem' }}>
                        {formData.file ? formData.file.name : 'Drop files here or click to browse'}
                      </div>
                      <div style={{ color: '#718096', fontSize: '0.8rem' }}>
                        Supports: JPEG, PNG, GIF, MP4, WebM (Max: 50MB)
                      </div>
                    </div>
                    {errors.file && (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {errors.file}
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.title ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter media title"
                  />
                  {errors.title && (
                    <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {errors.title}
                    </div>
                  )}
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter media description"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Photographer
                  </label>
                  <input
                    type="text"
                    value={formData.photographer}
                    onChange={(e) => handleInputChange('photographer', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter photographer name"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter location (e.g., Turin, Italy)"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: 500,
                      color: '#718096'
                    }}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                      placeholder="Enter category (e.g., general, training, events)"
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: 500,
                      color: '#718096'
                    }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                      placeholder="photo, dogs, training"
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 500,
                    color: '#718096',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    />
                    Featured Media
                  </label>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem',
                marginTop: '2rem'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: '#718096',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refreshing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: refreshing ? '#cbd5e0' : '#00bfae',
                    color: 'white',
                    cursor: refreshing ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  {refreshing ? 'Saving...' : modalType === 'upload' ? 'Upload Media' : 'Update Media'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <LoadingSpinner size="lg" message="Loading gallery..." />
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          margin: 0,
          color: '#2d3748'
        }}>
          Gallery Management
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={loadGalleryItems}
            disabled={refreshing}
            style={{
              background: '#00bfae',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaSync style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            onClick={handleUploadMedia}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaUpload />
            Upload Media
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#718096',
            fontSize: '0.9rem'
          }} />
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.5rem 0.5rem 2.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: 'white',
              color: '#2d3748',
              fontSize: '0.9rem'
            }}
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: 'white',
            color: '#2d3748',
            fontSize: '0.9rem'
          }}
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        
        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split(':');
            setSortBy(field);
            setSortOrder(order);
          }}
          style={{
            padding: '0.5rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: 'white',
            color: '#2d3748',
            fontSize: '0.9rem'
          }}
        >
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="title:asc">Title A-Z</option>
          <option value="title:desc">Title Z-A</option>
          <option value="file_size:desc">Largest First</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            color: '#2d3748',
            fontWeight: 500
          }}>
            {selectedItems.size} items selected
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleBulkAction('feature')}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Feature
            </button>
            <button
              onClick={() => handleBulkAction('unfeature')}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Unfeature
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedItems(new Set())}
              style={{
                background: 'transparent',
                color: '#718096',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {refreshing ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <LoadingSpinner size="md" message="Loading gallery..." />
        </div>
      ) : galleryItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#718096'
        }}>
          <FaImage style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No media found</h4>
          <p>Upload your first media to get started.</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            {galleryItems.map((item) => (
              <div key={item.id} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                {/* Media Preview */}
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: '0.5rem',
                      zIndex: 2
                    }}
                  />
                  {item.is_featured && (
                    <FaStar style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      color: '#f59e0b',
                      fontSize: '1.2rem',
                      zIndex: 2
                    }} />
                  )}
                  {item.file_type?.startsWith('image/') ? (
                    <img 
                      src={item.file_url || item.thumbnail || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=200&fit=crop'} 
                      alt={item.title}
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
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <FaVideo style={{ fontSize: '3rem' }} />
                    </div>
                  )}
                </div>

                {/* Media Info */}
                <div style={{ padding: '1rem' }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem 0',
                    color: '#2d3748'
                  }}>
                    {item.title}
                  </h4>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#718096',
                    margin: '0 0 1rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description || 'No description'}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      background: item.file_type?.startsWith('image/') ? '#10b98120' : '#8b5cf620',
                      color: item.file_type?.startsWith('image/') ? '#10b981' : '#8b5cf6',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 500
                    }}>
                      {item.file_type?.startsWith('image/') ? 'Image' : 'Video'}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      color: '#718096'
                    }}>
                      {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewItem(item);
                      }}
                      style={{
                        flex: 1,
                        background: '#4ecdff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditItem(item);
                      }}
                      style={{
                        flex: 1,
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      style={{
                        flex: 1,
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: currentPage === 1 ? 'transparent' : 'white',
                  color: currentPage === 1 ? '#cbd5e0' : '#2d3748',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              
              <span style={{ color: '#718096' }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: currentPage === totalPages ? 'transparent' : 'white',
                  color: currentPage === totalPages ? '#cbd5e0' : '#2d3748',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Media Modal */}
      {showModal && <MediaModal />}
    </div>
  );
};

export default GalleryManagement; 