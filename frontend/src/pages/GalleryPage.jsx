import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { apiCall } from '../config/api';
import { FaSearch, FaFilter, FaHeart, FaEye, FaDownload, FaTimes, FaPlay, FaPause, FaExpand, FaShareAlt, FaStar, FaImages, FaVideo, FaCamera, FaGlobe, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const GalleryPage = () => {
  const { t } = useLanguage();
  
  // State management
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [likedMedia, setLikedMedia] = useState(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState(['all']);
  const itemsPerPage = 12;

  // Gallery stats data (calculated from state)
  const stats = [
    { 
      icon: FaImages, 
      number: galleryItems.length, 
      label: t('gallery.totalPhotos') || 'Total Photos'
    },
    { 
      icon: FaEye, 
      number: galleryItems.reduce((total, item) => total + (item.views || 0), 0), 
      label: t('gallery.totalViews') || 'Total Views'
    },
    { 
      icon: FaHeart, 
      number: galleryItems.reduce((total, item) => total + (item.likes || 0), 0), 
      label: t('gallery.totalLikes') || 'Total Likes'
    },
    { 
      icon: FaCamera, 
      number: categories.length - 1, 
      label: t('gallery.categories') || 'Categories'
    }
  ];

  // Set dynamic page title
  useEffect(() => {
    document.title = `${t('gallery.title')} - DoggoDaily`;
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'DoggoDaily - Dog & Italy Adventures';
    };
  }, [t]);

  // Load gallery items on component mount and when filters change
  useEffect(() => {
    loadGalleryItems();
  }, [currentPage, activeFilter, searchTerm]);

  // Load gallery categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        category: activeFilter !== 'all' ? activeFilter : '',
        search: searchTerm
      };

      console.log('🔍 Loading gallery items with params:', params);
      const response = await apiCall('/api/admin/public/gallery', 'GET', params);
      
      if (response.success) {
        // Map backend data to frontend format
        const mappedItems = (response.data || []).map(item => {
          console.log('🔍 Gallery item data:', item);
          console.log('🔍 File URL:', item.file_url);
          console.log('🔍 File path:', item.file_path);
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            src: item.file_url || item.file_path,
            thumbnail: item.thumbnail_url || item.file_url || item.file_path,
            type: item.file_type === 'image' ? 'image' : 'video',
            category: item.category,
            tags: Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',').filter(t => t.trim()),
            likes: item.likes || 0,
            views: item.views || 0,
            photographer: item.photographer || 'Unknown',
            location: item.location || 'Unknown',
            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown',
            featured: false, // Backend doesn't have this field
            duration: item.duration || null
          };
        });
        setGalleryItems(mappedItems);
        setTotalPages(response.meta?.pages || 1);
        
        // Check like status for each item
        checkLikeStatuses(mappedItems);
      } else {
        setError(response.message || 'Failed to load gallery');
        setGalleryItems([]);
      }
    } catch (err) {
      console.error('Error loading gallery:', err);
      setError('Failed to load gallery');
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };


  const loadCategories = async () => {
    try {
      console.log('🔍 Loading gallery categories...');
      const response = await apiCall('/api/admin/public/gallery/categories', 'GET');
      if (response.success) {
        setCategories(['all', ...response.data]);
        console.log('✅ Categories loaded:', response.data);
      } else {
        console.log('⚠️ Using default categories due to API error');
        setCategories(['all', 'facilities', 'grooming', 'training', 'events', 'moments']);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      console.log('⚠️ Using default categories due to error');
      setCategories(['all', 'facilities', 'grooming', 'training', 'events', 'moments']);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const checkLikeStatuses = async (items) => {
    try {
      const likedItems = new Set();
      
      // Check like status for each item
      for (const item of items) {
        try {
          const response = await apiCall(`/api/admin/public/gallery/${item.id}/like-status`, 'GET');
          if (response.success && response.data?.liked) {
            likedItems.add(item.id);
          }
        } catch (err) {
          console.warn(`Failed to check like status for item ${item.id}:`, err);
        }
      }
      
      setLikedMedia(likedItems);
    } catch (err) {
      console.error('Error checking like statuses:', err);
    }
  };

  const handleLike = async (itemId) => {
    try {
      const response = await apiCall(`/api/admin/public/gallery/${itemId}/like`, 'POST');
      if (response.success) {
        // Update local liked state based on response
        const newLikedMedia = new Set(likedMedia);
        if (response.data?.liked) {
          newLikedMedia.add(itemId);
        } else {
          newLikedMedia.delete(itemId);
        }
        setLikedMedia(newLikedMedia);
        
        // Update the item in the gallery with the new like count
        setGalleryItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { ...item, likes: response.data?.likes || item.likes }
              : item
          )
        );
        
        // Show success message
        if (response.data?.liked) {
          toast.success('Liked! ❤️');
        } else {
          toast.success('Like removed');
        }
      } else {
        toast.error(response.message || 'Failed to update like');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Failed to update like');
    }
  };

  const handleView = async (item) => {
    // Increment view count
    try {
      await apiCall(`/api/admin/public/gallery/${item.id}/view`, 'POST');
      
      // Update local view count
      setGalleryItems(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, views: (prevItem.views || 0) + 1 }
            : prevItem
        )
      );
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
    
    setSelectedMedia(item);
  };

  // All data now comes from backend - no mock data needed

  // Gallery Categories (simplified since backend handles filtering)
  const galleryCategories = categories.map(cat => ({
    id: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    icon: cat === 'all' ? FaImages : 
          cat === 'facilities' ? FaCamera :
          cat === 'grooming' ? FaStar :
          cat === 'training' ? FaHeart :
          cat === 'events' ? FaGlobe :
          FaImages
  }));

  const openModal = (media) => {
    handleView(media); // This will increment views and set selected media
    setIsPlaying(false);
  };

  const closeModal = () => {
    setSelectedMedia(null);
    setIsPlaying(false);
  };

  return (
    <div style={{ 
      width: '100vw',
      maxWidth: '100vw',
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'var(--gradient-secondary)',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }
        
        /* AGGRESSIVE MOBILE CONSTRAINTS */
        @media (max-width: 768px) {
          * {
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          
          body, html {
            overflow-x: hidden !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
        }
        
        .uniform-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          align-items: start;
        }
        
        @media (max-width: 1024px) {
          .uniform-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.25rem;
          }
        }
        
        @media (max-width: 768px) {
          .uniform-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
          }
        }
        
        @media (max-width: 640px) {
          .uniform-grid {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          
          .uniform-item {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          
          .uniform-card {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
        }
        
        @media (max-width: 480px) {
          .uniform-grid {
            grid-template-columns: 1fr !important;
            gap: 0.25rem !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          
          .uniform-item {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          
          .uniform-card {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
        }
        
        @media (max-width: 360px) {
          .uniform-grid {
            grid-template-columns: 1fr !important;
            gap: 0.125rem !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          
          .uniform-item {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          
          .uniform-card {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
        }
        
        .uniform-item {
          transform: translateY(20px);
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .uniform-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .uniform-media-container {
          height: 250px;
          overflow: hidden;
          position: relative;
        }
        
        @media (max-width: 1024px) {
          .uniform-media-container {
            height: 220px;
          }
        }
        
        @media (max-width: 768px) {
          .uniform-media-container {
            height: 200px;
          }
        }
        
        @media (max-width: 640px) {
          .uniform-media-container {
            height: 180px;
          }
        }
        
        @media (max-width: 480px) {
          .uniform-media-container {
            height: 160px;
          }
        }
        
        @media (max-width: 360px) {
          .uniform-media-container {
            height: 140px;
          }
        }
        
        .uniform-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .uniform-item:nth-child(1) { animation-delay: 0.1s; }
        .uniform-item:nth-child(2) { animation-delay: 0.15s; }
        .uniform-item:nth-child(3) { animation-delay: 0.2s; }
        .uniform-item:nth-child(4) { animation-delay: 0.25s; }
        .uniform-item:nth-child(5) { animation-delay: 0.3s; }
        .uniform-item:nth-child(6) { animation-delay: 0.35s; }
        .uniform-item:nth-child(7) { animation-delay: 0.4s; }
        .uniform-item:nth-child(8) { animation-delay: 0.45s; }
        .uniform-item:nth-child(9) { animation-delay: 0.5s; }
        .uniform-item:nth-child(10) { animation-delay: 0.55s; }
        .uniform-item:nth-child(11) { animation-delay: 0.6s; }
        .uniform-item:nth-child(12) { animation-delay: 0.65s; }
        
        .modal-backdrop {
          backdrop-filter: blur(20px);
          background: rgba(0, 0, 0, 0.8);
        }
        
        .modal-content {
          transform: scale(0.9);
          opacity: 0;
          animation: modalEnter 0.3s ease-out forwards;
        }
        
        @keyframes modalEnter {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .filter-btn {
          transition: all 0.3s ease;
        }
        
        .filter-btn:hover {
          transform: translateY(-2px);
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .section-padding {
            padding: 2rem 1rem !important;
          }
          
          .gallery-section {
            padding: 1rem 0 !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          
          .gallery-section > div {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100vw !important;
            width: 100vw !important;
            box-sizing: border-box !important;
          }
        }
        
        @media (max-width: 480px) {
          .section-padding {
            padding: 1.5rem 0.75rem !important;
          }
          
          .hero-section {
            padding: 2rem 1rem !important;
          }
          
          .search-filter-section {
            padding: 2rem 1rem !important;
          }
          
          .gallery-section {
            padding: 0.5rem 0 !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          
          .gallery-section > div {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100vw !important;
            width: 100vw !important;
            box-sizing: border-box !important;
          }
        }
        
        @media (max-width: 360px) {
          .section-padding {
            padding: 1rem 0.5rem !important;
          }
          
          .hero-section {
            padding: 1.5rem 0.75rem !important;
          }
          
          .search-filter-section {
            padding: 1.5rem 0.75rem !important;
          }
          
          .gallery-section {
            padding: 0.25rem 0 !important;
            margin: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          
          .gallery-section > div {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100vw !important;
            width: 100vw !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hero-section" style={{
        padding: '4rem 2rem',
        background: 'var(--gradient-hero)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="animate-fade-in-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <FaCamera style={{
              fontSize: '3rem',
              color: 'var(--primary-teal)',
              opacity: 0.8
            }} />
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              {t('gallery.title')}
            </h1>
            <FaImages style={{
              fontSize: '3rem',
              color: 'var(--primary-blue)',
              opacity: 0.8
            }} />
          </div>
          
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: 'var(--gray-600)',
            fontWeight: 500,
            lineHeight: 1.6,
            marginBottom: '3rem'
          }}>
            {t('gallery.description')}
          </p>

          {/* Gallery Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '2rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {stats.map((stat, index) => (
              <div key={index} className="card hover-lift" style={{
                padding: '1.5rem 1rem',
                textAlign: 'center',
                animationDelay: `${index * 0.1}s`
              }}>
                <stat.icon style={{
                  fontSize: '2rem',
                  color: 'var(--primary-teal)',
                  marginBottom: '0.5rem'
                }} />
                <div style={{
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                  fontWeight: 800,
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '0.25rem'
                }}>
                  {stat.number}
                </div>
                <p style={{
                  color: 'var(--gray-600)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  margin: 0
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="search-filter-section" style={{
        padding: '3rem 2rem',
        background: 'var(--gradient-card)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 191, 174, 0.2)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Search Bar */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 3rem auto',
            position: 'relative'
          }}>
            <div style={{
              position: 'relative',
              background: 'var(--gradient-card)',
              borderRadius: 'var(--radius-2xl)',
              border: '1px solid rgba(0, 191, 174, 0.2)',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(10px)'
            }}>
              <FaSearch style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
                fontSize: '1.1rem'
              }} />
              <input
                type="text"
                placeholder={t('gallery.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem 1rem 3.5rem',
                  border: 'none',
                  borderRadius: 'var(--radius-2xl)',
                  background: 'transparent',
                  fontSize: '1rem',
                  color: 'var(--gray-800)',
                  outline: 'none',
                  fontFamily: 'Poppins, sans-serif'
                }}
              />
            </div>
          </div>


          {/* Category Filters */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'clamp(0.5rem, 2vw, 1rem)',
            padding: '0 0.5rem'
          }}>
            {galleryCategories.map((cat) => (
          <button
                key={cat.id}
                onClick={() => handleFilterChange(cat.id)}
                className="filter-btn"
                style={{
                  background: activeFilter === cat.id 
                    ? 'var(--gradient-primary)' 
                    : 'var(--gradient-card)',
                  color: activeFilter === cat.id ? 'white' : 'var(--gray-700)',
                  border: activeFilter === cat.id 
                    ? 'none' 
                    : '1px solid rgba(0, 191, 174, 0.2)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1.5rem)',
                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backdropFilter: 'blur(10px)',
                                    boxShadow: activeFilter === cat.id
                    ? 'var(--shadow-glow)' 
                    : 'var(--shadow-md)',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                <cat.icon style={{ fontSize: '0.9rem' }} />
                {cat.label}
                <span style={{
                  background: activeFilter === cat.id 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(0, 191, 174, 0.1)',
                  color: activeFilter === cat.id ? 'white' : 'var(--primary-teal)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {/* Count removed since backend handles it */}
                </span>
          </button>
        ))}
      </div>

          {/* Results Count */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            color: 'var(--gray-600)',
            fontSize: '0.95rem'
          }}>
                            {loading ? t('common.loading') : t('gallery.showingResults', { count: galleryItems.length })}
            {searchTerm && ` ${t('gallery.forSearch')} "${searchTerm}"`}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="gallery-section" style={{
        padding: '4rem 2rem',
        background: 'var(--gradient-secondary)',
        width: '100vw',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          width: '100%',
          padding: '0',
          boxSizing: 'border-box'
        }}>
                      {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
              }}>
                <FaSpinner style={{
                  fontSize: '2rem',
                  color: 'var(--primary-teal)',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : error ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--red-600)',
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{error}</p>
                <button
                  onClick={loadGalleryItems}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--primary-teal)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
{t('common.tryAgain')}
                </button>
              </div>
            ) : galleryItems.length > 0 ? (
            <>
              <div className="uniform-grid">
                {galleryItems.map((media, index) => (
                  <div key={media.id} className="uniform-item">
                    <div
                      className="uniform-card hover-lift"
                      style={{
                        background: 'var(--gradient-card)',
                        borderRadius: 'var(--radius-2xl)',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: 'var(--shadow-lg)',
                        backdropFilter: 'blur(20px)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        position: 'relative'
                      }}
                      onClick={() => openModal(media)}
                    >
                      {/* Featured Badge */}
                      {media.featured && (
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: 'var(--gradient-primary)',
                          color: 'white',
                          padding: '0.5rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px'
                        }}>
                          <FaStar />
                        </div>
                      )}

                      {/* Media Container - Fixed Height */}
                      <div className="uniform-media-container" style={{
                        backgroundImage: `url(${media.thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}>
                        {/* Debug info */}
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          left: '0.5rem',
                          background: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          zIndex: 10
                        }}>
                          {media.type} - {media.src ? 'Has URL' : 'No URL'}
                        </div>
                        
                        {/* Media display - image or video thumbnail */}
                        {(media.type === 'image' || media.type === 'video') && (
                          <img 
                            src={media.thumbnail || media.src} 
                            alt={media.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                            onError={(e) => {
                              console.error('❌ Media failed to load:', e.target.src);
                              console.error('📋 Media data:', media);
                            }}
                            onLoad={() => {
                              console.log('✅ Media loaded successfully:', media.thumbnail || media.src);
                            }}
                          />
                        )}
                        {/* Video Play Button */}
                        {media.type === 'video' && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '50%',
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            transition: 'var(--transition-base)'
                          }}>
                            <FaPlay style={{
                              color: 'white',
                              fontSize: '1.5rem',
                              marginLeft: '3px'
                            }} />
                          </div>
                        )}

                        {/* Video Label */}
                        {media.type === 'video' && (
                          <div style={{
                            position: 'absolute',
                            top: '1rem',
                            left: '1rem',
                            background: 'var(--gradient-primary)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <FaVideo style={{ fontSize: '0.6rem' }} />
{t('gallery.video')}
                          </div>
                        )}

                        {/* Duration Badge for Videos */}
                        {media.duration && (
                          <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            right: '1rem',
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)'
                          }}>
                            {media.duration}
                          </div>
                        )}

                        {/* Overlay Gradient */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4))',
                          opacity: 0,
                          transition: 'var(--transition-base)'
                        }} className="media-overlay" />
                      </div>

                      {/* Media Info - Flexible Content */}
                      <div className="uniform-content" style={{ padding: '1.5rem' }}>
                        <div>
                          <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: 'var(--gray-900)',
                            marginBottom: '0.5rem',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {media.title}
                          </h3>

                          <p style={{
                            color: 'var(--gray-600)',
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            marginBottom: '1rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {media.description}
                          </p>

                          {/* Tags */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                          }}>
                            {media.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} style={{
                                background: 'rgba(0, 191, 174, 0.1)',
                                color: 'var(--primary-teal)',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Media Stats */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 'auto'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center'
                          }}>
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: likedMedia.has(media.id) ? '#ff6b6b' : 'var(--gray-500)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                transition: 'var(--transition-base)'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(media.id);
                              }}
                            >
                              <FaHeart />
                              <span>{media.likes}</span>
                            </button>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: 'var(--gray-500)',
                              fontSize: '0.85rem'
                            }}>
                              <FaEye />
                              <span>{media.views}</span>
                            </div>
                          </div>

                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--gray-500)'
                          }}>
                            {media.photographer}
                          </div>
                        </div>
                      </div>

                      <style>{`
                        .hover-lift:hover .media-overlay {
                          opacity: 1;
                        }
                        .hover-lift:hover .uniform-media-container::after {
                          content: "${media.type === 'video' ? 'CLICK TO WATCH' : 'CLICK TO VIEW'}";
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          color: white;
                          font-weight: 700;
                          font-size: 0.9rem;
                          background: rgba(0, 0, 0, 0.8);
                          padding: 0.5rem 1rem;
                          border-radius: var(--radius-full);
                          backdrop-filter: blur(10px);
                          z-index: 3;
                        }
                      `}</style>
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
                  marginTop: '4rem'
                }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      background: currentPage === 1 ? 'var(--gray-200)' : 'var(--gradient-primary)',
                      color: currentPage === 1 ? 'var(--gray-400)' : 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      padding: '0.75rem 1.5rem',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      transition: 'var(--transition-base)'
                    }}
                  >
{t('common.previous')}
                  </button>

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            background: currentPage === page ? 'var(--gradient-primary)' : 'var(--gradient-card)',
                            color: currentPage === page ? 'white' : 'var(--gray-700)',
                            border: '1px solid rgba(0, 191, 174, 0.2)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'var(--transition-base)',
                            minWidth: '40px'
                          }}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      background: currentPage === totalPages ? 'var(--gray-200)' : 'var(--gradient-primary)',
                      color: currentPage === totalPages ? 'var(--gray-400)' : 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      padding: '0.75rem 1.5rem',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      transition: 'var(--transition-base)'
                    }}
                  >
{t('common.next')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: 'var(--gray-600)'
            }}>
              <FaSearch style={{
                fontSize: '4rem',
                marginBottom: '2rem',
                opacity: 0.5
              }} />
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                {t('gallery.noResults')}
              </h3>
              <p>{t('gallery.adjustSearch')}</p>
            </div>
          )}
      </div>
    </section>

      {/* Modal */}
      {selectedMedia && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={closeModal}
        >
          <div
            className="modal-content"
            style={{
              background: 'var(--gradient-card)',
              borderRadius: 'var(--radius-2xl)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: 'var(--shadow-2xl)',
              backdropFilter: 'blur(20px)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2rem',
                zIndex: 10,
                backdropFilter: 'blur(10px)'
              }}
            >
              <FaTimes />
            </button>

            {/* Media Display */}
            <div style={{
              width: '100%',
              maxHeight: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#000',
              position: 'relative'
            }}>
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.src}
                  alt={selectedMedia.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <>
                  <video
                    src={selectedMedia.src}
                    controls
                    autoPlay
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                  {/* Video Type Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <FaVideo />
{t('gallery.hdVideo')}
                  </div>
                </>
              )}
            </div>

            {/* Media Info */}
            <div style={{ padding: '2rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)',
                    marginBottom: '0.5rem'
                  }}>
                    {selectedMedia.title}
                  </h2>
                  <p style={{
                    color: 'var(--gray-600)',
                    lineHeight: 1.6
                  }}>
                    {selectedMedia.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={() => handleLike(selectedMedia.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: likedMedia.has(selectedMedia.id) ? '#ff6b6b' : 'var(--gray-500)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'var(--transition-base)'
                    }}
                  >
                    <FaHeart style={{ fontSize: '1.2rem' }} />
                    <span>{selectedMedia.likes}</span>
                  </button>

                  <button
                    style={{
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-lg)',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'var(--transition-base)'
                    }}
                  >
                    <FaShareAlt />
{t('common.share')}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {selectedMedia.tags.map((tag, index) => (
                  <span key={index} style={{
                    background: 'rgba(0, 191, 174, 0.1)',
                    color: 'var(--primary-teal)',
                    padding: '0.3rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Media Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                fontSize: '0.9rem',
                color: 'var(--gray-600)'
              }}>
                <div>
                  <strong>{t('gallery.photographer')}:</strong> {selectedMedia.photographer}
                </div>
                <div>
                  <strong>{t('gallery.location')}:</strong> {selectedMedia.location}
                </div>
                <div>
                  <strong>{t('gallery.date')}:</strong> {selectedMedia.date}
                </div>
                <div>
                  <strong>{t('gallery.views')}:</strong> {selectedMedia.views}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage; 