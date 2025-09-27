import React, { useState, useEffect } from 'react';
import { 
  FaBook, FaPlus, FaEdit, FaTrash, FaEye, FaUpload, FaSave, FaTimes,
  FaUser, FaImage, FaLink, FaTag, FaStar, FaDollarSign, FaCalendarAlt,
  FaSearch, FaFilter, FaSort, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import BookModal from './BookModal';
import AuthorModal from './AuthorModal';

const BookManagement = ({ adminService }) => {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [activeTab, setActiveTab] = useState('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Book form state
  const [bookForm, setBookForm] = useState({
    // English fields
    title: '',
    subtitle: '',
    description: '',
    preview: '',
    category: '',
    tags: '',
    
    // Italian fields
    title_it: '',
    subtitle_it: '',
    description_it: '',
    preview_it: '',
    category_it: '',
    tags_it: '',
    
    // Common fields
    price: '',
    original_price: '',
    currency: 'USD',
    availability: 'available',
    external_links: '[]',
    amazon_link: '',
    barnes_noble_link: '',
    featured: false,
    order_index: 0,
    image: null
  });

  // Author form state
  const [authorForm, setAuthorForm] = useState({
    // English fields
    name: '',
    title: '',
    bio: '',
    credentials: '[]',
    achievements: '[]',
    quote: '',
    hero_title: '',
    hero_subtitle: '',
    book_section_title: '',
    book_section_subtitle: '',
    
    // Italian fields
    name_it: '',
    title_it: '',
    bio_it: '',
    credentials_it: '[]',
    achievements_it: '[]',
    quote_it: '',
    hero_title_it: '',
    hero_subtitle_it: '',
    book_section_title_it: '',
    book_section_subtitle_it: '',
    
    // Common fields
    social_links: '[]',
    contact_email: '',
    contact_link: '',
    image: null
  });

  useEffect(() => {
    loadBooks();
    loadAuthors();
  }, [currentPage, searchTerm]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      
      const response = await adminService.getBooks({
        page: currentPage,
        search: searchTerm
      });
      
      if (response.success) {
        setBooks(response.books || []);
        setTotalPages(response.meta?.pages || 1);
      } else {
        toast.error(response.message || 'Failed to load books');
      }
    } catch (error) {
      console.error('Error loading books:', error);
      toast.error('Failed to load books: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuthors = async () => {
    try {
      const response = await adminService.getAuthors();
      if (response.success) {
        setAuthors(response.authors || []);
      }
    } catch (error) {
      console.error('Error loading authors:', error);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(bookForm).forEach(key => {
        if (key !== 'image' && bookForm[key] !== null) {
          formData.append(key, bookForm[key]);
        }
      });
      
      if (bookForm.image) {
        formData.append('image', bookForm.image);
      }

      let response;
      if (editingBook) {
        response = await adminService.updateBook(editingBook.id, formData);
      } else {
        response = await adminService.createBook(formData);
      }

      if (response.success) {
        toast.success(response.message);
        setShowBookModal(false);
        setEditingBook(null);
        resetBookForm();
        loadBooks();
      } else {
        toast.error(response.message || 'Failed to save book');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      toast.error('Failed to save book: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(authorForm).forEach(key => {
        if (key !== 'image' && authorForm[key] !== null) {
          formData.append(key, authorForm[key]);
        }
      });
      
      if (authorForm.image) {
        formData.append('image', authorForm.image);
      }

      let response;
      if (editingAuthor) {
        response = await adminService.updateAuthor(editingAuthor.id, formData);
      } else {
        response = await adminService.createAuthor(formData);
      }

      if (response.success) {
        toast.success(response.message);
        setShowAuthorModal(false);
        setEditingAuthor(null);
        resetAuthorForm();
        loadAuthors();
      } else {
        toast.error(response.message || 'Failed to save author');
      }
    } catch (error) {
      console.error('Error saving author:', error);
      toast.error('Failed to save author');
    } finally {
      setLoading(false);
    }
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      subtitle: '',
      description: '',
      preview: '',
      price: '',
      original_price: '',
      currency: 'USD',
      availability: 'available',
      category: '',
      tags: '',
      external_links: '[]',
      amazon_link: '',
      barnes_noble_link: '',
      featured: false,
      order_index: 0,
      image: null
    });
  };

  const resetAuthorForm = () => {
    setAuthorForm({
      name: '',
      title: '',
      bio: '',
      credentials: '[]',
      achievements: '[]',
      quote: '',
      social_links: '[]',
      contact_email: '',
      contact_link: '',
      hero_title: '',
      hero_subtitle: '',
      book_section_title: '',
      book_section_subtitle: '',
      image: null
    });
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title || '',
      subtitle: book.subtitle || '',
      description: book.description || '',
      preview: book.preview || '',
      price: book.price || '',
      original_price: book.original_price || '',
      currency: book.currency || 'USD',
      availability: book.availability || 'available',
      category: book.category || '',
      tags: Array.isArray(book.tags) ? book.tags.join(', ') : book.tags || '',
      external_links: JSON.stringify(book.external_links || []),
      amazon_link: book.amazon_link || '',
      barnes_noble_link: book.barnes_noble_link || '',
      featured: book.featured || false,
      order_index: book.order_index || 0,
      image: null
    });
    setShowBookModal(true);
  };

  const handleEditAuthor = (author) => {
    setEditingAuthor(author);
    setAuthorForm({
      name: author.name || '',
      title: author.title || '',
      bio: author.bio || '',
      credentials: JSON.stringify(author.credentials || []),
      achievements: JSON.stringify(author.achievements || []),
      quote: author.quote || '',
      social_links: JSON.stringify(author.social_links || []),
      contact_email: author.contact_email || '',
      contact_link: author.contact_link || '',
      hero_title: author.hero_title || '',
      hero_subtitle: author.hero_subtitle || '',
      book_section_title: author.book_section_title || '',
      book_section_subtitle: author.book_section_subtitle || '',
      image: null
    });
    setShowAuthorModal(true);
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      setLoading(true);
      const response = await adminService.deleteBook(bookId);
      
      if (response.success) {
        toast.success('Book deleted successfully');
        loadBooks();
      } else {
        toast.error(response.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'book') {
        setBookForm(prev => ({ ...prev, image: file }));
      } else {
        setAuthorForm(prev => ({ ...prev, image: file }));
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: 'var(--gray-900)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaBook />
          Book Management
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>
          Manage books, authors, and all book-related content
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid var(--gray-200)'
      }}>
        <button
          onClick={() => setActiveTab('books')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'books' ? 'var(--primary-teal)' : 'transparent',
            color: activeTab === 'books' ? 'white' : 'var(--gray-600)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          Books ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('authors')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: activeTab === 'authors' ? 'var(--primary-teal)' : 'transparent',
            color: activeTab === 'authors' ? 'white' : 'var(--gray-600)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          Authors ({authors.length})
        </button>
      </div>

      {/* Search and Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-400)'
          }} />
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              border: '2px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-teal)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
          />
        </div>
        
        <button
          onClick={() => {
            if (activeTab === 'books') {
              resetBookForm();
              setEditingBook(null);
              setShowBookModal(true);
            } else {
              resetAuthorForm();
              setEditingAuthor(null);
              setShowAuthorModal(true);
            }
          }}
          style={{
            background: 'var(--primary-teal)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'var(--primary-teal-dark)'}
          onMouseLeave={(e) => e.target.style.background = 'var(--primary-teal)'}
        >
          <FaPlus />
          Add {activeTab === 'books' ? 'Book' : 'Author'}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'books' ? (
        <BooksList 
          books={books}
          loading={loading}
          onEdit={handleEditBook}
          onDelete={handleDeleteBook}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      ) : (
        <AuthorsList 
          authors={authors}
          loading={loading}
          onEdit={handleEditAuthor}
        />
      )}

      {/* Book Modal */}
      {showBookModal && (
        <BookModal
          bookForm={bookForm}
          setBookForm={setBookForm}
          onSubmit={handleBookSubmit}
          onClose={() => {
            setShowBookModal(false);
            setEditingBook(null);
            resetBookForm();
          }}
          onFileChange={(e) => handleFileChange(e, 'book')}
          editing={!!editingBook}
          loading={loading}
        />
      )}

      {/* Author Modal */}
      {showAuthorModal && (
        <AuthorModal
          authorForm={authorForm}
          setAuthorForm={setAuthorForm}
          onSubmit={handleAuthorSubmit}
          onClose={() => {
            setShowAuthorModal(false);
            setEditingAuthor(null);
            resetAuthorForm();
          }}
          onFileChange={(e) => handleFileChange(e, 'author')}
          editing={!!editingAuthor}
          loading={loading}
        />
      )}
    </div>
  );
};

