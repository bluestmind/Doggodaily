"""
Enhanced Profile management routes with comprehensive features
"""
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
import os
import json
from datetime import datetime, timedelta
import logging

from ...models import User, Story, GalleryItem, TourBooking, Comment, StoryLike, SecurityLog, UserSession
from ...extensions import db

logger = logging.getLogger(__name__)
profile_bp = Blueprint('profile', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Story submission extensions
STORY_ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'}
STORY_MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_story_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in STORY_ALLOWED_EXTENSIONS

def generate_story_video_thumbnail(video_path, output_dir):
    """
    Generate a thumbnail for a video file using ffmpeg
    Returns the relative path to the thumbnail file
    """
    try:
        import subprocess
        
        # Generate thumbnail filename
        video_name = os.path.splitext(os.path.basename(video_path))[0]
        thumbnail_filename = f"{video_name}_thumb.jpg"
        thumbnail_path = os.path.join(output_dir, thumbnail_filename)
        
        # Use ffmpeg to extract thumbnail at 1 second mark
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-ss', '00:00:01',  # Extract at 1 second
            '-vframes', '1',    # Only 1 frame
            '-q:v', '2',        # High quality
            '-y',               # Overwrite output file
            thumbnail_path
        ]
        
        # Run ffmpeg command
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and os.path.exists(thumbnail_path):
            # Return relative path for database storage
            return f'uploads/story_submissions/{thumbnail_filename}'
        else:
            current_app.logger.error(f"FFmpeg failed: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        current_app.logger.error("FFmpeg timeout - video might be corrupted")
        return None
    except Exception as e:
        current_app.logger.error(f"Video thumbnail generation failed: {e}")
        return None

@profile_bp.route('/', methods=['GET'])
@login_required
def get_profile():
    """Get comprehensive user profile data"""
    try:
        user_data = current_user.to_dict()
        
        # Add additional computed fields
        user_data.update({
            'avatar_url': current_user.avatar_url if hasattr(current_user, 'avatar_url') else None,
            'total_stories': Story.query.filter_by(user_id=current_user.id).count(),
            'total_likes_received': db.session.query(StoryLike).join(Story).filter(Story.user_id == current_user.id).count(),
            'total_comments_made': Comment.query.filter_by(user_id=current_user.id).count(),
            'total_tours_booked': TourBooking.query.filter_by(user_id=current_user.id).count(),
        })
        
        return jsonify({
            'success': True,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Error getting profile: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get profile'
        }), 500

@profile_bp.route('/', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile information"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Update allowed fields
        if 'name' in data:
            current_user.name = data['name'].strip()
        
        if 'email' in data:
            email = data['email'].strip().lower()
            # Check if email is already taken by another user
            existing_user = User.query.filter(
                User.email == email,
                User.id != current_user.id
            ).first()
            if existing_user:
                return jsonify({
                    'success': False,
                    'message': 'Email already in use'
                }), 400
            current_user.email = email
        
        if 'bio' in data:
            current_user.bio = data['bio']
        
        # Add preferences if they exist
        if 'preferences' in data:
            current_user.preferences = json.dumps(data['preferences'])
        
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the activity
        current_app.logger.info(f"Profile updated by user {current_user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update profile'
        }), 500

@profile_bp.route('/avatar', methods=['POST'])
@login_required
def upload_avatar():
    """Upload user avatar"""
    try:
        if 'avatar' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'Invalid file type. Only PNG, JPG, JPEG, GIF allowed'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'message': 'File too large. Maximum size is 5MB'
            }), 400
        
        # Create uploads directory if it doesn't exist
        upload_folder = os.path.join(current_app.root_path, '..', 'uploads', 'avatars')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Generate unique filename
        filename = secure_filename(f"user_{current_user.id}_{datetime.utcnow().timestamp()}.{file.filename.rsplit('.', 1)[1].lower()}")
        file_path = os.path.join(upload_folder, filename)
        
        # Save file
        file.save(file_path)
        
        # Update user avatar path
        current_user.avatar_path = f"uploads/avatars/{filename}"
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the activity
        current_app.logger.info(f"Avatar uploaded by user {current_user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Avatar uploaded successfully',
            'avatar_url': f"/uploads/avatars/{filename}"
        })
        
    except Exception as e:
        logger.error(f"Error uploading avatar: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload avatar'
        }), 500

