"""
Initialize database with album support
"""
import os
import sys

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import User, Story, GalleryItem, Tour
from app.models_extended import Notification, Message, ActivityLog
from app.models_analytics import AnalyticsEvent, PageView, ContentInteraction, UserSession
from app.models_security import SecurityLog, ThreatDetection, IPBlacklist, MaintenanceMode
from app.models_gallery_extended import GalleryAlbum, AlbumView, AlbumLike, extend_gallery_item

def init_database():
    """Initialize the database with all tables including album support"""
    print("🔄 Initializing database with album support...")
    
    app = create_app()
    
    with app.app_context():
        try:
            # Ensure album columns are extended
            extend_gallery_item()
            
            # Drop all tables and recreate (for development)
            print("📋 Dropping existing tables...")
            db.drop_all()
            
            print("📋 Creating all tables...")
            db.create_all()
            
            print("✅ Database initialized successfully with album support!")
            
            # Create a test admin user if none exists
            test_user = User.query.filter_by(email='admin@example.com').first()
            if not test_user:
                print("👤 Creating test admin user...")
                test_user = User(
                    email='admin@example.com',
                    username='admin',
                    full_name='Test Admin',
                    password_hash='scrypt:32768:8:1$placeholder$hash',  # Placeholder
                    is_verified=True,
                    admin_level='super_admin'
                )
                db.session.add(test_user)
                db.session.commit()
                print("✅ Test admin user created (email: admin@example.com)")
            
            print("🎉 Database setup complete!")
            
        except Exception as e:
            print(f"❌ Database initialization failed: {str(e)}")
            raise e

if __name__ == "__main__":
    init_database()