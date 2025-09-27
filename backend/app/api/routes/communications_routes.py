from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging

from ...admin_security import admin_required
from ...models import db

logger = logging.getLogger(__name__)
communications_bp = Blueprint('admin_communications', __name__)

@communications_bp.route('/messages', methods=['GET'])
@login_required
@admin_required()
def get_messages():
    """Get messages for communications hub"""
    try:
        # Get real messages from database
        from ...models import Message
        
        # Get recent messages ordered by creation date
        recent_messages = Message.query.order_by(
            Message.created_at.desc()
        ).limit(50).all()
        
        messages = []
        for msg in recent_messages:
            messages.append({
                'id': msg.id,
                'sender_name': msg.sender_name,
                'sender_email': msg.sender_email,
                'subject': msg.subject,
                'message': msg.message,
                'created_at': msg.created_at.isoformat(),
                'status': msg.status,
                'urgency': msg.urgency,
                'service_type': msg.service_type,
                'admin_response': msg.admin_response,
                'responded_at': msg.responded_at.isoformat() if msg.responded_at else None,
                'responded_by': msg.responded_by
            })
        
        return jsonify({
            'success': True,
            'data': messages
        })
        
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get messages'
        }), 500

@communications_bp.route('/messages/<int:message_id>/read', methods=['POST'])
@login_required
@admin_required()
def mark_message_as_read(message_id):
    """Mark a message as read"""
    try:
        from ...models import Message
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({
                'success': False,
                'message': 'Message not found'
            }), 404
        
        message.status = 'read'
        message.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Message marked as read'
        })
        
    except Exception as e:
        logger.error(f"Error marking message as read: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to mark message as read'
        }), 500

@communications_bp.route('/messages/<int:message_id>/reply', methods=['POST'])
@login_required
@admin_required()
def reply_to_message(message_id):
    """Reply to a message"""
    try:
        logger.info(f"📤 Reply request received for message {message_id}")
        logger.info(f"📤 Current user: {current_user.email if current_user.is_authenticated else 'Not authenticated'}")
        
        from ...models import Message
        
        data = request.get_json()
        logger.info(f"📤 Request data: {data}")
        
        if not data or not data.get('reply'):
            logger.warning("❌ No reply text provided")
            return jsonify({
                'success': False,
                'message': 'Reply text is required'
            }), 400
        
        message = Message.query.get(message_id)
        if not message:
            logger.warning(f"❌ Message {message_id} not found")
            return jsonify({
                'success': False,
                'message': 'Message not found'
            }), 404
        
        logger.info(f"📤 Found message: {message.subject}")
        
        # Update message with admin response
        message.admin_response = data['reply'].strip()
        message.responded_by = current_user.id
        message.responded_at = datetime.utcnow()
        message.status = 'replied'
        message.updated_at = datetime.utcnow()
        
        db.session.commit()
        logger.info(f"✅ Reply saved successfully for message {message_id}")
        
        # TODO: Send email notification to user
        # send_email_notification(message.sender_email, message.subject, data['reply'])
        
        return jsonify({
            'success': True,
            'message': 'Reply sent successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ Error replying to message: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to send reply'
        }), 500

@communications_bp.route('/stats', methods=['GET'])
@login_required
@admin_required()
def get_communication_stats():
    """Get communication statistics"""
    try:
        # Get real communication statistics from database
        from ...models import Message
        
        # Calculate real stats
        total_messages = Message.query.count()
        unread_messages = Message.query.filter_by(status='unread').count()
        replied_messages = Message.query.filter_by(status='replied').count()
        
        stats = {
            'unread': unread_messages,
            'sent': replied_messages,
            'campaigns': 0  # To be implemented when campaigns feature is added
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting communication stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get communication statistics'
        }), 500