from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging
import os
import subprocess
import json
from werkzeug.utils import secure_filename

from ...models import User, Story, GalleryItem, Tour, SecurityLog, db
from ...models_gallery_extended import GalleryAlbum, AlbumView, AlbumLike
from ...models_book import Book, Author
from ...models_page_content import PageContent
from ...models_i18n import Language, Translation, TranslationTemplate
from ...auth.utils import TokenManager

admin_bp = Blueprint('admin', __name__)
logger = logging.getLogger(__name__)

def generate_video_thumbnail(video_path, output_dir):
    """
    Generate a thumbnail for a video file using ffmpeg
    Returns the relative path to the thumbnail file
    """
    try:
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
            return f'uploads/gallery/{thumbnail_filename}'
        else:
            logger.error(f"FFmpeg failed: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg timeout - video might be corrupted")
        return None
    except Exception as e:
        logger.error(f"Video thumbnail generation failed: {e}")
        return None

# Get admin dashboard data
@admin_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
    """Get admin dashboard data"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get basic statistics
        total_users = User.query.count()
        total_stories = Story.query.count()
        total_gallery_items = GalleryItem.query.count()
        total_tours = Tour.query.count()
        
        # Get recent activity
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_users = User.query.filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        recent_stories = Story.query.filter(
            Story.created_at >= thirty_days_ago
        ).count()
        
        recent_gallery_items = GalleryItem.query.filter(
            GalleryItem.created_at >= thirty_days_ago
        ).count()
        
        recent_tours = Tour.query.filter(
            Tour.created_at >= thirty_days_ago
        ).count()
        
        # Get recent security events
        recent_security_events = SecurityLog.query.filter(
            SecurityLog.timestamp >= thirty_days_ago
        ).order_by(SecurityLog.timestamp.desc()).limit(10).all()
        
        security_events = []
        for event in recent_security_events:
            security_events.append({
                'id': event.id,
                'event_type': event.event_type,
                'ip_address': event.ip_address,
                'details': event.details,
                'timestamp': event.timestamp.isoformat()
            })
        
        return jsonify({
            'success': True,
            'dashboard': {
                'statistics': {
                    'total_users': total_users,
                    'total_stories': total_stories,
                    'total_gallery_items': total_gallery_items,
                    'total_tours': total_tours,
                    'recent_users': recent_users,
                    'recent_stories': recent_stories,
                    'recent_gallery_items': recent_gallery_items,
                    'recent_tours': recent_tours
                },
                'recent_security_events': security_events
            }
        }), 200
    except Exception as e:
        logger.error(f"Get dashboard error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get dashboard data'
        }), 500
# Simple admin lists used by frontend panels
@admin_bp.route('/stories', methods=['GET'])
@login_required
def admin_list_stories():
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        q = Story.query.order_by(Story.created_at.desc())
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)
        items = [s.to_dict() for s in pagination.items]
        return jsonify({
            'success': True,
            'data': items,
            'meta': {
                'total': pagination.total,
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin list stories error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to list stories'}), 500

# Get single story (admin)
@admin_bp.route('/stories/<int:story_id>', methods=['GET'])
@login_required
def admin_get_story(story_id):
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        story = Story.query.get(story_id)
        if not story:
            return jsonify({'success': False, 'message': 'Story not found'}), 404
        return jsonify({'success': True, 'data': story.to_dict(include_content=True)}), 200
    except Exception as e:
        logger.error(f"Admin get story error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch story'}), 500

# =============================================================================
# 📝 STORY MODERATION - ADMIN ONLY
# =============================================================================

# Get story submissions for moderation (admin only)
@admin_bp.route('/stories/submissions', methods=['GET'])
@login_required
def admin_get_story_submissions():
    """Get all story submissions for moderation (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status', '').strip()
        search = request.args.get('search', '').strip()
        
        # Build query
        query = Story.query
        
        # Filter by status
        if status and status != 'all':
            query = query.filter(Story.status == status)
        
        # Search filter
        if search:
            query = query.filter(
                Story.title.ilike(f'%{search}%') | 
                Story.content.ilike(f'%{search}%') |
                Story.tags.ilike(f'%{search}%')
            )
        
        # Order by submission date (newest first)
        query = query.order_by(Story.submitted_at.desc().nullslast(), Story.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        submissions = [story.to_dict(include_content=True) for story in pagination.items]
        
        return jsonify({
            'success': True,
            'data': submissions,
            'meta': {
                'total': pagination.total,
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin get story submissions error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get story submissions'
        }), 500

# Get submission statistics (admin only)
@admin_bp.route('/stories/submissions/stats', methods=['GET'])
@login_required
def admin_get_submission_stats():
    """Get story submission statistics (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        # Calculate statistics
        total_submissions = Story.query.count()
        pending_submissions = Story.query.filter_by(status='pending').count()
        published_submissions = Story.query.filter_by(status='published').count()
        rejected_submissions = Story.query.filter_by(status='rejected').count()
        
        # Recent submissions (last 7 days)
        from datetime import timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_submissions = Story.query.filter(
            Story.submitted_at >= seven_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total_submissions,
                'pending': pending_submissions,
                'published': published_submissions,
                'rejected': rejected_submissions,
                'recent_week': recent_submissions
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin get submission stats error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get submission statistics'
        }), 500

# Approve story submission (admin only)
@admin_bp.route('/stories/submissions/<int:story_id>/approve', methods=['POST'])
@login_required
def admin_approve_story(story_id):
    """Approve a story submission (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        story = Story.query.get(story_id)
        if not story:
            return jsonify({
                'success': False,
                'message': 'Story not found'
            }), 404

        data = request.get_json() or {}
        
        # Update story status
        story.status = 'published'
        story.reviewed_at = datetime.utcnow()
        story.reviewed_by = current_user.id
        story.published_at = datetime.utcnow()
        story.admin_notes = data.get('admin_notes', '')
        story.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log approval
        TokenManager.log_security_event(
            current_user.id, 'story_approved',
            f'Approved story: {story.title} (ID: {story.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Story approved and published successfully',
            'data': story.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Admin approve story error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to approve story'
        }), 500

# Reject story submission (admin only)
@admin_bp.route('/stories/submissions/<int:story_id>/reject', methods=['POST'])
@login_required
def admin_reject_story(story_id):
    """Reject a story submission (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        story = Story.query.get(story_id)
        if not story:
            return jsonify({
                'success': False,
                'message': 'Story not found'
            }), 404

        data = request.get_json() or {}
        rejection_reason = data.get('rejection_reason', '').strip()
        
        if not rejection_reason:
            return jsonify({
                'success': False,
                'message': 'Rejection reason is required'
            }), 400
        
        # Update story status
        story.status = 'rejected'
        story.reviewed_at = datetime.utcnow()
        story.reviewed_by = current_user.id
        story.rejection_reason = rejection_reason
        story.admin_notes = data.get('admin_notes', '')
        story.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log rejection
        TokenManager.log_security_event(
            current_user.id, 'story_rejected',
            f'Rejected story: {story.title} (ID: {story.id}) - Reason: {rejection_reason}'
        )
        
        return jsonify({
            'success': True,
            'message': 'Story rejected successfully',
            'data': story.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Admin reject story error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to reject story'
        }), 500

@admin_bp.route('/gallery', methods=['GET'])
@login_required
def admin_list_gallery():
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        q = GalleryItem.query.order_by(GalleryItem.created_at.desc())
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)
        items = [g.to_dict() for g in pagination.items]
        return jsonify({
            'success': True,
            'data': items,
            'meta': {
                'total': pagination.total,
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin list gallery error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to list gallery'}), 500

# =============================================================================
# 🎨 GALLERY UPLOAD ENDPOINT - ADMIN ONLY
# =============================================================================
@admin_bp.route('/gallery/upload', methods=['POST', 'OPTIONS'])
@login_required
def admin_upload_gallery():
    """
    🚀 Enhanced Gallery Media Upload (Admin Only)
    
    Features:
    - ✅ CORS preflight support
    - ✅ Comprehensive file validation
    - ✅ Secure filename handling
    - ✅ Duplicate file management
    - ✅ Detailed logging & error handling
    - ✅ Database transaction safety
    """
    
    # 🌐 Handle CORS preflight requests
    if request.method == 'OPTIONS':
        logger.info("🌐 CORS preflight request for gallery upload")
        return '', 200
    
    # 📝 Log request details
    logger.info(f"🎯 Gallery upload initiated by user: {current_user.id}")
    logger.info(f"📡 Request method: {request.method}")
    logger.info(f"🔗 Request URL: {request.url}")
    
    try:
        # 🔐 Verify admin access
        current_user_obj = User.query.get(current_user.id)
        if not current_user_obj or not current_user_obj.is_admin_user():
            logger.warning(f"❌ Access denied for user {current_user.id}")
            return jsonify({
                'success': False,
                'message': 'Admin access required',
                'code': 'ACCESS_DENIED'
            }), 403

        # 📁 Extract file from request
        file = request.files.get('file')
        logger.info(f"📁 File received: {file.filename if file else 'None'}")
        logger.info(f"📋 Available files: {list(request.files.keys())}")
        logger.info(f"📝 Form data: {dict(request.form)}")
        
        # ✅ Validate file presence
        if not file or file.filename == '':
            logger.warning("❌ No file provided in request")
            return jsonify({
                'success': False,
                'message': 'No file provided',
                'code': 'NO_FILE'
            }), 400

        # 🛡️ Validate file type and extension
        ALLOWED_EXTENSIONS = {
            'images': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'},
            'videos': {'mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv'},
            'documents': {'pdf', 'doc', 'docx', 'txt'}
        }
        
        if '.' not in file.filename:
            logger.warning(f"❌ Invalid file: {file.filename}")
            return jsonify({
                'success': False,
                'message': 'Invalid file format',
                'code': 'INVALID_FORMAT'
            }), 400
            
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        all_allowed = ALLOWED_EXTENSIONS['images'] | ALLOWED_EXTENSIONS['videos'] | ALLOWED_EXTENSIONS['documents']
        
        if file_ext not in all_allowed:
            logger.warning(f"❌ Unsupported file type: {file_ext}")
            return jsonify({
                'success': False,
                'message': f'File type .{file_ext} not supported',
                'code': 'UNSUPPORTED_TYPE',
                'allowed_types': list(all_allowed)
            }), 400

        # 📝 Extract form metadata
        metadata = {
            'title': request.form.get('title', file.filename).strip(),
            'description': request.form.get('description', '').strip(),
            'category': request.form.get('category', 'general').strip(),
            'tags': request.form.get('tags', '').strip(),
            'is_featured': request.form.get('is_featured', 'false').lower() == 'true',
            'album_id': request.form.get('album_id')
        }
        
        logger.info(f"📝 Metadata: {metadata}")

        # 🗂️ Setup upload directory structure
        upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        gallery_dir = os.path.join(upload_root, 'gallery')
        os.makedirs(gallery_dir, exist_ok=True)
        logger.info(f"📂 Upload directory: {gallery_dir}")

        # 🔒 Generate secure filename with timestamp
        original_filename = secure_filename(file.filename)
        base_name, ext = os.path.splitext(original_filename)
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"{base_name}_{timestamp}{ext}"
        file_path = os.path.join(gallery_dir, filename)
        
        # 🔄 Handle potential filename conflicts
        counter = 1
        while os.path.exists(file_path):
            filename = f"{base_name}_{timestamp}_{counter}{ext}"
            file_path = os.path.join(gallery_dir, filename)
            counter += 1

        # 💾 Save file to filesystem
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        logger.info(f"💾 File saved: {filename} ({file_size} bytes)")

        # 🏷️ Determine file type category
        if file_ext in ALLOWED_EXTENSIONS['images']:
            file_type = 'image'
        elif file_ext in ALLOWED_EXTENSIONS['videos']:
            file_type = 'video'
        else:
            file_type = 'document'

        # 🎬 Generate video thumbnail if it's a video
        thumbnail_path = None
        if file_type == 'video':
            try:
                thumbnail_path = generate_video_thumbnail(file_path, gallery_dir)
                logger.info(f"🎬 Video thumbnail generated: {thumbnail_path}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to generate video thumbnail: {e}")
                thumbnail_path = None

        # 🗄️ Create database record
        # Handle tags conversion
        tags = metadata['tags']
        if isinstance(tags, list):
            tags = ', '.join(tags)
        
        gallery_item = GalleryItem(
            title=metadata['title'],
            description=metadata['description'],
            file_path=f'uploads/gallery/{filename}',
            file_name=filename,
            file_size=file_size,
            file_type=file_type,
            mime_type=file.content_type,
            thumbnail=thumbnail_path,
            category=metadata['category'],
            tags=tags,
            photographer=metadata.get('photographer'),
            location=metadata.get('location'),
            user_id=current_user.id,
            status='active',
            album_id=metadata['album_id'] if metadata['album_id'] else None
        )

        db.session.add(gallery_item)
        db.session.commit()

        # 🎉 Success logging
        logger.info(f"✅ Gallery item created successfully: {gallery_item.id}")
        logger.info(f"📊 Item details: {gallery_item.title} | {gallery_item.file_type} | {gallery_item.category}")

        # 📤 Return success response
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'data': gallery_item.to_dict()
        }), 201

    except Exception as e:
        # 🚨 Error handling and logging
        logger.error(f"💥 Gallery upload error: {str(e)}")
        logger.error(f"🔍 Error type: {type(e).__name__}")
        db.session.rollback()
        
        return jsonify({
            'success': False,
            'message': 'Upload failed due to server error',
            'code': 'UPLOAD_ERROR',
            'error': str(e) if current_app.debug else 'Internal server error'
        }), 500

# =============================================================================
# 🎨 PUBLIC GALLERY ENDPOINTS - NO AUTH REQUIRED
# =============================================================================

# Public gallery list (no auth required)
@admin_bp.route('/public/gallery', methods=['GET'])
def public_list_gallery():
    """Get gallery items for public viewing (no auth required)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        
        # Build query
        q = GalleryItem.query.filter(GalleryItem.status == 'active')
        
        # Apply filters
        if category and category != 'all':
            q = q.filter(GalleryItem.category == category)
        
        if search:
            q = q.filter(
                db.or_(
                    GalleryItem.title.contains(search),
                    GalleryItem.description.contains(search),
                    GalleryItem.tags.contains(search)
                )
            )
        
        # Order by creation date
        q = q.order_by(GalleryItem.created_at.desc())
        
        # Paginate
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)
        items = []
        for g in pagination.items:
            item_dict = g.to_dict()
            print(f"🔍 Public gallery item {g.id}:")
            print(f"  📁 file_path: {g.file_path}")
            print(f"  🔗 file_url: {item_dict.get('file_url')}")
            items.append(item_dict)
        
        return jsonify({
            'success': True,
            'data': items,
            'meta': {
                'total': pagination.total,
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page
            }
        }), 200
    except Exception as e:
        logger.error(f"Public gallery list error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load gallery'}), 500

# Public gallery categories (no auth required)
@admin_bp.route('/public/gallery/categories', methods=['GET'])
def public_get_gallery_categories():
    """Get available gallery categories (no auth required)"""
    try:
        # Get unique categories from active gallery items
        categories = db.session.query(GalleryItem.category).filter(
            GalleryItem.status == 'active'
        ).distinct().all()
        
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return jsonify({
            'success': True,
            'data': category_list
        }), 200
    except Exception as e:
        logger.error(f"Public gallery categories error: {str(e)}")
        return jsonify({
            'success': True,
            'data': ['general', 'facilities', 'grooming', 'training', 'events']
        }), 200

# Public gallery item view (no auth required)
@admin_bp.route('/public/gallery/<int:item_id>', methods=['GET'])
def public_get_gallery_item(item_id):
    """Get a single gallery item for public viewing (no auth required)"""
    try:
        item = GalleryItem.query.filter(
            GalleryItem.id == item_id,
            GalleryItem.status == 'active'
        ).first()
        
        if not item:
            return jsonify({
                'success': False,
                'message': 'Gallery item not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': item.to_dict()
        }), 200
    except Exception as e:
        logger.error(f"Public gallery item error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load gallery item'}), 500

# Public gallery item like (no auth required)
@admin_bp.route('/public/gallery/<int:item_id>/like', methods=['POST'])
def public_toggle_gallery_like(item_id):
    """Toggle like for gallery item (no auth required) - uses IP-based tracking with database"""
    try:
        from ...models import GalleryLike
        
        item = GalleryItem.query.filter(
            GalleryItem.id == item_id,
            GalleryItem.status == 'active'
        ).first()
        
        if not item:
            return jsonify({
                'success': False,
                'message': 'Gallery item not found'
            }), 404
        
        # Get client IP for tracking
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        
        # Check if this IP has already liked this item
        try:
            existing_like = GalleryLike.query.filter(
                GalleryLike.gallery_item_id == item_id,
                GalleryLike.ip_address == client_ip
            ).first()
        except Exception as db_error:
            logger.warning(f"Database schema issue: {db_error}")
            # Fallback: Simple increment without tracking
            item.likes = (item.likes or 0) + 1
            db.session.commit()
            
            logger.info(f"Gallery item {item_id} liked by IP {client_ip} (fallback mode)")
            
            return jsonify({
                'success': True,
                'message': 'Like added (fallback mode)',
                'data': {'likes': item.likes, 'liked': True}
            }), 200
        
        if existing_like:
            # Unlike: Remove the like
            db.session.delete(existing_like)
            item.likes = max(0, (item.likes or 0) - 1)  # Ensure likes don't go below 0
            db.session.commit()
            
            logger.info(f"Gallery item {item_id} unliked by IP {client_ip}")
            
            return jsonify({
                'success': True,
                'message': 'Like removed',
                'data': {'likes': item.likes, 'liked': False}
            }), 200
        else:
            # Like: Add the like
            new_like = GalleryLike(
                gallery_item_id=item_id,
                ip_address=client_ip,
                user_id=None  # Anonymous user
            )
            db.session.add(new_like)
            item.likes = (item.likes or 0) + 1
            db.session.commit()
            
            logger.info(f"Gallery item {item_id} liked by IP {client_ip}")
            
            return jsonify({
                'success': True,
                'message': 'Like added',
                'data': {'likes': item.likes, 'liked': True}
            }), 200
            
    except Exception as e:
        logger.error(f"Public gallery like error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to update like'}), 500

# Public gallery item like status check (no auth required)
@admin_bp.route('/public/gallery/<int:item_id>/like-status', methods=['GET'])
def public_get_gallery_like_status(item_id):
    """Check if gallery item is liked by current IP (no auth required)"""
    try:
        from ...models import GalleryLike
        
        # Get client IP for tracking
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
        
        # Check if this IP has liked this item
        try:
            existing_like = GalleryLike.query.filter(
                GalleryLike.gallery_item_id == item_id,
                GalleryLike.ip_address == client_ip
            ).first()
        except Exception as db_error:
            logger.warning(f"Database schema issue in like status: {db_error}")
            # Fallback: Return false (not liked) since we can't track
            return jsonify({
                'success': True,
                'data': {'liked': False}
            }), 200
        
        return jsonify({
            'success': True,
            'data': {'liked': existing_like is not None}
        }), 200
        
    except Exception as e:
        logger.error(f"Public gallery like status error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to check like status'}), 500

# Public gallery item view increment (no auth required)
@admin_bp.route('/public/gallery/<int:item_id>/view', methods=['POST'])
def public_increment_gallery_view(item_id):
    """Increment view count for gallery item (no auth required)"""
    try:
        item = GalleryItem.query.filter(
            GalleryItem.id == item_id,
            GalleryItem.status == 'active'
        ).first()
        
        if not item:
            return jsonify({
                'success': False,
                'message': 'Gallery item not found'
            }), 404
        
        # Increment views
        item.views = (item.views or 0) + 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'View count updated',
            'data': {'views': item.views}
        }), 200
    except Exception as e:
        logger.error(f"Public gallery view error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update view count'}), 500

# Get homepage featured gallery items (public)
@admin_bp.route('/public/gallery/homepage-featured', methods=['GET'])
def public_get_homepage_featured():
    """Get homepage featured gallery items (no auth required)"""
    try:
        # Get featured items, limit to 8 for homepage
        items = GalleryItem.query.filter(
            GalleryItem.status == 'active',
            GalleryItem.homepage_featured == True
        ).order_by(GalleryItem.created_at.desc()).limit(8).all()
        
        # Convert to dict format similar to HomePage galleryMedia
        featured_items = []
        for item in items:
            # Get the full item data using to_dict() method
            item_dict = item.to_dict()
            
            # Parse tags
            tags = item.tags.split(',') if item.tags else []
            
            # Format duration for videos
            duration = None
            if item.file_type == 'video' and item.duration:
                minutes = item.duration // 60
                seconds = item.duration % 60
                duration = f"{minutes}:{seconds:02d}"
            
            featured_items.append({
                'id': item.id,
                'type': item.file_type,
                'src': item_dict['file_url'],  # Use file_url from to_dict()
                'thumb': item_dict['thumbnail_url'] or item_dict['file_url'],  # Use thumbnail_url from to_dict()
                'alt': item.title,
                'title': item.title,
                'category': item.category.title(),
                'photographer': item.photographer or 'Unknown',
                'description': item.description or '',
                'duration': duration
            })
        
        return jsonify({
            'success': True,
            'data': featured_items,
            'count': len(featured_items)
        }), 200
        
    except Exception as e:
        logger.error(f"Public homepage featured error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get featured items'}), 500

# =============================================================================
# 🎨 GALLERY CRUD OPERATIONS - ADMIN ONLY
# =============================================================================

# Create gallery item from JSON (admin only)
@admin_bp.route('/gallery', methods=['POST'])
@login_required
def admin_create_gallery_item():
    """Create a new gallery item from JSON data (admin only)"""
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
        required_fields = ['title', 'file_path', 'file_name', 'file_size', 'file_type', 'mime_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.replace("_", " ").title()} is required'
                }), 400
        
        # Create gallery item
        tags_val = data.get('tags', [])
        if isinstance(tags_val, list):
            tags_val = ','.join([str(t).strip() for t in tags_val if str(t).strip()])
            
        gallery_item = GalleryItem(
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            file_path=data['file_path'].strip(),
            file_name=data['file_name'].strip(),
            file_size=int(data['file_size']),
            file_type=data['file_type'].strip(),
            mime_type=data['mime_type'].strip(),
            thumbnail=data.get('thumbnail'),
            category=data.get('category', 'general'),
            tags=tags_val,
            status=data.get('status', 'active'),
            location=data.get('location'),
            photographer=data.get('photographer'),
            user_id=current_user_id
        )
        
        db.session.add(gallery_item)
        db.session.commit()
        
        # Log gallery item creation
        TokenManager.log_security_event(
            current_user_id, 'gallery_item_created',
            f'Created gallery item: {gallery_item.title} (ID: {gallery_item.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Gallery item created successfully',
            'data': gallery_item.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Admin create gallery item error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create gallery item'
        }), 500

# Get gallery statistics (admin only)
@admin_bp.route('/gallery/statistics', methods=['GET'])
@login_required
def admin_get_gallery_statistics():
    """Get gallery statistics (admin only)"""
    try:
        current_user_id = current_user.id
        current_user_obj = User.query.get(current_user_id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Calculate statistics
        total_items = GalleryItem.query.count()
        active_items = GalleryItem.query.filter_by(status='active').count()
        inactive_items = GalleryItem.query.filter(GalleryItem.status != 'active').count()
        featured_items = 0
        
        # Recent items (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_items = GalleryItem.query.filter(
            GalleryItem.created_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_items': total_items,
                'active_items': active_items,
                'inactive_items': inactive_items,
                'featured_items': featured_items,
                'recent_items': recent_items
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Admin get gallery statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get gallery statistics'
        }), 500

# Delete gallery item (admin only)
@admin_bp.route('/gallery/<int:item_id>', methods=['DELETE'])
@login_required  
def admin_delete_gallery_item(item_id):
    """Delete gallery item (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        item = GalleryItem.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found'
            }), 404

        # Delete file from filesystem
        if item.file_path:
            file_path = os.path.join(current_app.root_path, item.file_path.lstrip('/'))
            if os.path.exists(file_path):
                os.remove(file_path)

        # Delete from database
        db.session.delete(item)
        db.session.commit()

        logger.info(f"Gallery item deleted: {item_id} by user {current_user.id}")

        return jsonify({
            'success': True,
            'message': 'Item deleted successfully'
        })

    except Exception as e:
        logger.error(f"Gallery delete error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Delete failed'
        }), 500

# Update gallery item (admin only)
@admin_bp.route('/gallery/<int:item_id>', methods=['PUT'])
@login_required
def admin_update_gallery_item(item_id):
    """Update gallery item (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        item = GalleryItem.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found'
            }), 404

        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            item.title = data['title']
        if 'description' in data:
            item.description = data['description']
        if 'category' in data:
            item.category = data['category']
        if 'tags' in data:
            # Convert tags to string if it's a list
            if isinstance(data['tags'], list):
                item.tags = ', '.join(data['tags'])
            else:
                item.tags = data['tags']
        if 'photographer' in data:
            item.photographer = data['photographer']
        if 'location' in data:
            item.location = data['location']
        if 'homepage_featured' in data:
            item.homepage_featured = data['homepage_featured']
        if 'status' in data:
            item.status = data['status']

        item.updated_at = datetime.utcnow()
        
        db.session.commit()

        logger.info(f"Gallery item updated: {item_id} by user {current_user.id}")

        return jsonify({
            'success': True,
            'message': 'Item updated successfully',
            'data': {
                'id': item.id,
                'title': item.title,
                'description': item.description,
                'category': item.category,
                'tags': item.tags,
                'photographer': item.photographer,
                'location': item.location,
                'homepage_featured': item.homepage_featured,
                'status': item.status
            }
        })

    except Exception as e:
        logger.error(f"Gallery update error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Update failed'
        }), 500

# Toggle homepage featured status (admin only)
@admin_bp.route('/gallery/<int:item_id>/toggle-homepage', methods=['POST'])
@login_required
def admin_toggle_homepage_featured(item_id):
    """Toggle homepage featured status for gallery item (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        item = GalleryItem.query.get(item_id)
        if not item:
            return jsonify({
                'success': False,
                'message': 'Item not found'
            }), 404
        
        # Toggle the homepage_featured status
        item.homepage_featured = not item.homepage_featured
        item.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        logger.info(f"Gallery item homepage featured toggled: {item_id} by user {current_user.id} - Status: {item.homepage_featured}")
        
        return jsonify({
            'success': True,
            'message': f'Gallery item {"featured on" if item.homepage_featured else "removed from"} homepage',
            'data': {
                'id': item.id,
                'homepage_featured': item.homepage_featured
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Toggle homepage featured error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to toggle homepage featured status'
        }), 500

# =============================================================================
# 🎨 ALBUM MANAGEMENT - ADMIN ONLY
# =============================================================================

# Get albums (admin only)
@admin_bp.route('/albums', methods=['GET'])
@login_required
def admin_get_albums():
    """Get gallery albums (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        
        # Build query
        q = GalleryAlbum.query
        
        # Apply filters
        if category and category != 'all':
            q = q.filter(GalleryAlbum.category == category)
        
        if search:
            q = q.filter(
                db.or_(
                    GalleryAlbum.title.contains(search),
                    GalleryAlbum.description.contains(search)
                )
            )
        
        # Order by creation date
        q = q.order_by(GalleryAlbum.created_at.desc())
        
        # Paginate
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)
        albums = [album.to_dict() for album in pagination.items]
        
        return jsonify({
            'success': True,
            'data': albums,
            'meta': {
                'total': pagination.total,
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin get albums error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get albums'
        }), 500

# Create album (admin only)
@admin_bp.route('/albums', methods=['POST'])
@login_required
def admin_create_album():
    """Create a new gallery album (admin only)"""
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
        if not data.get('title'):
            return jsonify({
                'success': False,
                'message': 'Album title is required'
            }), 400
        
        # Create album
        album = GalleryAlbum(
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            album_type=data.get('album_type', 'mixed'),
            category=data.get('category', 'general'),
            tags=data.get('tags', ''),
            is_featured=data.get('is_featured', False),
            status=data.get('status', 'active'),
            user_id=current_user_id
        )
        
        db.session.add(album)
        db.session.commit()
        
        # Log album creation
        TokenManager.log_security_event(
            current_user_id, 'album_created',
            f'Created album: {album.title} (ID: {album.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Album created successfully',
            'data': album.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Admin create album error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create album'
        }), 500

# Update album (admin only)
@admin_bp.route('/albums/<int:album_id>', methods=['PUT'])
@login_required
def admin_update_album(album_id):
    """Update album (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        album = GalleryAlbum.query.get_or_404(album_id)
        data = request.get_json()
        
        # Update fields
        updatable_fields = ['title', 'description', 'category', 'tags', 'is_featured', 'status']
        for field in updatable_fields:
            if field in data:
                setattr(album, field, data[field])
        
        album.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Album updated successfully',
            'data': album.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Admin update album error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update album'
        }), 500

# Delete album (admin only)
@admin_bp.route('/albums/<int:album_id>', methods=['DELETE'])
@login_required
def admin_delete_album(album_id):
    """Delete album (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        album = GalleryAlbum.query.get_or_404(album_id)
        
        # Delete all items in the album
        GalleryItem.query.filter_by(album_id=album_id).delete()
        
        # Delete album views and likes
        AlbumView.query.filter_by(album_id=album_id).delete()
        AlbumLike.query.filter_by(album_id=album_id).delete()
        
        # Delete album
        db.session.delete(album)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Album deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Admin delete album error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete album'
        }), 500

