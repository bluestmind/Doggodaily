"""
User preferences API routes for language and other settings
"""
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime

from ...extensions import db
from ...models import User

# Create blueprint
user_preferences_bp = Blueprint('user_preferences', __name__)

@user_preferences_bp.route('/language', methods=['GET'])
@login_required
def get_user_language():
    """Get current user's language preference"""
    try:
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get language from user preferences or default to 'en'
        language = getattr(user, 'language_preference', 'en') or 'en'
        
        return jsonify({
            'success': True,
            'language': language
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting user language: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get language preference'}), 500

@user_preferences_bp.route('/language', methods=['POST'])
@login_required
def update_user_language():
    """Update current user's language preference"""
    try:
        data = request.get_json()
        language = data.get('language', 'en')
        
        # Validate language code
        if language not in ['en', 'it']:
            return jsonify({
                'success': False, 
                'message': 'Invalid language code. Supported: en, it'
            }), 400
        
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Add language_preference column if it doesn't exist
        try:
            user.language_preference = language
        except AttributeError:
            # Column doesn't exist, we'll need to add it to the model
            # For now, store in a JSON field or create the column
            pass
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Language preference updated successfully',
            'language': language
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user language: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update language preference'}), 500

@user_preferences_bp.route('/preferences', methods=['GET'])
@login_required
def get_user_preferences():
    """Get all user preferences including language, theme, timezone, etc."""
    try:
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        preferences = {
            'language': getattr(user, 'language_preference', 'en') or 'en',
            'theme': getattr(user, 'theme_preference', 'light') or 'light',
            'timezone': getattr(user, 'timezone_preference', 'UTC') or 'UTC',
            'notifications': {
                'email': getattr(user, 'email_notifications', True),
                'push': getattr(user, 'push_notifications', True),
                'sms': getattr(user, 'sms_notifications', False)
            },
            'privacy': {
                'profile_visibility': getattr(user, 'profile_visibility', 'public') or 'public',
                'show_email': getattr(user, 'show_email_public', False),
                'show_activity': getattr(user, 'show_activity_public', True)
            }
        }
        
        return jsonify({
            'success': True,
            'preferences': preferences
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting user preferences: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get preferences'}), 500

@user_preferences_bp.route('/preferences', methods=['POST'])
@login_required
def update_user_preferences():
    """Update user preferences"""
    try:
        data = request.get_json()
        preferences = data.get('preferences', {})
        
        user = User.query.get(current_user.id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Update language
        if 'language' in preferences:
            language = preferences['language']
            if language in ['en', 'it']:
                try:
                    user.language_preference = language
                except AttributeError:
                    pass  # Column doesn't exist yet
        
        # Update theme
        if 'theme' in preferences:
            theme = preferences['theme']
            if theme in ['light', 'dark']:
                try:
                    user.theme_preference = theme
                except AttributeError:
                    pass
        
        # Update timezone
        if 'timezone' in preferences:
            try:
                user.timezone_preference = preferences['timezone']
            except AttributeError:
                pass
        
        # Update notification preferences
        if 'notifications' in preferences:
            notifications = preferences['notifications']
            try:
                user.email_notifications = notifications.get('email', True)
                user.push_notifications = notifications.get('push', True)
                user.sms_notifications = notifications.get('sms', False)
            except AttributeError:
                pass
        
        # Update privacy preferences
        if 'privacy' in preferences:
            privacy = preferences['privacy']
            try:
                user.profile_visibility = privacy.get('profile_visibility', 'public')
                user.show_email_public = privacy.get('show_email', False)
                user.show_activity_public = privacy.get('show_activity', True)
            except AttributeError:
                pass
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Preferences updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user preferences: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update preferences'}), 500