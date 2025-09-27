"""
Admin story management API routes
"""
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import json

from ...extensions import db
from ...models_extended import UserStorySubmission, StoryMediaFile
from ...admin_security import admin_required
from ...utils.notification_helper import NotificationManager

# Create blueprint
admin_story_bp = Blueprint('admin_stories', __name__)

@admin_story_bp.route('/submissions', methods=['GET'])
@login_required
@admin_required()
def get_story_submissions():
    """Get all story submissions for admin review"""
    try:
        # Get filter parameters
        status = request.args.get('status', 'all')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '').strip()
        
        # Build query
        query = UserStorySubmission.query
        
        # Filter by status
        if status != 'all':
            query = query.filter(UserStorySubmission.status == status)
        
        # Search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    UserStorySubmission.title.ilike(search_term),
                    UserStorySubmission.location.ilike(search_term),
                    UserStorySubmission.category.ilike(search_term)
                )
            )
        
        # Order by creation date (newest first)
        query = query.order_by(UserStorySubmission.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        submissions = pagination.items
        
        # Convert to dict with additional info
        result = []
        for submission in submissions:
            submission_dict = submission.to_dict()
            
            # Add media count
            media_count = StoryMediaFile.query.filter_by(submission_id=submission.id).count()
            submission_dict['media_count'] = media_count
            
            # Add time since submission
            time_diff = datetime.utcnow() - submission.created_at
            if time_diff.days > 0:
                submission_dict['time_since'] = f"{time_diff.days} days ago"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                submission_dict['time_since'] = f"{hours} hours ago"
            else:
                minutes = max(1, time_diff.seconds // 60)
                submission_dict['time_since'] = f"{minutes} minutes ago"
            
            result.append(submission_dict)
        
        return jsonify({
            'success': True,
            'submissions': result,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_prev': pagination.has_prev,
                'has_next': pagination.has_next
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting story submissions: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load submissions'}), 500

@admin_story_bp.route('/submissions/<int:submission_id>', methods=['GET'])
@login_required
@admin_required()
def get_submission_details():
    """Get detailed information about a specific submission"""
    try:
        submission = UserStorySubmission.query.get_or_404(submission_id)
        
        # Get submission details
        submission_dict = submission.to_dict()
        
        # Get media files
        media_files = StoryMediaFile.query.filter_by(
            submission_id=submission.id
        ).order_by(StoryMediaFile.order_index).all()
        
        submission_dict['media_files'] = [media.to_dict() for media in media_files]
        
        return jsonify({
            'success': True,
            'submission': submission_dict
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting submission details: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load submission details'}), 500

@admin_story_bp.route('/submissions/<int:submission_id>/approve', methods=['POST'])
@login_required
@admin_required()
def approve_submission(submission_id):
    """Approve a story submission"""
    try:
        submission = UserStorySubmission.query.get_or_404(submission_id)
        
        if submission.status != 'pending':
            return jsonify({'success': False, 'message': 'Only pending submissions can be approved'}), 400
        
        # Get admin notes if provided
        data = request.get_json() or {}
        admin_notes = data.get('admin_notes', '').strip()
        
        # Approve the submission
        story = submission.approve(current_user, admin_notes)
        
        # Create notification for the user
        NotificationManager.create_notification(
            user_id=submission.user_id,
            title='Story Approved! 🎉',
            message=f'Your story "{submission.title}" has been approved and published!',
            type='success',
            action_url=f'/stories/{story.id}'
        )
        
        # Log admin activity
        NotificationManager.log_activity(
            user_id=current_user.id,
            action='story_approved',
            description=f'Approved story submission "{submission.title}" by {submission.user.name}',
            entity_type='story_submission',
            entity_id=str(submission.id)
        )
        
        return jsonify({
            'success': True,
            'message': 'Story approved and published successfully',
            'story_id': story.id
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving submission: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to approve submission'}), 500

@admin_story_bp.route('/submissions/<int:submission_id>/reject', methods=['POST'])
@login_required
@admin_required()
def reject_submission(submission_id):
    """Reject a story submission"""
    try:
        submission = UserStorySubmission.query.get_or_404(submission_id)
        
        if submission.status != 'pending':
            return jsonify({'success': False, 'message': 'Only pending submissions can be rejected'}), 400
        
        # Get rejection data
        data = request.get_json() or {}
        rejection_reason = data.get('rejection_reason', '').strip()
        admin_notes = data.get('admin_notes', '').strip()
        
        if not rejection_reason:
            return jsonify({'success': False, 'message': 'Rejection reason is required'}), 400
        
        # Reject the submission
        submission.reject(current_user, rejection_reason, admin_notes)
        
        # Create notification for the user
        NotificationManager.create_notification(
            user_id=submission.user_id,
            title='Story Submission Update',
            message=f'Your story "{submission.title}" requires revision. Please check your submissions for details.',
            type='warning',
            action_url='/profile?tab=stories'
        )
        
        # Log admin activity
        NotificationManager.log_activity(
            user_id=current_user.id,
            action='story_rejected',
            description=f'Rejected story submission "{submission.title}" by {submission.user.name}',
            entity_type='story_submission',
            entity_id=str(submission.id)
        )
        
        return jsonify({
            'success': True,
            'message': 'Story rejected successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting submission: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to reject submission'}), 500

@admin_story_bp.route('/submissions/stats', methods=['GET'])
@login_required
@admin_required()
def get_submission_stats():
    """Get story submission statistics"""
    try:
        # Get counts by status
        pending_count = UserStorySubmission.query.filter_by(status='pending').count()
        approved_count = UserStorySubmission.query.filter_by(status='approved').count()
        rejected_count = UserStorySubmission.query.filter_by(status='rejected').count()
        total_count = UserStorySubmission.query.count()
        
        # Get recent submissions (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = UserStorySubmission.query.filter(
            UserStorySubmission.created_at >= week_ago
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'pending': pending_count,
                'approved': approved_count,
                'rejected': rejected_count,
                'total': total_count,
                'recent_week': recent_count
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting submission stats: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to load stats'}), 500