# Add item to album (admin only)
@admin_bp.route('/albums/<int:album_id>/items', methods=['POST'])
@login_required
def admin_add_item_to_album(album_id):
    """Add item to album (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        album = GalleryAlbum.query.get_or_404(album_id)
        data = request.get_json()
        
        item_id = data.get('item_id')
        if not item_id:
            return jsonify({
                'success': False,
                'message': 'Item ID is required'
            }), 400
        
        item = GalleryItem.query.get_or_404(item_id)
        
        # Get next order position
        max_order = db.session.query(db.func.max(GalleryItem.album_order))\
                             .filter_by(album_id=album_id).scalar() or 0
        
        item.album_id = album_id
        item.album_order = max_order + 1
        
        # Update album stats
        album.update_stats()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Item added to album successfully'
        })
        
    except Exception as e:
        logger.error(f"Admin add item to album error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to add item to album'
        }), 500

# Remove item from album (admin only)
@admin_bp.route('/albums/<int:album_id>/items/<int:item_id>', methods=['DELETE'])
@login_required
def admin_remove_item_from_album(album_id, item_id):
    """Remove item from album (admin only)"""
    try:
        current_user_obj = User.query.get(current_user.id)
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        album = GalleryAlbum.query.get_or_404(album_id)
        item = GalleryItem.query.get_or_404(item_id)
        
        if item.album_id != album_id:
            return jsonify({
                'success': False,
                'message': 'Item not in this album'
            }), 400
        
        item.album_id = None
        item.album_order = 0
        
        # Update album stats
        album.update_stats()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Item removed from album successfully'
        })
        
    except Exception as e:
        logger.error(f"Admin remove item from album error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to remove item from album'
        }), 500

@admin_bp.route('/tours', methods=['GET'])
@login_required
def admin_list_tours():
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        q = Tour.query.order_by(Tour.created_at.desc())
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)
        
        # For admin list, include both English and Italian fields
        items = []
        for tour in pagination.items:
            tour_data = tour.to_dict(language='en')
            # Add Italian fields
            tour_data.update({
                'title_it': tour.title_it,
                'description_it': tour.description_it,
                'short_description_it': tour.short_description_it,
                'location_it': tour.location_it
            })
            items.append(tour_data)
        
        return jsonify({
            'success': True,
            'data': items,
            'meta': {
                'total': pagination.total,
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page
            }
        }), 200
    except Exception as e:
        logger.error(f"Admin list tours error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to list tours'}), 500

@admin_bp.route('/tours/<int:tour_id>', methods=['GET'])
@login_required
def admin_get_tour(tour_id):
    """Get a specific tour for admin editing."""
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        tour = Tour.query.get_or_404(tour_id)
        
        # Debug logging
        logger.info(f"🔍 Admin get tour {tour_id}:")
        logger.info(f"  English title: {tour.title}")
        logger.info(f"  Italian title: {tour.title_it}")
        logger.info(f"  English description: {tour.description[:50]}...")
        logger.info(f"  Italian description: {tour.description_it[:50] if tour.description_it else 'None'}...")
        logger.info(f"  English location: {tour.location}")
        logger.info(f"  Italian location: {tour.location_it}")
        
        # For admin, we need to return ALL fields (both English and Italian)
        # Create a custom response that includes all fields
        tour_data = tour.to_dict(include_bookings=True, language='en')
        
        # Add Italian fields to the response
        tour_data.update({
            'title_it': tour.title_it,
            'description_it': tour.description_it,
            'short_description_it': tour.short_description_it,
            'location_it': tour.location_it
        })
        
        return jsonify({
            'success': True,
            'data': tour_data
        }), 200
    except Exception as e:
        logger.error(f"Admin get tour error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get tour'}), 500

@admin_bp.route('/tours/<int:tour_id>/bookings', methods=['GET'])
@login_required
def admin_get_tour_bookings(tour_id):
    """Get bookings for a specific tour."""
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        tour = Tour.query.get_or_404(tour_id)
        
        # Get bookings for this tour
        from ...models import TourBooking
        bookings_query = TourBooking.query.filter_by(tour_id=tour_id).order_by(TourBooking.created_at.desc())
        bookings = [booking.to_dict() for booking in bookings_query.all()]
        
        return jsonify({
            'success': True,
            'data': bookings
        }), 200
        
    except Exception as e:
        logger.error(f"Admin get tour bookings error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to get tour bookings'}), 500

@admin_bp.route('/tours', methods=['POST'])
@login_required
def admin_create_tour():
    """Create a new tour."""
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        # Get form data more explicitly
        data = {}
        for key in request.form.keys():
            data[key] = request.form.get(key)
        
        # Debug logging
        logger.info(f"🔍 Tour creation data received:")
        logger.info(f"  English title: {data.get('title', 'NOT_FOUND')}")
        logger.info(f"  Italian title: {data.get('title_it', 'NOT_FOUND')}")
        logger.info(f"  English description: {data.get('description', 'NOT_FOUND')[:50]}...")
        logger.info(f"  Italian description: {data.get('description_it', 'NOT_FOUND')[:50]}...")
        logger.info(f"  English location: {data.get('location', 'NOT_FOUND')}")
        logger.info(f"  Italian location: {data.get('location_it', 'NOT_FOUND')}")
        logger.info(f"  All form keys: {list(data.keys())}")
        logger.info(f"  Raw form data: {dict(request.form)}")
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({
                'success': False,
                'message': 'Title is required'
            }), 400
        
        # Handle file upload
        image_file = request.files.get('image')
        image_path = save_tour_image(image_file) if image_file else None
        
        # Parse JSON fields
        includes = data.get('includes', '[]')
        requirements = data.get('requirements', '[]')
        
        # Ensure JSON fields are properly formatted as strings
        if isinstance(includes, list):
            includes = json.dumps(includes)
        elif isinstance(includes, str):
            try:
                json.loads(includes)
            except json.JSONDecodeError:
                includes = '[]'
        else:
            includes = '[]'
            
        if isinstance(requirements, list):
            requirements = json.dumps(requirements)
        elif isinstance(requirements, str):
            try:
                json.loads(requirements)
            except json.JSONDecodeError:
                requirements = '[]'
        else:
            requirements = '[]'
        
        # Create tour
        tour = Tour(
            # English fields
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            short_description=data.get('short_description', '').strip(),
            location=data.get('location', '').strip(),
            
            # Italian fields
            title_it=data.get('title_it', '').strip(),
            description_it=data.get('description_it', '').strip(),
            short_description_it=data.get('short_description_it', '').strip(),
            location_it=data.get('location_it', '').strip(),
            
            # Common fields
            image=image_path,
            date=datetime.fromisoformat(data['date'].replace('Z', '+00:00')) if data.get('date') else datetime.utcnow(),
            duration=int(data.get('duration', 2)),
            max_capacity=int(data.get('max_capacity', 10)),
            price=float(data.get('price', 0)),
            guide_name=data.get('guide_name', '').strip(),
            guide_contact=data.get('guide_contact', '').strip(),
            tour_type=data.get('tour_type', 'group'),
            difficulty_level=data.get('difficulty_level', 'easy'),
            includes=includes,
            requirements=requirements,
            status=data.get('status', 'active')
        )
        
        db.session.add(tour)
        db.session.commit()
        
        # Debug logging after creation
        logger.info(f"🔍 Tour created successfully:")
        logger.info(f"  Tour ID: {tour.id}")
        logger.info(f"  English title: {tour.title}")
        logger.info(f"  Italian title: {tour.title_it}")
        logger.info(f"  English description: {tour.description[:50]}...")
        logger.info(f"  Italian description: {tour.description_it[:50] if tour.description_it else 'None'}...")
        logger.info(f"  English location: {tour.location}")
        logger.info(f"  Italian location: {tour.location_it}")
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'tour_created',
            f'Created tour: {tour.title} (ID: {tour.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Tour created successfully',
            'data': tour.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Admin create tour error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create tour'
        }), 500

@admin_bp.route('/tours/<int:tour_id>', methods=['PUT'])
@login_required
def admin_update_tour(tour_id):
    """Update an existing tour."""
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        tour = Tour.query.get_or_404(tour_id)
        
        # Get form data more explicitly
        data = {}
        for key in request.form.keys():
            data[key] = request.form.get(key)
        
        # Debug logging
        logger.info(f"🔍 Tour update data received for tour {tour_id}:")
        logger.info(f"  English title: {data.get('title', 'NOT_FOUND')}")
        logger.info(f"  Italian title: {data.get('title_it', 'NOT_FOUND')}")
        logger.info(f"  English description: {data.get('description', 'NOT_FOUND')[:50]}...")
        logger.info(f"  Italian description: {data.get('description_it', 'NOT_FOUND')[:50]}...")
        logger.info(f"  English location: {data.get('location', 'NOT_FOUND')}")
        logger.info(f"  Italian location: {data.get('location_it', 'NOT_FOUND')}")
        logger.info(f"  All form keys: {list(data.keys())}")
        logger.info(f"  Raw form data: {dict(request.form)}")
        
        # Handle file upload
        image_file = request.files.get('image')
        if image_file:
            image_path = save_tour_image(image_file)
            if image_path:
                tour.image = image_path
        
        # Update English fields
        if 'title' in data:
            tour.title = data['title'].strip()
        if 'description' in data:
            tour.description = data['description'].strip()
        if 'short_description' in data:
            tour.short_description = data['short_description'].strip()
        if 'location' in data:
            tour.location = data['location'].strip()
        
        # Update Italian fields
        if 'title_it' in data:
            tour.title_it = data['title_it'].strip()
        if 'description_it' in data:
            tour.description_it = data['description_it'].strip()
        if 'short_description_it' in data:
            tour.short_description_it = data['short_description_it'].strip()
        if 'location_it' in data:
            tour.location_it = data['location_it'].strip()
        
        # Update common fields
        if 'date' in data:
            tour.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
        if 'duration' in data:
            tour.duration = int(data['duration'])
        if 'max_capacity' in data:
            tour.max_capacity = int(data['max_capacity'])
        if 'price' in data:
            tour.price = float(data['price'])
        if 'guide_name' in data:
            tour.guide_name = data['guide_name'].strip()
        if 'guide_contact' in data:
            tour.guide_contact = data['guide_contact'].strip()
        if 'tour_type' in data:
            tour.tour_type = data['tour_type'].strip()
        if 'difficulty_level' in data:
            tour.difficulty_level = data['difficulty_level'].strip()
        if 'includes' in data:
            includes = data['includes']
            if isinstance(includes, str):
                try:
                    json.loads(includes)
                except json.JSONDecodeError:
                    includes = '[]'
            elif isinstance(includes, list):
                includes = json.dumps(includes)
            else:
                includes = '[]'
            tour.includes = includes
        if 'requirements' in data:
            requirements = data['requirements']
            if isinstance(requirements, str):
                try:
                    json.loads(requirements)
                except json.JSONDecodeError:
                    requirements = '[]'
            elif isinstance(requirements, list):
                requirements = json.dumps(requirements)
            else:
                requirements = '[]'
            tour.requirements = requirements
        if 'status' in data:
            tour.status = data['status'].strip()
        
        tour.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Debug logging after update
        logger.info(f"🔍 Tour updated successfully:")
        logger.info(f"  Tour ID: {tour.id}")
        logger.info(f"  English title: {tour.title}")
        logger.info(f"  Italian title: {tour.title_it}")
        logger.info(f"  English description: {tour.description[:50]}...")
        logger.info(f"  Italian description: {tour.description_it[:50] if tour.description_it else 'None'}...")
        logger.info(f"  English location: {tour.location}")
        logger.info(f"  Italian location: {tour.location_it}")
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'tour_updated',
            f'Updated tour: {tour.title} (ID: {tour.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Tour updated successfully',
            'data': tour.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Admin update tour error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update tour'
        }), 500

@admin_bp.route('/tours/<int:tour_id>', methods=['DELETE'])
@login_required
def admin_delete_tour(tour_id):
    """Delete a tour."""
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        tour = Tour.query.get_or_404(tour_id)
        tour_title = tour.title
        
        db.session.delete(tour)
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'tour_deleted',
            f'Deleted tour: {tour_title} (ID: {tour_id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Tour deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Admin delete tour error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete tour'
        }), 500

def save_tour_image(image_file):
    """Save tour image file and return the path."""
    if not image_file or not image_file.filename:
        return None
    
    # Create uploads directory
    upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    upload_dir = os.path.join(upload_root, 'tours')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate secure filename
    filename = secure_filename(image_file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    name, ext = os.path.splitext(filename)
    filename = f"{name}_{timestamp}{ext}"
    
    # Save file
    file_path = os.path.join(upload_dir, filename)
    image_file.save(file_path)
    
    # Return relative path
    return f"tours/{filename}"

# Get system statistics
@admin_bp.route('/statistics', methods=['GET'])
@login_required
def get_system_statistics():
    """Get comprehensive system statistics"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        verified_users = User.query.filter_by(email_verified=True).count()
        admin_users = User.query.filter(User.admin_level.in_(['admin', 'super_admin', 'moderator'])).count()
        
        # Content statistics
        total_stories = Story.query.count()
        published_stories = Story.query.filter_by(status='published').count()
        draft_stories = Story.query.filter_by(status='draft').count()
        featured_stories = Story.query.filter_by(featured=True).count()
        
        total_gallery_items = GalleryItem.query.count()
        active_gallery_items = GalleryItem.query.filter_by(is_active=True).count()
        featured_gallery_items = GalleryItem.query.filter_by(featured=True).count()
        
        total_tours = Tour.query.count()
        active_tours = Tour.query.filter_by(is_active=True).count()
        featured_tours = Tour.query.filter_by(featured=True).count()
        
        # Security statistics
        total_security_events = SecurityLog.query.count()
        
        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_users = User.query.filter(
            User.created_at >= seven_days_ago
        ).count()
        
        recent_stories = Story.query.filter(
            Story.created_at >= seven_days_ago
        ).count()
        
        recent_gallery_items = GalleryItem.query.filter(
            GalleryItem.created_at >= seven_days_ago
        ).count()
        
        recent_tours = Tour.query.filter(
            Tour.created_at >= seven_days_ago
        ).count()
        
        recent_security_events = SecurityLog.query.filter(
            SecurityLog.timestamp >= seven_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'verified': verified_users,
                    'admin': admin_users,
                    'recent': recent_users
                },
                'stories': {
                    'total': total_stories,
                    'published': published_stories,
                    'draft': draft_stories,
                    'featured': featured_stories,
                    'recent': recent_stories
                },
                'gallery': {
                    'total': total_gallery_items,
                    'active': active_gallery_items,
                    'featured': featured_gallery_items,
                    'recent': recent_gallery_items
                },
                'tours': {
                    'total': total_tours,
                    'active': active_tours,
                    'featured': featured_tours,
                    'recent': recent_tours
                },
                'security': {
                    'total_events': total_security_events,
                    'recent_events': recent_security_events
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get system statistics error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get system statistics'
        }), 500

