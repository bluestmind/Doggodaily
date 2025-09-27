import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaSort, FaCheckCircle, 
  FaExclamationTriangle, FaPause, FaPlay, FaHeart, FaComment, FaShare, FaTimes,
  FaImage, FaVideo, FaCalendarAlt, FaUser, FaTags, FaUpload, FaSave, FaSync, FaStar, FaBook,
  FaPlayCircle, FaCamera, FaFileImage
} from 'react-icons/fa';
import { useNotification } from '../common/Notification';
import LoadingSpinner from '../common/LoadingSpinner';

const StoriesManagement = ({ adminService }) => {
  const { showSuccess, showError } = useNotification();
  
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Media upload state
  const [mediaFiles, setMediaFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadStories();
  }, [currentPage, searchTerm, filterStatus, sortBy, sortOrder]);

  const loadStories = async () => {
    try {
      setRefreshing(true);
      const params = {
        page: currentPage,
        per_page: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await adminService.getStories(params);
      if (response.success) {
        setStories(response.data || []);
        setTotalPages(response.meta?.pages || 1);
      } else {
        showError(response.message || 'Failed to load stories');
        setStories([]);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      showError('Failed to load stories');
      setStories([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleViewStory = async (story) => {
    try {
      const response = await adminService.getStory(story.id);
      if (response.success) {
        setEditingItem(response.data);
        setModalType('view');
        setShowModal(true);
      } else {
        showError(response.message || 'Failed to fetch story details');
      }
    } catch (error) {
      showError('Failed to fetch story details');
    }
  };

  const handleEditStory = async (story) => {
    try {
      const response = await adminService.getStory(story.id);
      if (response.success) {
        setEditingItem(response.data);
        // Load existing media files if any
        if (response.data.media_files && response.data.media_files.length > 0) {
          const existingMedia = response.data.media_files.map((media, index) => ({
            id: `existing-${index}`,
            type: media.type || 'image',
            name: media.filename || `media-${index}`,
            preview: media.url || media.thumbnail_url,
            size: media.size || 0,
            file: null, // No file object for existing media
            thumbnail: null,
            thumbnailFile: null
          }));
          setMediaFiles(existingMedia);
        } else {
          setMediaFiles([]);
        }
        setModalType('edit');
        setShowModal(true);
      } else {
        showError(response.message || 'Failed to fetch story details');
      }
    } catch (error) {
      showError('Failed to fetch story details');
    }
  };

  const handleDeleteStory = async (story) => {
    if (!window.confirm(`Are you sure you want to delete "${story.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setRefreshing(true);
      const response = await adminService.deleteStory(story.id);
      if (response.success) {
        showSuccess('Story deleted successfully');
        await loadStories();
      } else {
        showError(response.message || 'Failed to delete story');
      }
    } catch (error) {
      showError('Failed to delete story');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePublishStory = async (story) => {
    try {
      setRefreshing(true);
      const response = await adminService.publishStory(story.id);
      if (response.success) {
        showSuccess('Story published successfully');
        await loadStories();
      } else {
        showError(response.message || 'Failed to publish story');
      }
    } catch (error) {
      showError('Failed to publish story');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUnpublishStory = async (story) => {
    try {
      setRefreshing(true);
      const response = await adminService.unpublishStory(story.id);
      if (response.success) {
        showSuccess('Story unpublished successfully');
        await loadStories();
      } else {
        showError(response.message || 'Failed to unpublish story');
      }
    } catch (error) {
      showError('Failed to unpublish story');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateStory = () => {
    setEditingItem(null);
    setMediaFiles([]); // Reset media files for new story
    setModalType('create');
    setShowModal(true);
  };

  // Media upload functions
  const handleMediaUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Check total file count limit
    if (mediaFiles.length + files.length > 10) {
      showError('Maximum 10 media files allowed');
      return;
    }
    
    // Validate files
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      
      if (!isValidType) {
        invalidFiles.push(`${file.name} is not a valid media file`);
      } else if (!isValidSize) {
        invalidFiles.push(`${file.name} is too large (max 50MB)`);
      } else {
        validFiles.push(file);
      }
    });

    // Show validation errors
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(error => showError(error));
    }
    
    if (validFiles.length === 0) {
      return;
    }

    // Create preview objects
    const mediaObjects = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      thumbnail: null, // For user-uploaded thumbnails
      thumbnailFile: null // Store the thumbnail file
    }));

    setMediaFiles(prev => [...prev, ...mediaObjects]);
    
    if (validFiles.length > 0) {
      showSuccess(`${validFiles.length} files added successfully`);
    }
    
    // Clear the file input to allow selecting the same files again
    event.target.value = '';
  };

  const removeMedia = (id) => {
    setMediaFiles(prev => {
      const updated = prev.filter(media => media.id !== id);
      // Clean up object URLs to prevent memory leaks
      const mediaToRemove = prev.find(media => media.id === id);
      if (mediaToRemove && mediaToRemove.preview) {
        URL.revokeObjectURL(mediaToRemove.preview);
      }
      return updated;
    });
  };

  const handleSaveStory = async (storyData) => {
    try {
      setRefreshing(true);
      
      // Create FormData for story submission (like ProfileModern.jsx)
      const formData = new FormData();
      formData.append('title', storyData.title);
      formData.append('content', storyData.content);
      formData.append('category', storyData.category);
      formData.append('tags', Array.isArray(storyData.tags) ? storyData.tags.join(', ') : storyData.tags || '');
      formData.append('is_featured', storyData.is_featured ? 'true' : 'false');
      formData.append('terms_accepted', 'true'); // Admin stories are auto-accepted
      
      // Add media files (like ProfileModern.jsx)
      mediaFiles.forEach((media) => {
        if (media.file) {
          formData.append('media_files', media.file);
          if (media.thumbnailFile) {
            formData.append('thumbnail_files', media.thumbnailFile);
          } else {
            formData.append('thumbnail_files', new File([], ''));
          }
        }
      });
      
      // Use the same approach as ProfileModern.jsx - direct API call
      const baseURL = import.meta.env.VITE_API_URL || 'http://46.101.244.203:5000';
      const endpoint = editingItem && editingItem.id 
        ? `/api/stories/${editingItem.id}` 
        : '/api/stories'; // Now use /api/stories for creation (handles media files)
      const method = editingItem && editingItem.id ? 'PUT' : 'POST';
      
      console.log('🔍 StoriesManagement - Submitting to:', `${baseURL}${endpoint}`);
      console.log('🔍 StoriesManagement - Method:', method);
      console.log('🔍 StoriesManagement - FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: method,
        credentials: 'include',
        body: formData, // Let fetch handle FormData headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ StoriesManagement - API Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ StoriesManagement - Response:', data);
      
      if (data.success) {
        showSuccess(editingItem ? 'Story updated successfully' : 'Story created successfully');
        setShowModal(false);
        setEditingItem(null);
        setMediaFiles([]); // Reset media files
        await loadStories();
      } else {
        showError(data.message || 'Failed to save story');
      }
    } catch (error) {
      console.error('❌ StoriesManagement - Error saving story:', error);
      showError('Failed to save story: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.size === 0) {
      showError('Please select items first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedItems.size} selected stories?`)) {
      return;
    }

    try {
      setRefreshing(true);
      const response = await adminService.bulkStoryAction(action, Array.from(selectedItems));
      if (response.success) {
        showSuccess(`Bulk ${action} completed successfully`);
        setSelectedItems(new Set());
        await loadStories();
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
    if (selectedItems.size === stories.length && stories.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(stories.map(story => story.id)));
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return '#10b981';
      case 'draft':
        return '#6b7280';
      case 'review':
        return '#f59e0b';
      case 'archived':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const StoryModal = () => {
    const [formData, setFormData] = useState({
      title: editingItem?.title || '',
      content: editingItem?.content || '',
      category: editingItem?.category || 'general',
      tags: editingItem?.tags || '',
      is_featured: editingItem?.is_featured || false
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
      if (editingItem) {
        setFormData({
          title: editingItem.title || '',
          content: editingItem.content || '',
          category: editingItem.category || 'general',
          tags: Array.isArray(editingItem.tags) ? editingItem.tags.join(', ') : editingItem.tags || '',
          is_featured: editingItem.is_featured || false
        });
      }
    }, [editingItem]);

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      
      if (!formData.content.trim()) {
        newErrors.content = 'Content is required';
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
        handleSaveStory(submitData);
      }
    };

    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
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
          maxWidth: '800px',
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
              {modalType === 'view' ? 'View Story' : 
               modalType === 'edit' ? 'Edit Story' : 'Create New Story'}
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
                  Content
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748',
                  minHeight: '200px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {editingItem?.content}
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
                    Status
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.status}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit/Create mode - form
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    placeholder="Enter story title"
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
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.content ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem',
                      minHeight: '200px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter story content"
                  />
                  {errors.content && (
                    <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {errors.content}
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
                    Category
                  </label>
                  <select
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
                  >
                    <option value="general">General</option>
                    <option value="training">Training</option>
                    <option value="health">Health</option>
                    <option value="rescue">Rescue</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="behavior">Behavior</option>
                  </select>
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
                    placeholder="training, behavior, success"
                  />
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
                    Featured Story
                  </label>
                </div>
              </div>

              {/* Media Upload Section */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#718096'
                }}>
                  Media Files (Images & Videos)
                </label>
                
                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #e2e8f0',
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                    transition: 'all 0.2s ease',
                    marginBottom: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#00bfae';
                    e.target.style.background = '#f0fdfa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                  }}
                >
                  <FaUpload size={32} style={{ color: '#718096', marginBottom: '0.5rem' }} />
                  <p style={{
                    fontSize: '1rem',
                    color: '#2d3748',
                    margin: '0 0 0.25rem 0',
                    fontWeight: '600'
                  }}>
                    Click to upload media files
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#718096',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Maximum file size: 50MB
                  </p>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#a0aec0',
                    margin: 0
                  }}>
                    Supported formats: JPG, PNG, GIF, MP4, MOV, AVI
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  style={{ display: 'none' }}
                />

                {/* Media Preview */}
                {mediaFiles.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    {mediaFiles.map((media) => (
                      <div key={media.id} style={{
                        position: 'relative',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        aspectRatio: '16/9'
                      }}>
                        {media.type === 'image' ? (
                          <img
                            src={media.preview}
                            alt={media.name}
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#1f2937',
                            color: 'white'
                          }}>
                            <FaPlayCircle size={32} />
                          </div>
                        )}
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeMedia(media.id)}
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          <FaTimes />
                        </button>
                        
                        {/* File Info */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem'
                        }}>
                          <div style={{ fontWeight: '500' }}>
                            {media.name.length > 15 ? media.name.substring(0, 15) + '...' : media.name}
                          </div>
                          <div style={{ opacity: 0.8 }}>
                            {(media.size / 1024 / 1024).toFixed(1)}MB
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  {refreshing ? 'Saving...' : editingItem ? 'Update Story' : 'Create Story'}
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
        <LoadingSpinner size="lg" message="Loading stories..." />
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
          Stories Management
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={loadStories}
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
            onClick={handleCreateStory}
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
            <FaPlus />
            Add Story
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
            placeholder="Search stories..."
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '0.5rem',
                        border: '1px solid #e2e8f0',
            borderRadius: '8px',
                        background: 'white',
            color: '#2d3748',
            fontSize: '0.9rem'
          }}
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="archived">Archived</option>
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
          <option value="views:desc">Most Viewed</option>
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
            {selectedItems.size} stories selected
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleBulkAction('publish')}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Publish
            </button>
            <button
              onClick={() => handleBulkAction('unpublish')}
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
              Unpublish
            </button>
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

      {/* Stories List */}
      {refreshing ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <LoadingSpinner size="md" message="Loading stories..." />
        </div>
      ) : stories.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#718096'
        }}>
          <FaBook style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No stories found</h4>
          <p>Create your first story to get started.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.size === stories.length && stories.length > 0}
                      onChange={handleSelectAll}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Story
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Author</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Created</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stories.map((story) => (
                  <tr key={story.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(story.id)}
                          onChange={(e) => handleItemSelect(story.id, e.target.checked)}
                        />
                        <img 
                          src={story.featured_image || story.thumbnail || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=50&h=50&fit=crop'} 
                          alt={story.title}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ color: '#2d3748', fontWeight: 500 }}>
                            {story.title}
                            {story.is_featured && (
                              <FaStar style={{ color: '#f59e0b', marginLeft: '0.5rem', fontSize: '0.8rem' }} />
                            )}
                          </div>
                          <div style={{ color: '#718096', fontSize: '0.8rem' }}>
                            {story.preview || (story.content && story.content.substring(0, 50) + '...')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#718096' }}>
                      {story.author?.name || 'Unknown'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        background: `${getStatusColor(story.status)}20`,
                        color: getStatusColor(story.status),
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        {story.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#718096' }}>
                      {story.category}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#718096' }}>
                      {story.created_at ? new Date(story.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleViewStory(story)}
                          style={{
                            background: '#4ecdff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="View Story"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleEditStory(story)}
                          style={{
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Edit Story"
                        >
                          <FaEdit />
                        </button>
                        {story.status === 'published' ? (
                          <button 
                            onClick={() => handleUnpublishStory(story)}
                            style={{
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title="Unpublish Story"
                          >
                            <FaPause />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handlePublishStory(story)}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title="Publish Story"
                          >
                            <FaPlay />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteStory(story)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Delete Story"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Story Modal */}
      {showModal && <StoryModal />}
    </div>
  );
};

export default StoriesManagement; 