@profile_bp.route('/activity', methods=['GET'])
@login_required
def get_activity_history():
    """Get user activity history"""
    try:
        # Get user's content interactions
        user_stories = Story.query.filter_by(user_id=current_user.id).all()
        user_likes = StoryLike.query.filter_by(user_id=current_user.id).all()
        user_comments = Comment.query.filter_by(user_id=current_user.id).all()
        user_bookings = TourBooking.query.filter_by(user_id=current_user.id).all()
        
        # Create mock activities from user's content
        activities = []
        for story in user_stories[:10]:  # Limit to 10 recent stories
            activities.append({
                'id': f"story_{story.id}",
                'action': 'story_created',
                'description': f'Created story: {story.title}',
                'entity_type': 'story',
                'entity_id': str(story.id),
                'created_at': story.created_at.isoformat()
            })
        
        # Compile comprehensive activity data
        activity_data = {
            'activities': activities,
            'pagination': {
                'page': 1,
                'pages': 1,
                'per_page': 20,
                'total': len(activities)
            },
            'summary': {
                'total_stories': len(user_stories),
                'total_likes_given': len(user_likes),
                'total_comments': len(user_comments),
                'total_bookings': len(user_bookings),
                'stories_published': len([s for s in user_stories if s.status == 'published']),
                'stories_draft': len([s for s in user_stories if s.status == 'draft'])
            }
        }
        
        return jsonify({
            'success': True,
            'data': activity_data
        })
        
    except Exception as e:
        logger.error(f"Error getting activity history: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get activity history'
        }), 500

@profile_bp.route('/security', methods=['GET'])
@login_required
def get_security_info():
    """Get user security information"""
    try:
        # Get active sessions
        active_sessions = UserSession.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).all()
        
        # Get recent security logs
        security_logs = SecurityLog.query.filter_by(
            user_id=current_user.id
        ).order_by(SecurityLog.timestamp.desc()).limit(10).all()
        
        # Get login history from security logs
        login_history = SecurityLog.query.filter(
            SecurityLog.user_id == current_user.id,
            SecurityLog.event_type.like('%login%')
        ).order_by(SecurityLog.timestamp.desc()).limit(20).all()
        
        security_data = {
            'two_factor_enabled': current_user.two_factor_enabled,
            'active_sessions': [
                {
                    'id': session.id,
                    'ip_address': session.ip_address,
                    'user_agent': session.user_agent,
                    'created_at': session.created_at.isoformat(),
                    'last_activity': session.last_activity.isoformat(),
                    'is_current': session.access_token_jti == request.headers.get('Session-Token')
                } for session in active_sessions
            ],
            'recent_activities': [
                {
                    'event': log.event_type,
                    'ip_address': log.ip_address,
                    'timestamp': log.timestamp.isoformat(),
                    'details': log.details
                } for log in security_logs
            ],
            'login_history': [
                {
                    'event': log.event_type,
                    'ip_address': log.ip_address,
                    'timestamp': log.timestamp.isoformat(),
                    'success': 'success' in log.event_type.lower()
                } for log in login_history
            ]
        }
        
        return jsonify({
            'success': True,
            'data': security_data
        })
        
    except Exception as e:
        logger.error(f"Error getting security info: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security information'
        }), 500

