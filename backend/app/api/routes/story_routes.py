from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime
import logging
import os
from werkzeug.utils import secure_filename

from ...models import Story, User, db, Comment, StoryLike
from ...auth.utils import TokenManager

# Story file handling constants and functions (from profile_routes.py)
STORY_MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_story_file(filename):
    """Check if file extension is allowed for story submissions"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_story_video_thumbnail(video_path, output_dir):
    """Generate thumbnail for video file (placeholder implementation)"""
    # This is a placeholder - in a real implementation, you'd use ffmpeg or similar
    # For now, return None to indicate no thumbnail was generated
    current_app.logger.warning(f"Video thumbnail generation not implemented for: {video_path}")
    return None

story_bp = Blueprint('story', __name__)
logger = logging.getLogger(__name__)

# Get all stories
@story_bp.route('/stories', methods=['GET'])
def get_stories():
    """Get all published stories"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        author_id = request.args.get('author_id', type=int)
        language = request.args.get('lang', 'en').strip()  # Default to English
        
        # Validate language parameter
        if language not in ['en', 'it']:
            language = 'en'
        
        logger.info(f"🔍 Stories API - Fetching stories for language: {language}")
        
        # Build query for published stories with language filter
        query = Story.query.filter_by(status='published', language=language)
        
        if search:
            query = query.filter(
                Story.title.ilike(f'%{search}%') | 
                Story.content.ilike(f'%{search}%') |
                Story.tags.ilike(f'%{search}%')
            )
        
        if category:
            query = query.filter(Story.category == category)
        
        if author_id:
            query = query.filter(Story.author_id == author_id)
        
        # Order by creation date (newest first)
        query = query.order_by(Story.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        stories = []
        total = 0
        pages = 0
        
        # If no stories found for requested language and language is not English, fallback to English
        if pagination.total == 0 and language != 'en':
            logger.info(f"🔍 No stories found for language '{language}', falling back to English")
            
            # Build fallback query for English stories
            fallback_query = Story.query.filter_by(status='published', language='en')
            
            if search:
                fallback_query = fallback_query.filter(
                    Story.title.ilike(f'%{search}%') | 
                    Story.content.ilike(f'%{search}%') |
                    Story.tags.ilike(f'%{search}%')
                )
            
            if category:
                fallback_query = fallback_query.filter(Story.category == category)
            
            if author_id:
                fallback_query = fallback_query.filter(Story.author_id == author_id)
            
            fallback_query = fallback_query.order_by(Story.created_at.desc())
            
            # Paginate fallback query
            fallback_pagination = fallback_query.paginate(
                page=page, 
                per_page=per_page, 
                error_out=False
            )
            
            if fallback_pagination.total > 0:
                for story in fallback_pagination.items:
                    story_data = story.to_dict()
                    # Add author info
                    if hasattr(story, 'author') and story.author:
                        story_data['author'] = {
                            'id': story.author.id,
                            'name': story.author.name
                        }
                    stories.append(story_data)
                total = fallback_pagination.total
                pages = fallback_pagination.pages
                logger.info(f"🔍 Fallback successful: Found {total} English stories")
            else:
                logger.info(f"🔍 No English stories found either")
        elif pagination.total > 0:
            # Process stories for the requested language
            for story in pagination.items:
                story_data = story.to_dict()
                # Add author info
                if hasattr(story, 'author') and story.author:
                    story_data['author'] = {
                        'id': story.author.id,
                        'name': story.author.name
                    }
                stories.append(story_data)
            total = pagination.total
            pages = pagination.pages
        
        return jsonify({
            'success': True,
            'data': stories,
            'meta': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': pages
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get stories error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get stories'
        }), 500

# Get story by ID
@story_bp.route('/<int:story_id>', methods=['GET'])
def get_story(story_id):
    """Get story by ID"""
    try:
        story = Story.query.get(story_id)
        if not story:
            return jsonify({
                'success': False,
                'message': 'Story not found'
            }), 404
        
        # Check if user can view this story
        current_user_id = getattr(current_user, 'id', None)
        current_user_obj = User.query.get(current_user_id) if current_user_id else None
        
        # Only show published stories to non-admin users
        if story.status != 'published' and (not current_user_obj or not current_user_obj.is_admin_user()):
            return jsonify({
                'success': False,
                'message': 'Story not found'
            }), 404
        
        story_data = story.to_dict(include_content=True)
        if story.author:
            story_data['author'] = {
                'id': story.author.id,
                'name': story.author.name
            }
        
        # Related stories (same category/tags), exclude current
        related_query = Story.query.filter(Story.id != story.id, Story.status == 'published')
        if story.category:
            related_query = related_query.filter(Story.category == story.category)
        if story.tags:
            for tag in story.tags.split(','):
                t = tag.strip()
                if t:
                    related_query = related_query.filter(Story.tags.ilike(f'%{t}%'))
        related = related_query.order_by(Story.created_at.desc()).limit(6).all()
        related_data = [s.to_dict() for s in related]

        return jsonify({
            'success': True,
            'data': story_data,
            'related': related_data
        }), 200
        
    except Exception as e:
        logger.error(f"Get story error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get story'
        }), 500