# Get recent security events
@admin_bp.route('/security-events', methods=['GET'])
@login_required
def get_security_events():
    """Get recent security events"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        event_type = request.args.get('event_type', '').strip()
        
        # Build query
        query = SecurityLog.query
        
        if event_type:
            query = query.filter(SecurityLog.event_type == event_type)
        
        # Order by timestamp (newest first)
        query = query.order_by(SecurityLog.timestamp.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        events = []
        for event in pagination.items:
            events.append({
                'id': event.id,
                'user_id': event.user_id,
                'event_type': event.event_type,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'details': event.details,
                'timestamp': event.timestamp.isoformat()
            })
        
        return jsonify({
            'success': True,
            'events': events,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get security events error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get security events'
        }), 500

# Get system health
@admin_bp.route('/health', methods=['GET'])
@login_required
def get_system_health():
    """Get system health status"""
    try:
        current_user_obj = User.query.get(current_user.id)
        
        if not current_user_obj or not current_user_obj.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403
        
        # Check database connection
        try:
            db.session.execute('SELECT 1')
            db_status = 'healthy'
        except Exception as e:
            db_status = 'unhealthy'
            logger.error(f"Database health check failed: {str(e)}")
        
        # Check for any locked accounts
        locked_accounts = User.query.filter(
            User.account_locked_until > datetime.utcnow()
        ).count()
        
        # Check for inactive users (not logged in for 30+ days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        inactive_users = User.query.filter(
            User.last_login < thirty_days_ago
        ).count()
        
        return jsonify({
            'success': True,
            'health': {
                'database': db_status,
                'locked_accounts': locked_accounts,
                'inactive_users': inactive_users,
                'timestamp': datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get system health error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get system health'
        }), 500

# =============================================================================
# BOOK MANAGEMENT ROUTES
# =============================================================================

@admin_bp.route('/books', methods=['GET'])
@login_required
def get_books():
    """Get all books with pagination and filtering."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        featured = request.args.get('featured', '').strip()
        
        query = Book.query
        
        # Apply filters
        if search:
            query = query.filter(
                Book.title.contains(search) | 
                Book.subtitle.contains(search) |
                Book.description.contains(search)
            )
        
        if category:
            query = query.filter(Book.category == category)
        
        if featured:
            query = query.filter(Book.featured == (featured.lower() == 'true'))
        
        # Order by order_index, then by created_at
        query = query.order_by(Book.order_index.asc(), Book.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        books = [book.to_dict() for book in pagination.items]
        
        return jsonify({
            'success': True,
            'books': books,
            'meta': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get books error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get books'
        }), 500

@admin_bp.route('/books/<int:book_id>', methods=['GET'])
@login_required
def get_book(book_id):
    """Get a specific book by ID."""
    try:
        book = Book.query.get_or_404(book_id)
        return jsonify({
            'success': True,
            'book': book.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Get book error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Book not found'
        }), 404

@admin_bp.route('/books', methods=['POST'])
@login_required
def create_book():
    """Create a new book."""
    try:
        data = request.form.to_dict()
        
        # Debug logging
        logger.info(f"Create book request - Form data: {data}")
        logger.info(f"Create book request - Files: {list(request.files.keys())}")
        
        # Validate required fields
        if not data.get('title'):
            return jsonify({
                'success': False,
                'message': 'Title is required'
            }), 400
        
        # Handle file upload
        image_file = request.files.get('image')
        logger.info(f"Image file received: {image_file}")
        if image_file:
            logger.info(f"Image file details - filename: {image_file.filename}, content_type: {image_file.content_type}")
        
        image_path = save_book_image(image_file) if image_file else None
        logger.info(f"Image path saved: {image_path}")
        
        # Parse JSON fields
        external_links = data.get('external_links', '[]')
        if isinstance(external_links, str):
            try:
                json.loads(external_links)
            except json.JSONDecodeError:
                external_links = '[]'
        elif isinstance(external_links, list):
            external_links = json.dumps(external_links)
        else:
            external_links = '[]'
        
        tags = data.get('tags', '')
        if isinstance(tags, list):
            tags = ','.join(tags)
        
        # Create book
        book = Book(
            # English fields
            title=data['title'].strip(),
            subtitle=data.get('subtitle', '').strip(),
            description=data.get('description', '').strip(),
            preview=data.get('preview', '').strip(),
            category=data.get('category', '').strip(),
            tags=tags,
            
            # Italian fields
            title_it=data.get('title_it', '').strip(),
            subtitle_it=data.get('subtitle_it', '').strip(),
            description_it=data.get('description_it', '').strip(),
            preview_it=data.get('preview_it', '').strip(),
            category_it=data.get('category_it', '').strip(),
            tags_it=data.get('tags_it', '').strip(),
            
            # Common fields
            image=image_path,
            price=data.get('price', '').strip(),
            original_price=data.get('original_price', '').strip(),
            currency=data.get('currency', 'USD'),
            availability=data.get('availability', 'available'),
            external_links=external_links,
            amazon_link=data.get('amazon_link', '').strip(),
            barnes_noble_link=data.get('barnes_noble_link', '').strip(),
            featured=data.get('featured', 'false').lower() == 'true',
            order_index=int(data.get('order_index', 0))
        )
        
        db.session.add(book)
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'book_created',
            f'Created book: {book.title} (ID: {book.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Book created successfully',
            'book': book.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create book error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create book'
        }), 500

