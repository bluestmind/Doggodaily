"""
Notifications routes for real-time admin panel notifications
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging

from ...models_extended import Notification
from ...admin_security import admin_required
from ...extensions import db

logger = logging.getLogger(__name__)
notifications_bp = Blueprint('admin_notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@login_required
@admin_required()
def get_notifications():
    """Get notifications for admin users"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Build query for admin notifications
        query = Notification.query.filter(
            (Notification.user_id == current_user.id) | 
            (Notification.is_system == True)
        )
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        # Get notifications
        notifications = query.order_by(
            Notification.created_at.desc()
        ).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': [notif.to_dict() for notif in notifications]
        })
        
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get notifications'
        }), 500

@notifications_bp.route('/<int:notification_id>/read', methods=['POST'])
@login_required
@admin_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        # Check if user can access this notification
        if notification.user_id != current_user.id and not notification.is_system:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        notification.mark_as_read()
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        })
        
    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark notification as read'
        }), 500

@notifications_bp.route('/mark-all-read', methods=['POST'])
@login_required
@admin_required()
def mark_all_notifications_read():
    """Mark all notifications as read for current user"""
    try:
        # Update all unread notifications for current user
        Notification.query.filter(
            (Notification.user_id == current_user.id) | 
            (Notification.is_system == True),
            Notification.is_read == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All notifications marked as read'
        })
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark notifications as read'
        }), 500

@notifications_bp.route('/stats', methods=['GET'])
@login_required
@admin_required()
def get_notification_stats():
    """Get notification statistics"""
    try:
        # Get counts for current user
        total_notifications = Notification.query.filter(
            (Notification.user_id == current_user.id) | 
            (Notification.is_system == True)
        ).count()
        
        unread_notifications = Notification.query.filter(
            (Notification.user_id == current_user.id) | 
            (Notification.is_system == True),
            Notification.is_read == False
        ).count()
        
        # Get notifications from last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_notifications = Notification.query.filter(
            (Notification.user_id == current_user.id) | 
            (Notification.is_system == True),
            Notification.created_at >= yesterday
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'total': total_notifications,
                'unread': unread_notifications,
                'recent': recent_notifications
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting notification stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get notification statistics'
        }), 500