# Create story (authenticated users)
@story_bp.route('/stories', methods=['POST'])
@login_required
def create_story():
    """Create a new story with media file support"""
    try:
        current_user_id = current_user.id
        
        # Handle both JSON and form data (like profile/submit)
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['title', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Create story
        tags_value = data.get('tags', '')
        if isinstance(tags_value, list):
            tags_value = ','.join([str(t).strip() for t in tags_value if str(t).strip()])
        
        story = Story(
            title=data['title'].strip(),
            content=data['content'].strip(),
            user_id=current_user_id,
            status=data.get('status', 'published'),  # Admin stories are published by default
            category=data.get('category', 'general'),
            tags=tags_value,
            is_featured=data.get('is_featured', 'false').lower() == 'true',
            language=data.get('language', 'en')
        )
        
        db.session.add(story)
        db.session.commit()
        
        # Handle media files if any (like profile/submit)
        thumbnail_path = None
        media_files_info = []
        uploaded_files = request.files.getlist('media_files')
        thumbnail_files = request.files.getlist('thumbnail_files')
        
        if uploaded_files:
            # Create upload directory for story media
            upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            story_media_dir = os.path.join(upload_root, 'stories', str(story.id))
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
                    filename = f"story_{current_user_id}_{timestamp}_{i}.{file_ext}"
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
                                thumbnail_path = f"stories/{story.id}/{filename}"
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
                                    custom_thumbnail_path = f"stories/{story.id}/{thumb_filename}"
                                    current_app.logger.info(f"Custom thumbnail saved: {thumb_filename}")
                            
                            # Use custom thumbnail or generate one
                            if not thumbnail_path:
                                if custom_thumbnail_path:
                                    thumbnail_path = custom_thumbnail_path
                                else:
                                    thumbnail_path = generate_story_video_thumbnail(file_path, story_media_dir)
                        
                        # Store media file info in JSON format
                        media_info = {
                            'filename': filename,
                            'file_path': f"stories/{story.id}/{filename}",
                            'file_type': file_type,
                            'file_size': file_size,
                            'is_thumbnail': (file_type == 'image' and not thumbnail_path) or (i in thumbnail_map),
                            'original_name': file.filename
                        }
                        
                        if custom_thumbnail_path:
                            media_info['thumbnail_path'] = custom_thumbnail_path
                        
                        media_files_info.append(media_info)
                        
                    except Exception as e:
                        current_app.logger.error(f"Error processing media file {filename}: {str(e)}")
                        continue
        
        # Update story with thumbnail and media files info
        if thumbnail_path:
            story.thumbnail = thumbnail_path
        
        if media_files_info:
            import json
            story.media_files = json.dumps(media_files_info)
        
        db.session.commit()
        
        # Log story creation
        TokenManager.log_security_event(
            current_user_id, 'story_created',
            f'Created story: {story.title} (ID: {story.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Story created successfully',
            'data': story.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create story error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create story'
        }), 500

