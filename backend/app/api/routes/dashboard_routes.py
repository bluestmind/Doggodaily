from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging

from ...models import User, Story, GalleryItem as Gallery, Tour
from ...admin_security import admin_required

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('admin_dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@login_required
@admin_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # Get basic counts
        total_users = User.query.count()
        total_stories = Story.query.count()
        total_gallery = Gallery.query.count()
        total_tours = Tour.query.count()
        
        # Get monthly stats (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Get real monthly views and likes from database
        from ...models_extended import ViewTracker, LikeTracker
        monthly_views = ViewTracker.query.filter(
            ViewTracker.timestamp >= thirty_days_ago
        ).count()
        monthly_likes = LikeTracker.query.filter(
            LikeTracker.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'total_users': total_users,
                'total_stories': total_stories,
                'total_gallery': total_gallery,
                'total_tours': total_tours,
                'monthly_views': monthly_views,
                'monthly_likes': monthly_likes
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get dashboard statistics'
        }), 500

@dashboard_bp.route('/activity', methods=['GET'])
@login_required
@admin_required()
def get_recent_activity():
    """Get recent activity feed"""
    try:
        # Get real activity from AdminAuditLog and other sources
        from ...models import AdminAuditLog
        
        # Get recent admin activities
        recent_activities = AdminAuditLog.query.order_by(
            AdminAuditLog.timestamp.desc()
        ).limit(25).all()
        
        activities = []
        for activity in recent_activities:
            activities.append({
                'id': activity.id,
                'type': activity.target_type or 'system',
                'action': activity.action,
                'user': activity.admin_username,
                'time': activity.timestamp.strftime('%Y-%m-%d %H:%M'),
                'status': 'success' if activity.severity == 'info' else activity.severity
            })
        
        return jsonify({
            'success': True,
            'data': activities
        })
        
    except Exception as e:
        logger.error(f"Error getting recent activity: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get recent activity'
        }), 500