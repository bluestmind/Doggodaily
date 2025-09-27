from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime
import logging

from ...models import User, db
from ...auth.utils import TokenManager
from ...models import Story, StoryLike, Comment, TourBooking

user_bp = Blueprint('user', __name__)
logger = logging.getLogger(__name__)

# Get current user profile
@user_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """Get current user profile"""
    try:
        user = User.query.get(current_user.id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get profile'
        }), 500

# Get current user activity summary
@user_bp.route('/activity', methods=['GET'])
@login_required
def get_activity():
    """Return activity stats for the current user (stories, likes, comments, tours)."""
    try:
        uid = current_user.id
        stories_count = Story.query.filter_by(user_id=uid).count()
        likes_count = StoryLike.query.filter_by(user_id=uid).count()
        comments_count = Comment.query.filter_by(user_id=uid).count()
        tours_count = TourBooking.query.filter_by(user_id=uid).count()

        return jsonify({
            'success': True,
            'data': {
                'stories': stories_count,
                'likes': likes_count,
                'comments': comments_count,
                'tours': tours_count
            }
        }), 200
    except Exception as e:
        logger.error(f"Get activity error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get activity'}), 500

# Update user profile
@user_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update current user profile"""
    try:
        current_user_id = current_user.id
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Update allowed fields
        if 'name' in data:
            user.name = data['name'].strip()
        
        if 'email' in data:
            new_email = data['email'].strip().lower()
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != current_user_id:
                return jsonify({
                    'success': False,
                    'message': 'Email already in use'
                }), 409
            user.email = new_email
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update profile'
        }), 500

# Get user by ID (admin only)
@user_bp.route('/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    """Get user by ID (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
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
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user'
        }), 500

# Get all users (admin only)
@user_bp.route('/', methods=['GET'])
@login_required
def get_users():
    """Get all users (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        status = request.args.get('status', '').strip()
        
        # Build query
        query = User.query
        
        if search:
            query = query.filter(
                User.name.ilike(f'%{search}%') | 
                User.email.ilike(f'%{search}%')
            )
        
        if status:
            if status == 'active':
                query = query.filter(User.is_active == True)
            elif status == 'inactive':
                query = query.filter(User.is_active == False)
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        users = [user.to_dict() for user in pagination.items]
        
        return jsonify({
            'success': True,
            'users': users,
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
        logger.error(f"Get users error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get users'
        }), 500

# Update user (admin only)
@user_bp.route('/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    """Update user (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
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
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Update allowed fields
        if 'name' in data:
            user.name = data['name'].strip()
        
        if 'email' in data:
            new_email = data['email'].strip().lower()
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({
                    'success': False,
                    'message': 'Email already in use'
                }), 409
            user.email = new_email
        
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        
        if 'admin_level' in data:
            # Only super_admin can change admin levels
            if current_user_obj.admin_level != 'super_admin':
                return jsonify({
                    'success': False,
                    'message': 'Insufficient permissions'
                }), 403
            user.admin_level = data['admin_level']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update user error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update user'
        }), 500

# Delete user (admin only)
@user_bp.route('/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    """Delete user (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Prevent self-deletion
        if current_user.id == user_id:
            return jsonify({
                'success': False,
                'message': 'Cannot delete your own account'
            }), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Log deletion
        TokenManager.log_security_event(
            current_user.id, 'user_deleted',
            f'Deleted user: {user.email} (ID: {user_id})'
        )
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete user error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete user'
        }), 500

# Activate/Deactivate user (admin only)
@user_bp.route('/<int:user_id>/toggle-status', methods=['POST'])
@login_required
def toggle_user_status(user_id):
    """Activate/Deactivate user (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
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
        
        # Toggle status
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        
        # Log status change
        action = 'activated' if user.is_active else 'deactivated'
        TokenManager.log_security_event(
            current_user.id, f'user_{action}',
            f'{action.title()} user: {user.email} (ID: {user_id})'
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'User {action} successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Toggle user status error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update user status'
        }), 500

# Get user statistics (admin only)
@user_bp.route('/statistics', methods=['GET'])
@login_required
def get_user_statistics():
    """Get user statistics (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Calculate statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        inactive_users = User.query.filter_by(is_active=False).count()
        verified_users = User.query.filter_by(email_verified=True).count()
        unverified_users = User.query.filter_by(email_verified=False).count()
        
        # Admin statistics
        admin_users = User.query.filter(User.admin_level.in_(['admin', 'super_admin', 'moderator'])).count()
        
        # Recent registrations (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = User.query.filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': inactive_users,
                'verified_users': verified_users,
                'unverified_users': unverified_users,
                'admin_users': admin_users,
                'recent_registrations': recent_registrations
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get user statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user statistics'
        }), 500 