@admin_bp.route('/books/<int:book_id>', methods=['PUT'])
@login_required
def update_book(book_id):
    """Update an existing book."""
    try:
        book = Book.query.get_or_404(book_id)
        data = request.form.to_dict()
        
        # Handle file upload
        image_file = request.files.get('image')
        if image_file:
            image_path = save_book_image(image_file)
            if image_path:
                book.image = image_path
        
        # Update English fields
        if 'title' in data:
            book.title = data['title'].strip()
        if 'subtitle' in data:
            book.subtitle = data['subtitle'].strip()
        if 'description' in data:
            book.description = data['description'].strip()
        if 'preview' in data:
            book.preview = data['preview'].strip()
        if 'category' in data:
            book.category = data['category'].strip()
        if 'tags' in data:
            tags = data['tags']
            if isinstance(tags, list):
                tags = ','.join(tags)
            book.tags = tags
        
        # Update Italian fields
        if 'title_it' in data:
            book.title_it = data['title_it'].strip()
        if 'subtitle_it' in data:
            book.subtitle_it = data['subtitle_it'].strip()
        if 'description_it' in data:
            book.description_it = data['description_it'].strip()
        if 'preview_it' in data:
            book.preview_it = data['preview_it'].strip()
        if 'category_it' in data:
            book.category_it = data['category_it'].strip()
        if 'tags_it' in data:
            tags_it = data['tags_it']
            if isinstance(tags_it, list):
                tags_it = ','.join(tags_it)
            book.tags_it = tags_it
        
        # Update common fields
        if 'price' in data:
            book.price = data['price'].strip()
        if 'original_price' in data:
            book.original_price = data['original_price'].strip()
        if 'currency' in data:
            book.currency = data['currency'].strip()
        if 'availability' in data:
            book.availability = data['availability'].strip()
        if 'external_links' in data:
            external_links = data['external_links']
            if isinstance(external_links, str):
                try:
                    json.loads(external_links)
                except json.JSONDecodeError:
                    external_links = '[]'
            elif isinstance(external_links, list):
                external_links = json.dumps(external_links)
            else:
                external_links = '[]'
            book.external_links = external_links
        if 'amazon_link' in data:
            book.amazon_link = data['amazon_link'].strip()
        if 'barnes_noble_link' in data:
            book.barnes_noble_link = data['barnes_noble_link'].strip()
        if 'featured' in data:
            book.featured = data['featured'].lower() == 'true'
        if 'order_index' in data:
            book.order_index = int(data['order_index'])
        
        book.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'book_updated',
            f'Updated book: {book.title} (ID: {book.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Book updated successfully',
            'book': book.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update book error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update book'
        }), 500

