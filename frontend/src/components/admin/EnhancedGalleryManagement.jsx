import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaSort, FaUpload, FaDownload,
  FaImage, FaVideo, FaCalendarAlt, FaUser, FaTags, FaTimes, FaSync, FaStar,
  FaChevronLeft, FaChevronRight, FaExpand, FaCompress, FaPlay, FaPause,
  FaImages, FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle, FaHome
} from 'react-icons/fa';
import { useNotification } from '../common/Notification';
import LoadingSpinner from '../common/LoadingSpinner';

const EnhancedGalleryManagement = ({ adminService }) => {
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
  
  // Enhanced upload states
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single', 'album'
  const [albumTitle, setAlbumTitle] = useState('');
  
  // Carousel states
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselItems, setCarouselItems] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadGalleryItems();
  }, [currentPage, searchTerm, filterType, sortBy, sortOrder]);

  const loadGalleryItems = async () => {
    try {
      setRefreshing(true);
      const params = {
        page: currentPage,
        per_page: 12,
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

  // Enhanced file validation
   const validateFile = (file) => {
    const allowed = new Set([
      // images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      // (optional if you support them) 'image/heic', 'image/heif',

      // videos
      'video/mp4', 'video/webm', 'video/quicktime',      // .mov
      'video/x-msvideo',                                  // .avi
      'video/x-matroska',                                 // .mkv
      'video/ogg', 'video/3gpp'                           // common mobile/browser variants
    ]);

    if (!allowed.has(file.type)) {
      return { valid: false, error: 'Unsupported file type.' };
    }
    if (file.size > 100 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 100MB' };
    }
    return { valid: true };
  };


  // Multi-file upload handler
  const handleMultiFileSelect = (files) => {
    if (!files || files.length === 0) return;
    
    const validFiles = [];
    const errors = [];
    
    Array.from(files).forEach((file, index) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          id: `upload_${Date.now()}_${index}`,
          file,
          title: file.name.split('.')[0],
          description: '',
          photographer: '',
          location: '',
          category: 'general',
          tags: '',
          progress: 0,
          status: 'pending' // pending, uploading, completed, error
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      showError(`Some files were rejected:\n${errors.join('\n')}`);
    }
    
    if (validFiles.length > 0) {
      setUploadFiles(validFiles);
      
      // Determine upload mode based on file count and types
      if (validFiles.length === 1) {
        setUploadMode('single');
      } else {
        setUploadMode('album');
        setAlbumTitle(`Album ${new Date().toLocaleDateString()}`);
      }
      
      setModalType('multi-upload');
      setShowModal(true);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleMultiFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

    // Upload individual file
   const uploadSingleFile = async (fileData) => {
    // start progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const now = prev[fileData.id] || 0;
        return now < 90 ? { ...prev, [fileData.id]: now + 10 } : prev;
      });
    }, 200);

    try {
      setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }));

      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('title', fileData.title);
      formData.append('description', fileData.description);
      formData.append('photographer', fileData.photographer || '');
      formData.append('location', fileData.location || '');
      formData.append('category', fileData.category);
      formData.append('tags', fileData.tags);

      // ✅ unify the path: use the same admin service used by album uploads
      const response = await adminService.uploadMedia(formData); // was fetch('/api/admin/gallery/upload' ...)

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileData.id]: 100 })); // was {.prev, ...} (syntax error)

      if (response?.success) {
        setUploadFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'completed' } : f));
        return { success: true, data: response.data };
      } else {
        const msg = response?.message || 'Upload failed';
        setUploadFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: msg } : f));
        return { success: false, error: msg };
      }
    } catch (err) {
      clearInterval(progressInterval); // ✅ stop the timer on error
      setUploadFiles(prev => prev.map(f => f.id === fileData.id ? { ...f, status: 'error', error: err.message } : f));
      return { success: false, error: err.message };
    }
  };


  // Upload all files
  const handleMultiUpload = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;
    
    setRefreshing(true);
    
    try {
      if (uploadMode === 'single') {
        // Upload as individual items
        const uploadPromises = pendingFiles.map(file => {
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'uploading' } : f
          ));
          return uploadSingleFile(file);
        });
        
        const results = await Promise.allSettled(uploadPromises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        if (successful > 0) {
          showSuccess(`Successfully uploaded ${successful} file(s)${failed > 0 ? `, ${failed} failed` : ''}`);
          await loadGalleryItems();
        }
        
        if (failed === results.length) {
          showError('All uploads failed');
        }
      } else {
        // Upload as album
        await uploadAsAlbum(pendingFiles);
      }
      
      // Auto-close modal after successful uploads
      setTimeout(() => {
        setShowModal(false);
        setUploadFiles([]);
        setUploadProgress({});
        setAlbumTitle('');
      }, 2000);
      
    } catch (error) {
      showError('Upload process failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Upload files as album
  const uploadAsAlbum = async (files) => {
    try {
      // First create the album
      const albumData = {
        title: albumTitle,
        description: `Album containing ${files.length} items`,
        category: files[0]?.category || 'general',
        tags: 'album',
        is_album: true,
        album_type: determineAlbumType(files)
      };
      
      const albumResponse = await adminService.createGalleryAlbum(albumData);
      if (!albumResponse.success) {
        throw new Error('Failed to create album');
      }
      
      const albumId = albumResponse.data.id;
      
      // Upload each file and link to album
      const uploadPromises = files.map(async (file, index) => {
        setUploadFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ));
        
        const formData = new FormData();
        formData.append('file', file.file);
        formData.append('title', file.title);
        formData.append('description', file.description);
        formData.append('photographer', file.photographer || '');
        formData.append('location', file.location || '');
        formData.append('category', file.category);
        formData.append('tags', file.tags);
        formData.append('album_id', albumId);
        formData.append('album_order', index);
        
        setUploadProgress(prev => ({ ...prev, [file.id]: 0 }));
        
        const response = await adminService.uploadMedia(formData);
        
        setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
        
        if (response.success) {
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'completed' } : f
          ));
          return { success: true, data: response.data };
        } else {
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: 'error', error: response.message } : f
          ));
          return { success: false, error: response.message };
        }
      });
      
      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        showSuccess(`Successfully created album "${albumTitle}" with ${successful} item(s)${failed > 0 ? `, ${failed} failed` : ''}`);
        await loadGalleryItems();
      }
      
      if (failed === results.length) {
        showError('Album creation failed');
      }
      
    } catch (error) {
      showError(`Album upload failed: ${error.message}`);
    }
  };

  // Determine album type based on files
  const determineAlbumType = (files) => {
    const hasImages = files.some(f => f.file.type.startsWith('image/'));
    const hasVideos = files.some(f => f.file.type.startsWith('video/'));
    
    if (hasImages && hasVideos) return 'mixed';
    if (hasImages) return 'photos';
    if (hasVideos) return 'videos';
    return 'mixed';
  };

  // Carousel functions
  // Delete gallery item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await adminService.deleteGalleryItem(itemId);
      
      if (response.success) {
        showSuccess('Item deleted successfully');
        loadGalleryItems(); // Refresh the list
      } else {
        showError(response.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete item');
    }
  };

  // Toggle homepage featured status
  const handleToggleHomepage = async (itemId) => {
    try {
      const response = await adminService.toggleHomepageFeatured(itemId);
      
      if (response.success) {
        showSuccess(response.message);
        loadGalleryItems(); // Refresh the list
      } else {
        showError(response.message || 'Failed to toggle homepage featured status');
      }
    } catch (error) {
      console.error('Toggle homepage error:', error);
      showError('Failed to toggle homepage featured status');
    }
  };

  // Edit gallery item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setModalType('edit');
    setShowModal(true);
  };

  // Update gallery item
  const handleUpdateItem = async () => {
    if (!editingItem) return;
    
    try {
      const response = await adminService.updateGalleryItem(editingItem.id, {
        title: editingItem.title,
        description: editingItem.description,
        photographer: editingItem.photographer,
        location: editingItem.location,
        category: editingItem.category,
        tags: editingItem.tags,
        status: editingItem.status
      });
      
      if (response.success) {
        showSuccess('Item updated successfully');
        setShowModal(false);
        setEditingItem(null);
        loadGalleryItems(); // Refresh the list
      } else {
        showError(response.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Update error:', error);
      showError('Failed to update item');
    }
  };

  const openCarousel = (items, startIndex = 0) => {
    setCarouselItems(items);
    setCarouselIndex(startIndex);
    setShowCarousel(true);
  };

  const nextCarouselItem = () => {
    setCarouselIndex(prev => (prev + 1) % carouselItems.length);
  };

  const prevCarouselItem = () => {
    setCarouselIndex(prev => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  // View item in carousel
  const handleViewItem = (item) => {
    const itemIndex = galleryItems.findIndex(i => i.id === item.id);
    openCarousel(galleryItems, itemIndex);
  };

  // Enhanced Multi-Upload Modal
  const MultiUploadModal = () => {
    const updateFileData = (fileId, field, value) => {
      setUploadFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, [field]: value } : f
      ));
    };

    const removeFile = (fileId) => {
      setUploadFiles(prev => prev.filter(f => f.id !== fileId));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          width: '95%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          {/* Modal Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: '700',
                margin: 0,
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                Upload Media Files
              </h3>
              <p style={{
                color: '#718096',
                margin: 0,
                fontSize: '1rem'
              }}>
                Upload multiple images and videos at once
              </p>
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                setUploadFiles([]);
                setUploadProgress({});
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#718096',
                padding: '0.5rem'
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* File Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={(e) => {
              e.preventDefault();
              console.log('Drag area clicked');
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            style={{
              border: `3px dashed ${dragOver ? 'var(--primary-teal)' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              background: dragOver ? '#f0f9ff' : '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '2rem'
            }}
          >

            <FaCloudUploadAlt style={{ 
              fontSize: '3rem', 
              color: '#718096',
              marginBottom: '1rem'
            }} />
            <h4 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              color: '#2d3748',
              margin: '0 0 0.5rem 0'
            }}>
              Drop files here or click to browse
            </h4>
            <p style={{
              color: '#718096',
              margin: 0,
              fontSize: '1rem'
            }}>
              Supports: Images (JPEG, PNG, GIF, WebP, BMP) • Videos (MP4, WebM, AVI, MOV, MKV) • Max: 100MB each
            </p>
          </div>

          {/* Upload Mode Selection */}
          {uploadFiles.length > 1 && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '1rem'
              }}>
                Upload Mode
              </h4>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  color: '#374151'
                }}>
                  <input
                    type="radio"
                    value="single"
                    checked={uploadMode === 'single'}
                    onChange={(e) => setUploadMode(e.target.value)}
                  />
                  Upload as Individual Items
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  color: '#374151'
                }}>
                  <input
                    type="radio"
                    value="album"
                    checked={uploadMode === 'album'}
                    onChange={(e) => setUploadMode(e.target.value)}
                  />
                  Upload as Album/Slider
                </label>
              </div>
              
              {uploadMode === 'album' && (
                <input
                  type="text"
                  placeholder="Album Title"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#2d3748',
                    fontSize: '1rem'
                  }}
                />
              )}
            </div>
          )}

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '1rem'
              }}>
                {uploadMode === 'album' ? `Album: ${albumTitle}` : 'Individual Files'} ({uploadFiles.length})
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1rem',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '0.5rem'
              }}>
                {uploadFiles.map((fileData) => (
                  <div key={fileData.id} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem',
                    position: 'relative'
                  }}>
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(fileData.id)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}
                    >
                      <FaTimes />
                    </button>

                    {/* File Preview */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        background: fileData.file.type.startsWith('image/') ? '#10b98120' : '#8b5cf620',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: fileData.file.type.startsWith('image/') ? '#10b981' : '#8b5cf6'
                      }}>
                        {fileData.file.type.startsWith('image/') ? <FaImage size={24} /> : <FaVideo size={24} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#2d3748',
                          margin: '0 0 0.25rem 0',
                          wordBreak: 'break-all'
                        }}>
                          {fileData.file.name}
                        </h6>
                        <p style={{
                          fontSize: '0.8rem',
                          color: '#718096',
                          margin: 0
                        }}>
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB • {fileData.file.type}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {fileData.status === 'uploading' && (
                      <div style={{
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        height: '6px',
                        marginBottom: '1rem',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: 'var(--primary-teal)',
                          height: '100%',
                          width: `${uploadProgress[fileData.id] || 0}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}

                    {/* Status Indicator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      {fileData.status === 'completed' && (
                        <>
                          <FaCheckCircle style={{ color: '#10b981' }} />
                          <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Uploaded</span>
                        </>
                      )}
                      {fileData.status === 'error' && (
                        <>
                          <FaExclamationTriangle style={{ color: '#ef4444' }} />
                          <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>
                            Error: {fileData.error}
                          </span>
                        </>
                      )}
                      {fileData.status === 'uploading' && (
                        <>
                          <div className="spinner" style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid var(--primary-teal)',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          <span style={{ color: 'var(--primary-teal)', fontSize: '0.8rem' }}>
                            Uploading... {uploadProgress[fileData.id] || 0}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Metadata Inputs */}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Title"
                        value={fileData.title}
                        onChange={(e) => updateFileData(fileData.id, 'title', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: 'white',
                          color: '#2d3748',
                          fontSize: '0.9rem'
                        }}
                      />
                      <textarea
                        placeholder="Description"
                        value={fileData.description}
                        onChange={(e) => updateFileData(fileData.id, 'description', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: 'white',
                          color: '#2d3748',
                          fontSize: '0.9rem',
                          minHeight: '60px',
                          resize: 'vertical'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Photographer"
                        value={fileData.photographer || ''}
                        onChange={(e) => updateFileData(fileData.id, 'photographer', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: 'white',
                          color: '#2d3748',
                          fontSize: '0.9rem'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Location (e.g., Turin, Italy)"
                        value={fileData.location || ''}
                        onChange={(e) => updateFileData(fileData.id, 'location', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: 'white',
                          color: '#2d3748',
                          fontSize: '0.9rem'
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Category (e.g., general, training)"
                          value={fileData.category}
                          onChange={(e) => updateFileData(fileData.id, 'category', e.target.value)}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            background: 'white',
                            color: '#2d3748',
                            fontSize: '0.9rem'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Tags (comma-separated)"
                          value={fileData.tags}
                          onChange={(e) => updateFileData(fileData.id, 'tags', e.target.value)}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            background: 'white',
                            color: '#2d3748',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{
              color: '#718096',
              fontSize: '0.9rem'
            }}>
              {uploadFiles.filter(f => f.status === 'completed').length} of {uploadFiles.length} uploaded
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setUploadFiles([]);
                  setUploadProgress({});
                }}
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
                onClick={handleMultiUpload}
                disabled={uploadFiles.filter(f => f.status === 'pending').length === 0 || refreshing}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: (uploadFiles.filter(f => f.status === 'pending').length === 0 || refreshing) 
                    ? '#cbd5e0' 
                    : 'var(--primary-teal)',
                  color: 'white',
                  cursor: (uploadFiles.filter(f => f.status === 'pending').length === 0 || refreshing) 
                    ? 'not-allowed' 
                    : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaUpload />
                Upload All Files
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Carousel Modal
  const CarouselModal = () => {
    const currentItem = carouselItems[carouselIndex];
    
    if (!currentItem) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001
      }}>
        {/* Close Button */}
        <button
          onClick={() => setShowCarousel(false)}
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002
          }}
        >
          <FaTimes />
        </button>

        {/* Navigation Buttons */}
        {carouselItems.length > 1 && (
          <>
            <button
              onClick={prevCarouselItem}
              style={{
                position: 'absolute',
                left: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1002
              }}
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={nextCarouselItem}
              style={{
                position: 'absolute',
                right: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1002
              }}
            >
              <FaChevronRight />
            </button>
          </>
        )}

        {/* Media Display */}
        <div style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {currentItem.file_type === 'image' ? (
            <img 
              src={currentItem.file_url || currentItem.file_path || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop'} 
              alt={currentItem.title}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          ) : (
            <video 
              src={currentItem.file_url || currentItem.file_path}
              controls
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh',
                borderRadius: '8px'
              }}
            />
          )}
          
          {/* Media Info */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            padding: '1rem 2rem',
            marginTop: '1rem',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: '600',
              margin: '0 0 0.5rem 0'
            }}>
              {currentItem.title}
            </h3>
            {currentItem.description && (
              <p style={{
                color: '#e5e7eb',
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0'
              }}>
                {currentItem.description}
              </p>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              fontSize: '0.8rem',
              color: '#9ca3af'
            }}>
              <span>
                {carouselIndex + 1} of {carouselItems.length}
              </span>
              <span>•</span>
              <span>
                {currentItem.file_size ? `${(currentItem.file_size / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
              </span>
              <span>•</span>
              <span>
                {currentItem.file_type === 'image' ? 'Image' : 'Video'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rest of the component remains the same as the original...
  // I'll continue with the main render in the next part
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <LoadingSpinner size="lg" message="Loading enhanced gallery..." />
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
      {/* Enhanced Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: 0,
            color: '#2d3748',
            marginBottom: '0.25rem'
          }}>
            🎨 Enhanced Gallery Management
          </h3>
          <p style={{
            color: '#718096',
            margin: 0,
            fontSize: '0.9rem'
          }}>
            Multi-media upload, carousel preview, and advanced management
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={loadGalleryItems}
            disabled={refreshing}
            style={{
              background: 'var(--primary-teal)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 1.25rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <FaSync style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button
            onClick={() => {
              console.log('Multi-upload button clicked');
              console.log('File input ref:', fileInputRef.current);
              if (fileInputRef.current) {
                fileInputRef.current.click();
              } else {
                console.error('File input ref is null');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 1.25rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <FaImages />
            Multi-Upload
          </button>
          
          {/* Hidden file input for multi-upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              console.log('File input changed:', e.target.files);
              handleMultiFileSelect(e.target.files);
            }}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Drag & Drop Overlay */}
      {dragOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 191, 174, 0.1)',
          border: '3px dashed var(--primary-teal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          fontSize: '2rem',
          color: 'var(--primary-teal)',
          fontWeight: '600'
        }}>
          Drop files anywhere to upload
        </div>
      )}

      {/* Enhanced Gallery Grid with better preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {galleryItems.map((item, index) => (
          <div key={item.id} style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            {/* Enhanced Media Preview */}
            <div 
              style={{ position: 'relative', height: '240px', overflow: 'hidden' }}
              onClick={() => handleViewItem(item)}
            >
              
              {/* Media Type Indicator */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: item.file_type === 'image' 
                  ? 'rgba(16, 185, 129, 0.9)' 
                  : 'rgba(139, 92, 246, 0.9)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                zIndex: 2,
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {item.file_type === 'image' ? <FaImage /> : <FaVideo />}
                {item.file_type === 'image' ? 'Image' : 'Video'}
              </div>

              {item.file_type === 'image' ? (
                <img 
                  src={item.file_url || item.thumbnail || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=240&fit=crop'} 
                  alt={item.title}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
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
                  color: 'white',
                  position: 'relative'
                }}>
                  <FaVideo style={{ fontSize: '4rem', opacity: 0.8 }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    right: '1rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    textAlign: 'center'
                  }}>
                    Click to preview video
                  </div>
                </div>
              )}
              
              {/* Hover Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = 1;
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = 0;
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem'
                }}>
                  <FaExpand />
                </div>
              </div>
            </div>

            {/* Enhanced Media Info */}
            <div style={{ padding: '1.25rem' }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0',
                color: '#2d3748',
                lineHeight: '1.3'
              }}>
                {item.title}
              </h4>
              <p style={{
                fontSize: '0.85rem',
                color: '#718096',
                margin: '0 0 1rem 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.4'
              }}>
                {item.description || 'No description available'}
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{
                  background: '#e2e8f0',
                  color: '#718096',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {item.category}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#718096',
                  fontWeight: '500'
                }}>
                  {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
                </span>
              </div>

              {/* Homepage Featured Badge */}
              {item.homepage_featured && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  zIndex: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  <FaHome />
                  Homepage
                </div>
              )}

              {/* Enhanced Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewItem(item);
                  }}
                  style={{
                    flex: '1 1 30%',
                    background: 'linear-gradient(135deg, #4ecdff, #44c7e8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                  title="View in Carousel"
                >
                  <FaEye />
                  View
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditItem(item);
                  }}
                  style={{
                    flex: '1 1 30%',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                  title="Edit"
                >
                  <FaEdit />
                  Edit
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleHomepage(item.id);
                  }}
                  style={{
                    flex: '1 1 30%',
                    background: item.homepage_featured 
                      ? 'linear-gradient(135deg, #10b981, #059669)' 
                      : 'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                  title={item.homepage_featured ? "Remove from Homepage" : "Add to Homepage"}
                >
                  <FaHome />
                  {item.homepage_featured ? 'Featured' : 'Feature'}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                  style={{
                    flex: '1 1 30%',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                  title="Delete"
                >
                  <FaTrash />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showModal && modalType === 'multi-upload' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1rem'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                Upload Media Files
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.5rem'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {uploadFiles.length > 1 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  color: '#374151'
                }}>Upload Mode</h4>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      value="single"
                      checked={uploadMode === 'single'}
                      onChange={(e) => setUploadMode(e.target.value)}
                    />
                    Upload as Individual Items
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    color: '#374151',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      value="album"
                      checked={uploadMode === 'album'}
                      onChange={(e) => setUploadMode(e.target.value)}
                    />
                    Upload as Album/Slider
                  </label>
                </div>
                
                {uploadMode === 'album' && (
                  <input
                    type="text"
                    placeholder="Album Title"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white',
                      color: '#1f2937'
                    }}
                  />
                )}
              </div>
            )}

            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              marginBottom: '2rem'
            }}>
              {uploadFiles.map((fileData, index) => (
                <div key={fileData.id} style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  background: '#f9fafb'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: '#6b7280'
                  }}>
                    {fileData.file.type.startsWith('image/') ? <FaImage /> : <FaVideo />}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '0.25rem'
                    }}>
                      {fileData.file.name}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#6b7280',
                      marginBottom: '0.5rem'
                    }}>
                      {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    
                    {/* Title Input */}
                    <input
                      type="text"
                      placeholder="Title"
                      value={fileData.title}
                      onChange={(e) => {
                        setUploadFiles(prev => prev.map(f => 
                          f.id === fileData.id ? { ...f, title: e.target.value } : f
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        background: 'white',
                        color: '#1f2937'
                      }}
                    />
                    
                    {/* Description Input */}
                    <textarea
                      placeholder="Description/Caption"
                      value={fileData.description}
                      onChange={(e) => {
                        setUploadFiles(prev => prev.map(f => 
                          f.id === fileData.id ? { ...f, description: e.target.value } : f
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        minHeight: '60px',
                        resize: 'vertical',
                        background: 'white',
                        color: '#1f2937'
                      }}
                    />
                    
                    {/* Photographer Input */}
                    <input
                      type="text"
                      placeholder="Photographer"
                      value={fileData.photographer || ''}
                      onChange={(e) => {
                        setUploadFiles(prev => prev.map(f => 
                          f.id === fileData.id ? { ...f, photographer: e.target.value } : f
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        background: 'white',
                        color: '#1f2937'
                      }}
                    />
                    
                    {/* Location Input */}
                    <input
                      type="text"
                      placeholder="Location (e.g., Turin, Italy)"
                      value={fileData.location || ''}
                      onChange={(e) => {
                        setUploadFiles(prev => prev.map(f => 
                          f.id === fileData.id ? { ...f, location: e.target.value } : f
                        ));
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        background: 'white',
                        color: '#1f2937'
                      }}
                    />
                    
                    {/* Category and Tags */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Category (e.g., general, training)"
                        value={fileData.category}
                        onChange={(e) => {
                          setUploadFiles(prev => prev.map(f => 
                            f.id === fileData.id ? { ...f, category: e.target.value } : f
                          ));
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: `1px solid #d1d5db`,
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: 'white',
                          color: '#1f2937'
                        }}
                      />
                      
                      <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        value={fileData.tags}
                        onChange={(e) => {
                          setUploadFiles(prev => prev.map(f => 
                            f.id === fileData.id ? { ...f, tags: e.target.value } : f
                          ));
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: `1px solid #d1d5db`,
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: 'white',
                          color: '#1f2937'
                        }}
                      />
                    </div>
                    
                    
                    {fileData.status === 'uploading' && (
                      <div style={{
                        width: '100%',
                        height: '4px',
                        background: '#e5e7eb',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${fileData.progress || 0}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    )}
                    
                    {fileData.status === 'completed' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#10b981',
                        fontSize: '0.8rem'
                      }}>
                        <FaCheckCircle />
                        Uploaded successfully
                      </div>
                    )}
                    
                    {fileData.status === 'error' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#ef4444',
                        fontSize: '0.8rem'
                      }}>
                        <FaExclamationTriangle />
                        Upload failed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: `1px solid #d1d5db`,
                  color: '#374151',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMultiUpload}
                disabled={uploadFiles.some(f => f.status === 'uploading')}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: uploadFiles.some(f => f.status === 'uploading') ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  opacity: uploadFiles.some(f => f.status === 'uploading') ? 0.7 : 1
                }}
              >
                {uploadFiles.some(f => f.status === 'uploading') ? 'Uploading...' : 'Start Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showModal && modalType === 'edit' && editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: `1px solid #e5e7eb`,
              paddingBottom: '1rem'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                Edit Gallery Item
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.5rem'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Title
              </label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #d1d5db`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                  color: '#1f2937'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Description
              </label>
              <textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #d1d5db`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  minHeight: '100px',
                  resize: 'vertical',
                  background: 'white',
                  color: '#1f2937'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Photographer
              </label>
              <input
                type="text"
                value={editingItem.photographer || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, photographer: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #d1d5db`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                  color: '#1f2937'
                }}
                placeholder="Enter photographer name"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Location
              </label>
              <input
                type="text"
                value={editingItem.location || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, location: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #d1d5db`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                  color: '#1f2937'
                }}
                placeholder="Enter location (e.g., Turin, Italy)"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid #d1d5db`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white',
                    color: '#1f2937'
                  }}
                  placeholder="Enter category (e.g., general, training, events)"
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Status
                </label>
                <select
                  value={editingItem.status}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid #d1d5db`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    background: 'white',
                    color: '#1f2937'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={editingItem.tags}
                onChange={(e) => setEditingItem(prev => ({ ...prev, tags: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid #d1d5db`,
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                  color: '#1f2937'
                }}
              />
            </div>


            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: `1px solid #d1d5db`,
                  color: '#374151',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Update Item
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showCarousel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '2rem'
        }}>
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setShowCarousel(false)}
              style={{
                position: 'absolute',
                top: '-3rem',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '3rem',
                height: '3rem',
                fontSize: '1.5rem',
                color: 'white',
                cursor: 'pointer',
                zIndex: 10002,
                backdropFilter: 'blur(4px)'
              }}
            >
              <FaTimes />
            </button>
            
            {carouselItems[carouselIndex] && (
              <div style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {carouselItems[carouselIndex].file_type === 'image' ? (
                  <img
                    src={carouselItems[carouselIndex].file_url || carouselItems[carouselIndex].file_path}
                    alt={carouselItems[carouselIndex].title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <video
                    src={carouselItems[carouselIndex].file_url || carouselItems[carouselIndex].file_path}
                    controls
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      borderRadius: '8px'
                    }}
                  />
                )}
              </div>
            )}
            
            {carouselItems.length > 1 && (
              <>
                <button
                  onClick={() => setCarouselIndex(prev => prev > 0 ? prev - 1 : carouselItems.length - 1)}
                  style={{
                    position: 'absolute',
                    left: '-4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '3rem',
                    height: '3rem',
                    fontSize: '1.5rem',
                    color: 'white',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <FaChevronLeft />
                </button>
                
                <button
                  onClick={() => setCarouselIndex(prev => prev < carouselItems.length - 1 ? prev + 1 : 0)}
                  style={{
                    position: 'absolute',
                    right: '-4rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '3rem',
                    height: '3rem',
                    fontSize: '1.5rem',
                    color: 'white',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <FaChevronRight />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      

    </div>
  );
};

export default EnhancedGalleryManagement;