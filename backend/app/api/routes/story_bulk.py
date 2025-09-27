"""
Additional story routes for missing functionality
"""
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import User, Story, db
from app.auth.utils import TokenManager
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

story_extra_bp = Blueprint('story_extra', __name__)

@story_extra_bp.route('/<int:story_id>/unpublish', methods=['POST'])
@login_required
def unpublish_story(story_id):
    """Unpublish a story (change status to draft)"""
    try:
        story = Story.query.get(story_id)
        if not story:
            return jsonify({'success': False, 'message': 'Story not found'}), 404
        
        # Only allow author or admin to unpublish
        user = User.query.get(current_user.id)
        if story.author_id != current_user.id and not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        story.status = 'draft'
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Story unpublished successfully', 'data': story.to_dict()}), 200
    except Exception as e:
        logger.error(f"Unpublish story error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to unpublish story'}), 500

@story_extra_bp.route('/bulk-action', methods=['POST'])
@login_required
def bulk_story_action():
    """Perform bulk actions on stories (admin only)"""
    try:
        user = User.query.get(current_user.id)
        if not user or not user.is_admin_user():
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        action = data.get('action')
        item_ids = data.get('item_ids', [])
        
        if not action or not item_ids:
            return jsonify({'success': False, 'message': 'Action and item IDs are required'}), 400
        
        stories = Story.query.filter(Story.id.in_(item_ids)).all()
        if not stories:
            return jsonify({'success': False, 'message': 'No stories found'}), 404
        
        success_count = 0
        for story in stories:
            try:
                if action == 'publish':
                    story.status = 'published'
                    story.published_at = datetime.utcnow()
                elif action == 'unpublish':
                    story.status = 'draft'
                elif action == 'delete':
                    db.session.delete(story)
                elif action == 'feature':
                    story.is_featured = True
                elif action == 'unfeature':
                    story.is_featured = False
                else:
                    continue
                
                success_count += 1
            except Exception as e:
                logger.error(f"Bulk action error for story {story.id}: {str(e)}")
                continue
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': f'Bulk action "{action}" completed on {success_count} stories',
            'affected_count': success_count
        }), 200
        
    except Exception as e:
        logger.error(f"Bulk story action error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to perform bulk action'}), 500