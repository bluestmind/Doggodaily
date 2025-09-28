#!/usr/bin/env python3
"""
Quick CORS fix script for DoggoDaily Backend
This script will start the server with explicit CORS configuration
"""

import os
import sys
from flask import Flask, request
from flask_cors import CORS
from manage import app
from app import db
from app.models_book import Book, Author
from app.models_page_content import PageContent
from app.models_i18n import Language, Translation, TranslationTemplate
from app.models import Tour, User, PermissionLevel, Story
from werkzeug.security import generate_password_hash

# Book routes are now in admin_routes.py and automatically registered

def configure_cors_explicitly():
    """Configure CORS with explicit settings for debugging"""
    
    # Explicit CORS origins - include all possible variations
    cors_origins = [
        # Development origins
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        
        # Production server IP origins
        'http://46.101.244.203:3000', 
        'http://46.101.244.203:5000',
        'https://46.101.244.203:3000',
        'https://46.101.244.203:5000',
        'https://46.101.244.203',
        'http://46.101.244.203',
        
        # Production domain origins (HTTPS only)
        'https://www.doggodaiily.com',
        'https://doggodaiily.com'
    ]
    
    print("🌐 Configuring CORS with origins:")
    for origin in cors_origins:
        print(f"   ✅ {origin}")
    
    # Apply CORS configuration with more permissive settings
    CORS(app, 
        origins=cors_origins,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        allow_headers=[
            'Content-Type', 
            'Authorization', 
            'X-Requested-With', 
            'X-Device-Fingerprint',
            'Accept',
            'Origin',
            'Access-Control-Request-Method',
            'Access-Control-Request-Headers',
            'Cache-Control',
            'Pragma'
        ],
        supports_credentials=True,
        expose_headers=['Content-Range', 'X-Content-Range'],
        max_age=86400,
        vary_header=True
    )
    
    # Add manual CORS headers for debugging
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin and origin in cors_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, HEAD'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        return response
    
    # Set environment variables
    os.environ['CORS_ORIGINS'] = ','.join(cors_origins)
    
    return cors_origins

