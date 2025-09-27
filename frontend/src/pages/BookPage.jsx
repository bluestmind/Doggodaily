import React, { useState, useEffect } from 'react';
import { FaStar, FaHeart, FaExternalLinkAlt, FaSearch, FaBook, FaBookOpen, FaPaw, FaAward, FaShoppingCart, FaArrowRight, FaQuoteLeft, FaUser, FaCalendarAlt, FaGift, FaPen, FaGraduationCap, FaMedal, FaUsers, FaDownload, FaPlay } from 'react-icons/fa';
import { apiCall } from '../config/api';
import { useLanguage } from '../contexts/LanguageContext';

const BookPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [selectedBook, setSelectedBook] = useState(null);
  const [likedBooks, setLikedBooks] = useState(new Set());
  const [showBookModal, setShowBookModal] = useState(false);
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch books and authors from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user's current language
        const userLanguage = currentLanguage || 'en';
        
        // Fetch books, authors, and page content in parallel with language parameter
        const [booksResponse, authorsResponse] = await Promise.all([
          apiCall(`/api/books/public/books?lang=${userLanguage}`, 'GET'),
          apiCall(`/api/books/public/authors?lang=${userLanguage}`, 'GET')
        ]);
        
        if (booksResponse.success) {
          console.log(`📚 Books fetched successfully (${userLanguage}):`, booksResponse.books);
          setBooks(booksResponse.books || []);
        } else {
          console.error('Failed to fetch books:', booksResponse.message);
        }
        
        if (authorsResponse.success) {
          console.log(`👤 Authors fetched successfully (${userLanguage}):`, authorsResponse.authors);
          setAuthors(authorsResponse.authors || []);
        } else {
          console.error('Failed to fetch authors:', authorsResponse.message);
        }
        
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load books and authors');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentLanguage]); // Re-fetch when language changes

  // Helper function to get content value with fallback

  // Get the primary author (first one, or fallback to default)
  const author = authors.length > 0 ? {
    name: authors[0].name,
    title: authors[0].title || t('book.author'),
    image: authors[0].image_url || authors[0].image || "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop&crop=faces",
    bio: authors[0].bio || t('book.author_bio_not_available'),
    credentials: Array.isArray(authors[0].credentials) ? authors[0].credentials : [],
    achievements: Array.isArray(authors[0].achievements) ? authors[0].achievements : [],
    quote: authors[0].quote || t('book.quote'),
    hero_title: authors[0].hero_title || t('book.hero.title'),
    hero_subtitle: authors[0].hero_subtitle || t('book.hero.subtitle'),
    book_section_title: authors[0].book_section_title || t('book.hero.title'),
    book_section_subtitle: authors[0].book_section_subtitle || t('book.hero.subtitle')
  } : {
    name: t('book.author'),
    title: t('book.author'),
    image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop&crop=faces",
    bio: t('book.author_info_will_appear'),
    credentials: [],
    achievements: [],
    quote: t('book.quote'),
    hero_title: t('book.hero.title'),
    hero_subtitle: t('book.hero.subtitle'),
    book_section_title: t('book.hero.title'),
    book_section_subtitle: t('book.hero.subtitle')
  };

  // Transform books data to match the expected format
  const authorBooks = books.map(book => {
    return {
      id: book.id,
      title: book.title,
      subtitle: book.subtitle || "",
      publishYear: new Date(book.created_at).getFullYear(),
      category: book.category || t('book.general_category'),
      price: parseFloat(book.price) || 0,
      originalPrice: parseFloat(book.original_price) || 0,
      rating: 4.5, // Default rating since we don't have reviews yet
      reviews: Math.floor(Math.random() * 1000) + 100, // Random reviews for demo
      image: book.image_url || book.image || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=600&fit=crop",
      description: book.description || t('book.no_description_available'),
      highlights: book.tags && typeof book.tags === 'string' ? 
        book.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : 
        t('book.default_highlights'),
      amazonLink: book.amazon_link || "#",
      barnesNobleLink: book.barnes_noble_link || "#",
      bestseller: book.featured || false,
      newest: book.featured || false,
      preview: book.preview || book.description || t('book.preview_not_available')
    };
  });


  const handleLikeBook = (bookId) => {
    const newLikedBooks = new Set(likedBooks);
    if (likedBooks.has(bookId)) {
      newLikedBooks.delete(bookId);
    } else {
      newLikedBooks.add(bookId);
    }
    setLikedBooks(newLikedBooks);
  };

  const handleExternalLink = (url, platform) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleReadMore = (book) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        paddingTop: '80px',
        background: 'var(--gradient-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--gray-600)'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            📚
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            {t('book.loading.title')}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            opacity: 0.8
          }}>
            {t('book.loading.description')}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        paddingTop: '80px',
        background: 'var(--gradient-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--red-500)',
          maxWidth: '500px',
          padding: '2rem'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            ❌
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            {t('book.error.title')}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '2rem',
            opacity: 0.8
          }}>
            {t('book.error.description')}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--primary-teal)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {t('book.error.button_text')}
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no books
  if (books.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        paddingTop: '80px',
        background: 'var(--gradient-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--gray-600)',
          maxWidth: '500px',
          padding: '2rem'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            📖
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            {t('book.empty_state.title')}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '2rem',
            opacity: 0.8
          }}>
            {t('book.empty_state.description')}
          </p>
          <p style={{
            fontSize: '1rem',
            opacity: 0.6
          }}>
            {t('book.empty_state.subtitle')}
          </p>
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
      {/* Hero Section - Author Introduction */}
      <section className="hero-section" style={{
        background: 'var(--gradient-primary)',
        color: 'white',
        padding: '5rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'url("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=800&fit=crop") center/cover',
          opacity: 0.1
        }} />
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 clamp(1rem, 4vw, 2rem)',
          position: 'relative',
          zIndex: 2
        }}>
          <div className="hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}>
          {/* Add media query styles for mobile */}
          <style>{`
            @media (max-width: 768px) {
              .hero-grid {
                grid-template-columns: 1fr !important;
                gap: 2rem !important;
              }
              .achievements-grid {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 1rem !important;
              }
              .featured-book-grid {
                grid-template-columns: 1fr !important;
                gap: 2rem !important;
              }
              .book-image {
                width: 250px !important;
                height: 375px !important;
                margin: 0 auto !important;
                transform: none !important;
              }
              .book-image:hover {
                transform: scale(1.02) !important;
              }
              .book-buttons {
                flex-direction: column !important;
                gap: 1rem !important;
              }
              .book-button {
                flex: none !important;
                width: 100% !important;
                min-width: auto !important;
              }
              .price-section {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 1rem !important;
              }
              .modal-content {
                margin: 1rem !important;
                max-height: 95vh !important;
              }
              .modal-grid {
                grid-template-columns: 1fr !important;
                gap: 2rem !important;
              }
              .modal-book-image {
                width: 150px !important;
                height: 225px !important;
              }
            }
            @media (max-width: 480px) {
              .hero-section {
                padding: 3rem 0 !important;
              }
              .featured-book-section {
                padding: 2rem 1rem !important;
              }
              .book-image {
                width: 200px !important;
                height: 300px !important;
              }
              .achievements-grid {
                grid-template-columns: 1fr 1fr !important;
                gap: 0.5rem !important;
              }
              .achievements-grid > div {
                font-size: 0.9rem !important;
              }
              .achievements-grid > div > div:first-child {
                font-size: 1.5rem !important;
              }
              .modal-content {
                margin: 0.5rem !important;
                border-radius: 1rem !important;
              }
              .modal-book-image {
                width: 120px !important;
                height: 180px !important;
              }
            }
          `}</style>
            {/* Author Photo & Intro */}
            <div style={{
              textAlign: 'center'
            }}>
              <div style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundImage: `url(${author.image_url || author.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                margin: '0 auto 2rem auto',
                border: '5px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
              }} />
              
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                marginBottom: '1rem',
                lineHeight: 1.2,
                color: 'black',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto'
              }}>
                {author.name}
              </h1>
              
              <p style={{
                fontSize: '1.3rem',
                marginBottom: '2rem',
                opacity: 0.95,
                fontWeight: 600,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto'
              }}>
                {author.title}
              </p>

              <div className="achievements-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '2rem',
                justifyContent: 'center',
                marginBottom: '2rem'
              }}>
                {author.achievements.map((achievement, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 800, 
                      marginBottom: '0.5rem',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      {achievement.split(' ')[0]}
                    </div>
                    <div style={{ 
                      opacity: 0.9, 
                      fontSize: '0.9rem',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      {achievement.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Author Story */}
        <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-2xl)',
                padding: '2.5rem',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <FaQuoteLeft style={{
                  fontSize: '2rem',
                  opacity: 0.3,
                  marginBottom: '1rem'
                }} />
                
                <p style={{
                  fontSize: '1.2rem',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  fontStyle: 'italic',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                  {author.quote}
                </p>

                <p style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  opacity: 0.95,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                  {author.bio}
                </p>

                <div style={{
                  display: 'grid',
                  gap: '0.75rem'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaGraduationCap />
                    {t('book.credentials')} & {t('book.experience')}
                  </h4>
                  {author.credentials.map((credential, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      fontSize: '0.95rem',
                      opacity: 0.9,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'white',
                        flexShrink: 0,
                        marginTop: '0.4rem'
                      }} />
                      <span>{credential}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Books Collection */}
      <section style={{
        padding: '5rem 0',
        background: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 clamp(1rem, 4vw, 2rem)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              fontWeight: 800,
              color: 'var(--gray-900)',
              marginBottom: '1rem',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto'
            }}>
              {author.book_section_title}
            </h2>
            
            <p style={{
              fontSize: '1.3rem',
              color: 'var(--gray-600)',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto'
            }}>
              {author.book_section_subtitle}
            </p>
          </div>

          {/* Featured Book (Newest) */}
          <div className="featured-book-section" style={{
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-3xl)',
            padding: '3rem',
            marginBottom: '4rem',
            border: '1px solid rgba(0, 191, 174, 0.2)',
            boxShadow: 'var(--shadow-2xl)'
          }}>
            <div className="featured-book-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '3rem',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <span style={{
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaStar />
                    NEWEST RELEASE
                  </span>
                  <span style={{
                    background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaMedal />
                    {t('book.bestseller').toUpperCase()}
                  </span>
                </div>

                <h3 style={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  color: 'var(--gray-900)',
                  marginBottom: '1rem',
                  lineHeight: 1.2,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                  {authorBooks[0]?.title || t('book.featured_book')}
                </h3>

                <p style={{
                  fontSize: '1.3rem',
                  color: 'var(--primary-teal)',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                  {authorBooks[0]?.subtitle || t('book.book_subtitle')}
                </p>

                <p style={{
                  fontSize: '1.1rem',
                  color: 'var(--gray-700)',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                  {authorBooks[0]?.description || "Book description will appear here."}
                </p>

                <div className="price-section" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2rem',
                  marginBottom: '2rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          style={{
                            color: i < Math.floor(authorBooks[0].rating) ? '#ffd700' : '#e0e0e0',
                            fontSize: '1.1rem'
                          }}
                        />
                      ))}
                    </div>
                    <span style={{
                      fontSize: '1.1rem',
                      color: 'var(--gray-600)',
                      fontWeight: 600
                    }}>
                      {authorBooks[0]?.rating || 4.5} ({authorBooks[0]?.reviews?.toLocaleString() || 0} {t('book.reviews')})
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: 'var(--primary-teal)'
                    }}>
                      ${authorBooks[0]?.price || 0}
                    </span>
                    {authorBooks[0]?.originalPrice && authorBooks[0].originalPrice > authorBooks[0].price && (
                      <span style={{
                        fontSize: '1.2rem',
                        color: 'var(--gray-500)',
                        textDecoration: 'line-through'
                      }}>
                        ${authorBooks[0].originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="book-buttons" style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <button
                    onClick={() => handleExternalLink(authorBooks[0]?.amazonLink || "#", 'Amazon')}
                    className="book-button"
                    style={{
                      background: 'linear-gradient(135deg, #ff9900, #ff7700)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-xl)',
                      padding: '1rem 2rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'var(--transition-base)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      flex: 1,
                      minWidth: '200px'
                    }}
                  >
                    <FaShoppingCart />
                    {t('book.get_your_copy')}
                  </button>

                  <button
                    onClick={() => handleExternalLink(authorBooks[0]?.barnesNobleLink || "#", 'Barnes & Noble')}
                    className="book-button"
                    style={{
                      background: 'linear-gradient(135deg, #00704a, #005c3e)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-xl)',
                      padding: '1rem 2rem',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'var(--transition-base)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      flex: 1,
                      minWidth: '200px'
                    }}
                  >
                    <FaBook />
                    {t('book.get_your_copy')}
                  </button>
                </div>

                <button
                  onClick={() => authorBooks[0] && handleReadMore(authorBooks[0])}
                  style={{
                    background: 'none',
                    border: '2px solid var(--primary-teal)',
                    color: 'var(--primary-teal)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaBookOpen />
                  {t('book.read_preview')}
                </button>
              </div>

              <div style={{
                textAlign: 'center'
              }}>
                <div className="book-image" style={{
                  width: '300px',
                  height: '450px',
                  maxWidth: '90vw',
                  backgroundImage: `url(${authorBooks[0]?.image_url || authorBooks[0]?.image || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=600&fit=crop"})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 'var(--radius-2xl)',
                  margin: '0 auto',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
                  transform: 'rotate(-5deg)',
                  transition: 'var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'rotate(0deg) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'rotate(-5deg) scale(1)';
                }}
                />
              </div>
            </div>
          </div>


      </div>
    </section>



      {/* Book Preview Modal */}
      {showBookModal && selectedBook && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: 'var(--radius-3xl)',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowBookModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.5rem',
                zIndex: 10
              }}
            >
              ×
            </button>

            <div style={{ padding: '3rem' }}>
              <div className="modal-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '3rem',
                alignItems: 'center',
                marginBottom: '3rem'
              }}>
                <div className="modal-book-image" style={{
                  width: '200px',
                  height: '300px',
                  maxWidth: '80vw',
                  backgroundImage: `url(${selectedBook.image_url || selectedBook.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 'var(--radius-2xl)',
                  margin: '0 auto',
                  boxShadow: 'var(--shadow-2xl)'
                }} />

                <div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--gray-900)',
                    marginBottom: '1rem',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}>
                    {selectedBook.title}
                  </h3>
                  <p style={{
                    fontSize: '1.2rem',
                    color: 'var(--primary-teal)',
                    fontWeight: 600,
                    marginBottom: '2rem',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}>
                    {selectedBook.subtitle}
                  </p>
                  <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--gray-700)',
                    lineHeight: 1.6,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}>
                    {selectedBook.preview}
                  </p>
                </div>
              </div>

              <div style={{
                background: 'var(--gradient-card)',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--gray-900)',
                  marginBottom: '1rem'
                }}>
                  {t('book.what_youll_discover')}:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: '0.75rem'
                }}>
                  {selectedBook.highlights.map((highlight, index) => (
                    <li key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      fontSize: '1rem',
                      color: 'var(--gray-700)',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--primary-teal)',
                        flexShrink: 0,
                        marginTop: '0.4rem'
                      }} />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="book-buttons" style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => handleExternalLink(selectedBook.amazonLink, 'Amazon')}
                  className="book-button"
                  style={{
                    background: 'linear-gradient(135deg, #ff9900, #ff7700)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    minWidth: '200px'
                  }}
                >
                  <FaShoppingCart />
                  Get on Amazon
                </button>

                <button
                  onClick={() => handleExternalLink(selectedBook.barnesNobleLink, 'Barnes & Noble')}
                  className="book-button"
                  style={{
                    background: 'linear-gradient(135deg, #00704a, #005c3e)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    minWidth: '200px'
                  }}
                >
                  <FaBook />
                  Barnes & Noble
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookPage; 