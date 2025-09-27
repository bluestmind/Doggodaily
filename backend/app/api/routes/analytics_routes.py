from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging

from ...models import User, Story, GalleryItem, Tour, SecurityLog, db
from ...auth.utils import TokenManager

analytics_bp = Blueprint('analytics', __name__)
logger = logging.getLogger(__name__)

# Get user analytics
@analytics_bp.route('/users', methods=['GET'])
@login_required
def get_user_analytics():
    """Get user analytics (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get time period from query parameters
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # User registration trends
        registrations = db.session.query(
            db.func.date(User.created_at).label('date'),
            db.func.count(User.id).label('count')
        ).filter(
            User.created_at >= start_date
        ).group_by(
            db.func.date(User.created_at)
        ).order_by(
            db.func.date(User.created_at)
        ).all()
        
        # User activity by admin level
        admin_levels = db.session.query(
            User.admin_level,
            db.func.count(User.id).label('count')
        ).group_by(User.admin_level).all()
        
        # User verification status
        verification_status = db.session.query(
            User.email_verified,
            db.func.count(User.id).label('count')
        ).group_by(User.email_verified).all()
        
        # Recent user activity
        recent_logins = SecurityLog.query.filter(
            SecurityLog.event_type == 'successful_login',
            SecurityLog.timestamp >= start_date
        ).count()
        
        return jsonify({
            'success': True,
            'analytics': {
                'registrations': [
                    {'date': str(reg.date), 'count': reg.count} 
                    for reg in registrations
                ],
                'admin_levels': [
                    {'level': level.admin_level, 'count': level.count} 
                    for level in admin_levels
                ],
                'verification_status': [
                    {'verified': status.email_verified, 'count': status.count} 
                    for status in verification_status
                ],
                'recent_logins': recent_logins
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get user analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user analytics'
        }), 500

# Get content analytics
@analytics_bp.route('/content', methods=['GET'])
@login_required
def get_content_analytics():
    """Get content analytics (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get time period from query parameters
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Story creation trends
        story_creations = db.session.query(
            db.func.date(Story.created_at).label('date'),
            db.func.count(Story.id).label('count')
        ).filter(
            Story.created_at >= start_date
        ).group_by(
            db.func.date(Story.created_at)
        ).order_by(
            db.func.date(Story.created_at)
        ).all()
        
        # Story status distribution
        story_status = db.session.query(
            Story.status,
            db.func.count(Story.id).label('count')
        ).group_by(Story.status).all()
        
        # Gallery item creation trends
        gallery_creations = db.session.query(
            db.func.date(GalleryItem.created_at).label('date'),
            db.func.count(GalleryItem.id).label('count')
        ).filter(
            GalleryItem.created_at >= start_date
        ).group_by(
            db.func.date(GalleryItem.created_at)
        ).order_by(
            db.func.date(GalleryItem.created_at)
        ).all()
        
        # Tour creation trends
        tour_creations = db.session.query(
            db.func.date(Tour.created_at).label('date'),
            db.func.count(Tour.id).label('count')
        ).filter(
            Tour.created_at >= start_date
        ).group_by(
            db.func.date(Tour.created_at)
        ).order_by(
            db.func.date(Tour.created_at)
        ).all()
        
        return jsonify({
            'success': True,
            'analytics': {
                'story_creations': [
                    {'date': str(creation.date), 'count': creation.count} 
                    for creation in story_creations
                ],
                'story_status': [
                    {'status': status.status, 'count': status.count} 
                    for status in story_status
                ],
                'gallery_creations': [
                    {'date': str(creation.date), 'count': creation.count} 
                    for creation in gallery_creations
                ],
                'tour_creations': [
                    {'date': str(creation.date), 'count': creation.count} 
                    for creation in tour_creations
                ]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get content analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get content analytics'
        }), 500

# Get security analytics
@analytics_bp.route('/security', methods=['GET'])
@login_required
def get_security_analytics():
    """Get security analytics (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get time period from query parameters
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Security event trends
        security_events = db.session.query(
            db.func.date(SecurityLog.timestamp).label('date'),
            SecurityLog.event_type,
            db.func.count(SecurityLog.id).label('count')
        ).filter(
            SecurityLog.timestamp >= start_date
        ).group_by(
            db.func.date(SecurityLog.timestamp),
            SecurityLog.event_type
        ).order_by(
            db.func.date(SecurityLog.timestamp)
        ).all()
        
        # Event type distribution
        event_types = db.session.query(
            SecurityLog.event_type,
            db.func.count(SecurityLog.id).label('count')
        ).filter(
            SecurityLog.timestamp >= start_date
        ).group_by(SecurityLog.event_type).all()
        
        # Failed login attempts by IP
        failed_logins_by_ip = db.session.query(
            SecurityLog.ip_address,
            db.func.count(SecurityLog.id).label('count')
        ).filter(
            SecurityLog.event_type == 'failed_login',
            SecurityLog.timestamp >= start_date
        ).group_by(SecurityLog.ip_address).order_by(
            db.func.count(SecurityLog.id).desc()
        ).limit(10).all()
        
        return jsonify({
            'success': True,
            'analytics': {
                'security_events': [
                    {
                        'date': str(event.date), 
                        'event_type': event.event_type, 
                        'count': event.count
                    } 
                    for event in security_events
                ],
                'event_types': [
                    {'type': event.event_type, 'count': event.count} 
                    for event in event_types
                ],
                'failed_logins_by_ip': [
                    {'ip': event.ip_address, 'count': event.count} 
                    for event in failed_logins_by_ip
                ]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get security analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security analytics'
        }), 500

# Get system performance analytics
@analytics_bp.route('/performance', methods=['GET'])
@login_required
def get_performance_analytics():
    """Get system performance analytics (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get time period from query parameters
        days = request.args.get('days', 7, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Daily active users
        daily_active_users = db.session.query(
            db.func.date(SecurityLog.timestamp).label('date'),
            db.func.count(db.func.distinct(SecurityLog.user_id)).label('count')
        ).filter(
            SecurityLog.event_type == 'successful_login',
            SecurityLog.timestamp >= start_date
        ).group_by(
            db.func.date(SecurityLog.timestamp)
        ).order_by(
            db.func.date(SecurityLog.timestamp)
        ).all()
        
        # Content creation rate
        content_creation = db.session.query(
            db.func.date(Story.created_at).label('date'),
            db.func.count(Story.id).label('stories'),
            db.func.count(GalleryItem.id).label('gallery_items'),
            db.func.count(Tour.id).label('tours')
        ).outerjoin(
            GalleryItem, db.func.date(Story.created_at) == db.func.date(GalleryItem.created_at)
        ).outerjoin(
            Tour, db.func.date(Story.created_at) == db.func.date(Tour.created_at)
        ).filter(
            Story.created_at >= start_date
        ).group_by(
            db.func.date(Story.created_at)
        ).order_by(
            db.func.date(Story.created_at)
        ).all()
        
        # System load indicators
        total_users = User.query.count()
        total_stories = Story.query.count()
        total_gallery_items = GalleryItem.query.count()
        total_tours = Tour.query.count()
        total_security_events = SecurityLog.query.count()
        
        return jsonify({
            'success': True,
            'analytics': {
                'daily_active_users': [
                    {'date': str(day.date), 'count': day.count} 
                    for day in daily_active_users
                ],
                'content_creation': [
                    {
                        'date': str(creation.date), 
                        'stories': creation.stories,
                        'gallery_items': creation.gallery_items,
                        'tours': creation.tours
                    } 
                    for creation in content_creation
                ],
                'system_load': {
                    'total_users': total_users,
                    'total_stories': total_stories,
                    'total_gallery_items': total_gallery_items,
                    'total_tours': total_tours,
                    'total_security_events': total_security_events
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get performance analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get performance analytics'
        }), 500 