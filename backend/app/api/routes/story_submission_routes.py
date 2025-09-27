"""
Story submission API routes for user story submissions
"""
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
import os
import json
import uuid
from datetime import datetime

from ...extensions import db
from ...models_extended import UserStorySubmission, StoryMediaFile
from ...utils.notification_helper import NotificationManager

# Create blueprint
story_submission_bp = Blueprint('story_submission', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@story_submission_bp.route('/submit', methods=['POST'])
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
        
        # Create submission
        submission = UserStorySubmission(
            user_id=current_user.id,
            title=title,
            content=content,
            location=location,
            category=category,
            tags=json.dumps(tag_list),
            terms_accepted=terms_accepted
        )
        
        db.session.add(submission)
        db.session.flush()  # Get submission ID
        
        # Handle file uploads
        media_files = []
        uploaded_files = request.files.getlist('media_files')
        
        if uploaded_files:
            # Create upload directory
            upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'story_submissions')
            os.makedirs(upload_dir, exist_ok=True)
            
            for file in uploaded_files:
                if file and file.filename and allowed_file(file.filename):
                    # Generate unique filename
                    file_ext = file.filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
                    file_path = os.path.join(upload_dir, unique_filename)
                    
                    # Check file size
                    file.seek(0, os.SEEK_END)
                    file_size = file.tell()
                    file.seek(0)
                    
                    if file_size > MAX_FILE_SIZE:
                        continue  # Skip large files
                    
                    try:
                        file.save(file_path)
                        
                        # Determine file type
                        file_type = 'image' if file_ext.lower() in ['png', 'jpg', 'jpeg', 'gif', 'webp'] else 'video'
                        
                        # Create media record
                        media_file = StoryMediaFile(
                            submission_id=submission.id,
                            filename=unique_filename,
                            original_filename=secure_filename(file.filename),
                            file_path=file_path,
                            file_type=file_type,
                            file_size=file_size,
                            mime_type=file.content_type or 'application/octet-stream',
                            order_index=len(media_files)
                        )
                        
                        db.session.add(media_file)
                        media_files.append(media_file.to_dict())
                        
                    except Exception as e:
                        current_app.logger.error(f"Error saving file: {str(e)}")
                        continue
        
        # Update submission with media files info
        submission.media_files = json.dumps([mf['filename'] for mf in media_files])
        db.session.commit()
        
        # Log activity
        try:
            NotificationManager.log_activity(
                user_id=current_user.id,
                action='story_submitted',
                description=f'Submitted story "{title}" for review',
                entity_type='story_submission',
                entity_id=str(submission.id)
            )
        except Exception as e:
            current_app.logger.warning(f"Failed to log activity: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Story submitted successfully! It will be reviewed by our team.',
            'submission': submission.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error submitting story: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to submit story'}), 500

@story_submission_bp.route('/my-submissions', methods=['GET'])
@login_required
def get_my_submissions():
    """Get current user's story submissions"""
    try:
        submissions = UserStorySubmission.query.filter_by(
            user_id=current_user.id
        ).order_by(UserStorySubmission.created_at.desc()).all()
        
        # Add stats for approved stories
        result = []
        for submission in submissions:
            submission_dict = submission.to_dict()
            
            # Add mock stats since we don't have the published story system yet
            submission_dict.update({
                'views': 245 if submission.status == 'approved' else 0,
                'likes': 32 if submission.status == 'approved' else 0,
                'comments': 8 if submission.status == 'approved' else 0
            })
            
            result.append(submission_dict)
        
        return jsonify({
            'success': True,
            'submissions': result
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting submissions: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load submissions'}), 500

@story_submission_bp.route('/categories', methods=['GET'])
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