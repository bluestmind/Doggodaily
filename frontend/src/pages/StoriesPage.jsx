import React, { useState, useEffect } from 'react';
import { FaHeart, FaPaw, FaStar, FaQuoteLeft, FaMapMarkerAlt, FaClock, FaUser, FaPlay, FaArrowRight, FaBookOpen, FaGlobe, FaAward, FaBone, FaUpload, FaTimes, FaThumbsUp, FaReply, FaComment, FaShare, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getFileUrl, apiCall } from '../config/api';

const StoriesPage = () => {
  const navigate = useNavigate();
  const { t, currentLanguage } = useLanguage();
  const [activeStory, setActiveStory] = useState(0);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [likedStories, setLikedStories] = useState(new Set());
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleLike = async (storyId) => {
    try {
      if (likedStories.has(storyId)) {
        const response = await apiCall(`/api/stories/${storyId}/unlike`, 'DELETE');
        
        if (response.success) {
          const next = new Set(likedStories);
          next.delete(storyId);
          setLikedStories(next);
        }
      } else {
        const response = await apiCall(`/api/stories/${storyId}/like`, 'POST');
        
        if (response.success) {
          const next = new Set(likedStories);
          next.add(storyId);
          setLikedStories(next);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const normalizeStory = (s) => ({
    id: s.id,
    title: s.title,
    subtitle: '',
    author: s.author?.name || 'Unknown',
    authorAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    location: '',
    date: s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    readTime: s.reading_time ? `${s.reading_time} min read` : '',
    category: s.category,
    image: getFileUrl(s.thumbnail_url || s.thumbnail) || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=800&fit=crop',
    preview: s.preview || '',
    content: s.content || '',
    tags: Array.isArray(s.tags) ? s.tags : [],
    likes: s.likes_count || 0,
    featured: s.is_featured || false,
    video: s.media_files && s.media_files.some(media => media.file_type === 'video') ? s.media_files.find(media => media.file_type === 'video') : null,
    // New fields for user-submitted stories
    isUserSubmitted: s.submitted_at ? true : false,
    submittedAt: s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : null,
    publishedAt: s.published_at ? new Date(s.published_at).toLocaleDateString() : null,
    authorId: s.author?.id || null,
    mediaFiles: s.media_files || [],
  });

  const handleReadMore = async (story) => {
    navigate(`/stories/${story.id}`);
  };

  const handleShare = (story) => {
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: story.preview,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${story.title} - ${window.location.href}`);
      alert('Story link copied to clipboard!');
    }
  };

  const toggleComments = (storyId) => {
    setShowComments(prev => ({
      ...prev,
      [storyId]: !prev[storyId]
    }));
  };

  const addComment = async (storyId, parentId = null) => {
    if (!newComment.trim()) return;
    try {
      const response = await apiCall(`/api/stories/${storyId}/comments`, 'POST', {
        content: newComment,
        parent_id: parentId
      });
      
      if (response.success) {
        setComments(prev => ({
          ...prev,
          [storyId]: [...(prev[storyId] || []), {
            id: response.data.id,
            author: response.data.author?.name || 'You',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            content: response.data.content,
            timestamp: new Date(response.data.created_at || Date.now()).toLocaleString(),
            likes: 0
          }]
        }));
        setNewComment('');
      }
    } catch (e) {
      // ignore
    }
  };

  const loadComments = async (storyId) => {
    try {
      const response = await apiCall(`/api/stories/${storyId}/comments`, 'GET', {
        page: 1,
        per_page: 20
      });
      
      if (response.success) {
        const mapped = (response.data || []).map(c => ({
          id: c.id,
          author: c.author?.name || 'User',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          content: c.content,
          timestamp: new Date(c.created_at).toLocaleString(),
          likes: 0
        }));
        setComments(prev => ({ ...prev, [storyId]: mapped }));
      }
    } catch (e) {
      // ignore
    }
  };


  // API-driven stories
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        setStoriesLoading(true);
        setStoriesError(null);
        
        // Get user's current language
        const userLanguage = currentLanguage || 'en';
        
        console.log('🔍 StoriesPage - Loading stories for all languages (UI language:', userLanguage, ')');
        // Use the same pattern as GalleryPage.jsx - apiCall utility
        // Note: Not filtering by language to show all published stories
        const params = {
          page: 1,
          per_page: 20
          // Removed lang parameter to show stories in all languages
        };
        
        console.log('🔍 StoriesPage - API params:', params);
        
        const res = await apiCall('/api/stories', 'GET', params);
        console.log('🔍 StoriesPage - API Response:', res);
        
        if (res.success) {
          const all = Array.isArray(res.data) ? res.data : [];
          console.log('🔍 StoriesPage - Raw stories from API (all languages):', all.map(s => ({ id: s.id, title: s.title, language: s.language, is_featured: s.is_featured, submitted_at: s.submitted_at, user_id: s.user_id })));
          
          // Use the normalizeStory function defined above
          const normalized = all.map(normalizeStory);
          console.log('🔍 StoriesPage - Normalized stories (all languages):', normalized.map(s => ({ id: s.id, title: s.title, featured: s.featured, isUserSubmitted: s.isUserSubmitted })));
          
          setStories(normalized);
        } else {
          setStoriesError(res.message || 'Failed to load stories');
          setStories([]);
        }
      } catch (e) {
        console.error('Error loading stories:', e);
        setStoriesError('Failed to load stories. Please try again.');
        setStories([]);
      } finally {
        setStoriesLoading(false);
      }
    };
    loadStories();
  }, [currentLanguage]); // Reload stories when language changes

  // Set dynamic page title
  useEffect(() => {
    document.title = `${t('stories.hero.title')} - DoggoDaily`;
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = 'DoggoDaily - VIP Dog & Italy Adventures';
    };
  }, [t]);



  const categories = [
    { id: 'rescue', label: 'Rescue Stories', icon: FaHeart },
    { id: 'training', label: 'Training Success', icon: FaPaw },
    { id: 'medical', label: 'Medical Miracles', icon: FaBone },
    { id: 'celebration', label: 'Celebrations', icon: FaStar },
    { id: 'everyday', label: 'Everyday Joy', icon: FaHeart }
  ];

  // Loading skeleton component
  const StorySkeleton = () => (
    <article className="story-card" style={{
      background: 'var(--gradient-card)',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      border: '1px solid rgba(0, 191, 174, 0.2)',
      boxShadow: 'var(--shadow-xl)',
      backdropFilter: 'blur(20px)',
      position: 'relative'
    }}>
      {/* Image skeleton */}
      <div style={{
        height: '250px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }} />
      
      {/* Content skeleton */}
      <div style={{ padding: '2rem' }}>
        {/* Author skeleton */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }} />
          <div>
            <div style={{
              width: '120px',
              height: '16px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '8px'
            }} />
            <div style={{
              width: '80px',
              height: '12px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        {/* Title skeleton */}
        <div style={{
          width: '100%',
          height: '24px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '12px'
        }} />

        {/* Subtitle skeleton */}
        <div style={{
          width: '60%',
          height: '16px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '16px'
        }} />

        {/* Content skeleton */}
        <div style={{
          width: '100%',
          height: '16px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '8px'
        }} />
        <div style={{
          width: '80%',
          height: '16px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '16px'
        }} />

        {/* Tags skeleton */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '60px',
            height: '24px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '12px'
          }} />
          <div style={{
            width: '80px',
            height: '24px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '12px'
          }} />
        </div>

        {/* Actions skeleton */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '20px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px'
            }} />
            <div style={{
              width: '40px',
              height: '20px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px'
            }} />
          </div>
          <div style={{
            width: '100px',
            height: '36px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '8px'
          }} />
        </div>
      </div>
    </article>
  );

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'var(--gradient-secondary)'
    }}>
      <style>{`
        .story-card {
          transform: translateY(20px);
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .story-card:nth-child(1) { animation-delay: 0.1s; }
        .story-card:nth-child(2) { animation-delay: 0.2s; }
        .story-card:nth-child(3) { animation-delay: 0.3s; }
        .story-card:nth-child(4) { animation-delay: 0.4s; }
        .story-card:nth-child(5) { animation-delay: 0.5s; }
        .story-card:nth-child(6) { animation-delay: 0.6s; }
        
        .floating-hearts {
          position: absolute;
          pointer-events: none;
          animation: floatUp 3s ease-out forwards;
        }
        
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px) scale(1.2);
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .parallax-bg {
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }

         /* Responsive Grid Styles */
         .stories-grid {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
           gap: 2rem;
           padding: 0 1rem;
         }

         @media (min-width: 1200px) {
           .stories-grid {
             grid-template-columns: repeat(3, 1fr);
             gap: 2.5rem;
           }
         }

         @media (min-width: 768px) and (max-width: 1199px) {
           .stories-grid {
             grid-template-columns: repeat(2, 1fr);
             gap: 2rem;
           }
         }

         @media (max-width: 767px) {
           .stories-grid {
             grid-template-columns: 1fr;
             gap: 1.5rem;
             padding: 0 0.5rem;
           }
         }

         @media (max-width: 480px) {
           .stories-grid {
             gap: 1rem;
             padding: 0;
           }
         }

         /* Responsive Story Card Styles */
         .story-card {
           min-height: 450px;
           transition: all 0.3s ease;
           border-radius: 20px;
           overflow: hidden;
           position: relative;
         }

         .story-card:hover {
           transform: translateY(-8px);
           box-shadow: 0 20px 40px rgba(0, 191, 174, 0.15);
         }

         @media (max-width: 768px) {
           .story-card {
             min-height: 400px;
           }
         }

         @media (max-width: 480px) {
           .story-card {
             min-height: 350px;
           }
         }

        /* Responsive Section Padding */
        @media (max-width: 768px) {
          .section-padding {
            padding: 3rem 1rem !important;
          }
        }

        @media (max-width: 480px) {
          .section-padding {
            padding: 2rem 0.75rem !important;
          }
        }

      `}</style>

      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'var(--gradient-hero)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating Elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '30px',
          height: '30px',
          background: 'var(--primary-teal)',
          borderRadius: '50%',
          opacity: 0.3
        }} className="animate-float" />
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: '20px',
          height: '20px',
          background: 'var(--primary-blue)',
          borderRadius: '50%',
          opacity: 0.4
        }} className="animate-float" />

        <div className="animate-fade-in-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <FaBookOpen style={{
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
              {t('stories.hero.title')}
            </h1>
            <FaBone style={{
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
            {t('stories.hero.description')}
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '3rem'
          }}>
            <button 
              className="btn btn-secondary"
              onClick={() => document.getElementById('stories-section').scrollIntoView({ behavior: 'smooth' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaBookOpen />
              {t('stories.hero.browseButton')}
            </button>
          </div>
        </div>
      </section>

      {/* All Stories Section */}
      <section id="stories-section" className="section-padding" style={{
        background: 'var(--gradient-card)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1rem'
            }}>
              {t('stories.all.title')}
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: 'var(--gray-600)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {t('stories.all.description')}
            </p>
          </div>

          <div className="stories-grid">
            {storiesLoading ? (
              // Show loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <StorySkeleton key={`stories-skeleton-${index}`} />
              ))
            ) : storiesError ? (
              // Show error state
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{
                  fontSize: '3rem',
                  color: 'var(--red-500)',
                  marginBottom: '1rem'
                }}>
                  âš ï¸
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--red-700)',
                  marginBottom: '0.5rem'
                }}>
                  {t('stories.error.title')}
                </h3>
                <p style={{
                  color: 'var(--red-600)',
                  marginBottom: '1.5rem'
                }}>
                  {storiesError}
                </p>
                <button
                  onClick={() => {
                    // Simply reload the page to trigger the useEffect
                    window.location.reload();
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--red-600)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'var(--transition-base)'
                  }}
                >
                  {t('stories.error.retry')}
                </button>
              </div>
            ) : stories.length === 0 ? (
              // Show empty state
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                background: 'rgba(0, 191, 174, 0.05)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(0, 191, 174, 0.1)'
              }}>
                <div style={{
                  fontSize: '3rem',
                  color: 'var(--primary-teal)',
                  marginBottom: '1rem'
                }}>
                  ðŸ“š
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--gray-700)',
                  marginBottom: '0.5rem'
                }}>
                  {t('stories.empty.title')}
                </h3>
                <p style={{
                  color: 'var(--gray-600)'
                }}>
                  {t('stories.empty.description')}
                </p>
              </div>
            ) : (
              // Show all stories
              stories.map((story, index) => (
               <article key={story.id} className="story-card" style={{
                 background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                 borderRadius: '20px',
                 overflow: 'hidden',
                 border: '1px solid rgba(0, 191, 174, 0.1)',
                 boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                 backdropFilter: 'blur(20px)',
                 position: 'relative',
                 cursor: 'pointer'
               }}>
                {/* Featured Badge */}
                {story.featured && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <FaStar style={{ fontSize: '0.7rem' }} />
                    {t('stories.badges.featured')}
                  </div>
                )}

                {/* User Submitted Badge */}
                {story.isUserSubmitted && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    background: 'rgba(0, 191, 174, 0.9)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <FaUpload style={{ fontSize: '0.7rem' }} />
                    {t('stories.badges.community')}
                  </div>
                )}

                 {/* Story Image */}
                 <div style={{
                   height: '220px',
                   backgroundImage: `url(${story.image})`,
                   backgroundSize: 'cover',
                   backgroundPosition: 'center',
                   backgroundRepeat: 'no-repeat',
                   position: 'relative'
                 }}
                 onError={(e) => {
                   // Fallback to default image if thumbnail fails to load
                   e.target.style.backgroundImage = `url('https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=800&fit=crop')`;
                 }}>
                  {/* Gradient Overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7))',
                  }} />
                  
                  {/* Category Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    background: 'rgba(0, 191, 174, 0.9)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)'
                  }}>
                    {story.category}
                  </div>

                  {/* Play Button for Video Stories */}
                  {story.video && (
                    <button
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'var(--transition-base)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const videoUrl = getFileUrl(story.video.file_path);
                        
                        // Set selected video and show modal
                        setSelectedVideo({
                          src: videoUrl,
                          title: story.title,
                          filename: story.video.filename
                        });
                        setShowVideoModal(true);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translate(-50%, -50%) scale(1.1)';
                        e.target.style.background = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translate(-50%, -50%) scale(1)';
                        e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                      }}
                    >
                      <FaPlay style={{
                        fontSize: '1.5rem',
                        color: 'var(--primary-teal)',
                        marginLeft: '3px'
                      }} />
                    </button>
                  )}
                </div>

                 {/* Story Content */}
                 <div style={{ padding: '1.5rem' }}>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.75rem',
                     marginBottom: '1rem'
                   }}>
                     <img
                       src={story.authorAvatar}
                       alt={story.author}
                       style={{
                         width: '40px',
                         height: '40px',
                         borderRadius: '50%',
                         border: '2px solid var(--primary-teal)',
                         objectFit: 'cover'
                       }}
                     />
                     <div>
                       <div style={{
                         fontWeight: 600,
                         color: 'var(--gray-800)',
                         fontSize: '0.9rem'
                       }}>
                         {story.author}
                       </div>
                       <div style={{
                         fontSize: '0.75rem',
                         color: 'var(--gray-500)',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.75rem'
                       }}>
                         <span style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.25rem'
                         }}>
                           <FaClock style={{ fontSize: '0.7rem' }} />
                           {story.readTime || '2 min read'}
                         </span>
                         <span style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.25rem'
                         }}>
                           <FaEye style={{ fontSize: '0.7rem' }} />
                           {story.likes || 0} views
                         </span>
                       </div>
                     </div>
                   </div>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--gray-900)',
                    marginBottom: '0.75rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {story.title}
                  </h3>

                  <p style={{
                    color: 'var(--gray-600)',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                    fontSize: '0.9rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {story.preview || story.content || 'A wonderful story about pets and their amazing journeys...'}
                  </p>

                  {/* Tags */}
                  {story.tags && story.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      marginBottom: '1.25rem'
                    }}>
                      {story.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span key={tagIndex} style={{
                          background: 'rgba(0, 191, 174, 0.1)',
                          color: 'var(--primary-teal)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Story Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
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
                          gap: '0.4rem',
                          color: likedStories.has(story.id) ? '#ff6b6b' : 'var(--gray-500)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          transition: 'var(--transition-base)',
                          padding: '0.4rem',
                          borderRadius: '8px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(story.id);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 107, 107, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                        }}
                      >
                        <FaHeart style={{
                          fontSize: '1rem',
                          transform: likedStories.has(story.id) ? 'scale(1.1)' : 'scale(1)',
                          transition: 'var(--transition-base)'
                        }} />
                        <span>{story.likes + (likedStories.has(story.id) ? 1 : 0)}</span>
                      </button>

                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: 'var(--gray-500)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          transition: 'var(--transition-base)',
                          padding: '0.4rem',
                          borderRadius: '8px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComments(story.id);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(0, 191, 174, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                        }}
                      >
                        <FaComment style={{ fontSize: '1rem' }} />
                        <span>{(comments[story.id] || []).length}</span>
                      </button>

                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: 'var(--gray-500)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          transition: 'var(--transition-base)',
                          padding: '0.4rem',
                          borderRadius: '8px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(story);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(0, 191, 174, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                        }}
                      >
                        <FaShare style={{ fontSize: '1rem' }} />
                      </button>
                    </div>

                    <button
                      style={{
                        background: 'var(--gradient-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0.6rem 1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition-base)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReadMore(story);
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 8px 20px rgba(0, 191, 174, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <FaBookOpen style={{ fontSize: '0.8rem' }} />
                      {t('common.readMore')}
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments[story.id] && (
                    <div style={{
                      marginTop: '1.5rem',
                      paddingTop: '1.5rem',
                      borderTop: '1px solid rgba(0, 191, 174, 0.2)'
                    }}>
                      <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginBottom: '1rem'
                      }}>
                        {(comments[story.id] || []).map(comment => (
                          <div key={comment.id} style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginBottom: '1rem'
                          }}>
                            <img
                              src={comment.avatar}
                              alt={comment.author}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                flexShrink: 0
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                background: 'rgba(0, 191, 174, 0.1)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '0.75rem'
                              }}>
                                <div style={{
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  color: 'var(--gray-800)',
                                  marginBottom: '0.25rem'
                                }}>
                                  {comment.author}
                                </div>
                                <div style={{
                                  fontSize: '0.9rem',
                                  color: 'var(--gray-700)',
                                  lineHeight: 1.4
                                }}>
                                  {comment.content}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--gray-500)',
                                marginTop: '0.25rem',
                                display: 'flex',
                                gap: '1rem'
                              }}>
                                <span>{comment.timestamp}</span>
                                <button style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--gray-500)',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}>
                                  <FaThumbsUp style={{ marginRight: '0.25rem' }} />
                                  {comment.likes}
                                </button>
                                <button style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--gray-500)',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}>
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Comment */}
                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start'
                      }}>
                        <img
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                          alt="You"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              padding: '0.75rem',
                              border: '1px solid rgba(0, 191, 174, 0.3)',
                              borderRadius: 'var(--radius-lg)',
                              resize: 'vertical',
                              fontSize: '0.9rem',
                              fontFamily: 'Poppins, sans-serif',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={() => addComment(story.id)}
                            disabled={!newComment.trim()}
                            style={{
                              background: newComment.trim() ? 'var(--gradient-primary)' : 'var(--gray-300)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-lg)',
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                              marginTop: '0.5rem',
                              transition: 'var(--transition-base)'
                            }}
                          >
{t('common.comment')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={{
        padding: '6rem 2rem',
        background: 'var(--gradient-primary)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {t('stories.cta.title')}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            opacity: 0.9
          }}>
            {t('stories.cta.description')}
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 'var(--radius-full)',
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-base)',
              backdropFilter: 'blur(10px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <FaBookOpen />
            {t('stories.cta.button')}
          </button>
        </div>
      </section>

      {/* Full Story Modal */}
      {showStoryModal && selectedStory && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-2xl)',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: 'var(--shadow-2xl)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowStoryModal(false)}
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
                cursor: 'pointer',
                zIndex: 10,
                color: 'white',
                fontSize: '1.2rem'
              }}
            >
              <FaTimes />
            </button>

            {/* Story Image */}
            <div style={{
              height: '300px',
              backgroundImage: `url(${selectedStory.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(transparent 60%, rgba(0,0,0,0.7))'
              }} />
              
              {selectedStory.featured && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <FaStar style={{ fontSize: '0.7rem' }} />
                  {t('stories.badges.featured')}
                </div>
              )}
            </div>

            {/* Story Content */}
            <div style={{ padding: '2rem' }}>
              {/* Story Meta */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <img
                  src={selectedStory.authorAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                  alt={selectedStory.author}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <div>
                  <div style={{
                    fontWeight: 600,
                    color: 'var(--gray-900)',
                    fontSize: '1rem'
                  }}>
                    {selectedStory.author || 'Anonymous'}
                  </div>
                  <div style={{
                    color: 'var(--gray-500)',
                    fontSize: '0.9rem'
                  }}>
                    {new Date(selectedStory.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Story Title */}
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--gray-900)',
                marginBottom: '1.5rem',
                lineHeight: 1.3
              }}>
                {selectedStory.title}
              </h2>

              {/* Story Content */}
              <div style={{
                color: 'var(--gray-700)',
                fontSize: '1.1rem',
                lineHeight: 1.7,
                marginBottom: '2rem'
              }}>
                {selectedStory.content}
              </div>

              {/* Story Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--gray-200)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <button
                    onClick={() => handleLikeStory(selectedStory.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: selectedStory.isLiked ? 'var(--primary-teal)' : 'var(--gray-400)',
                      cursor: 'pointer',
                      fontSize: '1.3rem',
                      transition: 'var(--transition-base)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FaHeart style={{ 
                      fill: selectedStory.isLiked ? 'currentColor' : 'none',
                      stroke: 'currentColor',
                      strokeWidth: '2'
                    }} />
                    {selectedStory.likes_count || 0}
                  </button>
                  
                  <button
                    onClick={() => handleShare(selectedStory)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gray-400)',
                      cursor: 'pointer',
                      fontSize: '1.3rem',
                      transition: 'var(--transition-base)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FaShare />
                    Share
                  </button>
                </div>

                <button
                  onClick={() => setShowStoryModal(false)}
                  style={{
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '100%',
            height: '100%'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowVideoModal(false)}
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
                cursor: 'pointer',
                zIndex: 10,
                color: 'white',
                fontSize: '1.2rem'
              }}
            >
              <FaTimes />
            </button>

            {/* Video Player */}
            <video
              src={selectedVideo}
              controls
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-lg)',
                objectFit: 'contain'
              }}
            />

            {/* Video Info */}
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.9rem',
              fontWeight: 600,
              backdropFilter: 'blur(10px)'
            }}>
              {selectedStory?.title || 'Video'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
