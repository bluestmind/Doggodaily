import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaClock, FaTag, FaHeart, FaShare, FaBookmark, 
  FaUser, FaMapMarkerAlt, FaEye, FaCalendarAlt, FaUsers, FaDollarSign,
  FaStar, FaAward, FaFire, FaChevronLeft, FaChevronRight, FaTimes,
  FaImage, FaVideo, FaPlay, FaExpand, FaDownload, FaPhone, FaEnvelope,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaBookOpen
} from 'react-icons/fa';
import toursService from '../services/toursService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { translateDynamicContent } from '../utils/translationUtils.js';

const TourDetails = () => {
  const { id } = useParams();
  const { t, currentLanguage } = useLanguage();
  const { user: authUser } = useAuth();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    number_of_guests: 1,
    special_requests: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await toursService.getTour(id, currentLanguage || 'en');
        if (res.success) {
          setTour(res.data);
          // Load related tours
          const relatedRes = await toursService.getTours({ 
            page: 1, 
            per_page: 3,
            lang: currentLanguage || 'en'
          });
          if (relatedRes.success) {
            setRelated(relatedRes.data.filter(t => t.id !== parseInt(id)).slice(0, 3));
          }
        }
      } catch (error) {
        console.error('Error loading tour:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, currentLanguage]); // Re-fetch when language changes

  const handleBookmark = async () => {
    // Implement bookmark functionality
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString) => {
    const locale = currentLanguage === 'it' ? 'it-IT' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    const locale = currentLanguage === 'it' ? 'it-IT' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const handleBookingSubmit = async () => {
    try {
      const response = await toursService.bookTour(id, bookingData);
      if (response.success) {
        setShowBookingModal(false);
        // Show success message
        alert('Booking successful!');
        // Reload tour data to update booking count
        const res = await toursService.getTour(id, currentLanguage || 'en');
        if (res.success) {
          setTour(res.data);
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        paddingTop: '100px',
        background: 'var(--gradient-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
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

  if (!tour) {
    return (
      <div style={{
        minHeight: '100vh',
        paddingTop: '100px',
        background: 'var(--gradient-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ color: 'var(--gray-700)', marginBottom: '1rem' }}>
              {currentLanguage === 'it' ? 'Tour Non Trovato' : 'Tour Not Found'}
            </h2>
            <Link to="/tours" style={{
              color: 'var(--primary-teal)',
              textDecoration: 'none',
              fontWeight: '600'
            }}>
              ← {currentLanguage === 'it' ? 'Torna ai Tour' : 'Back to Tours'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: '80px',
      background: 'var(--gradient-secondary)'
    }}>
      <style>{`
        .tour-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }
        
        @media (max-width: 1024px) {
          .tour-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
        
        .tour-hero { 
          position: relative; 
          height: 400px; 
          overflow: hidden; 
          border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
        }
        
        @media (max-width: 768px) {
          .tour-hero {
            height: 250px;
            border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          }
        }
        
        .tour-hero::after { 
          content: ""; 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(transparent 40%, rgba(0,0,0,0.7)); 
        }

        .tour-chip { 
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

        .tour-card { 
          background: var(--gradient-card); 
          border-radius: var(--radius-2xl); 
          border: 1px solid rgba(0, 191, 174, 0.2); 
          box-shadow: var(--shadow-xl); 
          backdrop-filter: blur(20px); 
          overflow: hidden; 
        }

        .tour-content-wrapper {
          padding: 2.5rem;
        }
        
        @media (max-width: 768px) {
          .tour-content-wrapper {
            padding: 1.5rem;
          }
        }

        .tour-title { 
          font-size: clamp(1.5rem, 4vw, 3rem); 
          font-weight: 800; 
          color: var(--gray-900); 
          margin: 0 0 1rem 0; 
          line-height: 1.2;
        }

        .tour-meta { 
          display: flex; 
          align-items: center; 
          gap: 1.5rem; 
          color: var(--gray-600); 
          font-size: 1rem; 
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        
        .tour-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tour-content { 
          color: var(--gray-700); 
          line-height: 1.8; 
          font-size: 1.1rem; 
          white-space: pre-line; 
        }

        .tour-back { 
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
          margin-bottom: 2rem;
        }
        
        .tour-back:hover { 
          background: rgba(0, 191, 174, 0.2);
          transform: translateY(-2px);
        }

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
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        
        .btn-primary { background: var(--primary-teal); color: white; }
        .btn-secondary { background: rgba(0, 191, 174, 0.1); color: var(--primary-teal); border: 1px solid rgba(0, 191, 174, 0.2); }
        .btn-outline { background: transparent; color: var(--gray-700); border: 1px solid var(--gray-300); }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

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
        
        .tab-btn.active {
          color: var(--primary-teal);
          border-bottom-color: var(--primary-teal);
        }

        .booking-card {
          background: var(--gradient-card);
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          position: sticky;
          top: 100px;
        }

        .booking-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          background: var(--primary-teal);
          color: white;
          border: none;
          border-radius: var(--radius-xl);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }
        
        .booking-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(15, 118, 110, 0.3);
        }
        
        .booking-btn:disabled {
          background: var(--gray-400);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(0, 191, 174, 0.05);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0, 191, 174, 0.1);
        }

        .info-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }

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
          background: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          background: var(--gradient-card);
          border-radius: var(--radius-xl);
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          border: 1px solid rgba(0, 191, 174, 0.2);
          box-shadow: var(--shadow-xl);
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--gray-700);
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.7);
          outline: none;
          font-size: 1rem;
        }

        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(0, 191, 174, 0.2);
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.7);
          outline: none;
          font-size: 1rem;
          resize: vertical;
          min-height: 100px;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .tour-grid {
            gap: 1rem;
          }
          
          .tour-content-wrapper {
            padding: 1rem;
          }
          
          .tour-title {
            font-size: clamp(1.3rem, 5vw, 2rem);
          }
          
          .tour-meta {
            gap: 1rem;
            font-size: 0.9rem;
            flex-direction: column;
            align-items: flex-start;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .action-btn {
            width: 100%;
            justify-content: center;
          }
          
          .booking-card {
            position: static;
            margin-top: 2rem;
          }
          
          .related-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.25rem' }}>
        {/* Navigation */}
        <Link to="/tours" className="tour-back">
          <FaArrowLeft /> {currentLanguage === 'it' ? 'Torna ai Tour' : 'Back to Tours'}
        </Link>

        {/* Main Content Grid */}
        <div className="tour-grid">
          {/* Main Tour Content */}
          <div>
            {/* Tour Card */}
            <div className="tour-card">
              {/* Hero Image */}
              {tour.image_url && (
                <div 
                  className="tour-hero"
                  style={{ 
                    backgroundImage: `url(${tour.image_url})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center'
                  }}
                >
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
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 10
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
                    boxShadow: '0 4px 12px rgba(0, 191, 174, 0.3)',
                    zIndex: 10
                  }}>
                    {tour.tour_type || 'Tour'}
                  </div>
                </div>
              )}

              {/* Tour Content */}
              <div className="tour-content-wrapper">
                {/* Title and Meta */}
                <h1 className="tour-title">
                  {currentLanguage === 'it' && tour.title_it ? tour.title_it : tour.title}
                </h1>
                
                <div className="tour-meta">
                  {tour.tour_type && (
                    <span className="tour-chip">
                      <FaTag /> {tour.tour_type}
                    </span>
                  )}
                  <span className="tour-meta-item">
                    <FaCalendarAlt /> {formatDate(tour.date)}
                  </span>
                  <span className="tour-meta-item">
                    <FaClock /> {new Date(tour.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </span>
                  <span className="tour-meta-item">
                    <FaMapMarkerAlt /> {currentLanguage === 'it' && tour.location_it ? tour.location_it : tour.location}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button 
                    className={`action-btn ${isBookmarked ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleBookmark}
                  >
                    <FaBookmark style={{ color: isBookmarked ? 'white' : 'var(--primary-teal)' }} />
                    {isBookmarked ? 
                      (currentLanguage === 'it' ? 'Salvato' : 'Saved') : 
                      (currentLanguage === 'it' ? 'Salva' : 'Save')}
                  </button>
                  
                  <button className="action-btn btn-outline" onClick={handleShare}>
                    <FaShare /> {currentLanguage === 'it' ? 'Condividi' : 'Share'}
                  </button>
                  
                </div>

                {/* Description */}
                <div className="tour-content">
                  {currentLanguage === 'it' && tour.description_it 
                    ? tour.description_it 
                    : tour.description}
                </div>

                {/* Tour Information Grid */}
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <FaUser />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                        {currentLanguage === 'it' ? 'Guida' : 'Guide'}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>{tour.guide_name}</div>
                    </div>
                  </div>
                  
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <FaDollarSign />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                        {currentLanguage === 'it' ? 'Prezzo' : 'Price'}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                        {formatPrice(tour.price)} {currentLanguage === 'it' ? 'per persona' : 'per person'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Includes and Requirements */}
                {(tour.includes?.length > 0 || tour.requirements?.length > 0) && (
                  <div style={{ marginTop: '2rem' }}>
                    {tour.includes?.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: '700', color: 'var(--gray-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaCheckCircle style={{ color: 'var(--primary-teal)' }} />
                          {currentLanguage === 'it' ? 'Cosa è Incluso' : 'What\'s Included'}
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {tour.includes.map((item, index) => (
                            <li key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              marginBottom: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(0, 191, 174, 0.05)',
                              borderRadius: 'var(--radius-lg)'
                            }}>
                              <FaCheckCircle style={{ color: 'var(--primary-teal)', fontSize: '0.8rem' }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {tour.requirements?.length > 0 && (
                      <div>
                        <h3 style={{ fontWeight: '700', color: 'var(--gray-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaExclamationTriangle style={{ color: 'var(--orange-500)' }} />
                          {currentLanguage === 'it' ? 'Requisiti' : 'Requirements'}
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {tour.requirements.map((item, index) => (
                            <li key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              marginBottom: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(251, 146, 60, 0.05)',
                              borderRadius: 'var(--radius-lg)'
                            }}>
                              <FaInfoCircle style={{ color: 'var(--orange-500)', fontSize: '0.8rem' }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div>
            <div className="booking-card">
                    <h3 style={{ fontWeight: '700', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                {currentLanguage === 'it' ? 'Prenota Questo Tour' : 'Book This Tour'}
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-teal)' }}>
                  {formatPrice(tour.price)}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                  {currentLanguage === 'it' ? 'per persona' : 'per person'}
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--gray-600)' }}>
                    {currentLanguage === 'it' ? 'Orario di inizio:' : 'Start time:'}
                  </span>
                  <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                    {new Date(tour.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)' }}>
                    {currentLanguage === 'it' ? 'Data:' : 'Date:'}
                  </span>
                  <span style={{ fontWeight: '600', color: 'var(--gray-800)' }}>
                    {new Date(tour.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <button 
                className="booking-btn"
                onClick={() => setShowBookingModal(true)}
                disabled={tour.status !== 'active'}
              >
                {tour.status !== 'active' ? 
                  (currentLanguage === 'it' ? 'Tour Non Disponibile' : 'Tour Unavailable') : 
                  (currentLanguage === 'it' ? 'Prenota Ora' : 'Book Now')}
              </button>
              
              {tour.guide_contact && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0, 191, 174, 0.05)', borderRadius: 'var(--radius-lg)' }}>
                  <h4 style={{ fontWeight: '600', color: 'var(--gray-800)', marginBottom: '0.5rem' }}>
                    {currentLanguage === 'it' ? 'Contatta la Guida' : 'Contact Guide'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-600)' }}>
                    <FaEnvelope />
                    <span style={{ fontSize: '0.9rem' }}>{tour.guide_contact}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Tours */}
        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontWeight: '800', color: 'var(--gray-900)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaFire style={{ color: 'var(--primary-teal)' }} />
              {currentLanguage === 'it' ? 'Tour Correlati' : 'Related Tours'}
            </h2>
            <div className="related-grid">
              {related.map((r) => (
                <Link key={r.id} to={`/tours/${r.id}`} style={{
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
                    backgroundImage: `url(${r.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop'})`, 
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
                      fontWeight: '600'
                    }}>
                      {r.tour_type}
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ 
                      fontWeight: '700', 
                      color: 'var(--gray-900)', 
                      marginBottom: '0.75rem',
                      fontSize: '1.1rem',
                      lineHeight: 1.3
                    }}>
                      {currentLanguage === 'it' && r.title_it ? r.title_it : r.title}
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      color: 'var(--gray-500)',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FaMapMarkerAlt /> {currentLanguage === 'it' && r.location_it ? r.location_it : r.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FaClock /> {new Date(r.date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: 'var(--primary-teal)'
                    }}>
                      <span>{formatPrice(r.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                {currentLanguage === 'it' ? 'Prenota Tour:' : 'Book Tour:'} {tour.title}
              </h3>
              <button
                onClick={() => setShowBookingModal(false)}
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

            <div className="form-group">
              <label className="form-label">
                {currentLanguage === 'it' ? 'Nome Completo *' : 'Full Name *'}
              </label>
              <input
                type="text"
                className="form-input"
                value={bookingData.guest_name}
                onChange={(e) => setBookingData(prev => ({ ...prev, guest_name: e.target.value }))}
                placeholder={currentLanguage === 'it' ? 'Inserisci il tuo nome completo' : 'Enter your full name'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={bookingData.guest_email}
                onChange={(e) => setBookingData(prev => ({ ...prev, guest_email: e.target.value }))}
                placeholder={currentLanguage === 'it' ? 'Inserisci la tua email' : 'Enter your email'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {currentLanguage === 'it' ? 'Numero di Telefono' : 'Phone Number'}
              </label>
              <input
                type="tel"
                className="form-input"
                value={bookingData.guest_phone}
                onChange={(e) => setBookingData(prev => ({ ...prev, guest_phone: e.target.value }))}
                placeholder={currentLanguage === 'it' ? 'Inserisci il tuo numero di telefono' : 'Enter your phone number'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {currentLanguage === 'it' ? 'Numero di Ospiti *' : 'Number of Guests *'}
              </label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="20"
                value={bookingData.number_of_guests}
                onChange={(e) => setBookingData(prev => ({ ...prev, number_of_guests: parseInt(e.target.value) }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {currentLanguage === 'it' ? 'Richieste Speciali' : 'Special Requests'}
              </label>
              <textarea
                className="form-textarea"
                value={bookingData.special_requests}
                onChange={(e) => setBookingData(prev => ({ ...prev, special_requests: e.target.value }))}
                placeholder={currentLanguage === 'it' ? 'Eventuali richieste speciali o esigenze dietetiche...' : 'Any special requests or dietary requirements...'}
              />
            </div>

            <div style={{
              padding: '1rem',
              background: 'rgba(0, 191, 174, 0.05)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(0, 191, 174, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{currentLanguage === 'it' ? 'Prezzo Totale:' : 'Total Price:'}</span>
                <span style={{ fontWeight: '700', color: 'var(--primary-teal)' }}>
                  {formatPrice(tour.price * bookingData.number_of_guests)}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                {bookingData.number_of_guests} × {formatPrice(tour.price)} {currentLanguage === 'it' ? 'per persona' : 'per person'}
              </div>
            </div>

            <button
              className="booking-btn"
              onClick={handleBookingSubmit}
              disabled={!bookingData.guest_name || !bookingData.guest_email || bookingData.number_of_guests < 1}
            >
              {currentLanguage === 'it' ? 'Conferma Prenotazione' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                {currentLanguage === 'it' ? 'Condividi Tour' : 'Share Tour'}
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
                <FaShare /> {currentLanguage === 'it' ? 'Copia Link' : 'Copy Link'}
              </button>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(0, 191, 174, 0.05)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0, 191, 174, 0.1)'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                  {currentLanguage === 'it' ? 'URL Tour:' : 'Tour URL:'}
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

export default TourDetails;