@profile_bp.route('/password-test', methods=['GET'])
@login_required
def password_test():
    """Test endpoint to verify authentication"""
    try:
        return jsonify({
            'success': True,
            'message': 'Authentication working',
            'user_id': current_user.id,
            'user_email': current_user.email
        })
    except Exception as e:
        logger.error(f"Password test error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@profile_bp.route('/password', methods=['PUT'])
@login_required
def change_password():
    """Change user password"""
    try:
        logger.info(f"Password change request from user {current_user.id}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request content type: {request.content_type}")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info(f"Current user: {current_user}")
        logger.info(f"Current user ID: {current_user.id}")
        logger.info(f"Current user email: {current_user.email}")
        
        data = request.get_json()
        logger.info(f"Request data: {data}")
        
        if not data:
            logger.warning("No data provided in password change request")
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        logger.info(f"Current password provided: {bool(current_password)}")
        logger.info(f"New password provided: {bool(new_password)}")
        
        if not current_password or not new_password:
            logger.warning("Missing password fields")
            return jsonify({
                'success': False,
                'message': 'Current and new passwords are required'
            }), 400
        
        # Verify current password
        logger.info(f"Verifying current password for user {current_user.id}")
        password_valid = check_password_hash(current_user.password_hash, current_password)
        logger.info(f"Password verification result: {password_valid}")
        
        if not password_valid:
            logger.warning(f"Invalid current password for user {current_user.id}")
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 400
        
        # Validate new password
        logger.info(f"Validating new password length: {len(new_password)}")
        if len(new_password) < 6:
            logger.warning(f"New password too short: {len(new_password)} characters")
            return jsonify({
                'success': False,
                'message': 'New password must be at least 6 characters'
            }), 400
        
        # Update password
        current_user.password_hash = generate_password_hash(new_password)
        current_user.password_changed_at = datetime.utcnow()
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the password change
        security_log = SecurityLog(
            user_id=current_user.id,
            event_type='password_change',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            details='Password changed successfully'
        )
        db.session.add(security_log)
        
        current_app.logger.info(f"Password changed by user {current_user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        })
        
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to change password'
        }), 500

@profile_bp.route('/preferences', methods=['GET'])
@login_required
def get_preferences():
    """Get user preferences"""
    try:
        preferences = {
            'notifications': {
                'email_notifications': True,
                'push_notifications': False,
                'story_updates': True,
                'tour_reminders': True,
                'weekly_digest': True
            },
            'privacy': {
                'profile_visibility': 'public',
                'show_activity': True,
                'show_stats': True
            },
            'display': {
                'theme': 'light',
                'language': 'en',
                'timezone': 'UTC'
            }
        }
        
        # Load saved preferences if they exist
        if hasattr(current_user, 'preferences') and current_user.preferences:
            try:
                saved_prefs = json.loads(current_user.preferences)
                preferences.update(saved_prefs)
            except (json.JSONDecodeError, AttributeError):
                pass
        
        return jsonify({
            'success': True,
            'data': preferences
        })
        
    except Exception as e:
        logger.error(f"Error getting preferences: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get preferences'
        }), 500

@profile_bp.route('/preferences', methods=['PUT'])
@login_required
def update_preferences():
    """Update user preferences"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Save preferences as JSON
        current_user.preferences = json.dumps(data)
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the activity
        current_app.logger.info(f"Preferences updated by user {current_user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Preferences updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update preferences'
        }), 500

@profile_bp.route('/security-logs', methods=['GET'])
@login_required
def get_security_logs():
    """Get user's security logs"""
    try:
        # Get security logs
        security_logs = SecurityLog.query.filter_by(
            user_id=current_user.id
        ).order_by(SecurityLog.created_at.desc()).limit(50).all()
        
        logs_data = []
        for log in security_logs:
            logs_data.append({
                'id': log.id,
                'action': log.event_type.replace('_', ' ').title(),
                'device_name': log.user_agent or 'Unknown Device',
                'location': 'Unknown Location',  # Could be enhanced with IP geolocation
                'ip_address': log.ip_address or 'Unknown IP',
                'status': 'success' if log.event_type in ['login', 'password_change', 'profile_update'] else 'info',
                'created_at': log.created_at.isoformat() if log.created_at else None
            })
        
        return jsonify({
            'success': True,
            'logs': logs_data
        })
        
    except Exception as e:
        logger.error(f"Error getting security logs: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security logs'
        }), 500

