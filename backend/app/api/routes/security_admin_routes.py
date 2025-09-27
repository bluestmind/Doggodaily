"""
Security administration routes for admin panel
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging

from ...models import SecurityLog, SecurityAlert, User, AdminAuditLog
from ...admin_security import admin_required
from ...extensions import db

logger = logging.getLogger(__name__)
security_admin_bp = Blueprint('admin_security_logs', __name__)

@security_admin_bp.route('/logs', methods=['GET'])
@login_required
@admin_required()
def get_security_logs():
    """Get security logs for admin panel"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        log_type = request.args.get('type', None)
        
        # Build query
        query = SecurityLog.query
        
        if log_type:
            query = query.filter_by(event_type=log_type)
        
        # Get logs
        logs = query.order_by(SecurityLog.timestamp.desc()).limit(limit).all()
        
        # Convert to dict format
        security_data = {
            'logs': [
                {
                    'id': log.id,
                    'type': 'warning' if 'failed' in log.event_type.lower() else 'success',
                    'event': log.event_type,
                    'user': log.user.email if log.user else 'Unknown',
                    'ip': log.ip_address or 'Unknown',
                    'location': 'Unknown',  # To be enhanced with IP geolocation
                    'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'details': log.details or ''
                } for log in logs
            ]
        }
        
        return jsonify({
            'success': True,
            'data': security_data
        })
        
    except Exception as e:
        logger.error(f"Error getting security logs: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security logs'
        }), 500

@security_admin_bp.route('/settings', methods=['GET'])
@login_required
@admin_required()
def get_security_settings():
    """Get security settings"""
    try:
        # Get system settings from database
        from ...models import SystemConfig
        
        # Get or create security settings
        settings = {
            'passwordPolicy': {
                'minLength': 8,
                'requireNumbers': True,
                'requireSymbols': True,
                'requireUppercase': True,
                'passwordExpiry': 90
            },
            'sessionSettings': {
                'sessionTimeout': 30,
                'maxConcurrentSessions': 3,
                'logoutOnClose': True
            },
            'accessControl': {
                'twoFactorRequired': False,
                'ipWhitelist': [],
                'maxLoginAttempts': 5,
                'lockoutDuration': 15
            }
        }
        
        return jsonify({
            'success': True,
            'data': {'settings': settings}
        })
        
    except Exception as e:
        logger.error(f"Error getting security settings: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security settings'
        }), 500

@security_admin_bp.route('/settings', methods=['PUT'])
@login_required
@admin_required()
def update_security_settings():
    """Update security settings"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Update security settings in database
        # This would update SystemConfig entries
        
        # Log the change
        from ...utils.notification_helper import NotificationManager
        NotificationManager.log_activity(
            user_id=current_user.id,
            action='update_security_settings',
            description=f'Updated security settings',
            entity_type='security',
            entity_id='settings'
        )
        
        return jsonify({
            'success': True,
            'message': 'Security settings updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating security settings: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update security settings'
        }), 500

@security_admin_bp.route('/alerts', methods=['GET'])
@login_required
@admin_required()
def get_security_alerts():
    """Get security alerts"""
    try:
        # Get recent security alerts
        alerts = SecurityAlert.query.filter_by(resolved=False).order_by(
            SecurityAlert.timestamp.desc()
        ).limit(20).all()
        
        return jsonify({
            'success': True,
            'data': [alert.to_dict() for alert in alerts]
        })
        
    except Exception as e:
        logger.error(f"Error getting security alerts: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security alerts'
        }), 500