# Submit story for review (authenticated users)
@story_bp.route('/submit', methods=['POST'])
@login_required
def submit_story():
    """Submit a story for admin review"""
    try:
        current_user_id = current_user.id
        
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['title', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Create story with pending status
        tags_value = data.get('tags', '')
        if isinstance(tags_value, list):
            tags_value = ','.join([str(t).strip() for t in tags_value if str(t).strip()])
        
        story = Story(
            title=data['title'].strip(),
            content=data['content'].strip(),
            user_id=current_user_id,
            status='pending',  # Submitted for review
            category=data.get('category', 'general'),
            tags=tags_value,
            submitted_at=datetime.utcnow()
        )
        
        db.session.add(story)
        db.session.commit()
        
        # Log story submission
        TokenManager.log_security_event(
            current_user_id, 'story_submitted',
            f'Submitted story for review: {story.title} (ID: {story.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Story submitted for review successfully',
            'data': story.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Submit story error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to submit story'
        }), 500

# Get user's story submissions
@story_bp.route('/my-submissions', methods=['GET'])
@login_required
def get_my_submissions():
    """Get current user's story submissions"""
    try:
        current_user_id = current_user.id
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        status = request.args.get('status', '').strip()
        
        # Build query
        query = Story.query.filter_by(user_id=current_user_id)
        
        if status:
            query = query.filter(Story.status == status)
        
        # Order by submission date (newest first)
        query = query.order_by(Story.submitted_at.desc().nullslast(), Story.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        submissions = [story.to_dict() for story in pagination.items]
        
        return jsonify({
            'success': True,
            'submissions': submissions,
            'meta': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get my submissions error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get submissions'
        }), 500

# Update story
@story_bp.route('/<int:story_id>', methods=['PUT'])
@login_required
def update_story(story_id):
    """Update story with media file support"""
    try:
        current_user_id = current_user.id
        
        # Handle both JSON and form data (like profile/submit)
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        story = Story.query.get(story_id)
        if not story:
            return jsonify({
                'success': False,
                'message': 'Story not found'
            }), 404
        
        # Check permissions
        current_user_obj = User.query.get(current_user_id)
        if story.user_id != current_user_id and not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Update fields
        if 'title' in data:
            story.title = data['title'].strip()
        
        if 'content' in data:
            story.content = data['content'].strip()
        
        if 'category' in data:
            story.category = data['category']
        
        if 'tags' in data:
            tags_val = data['tags']
            if isinstance(tags_val, list):
                tags_val = ','.join([str(t).strip() for t in tags_val if str(t).strip()])
            story.tags = tags_val
        
        if 'is_featured' in data:
            story.is_featured = data['is_featured'].lower() == 'true' if isinstance(data['is_featured'], str) else bool(data['is_featured'])
        
        if 'status' in data:
            story.status = data['status']
        
        if 'language' in data:
            story.language = data['language']
        
        story.updated_at = datetime.utcnow()
        
        # Handle media files if any (like profile/submit)
        uploaded_files = request.files.getlist('media_files')
        thumbnail_files = request.files.getlist('thumbnail_files')
        
        if uploaded_files:
            # Remove existing media files (delete physical files)
            if story.media_files:
                try:
                    import json
                    existing_media_info = json.loads(story.media_files)
                    for media_info in existing_media_info:
                        # Delete physical files
                        try:
                            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], media_info['file_path'])
                            if os.path.exists(file_path):
                                os.remove(file_path)
                            if media_info.get('thumbnail_path'):
                                thumb_path = os.path.join(current_app.config['UPLOAD_FOLDER'], media_info['thumbnail_path'])
                                if os.path.exists(thumb_path):
                                    os.remove(thumb_path)
                        except Exception as e:
                            logger.warning(f"Could not delete old media file: {e}")
                except Exception as e:
                    logger.warning(f"Could not parse existing media files: {e}")
            
            # Create upload directory for story media
            upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            story_media_dir = os.path.join(upload_root, 'stories', str(story.id))
            os.makedirs(story_media_dir, exist_ok=True)
            
            # Create a mapping of thumbnail files by index
            thumbnail_map = {}
            for i, thumb_file in enumerate(thumbnail_files):
                if thumb_file and thumb_file.filename:
                    thumbnail_map[i] = thumb_file
            
            # Process all media files (images and videos)
            thumbnail_path = None
            media_files_info = []
            for i, file in enumerate(uploaded_files):
                if file and file.filename and allowed_story_file(file.filename):
                    file_ext = file.filename.rsplit('.', 1)[1].lower()
                    
                    # Generate unique filename
                    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                    filename = f"story_{current_user_id}_{timestamp}_{i}.{file_ext}"
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
                                thumbnail_path = f"stories/{story.id}/{filename}"
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
                                    custom_thumbnail_path = f"stories/{story.id}/{thumb_filename}"
                                    current_app.logger.info(f"Custom thumbnail saved: {thumb_filename}")
                            
                            # Use custom thumbnail or generate one
                            if not thumbnail_path:
                                if custom_thumbnail_path:
                                    thumbnail_path = custom_thumbnail_path
                                else:
                                    thumbnail_path = generate_story_video_thumbnail(file_path, story_media_dir)
                        
                        # Store media file info in JSON format
                        media_info = {
                            'filename': filename,
                            'file_path': f"stories/{story.id}/{filename}",
                            'file_type': file_type,
                            'file_size': file_size,
                            'is_thumbnail': (file_type == 'image' and not thumbnail_path) or (i in thumbnail_map),
                            'original_name': file.filename
                        }
                        
                        if custom_thumbnail_path:
                            media_info['thumbnail_path'] = custom_thumbnail_path
                        
                        media_files_info.append(media_info)
                        
                    except Exception as e:
                        current_app.logger.error(f"Error processing media file {filename}: {str(e)}")
                        continue
            
            # Update story with thumbnail and media files info
            if thumbnail_path:
                story.thumbnail = thumbnail_path
            
            if media_files_info:
                import json
                story.media_files = json.dumps(media_files_info)
        
        db.session.commit()
        
        # Log story update
        TokenManager.log_security_event(
            current_user_id, 'story_updated',
            f'Updated story: {story.title} (ID: {story.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Story updated successfully',
            'data': story.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update story error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update story'
        }), 500