@profile_bp.route('/activities', methods=['GET'])
@login_required
def get_activities():
    """Get user's recent activities"""
    try:
        # Get recent activities from various sources
        activities = []
        
        # Get recent stories
        recent_stories = Story.query.filter_by(
            user_id=current_user.id
        ).order_by(Story.created_at.desc()).limit(5).all()
        
        for story in recent_stories:
            activities.append({
                'id': f"story_{story.id}",
                'type': 'story_created',
                'title': 'Created new story',
                'description': story.title,
                'created_at': story.created_at.isoformat() if story.created_at else None
            })
        
        # Get recent tour bookings
        recent_bookings = TourBooking.query.filter_by(
            user_id=current_user.id
        ).order_by(TourBooking.created_at.desc()).limit(5).all()
        
        for booking in recent_bookings:
            activities.append({
                'id': f"booking_{booking.id}",
                'type': 'tour_booked',
                'title': 'Booked a tour',
                'description': f"Tour booking #{booking.id}",
                'created_at': booking.created_at.isoformat() if booking.created_at else None
            })
        
        # Get recent comments
        recent_comments = Comment.query.filter_by(
            user_id=current_user.id
        ).order_by(Comment.created_at.desc()).limit(5).all()
        
        for comment in recent_comments:
            activities.append({
                'id': f"comment_{comment.id}",
                'type': 'comment_made',
                'title': 'Commented on story',
                'description': comment.content[:50] + '...' if len(comment.content) > 50 else comment.content,
                'created_at': comment.created_at.isoformat() if comment.created_at else None
            })
        
        # Sort by creation date
        activities.sort(key=lambda x: x['created_at'] or '', reverse=True)
        
        return jsonify({
            'success': True,
            'activities': activities[:20]  # Limit to 20 most recent
        })
        
    except Exception as e:
        logger.error(f"Error getting activities: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get activities'
        }), 500

@profile_bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    """Get user's activity statistics"""
    try:
        # Count stories
        total_stories = Story.query.filter_by(user_id=current_user.id).count()
        
        # Count likes received
        total_likes = StoryLike.query.join(Story).filter(
            Story.user_id == current_user.id
        ).count()
        
        # Count comments made
        total_comments = Comment.query.filter_by(user_id=current_user.id).count()
        
        # Count tour bookings
        total_tours = TourBooking.query.filter_by(user_id=current_user.id).count()
        
        stats = {
            'totalStories': total_stories,
            'totalLikes': total_likes,
            'totalComments': total_comments,
            'totalTours': total_tours
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get stats'
        }), 500

@profile_bp.route('/toggle-2fa', methods=['POST'])
@login_required
def toggle_2fa():
    """Toggle 2FA for user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        enabled = data.get('enabled', False)
        
        # Update user's 2FA status
        current_user.two_factor_enabled = enabled
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the 2FA change
        security_log = SecurityLog(
            user_id=current_user.id,
            event_type='2fa_toggled',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            details=f"2FA {'enabled' if enabled else 'disabled'}",
            created_at=datetime.utcnow()
        )
        db.session.add(security_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"2FA {'enabled' if enabled else 'disabled'} successfully",
            'two_factor_enabled': enabled
        })
        
    except Exception as e:
        logger.error(f"Error toggling 2FA: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to toggle 2FA'
        }), 500

@profile_bp.route('/sessions', methods=['GET'])
@login_required
def get_sessions():
    """Get user's active sessions"""
    try:
        # Get active sessions
        active_sessions = UserSession.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).order_by(UserSession.last_activity.desc()).all()
        
        sessions_data = []
        for session in active_sessions:
            sessions_data.append({
                'id': session.id,
                'device_name': session.device_name or 'Unknown Device',
                'device_type': session.device_type or 'desktop',
                'location': session.location or 'Unknown Location',
                'ip_address': session.ip_address or 'Unknown IP',
                'is_current': session.id == getattr(current_user, 'current_session_id', None),
                'last_activity': session.last_activity.isoformat() if session.last_activity else None,
                'created_at': session.created_at.isoformat() if session.created_at else None
            })
        
        return jsonify({
            'success': True,
            'sessions': sessions_data
        })
        
    except Exception as e:
        logger.error(f"Error getting sessions: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get sessions'
        }), 500

