#!/usr/bin/env python3
"""
Script to populate the database with sample tours and gallery items for testing
"""

import sys
import os
from datetime import datetime, timedelta
import json

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models import Tour, GalleryItem, User

def create_sample_tours():
    """Create sample tours"""
    tours_data = [
        {
            'title': 'VIP Behind-the-Scenes Experience',
            'description': 'Get an exclusive look at our premium facilities, meet our expert team, and see where your furry friend will be pampered during their stay.',
            'short_description': 'Exclusive behind-the-scenes tour of our premium facilities',
            'location': 'Beverly Hills Flagship',
            'date': datetime.utcnow() + timedelta(days=7),
            'duration': 2,
            'max_capacity': 8,
            'current_bookings': 3,
            'price': 25.00,
            'guide_name': 'Sarah Mitchell',
            'guide_contact': 'sarah@doggodaily.com',
            'tour_type': 'group',
            'difficulty_level': 'easy',
            'includes': json.dumps(['Welcome refreshments', 'Photo opportunities', 'Meet & greet with staff', 'Facility map']),
            'requirements': json.dumps(['Comfortable walking shoes', 'Valid ID']),
            'thumbnail': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
            'gallery': json.dumps([
                'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=500&fit=crop'
            ]),
            'status': 'active'
        },
        {
            'title': 'Medical Center Tour',
            'description': 'Tour our state-of-the-art medical facilities and learn about our comprehensive health monitoring and veterinary care services.',
            'short_description': 'Comprehensive tour of our medical facilities and services',
            'location': 'Manhattan Medical Center',
            'date': datetime.utcnow() + timedelta(days=14),
            'duration': 3,
            'max_capacity': 6,
            'current_bookings': 1,
            'price': 35.00,
            'guide_name': 'Dr. Jennifer Lee',
            'guide_contact': 'dr.lee@doggodaily.com',
            'tour_type': 'group',
            'difficulty_level': 'easy',
            'includes': json.dumps(['Medical overview presentation', 'Equipment demonstration', 'Q&A with veterinarian', 'Health tips pamphlet']),
            'requirements': json.dumps(['Valid ID', 'Hand sanitization required']),
            'thumbnail': 'https://images.unsplash.com/photo-1581888227599-779811939961?w=400&h=300&fit=crop',
            'gallery': json.dumps([
                'https://images.unsplash.com/photo-1581888227599-779811939961?w=800&h=600&fit=crop'
            ]),
            'status': 'active'
        },
        {
            'title': 'Training Academy Experience',
            'description': 'Watch professional dog training sessions and learn about our behavior modification programs and educational activities.',
            'short_description': 'Interactive experience at our professional training academy',
            'location': 'Austin Training Academy',
            'date': datetime.utcnow() + timedelta(days=21),
            'duration': 4,
            'max_capacity': 10,
            'current_bookings': 7,
            'price': 45.00,
            'guide_name': 'Michael Rodriguez',
            'guide_contact': 'michael@doggodaily.com',
            'tour_type': 'group',
            'difficulty_level': 'moderate',
            'includes': json.dumps(['Live training demonstration', 'Training tips handbook', 'Meet the trainers', 'Light refreshments']),
            'requirements': json.dumps(['Comfortable clothing', 'Closed-toe shoes', 'Basic fitness level']),
            'thumbnail': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
            'gallery': json.dumps([
                'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=500&fit=crop'
            ]),
            'status': 'active'
        }
    ]
    
    created_tours = []
    for tour_data in tours_data:
        tour = Tour(**tour_data)
        db.session.add(tour)
        created_tours.append(tour)
    
    return created_tours

