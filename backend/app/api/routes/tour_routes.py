from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime
import logging

from ...models import Tour, User, db
from ...auth.utils import TokenManager

tour_routes = Blueprint('tour', __name__)
logger = logging.getLogger(__name__)

# Handle OPTIONS requests for CORS preflight
@tour_routes.before_request
def handle_preflight():
    from flask import request, make_response
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response

# Get all tours
@tour_routes.route('/', methods=['GET'])
def get_tours():
    """Get all active tours with language support"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        language = request.args.get('lang', 'en')  # Get language parameter
        
        # Validate language parameter
        if language not in ['en', 'it']:
            language = 'en'
        
        # Build query for active tours
        query = Tour.query.filter(Tour.status == 'active')
        
        if search:
            # Search in both English and Italian fields
            search_filter = (
                Tour.title.ilike(f'%{search}%') | 
                Tour.description.ilike(f'%{search}%') |
                Tour.title_it.ilike(f'%{search}%') | 
                Tour.description_it.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        if category:
            query = query.filter(Tour.category == category)
        
        # Order by creation date (newest first)
        query = query.order_by(Tour.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        if pagination.total == 0:
            tours = []
            total = 0
            pages = 0
        else:
            # For public tours, we need to return all fields (both languages) 
            # so the frontend can choose which to display
            tours = []
            for tour in pagination.items:
                tour_data = tour.to_dict(language='en')  # Get base structure
                # Add Italian fields for frontend language switching
                tour_data.update({
                    'title_it': tour.title_it,
                    'description_it': tour.description_it,
                    'short_description_it': tour.short_description_it,
                    'location_it': tour.location_it
                })
                tours.append(tour_data)
            total = pagination.total
            pages = pagination.pages
        
        return jsonify({
            'success': True,
            'data': tours,
            'language': language,
            'meta': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': pages
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get tours error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get tours'
        }), 500

# Get tour by ID
@tour_routes.route('/<int:tour_id>', methods=['GET'])
def get_tour(tour_id):
    """Get tour by ID"""
    try:
        tour = Tour.query.get(tour_id)
        if not tour:
            return jsonify({
                'success': False,
                'message': 'Tour not found'
            }), 404
        
        # Check if user can view this tour
        current_user_id = getattr(current_user, 'id', None)
        current_user_obj = User.query.get(current_user_id) if current_user_id else None
        
        # Only show active tours to non-admin users
        if (tour.status != 'active') and (not current_user_obj or not current_user_obj.is_admin_user()):
            return jsonify({
                'success': False,
                'message': 'Tour not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': tour.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Get tour error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get tour'
        }), 500

# Create tour (admin only)
# Accept both /api/tours and /api/tours/ to avoid 308 redirects
@tour_routes.route('', methods=['POST'])
@tour_routes.route('/', methods=['POST'])
@login_required
def create_tour():
    """Create a new tour (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['title', 'description', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Create tour - map only valid fields
        tour = Tour(
            title=data['title'].strip(),
            description=data['description'].strip(),
            location=data.get('location', 'unspecified').strip(),
            date=datetime.fromisoformat(data.get('date')) if data.get('date') else datetime.utcnow(),
            duration=int(data.get('duration', 1)),
            max_capacity=int(data.get('max_capacity', 10)),
            price=float(data['price']),
            guide_name=data.get('guide_name', 'TBD').strip(),
            guide_contact=data.get('guide_contact'),
            tour_type=data.get('tour_type', 'group'),
            difficulty_level=data.get('difficulty_level', 'easy'),
            short_description=data.get('short_description'),
            includes=None,
            requirements=None,
            thumbnail=data.get('thumbnail'),
            gallery=None,
            status='active'
        )
        
        db.session.add(tour)
        db.session.commit()
        
        # Log tour creation
        TokenManager.log_security_event(
            current_user_id, 'tour_created',
            f'Created tour: {tour.title} (ID: {tour.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Tour created successfully',
            'tour': tour.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create tour error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create tour'
        }), 500

# Update tour (admin only)
@tour_routes.route('/<int:tour_id>', methods=['PUT'])
@login_required
def update_tour(tour_id):
    """Update tour (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        tour = Tour.query.get(tour_id)
        if not tour:
            return jsonify({
                'success': False,
                'message': 'Tour not found'
            }), 404
        
        # Update fields mapped to Tour model
        if 'title' in data:
            tour.title = data['title'].strip()
        if 'description' in data:
            tour.description = data['description'].strip()
        if 'location' in data:
            tour.location = data['location'].strip()
        if 'date' in data and data['date']:
            try:
                tour.date = datetime.fromisoformat(data['date'])
            except Exception:
                pass
        if 'duration' in data:
            try:
                tour.duration = int(data['duration'])
            except Exception:
                pass
        if 'max_capacity' in data:
            try:
                tour.max_capacity = int(data['max_capacity'])
            except Exception:
                pass
        if 'price' in data:
            tour.price = float(data['price'])
        if 'guide_name' in data:
            tour.guide_name = data['guide_name']
        if 'guide_contact' in data:
            tour.guide_contact = data['guide_contact']
        if 'tour_type' in data:
            tour.tour_type = data['tour_type']
        if 'difficulty_level' in data:
            tour.difficulty_level = data['difficulty_level']
        if 'short_description' in data:
            tour.short_description = data['short_description']
        if 'requirements' in data:
            tour.requirements = data['requirements']
        if 'thumbnail' in data:
            tour.thumbnail = data['thumbnail']
        if 'status' in data:
            tour.status = data['status']
        
        tour.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log tour update
        TokenManager.log_security_event(
            current_user_id, 'tour_updated',
            f'Updated tour: {tour.title} (ID: {tour.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Tour updated successfully',
            'tour': tour.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update tour error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update tour'
        }), 500

# Delete tour (admin only)
@tour_routes.route('/<int:tour_id>', methods=['DELETE'])
@login_required
def delete_tour(tour_id):
    """Delete tour (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        tour = Tour.query.get(tour_id)
        if not tour:
            return jsonify({
                'success': False,
                'message': 'Tour not found'
            }), 404
        
        # Log tour deletion
        TokenManager.log_security_event(
            current_user_id, 'tour_deleted',
            f'Deleted tour: {tour.title} (ID: {tour.id})'
        )
        
        db.session.delete(tour)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Tour deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete tour error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete tour'
        }), 500