@admin_bp.route('/books/<int:book_id>', methods=['DELETE'])
@login_required
def delete_book(book_id):
    """Delete a book."""
    try:
        book = Book.query.get_or_404(book_id)
        book_title = book.title
        
        # Delete associated image file if it exists
        if book.image:
            try:
                image_path = os.path.join(current_app.root_path, book.image)
                if os.path.exists(image_path):
                    os.remove(image_path)
            except Exception as e:
                logger.warning(f"Failed to delete book image: {e}")
        
        db.session.delete(book)
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'book_deleted',
            f'Deleted book: {book_title} (ID: {book_id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Book deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete book error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete book'
        }), 500

@admin_bp.route('/authors', methods=['GET'])
@login_required
def get_authors():
    """Get all authors."""
    try:
        authors = Author.query.filter_by(active=True).order_by(Author.name.asc()).all()
        
        return jsonify({
            'success': True,
            'authors': [author.to_dict() for author in authors]
        }), 200
        
    except Exception as e:
        logger.error(f"Get authors error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get authors'
        }), 500

@admin_bp.route('/authors', methods=['POST'])
@login_required
def create_author():
    """Create a new author."""
    try:
        data = request.form.to_dict()
        
        # Debug logging
        logger.info(f"Create author request - Form data: {data}")
        logger.info(f"Create author request - Files: {list(request.files.keys())}")
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({
                'success': False,
                'message': 'Name is required'
            }), 400
        
        # Handle file upload
        image_file = request.files.get('image')
        logger.info(f"Image file received: {image_file}")
        if image_file:
            logger.info(f"Image file details - filename: {image_file.filename}, content_type: {image_file.content_type}")
        
        image_path = save_author_image(image_file) if image_file else None
        logger.info(f"Image path saved: {image_path}")
        
        # Parse JSON fields
        credentials = data.get('credentials', '[]')
        achievements = data.get('achievements', '[]')
        social_links = data.get('social_links', '[]')
        
        # Parse Italian JSON fields
        credentials_it = data.get('credentials_it', '[]')
        achievements_it = data.get('achievements_it', '[]')
        
        # Ensure JSON fields are properly formatted as strings
        json_fields = [credentials, achievements, social_links, credentials_it, achievements_it]
        for i, field in enumerate(json_fields):
            if isinstance(field, list):
                json_fields[i] = json.dumps(field)
            elif isinstance(field, str):
                try:
                    json.loads(field)
                except json.JSONDecodeError:
                    json_fields[i] = '[]'
            else:
                json_fields[i] = '[]'
        
        # Assign back to variables
        credentials, achievements, social_links, credentials_it, achievements_it = json_fields
        
        # Create author
        author = Author(
            # English fields
            name=data['name'].strip(),
            title=data.get('title', '').strip(),
            bio=data.get('bio', '').strip(),
            credentials=credentials,
            achievements=achievements,
            quote=data.get('quote', '').strip(),
            hero_title=data.get('hero_title', '').strip(),
            hero_subtitle=data.get('hero_subtitle', '').strip(),
            book_section_title=data.get('book_section_title', '').strip(),
            book_section_subtitle=data.get('book_section_subtitle', '').strip(),
            
            # Italian fields
            name_it=data.get('name_it', '').strip(),
            title_it=data.get('title_it', '').strip(),
            bio_it=data.get('bio_it', '').strip(),
            credentials_it=credentials_it,
            achievements_it=achievements_it,
            quote_it=data.get('quote_it', '').strip(),
            hero_title_it=data.get('hero_title_it', '').strip(),
            hero_subtitle_it=data.get('hero_subtitle_it', '').strip(),
            book_section_title_it=data.get('book_section_title_it', '').strip(),
            book_section_subtitle_it=data.get('book_section_subtitle_it', '').strip(),
            
            # Common fields
            image=image_path,
            social_links=social_links,
            contact_email=data.get('contact_email', '').strip(),
            contact_link=data.get('contact_link', '').strip(),
            active=True
        )
        
        db.session.add(author)
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'author_created',
            f'Created author: {author.name} (ID: {author.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Author created successfully',
            'author': author.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create author error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create author'
        }), 500

