import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaClock, FaTag, FaHeart, FaComment, FaShare, FaBookmark, 
  FaUser, FaMapMarkerAlt, FaEye, FaThumbsUp, FaThumbsDown, FaReply,
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaDownload,
  FaCalendarAlt, FaGlobe, FaStar, FaAward, FaFire,
  FaChevronLeft, FaChevronRight, FaTimes, FaEllipsisV, FaFlag,
  FaEdit, FaTrash, FaCopy, FaExternalLinkAlt, FaImage, FaVideo,
  FaFileAlt, FaMusic, FaCode, FaPalette, FaCamera, FaLock
} from 'react-icons/fa';
import storiesService from '../services/storiesService';
import galleryService from '../services/galleryService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const StoryDetails = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user: authUser } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [openReply, setOpenReply] = useState({});
  const [replyText, setReplyText] = useState({});
  const [related, setRelated] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
      const res = await storiesService.getStory(id);
      if (res.success) {
        setStory(res.data);
        setRelated(res.related || []);
          setLikesCount(res.data.likes_count || 0);
          setViewsCount(res.data.views_count || 0);
          setIsLiked(res.data.is_liked || false);
          setIsBookmarked(res.data.is_bookmarked || false);
          
          // Calculate reading time (average 200 words per minute)
          const wordCount = res.data.content ? res.data.content.split(' ').length : 0;
          setReadingTime(Math.max(1, Math.ceil(wordCount / 200)));
        }
        
      const c = await storiesService.getComments(id, { page: 1, per_page: 20 });
      if (c.success) setComments(c.data || []);
        
        // Track view
        await storiesService.trackView(id);
      } catch (error) {
        console.error('Error loading story:', error);
      } finally {
      setLoading(false);
      }
    };
    load();
  }, [id]);

  // Helper functions
  const handleLike = async () => {
    try {
      const res = await storiesService.likeStory(id);
      if (res.success) {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await storiesService.bookmarkStory(id);
      if (res.success) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (error) {
      console.error('Error bookmarking story:', error);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return FaImage;
      case 'video': return FaVideo;
      case 'audio': return FaMusic;
      case 'document': return FaFileAlt;
      case 'code': return FaCode;
      case 'design': return FaPalette;
      default: return FaFileAlt;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        paddingTop: '100px',
        background: 'var(--gradient-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
          {/* Hero Skeleton */}
          <div style={{
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            padding: '2rem',
            border: '1px solid rgba(0, 191, 174, 0.15)',
            boxShadow: 'var(--shadow-xl)',
            marginBottom: '2rem'
          }}>
            <div style={{ height: '300px', background: 'rgba(0,0,0,0.06)', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }} />
            <div style={{ height: '40px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', width: '70%', marginBottom: '1rem' }} />
            <div style={{ height: '20px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', width: '40%', marginBottom: '1.5rem' }} />
            <div style={{ height: '200px', background: 'rgba(0,0,0,0.08)', borderRadius: 'var(--radius-lg)' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 text-gray-700">{t('stories.notFound')}</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'var(--gradient-secondary)'
    }}
    className="story-page"
    >
      <style>{`
        /* Responsive Grid Layout */
        .story-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }
        
        @media (max-width: 1024px) {
          .story-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        
        @media (max-width: 768px) {
          .story-grid {
            gap: 1rem;
          }
        }

        /* Hero Section */
        .story-hero { 
          position: relative; 
          height: 400px; 
          overflow: hidden; 
          border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
        }
        
        @media (max-width: 768px) {
          .story-hero {
            height: 250px;
            border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          }
        }
        
        @media (max-width: 480px) {
          .story-hero {
            height: 200px;
          }
        }
        
        .story-hero::after { 
          content: ""; 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(transparent 40%, rgba(0,0,0,0.7)); 
        }

        .video-play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          border-radius: 50%;
          width: 100px;
          height: 100px;
          display: flex;
          align-items: center;
          justifyContent: center;
          cursor: pointer;
          font-size: 2.5rem;
          color: white;
          transition: all 0.3s ease;
          z-index: 10;
        }
        
        @media (max-width: 480px) {
          .video-play-button {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
          }
        }

        /* Story Chips */
        .story-chip { 
          background: rgba(0, 191, 174, 0.1); 
          color: var(--primary-teal); 
          padding: 0.4rem 1rem; 
          border-radius: var(--radius-full); 
          font-weight: 600; 
          font-size: 0.9rem; 
          border: 1px solid rgba(0,191,174,0.2); 
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        @media (max-width: 480px) {
          .story-chip {
            padding: 0.3rem 0.8rem;
            font-size: 0.8rem;
          }
        }

        /* Story Cards */
        .story-card { 
          background: var(--gradient-card); 
          border-radius: var(--radius-2xl); 
          border: 1px solid rgba(0, 191, 174, 0.2); 
          box-shadow: var(--shadow-xl); 
          backdrop-filter: blur(20px); 
          overflow: hidden; 
        }
        
        @media (max-width: 768px) {
          .story-card {
            border-radius: var(--radius-xl);
            margin-bottom: 1rem;
          }
        }

        /* Story Content Wrapper */
        .story-content-wrapper {
          padding: 2.5rem;
        }
        
        @media (max-width: 768px) {
          .story-content-wrapper {
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .story-content-wrapper {
            padding: 1rem;
          }
        }

        /* Typography */
        .story-title { 
          font-size: clamp(1.5rem, 4vw, 3rem); 
          font-weight: 800; 
          color: var(--gray-900); 
          margin: 0 0 1rem 0; 
          line-height: 1.2;
        }
        
        @media (max-width: 768px) {
          .story-title {
            font-size: clamp(1.3rem, 5vw, 2rem);
            margin-bottom: 0.75rem;
          }
        }

        .story-meta { 
          display: flex; 
          align-items: center; 
          gap: 1.5rem; 
          color: var(--gray-600); 
          font-size: 1rem; 
          flex-wrap: wrap;
        }
        
        .story-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .story-meta {
            gap: 1rem;
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 480px) {
          .story-meta {
            gap: 0.75rem;
            font-size: 0.8rem;
            flex-direction: column;
            align-items: flex-start;
          }
        }

        .story-content { 
          color: var(--gray-700); 
          line-height: 1.8; 
          font-size: 1.1rem; 
          white-space: pre-line; 
        }
        
        @media (max-width: 768px) {
          .story-content {
            font-size: 1rem;
            line-height: 1.7;
          }
        }

        /* Navigation */
        .story-back { 
          display: inline-flex; 
          align-items: center; 
          gap: 0.5rem; 
          color: var(--primary-teal); 
          text-decoration: none; 
          font-weight: 700; 
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg);
          background: rgba(0, 191, 174, 0.1);
          border: 1px solid rgba(0, 191, 174, 0.2);
          transition: all 0.3s ease;
        }
        
        @media (max-width: 480px) {
          .story-back {
            padding: 0.4rem 0.8rem;
            font-size: 0.9rem;
          }
        }
        
        .story-back:hover { 
          background: rgba(0, 191, 174, 0.2);
          transform: translateY(-2px);
        }

        /* Action Buttons */
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-lg);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }
        
        @media (max-width: 768px) {
          .action-btn {
            padding: 0.6rem 1.2rem;
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 480px) {
          .action-btn {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
            gap: 0.4rem;
          }
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        
        .btn-primary { background: var(--primary-teal); color: white; }
        .btn-secondary { background: rgba(0, 191, 174, 0.1); color: var(--primary-teal); border: 1px solid rgba(0, 191, 174, 0.2); }
        .btn-outline { background: transparent; color: var(--gray-700); border: 1px solid var(--gray-300); }

        /* Action Buttons Container */
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .action-buttons {
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .action-buttons {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .action-buttons .action-btn {
            width: 100%;
            justify-content: center;
          }
        }

        /* Tabs */
        .tab-btn {
          padding: 1rem 2rem;
          border: none;
          background: transparent;
          color: var(--gray-600);
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .tab-btn {
            padding: 0.75rem 1.5rem;
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 480px) {
          .tab-btn {
            padding: 0.6rem 1rem;
            font-size: 0.8rem;
          }
        }
        
        .tab-btn.active {
          color: var(--primary-teal);
          border-bottom-color: var(--primary-teal);
        }

        /* Media Grid */
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .media-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
          }
        }
        
        @media (max-width: 480px) {
          .media-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }
        
        .media-item {
          background: var(--gradient-card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid rgba(0,191,174,0.15);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        @media (max-width: 480px) {
          .media-item {
            border-radius: var(--radius-lg);
          }
        }
        
        .media-item:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        /* Author Card */
        .author-card {
          background: var(--gradient-card);
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .author-card {
            padding: 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .author-card {
            padding: 1rem;
          }
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }
        }
        
        .stat-item {
          text-align: center;
          padding: 1rem;
          background: rgba(0, 191, 174, 0.05);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0, 191, 174, 0.1);
        }
        
        @media (max-width: 480px) {
          .stat-item {
            padding: 0.75rem 0.5rem;
          }
        }

        /* Comments */
        .comment-card {
          background: var(--gradient-card);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          border: 1px solid rgba(0, 191, 174, 0.15);
          margin-bottom: 1rem;
        }
        
        @media (max-width: 768px) {
          .comment-card {
            padding: 1rem;
            border-radius: var(--radius-lg);
          }
        }
        
        .reply-card {
          background: rgba(0, 191, 174, 0.05);
          border-radius: var(--radius-lg);
          padding: 1rem;
          margin-left: 2rem;
          margin-top: 0.5rem;
          border: 1px solid rgba(0, 191, 174, 0.1);
        }
        
        @media (max-width: 768px) {
          .reply-card {
            margin-left: 1rem;
            padding: 0.75rem;
          }
        }
        
        @media (max-width: 480px) {
          .reply-card {
            margin-left: 0.5rem;
            padding: 0.6rem;
          }
        }

        /* Related Stories Grid */
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .related-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1rem;
          }
        }
        
        @media (max-width: 480px) {
          .related-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }

        /* Modal Responsiveness */
        @media (max-width: 768px) {
          .modal-content {
            margin: 1rem;
            max-width: calc(100vw - 2rem);
            max-height: calc(100vh - 2rem);
          }
        }
        
        @media (max-width: 480px) {
          .modal-content {
            margin: 0.5rem;
            max-width: calc(100vw - 1rem);
            max-height: calc(100vh - 1rem);
            border-radius: var(--radius-lg);
          }
        }

        /* Form Elements */
        @media (max-width: 768px) {
          textarea {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }

        /* Touch-friendly interactions */
        @media (max-width: 768px) {
          .action-btn, .tab-btn, .story-back {
            min-height: 44px; /* iOS touch target minimum */
            min-width: 44px;
          }
        }

        /* Main Container */
        .story-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.25rem;
          width: 100%;
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .story-container {
            padding: 0 1rem;
            max-width: 100%;
          }
        }
        
        @media (max-width: 480px) {
          .story-container {
            padding: 0 0.75rem;
            max-width: 100%;
          }
        }

        /* Main Page */
        .story-page {
          min-height: 100vh;
          padding-top: 80px;
          background: var(--gradient-secondary);
          width: 100vw;
          max-width: 100vw;
          overflow-x: hidden;
        }
        
        @media (max-width: 768px) {
          .story-page {
            padding-top: 70px;
          }
        }
        
        @media (max-width: 480px) {
          .story-page {
            padding-top: 60px;
          }
        }

        /* Proper Mobile-First Responsive Design */
        
        /* Base mobile styles (mobile-first approach) */
        .story-page {
          min-height: 100vh;
          padding: 0;
          background: var(--gradient-secondary);
          width: 100vw;
          max-width: 100vw;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        
        /* Mobile container - full width with minimal padding */
        .story-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 1rem 0.75rem;
          box-sizing: border-box;
        }
        
        /* Mobile navigation */
        .navigation-wrapper {
          margin-bottom: 1rem;
        }
        
        .story-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-teal);
          text-decoration: none;
          font-weight: 700;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-lg);
          background: rgba(0, 191, 174, 0.1);
          border: 1px solid rgba(0, 191, 174, 0.2);
          font-size: 0.9rem;
        }
        
        /* Mobile grid - single column by default */
        .story-grid {
          display: block;
          width: 100%;
        }
        
        /* Mobile story card */
        .story-card {
          background: var(--gradient-card);
          border-radius: var(--radius-xl);
          border: 1px solid rgba(0, 191, 174, 0.2);
          box-shadow: var(--shadow-lg);
          margin-bottom: 1rem;
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        
        /* Mobile hero */
        .story-hero {
          position: relative;
          height: 200px;
          width: 100%;
          overflow: hidden;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }
        
        /* Mobile content wrapper */
        .story-content-wrapper {
          padding: 1rem;
          width: 100%;
          box-sizing: border-box;
        }
        
        /* Mobile typography */
        .story-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--gray-900);
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .story-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: var(--gray-600);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        
        .story-meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        
        /* Mobile action buttons */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
          width: 100%;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: none;
          border-radius: var(--radius-lg);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          width: 100%;
          box-sizing: border-box;
        }
        
        /* Mobile tabs */
        .tabs-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border-bottom: none;
          margin-bottom: 1rem;
          width: 100%;
        }
        
        .tab-btn {
          padding: 0.75rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          background: transparent;
          color: var(--gray-600);
          font-weight: 600;
          cursor: pointer;
          border-radius: var(--radius-lg);
          margin-bottom: 0.25rem;
          width: 100%;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .tab-btn.active {
          background: var(--primary-teal);
          color: white;
          border-color: var(--primary-teal);
        }
        
        /* Mobile content sections */
        .tab-content {
          width: 100%;
          margin-bottom: 1rem;
        }
        
        .story-content {
          color: var(--gray-700);
          line-height: 1.6;
          font-size: 1rem;
          margin-bottom: 1rem;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .story-preview {
          color: var(--gray-800);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          font-style: italic;
          padding: 1rem;
          background: rgba(0, 191, 174, 0.05);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0, 191, 174, 0.1);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .story-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: rgba(0, 191, 174, 0.05);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0, 191, 174, 0.1);
        }
        
        .tags-label {
          font-weight: 700;
          color: var(--gray-700);
          margin-right: 0.5rem;
        }
        
        /* Mobile media grid */
        .media-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          width: 100%;
        }
        
        .media-item {
          background: var(--gradient-card);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid rgba(0, 191, 174, 0.15);
          width: 100%;
        }
        
        /* Mobile author card - hidden on mobile, shown in sidebar on desktop */
        .author-card {
          display: none;
        }
        
        /* Mobile stats - simplified */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin: 1rem 0;
        }
        
        .stat-item {
          text-align: center;
          padding: 0.75rem;
          background: rgba(0, 191, 174, 0.05);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0, 191, 174, 0.1);
        }
        
        /* Mobile comments */
        .comment-form {
          background: var(--gradient-card);
          border-radius: var(--radius-lg);
          padding: 1rem;
          border: 1px solid rgba(0, 191, 174, 0.15);
          margin-bottom: 1rem;
        }
        
        .comment-input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        /* Comment form elements */
        .comment-textarea {
          width: 100%;
          max-width: 100%;
          font-size: 16px;
          padding: 0.75rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.7);
          outline: none;
          box-sizing: border-box;
          resize: vertical;
          min-height: 100px;
        }
        
        .comment-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-lg);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          background: var(--primary-teal);
          color: white;
          width: 100%;
          box-sizing: border-box;
        }
        
  /* Reply form elements */
  .reply-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(0, 191, 174, 0.05);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(0, 191, 174, 0.1);
  }

  /* Login prompt styles */
  .login-prompt {
    padding: 2rem;
    margin-bottom: 2rem;
    background: rgba(0, 191, 174, 0.05);
    border-radius: var(--radius-lg);
    border: 2px dashed rgba(0, 191, 174, 0.2);
    text-align: center;
  }

  .login-prompt-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .login-prompt-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--primary-teal);
    color: white;
    text-decoration: none;
    border-radius: var(--radius-lg);
    font-weight: 600;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .login-prompt-btn:hover {
    background: var(--primary-teal-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 191, 174, 0.3);
  }
        
        .reply-textarea {
          width: 100%;
          max-width: 100%;
          font-size: 16px;
          padding: 0.75rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.7);
          outline: none;
          box-sizing: border-box;
          resize: vertical;
          min-height: 80px;
        }
        
        .reply-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: var(--radius-lg);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.9rem;
          background: var(--primary-teal);
          color: white;
          width: 100%;
          box-sizing: border-box;
        }
        
        .comment-card {
          background: var(--gradient-card);
          border-radius: var(--radius-lg);
          padding: 1rem;
          border: 1px solid rgba(0, 191, 174, 0.15);
          margin-bottom: 1rem;
        }
        
        .reply-card {
          background: rgba(0, 191, 174, 0.05);
          border-radius: var(--radius-lg);
          padding: 0.75rem;
          margin-left: 0;
          margin-top: 0.5rem;
          border: 1px solid rgba(0, 191, 174, 0.1);
        }
        
        /* Mobile related stories */
        .related-stories-wrapper {
          margin: 1rem 0 0 0;
        }
        
        .related-stories-content {
          padding: 1rem;
        }
        
        .related-stories-header {
          font-weight: 800;
          color: var(--gray-900);
          margin-bottom: 1rem;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .related-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        /* Mobile forms */
        textarea {
          width: 100%;
          max-width: 100%;
          font-size: 16px;
          padding: 0.75rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.7);
          outline: none;
          box-sizing: border-box;
          resize: vertical;
          min-height: 100px;
        }
        
        /* Mobile modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .modal-content {
          max-width: calc(100vw - 2rem);
          max-height: calc(100vh - 2rem);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        
        /* Mobile login prompt styles */
        @media (max-width: 767px) {
          .login-prompt {
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .login-prompt-content h3 {
            font-size: 1.1rem;
          }

          .login-prompt-content p {
            font-size: 0.9rem;
          }

          .login-prompt-btn {
            padding: 0.75rem 1.25rem;
            font-size: 0.9rem;
          }
        }
        
        /* Desktop overrides (min-width: 768px) */
        @media (min-width: 768px) {
          .story-page {
            padding-top: 80px;
          }
          
          .story-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 1.25rem;
          }
          
          .story-grid {
            display: block;
            width: 100%;
          }
          
          .story-hero {
            height: 400px;
          }
          
          .story-content-wrapper {
            padding: 2.5rem;
          }
          
          .story-title {
            font-size: clamp(1.5rem, 4vw, 3rem);
          }
          
          .story-meta {
            flex-direction: row;
            gap: 1.5rem;
            font-size: 1rem;
          }
          
          .action-buttons {
            flex-direction: row;
            gap: 1rem;
          }
          
          .action-btn {
            width: auto;
            padding: 0.75rem 1.5rem;
          }
          
          .tabs-container {
            flex-direction: row;
            border-bottom: 2px solid rgba(0, 191, 174, 0.1);
          }
          
          .tab-btn {
            padding: 1rem 2rem;
            border: none;
            border-bottom: 2px solid transparent;
            border-radius: 0;
            margin-bottom: 0;
            width: auto;
          }
          
          .tab-btn.active {
            background: transparent;
            color: var(--primary-teal);
            border-bottom-color: var(--primary-teal);
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }
          
          .comment-input-wrapper {
            flex-direction: row;
            align-items: flex-start;
          }
          
          /* Desktop comment form styles */
          .comment-textarea {
            flex: 1;
            min-height: 100px;
            padding: 1rem;
            font-size: 1rem;
          }
          
          .comment-submit-btn {
            width: auto;
            padding: 1rem 2rem;
            align-self: flex-start;
          }
          
          /* Desktop reply form styles */
          .reply-form {
            flex-direction: row;
            align-items: flex-start;
          }
          
          .reply-textarea {
            flex: 1;
            min-height: 80px;
            padding: 0.75rem;
          }
          
          .reply-submit-btn {
            width: auto;
            padding: 0.75rem 1.5rem;
            align-self: flex-start;
          }
          
          .related-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }
        
        
      `}</style>

      <div className="story-container">
        {/* Navigation */}
        <div className="navigation-wrapper">
          <Link to="/stories" className="story-back">
            <FaArrowLeft /> {t('stories.backToStories')}
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="story-grid">
          {/* Main Story Content */}
          <div>
            {/* Story Card */}
            <div className="story-card">
              {/* Hero Image */}
          {(story.thumbnail_url || story.thumbnail) && (
                <div 
                  className="story-hero"
                  style={{ 
              backgroundImage: `url(${story.thumbnail_url || story.thumbnail})`, 
              backgroundSize: 'cover', 
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Video Play Button */}
                  {story.media_files && story.media_files.some(media => media.file_type === 'video') && (
                    <div className="video-play-button"
                onClick={() => {
                  const videoFile = story.media_files.find(media => media.file_type === 'video');
                  if (videoFile) {
                    const videoUrl = videoFile.file_path.startsWith('http') 
                      ? videoFile.file_path 
                      : `http://46.101.244.203:5000/${videoFile.file_path}`;
                    
                    setSelectedVideo({
                      src: videoUrl,
                      title: story.title,
                      filename: videoFile.filename
                    });
                    setShowVideoModal(true);
                  }
                }}
                    >
                      <FaPlay />
                </div>
              )}
            </div>
          )}

              {/* Story Content */}
              <div className="story-content-wrapper">
                {/* Title and Meta */}
                <h1 className="story-title">{story.title}</h1>
                
                <div className="story-meta">
                  {story.category && (
                    <span className="story-chip">
                      <FaTag /> {story.category}
                    </span>
                  )}
              {story.created_at && (
                    <span className="story-meta-item">
                      <FaCalendarAlt /> {new Date(story.created_at).toLocaleDateString()}
                </span>
              )}
                  <span className="story-meta-item">
                    <FaClock /> {readingTime} min read
                  </span>
                  <span className="story-meta-item">
                    <FaEye /> {viewsCount} views
                  </span>
            </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button 
                    className={`action-btn ${isLiked ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleLike}
                  >
                    <FaHeart style={{ color: isLiked ? 'white' : 'var(--primary-teal)' }} />
                    {likesCount} {isLiked ? 'Liked' : 'Like'}
                  </button>
                  
                  <button 
                    className={`action-btn ${isBookmarked ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleBookmark}
                  >
                    <FaBookmark style={{ color: isBookmarked ? 'white' : 'var(--primary-teal)' }} />
                    {isBookmarked ? 'Saved' : 'Save'}
                  </button>
                  
                  <button className="action-btn btn-outline" onClick={handleShare}>
                    <FaShare /> Share
                  </button>
                  
                  <button className="action-btn btn-outline">
                    <FaComment /> {comments.length} Comments
                  </button>
                </div>

                {/* Preview */}
            {story.preview && (
                  <div className="story-preview">
                    "{story.preview}"
                  </div>
                )}

                {/* Content */}
            {story.content && (
                  <div className="story-content">
                {story.content}
              </div>
            )}

                {/* Tags */}
            {Array.isArray(story.tags) && story.tags.length > 0 && (
                  <div className="story-tags">
                    <span className="tags-label">
                      Tags:
                    </span>
                {story.tags.map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className="story-chip">
                    <FaTag /> {tag}
                  </span>
                ))}
              </div>
            )}
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => setActiveTab('content')}
              >
                <FaFileAlt style={{ marginRight: '0.5rem' }} />
                Content
              </button>
              <button 
                className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
                onClick={() => setActiveTab('media')}
              >
                <FaImage style={{ marginRight: '0.5rem' }} />
                Media ({story.media_files?.length || 0})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                onClick={() => setActiveTab('comments')}
              >
                <FaComment style={{ marginRight: '0.5rem' }} />
                Comments ({comments.length})
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'content' && (
              <div className="tab-content">
                {/* Additional content sections can go here */}
                <div style={{
                  padding: '2rem',
                  background: 'rgba(0, 191, 174, 0.05)',
                      borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(0, 191, 174, 0.1)',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1rem' }}>
                    Story Summary
                  </h3>
                  <p style={{ color: 'var(--gray-700)', lineHeight: 1.6 }}>
                    This story has been viewed {viewsCount} times and received {likesCount} likes. 
                    It was published on {new Date(story.created_at).toLocaleDateString()} and 
                    takes approximately {readingTime} minutes to read.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="tab-content">
                {story.media_files && story.media_files.length > 0 ? (
                  <div className="media-grid">
                    {story.media_files.map((media, idx) => {
                      const FileIcon = getFileIcon(media.file_type);
                      return (
                        <div key={idx} className="media-item">
                      {media.file_type === 'image' ? (
                        <img 
                          src={media.file_path.startsWith('http') ? media.file_path : `http://46.101.244.203:5000/${media.file_path}`}
                          alt={`Story media ${idx + 1}`}
                          style={{
                            width: '100%',
                                height: '200px',
                            objectFit: 'cover'
                          }}
                              onClick={() => {
                                setCurrentImageIndex(idx);
                                setShowImageModal(true);
                          }}
                        />
                      ) : media.file_type === 'video' ? (
                        <div style={{
                          width: '100%',
                              height: '200px',
                              background: media.thumbnail_path ? 
                                `url(${media.thumbnail_path.startsWith('http') ? media.thumbnail_path : `http://46.101.244.203:5000/${media.thumbnail_path}`})` : 
                                'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onClick={() => {
                          const videoUrl = media.file_path.startsWith('http') 
                            ? media.file_path 
                            : `http://46.101.244.203:5000/${media.file_path}`;
                          
                          setSelectedVideo({
                            src: videoUrl,
                            title: story.title,
                            filename: media.filename
                          });
                          setShowVideoModal(true);
                        }}
                        >
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '50%',
                                width: '60px',
                                height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                                fontSize: '1.8rem',
                            color: '#0f766e'
                          }}>
                                <FaPlay />
                          </div>
                        </div>
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '200px',
                              background: 'var(--gradient-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                              gap: '1rem'
                            }}>
                              <FileIcon style={{ fontSize: '3rem', color: 'var(--primary-teal)' }} />
                              <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
                                {media.filename}
                              </span>
                            </div>
                          )}
                          
                          <div style={{ padding: '1rem' }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              marginBottom: '0.5rem' 
                            }}>
                              <FileIcon style={{ color: 'var(--primary-teal)' }} />
                              <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
                                {media.file_type.toUpperCase()}
                              </span>
                        </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                              {formatFileSize(media.file_size)}
                        </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                              {media.filename}
                      </div>
                    </div>
                </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: 'var(--gray-500)'
                  }}>
                    <FaImage style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                    <p>No media files attached to this story</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="tab-content">
                {/* Add Comment */}
                {authUser ? (
                  <div className="comment-form">
                    <h3 style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1rem' }}>
                      Add a Comment
                    </h3>
                    <div className="comment-input-wrapper">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts about this story..."
                        className="comment-textarea"
                />
                <button
                  onClick={async () => {
                    if (!newComment.trim()) return;
                    const res = await storiesService.addComment(id, { content: newComment.trim() });
                    if (res.success) {
                      setComments(prev => ([...prev, res.data]));
                      setNewComment('');
                    }
                  }}
                        className="comment-submit-btn"
                >
                        <FaComment /> Post
                </button>
              </div>
                  </div>
                ) : (
                  <div className="login-prompt">
                    <div className="login-prompt-content">
                      <FaLock style={{ fontSize: '2rem', color: 'var(--primary-teal)', marginBottom: '1rem' }} />
                      <h3 style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                        Login Required
                      </h3>
                      <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        Please log in to add comments and interact with this story.
                      </p>
                      <Link to="/login" className="login-prompt-btn">
                        <FaUser /> Login to Comment
                      </Link>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div>
                  {comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c.id} className="comment-card">
                    <div style={{
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          marginBottom: '1rem' 
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'var(--gradient-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700
                            }}>
                              {(c.author?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                                {c.author?.name || 'Anonymous User'}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>
                                {new Date(c.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--gray-400)',
                            cursor: 'pointer',
                            padding: '0.5rem'
                          }}>
                            <FaEllipsisV />
                          </button>
                        </div>
                        
                        <div style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1rem' }}>
                          {c.content}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <button style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-teal)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <FaThumbsUp /> {c.likes_count || 0}
                          </button>
                          <button style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--gray-500)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <FaThumbsDown />
                          </button>
                          {authUser && (
                        <button
                          onClick={() => setOpenReply(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          style={{
                                background: 'none',
                            border: 'none',
                            color: 'var(--primary-teal)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <FaReply /> Reply
                        </button>
                          )}
                      </div>
                        
                        {authUser && openReply[c.id] && (
                          <div className="reply-form">
                          <textarea
                            value={replyText[c.id] || ''}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                              placeholder="Write a reply..."
                              className="reply-textarea"
                          />
                          <button
                            onClick={async () => {
                              const text = (replyText[c.id] || '').trim();
                              if (!text) return;
                              const res = await storiesService.addComment(id, { content: text, parent_id: c.id });
                              if (res.success) {
                                setComments(prev => prev.map(item => (
                                  item.id === c.id
                                    ? { ...item, replies: [...(item.replies || []), res.data] }
                                    : item
                                )));
                                setReplyText(prev => ({ ...prev, [c.id]: '' }));
                                setOpenReply(prev => ({ ...prev, [c.id]: false }));
                              }
                            }}
                              className="reply-submit-btn"
                          >
                              <FaReply /> Reply
                          </button>
                        </div>
                      )}
                        
                    {/* Replies */}
                    {Array.isArray(c.replies) && c.replies.length > 0 && (
                          <div style={{ marginTop: '1rem' }}>
                        {c.replies.map(r => (
                              <div key={r.id} className="reply-card">
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '0.75rem',
                                  marginBottom: '0.5rem' 
                                }}>
                                  <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: 'var(--gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.8rem'
                                  }}>
                                    {(r.author?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.9rem' }}>
                                      {r.author?.name || 'Anonymous User'}
                      </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                                      {new Date(r.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ color: 'var(--gray-700)', lineHeight: 1.5 }}>
                                  {r.content}
                                </div>
                  </div>
                ))}
                          </div>
                )}
              </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: 'var(--gray-500)'
                    }}>
                      <FaComment style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                      <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
                  )}
          </div>
        </div>
            )}
      </div>

        </div>

      {/* Related Stories */}
      {related.length > 0 && (
          <div className="story-container related-stories-wrapper">
            <div className="story-card">
              <div className="related-stories-content">
                <h2 className="related-stories-header">
                  <FaFire style={{ color: 'var(--primary-teal)' }} />
                  Related Stories
                </h2>
                <div className="related-grid">
            {related.map((r) => (
                    <Link key={r.id} to={`/stories/${r.id}`} style={{
                background: 'var(--gradient-card)',
                border: '1px solid rgba(0,191,174,0.15)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-4px)';
                      e.target.style.boxShadow = 'var(--shadow-xl)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    >
                      <div style={{ 
                        height: '180px', 
                        backgroundImage: `url(${r.thumbnail_url || r.thumbnail || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop'})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          background: 'rgba(0, 191, 174, 0.9)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          {r.category}
                        </div>
                      </div>
                      <div style={{ padding: '1.25rem' }}>
                        <h3 style={{ 
                          fontWeight: 700, 
                          color: 'var(--gray-900)', 
                          marginBottom: '0.75rem',
                          fontSize: '1.1rem',
                          lineHeight: 1.3
                        }}>
                          {r.title}
                        </h3>
                  {r.preview && (
                          <p style={{ 
                            color: 'var(--gray-600)', 
                            fontSize: '0.9rem', 
                            lineHeight: 1.5, 
                            display: '-webkit-box', 
                            WebkitLineClamp: 3, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden',
                            marginBottom: '1rem'
                          }}>
                            {r.preview}
                          </p>
                        )}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          fontSize: '0.8rem',
                          color: 'var(--gray-500)'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaEye /> {r.views_count || 0}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaHeart /> {r.likes_count || 0}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaComment /> {r.comments_count || 0}
                          </span>
                        </div>
                </div>
              </Link>
            ))}
                </div>
              </div>
          </div>
        </div>
      )}
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="modal-overlay" style={{
          background: 'rgba(0, 0, 0, 0.9)'
        }}
        onClick={() => setShowVideoModal(false)}
        >
          <div className="modal-content" style={{
            background: '#000',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            maxWidth: '90vw',
            maxHeight: '90vh',
            position: 'relative',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
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
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2rem',
                zIndex: 10,
                backdropFilter: 'blur(10px)'
              }}
            >
              <FaTimes />
            </button>

            <video
              src={selectedVideo.src}
              controls
              autoPlay
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />

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
              {selectedVideo.filename}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && story.media_files && (
        <div className="modal-overlay" style={{
          background: 'rgba(0, 0, 0, 0.9)'
        }}
        onClick={() => setShowImageModal(false)}
        >
          <div className="modal-content" style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
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
                zIndex: 10
              }}
            >
              <FaTimes />
            </button>

            <img
              src={story.media_files[currentImageIndex]?.file_path.startsWith('http') 
                ? story.media_files[currentImageIndex].file_path 
                : `http://46.101.244.203:5000/${story.media_files[currentImageIndex].file_path}`}
              alt={`Story media ${currentImageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 'var(--radius-lg)'
              }}
            />

            {story.media_files.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => 
                      prev === 0 ? story.media_files.length - 1 : prev - 1
                    );
                  }}
                  style={{
                    position: 'absolute',
                    left: '-50px',
                    top: '50%',
                    transform: 'translateY(-50%)',
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
                    fontSize: '1.2rem'
                  }}
                >
                  <FaChevronLeft />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => 
                      prev === story.media_files.length - 1 ? 0 : prev + 1
                    );
                  }}
                  style={{
                    position: 'absolute',
                    right: '-50px',
                    top: '50%',
                    transform: 'translateY(-50%)',
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
                    fontSize: '1.2rem'
                  }}
                >
                  <FaChevronRight />
                </button>
              </>
            )}

            <div style={{
              position: 'absolute',
              bottom: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              {currentImageIndex + 1} / {story.media_files.length}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" style={{
          background: 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={() => setShowShareModal(false)}
        >
          <div className="modal-content" style={{
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid rgba(0, 191, 174, 0.2)',
            boxShadow: 'var(--shadow-xl)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                Share Story
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                className="action-btn btn-secondary"
                onClick={() => copyToClipboard(window.location.href)}
              >
                <FaCopy /> Copy Link
              </button>
              
              <button 
                className="action-btn btn-outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: story.title,
                      text: story.preview,
                      url: window.location.href
                    });
                  }
                }}
              >
                <FaShare /> Share via Browser
              </button>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 191, 174, 0.05)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0, 191, 174, 0.1)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                  Story URL:
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--gray-700)', 
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {window.location.href}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryDetails;