def add_tour_italian_fields():
    """Add Italian fields to tours table if they don't exist."""
    print("🌍 Ensuring Italian fields exist in tours table...")
    
    try:
        with app.app_context():
            # Check if Italian fields exist in tours table
            inspector = db.inspect(db.engine)
            tours_columns = [col['name'] for col in inspector.get_columns('tours')]
            
            print(f"📋 Current tours columns: {tours_columns}")
            
            italian_fields = [
                ('title_it', 'VARCHAR(255)'),
                ('description_it', 'TEXT'),
                ('short_description_it', 'VARCHAR(500)'),
                ('location_it', 'VARCHAR(255)'),
                ('image', 'VARCHAR(500)')
            ]
            
            fields_added = []
            for field_name, field_type in italian_fields:
                if field_name not in tours_columns:
                    try:
                        print(f"   🔧 Adding {field_name}...")
                        db.session.execute(db.text(f"ALTER TABLE tours ADD COLUMN {field_name} {field_type}"))
                        fields_added.append(field_name)
                        print(f"   ✅ Added {field_name}")
                    except Exception as e:
                        print(f"   ❌ Failed to add {field_name}: {e}")
                else:
                    print(f"   ✅ {field_name} already exists")
            
            if fields_added:
                db.session.commit()
                print(f"✅ Successfully added {len(fields_added)} Italian fields to tours table")
            else:
                print("✅ All Italian fields already exist in tours table")
            
            # Verify the fields were added
            updated_columns = [col['name'] for col in inspector.get_columns('tours')]
            print(f"📋 Updated tours columns: {updated_columns}")
                
    except Exception as e:
        print(f"❌ Error adding Italian fields: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def add_story_language_field():
    """Add language field to the stories table if it doesn't exist."""
    print("🌐 Ensuring language field exists in stories table...")
    
    try:
        with app.app_context():
            # Check if language field exists in stories table
            inspector = db.inspect(db.engine)
            stories_columns = [col['name'] for col in inspector.get_columns('stories')]
            
            print(f"📋 Current stories columns: {stories_columns}")
            
            if 'language' not in stories_columns:
                try:
                    print("   🔧 Adding language field...")
                    db.session.execute(db.text("ALTER TABLE stories ADD COLUMN language VARCHAR(5) DEFAULT 'en' NOT NULL"))
                    db.session.commit()
                    print("   ✅ Added language field successfully")
                except Exception as e:
                    print(f"   ❌ Failed to add language field: {e}")
                    return False
            else:
                print("   ✅ Language field already exists")
            
            # Update existing stories to have default language if NULL
            try:
                stories_without_lang = db.session.execute(
                    db.text("SELECT COUNT(*) FROM stories WHERE language IS NULL OR language = ''")
                ).scalar()
                
                if stories_without_lang > 0:
                    print(f"   🔧 Updating {stories_without_lang} stories with default language...")
                    db.session.execute(
                        db.text("UPDATE stories SET language = 'en' WHERE language IS NULL OR language = ''")
                    )
                    db.session.commit()
                    print(f"   ✅ Updated {stories_without_lang} stories with default language")
                
                # Show some sample stories
                stories = Story.query.limit(3).all()
                print(f"📖 Sample stories ({len(stories)} found):")
                for story in stories:
                    lang = getattr(story, 'language', 'unknown')
                    print(f"  - {story.id}: {story.title[:50]}... (lang: {lang})")
                    
            except Exception as e:
                print(f"   ⚠️  Error updating existing stories: {e}")
            
    except Exception as e:
        print(f"❌ Error adding story language field: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def create_admin_users():
    """Create default admin users if they don't exist."""
    print("👤 Creating admin users...")
    
    try:
        with app.app_context():
            # Check if any admin users exist
            admin_count = User.query.filter(User.admin_level.in_([
                PermissionLevel.SUPER_ADMIN.value,
                PermissionLevel.ADMIN.value,
                PermissionLevel.MODERATOR.value
            ])).count()
            
            if admin_count > 0:
                print(f"✅ {admin_count} admin users already exist")
                return True
            
            # Create default admin users
            admin_users = [
                {
                    'email': 'supernajji@doggodaily.com',
                    'name': 'Super Administrator',
                    'password': 'SuperNajji123!',
                    'admin_level': PermissionLevel.SUPER_ADMIN.value
                },
                {
                    'email': 'admin@doggodaily.com',
                    'name': 'Administrator',
                    'password': 'Admin123!',
                    'admin_level': PermissionLevel.ADMIN.value
                },
                {
                    'email': 'moderator@doggodaily.com',
                    'name': 'Content Moderator',
                    'password': 'Moderator123!',
                    'admin_level': PermissionLevel.MODERATOR.value
                }
            ]
            
            created_count = 0
            for user_data in admin_users:
                try:
                    # Check if user already exists
                    existing_user = User.query.filter_by(email=user_data['email']).first()
                    if existing_user:
                        print(f"   ⚠️  User {user_data['email']} already exists")
                        continue
                    
                    # Create new admin user
                    admin_user = User(
                        name=user_data['name'],
                        email=user_data['email'],
                        password_hash=generate_password_hash(user_data['password']),
                        admin_level=user_data['admin_level'],
                        email_verified=True,
                        is_active=True
                    )
                    
                    db.session.add(admin_user)
                    created_count += 1
                    print(f"   ✅ Created {user_data['email']}")
                    
                except Exception as e:
                    print(f"   ❌ Failed to create {user_data['email']}: {e}")
            
            if created_count > 0:
                db.session.commit()
                print(f"✅ Successfully created {created_count} admin users")
            else:
                print("✅ All admin users already exist")
                
    except Exception as e:
        print(f"❌ Error creating admin users: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def create_all_tables():
    """Create all necessary database tables safely (without dropping existing data)."""
    print("🗄️ Creating database tables safely...")
    
    try:
        with app.app_context():
            # Check existing tables first
            inspector = db.inspect(db.engine)
            existing_tables = inspector.get_table_names()
            print(f"📋 Existing tables: {existing_tables}")
            
            # Create all tables (this only creates missing tables, doesn't drop existing ones)
            print("🔄 Creating missing tables...")
            db.create_all()
            
            # Get all tables after creation
            updated_tables = inspector.get_table_names()
            new_tables = set(updated_tables) - set(existing_tables)
            
            if new_tables:
                print(f"✅ New tables created: {list(new_tables)}")
            else:
                print("✅ All tables already exist")
            
            # Always add Italian fields to tours table (in case they're missing)
            if 'tours' in updated_tables:
                add_tour_italian_fields()
            else:
                print("⚠️ Tours table not found, but should have been created")
            
            # Always add language field to stories table (in case it's missing)
            if 'stories' in updated_tables:
                add_story_language_field()
            else:
                print("⚠️ Stories table not found, but should have been created")
            
            # Create admin users (only if they don't exist)
            create_admin_users()
            
            # Test book tables specifically
            try:
                book_count = Book.query.count()
                author_count = Author.query.count()
                content_count = PageContent.query.count()
                language_count = Language.query.count()
                translation_count = Translation.query.count()
                tour_count = Tour.query.count()
                user_count = User.query.count()
                admin_count = User.query.filter(User.admin_level.in_([
                    PermissionLevel.SUPER_ADMIN.value,
                    PermissionLevel.ADMIN.value,
                    PermissionLevel.MODERATOR.value
                ])).count()
                print(f"📊 Book count: {book_count}")
                print(f"📊 Author count: {author_count}")
                print(f"📊 Page content count: {content_count}")
                print(f"📊 Language count: {language_count}")
                print(f"📊 Translation count: {translation_count}")
                print(f"📊 Tour count: {tour_count}")
                print(f"📊 User count: {user_count}")
                print(f"📊 Admin count: {admin_count}")
                print("✅ All tables are working correctly")
                
                # Initialize default languages if none exist
                if language_count == 0:
                    print("🌍 Initializing default languages...")
                    default_languages = [
                        {'code': 'en', 'name': 'English', 'native_name': 'English', 'flag_emoji': '🇺🇸', 'is_default': True, 'sort_order': 1},
                        {'code': 'it', 'name': 'Italian', 'native_name': 'Italiano', 'flag_emoji': '🇮🇹', 'is_default': False, 'sort_order': 2},
                        {'code': 'es', 'name': 'Spanish', 'native_name': 'Español', 'flag_emoji': '🇪🇸', 'is_default': False, 'sort_order': 3},
                        {'code': 'fr', 'name': 'French', 'native_name': 'Français', 'flag_emoji': '🇫🇷', 'is_default': False, 'sort_order': 4},
                        {'code': 'de', 'name': 'German', 'native_name': 'Deutsch', 'flag_emoji': '🇩🇪', 'is_default': False, 'sort_order': 5}
                    ]
                    
                    for lang_data in default_languages:
                        language = Language(**lang_data)
                        db.session.add(language)
                    
                    db.session.commit()
                    print("✅ Default languages initialized")
            except Exception as e:
                print(f"⚠️ Table test failed: {e}")
                
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def main():
    """Main function with CORS debugging"""
    print("🚀 Starting DoggoDaily Backend with CORS Fix...")
    
    # Set production environment variables if not already set
    if not os.environ.get('FLASK_ENV'):
        os.environ['FLASK_ENV'] = 'production'
        print("🔧 Set FLASK_ENV=production")
    
    if not os.environ.get('SECRET_KEY'):
        os.environ['SECRET_KEY'] = 'your-super-secret-key-change-in-production'
        print("⚠️  Using default SECRET_KEY - change in production!")
    
    # Configure Flask app for HTTPS URLs in production
    if os.environ.get('FLASK_ENV') == 'production':
        app.config['PREFERRED_URL_SCHEME'] = 'https'
        app.config['SERVER_NAME'] = 'doggodaiily.com'
        app.config['BASE_URL'] = 'https://doggodaiily.com'
        print("🔒 Configured Flask to generate HTTPS URLs with domain doggodaiily.com")
    
    # Create all database tables first
    print("\n" + "="*50)
    print("🗄️ DATABASE SETUP")
    print("="*50)
    
    # Create database tables safely (without dropping existing data)
    print("🔄 Creating tables if they don't exist (preserving existing data)")
    
    if not create_all_tables():
        print("❌ Failed to create database tables. Exiting...")
        sys.exit(1)
    
    print("\n" + "="*50)
    print("🌐 CORS CONFIGURATION")
    print("="*50)
    
    # Configure CORS
    cors_origins = configure_cors_explicitly()
    
    # Add CORS debug route
    @app.route('/api/cors-test', methods=['GET', 'OPTIONS'])
    def cors_test():
        from flask import jsonify, request
        return jsonify({
            'message': 'CORS test successful',
            'origin': request.headers.get('Origin'),
            'configured_origins': cors_origins,
            'method': request.method
        })
    
    # Add book routes test endpoint
    @app.route('/api/admin/test', methods=['GET'])
    def test_book_routes():
        from flask import jsonify
        from datetime import datetime
        return jsonify({
            'success': True,
            'message': 'Book routes are working!',
            'timestamp': datetime.now().isoformat(),
            'tables_created': True
        })
    
    # Test the actual book routes
    @app.route('/api/admin/test-books', methods=['GET'])
    def test_books_endpoint():
        from flask import jsonify
        try:
            # Test if we can query books and tours
            book_count = Book.query.count()
            tour_count = Tour.query.count()
            user_count = User.query.count()
            admin_count = User.query.filter(User.admin_level.in_([
                PermissionLevel.SUPER_ADMIN.value,
                PermissionLevel.ADMIN.value,
                PermissionLevel.MODERATOR.value
            ])).count()
            
            # Test if tours have Italian fields
            tours_with_italian = db.session.execute(db.text("SELECT COUNT(*) FROM tours WHERE title_it IS NOT NULL")).scalar()
            
            return jsonify({
                'success': True,
                'message': 'Book, tour, and user routes working!',
                'book_count': book_count,
                'tour_count': tour_count,
                'user_count': user_count,
                'admin_count': admin_count,
                'tours_with_italian_fields': tours_with_italian,
                'endpoints': [
                    'GET /admin/books',
                    'POST /admin/books',
                    'GET /admin/authors',
                    'POST /admin/authors',
                    'GET /admin/tours',
                    'POST /admin/tours'
                ]
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Database error: {str(e)}'
            }), 500
    
    # Add OPTIONS handler for book routes
    @app.route('/admin/books', methods=['OPTIONS'])
    def handle_books_options():
        from flask import jsonify
        return jsonify({'message': 'OK'}), 200
    
    @app.route('/admin/authors', methods=['OPTIONS'])
    def handle_authors_options():
        from flask import jsonify
        return jsonify({'message': 'OK'}), 200
    
    print("\n🔧 Configuration:")
    print(f"   CORS Origins: {cors_origins}")
    print(f"   Credentials: True")
    print(f"   Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD")
    print(f"   Database: All tables created ✅")
    
    print("\n🌍 Starting server on http://46.101.244.203:5000")
    print("   Accessible from:")
    print("   - http://46.101.244.203:5000 (external)")
    print("   - http://127.0.0.1:5000 (local)")
    print("   - https://www.doggodaiily.com/api (production domain)")
    print("\n🧪 Test endpoints:")
    print("   - CORS test: http://46.101.244.203:5000/api/cors-test")
    print("   - Book routes: http://46.101.244.203:5000/api/admin/test")
    print("   - Admin login: http://46.101.244.203:5000/api/auth/admin/login")
    print("   - Health check: https://www.doggodaiily.com/health")
    print("\n📚 Book Management:")
    print("   - Create book: POST /admin/books")
    print("   - List books: GET /admin/books")
    print("   - Create author: POST /admin/authors")
    
    print("\n👤 Admin Login Credentials:")
    print("   - Super Admin: supernajji@doggodaily.com / SuperNajji123!")
    print("   - Admin: admin@doggodaily.com / Admin123!")
    print("   - Moderator: moderator@doggodaily.com / Moderator123!")
    print("   ⚠️  Please change these passwords after first login!")
    
    try:
        # Check if running in production mode
        production_mode = os.environ.get('FLASK_ENV') == 'production'
        
        if production_mode:
            print("🔒 Running in PRODUCTION mode")
            # Start server in production mode (no debug)
            app.run(
                host='0.0.0.0',  # Critical: Listen on all interfaces
                port=5000,
                debug=False,  # Disable debug for production
                threaded=True,
                ssl_context=None  # SSL handled by Nginx reverse proxy
            )
        else:
            print("🔧 Running in DEVELOPMENT mode")
            # Start server in development mode (with debug)
            app.run(
                host='0.0.0.0',  # Critical: Listen on all interfaces
                port=5000,
                debug=True,  # Enable debug for development
                threaded=True
            )
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()