@admin_bp.route('/authors/<int:author_id>', methods=['PUT'])
@login_required
def update_author(author_id):
    """Update an existing author."""
    try:
        author = Author.query.get_or_404(author_id)
        data = request.form.to_dict()
        
        # Handle file upload
        image_file = request.files.get('image')
        if image_file:
            image_path = save_author_image(image_file)
            if image_path:
                author.image = image_path
        
        # Update English fields
        if 'name' in data:
            author.name = data['name'].strip()
        if 'title' in data:
            author.title = data['title'].strip()
        if 'bio' in data:
            author.bio = data['bio'].strip()
        if 'credentials' in data:
            credentials = data['credentials']
            if isinstance(credentials, str):
                try:
                    json.loads(credentials)
                except json.JSONDecodeError:
                    credentials = '[]'
            elif isinstance(credentials, list):
                credentials = json.dumps(credentials)
            else:
                credentials = '[]'
            author.credentials = credentials
        if 'achievements' in data:
            achievements = data['achievements']
            if isinstance(achievements, str):
                try:
                    json.loads(achievements)
                except json.JSONDecodeError:
                    achievements = '[]'
            elif isinstance(achievements, list):
                achievements = json.dumps(achievements)
            else:
                achievements = '[]'
            author.achievements = achievements
        if 'quote' in data:
            author.quote = data['quote'].strip()
        if 'hero_title' in data:
            author.hero_title = data['hero_title'].strip()
        if 'hero_subtitle' in data:
            author.hero_subtitle = data['hero_subtitle'].strip()
        if 'book_section_title' in data:
            author.book_section_title = data['book_section_title'].strip()
        if 'book_section_subtitle' in data:
            author.book_section_subtitle = data['book_section_subtitle'].strip()
        
        # Update Italian fields
        if 'name_it' in data:
            author.name_it = data['name_it'].strip()
        if 'title_it' in data:
            author.title_it = data['title_it'].strip()
        if 'bio_it' in data:
            author.bio_it = data['bio_it'].strip()
        if 'credentials_it' in data:
            credentials_it = data['credentials_it']
            if isinstance(credentials_it, str):
                try:
                    json.loads(credentials_it)
                except json.JSONDecodeError:
                    credentials_it = '[]'
            elif isinstance(credentials_it, list):
                credentials_it = json.dumps(credentials_it)
            else:
                credentials_it = '[]'
            author.credentials_it = credentials_it
        if 'achievements_it' in data:
            achievements_it = data['achievements_it']
            if isinstance(achievements_it, str):
                try:
                    json.loads(achievements_it)
                except json.JSONDecodeError:
                    achievements_it = '[]'
            elif isinstance(achievements_it, list):
                achievements_it = json.dumps(achievements_it)
            else:
                achievements_it = '[]'
            author.achievements_it = achievements_it
        if 'quote_it' in data:
            author.quote_it = data['quote_it'].strip()
        if 'hero_title_it' in data:
            author.hero_title_it = data['hero_title_it'].strip()
        if 'hero_subtitle_it' in data:
            author.hero_subtitle_it = data['hero_subtitle_it'].strip()
        if 'book_section_title_it' in data:
            author.book_section_title_it = data['book_section_title_it'].strip()
        if 'book_section_subtitle_it' in data:
            author.book_section_subtitle_it = data['book_section_subtitle_it'].strip()
        
        # Update common fields
        if 'social_links' in data:
            social_links = data['social_links']
            if isinstance(social_links, str):
                try:
                    json.loads(social_links)
                except json.JSONDecodeError:
                    social_links = '[]'
            author.social_links = social_links
        if 'contact_email' in data:
            author.contact_email = data['contact_email'].strip()
        if 'contact_link' in data:
            author.contact_link = data['contact_link'].strip()
        
        author.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'author_updated',
            f'Updated author: {author.name} (ID: {author.id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Author updated successfully',
            'author': author.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update author error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update author'
        }), 500

@admin_bp.route('/authors/<int:author_id>', methods=['DELETE'])
@login_required
def delete_author(author_id):
    """Delete an author."""
    try:
        author = Author.query.get_or_404(author_id)
        author_name = author.name
        
        # Delete associated image file if it exists
        if author.image:
            try:
                image_path = os.path.join(current_app.root_path, author.image)
                if os.path.exists(image_path):
                    os.remove(image_path)
            except Exception as e:
                logger.warning(f"Failed to delete author image: {e}")
        
        # Instead of deleting, mark as inactive
        author.active = False
        author.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log activity
        TokenManager.log_security_event(
            current_user.id, 'author_deleted',
            f'Deleted author: {author_name} (ID: {author_id})'
        )
        
        return jsonify({
            'success': True,
            'message': 'Author deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete author error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete author'
        }), 500

def save_book_image(image_file):
    """Save book image file and return the path."""
    logger.info(f"save_book_image called with: {image_file}")
    
    if not image_file or not image_file.filename:
        logger.info("No image file or filename provided")
        return None
    
    # Create uploads directory
    upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    upload_dir = os.path.join(upload_root, 'books')
    logger.info(f"Upload directory: {upload_dir}")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate secure filename
    filename = secure_filename(image_file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    name, ext = os.path.splitext(filename)
    filename = f"{name}_{timestamp}{ext}"
    logger.info(f"Generated filename: {filename}")
    
    # Save file
    file_path = os.path.join(upload_dir, filename)
    logger.info(f"Full file path: {file_path}")
    
    try:
        image_file.save(file_path)
        logger.info(f"File saved successfully to: {file_path}")
        
        # Return relative path
        relative_path = f"books/{filename}"
        logger.info(f"Returning relative path: {relative_path}")
        return relative_path
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        return None

def save_author_image(image_file):
    """Save author image file and return the path."""
    logger.info(f"save_author_image called with: {image_file}")
    
    if not image_file or not image_file.filename:
        logger.info("No image file or filename provided")
        return None
    
    # Create uploads directory
    upload_root = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    upload_dir = os.path.join(upload_root, 'authors')
    logger.info(f"Upload directory: {upload_dir}")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate secure filename
    filename = secure_filename(image_file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    name, ext = os.path.splitext(filename)
    filename = f"{name}_{timestamp}{ext}"
    logger.info(f"Generated filename: {filename}")
    
    # Save file
    file_path = os.path.join(upload_dir, filename)
    logger.info(f"Full file path: {file_path}")
    
    try:
        image_file.save(file_path)
        logger.info(f"File saved successfully to: {file_path}")
        
        # Return relative path
        relative_path = f"authors/{filename}"
        logger.info(f"Returning relative path: {relative_path}")
        return relative_path
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        return None

# ============================================================================
# PAGE CONTENT MANAGEMENT ROUTES
# ============================================================================

@admin_bp.route('/page-content', methods=['GET'])
@login_required
def get_page_content():
    """Get all page content for editing"""
    try:
        page_name = request.args.get('page_name')
        section_name = request.args.get('section_name')
        
        query = PageContent.query.filter_by(is_active=True)
        
        if page_name:
            query = query.filter_by(page_name=page_name)
        if section_name:
            query = query.filter_by(section_name=section_name)
            
        content_items = query.order_by(PageContent.page_name, PageContent.section_name, PageContent.order_index).all()
        
        # Group content by page and section
        content_by_page = {}
        for item in content_items:
            if item.page_name not in content_by_page:
                content_by_page[item.page_name] = {}
            if item.section_name not in content_by_page[item.page_name]:
                content_by_page[item.page_name][item.section_name] = {}
            
            content_by_page[item.page_name][item.section_name][item.content_key] = {
                'id': item.id,
                'value': item.content_value,
                'type': item.content_type,
                'order_index': item.order_index
            }
        
        return jsonify({
            'success': True,
            'content': content_by_page
        })
        
    except Exception as e:
        logger.error(f"Get page content error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch page content'
        }), 500

@admin_bp.route('/page-content', methods=['POST'])
@login_required
def create_page_content():
    """Create or update page content"""
    try:
        data = request.get_json()
        
        page_name = data.get('page_name')
        section_name = data.get('section_name')
        content_key = data.get('content_key')
        content_value = data.get('content_value', '')
        content_type = data.get('content_type', 'text')
        
        if not all([page_name, section_name, content_key]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Check if content already exists
        existing = PageContent.query.filter_by(
            page_name=page_name,
            section_name=section_name,
            content_key=content_key
        ).first()
        
        if existing:
            # Update existing content
            existing.content_value = content_value
            existing.content_type = content_type
            existing.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Content updated successfully',
                'content': existing.to_dict()
            })
        else:
            # Create new content
            new_content = PageContent(
                page_name=page_name,
                section_name=section_name,
                content_key=content_key,
                content_value=content_value,
                content_type=content_type
            )
            
            db.session.add(new_content)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Content created successfully',
                'content': new_content.to_dict()
            }), 201
        
    except Exception as e:
        logger.error(f"Create page content error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create/update content'
        }), 500

