from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime
import logging

from ...models import User, Message, db
from ...auth.utils import TokenManager

contact_bp = Blueprint('contact', __name__)
logger = logging.getLogger(__name__)

@contact_bp.route('/submit', methods=['POST'])
@login_required
def submit_contact_message():
    """Submit contact message from contact page (requires authentication)"""
    try:
        # Ensure user is authenticated
        if not current_user.is_authenticated:
            return jsonify({
                'success': False,
                'message': 'Authentication required to send messages'
            }), 401
        
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
        
        # Use authenticated user's information
        user_id = current_user.id
        sender_name = current_user.name or current_user.email
        sender_email = current_user.email
        
        # Create message
        message = Message(
            user_id=user_id,
            sender_name=sender_name,
            sender_email=sender_email,
            sender_phone=data.get('phone', '').strip() if data.get('phone') else None,
            subject=data['subject'].strip(),
            message=data['message'].strip(),
            service_type=data.get('service', '').strip() if data.get('service') else None,
            urgency=data.get('urgency', 'normal'),
            status='unread',
            priority=data.get('urgency', 'normal')
        )
        
        db.session.add(message)
        db.session.commit()
        
        # Log the contact message submission
        TokenManager.log_security_event(
            user_id, 'contact_message_submitted',
            f'Contact message submitted: {message.subject}'
        )
        
        logger.info(f"Contact message submitted: ID {message.id}, Subject: {message.subject}, User: {current_user.email}")
        
        return jsonify({
            'success': True,
            'message': 'Your message has been sent successfully. We will get back to you soon!',
            'message_id': message.id
        }), 201
        
    except Exception as e:
        logger.error(f"Submit contact message error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to submit message. Please try again.'
        }), 500

@contact_bp.route('/messages', methods=['GET'])
@login_required
def get_user_messages():
    """Get messages for logged-in user"""
    try:
        if not current_user.is_authenticated:
            return jsonify({
                'success': False,
                'message': 'Authentication required'
            }), 401
        
        # Get user's messages
        messages = Message.query.filter_by(user_id=current_user.id).order_by(
            Message.created_at.desc()
        ).all()
        
        return jsonify({
            'success': True,
            'messages': [message.to_dict() for message in messages]
        }), 200
        
    except Exception as e:
        logger.error(f"Get user messages error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get messages'
        }), 500
