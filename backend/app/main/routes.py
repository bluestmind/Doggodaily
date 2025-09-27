
from . import main_bp
from flask import jsonify
from flask import current_app, send_from_directory
import os

# Import admin security decorator
from ..admin_security import admin_required, PermissionLevel
from flask_login import current_user

@main_bp.route('/')
def home():
    return jsonify({'message': 'main home'})
@main_bp.route('/uploads/<path:filename>')
def serve_uploads(filename):
    upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    upload_root_abs = os.path.abspath(upload_root)
    
    try:
        return send_from_directory(upload_root_abs, filename)
    except Exception as e:
        # Fallback: try to serve the file directly
        file_path = os.path.join(upload_root_abs, filename)
        if os.path.exists(file_path):
            from flask import send_file
            return send_file(file_path)
        else:
            from flask import abort
            abort(404)

@main_bp.route('/admin/dashboard', methods=['GET'])
@admin_required(permission_level=PermissionLevel.ADMIN.value)
def admin_dashboard():
    """Admin dashboard with permission level check"""
    try:
        # Fetch admin dashboard data based on permission level
        # using Flask-Login current_user
        
        # Different data for different admin levels
        if current_user.admin_level == PermissionLevel.SUPER_ADMIN.value:
            dashboard_data = {
                'full_system_overview': True,
                'user_management': True,
                'system_settings': True,
                'security_controls': True
            }
        elif current_user.admin_level == PermissionLevel.ADMIN.value:
            dashboard_data = {
                'user_management': True,
                'content_management': True,
                'basic_analytics': True
            }
        elif current_user.admin_level == PermissionLevel.MODERATOR.value:
            dashboard_data = {
                'content_management': True,
                'basic_user_overview': True
            }
        else:
            dashboard_data = {}
        
        return jsonify({
            'success': True,
            'message': 'Admin dashboard data retrieved',
            'data': dashboard_data
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Admin dashboard error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve admin dashboard'
        }), 500

@main_bp.route('/admin/users', methods=['GET'])
@admin_required(permission_level=PermissionLevel.ADMIN.value)
def list_users():
    """List users with admin-level permission"""
    try:
        # Fetch users based on admin's permission level
        # using Flask-Login current_user
        from ..models import User
        
        # Different user list based on admin level
        if current_user.admin_level in [
            PermissionLevel.SUPER_ADMIN.value, 
            PermissionLevel.ADMIN.value
        ]:
            users = User.query.all()
        elif current_user.admin_level == PermissionLevel.MODERATOR.value:
            # Moderators can only see limited user information
            users = User.query.with_entities(
                User.id, User.name, User.email, User.created_at
            ).all()
        else:
            return jsonify({
                'success': False,
                'message': 'Insufficient permissions'
            }), 403
        
        return jsonify({
            'success': True,
            'message': 'Users retrieved successfully',
            'data': [
                {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email,
                    'created_at': user.created_at.isoformat()
                } for user in users
            ]
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"List users error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve users'
        }), 500 