# Delete story
@story_bp.route('/<int:story_id>', methods=['DELETE'])
@login_required
def delete_story(story_id):
    """Delete story"""
    try:
        current_user_id = current_user.id
        
        story = Story.query.get(story_id)
        if not story:
            return jsonify({
                'success': False,
                'message': 'Story not found'
            }), 404
        
        # Check permissions
        current_user_obj = User.query.get(current_user_id)
        if story.user_id != current_user_id and not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Log story deletion
        TokenManager.log_security_event(
            current_user_id, 'story_deleted',
            f'Deleted story: {story.title} (ID: {story.id})'
        )
        
        db.session.delete(story)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Story deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete story error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete story'
        }), 500

# Get user's stories
@story_bp.route('/my-stories', methods=['GET'])
@login_required
def get_my_stories():
    """Get current user's stories"""
    try:
        current_user_id = current_user.id
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        status = request.args.get('status', '').strip()
        
        # Build query
        query = Story.query.filter_by(author_id=current_user_id)
        
        if status:
            query = query.filter(Story.status == status)
        
        # Order by creation date (newest first)
        query = query.order_by(Story.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        stories = [story.to_dict() for story in pagination.items]
        
        return jsonify({
            'success': True,
            'data': stories,
            'meta': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get my stories error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get stories'
        }), 500

# Get story statistics (admin only)
@story_bp.route('/<int:story_id>/publish', methods=['POST'])
@login_required
def publish_story(story_id):
    try:
        current_user_obj = User.query.get(current_user.id)
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        story = Story.query.get(story_id)
        if not story:
            return jsonify({'success': False, 'message': 'Story not found'}), 404
        story.status = 'published'
        story.published_at = datetime.utcnow()
        story.updated_at = datetime.utcnow()
        db.session.commit()
        TokenManager.log_security_event(current_user.id, 'story_published', f'Story ID {story.id}')
        return jsonify({'success': True, 'message': 'Story published', 'data': story.to_dict()}), 200
    except Exception as e:
        logger.error(f"Publish story error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to publish story'}), 500

# Comments: list
@story_bp.route('/<int:story_id>/comments', methods=['GET'])
def get_comments(story_id):
    try:
        story = Story.query.get(story_id)
        if not story:
            return jsonify({'success': False, 'message': 'Story not found'}), 404

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Only top-level comments, include nested replies in payload
        query = Comment.query.filter_by(story_id=story_id, parent_id=None).order_by(Comment.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        data = [c.to_dict(include_replies=True) for c in pagination.items]
        return jsonify({
            'success': True,
            'data': data,
            'meta': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
    except Exception as e:
        logger.error(f"Get comments error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get comments'}), 500

# Comments: create (and reply via optional parent_id)
@story_bp.route('/<int:story_id>/comments', methods=['POST'])
@login_required
def add_comment(story_id):
    try:
        story = Story.query.get(story_id)
        if not story:
            return jsonify({'success': False, 'message': 'Story not found'}), 404
        payload = request.get_json() or {}
        content = (payload.get('content') or '').strip()
        if not content:
            return jsonify({'success': False, 'message': 'Content is required'}), 400
        parent_id = payload.get('parent_id')
        parent_comment = None
        if parent_id is not None:
            parent_comment = Comment.query.filter_by(id=parent_id, story_id=story_id).first()
            if not parent_comment:
                return jsonify({'success': False, 'message': 'Parent comment not found'}), 404

        comment = Comment(
            content=content,
            user_id=current_user.id,
            story_id=story_id,
            parent_id=parent_comment.id if parent_comment else None
        )
        db.session.add(comment)
        story.comments_count = (story.comments_count or 0) + 1
        db.session.commit()
        return jsonify({'success': True, 'data': comment.to_dict(include_replies=True)}), 201
    except Exception as e:
        logger.error(f"Add comment error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to add comment'}), 500

# Like a story
@story_bp.route('/<int:story_id>/like', methods=['POST'])
@login_required
def like_story(story_id):
    try:
        story = Story.query.get(story_id)
        if not story:
            return jsonify({'success': False, 'message': 'Story not found'}), 404
        existing = StoryLike.query.filter_by(user_id=current_user.id, story_id=story_id).first()
        if existing:
            return jsonify({'success': True, 'liked': True, 'likes_count': story.likes_count}), 200
        like = StoryLike(user_id=current_user.id, story_id=story_id)
        db.session.add(like)
        story.likes_count = (story.likes_count or 0) + 1
        db.session.commit()
        return jsonify({'success': True, 'liked': True, 'likes_count': story.likes_count}), 200
    except Exception as e:
        logger.error(f"Like story error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to like story'}), 500

# Unlike a story
@story_bp.route('/<int:story_id>/unlike', methods=['DELETE'])
@login_required
def unlike_story(story_id):
    try:
        story = Story.query.get(story_id)
        if not story:
            return jsonify({'success': False, 'message': 'Story not found'}), 404
        existing = StoryLike.query.filter_by(user_id=current_user.id, story_id=story_id).first()
        if not existing:
            return jsonify({'success': True, 'liked': False, 'likes_count': story.likes_count or 0}), 200
        db.session.delete(existing)
        story.likes_count = max(0, (story.likes_count or 0) - 1)
        db.session.commit()
        return jsonify({'success': True, 'liked': False, 'likes_count': story.likes_count}), 200
    except Exception as e:
        logger.error(f"Unlike story error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to unlike story'}), 500

@story_bp.route('/statistics', methods=['GET'])
@login_required
def get_story_statistics():
    """Get story statistics (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Calculate statistics
        total_stories = Story.query.count()
        published_stories = Story.query.filter_by(status='published').count()
        draft_stories = Story.query.filter_by(status='draft').count()
        archived_stories = Story.query.filter_by(status='archived').count()
        featured_stories = Story.query.filter_by(featured=True).count()
        
        # Recent stories (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_stories = Story.query.filter(
            Story.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_stories': total_stories,
                'published_stories': published_stories,
                'draft_stories': draft_stories,
                'archived_stories': archived_stories,
                'featured_stories': featured_stories,
                'recent_stories': recent_stories
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get story statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get story statistics'
        }), 500 