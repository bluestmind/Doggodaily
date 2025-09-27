from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime
import logging

from ...models import User, db
from ...auth.utils import TokenManager
from ...email import send_email

communication_bp = Blueprint('communication', __name__)
logger = logging.getLogger(__name__)

# Send bulk email (admin only)
@communication_bp.route('/bulk-email', methods=['POST'])
@login_required
def send_bulk_email():
    """Send bulk email to users (admin only)"""
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
        required_fields = ['subject', 'message', 'recipients']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        subject = data['subject'].strip()
        message = data['message'].strip()
        recipients = data['recipients']  # 'all', 'active', 'verified', or list of user IDs
        
        # Determine recipients
        if recipients == 'all':
            users = User.query.filter_by(is_active=True).all()
        elif recipients == 'active':
            users = User.query.filter_by(is_active=True).all()
        elif recipients == 'verified':
            users = User.query.filter_by(is_active=True, email_verified=True).all()
        elif isinstance(recipients, list):
            users = User.query.filter(
                User.id.in_(recipients),
                User.is_active == True
            ).all()
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid recipients parameter'
            }), 400
        
        # Send emails
        sent_count = 0
        failed_count = 0
        
        for user in users:
            try:
                send_email(
                    to=user.email,
                    subject=subject,
                    template='email/bulk_message.html',
                    user=user,
                    message=message
                )
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send email to {user.email}: {str(e)}")
                failed_count += 1
        
        # Log bulk email action
        TokenManager.log_security_event(
            current_user_id, 'bulk_email_sent',
            f'Sent bulk email to {sent_count} users, {failed_count} failed'
        )
        
        return jsonify({
            'success': True,
            'message': f'Bulk email sent successfully',
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_recipients': len(users)
        }), 200
        
    except Exception as e:
        logger.error(f"Send bulk email error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to send bulk email'
        }), 500

# Send notification to user (admin only)
@communication_bp.route('/notify-user/<int:user_id>', methods=['POST'])
@login_required
def notify_user(user_id):
    """Send notification to specific user (admin only)"""
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
        required_fields = ['subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        subject = data['subject'].strip()
        message = data['message'].strip()
        
        # Send email
        try:
            send_email(
                to=user.email,
                subject=subject,
                template='email/admin_notification.html',
                user=user,
                message=message
            )
            
            # Log notification
            TokenManager.log_security_event(
                current_user_id, 'user_notification_sent',
                f'Sent notification to user: {user.email} (ID: {user_id})'
            )
            
            return jsonify({
                'success': True,
                'message': 'Notification sent successfully'
            }), 200
            
        except Exception as e:
            logger.error(f"Failed to send notification to {user.email}: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Failed to send notification'
            }), 500
        
    except Exception as e:
        logger.error(f"Notify user error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to send notification'
        }), 500

# Get communication statistics (admin only)
@communication_bp.route('/statistics', methods=['GET'])
@login_required
def get_communication_statistics():
    """Get communication statistics (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get user statistics for communication
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        verified_users = User.query.filter_by(email_verified=True).count()
        
        # Get recent communication events
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_communications = SecurityLog.query.filter(
            SecurityLog.event_type.in_(['bulk_email_sent', 'user_notification_sent']),
            SecurityLog.timestamp >= thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_users': total_users,
                'active_users': active_users,
                'verified_users': verified_users,
                'recent_communications': recent_communications
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get communication statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get communication statistics'
        }), 500 