def create_sample_gallery_items():
    """Create sample gallery items"""
    
    # Get the first admin user to assign as uploader
    admin_user = User.query.filter_by(is_admin=True).first()
    if not admin_user:
        print("Warning: No admin user found. Creating gallery items without uploader.")
        user_id = 1  # Fallback
    else:
        user_id = admin_user.id
    
    gallery_data = [
        {
            'title': 'Luxury Suite Comfort',
            'description': 'Golden Retriever Max enjoying premium accommodations in our VIP suite with custom bedding and climate control.',
            'file_path': '/static/gallery/luxury-suite-comfort.jpg',
            'file_name': 'luxury-suite-comfort.jpg',
            'file_size': 2048576,  # 2MB
            'file_type': 'image',
            'mime_type': 'image/jpeg',
            'thumbnail': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
            'category': 'facilities',
            'tags': 'luxury,suite,comfort,golden-retriever,vip',
            'status': 'active',
            'views': 247,
            'downloads': 15,
            'likes': 89,
            'width': 1920,
            'height': 1080,
            'location': 'Beverly Hills Facility',
            'photographer': 'Sarah Mitchell',
            'user_id': user_id
        },
        {
            'title': 'Premium Grooming Session',
            'description': 'Professional grooming service with spa-quality treatments and aromatherapy for ultimate relaxation.',
            'file_path': '/static/gallery/premium-grooming.mp4',
            'file_name': 'premium-grooming.mp4',
            'file_size': 15728640,  # 15MB
            'file_type': 'video',
            'mime_type': 'video/mp4',
            'thumbnail': 'https://images.unsplash.com/photo-1534351735089-c8bc1de0b5e7?w=400&h=300&fit=crop',
            'category': 'grooming',
            'tags': 'grooming,spa,professional,care,relaxation',
            'status': 'active',
            'views': 189,
            'downloads': 8,
            'likes': 67,
            'width': 1920,
            'height': 1080,
            'duration': 154,  # 2:34 in seconds
            'location': 'Manhattan Spa',
            'photographer': 'Emily Chen',
            'user_id': user_id
        },
        {
            'title': 'Playtime Paradise',
            'description': 'Dogs having the time of their lives in our premium play areas with supervised social activities.',
            'file_path': '/static/gallery/playtime-paradise.jpg',
            'file_name': 'playtime-paradise.jpg',
            'file_size': 1835008,  # 1.75MB
            'file_type': 'image',
            'mime_type': 'image/jpeg',
            'thumbnail': 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=250&fit=crop',
            'category': 'training',
            'tags': 'playtime,social,fun,exercise,activities',
            'status': 'active',
            'views': 156,
            'downloads': 12,
            'likes': 78,
            'width': 1920,
            'height': 1200,
            'location': 'Austin Play Center',
            'photographer': 'Michael Johnson',
            'user_id': user_id
        },
        {
            'title': 'Medical Excellence',
            'description': 'State-of-the-art veterinary care with 24/7 monitoring and advanced diagnostic equipment.',
            'file_path': '/static/gallery/medical-excellence.jpg',
            'file_name': 'medical-excellence.jpg',
            'file_size': 2359296,  # 2.25MB
            'file_type': 'image',
            'mime_type': 'image/jpeg',
            'thumbnail': 'https://images.unsplash.com/photo-1581888227599-779811939961?w=300&h=350&fit=crop',
            'category': 'facilities',
            'tags': 'medical,veterinary,health,care,monitoring',
            'status': 'active',
            'views': 98,
            'downloads': 5,
            'likes': 45,
            'width': 1440,
            'height': 1680,
            'location': 'Medical Center',
            'photographer': 'Dr. Jennifer Lee',
            'user_id': user_id
        },
        {
            'title': 'Gourmet Dining Experience',
            'description': 'Premium nutrition with custom meal plans tailored to each guest\'s dietary needs and preferences.',
            'file_path': '/static/gallery/gourmet-dining.jpg',
            'file_name': 'gourmet-dining.jpg',
            'file_size': 1572864,  # 1.5MB
            'file_type': 'image',
            'mime_type': 'image/jpeg',
            'thumbnail': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
            'category': 'facilities',
            'tags': 'gourmet,nutrition,dining,premium,custom',
            'status': 'active',
            'views': 134,
            'downloads': 9,
            'likes': 56,
            'width': 1920,
            'height': 1440,
            'location': 'Miami Kitchen',
            'photographer': 'Chef Rodriguez',
            'user_id': user_id
        },
        {
            'title': 'Training Excellence',
            'description': 'Professional training sessions with certified experts using positive reinforcement techniques.',
            'file_path': '/static/gallery/training-excellence.mp4',
            'file_name': 'training-excellence.mp4',
            'file_size': 20971520,  # 20MB
            'file_type': 'video',
            'mime_type': 'video/mp4',
            'thumbnail': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
            'category': 'training',
            'tags': 'training,education,behavior,professional,certified',
            'status': 'active',
            'views': 112,
            'downloads': 6,
            'likes': 43,
            'width': 1920,
            'height': 1080,
            'duration': 105,  # 1:45 in seconds
            'location': 'Training Academy',
            'photographer': 'Training Team',
            'user_id': user_id
        }
    ]
    
    created_items = []
    for item_data in gallery_data:
        gallery_item = GalleryItem(**item_data)
        db.session.add(gallery_item)
        created_items.append(gallery_item)
    
    return created_items

def main():
    """Main function to populate the database"""
    app = create_app()
    
    with app.app_context():
        print("🚀 Starting database population...")
        
        # Create sample tours
        print("📅 Creating sample tours...")
        tours = create_sample_tours()
        print(f"✅ Created {len(tours)} tours")
        
        # Create sample gallery items
        print("🖼️  Creating sample gallery items...")
        gallery_items = create_sample_gallery_items()
        print(f"✅ Created {len(gallery_items)} gallery items")
        
        # Commit all changes
        try:
            db.session.commit()
            print("🎉 Database population completed successfully!")
            print(f"📊 Summary:")
            print(f"   - Tours: {len(tours)}")
            print(f"   - Gallery Items: {len(gallery_items)}")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error committing to database: {e}")
            return False
        
        return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)