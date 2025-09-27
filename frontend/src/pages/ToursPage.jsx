import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import toursService from '../services/toursService';
import { FaSearch, FaFilter, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaUsers, FaDollarSign, FaStar, FaBookmark, FaShare, FaEye, FaTimes, FaSpinner, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ToursPage = () => {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();

  // Add CSS animations for scroll indicator
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateX(-50%) translateY(0);
        }
        40% {
          transform: translateX(-50%) translateY(-10px);
        }
        60% {
          transform: translateX(-50%) translateY(-5px);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // State management
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState(['all']);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const itemsPerPage = 12;

  // Load tours on component mount and when filters change
  useEffect(() => {
    loadTours();
  }, [currentPage, activeFilter, searchTerm, currentLanguage]);

  // Load tour categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Handle video loading with comprehensive debugging
  useEffect(() => {
    // First, test if the video file is accessible
    const testVideoAccess = async () => {
      try {
        console.log('🎥 Testing video file accessibility...');
        const response = await fetch('/background/tourbackground.mp4', { method: 'HEAD' });
        console.log('🎥 Video file response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          console.error('🎥 Video file not accessible:', response.status, response.statusText);
          setVideoError(true);
          return;
        }
      } catch (error) {
        console.error('🎥 Error testing video file access:', error);
        setVideoError(true);
        return;
      }
    };

    testVideoAccess();

    const video = document.querySelector('video');
    if (video) {
      console.log('🎥 Video element found:', video);
      console.log('🎥 Video src:', video.src);
      console.log('🎥 Video readyState:', video.readyState);
      console.log('🎥 Video networkState:', video.networkState);
      
      // Set up comprehensive video event listeners
      const handleLoadStart = () => {
        console.log('🎥 Video load started');
        setVideoLoaded(false);
        setVideoError(false);
      };

      const handleLoadedMetadata = () => {
        console.log('🎥 Video metadata loaded');
        console.log('🎥 Video duration:', video.duration);
        console.log('🎥 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('🎥 Video opacity:', video.style.opacity);
        console.log('🎥 Video visibility:', video.style.visibility);
        setVideoLoaded(true);
        setVideoError(false);
      };

      const handleCanPlay = () => {
        console.log('🎥 Video can play');
        setVideoLoaded(true);
        setVideoError(false);
      };

      const handleCanPlayThrough = () => {
        console.log('🎥 Video can play through');
        setVideoLoaded(true);
        setVideoError(false);
      };

      const handleError = (e) => {
        console.error('🎥 Video error:', e);
        console.error('🎥 Video error details:', {
          code: video.error?.code,
          message: video.error?.message,
          networkState: video.networkState,
          readyState: video.readyState
        });
        setVideoError(true);
        setVideoLoaded(false);
      };

      const handleWaiting = () => {
        console.log('🎥 Video waiting for data');
        setVideoLoaded(false);
      };

      const handleStalled = () => {
        console.log('🎥 Video stalled');
        setVideoLoaded(false);
      };

      const handleSuspend = () => {
        console.log('🎥 Video suspended');
      };

      const handleAbort = () => {
        console.log('🎥 Video load aborted');
        setVideoError(true);
        setVideoLoaded(false);
      };

      // Add all event listeners
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('error', handleError);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('stalled', handleStalled);
      video.addEventListener('suspend', handleSuspend);
      video.addEventListener('abort', handleAbort);

      // Try to load the video manually
      setTimeout(() => {
        console.log('🎥 Attempting to load video manually...');
        video.load();
      }, 100);

      // Cleanup
      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('error', handleError);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('stalled', handleStalled);
        video.removeEventListener('suspend', handleSuspend);
        video.removeEventListener('abort', handleAbort);
      };
    } else {
      console.error('🎥 Video element not found!');
    }
  }, []);

  const loadTours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        category: activeFilter !== 'all' ? activeFilter : '',
        search: searchTerm,
        lang: currentLanguage || 'en'  // Add language parameter
      };

      const response = await toursService.getTours(params);
      
      console.log('🔍 ToursPage - API response:', response);
      console.log('🔍 ToursPage - Current language:', currentLanguage);
      console.log('🔍 ToursPage - API params:', params);
      
      if (response.success) {
        const tours = response.data || [];
        console.log('🔍 ToursPage - Tours data:', tours);
        if (tours.length > 0) {
          console.log('🔍 ToursPage - First tour language fields:');
          console.log('    English title:', tours[0].title);
          console.log('    Italian title:', tours[0].title_it);
          console.log('    English description:', tours[0].description?.substring(0, 50) + '...');
          console.log('    Italian description:', tours[0].description_it?.substring(0, 50) + '...');
          console.log('    English location:', tours[0].location);
          console.log('    Italian location:', tours[0].location_it);
          console.log('    English short_description:', tours[0].short_description);
          console.log('    Italian short_description:', tours[0].short_description_it);
          console.log('  🔍 Language detection logic:');
          console.log('    currentLanguage:', currentLanguage);
          console.log('    Should show Italian title?', currentLanguage === 'it' && tours[0].title_it);
          console.log('    Will display title:', currentLanguage === 'it' && tours[0].title_it ? tours[0].title_it : tours[0].title);
        }
        setTours(tours);
        setTotalPages(response.meta?.pages || 1);
      } else {
        setError(response.message || t('tours.messages.failedToLoad'));
        setTours([]);
      }
    } catch (err) {
      console.error('Error loading tours:', err);
      setError(t('tours.messages.failedToLoad'));
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await toursService.getTourCategories();
      if (response.success) {
        // Ensure 'all' is only added once and remove duplicates
        const uniqueCategories = ['all', ...new Set(response.data)];
        setCategories(uniqueCategories);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      // Set default categories if API fails
      setCategories(['all']);
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

  const handleBookTour = (tour) => {
    navigate(`/tours/${tour.id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <FaSpinner style={{ 
          fontSize: '2rem', 
          color: 'var(--primary-teal)', 
          animation: 'spin 1s linear infinite' 
        }} />
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'var(--gradient-secondary)'
    }}>
      {/* Hero Section with Video Background */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        {/* Fallback Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -3,
          opacity: videoLoaded ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }} />

        {/* Video Loading Indicator */}
        {!videoLoaded && !videoError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 4,
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <FaSpinner style={{ 
              fontSize: '2rem', 
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem',
              display: 'block'
            }} />
            Loading Video...
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
              If video doesn't load, click to play manually
            </div>
          </div>
        )}

        {/* Manual Play Button */}
        {(videoError || (!videoLoaded && !loading)) && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 4,
            textAlign: 'center'
          }}>
            <button
              onClick={() => {
                const video = document.querySelector('video');
                if (video) {
                  video.load(); // Reload the video
                  video.play().then(() => {
                    console.log('Video started playing manually');
                    setVideoLoaded(true);
                    setVideoError(false);
                  }).catch(e => {
                    console.error('Manual play failed:', e);
                    setVideoError(true);
                  });
                }
              }}
              style={{
                padding: '1rem 2rem',
                background: 'var(--primary-teal)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ▶ {videoError ? 'Retry Video' : 'Play Video'}
            </button>
            <div style={{ 
              color: 'white', 
              fontSize: '0.9rem', 
              marginTop: '0.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              {videoError 
                ? 'Video failed to load. Click to retry.' 
                : 'Click to start video background'
              }
            </div>
            <div style={{ 
              color: 'white', 
              fontSize: '0.8rem', 
              marginTop: '0.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              opacity: 0.8
            }}>
              Debug: Video loaded: {videoLoaded ? 'Yes' : 'No'}, Error: {videoError ? 'Yes' : 'No'}
            </div>
          </div>
        )}

        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            opacity: videoLoaded ? 1 : 0.8, // Show video even if loading state is unclear
            transition: 'opacity 0.5s ease-in-out'
          }}
          onLoadStart={() => {
            console.log('Video loading started');
            setVideoLoaded(false);
            setVideoError(false);
          }}
          onLoadedMetadata={() => {
            console.log('Video metadata loaded');
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onCanPlay={() => {
            console.log('Video can play');
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onError={(e) => {
            console.error('Video error:', e);
            setVideoError(true);
            setVideoLoaded(false);
          }}
          onWaiting={() => {
            console.log('Video waiting');
            setVideoLoaded(false);
          }}
          onStalled={() => {
            console.log('Video stalled');
            setVideoLoaded(false);
          }}
        >
          <source src="/background/tourbackground.mp4" type="video/mp4" />
          <source src="./background/tourbackground.mp4" type="video/mp4" />
          <source src="background/tourbackground.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.3) 100%)',
          zIndex: 2
        }} />

        {/* Content */}
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          padding: '2rem',
          position: 'relative',
          zIndex: 3
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            color: 'white',
            marginBottom: '1rem',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            lineHeight: 1.2
          }}>
            {t('tours.title')}
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 500,
            lineHeight: 1.6,
            marginBottom: '2rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            {t('tours.subtitle')}
          </p>
          
          {/* Call to Action Button */}
          <button
            onClick={() => {
              document.getElementById('tours-grid').scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
            style={{
              padding: '1rem 2rem',
              background: 'var(--primary-teal)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
            }}
          >
            {t('tours.exploreTours')}
          </button>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          animation: 'bounce 2s infinite'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid rgba(255, 255, 255, 0.7)',
            borderTop: 'none',
            borderLeft: 'none',
            transform: 'rotate(45deg)',
            cursor: 'pointer'
          }} 
          onClick={() => {
            document.getElementById('tours-grid').scrollIntoView({ 
              behavior: 'smooth' 
            });
          }}
          />
        </div>
      </section>

      {/* Filters and Search */}
      <section style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              position: 'relative',
              flex: '1',
              minWidth: '300px'
            }}>
              <FaSearch style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
                fontSize: '1rem'
              }} />
              <input
                type="text"
                placeholder={t('tours.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  background: 'white',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            </div>
          </div>

          {/* Category Filters */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            {categories.map((category, index) => (
              <button
                key={`category-${category}-${index}`}
                onClick={() => handleFilterChange(category)}
                style={{
                  padding: '0.5rem 1rem',
                  border: activeFilter === category 
                    ? '2px solid var(--primary-teal)' 
                    : '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-full)',
                  background: activeFilter === category 
                    ? 'var(--primary-teal)' 
                    : 'white',
                  color: activeFilter === category 
                    ? 'white' 
                    : 'var(--gray-700)',
                  fontSize: '0.9rem',
                  fontWeight: activeFilter === category ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  textTransform: 'capitalize'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tours Grid */}
      <section id="tours-grid" style={{ padding: '0 2rem 4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {error ? (
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
                onClick={loadTours}
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
                {t('tours.tryAgain')}
              </button>
            </div>
          ) : tours.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <FaCalendarAlt style={{ 
                fontSize: '3rem', 
                color: 'var(--gray-400)', 
                marginBottom: '1rem' 
              }} />
              <h3 style={{
                fontSize: '1.5rem',
                color: 'var(--gray-700)',
                marginBottom: '0.5rem'
              }}>
                {t('tours.noToursFound')}
              </h3>
              <p style={{ color: 'var(--gray-600)' }}>
                {searchTerm || activeFilter !== 'all' 
                  ? t('tours.tryAdjustingFilters')
                  : t('tours.toursComingSoon')
                }
              </p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
              }}>
                {tours.map(tour => (
                  <div
                    key={tour.id}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: 'var(--radius-2xl)',
                      overflow: 'hidden',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      border: '1px solid rgba(0, 191, 174, 0.1)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 191, 174, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(0, 191, 174, 0.1)';
                    }}
                  >
                    {/* Tour Image */}
                    <div style={{
                      height: '220px',
                      background: tour.image_url || tour.thumbnail 
                        ? `url(${tour.image_url || tour.thumbnail})` 
                        : 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Gradient Overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)'
                      }} />
                      
                      {/* Status Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: tour.status === 'active' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }}>
                        {tour.status === 'active' ? 'Available' : 'Unavailable'}
                      </div>
                      
                      {/* Tour Type Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'rgba(0, 191, 174, 0.9)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0, 191, 174, 0.3)'
                      }}>
                        {tour.tour_type || 'Tour'}
                      </div>
                    </div>

                    {/* Tour Info */}
                    <div style={{ padding: '2rem' }}>
                      <h3 style={{
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: 'var(--gray-900)',
                        marginBottom: '0.75rem',
                        lineHeight: '1.3',
                        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        {currentLanguage === 'it' && tour.title_it ? tour.title_it : tour.title}
                      </h3>
                      
                      <p style={{
                        color: 'var(--gray-600)',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        marginBottom: '1.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {currentLanguage === 'it' && tour.short_description_it 
                          ? tour.short_description_it 
                          : tour.short_description || tour.description?.substring(0, 120) + '...'}
                      </p>

                      {/* Tour Details */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        marginBottom: '2rem',
                        padding: '1.25rem',
                        background: 'linear-gradient(135deg, rgba(0, 191, 174, 0.05) 0%, rgba(0, 191, 174, 0.02) 100%)',
                        borderRadius: 'var(--radius-xl)',
                        border: '1px solid rgba(0, 191, 174, 0.1)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.95rem',
                          color: 'var(--gray-700)',
                          fontWeight: '500'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.8rem'
                          }}>
                            <FaMapMarkerAlt />
                          </div>
                          {currentLanguage === 'it' && tour.location_it ? tour.location_it : tour.location}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.95rem',
                          color: 'var(--gray-700)',
                          fontWeight: '500'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.8rem'
                          }}>
                            <FaCalendarAlt />
                          </div>
                          {formatDate(tour.date)}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.95rem',
                          color: 'var(--gray-700)',
                          fontWeight: '500'
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.8rem'
                          }}>
                            <FaClock />
                          </div>
                          {new Date(tour.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                      </div>

                      {/* Book Now Button */}
                      <button
                        onClick={() => handleBookTour(tour)}
                        disabled={tour.status !== 'active'}
                        style={{
                          width: '100%',
                          padding: '1rem 1.5rem',
                          background: tour.status === 'active' 
                            ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)'
                            : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-xl)',
                          fontSize: '1rem',
                          fontWeight: '700',
                          cursor: tour.status === 'active' ? 'pointer' : 'not-allowed',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: tour.status === 'active' 
                            ? '0 8px 25px rgba(15, 118, 110, 0.3)'
                            : '0 4px 15px rgba(0, 0, 0, 0.1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          if (tour.status === 'active') {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 35px rgba(15, 118, 110, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (tour.status === 'active') {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(15, 118, 110, 0.3)';
                          }
                        }}
                      >
                        <span>{tour.status === 'active' ? t('tours.bookNow') : 'Unavailable'}</span>
                        {tour.status === 'active' && <FaArrowRight style={{ fontSize: '0.9rem' }} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '0.75rem 1rem',
                        border: currentPage === page 
                          ? '2px solid var(--primary-teal)' 
                          : '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        background: currentPage === page 
                          ? 'var(--primary-teal)' 
                          : 'white',
                        color: currentPage === page 
                          ? 'white' 
                          : 'var(--gray-700)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ToursPage;