@profile_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@login_required
def end_session(session_id):
    """End a specific user session"""
    try:
        session = UserSession.query.filter_by(
            id=session_id,
            user_id=current_user.id
        ).first()
        
        if not session:
            return jsonify({
                'success': False,
                'message': 'Session not found'
            }), 404
        
        session.is_active = False
        session.ended_at = datetime.utcnow()
        db.session.commit()
        
        # Log the session termination
        security_log = SecurityLog(
            user_id=current_user.id,
            event_type='session_terminated',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            details=f'Session {session_id} terminated by user'
        )
        db.session.add(security_log)
        
        return jsonify({
            'success': True,
            'message': 'Session ended successfully'
        })
        
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to end session'
        }), 500

# Test route to verify profile routes are working
@profile_bp.route('/test', methods=['GET'])
def test_route():
    """Test route to verify profile routes are working"""
    return jsonify({
        'success': True,
        'message': 'Profile routes are working!',
        'timestamp': datetime.utcnow().isoformat()
    })

# Story submission routes
@profile_bp.route('/submit', methods=['POST'])
@login_required
def submit_story():
    """Submit a new story for review"""
    try:
        # Get form data
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        location = request.form.get('location', '').strip()
        category = request.form.get('category', 'adventure')
        tags = request.form.get('tags', '').strip()
        terms_accepted = request.form.get('terms_accepted') == 'true'
        
        # Validation
        if not title:
            return jsonify({'success': False, 'message': 'Title is required'}), 400
        if not content:
            return jsonify({'success': False, 'message': 'Content is required'}), 400
        if not terms_accepted:
            return jsonify({'success': False, 'message': 'Terms and conditions must be accepted'}), 400
        
        # Process tags
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()] if tags else []
        
        # Process media files
        thumbnail_path = None
        media_files = []
        uploaded_files = request.files.getlist('media_files')
        thumbnail_files = request.files.getlist('thumbnail_files')
        
        if uploaded_files:
            # Create upload directory for story media
            upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            story_media_dir = os.path.join(upload_root, 'story_submissions')
            os.makedirs(story_media_dir, exist_ok=True)
            
            # Create a mapping of thumbnail files by index
            thumbnail_map = {}
            for i, thumb_file in enumerate(thumbnail_files):
                if thumb_file and thumb_file.filename:
                    thumbnail_map[i] = thumb_file
            
            # Process all media files (images and videos)
            for i, file in enumerate(uploaded_files):
                if file and file.filename and allowed_story_file(file.filename):
                    file_ext = file.filename.rsplit('.', 1)[1].lower()
                    
                    # Generate unique filename
                    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                    filename = f"story_{current_user.id}_{timestamp}_{i}.{file_ext}"
                    file_path = os.path.join(story_media_dir, filename)
                    
                    # Check file size
                    file.seek(0, os.SEEK_END)
                    file_size = file.tell()
                    file.seek(0)
                    
                    if file_size > STORY_MAX_FILE_SIZE:
                        continue  # Skip large files
                    
                    try:
                        file.save(file_path)
                        
                        # Determine file type
                        if file_ext in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
                            file_type = 'image'
                            # Use first image as thumbnail
                            if not thumbnail_path:
                                thumbnail_path = f"uploads/story_submissions/{filename}"
                        elif file_ext in ['mp4', 'mov', 'avi', 'webm']:
                            file_type = 'video'
                            # Check if user provided custom thumbnail
                            custom_thumbnail_path = None
                            if i in thumbnail_map:
                                thumb_file = thumbnail_map[i]
                                if thumb_file.filename and thumb_file.filename.rsplit('.', 1)[1].lower() in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
                                    # Save custom thumbnail
                                    thumb_ext = thumb_file.filename.rsplit('.', 1)[1].lower()
                                    thumb_filename = f"thumb_{filename.rsplit('.', 1)[0]}.{thumb_ext}"
                                    thumb_path = os.path.join(story_media_dir, thumb_filename)
                                    thumb_file.save(thumb_path)
                                    custom_thumbnail_path = f"uploads/story_submissions/{thumb_filename}"
                                    current_app.logger.info(f"Custom thumbnail saved: {thumb_filename}")
                            
                            # Use custom thumbnail or generate one
                            if not thumbnail_path:
                                if custom_thumbnail_path:
                                    thumbnail_path = custom_thumbnail_path
                                else:
                                    thumbnail_path = generate_story_video_thumbnail(file_path, story_media_dir)
                        else:
                            file_type = 'other'
                        
                        # Store media file info
                        media_file_info = {
                            'filename': filename,
                            'file_path': f"uploads/story_submissions/{filename}",
                            'file_type': file_type,
                            'file_size': file_size,
                            'mime_type': file.content_type or 'application/octet-stream'
                        }
                        
                        # Add thumbnail info for videos
                        if file_type == 'video' and i in thumbnail_map:
                            media_file_info['thumbnail_path'] = custom_thumbnail_path
                        
                        media_files.append(media_file_info)
                        
                        current_app.logger.info(f"Story media saved: {filename} ({file_type})")
                        
                    except Exception as e:
                        current_app.logger.error(f"Error saving story media: {str(e)}")
                        continue
        
        # Create Story record
        try:
            story = Story(
                title=title,
                content=content,
                user_id=current_user.id,
                category=category,
                tags=','.join(tag_list) if tag_list else '',
                status='pending',  # Submitted for review
                submitted_at=datetime.utcnow(),
                thumbnail=thumbnail_path,  # Set thumbnail if available
                media_files=json.dumps(media_files) if media_files else None  # Store media files info
            )
            
            db.session.add(story)
            db.session.commit()
            
            # Create response data with thumbnail URL and media files
            submission_data = {
                'id': story.id,
                'title': story.title,
                'content': story.content,
                'category': story.category,
                'tags': tag_list,
                'status': story.status,
                'submitted_at': story.submitted_at.isoformat() if story.submitted_at else None,
                'created_at': story.created_at.isoformat(),
                'thumbnail': story.thumbnail,
                'thumbnail_url': story.to_dict().get('thumbnail_url'),  # Get generated URL
                'media_files': media_files  # Include media files info
            }
            
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"Database error: {str(db_error)}")
            return jsonify({'success': False, 'message': 'Failed to save story submission'}), 500
        
        # Log activity
        try:
            current_app.logger.info(f"Story submitted by user {current_user.id}: {title}")
        except Exception as e:
            current_app.logger.warning(f"Failed to log activity: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Story submitted successfully! It will be reviewed by our team.',
            'submission': submission_data
        })
        
    except Exception as e:
        current_app.logger.error(f"Error submitting story: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to submit story'}), 500

@profile_bp.route('/my-submissions', methods=['GET'])
@login_required
def get_my_submissions():
    """Get current user's story submissions"""
    try:
        # Get stories submitted by the current user
        submissions = Story.query.filter_by(
            user_id=current_user.id
        ).order_by(Story.created_at.desc()).all()
        
        # Convert to dict format with stats
        result = []
        for story in submissions:
            submission_dict = {
                'id': story.id,
                'title': story.title,
                'content': story.content,
                'category': story.category,
                'tags': story.tags.split(',') if story.tags else [],
                'status': story.status,
                'submitted_at': story.submitted_at.isoformat() if story.submitted_at else None,
                'created_at': story.created_at.isoformat(),
                'updated_at': story.updated_at.isoformat(),
                'views': story.views,
                'likes': story.likes_count,
                'comments': story.comments_count
            }
            
            result.append(submission_dict)
        
        return jsonify({
            'success': True,
            'submissions': result
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting submissions: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load submissions'}), 500

@profile_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get available story categories"""
    categories = [
        {'value': 'adventure', 'label': 'Adventure'},
        {'value': 'culture', 'label': 'Culture'},
        {'value': 'food', 'label': 'Food'},
        {'value': 'nature', 'label': 'Nature'},
        {'value': 'history', 'label': 'History'},
        {'value': 'photography', 'label': 'Photography'},
        {'value': 'city', 'label': 'City Guide'},
        {'value': 'budget', 'label': 'Budget Travel'},
        {'value': 'luxury', 'label': 'Luxury Travel'},
        {'value': 'solo', 'label': 'Solo Travel'}
    ]
    
    return jsonify({
        'success': True,
        'categories': categories
    })