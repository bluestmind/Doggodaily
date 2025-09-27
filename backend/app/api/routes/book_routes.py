#!/usr/bin/env python3
"""
Book management API routes for admin panel.
"""

import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_login import login_required, current_user
from app.models_book import Book, Author
from app import db
from app.auth.utils import TokenManager

# Create blueprint
book_bp = Blueprint('book', __name__)

# Test endpoint to check if routes are working
@book_bp.route('/test', methods=['GET'])
def test_book_routes():
    """Test endpoint to verify book routes are working."""
    return jsonify({
        'success': True,
        'message': 'Book routes are working!',
        'timestamp': datetime.now().isoformat()
    })

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_book_image(file, book_id=None):
    """Save book image and return the relative path."""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to avoid conflicts
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{timestamp}{ext}"
        
        # Create upload directory
        upload_dir = os.path.join(current_app.root_path, 'uploads', 'books')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, filename)
        file.save(file_path)
        
        # Return relative path for database storage
        return f'uploads/books/{filename}'
    return None

# ===== BOOK MANAGEMENT =====

@book_bp.route('/books', methods=['GET'])
@login_required
def get_books():
    """Get all books with pagination and filtering."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        featured = request.args.get('featured', '').strip()
        
        query = Book.query
        
        # Apply filters
        if search:
            query = query.filter(
                Book.title.contains(search) | 
                Book.subtitle.contains(search) |
                Book.description.contains(search)
            )
        
        if category:
            query = query.filter(Book.category == category)
        
        if featured:
            query = query.filter(Book.featured == (featured.lower() == 'true'))
        
        # Order by order_index, then by created_at
        query = query.order_by(Book.order_index.asc(), Book.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        books = [book.to_dict() for book in pagination.items]
        
        return jsonify({
            'success': True,
            'books': books,
            'meta': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get books error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get books'
        }), 500

@book_bp.route('/books/<int:book_id>', methods=['GET'])
@login_required
def get_book(book_id):
    """Get a specific book by ID."""
    try:
        book = Book.query.get_or_404(book_id)
        return jsonify({
            'success': True,
            'book': book.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get book error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Book not found'
        }), 404

@book_bp.route('/books', methods=['POST'])
@login_required
def create_book():
    """Create a new book."""
    try:
        print("🔍 Book creation endpoint called")
        print(f"🔍 Request method: {request.method}")
        print(f"🔍 Request form: {request.form}")
        print(f"🔍 Request files: {request.files}")
        
        data = request.form.to_dict()
        print(f"🔍 Form data: {data}")
        
        # Validate required fields
        if not data.get('title'):
            print("❌ Title is required")
            return jsonify({
                'success': False,
                'message': 'Title is required'
            }), 400
        
        # Handle file upload
        image_file = request.files.get('image')
        image_path = save_book_image(image_file) if image_file else None
        
        # Parse JSON fields
        external_links = data.get('external_links', '[]')
        if isinstance(external_links, str):
            try:
                json.loads(external_links)
            except json.JSONDecodeError:
                external_links = '[]'
        
        tags = data.get('tags', '')
        if isinstance(tags, list):
            tags = ','.join(tags)
        
        # Create book
        try:
            print("🔧 Creating book object...")
            book = Book(
                title=data['title'].strip(),
                subtitle=data.get('subtitle', '').strip(),
                description=data.get('description', '').strip(),
                preview=data.get('preview', '').strip(),
                image=image_path,
                price=data.get('price', '').strip(),
                original_price=data.get('original_price', '').strip(),
                currency=data.get('currency', 'USD'),
                availability=data.get('availability', 'available'),
                category=data.get('category', '').strip(),
                tags=tags,
                external_links=external_links,
                amazon_link=data.get('amazon_link', '').strip(),
                barnes_noble_link=data.get('barnes_noble_link', '').strip(),
                featured=data.get('featured', 'false').lower() == 'true',
                order_index=int(data.get('order_index', 0))
            )
            
            print("🔧 Adding book to session...")
            db.session.add(book)
            print("🔧 Committing to database...")
            db.session.commit()
            print(f"✅ Book created successfully with ID: {book.id}")
            
        except Exception as db_error:
            print(f"❌ Database error: {db_error}")
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': f'Database error: {str(db_error)}'
            }), 500
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'book_created',
            f'Created book: {book.title} (ID: {book.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Book created successfully',
            'book': book.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Create book error: {str(e)}")
        import traceback
        traceback.print_exc()
        current_app.logger.error(f"Create book error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Failed to create book: {str(e)}'
        }), 500

@book_bp.route('/books/<int:book_id>', methods=['PUT'])
@login_required
def update_book(book_id):
    """Update an existing book."""
    try:
        book = Book.query.get_or_404(book_id)
        data = request.form.to_dict()
        
        # Handle file upload
        image_file = request.files.get('image')
        if image_file:
            image_path = save_book_image(image_file, book_id)
            if image_path:
                book.image = image_path
        
        # Update fields
        if 'title' in data:
            book.title = data['title'].strip()
        if 'subtitle' in data:
            book.subtitle = data['subtitle'].strip()
        if 'description' in data:
            book.description = data['description'].strip()
        if 'preview' in data:
            book.preview = data['preview'].strip()
        if 'price' in data:
            book.price = data['price'].strip()
        if 'original_price' in data:
            book.original_price = data['original_price'].strip()
        if 'currency' in data:
            book.currency = data['currency'].strip()
        if 'availability' in data:
            book.availability = data['availability'].strip()
        if 'category' in data:
            book.category = data['category'].strip()
        if 'tags' in data:
            tags = data['tags']
            if isinstance(tags, list):
                tags = ','.join(tags)
            book.tags = tags
        if 'external_links' in data:
            external_links = data['external_links']
            if isinstance(external_links, str):
                try:
                    json.loads(external_links)
                except json.JSONDecodeError:
                    external_links = '[]'
            book.external_links = external_links
        if 'amazon_link' in data:
            book.amazon_link = data['amazon_link'].strip()
        if 'barnes_noble_link' in data:
            book.barnes_noble_link = data['barnes_noble_link'].strip()
        if 'featured' in data:
            book.featured = data['featured'].lower() == 'true'
        if 'order_index' in data:
            book.order_index = int(data['order_index'])
        
        book.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'book_updated',
            f'Updated book: {book.title} (ID: {book.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Book updated successfully',
            'book': book.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Update book error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update book'
        }), 500

@book_bp.route('/books/<int:book_id>', methods=['DELETE'])
@login_required
def delete_book(book_id):
    """Delete a book."""
    try:
        book = Book.query.get_or_404(book_id)
        book_title = book.title
        
        # Delete associated image file if it exists
        if book.image:
            try:
                image_path = os.path.join(current_app.root_path, book.image)
                if os.path.exists(image_path):
                    os.remove(image_path)
            except Exception as e:
                current_app.logger.warning(f"Failed to delete book image: {e}")
        
        db.session.delete(book)
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'book_deleted',
            f'Deleted book: {book_title} (ID: {book_id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Book deleted successfully'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Delete book error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete book'
        }), 500

# ===== AUTHOR MANAGEMENT =====

@book_bp.route('/authors', methods=['GET'])
@login_required
def get_authors():
    """Get all authors."""
    try:
        authors = Author.query.filter_by(active=True).order_by(Author.created_at.desc()).all()
        return jsonify({
            'success': True,
            'authors': [author.to_dict() for author in authors]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get authors error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get authors'
        }), 500

@book_bp.route('/authors/<int:author_id>', methods=['GET'])
@login_required
def get_author(author_id):
    """Get a specific author by ID."""
    try:
        author = Author.query.get_or_404(author_id)
        return jsonify({
            'success': True,
            'author': author.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get author error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Author not found'
        }), 404

@book_bp.route('/authors', methods=['POST'])
@login_required
def create_author():
    """Create a new author."""
    try:
        data = request.form.to_dict()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'Name is required'
            }), 400
        
        # Handle file upload
        image_file = request.files.get('image')
        image_path = save_book_image(image_file) if image_file else None
        
        # Parse JSON fields
        credentials = data.get('credentials', '[]')
        achievements = data.get('achievements', '[]')
        social_links = data.get('social_links', '[]')
        
        for field in [credentials, achievements, social_links]:
            if isinstance(field, str):
                try:
                    json.loads(field)
                except json.JSONDecodeError:
                    field = '[]'
        
        # Create author
        author = Author(
            name=data['name'].strip(),
            title=data.get('title', '').strip(),
            image=image_path,
            bio=data.get('bio', '').strip(),
            credentials=credentials,
            achievements=achievements,
            quote=data.get('quote', '').strip(),
            social_links=social_links,
            contact_email=data.get('contact_email', '').strip(),
            contact_link=data.get('contact_link', '').strip(),
            hero_title=data.get('hero_title', '').strip(),
            hero_subtitle=data.get('hero_subtitle', '').strip(),
            book_section_title=data.get('book_section_title', '').strip(),
            book_section_subtitle=data.get('book_section_subtitle', '').strip()
        )
        
        db.session.add(author)
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'author_created',
            f'Created author: {author.name} (ID: {author.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Author created successfully',
            'author': author.to_dict()
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Create author error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create author'
        }), 500

@book_bp.route('/authors/<int:author_id>', methods=['PUT'])
@login_required
def update_author(author_id):
    """Update an existing author."""
    try:
        author = Author.query.get_or_404(author_id)
        data = request.form.to_dict()
        
        # Handle file upload
        image_file = request.files.get('image')
        if image_file:
            image_path = save_book_image(image_file, author_id)
            if image_path:
                author.image = image_path
        
        # Update fields
        if 'name' in data:
            author.name = data['name'].strip()
        if 'title' in data:
            author.title = data['title'].strip()
        if 'bio' in data:
            author.bio = data['bio'].strip()
        if 'credentials' in data:
            credentials = data['credentials']
            if isinstance(credentials, str):
                try:
                    json.loads(credentials)
                except json.JSONDecodeError:
                    credentials = '[]'
            author.credentials = credentials
        if 'achievements' in data:
            achievements = data['achievements']
            if isinstance(achievements, str):
                try:
                    json.loads(achievements)
                except json.JSONDecodeError:
                    achievements = '[]'
            author.achievements = achievements
        if 'quote' in data:
            author.quote = data['quote'].strip()
        if 'social_links' in data:
            social_links = data['social_links']
            if isinstance(social_links, str):
                try:
                    json.loads(social_links)
                except json.JSONDecodeError:
                    social_links = '[]'
            author.social_links = social_links
        if 'contact_email' in data:
            author.contact_email = data['contact_email'].strip()
        if 'contact_link' in data:
            author.contact_link = data['contact_link'].strip()
        if 'hero_title' in data:
            author.hero_title = data['hero_title'].strip()
        if 'hero_subtitle' in data:
            author.hero_subtitle = data['hero_subtitle'].strip()
        if 'book_section_title' in data:
            author.book_section_title = data['book_section_title'].strip()
        if 'book_section_subtitle' in data:
            author.book_section_subtitle = data['book_section_subtitle'].strip()
        
        author.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'author_updated',
            f'Updated author: {author.name} (ID: {author.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Author updated successfully',
            'author': author.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Update author error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update author'
        }), 500

# ===== PUBLIC ENDPOINTS =====

@book_bp.route('/public/books', methods=['GET'])
def get_public_books():
    """Get books for public display with language support."""
    try:
        # Get language from query parameter, default to English
        language = request.args.get('lang', 'en')
        if language not in ['en', 'it']:
            language = 'en'
        
        books = Book.query.order_by(Book.order_index.asc(), Book.created_at.desc()).all()
        books_data = [book.to_dict(language=language) for book in books]
        
        # Debug: Log the first book's content
        if books_data:
            first_book = books_data[0]
            print(f"🔍 Public books API ({language}) - First book title: {first_book.get('title')}")
            print(f"🔍 Public books API ({language}) - First book description: {first_book.get('description', '')[:50]}...")
        
        return jsonify({
            'success': True,
            'books': books_data,
            'language': language
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get public books error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get books'
        }), 500

@book_bp.route('/public/authors', methods=['GET'])
def get_public_authors():
    """Get authors for public display with language support."""
    try:
        # Get language from query parameter, default to English
        language = request.args.get('lang', 'en')
        if language not in ['en', 'it']:
            language = 'en'
        
        authors = Author.query.filter_by(active=True).order_by(Author.created_at.desc()).all()
        authors_data = [author.to_dict(language=language) for author in authors]
        
        # Debug: Log the first author's content
        if authors_data:
            first_author = authors_data[0]
            print(f"🔍 Public authors API ({language}) - First author name: {first_author.get('name')}")
            print(f"🔍 Public authors API ({language}) - First author bio: {first_author.get('bio', '')[:50]}...")
        
        return jsonify({
            'success': True,
            'authors': authors_data,
            'language': language
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Get public authors error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get authors'
        }), 500
