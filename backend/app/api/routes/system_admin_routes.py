"""
System administration routes for admin panel
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
import logging

from ...models import SystemConfig, User
from ...admin_security import admin_required
from ...extensions import db

logger = logging.getLogger(__name__)
system_admin_bp = Blueprint('admin_system_settings', __name__)

@system_admin_bp.route('/settings', methods=['GET'])
@login_required
@admin_required()
def get_system_settings():
    """Get system settings"""
    try:
        # Get all system configurations
        configs = SystemConfig.query.all()
        
        # Convert to organized structure
        settings = {
            'site': {
                'siteName': 'DoggoDaily',
                'siteDescription': 'Your Daily Dose of Dog Adventures',
                'contactEmail': 'contact@doggodaiily.com',
                'maintenanceMode': False
            },
            'media': {
                'maxFileSize': 10,  # MB
                'allowedFormats': ['jpg', 'jpeg', 'png', 'gif', 'mp4'],
                'imageQuality': 85,
                'autoOptimize': True
            },
            'notifications': {
                'emailEnabled': True,
                'pushEnabled': False,
                'smsEnabled': False,
                'notificationFrequency': 'daily'
            },
            'security': {
                'passwordMinLength': 8,
                'sessionTimeout': 30,
                'maxLoginAttempts': 5,
                'twoFactorRequired': False
            },
            'performance': {
                'cacheEnabled': True,
                'cacheDuration': 3600,
                'compressionEnabled': True,
                'lazyLoading': True
            }
        }
        
        # Override with actual database values if they exist
        for config in configs:
            # Parse the key path and update the settings
            key_parts = config.key.split('.')
            current_level = settings
            
            for part in key_parts[:-1]:
                if part not in current_level:
                    current_level[part] = {}
                current_level = current_level[part]
            
            current_level[key_parts[-1]] = config.get_value()
        
        return jsonify({
            'success': True,
            'data': settings
        })
        
    except Exception as e:
        logger.error(f"Error getting system settings: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get system settings'
        }), 500

@system_admin_bp.route('/settings', methods=['PUT'])
@login_required
@admin_required()
def update_system_settings():
    """Update system settings"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Flatten the nested settings structure
        def flatten_dict(d, parent_key='', sep='.'):
            items = []
            for k, v in d.items():
                new_key = f"{parent_key}{sep}{k}" if parent_key else k
                if isinstance(v, dict):
                    items.extend(flatten_dict(v, new_key, sep=sep).items())
                else:
                    items.append((new_key, v))
            return dict(items)
        
        flat_settings = flatten_dict(data)
        
        # Update or create each setting
        for key, value in flat_settings.items():
            config = SystemConfig.query.filter_by(key=key).first()
            
            if config:
                # Update existing
                config.set_value(value)
                config.updated_by = current_user.id
                config.updated_at = datetime.utcnow()
            else:
                # Create new
                config = SystemConfig(
                    key=key,
                    value=str(value),
                    data_type=type(value).__name__,
                    updated_by=current_user.id
                )
                db.session.add(config)
        
        db.session.commit()
        
        # Log the change
        from ...utils.notification_helper import NotificationManager
        NotificationManager.log_activity(
            user_id=current_user.id,
            action='update_system_settings',
            description=f'Updated system settings',
            entity_type='system',
            entity_id='settings'
        )
        
        return jsonify({
            'success': True,
            'message': 'System settings updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating system settings: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update system settings'
        }), 500

@system_admin_bp.route('/info', methods=['GET'])
@login_required
@admin_required()
def get_system_info():
    """Get system information"""
    try:
        import platform
        import psutil
        from flask import __version__ as flask_version
        
        # Get system information
        system_info = {
            'server': {
                'platform': platform.platform(),
                'python_version': platform.python_version(),
                'flask_version': flask_version,
                'cpu_count': psutil.cpu_count(),
                'memory_total': round(psutil.virtual_memory().total / (1024**3), 2),  # GB
                'memory_available': round(psutil.virtual_memory().available / (1024**3), 2),  # GB
                'disk_usage': round(psutil.disk_usage('/').percent, 1)
            },
            'database': {
                'total_users': User.query.count(),
                'active_users': User.query.filter_by(is_active=True).count(),
                'admin_users': User.query.filter(User.admin_level.in_(['admin', 'super_admin'])).count()
            },
            'application': {
                'version': '1.0.0',  # This should come from a config file
                'environment': 'development',  # This should come from config
                'debug_mode': True,  # This should come from config
                'last_restart': datetime.utcnow().isoformat()
            }
        }
        
        return jsonify({
            'success': True,
            'data': system_info
        })
        
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get system information'
        }), 500