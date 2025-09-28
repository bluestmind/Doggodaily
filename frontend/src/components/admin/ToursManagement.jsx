import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaSort, FaCalendarAlt,
  FaMapMarkerAlt, FaClock, FaTimes, FaSync, FaCheck
} from 'react-icons/fa';
import { useNotification } from '../common/Notification';
import LoadingSpinner from '../common/LoadingSpinner';

const ToursManagement = ({ adminService }) => {
  const { showSuccess, showError } = useNotification();
  
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTours();
  }, [currentPage, searchTerm, filterStatus, sortBy, sortOrder]);

  const loadTours = async () => {
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

      const response = await adminService.getTours(params);
      if (response.success) {
        setTours(response.data || []);
        setTotalPages(response.meta?.pages || 1);
      } else {
        showError(response.message || 'Failed to load tours');
        setTours([]);
      }
    } catch (error) {
      console.error('Error loading tours:', error);
      showError('Failed to load tours');
      setTours([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleViewTour = async (tour) => {
    try {
      console.log('🔍 Loading tour for view:', tour.id);
      const response = await adminService.getTour(tour.id);
      console.log('🔍 Tour view response:', response);
      
      if (response.success) {
        // Also load bookings for this tour
        const bookingsResponse = await adminService.getTourBookings(tour.id);
        const tourData = {
          ...response.data,
          bookings: bookingsResponse.success ? bookingsResponse.data : []
        };
        
        console.log('🔍 Tour data for view:', tourData);
        console.log('  Italian fields in view data:');
        console.log('    title_it:', tourData.title_it);
        console.log('    description_it:', tourData.description_it);
        console.log('    short_description_it:', tourData.short_description_it);
        console.log('    location_it:', tourData.location_it);
        console.log('  Raw tour data keys:', Object.keys(tourData));
        console.log('  Full tour data:', JSON.stringify(tourData, null, 2));
        
        setEditingItem(tourData);
        setModalType('view');
        setShowModal(true);
      } else {
        showError(response.message || 'Failed to fetch tour details');
      }
    } catch (error) {
      console.error('❌ Error loading tour for view:', error);
      showError('Failed to fetch tour details');
    }
  };

  const handleEditTour = async (tour) => {
    try {
      console.log('🔍 Direct edit tour (no API call):', tour.id);
      console.log('🔍 Tour data from list:', tour);
      console.log('  Italian fields in list data:');
      console.log('    title_it:', tour.title_it);
      console.log('    description_it:', tour.description_it);
      console.log('    short_description_it:', tour.short_description_it);
      console.log('    location_it:', tour.location_it);
      console.log('  List data keys:', Object.keys(tour));
      
      // Use the tour data directly from the list (like BookManagement does)
      setEditingItem(tour);
      setModalType('edit');
      setShowModal(true);
    } catch (error) {
      console.error('❌ Error loading tour for edit:', error);
      showError('Failed to fetch tour details');
    }
  };

  const handleDeleteTour = async (tour) => {
    if (!window.confirm(`Are you sure you want to delete "${tour.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🔍 Starting tour deletion for tour:', tour);
      console.log('🔍 Tour ID:', tour.id);
      console.log('🔍 Calling adminService.deleteTour with ID:', tour.id);
      
      setRefreshing(true);
      const response = await adminService.deleteTour(tour.id);
      
      console.log('🔍 Delete response:', response);
      
      if (response.success) {
        showSuccess('Tour deleted successfully');
        await loadTours();
      } else {
        showError(response.message || 'Failed to delete tour');
      }
    } catch (error) {
      console.error('❌ Delete tour error:', error);
      showError('Failed to delete tour');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateTour = () => {
    setEditingItem(null);
    setModalType('create');
    setShowModal(true);
  };

  const handleSaveTour = async (tourData) => {
    try {
      setRefreshing(true);
      let response;
      
      if (editingItem && editingItem.id) {
        response = await adminService.updateTour(editingItem.id, tourData);
      } else {
        response = await adminService.createTour(tourData);
      }

      if (response.success) {
        showSuccess(editingItem ? 'Tour updated successfully' : 'Tour created successfully');
        setShowModal(false);
        setEditingItem(null);
        await loadTours();
      } else {
        showError(response.message || 'Failed to save tour');
      }
    } catch (error) {
      showError('Failed to save tour');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === tours.length && tours.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(tours.map(tour => tour.id)));
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
      case 'active':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#6b7280';
      case 'full':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const TourModal = () => {
    const [formData, setFormData] = useState(() => {
      const initialData = {
        // English fields
        title: editingItem?.title || '',
        description: editingItem?.description || '',
        short_description: editingItem?.short_description || '',
        location: editingItem?.location || '',
        
        // Italian fields
        title_it: editingItem?.title_it || '',
        description_it: editingItem?.description_it || '',
        short_description_it: editingItem?.short_description_it || '',
        location_it: editingItem?.location_it || '',
        
        // Common fields
        guide_name: editingItem?.guide_name || '',
        date: editingItem?.date ? new Date(editingItem.date).toISOString().slice(0, 10) : '',
        start_time: editingItem?.date ? new Date(editingItem.date).toISOString().slice(11, 16) : '',
        requirements: editingItem?.requirements || '',
        status: editingItem?.status || 'active',
        image: null
      };
      
      console.log('🔍 ToursManagement initial formData:', initialData);
      console.log('  Italian fields in initial data:');
      console.log('    title_it:', initialData.title_it);
      console.log('    description_it:', initialData.description_it);
      console.log('    short_description_it:', initialData.short_description_it);
      console.log('    location_it:', initialData.location_it);
      
      return initialData;
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
      if (editingItem) {
        console.log('🔍 ToursManagement loading editingItem:', editingItem);
        console.log('  English title:', editingItem.title);
        console.log('  Italian title:', editingItem.title_it);
        console.log('  English description:', editingItem.description);
        console.log('  Italian description:', editingItem.description_it);
        console.log('  English location:', editingItem.location);
        console.log('  Italian location:', editingItem.location_it);
        console.log('  All editingItem keys:', Object.keys(editingItem));
        
        console.log('🔍 ToursManagement setting formData from editingItem:', editingItem);
        console.log('  Italian fields from editingItem:');
        console.log('    title_it:', editingItem.title_it);
        console.log('    description_it:', editingItem.description_it);
        console.log('    short_description_it:', editingItem.short_description_it);
        console.log('    location_it:', editingItem.location_it);
        
        setFormData({
          // English fields
          title: editingItem.title || '',
          description: editingItem.description || '',
          short_description: editingItem.short_description || '',
          location: editingItem.location || '',
          
          // Italian fields
          title_it: editingItem.title_it || '',
          description_it: editingItem.description_it || '',
          short_description_it: editingItem.short_description_it || '',
          location_it: editingItem.location_it || '',
          
          // Common fields
          guide_name: editingItem.guide_name || '',
          date: editingItem.date ? new Date(editingItem.date).toISOString().slice(0, 10) : '',
          start_time: editingItem.date ? new Date(editingItem.date).toISOString().slice(11, 16) : '',
          requirements: editingItem.requirements || '',
          status: editingItem.status || 'active',
          image: null
        });
      }
    }, [editingItem]);

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      }

      if (!formData.date) {
        newErrors.date = 'Date is required';
      }

      if (!formData.start_time) {
        newErrors.start_time = 'Start time is required';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        // Combine date and start_time into a full datetime
        const dateTimeString = `${formData.date}T${formData.start_time}:00`;
        const submitData = {
          ...formData,
          date: new Date(dateTimeString).toISOString(),
          duration: 2 // Default duration in hours for backend compatibility
        };
        
        // Remove start_time from submit data since it's now part of date
        delete submitData.start_time;
        
        // Debug logging
        console.log('🔍 ToursManagement form submission:');
        console.log('  English title:', submitData.title);
        console.log('  Italian title:', submitData.title_it);
        console.log('  English description:', submitData.description);
        console.log('  Italian description:', submitData.description_it);
        console.log('  English location:', submitData.location);
        console.log('  Italian location:', submitData.location_it);
        console.log('  Short description:', submitData.short_description);
        console.log('  Short description (Italian):', submitData.short_description_it);
        console.log('  Combined datetime:', submitData.date);
        console.log('  Default duration:', submitData.duration, 'hours');
        console.log('  All submitData keys:', Object.keys(submitData));
        
        handleSaveTour(submitData);
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
              {modalType === 'view' ? 'View Tour' : 
               modalType === 'edit' ? 'Edit Tour' : 'Create New Tour'}
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
                  Title (English)
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
                  Title (Italian)
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748'
                }}>
                  {editingItem?.title_it || 'No Italian title available'}
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#718096'
                }}>
                  Description (English)
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748',
                  minHeight: '100px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {editingItem?.description}
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500,
                  color: '#718096'
                }}>
                  Description (Italian)
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#2d3748',
                  minHeight: '100px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {editingItem?.description_it || 'No Italian description available'}
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
                    Guide
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.guide_name || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Location (English)
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.location || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Location (Italian)
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.location_it || 'No Italian location available'}
                  </div>
                </div>
              </div>

              {/* Short Descriptions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Short Description (English)
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.short_description || 'No short description available'}
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Short Description (Italian)
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.short_description_it || 'No Italian short description available'}
                  </div>
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
                    Date
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.date ? new Date(editingItem.date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Start Time
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#2d3748'
                  }}>
                    {editingItem?.date ? new Date(editingItem.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    }) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Bookings */}
              {editingItem?.bookings && editingItem.bookings.length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    margin: '1rem 0 0.5rem 0',
                    color: '#2d3748'
                  }}>
                    Bookings ({editingItem.bookings.length})
                  </h4>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {editingItem.bookings.slice(0, 5).map((booking, index) => (
                      <div key={booking.id || index} style={{
                        padding: '0.75rem',
                        borderBottom: index < Math.min(editingItem.bookings.length, 5) - 1 ? 
                          '1px solid #e2e8f0' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ 
                            color: '#2d3748',
                            fontWeight: 500
                          }}>
                            {booking.user?.name || booking.guest_name || 'Guest'}
                          </div>
                          <div style={{ 
                            color: '#718096',
                            fontSize: '0.8rem'
                          }}>
                            {booking.user?.email || booking.guest_email || 'No email'}
                          </div>
                        </div>
                        <span style={{
                          background: booking.status === 'confirmed' ? '#10b98120' : '#f59e0b20',
                          color: booking.status === 'confirmed' ? '#10b981' : '#f59e0b',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: 500
                        }}>
                          {booking.status || 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    placeholder="Enter tour title"
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
                    Title (Italian)
                  </label>
                  <input
                    type="text"
                    value={formData.title_it}
                    onChange={(e) => handleInputChange('title_it', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter tour title in Italian"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem',
                      minHeight: '120px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter tour description"
                  />
                  {errors.description && (
                    <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {errors.description}
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
                    Description (Italian)
                  </label>
                  <textarea
                    value={formData.description_it}
                    onChange={(e) => handleInputChange('description_it', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#2d3748',
                      fontSize: '1rem',
                      minHeight: '120px',
                      resize: 'vertical'
                    }}
                    placeholder="Enter tour description in Italian"
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
                      Guide Name
                    </label>
                    <input
                      type="text"
                      value={formData.guide_name}
                      onChange={(e) => handleInputChange('guide_name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                      placeholder="Guide name"
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
                      placeholder="Tour location"
                    />
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
                      Location (Italian)
                    </label>
                    <input
                      type="text"
                      value={formData.location_it}
                      onChange={(e) => handleInputChange('location_it', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                      placeholder="Tour location in Italian"
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: 500,
                      color: '#718096'
                    }}>
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={formData.short_description}
                      onChange={(e) => handleInputChange('short_description', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                      placeholder="Short description"
                    />
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
                      Short Description (Italian)
                    </label>
                    <input
                      type="text"
                      value={formData.short_description_it}
                      onChange={(e) => handleInputChange('short_description_it', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                      placeholder="Short description in Italian"
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: 500,
                      color: '#718096'
                    }}>
                      Tour Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleInputChange('image', e.target.files[0])}
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
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.date ? '#ef4444' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                    />
                    {errors.date && (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {errors.date}
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
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.start_time ? '#ef4444' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        background: 'white',
                        color: '#2d3748',
                        fontSize: '1rem'
                      }}
                    />
                    {errors.start_time && (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {errors.start_time}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: 500,
                    color: '#718096'
                  }}>
                    Requirements
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
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
                    placeholder="Any special requirements for participants"
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
                      checked={formData.status === 'active'}
                      onChange={(e) => handleInputChange('status', e.target.checked ? 'active' : 'cancelled')}
                    />
                    Active Tour
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
                  {refreshing ? 'Saving...' : editingItem ? 'Update Tour' : 'Create Tour'}
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
        <LoadingSpinner size="lg" message="Loading tours..." />
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
          Tours Management
        </h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={loadTours}
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
            onClick={handleCreateTour}
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
            Add Tour
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
            placeholder="Search tours..."
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
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
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
          <option value="date:asc">Earliest First</option>
          <option value="date:desc">Latest First</option>
          <option value="title:asc">Title A-Z</option>
          <option value="title:desc">Title Z-A</option>
          <option value="created_at:desc">Newest First</option>
        </select>
      </div>

      {/* Tours List */}
      {refreshing ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <LoadingSpinner size="md" message="Loading tours..." />
        </div>
      ) : tours.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#718096'
        }}>
          <FaCalendarAlt style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No tours found</h4>
          <p>Create your first tour to get started.</p>
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
                      checked={selectedItems.size === tours.length && tours.length > 0}
                      onChange={handleSelectAll}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Tour
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Guide</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Schedule</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(tour.id)}
                          onChange={(e) => handleItemSelect(tour.id, e.target.checked)}
                        />
                        <div>
                          <div style={{ color: '#2d3748', fontWeight: 500 }}>
                            {tour.title}
                          </div>
                          <div style={{ color: '#718096', fontSize: '0.8rem' }}>
                            <FaMapMarkerAlt style={{ marginRight: '0.25rem' }} />
                            {tour.location || 'No location'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#718096' }}>
                      {tour.guide_name || 'TBD'}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#718096' }}>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div>
                          <FaCalendarAlt style={{ marginRight: '0.25rem' }} />
                          {tour.date ? new Date(tour.date).toLocaleDateString() : 'TBD'}
                        </div>
                        <div>
                          <FaClock style={{ marginRight: '0.25rem' }} />
                          {tour.date ? new Date(tour.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleViewTour(tour)}
                          style={{
                            background: '#4ecdff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="View Tour"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleEditTour(tour)}
                          style={{
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Edit Tour"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteTour(tour)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Delete Tour"
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

      {/* Tour Modal */}
      {showModal && <TourModal />}
    </div>
  );
};

export default ToursManagement; 