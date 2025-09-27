from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging

from ...models import User, SecurityLog, UserSession, db
from ...auth.utils import TokenManager, SessionManager

security_bp = Blueprint('security', __name__)
logger = logging.getLogger(__name__)

# Get user security info
@security_bp.route('/info', methods=['GET'])
@login_required
def get_security_info():
    """Get current user's security information"""
    try:
        user = User.query.get(current_user.id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get recent security events for this user
        recent_events = SecurityLog.query.filter_by(
            user_id=current_user.id
        ).order_by(SecurityLog.timestamp.desc()).limit(10).all()
        
        events = []
        for event in recent_events:
            events.append({
                'id': event.id,
                'event_type': event.event_type,
                'ip_address': event.ip_address,
                'details': event.details,
                'timestamp': event.timestamp.isoformat()
            })
        
        # Get active sessions
        active_sessions = []
        
        return jsonify({
            'success': True,
            'security_info': {
                'two_factor_enabled': user.two_factor_enabled,
                'email_verified': user.email_verified,
                'account_locked': user.is_account_locked(),
                'failed_login_attempts': user.failed_login_attempts or 0,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'password_changed_at': user.password_changed_at.isoformat() if user.password_changed_at else None,
                'requires_password_change': user.requires_password_change,
                'recent_events': events,
                'active_sessions': active_sessions
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get security info error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security information'
        }), 500

# Get security events for user
@security_bp.route('/events', methods=['GET'])
@login_required
def get_user_security_events():
    """Get security events for current user"""
    try:
        current_user_id = current_user.id
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        event_type = request.args.get('event_type', '').strip()
        
        # Build query
        query = SecurityLog.query.filter_by(user_id=current_user_id)
        
        if event_type:
            query = query.filter(SecurityLog.event_type == event_type)
        
        # Order by timestamp (newest first)
        query = query.order_by(SecurityLog.timestamp.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        events = []
        for event in pagination.items:
            events.append({
                'id': event.id,
                'event_type': event.event_type,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'details': event.details,
                'timestamp': event.timestamp.isoformat()
            })
        
        return jsonify({
            'success': True,
            'events': events,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get user security events error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security events'
        }), 500

# Unlock account (admin only)
@security_bp.route('/unlock-account/<int:user_id>', methods=['POST'])
@login_required
def unlock_user_account(user_id):
    """Unlock a user account (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Unlock account
        user.account_locked_until = None
        user.failed_login_attempts = 0
        user.updated_at = datetime.utcnow()
        
        # Log unlock action
        TokenManager.log_security_event(
            current_user_id, 'account_unlocked_by_admin',
            f'Unlocked account for user: {user.email} (ID: {user_id})'
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account unlocked successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Unlock account error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to unlock account'
        }), 500

# Get security statistics (admin only)
@security_bp.route('/statistics', methods=['GET'])
@login_required
def get_security_statistics():
    """Get security statistics (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get security statistics
        total_security_events = SecurityLog.query.count()
        total_sessions = UserSession.query.count()
        active_sessions = UserSession.query.filter_by(ended_at=None).count()
        
        # Get recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_security_events = SecurityLog.query.filter(
            SecurityLog.timestamp >= seven_days_ago
        ).count()
        
        recent_sessions = UserSession.query.filter(
            UserSession.created_at >= seven_days_ago
        ).count()
        
        # Get locked accounts
        locked_accounts = User.query.filter(
            User.account_locked_until > datetime.utcnow()
        ).count()
        
        # Get failed login attempts in last 24 hours
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        recent_failed_logins = SecurityLog.query.filter(
            SecurityLog.event_type == 'failed_login',
            SecurityLog.timestamp >= twenty_four_hours_ago
        ).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_security_events': total_security_events,
                'total_sessions': total_sessions,
                'active_sessions': active_sessions,
                'recent_security_events': recent_security_events,
                'recent_sessions': recent_sessions,
                'locked_accounts': locked_accounts,
                'recent_failed_logins': recent_failed_logins
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get security statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security statistics'
        }), 500 