@admin_bp.route('/page-content/<int:content_id>', methods=['PUT'])
@login_required
def update_page_content(content_id):
    """Update specific page content"""
    try:
        content = PageContent.query.get_or_404(content_id)
        data = request.get_json()
        
        content.content_value = data.get('content_value', content.content_value)
        content.content_type = data.get('content_type', content.content_type)
        content.is_active = data.get('is_active', content.is_active)
        content.order_index = data.get('order_index', content.order_index)
        content.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Content updated successfully',
            'content': content.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Update page content error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update content'
        }), 500

@admin_bp.route('/page-content/<int:content_id>', methods=['DELETE'])
@login_required
def delete_page_content(content_id):
    """Delete page content"""
    try:
        content = PageContent.query.get_or_404(content_id)
        
        db.session.delete(content)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Content deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Delete page content error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete content'
        }), 500

@admin_bp.route('/page-content/initialize', methods=['POST'])
@login_required
def initialize_page_content():
    """Initialize default page content for book page"""
    try:
        # Default content for book page
        default_content = [
            # Hero Section
            {'page_name': 'book_page', 'section_name': 'hero', 'content_key': 'title', 'content_value': 'My Published Works', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'hero', 'content_key': 'subtitle', 'content_value': 'Each book represents years of research, real-world experience, and my deep passion for helping dogs and their families thrive together.', 'content_type': 'text'},
            
            # Author Section
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'name', 'content_value': 'Author', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'title', 'content_value': 'Author', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'bio', 'content_value': 'Author information will appear here once books are added.', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'quote', 'content_value': 'Welcome to our book collection.', 'content_type': 'text'},
            
            # Empty States
            {'page_name': 'book_page', 'section_name': 'empty_state', 'content_key': 'title', 'content_value': 'No Books Available Yet', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'empty_state', 'content_key': 'description', 'content_value': 'Books will appear here once they are added through the admin panel.', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'empty_state', 'content_key': 'subtitle', 'content_value': 'Check back later or contact the administrator to add books.', 'content_type': 'text'},
            
            # Loading State
            {'page_name': 'book_page', 'section_name': 'loading', 'content_key': 'title', 'content_value': 'Loading Books...', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'loading', 'content_key': 'description', 'content_value': 'Please wait while we fetch the latest books and author information.', 'content_type': 'text'},
            
            # Error State
            {'page_name': 'book_page', 'section_name': 'error', 'content_key': 'title', 'content_value': 'Error Loading Books', 'content_type': 'text'},
            {'page_name': 'book_page', 'section_name': 'error', 'content_key': 'button_text', 'content_value': 'Try Again', 'content_type': 'text'},
        ]
        
        created_count = 0
        for content_data in default_content:
            # Check if content already exists
            existing = PageContent.query.filter_by(
                page_name=content_data['page_name'],
                section_name=content_data['section_name'],
                content_key=content_data['content_key']
            ).first()
            
            if not existing:
                new_content = PageContent(**content_data)
                db.session.add(new_content)
                created_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Initialized {created_count} default content items',
            'created_count': created_count
        })
        
    except Exception as e:
        logger.error(f"Initialize page content error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to initialize page content'
        }), 500

# ============================================================================
# INTERNATIONALIZATION (i18n) ROUTES
# ============================================================================

@admin_bp.route('/languages', methods=['GET'])
@login_required
def get_languages():
    """Get all supported languages"""
    try:
        languages = Language.query.filter_by(is_active=True).order_by(Language.sort_order, Language.name).all()
        return jsonify({
            'success': True,
            'languages': [lang.to_dict() for lang in languages]
        })
    except Exception as e:
        logger.error(f"Get languages error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch languages'
        }), 500

@admin_bp.route('/languages', methods=['POST'])
@login_required
def create_language():
    """Create a new language"""
    try:
        data = request.get_json()
        
        # Check if language code already exists
        existing = Language.query.filter_by(code=data.get('code')).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'Language code already exists'
            }), 400
        
        # If this is set as default, unset other defaults
        if data.get('is_default'):
            Language.query.update({'is_default': False})
        
        new_language = Language(
            code=data.get('code'),
            name=data.get('name'),
            native_name=data.get('native_name'),
            flag_emoji=data.get('flag_emoji'),
            is_active=data.get('is_active', True),
            is_default=data.get('is_default', False),
            sort_order=data.get('sort_order', 0)
        )
        
        db.session.add(new_language)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Language created successfully',
            'language': new_language.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create language error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create language'
        }), 500

@admin_bp.route('/translations', methods=['GET'])
@login_required
def get_translations():
    """Get translations with filtering options"""
    try:
        page_name = request.args.get('page_name')
        language_code = request.args.get('language_code')
        section_name = request.args.get('section_name')
        needs_review = request.args.get('needs_review', type=bool)
        
        query = Translation.query
        
        if page_name:
            query = query.filter_by(page_name=page_name)
        if language_code:
            query = query.filter_by(language_code=language_code)
        if section_name:
            query = query.filter_by(section_name=section_name)
        if needs_review is not None:
            query = query.filter_by(needs_review=needs_review)
        
        translations = query.order_by(
            Translation.page_name, 
            Translation.section_name, 
            Translation.content_key,
            Translation.language_code
        ).all()
        
        # Group translations by page and section
        grouped_translations = {}
        for trans in translations:
            if trans.page_name not in grouped_translations:
                grouped_translations[trans.page_name] = {}
            if trans.section_name not in grouped_translations[trans.page_name]:
                grouped_translations[trans.page_name][trans.section_name] = {}
            if trans.content_key not in grouped_translations[trans.page_name][trans.section_name]:
                grouped_translations[trans.page_name][trans.section_name][trans.content_key] = {}
            
            grouped_translations[trans.page_name][trans.section_name][trans.content_key][trans.language_code] = trans.to_dict()
        
        return jsonify({
            'success': True,
            'translations': grouped_translations
        })
        
    except Exception as e:
        logger.error(f"Get translations error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch translations'
        }), 500

@admin_bp.route('/translations', methods=['POST'])
@login_required
def create_translation():
    """Create or update a translation"""
    try:
        data = request.get_json()
        
        page_name = data.get('page_name')
        section_name = data.get('section_name')
        content_key = data.get('content_key')
        language_code = data.get('language_code')
        content_value = data.get('content_value', '')
        content_type = data.get('content_type', 'text')
        is_auto_translated = data.get('is_auto_translated', False)
        translation_confidence = data.get('translation_confidence', 1.0)
        
        if not all([page_name, section_name, content_key, language_code]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Check if translation already exists
        existing = Translation.query.filter_by(
            page_name=page_name,
            section_name=section_name,
            content_key=content_key,
            language_code=language_code
        ).first()
        
        if existing:
            # Update existing translation
            existing.content_value = content_value
            existing.content_type = content_type
            existing.is_auto_translated = is_auto_translated
            existing.translation_confidence = translation_confidence
            existing.needs_review = is_auto_translated  # Auto-translated content needs review
            existing.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Translation updated successfully',
                'translation': existing.to_dict()
            })
        else:
            # Create new translation
            new_translation = Translation(
                page_name=page_name,
                section_name=section_name,
                content_key=content_key,
                language_code=language_code,
                content_value=content_value,
                content_type=content_type,
                is_auto_translated=is_auto_translated,
                translation_confidence=translation_confidence,
                needs_review=is_auto_translated
            )
            
            db.session.add(new_translation)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Translation created successfully',
                'translation': new_translation.to_dict()
            }), 201
        
    except Exception as e:
        logger.error(f"Create translation error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to create/update translation'
        }), 500

@admin_bp.route('/translations/auto-translate', methods=['POST'])
@login_required
def auto_translate():
    """Auto-translate content using translation service"""
    try:
        data = request.get_json()
        
        source_language = data.get('source_language', 'en')
        target_language = data.get('target_language')
        page_name = data.get('page_name')
        section_name = data.get('section_name')
        content_key = data.get('content_key')
        source_text = data.get('source_text')
        
        if not all([target_language, source_text]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields for translation'
            }), 400
        
        # Here you would integrate with a translation service like Google Translate, DeepL, etc.
        # For now, we'll simulate the translation
        translated_text = simulate_translation(source_text, source_language, target_language)
        
        # Create or update the translation
        translation_data = {
            'page_name': page_name,
            'section_name': section_name,
            'content_key': content_key,
            'language_code': target_language,
            'content_value': translated_text,
            'is_auto_translated': True,
            'translation_confidence': 0.8  # Simulated confidence
        }
        
        # Use the existing create_translation logic
        existing = Translation.query.filter_by(
            page_name=page_name,
            section_name=section_name,
            content_key=content_key,
            language_code=target_language
        ).first()
        
        if existing:
            existing.content_value = translated_text
            existing.is_auto_translated = True
            existing.translation_confidence = 0.8
            existing.needs_review = True
            existing.updated_at = datetime.utcnow()
        else:
            new_translation = Translation(**translation_data)
            db.session.add(new_translation)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Translation generated successfully',
            'translated_text': translated_text,
            'confidence': 0.8
        })
        
    except Exception as e:
        logger.error(f"Auto translate error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to generate translation'
        }), 500

@admin_bp.route('/translations/bulk-translate', methods=['POST'])
@login_required
def bulk_translate():
    """Bulk translate all content for a page to a target language"""
    try:
        data = request.get_json()
        
        page_name = data.get('page_name')
        source_language = data.get('source_language', 'en')
        target_language = data.get('target_language')
        
        if not all([page_name, target_language]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Get all source translations for the page
        source_translations = Translation.query.filter_by(
            page_name=page_name,
            language_code=source_language
        ).all()
        
        translated_count = 0
        for source_trans in source_translations:
            # Check if target translation already exists
            existing_target = Translation.query.filter_by(
                page_name=source_trans.page_name,
                section_name=source_trans.section_name,
                content_key=source_trans.content_key,
                language_code=target_language
            ).first()
            
            if not existing_target and source_trans.content_value:
                # Generate translation
                translated_text = simulate_translation(
                    source_trans.content_value, 
                    source_language, 
                    target_language
                )
                
                new_translation = Translation(
                    page_name=source_trans.page_name,
                    section_name=source_trans.section_name,
                    content_key=source_trans.content_key,
                    language_code=target_language,
                    content_value=translated_text,
                    content_type=source_trans.content_type,
                    is_auto_translated=True,
                    translation_confidence=0.8,
                    needs_review=True
                )
                
                db.session.add(new_translation)
                translated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Bulk translation completed. {translated_count} translations created.',
            'translated_count': translated_count
        })
        
    except Exception as e:
        logger.error(f"Bulk translate error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to perform bulk translation'
        }), 500