# Get tour statistics (admin only)
@tour_routes.route('/statistics', methods=['GET'])
@login_required
def get_tour_statistics():
    """Get tour statistics (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Calculate statistics
        total_tours = Tour.query.count()
        active_tours = Tour.query.filter_by(status='active').count()
        inactive_tours = Tour.query.filter(Tour.status != 'active').count()
        # featured_tours = Tour.query.filter_by(featured=True).count()  # Tour model doesn't have featured field
        featured_tours = 0  # Placeholder until featured field is added if needed
        
        # Recent tours (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_tours = Tour.query.filter(
            Tour.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_tours': total_tours,
                'active_tours': active_tours,
                'inactive_tours': inactive_tours,
                'featured_tours': featured_tours,
                'recent_tours': recent_tours
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get tour statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get tour statistics'
        }), 500

# Get tour categories
@tour_routes.route('/categories', methods=['GET'])
def get_tour_categories():
    """Get all unique tour categories"""
    try:
        # Get unique categories from tour_type field
        categories = db.session.query(Tour.tour_type).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        # Add some default categories if none exist
        if not category_list:
            category_list = ['group', 'private', 'family', 'adventure', 'cultural']
        
        return jsonify({
            'success': True,
            'data': category_list
        }), 200
        
    except Exception as e:
        logger.error(f"Get tour categories error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get tour categories'
        }), 500

# Book a tour
@tour_routes.route('/<int:tour_id>/book', methods=['POST'])
def book_tour(tour_id):
    """Book a tour"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No booking data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['guest_name', 'guest_email', 'number_of_guests']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        tour = Tour.query.get(tour_id)
        if not tour:
            return jsonify({
                'success': False,
                'message': 'Tour not found'
            }), 404
        
        if tour.status != 'active':
            return jsonify({
                'success': False,
                'message': 'Tour is not available for booking'
            }), 400
        
        # Check capacity
        requested_guests = int(data['number_of_guests'])
        if tour.current_bookings + requested_guests > tour.max_capacity:
            return jsonify({
                'success': False,
                'message': 'Not enough spots available'
            }), 400
        
        # Create booking
        from ...models import TourBooking
        booking = TourBooking(
            tour_id=tour_id,
            guest_name=data['guest_name'].strip(),
            guest_email=data['guest_email'].strip(),
            guest_phone=data.get('guest_phone', '').strip(),
            number_of_guests=requested_guests,
            special_requests=data.get('special_requests', '').strip(),
            status='confirmed'
        )
        
        # Update tour booking count
        tour.current_bookings += requested_guests
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Tour booked successfully',
            'booking_id': booking.id
        }), 201
        
    except Exception as e:
        logger.error(f"Book tour error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to book tour'
        }), 500 