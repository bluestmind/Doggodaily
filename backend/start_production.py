#!/usr/bin/env python3
"""
Production startup script for DoggoDaily Backend
This script sets up the database and starts the server with Gunicorn for production
"""

import os
import sys
import subprocess
from flask import Flask
from manage import app
from app import db
from app.models_book import Book, Author
from app.models_page_content import PageContent
from app.models_i18n import Language, Translation, TranslationTemplate
from app.models import Tour, User, PermissionLevel, Story
from werkzeug.security import generate_password_hash

def setup_database():
    """Set up database tables and admin users"""
    print("🗄️ Setting up database...")
    
    try:
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables created")
            
            # Create admin users if they don't exist
            admin_count = User.query.filter(User.admin_level.in_([
                PermissionLevel.SUPER_ADMIN.value,
                PermissionLevel.ADMIN.value,
                PermissionLevel.MODERATOR.value
            ])).count()
            
            if admin_count == 0:
                print("👤 Creating admin users...")
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
                
                for user_data in admin_users:
                    admin_user = User(
                        name=user_data['name'],
                        email=user_data['email'],
                        password_hash=generate_password_hash(user_data['password']),
                        admin_level=user_data['admin_level'],
                        email_verified=True,
                        is_active=True
                    )
                    db.session.add(admin_user)
                
                db.session.commit()
                print("✅ Admin users created")
            else:
                print(f"✅ {admin_count} admin users already exist")
            
            # Initialize default languages if none exist
            language_count = Language.query.count()
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
            
            print("✅ Database setup complete")
            return True
            
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def start_gunicorn():
    """Start the server with Gunicorn"""
    print("🚀 Starting Gunicorn server...")
    
    # Gunicorn configuration
    gunicorn_cmd = [
        'gunicorn',
        '--bind', '0.0.0.0:5000',
        '--workers', '4',
        '--timeout', '90',
        '--keep-alive', '2',
        '--max-requests', '1000',
        '--max-requests-jitter', '100',
        '--access-logfile', '-',
        '--error-logfile', '-',
        '--log-level', 'info',
        'manage:app'
    ]
    
    try:
        print("🔧 Gunicorn command:", ' '.join(gunicorn_cmd))
        subprocess.run(gunicorn_cmd)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Gunicorn failed to start: {e}")
        sys.exit(1)

def main():
    """Main function"""
    print("🚀 Starting DoggoDaily Backend (Production Mode)")
    
    # Set production environment
    os.environ['FLASK_ENV'] = 'production'
    
    # Setup database
    if not setup_database():
        print("❌ Database setup failed. Exiting...")
        sys.exit(1)
    
    # Start Gunicorn server
    start_gunicorn()

if __name__ == '__main__':
    main()
"""
Production startup script for DoggoDaily Backend
This script sets up the database and starts the server with Gunicorn for production
"""

import os
import sys
import subprocess
from flask import Flask
from manage import app
from app import db
from app.models_book import Book, Author
from app.models_page_content import PageContent
from app.models_i18n import Language, Translation, TranslationTemplate
from app.models import Tour, User, PermissionLevel, Story
from werkzeug.security import generate_password_hash

def setup_database():
    """Set up database tables and admin users"""
    print("🗄️ Setting up database...")
    
    try:
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables created")
            
            # Create admin users if they don't exist
            admin_count = User.query.filter(User.admin_level.in_([
                PermissionLevel.SUPER_ADMIN.value,
                PermissionLevel.ADMIN.value,
                PermissionLevel.MODERATOR.value
            ])).count()
            
            if admin_count == 0:
                print("👤 Creating admin users...")
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
                
                for user_data in admin_users:
                    admin_user = User(
                        name=user_data['name'],
                        email=user_data['email'],
                        password_hash=generate_password_hash(user_data['password']),
                        admin_level=user_data['admin_level'],
                        email_verified=True,
                        is_active=True
                    )
                    db.session.add(admin_user)
                
                db.session.commit()
                print("✅ Admin users created")
            else:
                print(f"✅ {admin_count} admin users already exist")
            
            # Initialize default languages if none exist
            language_count = Language.query.count()
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
            
            print("✅ Database setup complete")
            return True
            
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def start_gunicorn():
    """Start the server with Gunicorn"""
    print("🚀 Starting Gunicorn server...")
    
    # Gunicorn configuration
    gunicorn_cmd = [
        'gunicorn',
        '--bind', '0.0.0.0:5000',
        '--workers', '4',
        '--timeout', '90',
        '--keep-alive', '2',
        '--max-requests', '1000',
        '--max-requests-jitter', '100',
        '--access-logfile', '-',
        '--error-logfile', '-',
        '--log-level', 'info',
        'manage:app'
    ]
    
    try:
        print("🔧 Gunicorn command:", ' '.join(gunicorn_cmd))
        subprocess.run(gunicorn_cmd)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Gunicorn failed to start: {e}")
        sys.exit(1)

def main():
    """Main function"""
    print("🚀 Starting DoggoDaily Backend (Production Mode)")
    
    # Set production environment
    os.environ['FLASK_ENV'] = 'production'
    
    # Setup database
    if not setup_database():
        print("❌ Database setup failed. Exiting...")
        sys.exit(1)
    
    # Start Gunicorn server
    start_gunicorn()

if __name__ == '__main__':
    main()