@admin_bp.route('/translations/templates', methods=['GET'])
@login_required
def get_translation_templates():
    """Get translation templates"""
    try:
        templates = TranslationTemplate.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'templates': [template.to_dict() for template in templates]
        })
    except Exception as e:
        logger.error(f"Get templates error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch templates'
        }), 500

@admin_bp.route('/translations/initialize-defaults', methods=['POST'])
@login_required
def initialize_default_translations():
    """Initialize default translations for all supported languages"""
    try:
        # Get all active languages
        languages = Language.query.filter_by(is_active=True).all()
        
        # Default content templates
        default_content = [
            # Book Page Content
            {'page_name': 'book_page', 'section_name': 'hero', 'content_key': 'title', 'content_value': 'My Published Works'},
            {'page_name': 'book_page', 'section_name': 'hero', 'content_key': 'subtitle', 'content_value': 'Each book represents years of research, real-world experience, and my deep passion for helping dogs and their families thrive together.'},
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'name', 'content_value': 'Author'},
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'title', 'content_value': 'Author'},
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'bio', 'content_value': 'Author information will appear here once books are added.'},
            {'page_name': 'book_page', 'section_name': 'author', 'content_key': 'quote', 'content_value': 'Welcome to our book collection.'},
            {'page_name': 'book_page', 'section_name': 'loading', 'content_key': 'title', 'content_value': 'Loading Books...'},
            {'page_name': 'book_page', 'section_name': 'loading', 'content_key': 'description', 'content_value': 'Please wait while we fetch the latest books and author information.'},
            {'page_name': 'book_page', 'section_name': 'error', 'content_key': 'title', 'content_value': 'Error Loading Books'},
            {'page_name': 'book_page', 'section_name': 'error', 'content_key': 'button_text', 'content_value': 'Try Again'},
            {'page_name': 'book_page', 'section_name': 'empty_state', 'content_key': 'title', 'content_value': 'No Books Available Yet'},
            {'page_name': 'book_page', 'section_name': 'empty_state', 'content_key': 'description', 'content_value': 'Books will appear here once they are added through the admin panel.'},
            {'page_name': 'book_page', 'section_name': 'empty_state', 'content_key': 'subtitle', 'content_value': 'Check back later or contact the administrator to add books.'},
        ]
        
        created_count = 0
        for content_item in default_content:
            for language in languages:
                # Check if translation already exists
                existing = Translation.query.filter_by(
                    page_name=content_item['page_name'],
                    section_name=content_item['section_name'],
                    content_key=content_item['content_key'],
                    language_code=language.code
                ).first()
                
                if not existing:
                    # Create translation
                    if language.code == 'en':  # English is the source
                        translation = Translation(
                            page_name=content_item['page_name'],
                            section_name=content_item['section_name'],
                            content_key=content_item['content_key'],
                            language_code=language.code,
                            content_value=content_item['content_value'],
                            content_type='text',
                            is_auto_translated=False,
                            translation_confidence=1.0,
                            needs_review=False
                        )
                    else:  # Other languages get auto-translated
                        translated_text = simulate_translation(
                            content_item['content_value'], 
                            'en', 
                            language.code
                        )
                        translation = Translation(
                            page_name=content_item['page_name'],
                            section_name=content_item['section_name'],
                            content_key=content_item['content_key'],
                            language_code=language.code,
                            content_value=translated_text,
                            content_type='text',
                            is_auto_translated=True,
                            translation_confidence=0.8,
                            needs_review=True
                        )
                    
                    db.session.add(translation)
                    created_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Initialized {created_count} default translations',
            'created_count': created_count
        })
        
    except Exception as e:
        logger.error(f"Initialize default translations error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to initialize default translations'
        }), 500

def simulate_translation(text, source_lang, target_lang):
    """Simulate translation - replace with real translation service"""
    # This is a placeholder - integrate with Google Translate, DeepL, etc.
    translations = {
        'it': {
            'My Published Works': 'Le Mie Opere Pubblicate',
            'Each book represents years of research': 'Ogni libro rappresenta anni di ricerca',
            'Author': 'Autore',
            'Loading Books...': 'Caricamento Libri...',
            'Error Loading Books': 'Errore nel Caricamento dei Libri',
            'Try Again': 'Riprova',
            'No Books Available Yet': 'Nessun Libro Disponibile Ancora',
            'Books will appear here': 'I libri appariranno qui',
            'Welcome to our book collection': 'Benvenuti nella nostra collezione di libri'
        },
        'es': {
            'My Published Works': 'Mis Obras Publicadas',
            'Each book represents years of research': 'Cada libro representa años de investigación',
            'Author': 'Autor',
            'Loading Books...': 'Cargando Libros...',
            'Error Loading Books': 'Error al Cargar Libros',
            'Try Again': 'Intentar de Nuevo',
            'No Books Available Yet': 'Aún No Hay Libros Disponibles',
            'Books will appear here': 'Los libros aparecerán aquí',
            'Welcome to our book collection': 'Bienvenidos a nuestra colección de libros'
        }
    }
    
    # Simple word-by-word translation simulation
    if target_lang in translations:
        for english, translated in translations[target_lang].items():
            if english.lower() in text.lower():
                text = text.replace(english, translated)
    
    return text


# =============================================================================
# ADMIN USER MANAGEMENT ENDPOINTS
# =============================================================================

@admin_bp.route('/users', methods=['GET'])
@login_required
def admin_get_users():
    """Get all users with pagination and filtering"""
    try:
        # Check admin permissions
        if not current_user.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 15, type=int)
        search = request.args.get('search', '', type=str)
        status_filter = request.args.get('status_filter', 'all', type=str)
        role_filter = request.args.get('role_filter', 'all', type=str)
        sort_by = request.args.get('sort_by', 'created_at', type=str)
        sort_order = request.args.get('sort_order', 'desc', type=str)
        
        # Build query
        query = User.query
        
        # Apply search filter
        if search:
            query = query.filter(
                db.or_(
                    User.name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )
        
        # Apply status filter
        if status_filter == 'active':
            query = query.filter(User.is_active == True)
        elif status_filter == 'inactive':
            query = query.filter(User.is_active == False)
        
        # Apply role filter
        if role_filter == 'admin':
            query = query.filter(User.admin_level.in_(['super_admin', 'admin', 'moderator']))
        elif role_filter == 'user':
            query = query.filter(User.admin_level == 'user')
        
        # Apply sorting
        if sort_by == 'created_at':
            if sort_order == 'desc':
                query = query.order_by(User.created_at.desc())
            else:
                query = query.order_by(User.created_at.asc())
        elif sort_by == 'name':
            if sort_order == 'desc':
                query = query.order_by(User.name.desc())
            else:
                query = query.order_by(User.name.asc())
        elif sort_by == 'email':
            if sort_order == 'desc':
                query = query.order_by(User.email.desc())
            else:
                query = query.order_by(User.email.asc())
        
        # Paginate results
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Format user data
        users = []
        for user in pagination.items:
            users.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'is_active': user.is_active,
                'admin_level': user.admin_level,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'email_verified': user.email_verified,
                'two_factor_enabled': user.two_factor_enabled
            })
        
        return jsonify({
            'success': True,
            'data': users,
            'meta': {
                'total': pagination.total,
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get users'
        }), 500


@admin_bp.route('/users/stats', methods=['GET'])
@login_required
def admin_get_user_stats():
    """Get user statistics"""
    try:
        # Check admin permissions
        if not current_user.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        # Get statistics
        total_users = User.query.count()
        active_users = User.query.filter(User.is_active == True).count()
        admin_users = User.query.filter(User.admin_level.in_(['super_admin', 'admin', 'moderator'])).count()
        
        # Recent registrations (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_registrations = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_users': total_users,
                'active_users': active_users,
                'admin_users': admin_users,
                'recent_registrations': recent_registrations
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user statistics'
        }), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
def admin_get_user(user_id):
    """Get a specific user by ID"""
    try:
        # Check admin permissions
        if not current_user.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        user = User.query.get_or_404(user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'is_active': user.is_active,
                'admin_level': user.admin_level,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'email_verified': user.email_verified,
                'two_factor_enabled': user.two_factor_enabled
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user'
        }), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
def admin_update_user(user_id):
    """Update a user"""
    try:
        # Check admin permissions
        if not current_user.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Update user fields
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            user.email = data['email']
        if 'admin_level' in data:
            user.admin_level = data['admin_level']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        security_log = SecurityLog(
            user_id=current_user.id,
            event_type='admin_user_update',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            details=f"Updated user {user.name} (ID: {user.id})",
            timestamp=datetime.utcnow()
        )
        db.session.add(security_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update user'
        }), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
def admin_delete_user(user_id):
    """Delete a user"""
    try:
        # Check admin permissions
        if not current_user.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        # Prevent deleting self
        if user_id == current_user.id:
            return jsonify({
                'success': False,
                'message': 'Cannot delete your own account'
            }), 400
        
        user = User.query.get_or_404(user_id)
        username = user.name
        
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        # Log the action
        security_log = SecurityLog(
            user_id=current_user.id,
            event_type='admin_user_delete',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            details=f"Deleted user {username} (ID: {user_id})",
            timestamp=datetime.utcnow()
        )
        db.session.add(security_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to delete user'
        }), 500


@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@login_required
def admin_toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        # Check admin permissions
        if not current_user.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        # Prevent toggling self
        if user_id == current_user.id:
            return jsonify({
                'success': False,
                'message': 'Cannot modify your own account status'
            }), 400
        
        user = User.query.get_or_404(user_id)
        
        # Toggle status
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        security_log = SecurityLog(
            user_id=current_user.id,
            event_type='admin_user_status_toggle',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            details=f"{'Activated' if user.is_active else 'Deactivated'} user {user.name} (ID: {user_id})",
            timestamp=datetime.utcnow()
        )
        db.session.add(security_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"User {'activated' if user.is_active else 'deactivated'} successfully",
            'is_active': user.is_active
        })
        
    except Exception as e:
        logger.error(f"Error toggling user status {user_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to toggle user status'
        }), 500


@admin_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@login_required
def admin_update_user_role(user_id):
    """Update user role"""
    try:
        # Check admin permissions
        if not current_user.is_admin_user():
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        
        # Prevent changing own role
        if user_id == current_user.id:
            return jsonify({
                'success': False,
                'message': 'Cannot modify your own role'
            }), 400
        
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data or 'admin_level' not in data:
            return jsonify({
                'success': False,
                'message': 'Admin level required'
            }), 400
        
        old_role = user.admin_level
        user.admin_level = data['admin_level']
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log the action
        security_log = SecurityLog(
            user_id=current_user.id,
            event_type='admin_user_role_change',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            details=f"Changed user {user.name} role from {old_role} to {user.admin_level}",
            timestamp=datetime.utcnow()
        )
        db.session.add(security_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User role updated successfully',
            'admin_level': user.admin_level
        })
        
    except Exception as e:
        logger.error(f"Error updating user role {user_id}: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to update user role'
        }), 500
