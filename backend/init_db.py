#!/usr/bin/env python3
"""
Database initialization script for DoggoDaily
Creates tables and populates with sample data
"""

import os
import sys
from datetime import datetime, timedelta
import json

# Add the app directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models import db, User, Story, GalleryItem, Tour, TourBooking, Analytics, SecurityLog, Message
from app.extensions import db

def create_sample_users():
    """Create sample users"""
    print("Creating sample users...")
    
    # Admin user
    admin = User(
        name='Admin User',
        email='admin@doggodaily.com',
        role='admin',
        is_active=True,
        email_verified=True
    )
    admin.set_password('AdminPass123!')
    db.session.add(admin)
    
    # Regular users
    users_data = [
        {
            'name': 'Sophie Johnson',
            'email': 'sophie@example.com',
            'avatar': 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        {
            'name': 'Marco Rossi',
            'email': 'marco@example.com',
            'avatar': 'https://randomuser.me/api/portraits/men/33.jpg'
        },
        {
            'name': 'Luna Park',
            'email': 'luna@example.com',
            'avatar': 'https://randomuser.me/api/portraits/women/68.jpg'
        },
        {
            'name': 'David Wilson',
            'email': 'david@example.com',
            'avatar': 'https://randomuser.me/api/portraits/men/22.jpg'
        },
        {
            'name': 'Emma Thompson',
            'email': 'emma@example.com',
            'avatar': 'https://randomuser.me/api/portraits/women/35.jpg'
        }
    ]
    
    users = []
    for user_data in users_data:
        user = User(
            name=user_data['name'],
            email=user_data['email'],
            avatar=user_data['avatar'],
            is_active=True,
            email_verified=True
        )
        user.set_password('UserPass123!')
        db.session.add(user)
        users.append(user)
    
    db.session.commit()
    return [admin] + users

def create_sample_stories(users):
    """Create sample stories"""
    print("Creating sample stories...")
    
    stories_data = [
        {
            'title': 'Our Amazing Adventure in Tuscany',
            'content': '''Last week, my golden retriever Max and I embarked on an incredible journey through the rolling hills of Tuscany. The experience was nothing short of magical! 

We started our adventure in the charming town of Montepulciano, where the cobblestone streets and ancient architecture provided the perfect backdrop for our photos. Max was particularly fascinated by the local cats who seemed to rule the piazzas with regal confidence.

The highlight of our trip was definitely the vineyard tour in Chianti. Who knew that dogs could be such excellent wine tasters? Well, Max didn't actually taste the wine, but he certainly enjoyed sniffing around the barrels and making friends with the winery's resident dog, a wise old shepherd named Bruno.

Our accommodation was a pet-friendly agriturismo nestled among olive groves. The owners were incredibly welcoming, and they even prepared a special meal for Max using local ingredients. Watching him enjoy his gourmet dinner while I sipped on Brunello di Montalcino was a moment I'll never forget.

The countryside walks were absolutely breathtaking. Every morning, we'd wake up to the sound of church bells echoing across the valleys, and Max would practically drag me out for our daily exploration. We discovered hidden trails, ancient ruins, and the most photogenic sunflower fields I've ever seen.

One unexpected joy was meeting other dog travelers from around the world. There's something special about the bond between people who love their dogs enough to include them in their adventures. We shared stories, travel tips, and even organized impromptu play dates for our furry companions.

If you're considering traveling with your dog, Tuscany should definitely be on your list. The combination of dog-friendly establishments, stunning scenery, and warm hospitality makes it a perfect destination for both you and your four-legged friend.''',
            'category': 'travel',
            'tags': 'tuscany,travel,adventure,golden-retriever',
            'thumbnail': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop',
            'is_featured': True,
            'status': 'published',
            'reading_time': 4
        },
        {
            'title': 'Training Tips: Teaching Your Dog to Sit Perfectly',
            'content': '''Teaching your dog to sit is one of the fundamental commands every dog owner should master. It's not just about obedience; it's about building communication and trust with your furry friend.

Start with the basics: make sure you have your dog's favorite treats ready. High-value rewards work best - think small pieces of chicken, cheese, or specialized training treats. The key is to use something your dog absolutely loves.

Begin in a quiet environment with minimal distractions. Hold a treat close to your dog's nose, allowing them to smell it but not grab it. Slowly move the treat up and back over their head. As their head follows the treat, their bottom will naturally lower to the ground.

The moment their bottom touches the ground, say "sit" clearly and give them the treat along with enthusiastic praise. Timing is crucial here - the reward should come the instant they perform the desired behavior.

Practice this 5-10 times per session, keeping sessions short to maintain your dog's attention. Most dogs start to understand the connection within a few days of consistent practice.

Common mistakes to avoid: don't push your dog's bottom down, don't repeat the command multiple times, and never train when you're frustrated. Dogs pick up on our emotions, and training should always be a positive experience.

Once your dog reliably sits with the treat lure, start phasing out the food. Use the same hand motion but without the treat, then gradually reduce the hand gesture until you can get a sit with just the verbal command.

Remember, every dog learns at their own pace. Some might master this in a day, others might take a week. Patience and consistency are your best tools for success.''',
            'category': 'training',
            'tags': 'training,obedience,tips,sitting',
            'thumbnail': 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop',
            'status': 'published',
            'reading_time': 3
        },
        {
            'title': 'The Best Dog-Friendly Restaurants in Rome',
            'content': '''Rome isn't just a feast for the eyes - it's also incredibly welcoming to our four-legged companions! After spending a month exploring the Eternal City with my rescue dog Bella, I've compiled a list of the most dog-friendly restaurants that will make both you and your pup feel like royalty.

**Checchino dal 1887** - This historic restaurant in Testaccio has been welcoming dogs for generations. They even provide water bowls without being asked! The traditional Roman cuisine is exceptional, and the staff treats every dog like a regular customer.

**Da Enzo** - Hidden in the charming Trastevere neighborhood, this family-run trattoria not only allows dogs but actively encourages them. The owner's own dog, a charming beagle named Pino, often greets visitors at the door.

**Il Sorpasso** - Modern Italian cuisine meets dog-friendly hospitality. They have a lovely outdoor seating area perfect for dogs, and the waitstaff always brings fresh water without being asked.

**Metamorfosi** - Even Michelin-starred establishments can be dog-friendly! This upscale restaurant welcomes well-behaved dogs and has even been known to prepare simple, dog-safe dishes upon request.

**Tips for dining out with your dog in Rome:**
- Always call ahead to confirm their pet policy
- Bring a portable water bowl just in case
- Keep your dog leashed and close to your table
- Pack some treats to keep them occupied
- Consider the weather - outdoor seating is usually preferred

The Italian approach to dogs in restaurants is refreshingly relaxed compared to many other countries. Romans genuinely love dogs, and you'll often find locals stopping to pet and chat about your furry companion.

Don't miss the opportunity to enjoy an aperitivo with your dog in one of Rome's many piazzas. Campo de' Fiori and Piazza Navona both have numerous cafes with outdoor seating where dogs are welcomed with open arms.''',
            'category': 'food',
            'tags': 'rome,restaurants,dog-friendly,food,travel',
            'thumbnail': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
            'status': 'published',
            'reading_time': 4
        },
        {
            'title': 'Health Check: Signs Your Dog is Happy and Healthy',
            'content': '''As dog owners, we want nothing more than to ensure our furry friends are living their best lives. But how do we know if our dogs are truly happy and healthy? Here are the key signs to look for that indicate your dog is thriving.

**Physical Signs of Good Health:**

*Bright, Clear Eyes* - Your dog's eyes should be clear and bright, without discharge or cloudiness. The whites should be white, not red or yellow.

*Healthy Coat* - A shiny, soft coat is a great indicator of good health. The fur should be free of bald patches, excessive shedding, or dull appearance.

*Normal Eating and Drinking* - A healthy dog has a good appetite and drinks water regularly. Sudden changes in eating or drinking habits can signal health issues.

*Regular Bathroom Habits* - Consistent, well-formed stools and regular urination patterns are signs of good digestive health.

**Behavioral Signs of Happiness:**

*Playfulness* - Happy dogs love to play! Whether it's fetch, tug-of-war, or just running around, playful behavior indicates good mental health.

*Tail Wagging* - While not all tail wagging means happiness, relaxed, loose wagging usually indicates a content dog.

*Good Sleep Patterns* - Dogs that feel safe and comfortable will sleep peacefully and regularly.

*Social Interaction* - Happy dogs seek out interaction with their family members and are generally friendly with familiar people.

**When to Be Concerned:**

Contact your veterinarian if you notice:
- Loss of appetite lasting more than 24 hours
- Lethargy or unusual tiredness
- Changes in bathroom habits
- Excessive scratching or licking
- Behavioral changes like aggression or withdrawal

**Promoting Happiness and Health:**

- Maintain regular exercise routines
- Provide mental stimulation through training and puzzle toys
- Ensure a balanced, nutritious diet
- Keep up with regular veterinary check-ups
- Create a safe, comfortable environment

Remember, you know your dog better than anyone. Trust your instincts - if something seems off, it's always better to consult with your veterinarian. Prevention and early detection are key to maintaining your dog's health and happiness for years to come.''',
            'category': 'health',
            'tags': 'health,wellness,signs,happy-dog,veterinary',
            'thumbnail': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
            'status': 'published',
            'reading_time': 5
        }
    ]
    
    stories = []
    for i, story_data in enumerate(stories_data):
        story = Story(
            title=story_data['title'],
            content=story_data['content'],
            preview=story_data['content'][:300] + '...',
            category=story_data['category'],
            tags=story_data['tags'],
            thumbnail=story_data['thumbnail'],
            status=story_data['status'],
            is_featured=story_data.get('is_featured', False),
            reading_time=story_data['reading_time'],
            views=50 + i * 25,
            likes_count=10 + i * 5,
            comments_count=3 + i * 2,
            user_id=users[i % len(users)].id,
            published_at=datetime.utcnow() - timedelta(days=i)
        )
        db.session.add(story)
        stories.append(story)
    
    db.session.commit()
    return stories

def create_sample_gallery(users):
    """Create sample gallery items"""
    print("Creating sample gallery items...")
    
    gallery_data = [
        {
            'title': 'Golden Hour in Tuscany',
            'description': 'Max enjoying the beautiful sunset in the Tuscan countryside',
            'file_type': 'image',
            'category': 'travel',
            'location': 'Tuscany, Italy',
            'photographer': 'Sophie Johnson',
            'tags': 'sunset,golden-hour,tuscany'
        },
        {
            'title': 'Training Session Success',
            'description': 'Perfect sit position achieved after weeks of training',
            'file_type': 'image',
            'category': 'training',
            'tags': 'training,obedience,success'
        },
        {
            'title': 'Roman Holiday',
            'description': 'Enjoying gelato together in front of the Trevi Fountain',
            'file_type': 'image',
            'category': 'travel',
            'location': 'Rome, Italy',
            'tags': 'rome,gelato,fountain'
        },
        {
            'title': 'Healthy Pup Checkup',
            'description': 'Annual vet visit - clean bill of health!',
            'file_type': 'image',
            'category': 'health',
            'tags': 'veterinary,health,checkup'
        }
    ]
    
    gallery_items = []
    for i, item_data in enumerate(gallery_data):
        item = GalleryItem(
            title=item_data['title'],
            description=item_data['description'],
            file_path=f'/uploads/gallery/sample_{i+1}.jpg',
            file_name=f'sample_{i+1}.jpg',
            file_size=1024000 + i * 500000,
            file_type=item_data['file_type'],
            mime_type='image/jpeg',
            thumbnail=f'/uploads/gallery/thumb_sample_{i+1}.jpg',
            category=item_data['category'],
            tags=item_data['tags'],
            location=item_data.get('location'),
            photographer=item_data.get('photographer'),
            views=100 + i * 30,
            downloads=20 + i * 10,
            likes=15 + i * 8,
            width=1920,
            height=1080,
            user_id=users[i % len(users)].id
        )
        db.session.add(item)
        gallery_items.append(item)
    
    db.session.commit()
    return gallery_items

def create_sample_tours(users):
    """Create sample tours"""
    print("Creating sample tours...")
    
    tours_data = [
        {
            'title': 'Tuscany Wine Country Dog Adventure',
            'description': 'Explore the beautiful Tuscan countryside with your furry friend! This 6-hour tour includes visits to three dog-friendly wineries, a traditional Italian lunch, and plenty of photo opportunities in the rolling hills of Chianti.',
            'short_description': 'Dog-friendly wine tour through Tuscan countryside with visits to three wineries and traditional lunch.',
            'location': 'Chianti, Tuscany',
            'duration': 6,
            'max_capacity': 8,
            'current_bookings': 3,
            'price': 145.00,
            'guide_name': 'Marco Rossi',
            'guide_contact': 'marco@tuscanydogs.com',
            'tour_type': 'group',
            'difficulty_level': 'easy',
            'includes': json.dumps(['Wine tastings', 'Traditional lunch', 'Transportation', 'Professional guide', 'Dog treats']),
            'requirements': json.dumps(['Dogs must be leashed', 'Current vaccination records', 'Well-socialized dogs only']),
            'thumbnail': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
        },
        {
            'title': 'Roman Ruins Discovery Walk',
            'description': 'Take a fascinating journey through ancient Rome with your dog! This walking tour covers the most dog-friendly archaeological sites, including the Baths of Caracalla and the Aventine Hill, with stops at local cafes for refreshments.',
            'short_description': 'Historical walking tour of ancient Roman sites with your dog, including cafe stops.',
            'location': 'Rome, Italy',
            'duration': 4,
            'max_capacity': 12,
            'current_bookings': 7,
            'price': 85.00,
            'guide_name': 'Giulia Romano',
            'guide_contact': 'giulia@romedogs.it',
            'tour_type': 'group',
            'difficulty_level': 'moderate',
            'includes': json.dumps(['Professional guide', 'Historical insights', 'Cafe stops', 'Dog water breaks', 'Small group size']),
            'requirements': json.dumps(['Good walking endurance', 'Leashed dogs required', 'Suitable for medium to large dogs']),
            'thumbnail': 'https://images.unsplash.com/photo-1552832230-c0197047daf8?w=800&h=600&fit=crop'
        },
        {
            'title': 'Amalfi Coast Sunset Sailing',
            'description': 'Experience the breathtaking beauty of the Amalfi Coast from the water with your canine companion! This sunset sailing trip includes swimming stops for dogs, local seafood aperitivo, and unforgettable views of the coastline.',
            'short_description': 'Sunset sailing adventure along the Amalfi Coast with swimming stops for dogs.',
            'location': 'Amalfi Coast',
            'duration': 3,
            'max_capacity': 6,
            'current_bookings': 2,
            'price': 165.00,
            'guide_name': 'Captain Antonio',
            'guide_contact': 'antonio@amalfisailing.com',
            'tour_type': 'private',
            'difficulty_level': 'easy',
            'includes': json.dumps(['Sailboat rental', 'Professional captain', 'Aperitivo', 'Dog life jackets', 'Swimming stops']),
            'requirements': json.dumps(['Dogs comfortable with water', 'Life jackets provided', 'Small to medium dogs preferred']),
            'thumbnail': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
        }
    ]
    
    tours = []
    for i, tour_data in enumerate(tours_data):
        tour = Tour(
            title=tour_data['title'],
            description=tour_data['description'],
            short_description=tour_data['short_description'],
            location=tour_data['location'],
            date=datetime.utcnow() + timedelta(days=7 + i * 3),
            duration=tour_data['duration'],
            max_capacity=tour_data['max_capacity'],
            current_bookings=tour_data['current_bookings'],
            price=tour_data['price'],
            guide_name=tour_data['guide_name'],
            guide_contact=tour_data['guide_contact'],
            tour_type=tour_data['tour_type'],
            difficulty_level=tour_data['difficulty_level'],
            includes=tour_data['includes'],
            requirements=tour_data['requirements'],
            thumbnail=tour_data['thumbnail']
        )
        db.session.add(tour)
        tours.append(tour)
    
    db.session.commit()
    return tours

def create_sample_analytics():
    """Create sample analytics data"""
    print("Creating sample analytics data...")
    
    metrics = ['page_views', 'user_registrations', 'story_views', 'gallery_views', 'tour_bookings']
    
    # Create data for last 30 days
    for i in range(30):
        date = datetime.utcnow().date() - timedelta(days=i)
        
        for metric in metrics:
            base_value = {
                'page_views': 250,
                'user_registrations': 5,
                'story_views': 100,
                'gallery_views': 75,
                'tour_bookings': 2
            }[metric]
            
            # Add some randomness
            import random
            value = base_value + random.randint(-20, 50)
            
            analytics = Analytics(
                date=date,
                metric_type=metric,
                metric_value=max(0, value)
            )
            db.session.add(analytics)
    
    db.session.commit()

def init_database():
    """Initialize the database with sample data"""
    print("Initializing DoggoDaily database...")
    
    # Create all tables
    print("Creating database tables...")
    db.create_all()
    
    # Create sample data
    users = create_sample_users()
    stories = create_sample_stories(users)
    gallery_items = create_sample_gallery(users)
    tours = create_sample_tours(users)
    create_sample_analytics()
    
    print("\n" + "="*50)
    print("Database initialization complete!")
    print("="*50)
    print(f"Created {len(users)} users (including 1 admin)")
    print(f"Created {len(stories)} stories")
    print(f"Created {len(gallery_items)} gallery items")
    print(f"Created {len(tours)} tours")
    print("Created 30 days of analytics data")
    print("\nAdmin login:")
    print("Email: admin@doggodaily.com")
    print("Password: AdminPass123!")
    print("\nUser login:")
    print("Email: sophie@example.com")
    print("Password: UserPass123!")
    print("="*50)

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        init_database() 