// Books List Component
const BooksList = ({ books, loading, onEdit, onDelete, currentPage, totalPages, onPageChange }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--gray-500)' }}>Loading books...</div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        background: 'var(--gray-50)',
        borderRadius: 'var(--radius-lg)',
        border: '2px dashed var(--gray-200)'
      }}>
        <FaBook style={{ fontSize: '3rem', color: 'var(--gray-400)', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>No books found</h3>
        <p style={{ color: 'var(--gray-500)' }}>Start by adding your first book</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {books.map(book => (
          <div key={book.id} style={{
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}>
            {/* Book Image */}
            <div style={{
              height: '200px',
              backgroundImage: `url(${book.image_url || book.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              {book.featured && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: 'var(--primary-teal)',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <FaStar />
                  Featured
                </div>
              )}
            </div>

            {/* Book Info */}
            <div style={{ padding: '1rem' }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                marginBottom: '0.5rem',
                lineHeight: 1.3
              }}>
                {book.title}
              </h3>
              
              {book.subtitle && (
                <p style={{
                  fontSize: '0.9rem',
                  color: 'var(--gray-600)',
                  marginBottom: '0.5rem'
                }}>
                  {book.subtitle}
                </p>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {book.price && (
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--primary-teal)'
                    }}>
                      {book.currency} {book.price}
                    </span>
                  )}
                  {book.original_price && book.original_price !== book.price && (
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--gray-500)',
                      textDecoration: 'line-through'
                    }}>
                      {book.currency} {book.original_price}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--gray-500)',
                  textTransform: 'capitalize'
                }}>
                  {book.availability}
                </span>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => onEdit(book)}
                  style={{
                    flex: 1,
                    background: 'var(--primary-teal)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <FaEdit />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(book.id)}
                  style={{
                    background: 'var(--red-500)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
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
          gap: '1rem'
        }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              background: currentPage === 1 ? 'var(--gray-200)' : 'var(--primary-teal)',
              color: currentPage === 1 ? 'var(--gray-500)' : 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <FaChevronLeft />
            Previous
          </button>
          
          <span style={{ color: 'var(--gray-600)' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              background: currentPage === totalPages ? 'var(--gray-200)' : 'var(--primary-teal)',
              color: currentPage === totalPages ? 'var(--gray-500)' : 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            Next
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

// Authors List Component
const AuthorsList = ({ authors, loading, onEdit }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--gray-500)' }}>Loading authors...</div>
      </div>
    );
  }

  if (authors.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        background: 'var(--gray-50)',
        borderRadius: 'var(--radius-lg)',
        border: '2px dashed var(--gray-200)'
      }}>
        <FaUser style={{ fontSize: '3rem', color: 'var(--gray-400)', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>No authors found</h3>
        <p style={{ color: 'var(--gray-500)' }}>Start by adding your first author</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
    }}>
      {authors.map(author => (
        <div key={author.id} style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}>
          {/* Author Image */}
          <div style={{
            height: '200px',
            backgroundImage: `url(${author.image_url || author.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=face'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }} />

          {/* Author Info */}
          <div style={{ padding: '1rem' }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '0.5rem'
            }}>
              {author.name}
            </h3>
            
            {author.title && (
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                {author.title}
              </p>
            )}

            {author.bio && (
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--gray-500)',
                lineHeight: 1.4,
                marginBottom: '1rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {author.bio}
              </p>
            )}

            {/* Actions */}
            <button
              onClick={() => onEdit(author)}
              style={{
                width: '100%',
                background: 'var(--primary-teal)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <FaEdit />
              Edit Author
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookManagement;
