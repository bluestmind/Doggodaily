"""
Bulk operations routes for admin panel
"""
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from app.models import User, Story, GalleryItem, Tour, db
from app.auth.utils import TokenManager
import logging

logger = logging.getLogger(__name__)

bulk_bp = Blueprint('bulk', __name__)

@bulk_bp.route('/gallery', methods=['POST'])
@login_required
def bulk_gallery_action():
    """Perform bulk actions on gallery items (admin only)"""
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
        
        items = GalleryItem.query.filter(GalleryItem.id.in_(item_ids)).all()
        if not items:
            return jsonify({'success': False, 'message': 'No gallery items found'}), 404
        
        success_count = 0
        for item in items:
            try:
                if action == 'activate':
                    item.status = 'active'
                elif action == 'deactivate':
                    item.status = 'inactive'
                elif action == 'delete':
                    db.session.delete(item)
                elif action == 'feature':
                    # If GalleryItem model has featured field
                    if hasattr(item, 'featured'):
                        item.featured = True
                elif action == 'unfeature':
                    if hasattr(item, 'featured'):
                        item.featured = False
                else:
                    continue
                
                success_count += 1
            except Exception as e:
                logger.error(f"Bulk action error for gallery item {item.id}: {str(e)}")
                continue
        
        db.session.commit()
        
        # Log the bulk action
        TokenManager.log_security_event(
            current_user.id, 'bulk_gallery_action',
            f'Performed "{action}" on {success_count} gallery items'
        )
        
        return jsonify({
            'success': True, 
            'message': f'Bulk action "{action}" completed on {success_count} gallery items',
            'affected_count': success_count
        }), 200
        
    except Exception as e:
        logger.error(f"Bulk gallery action error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to perform bulk action'}), 500

@bulk_bp.route('/tours', methods=['POST'])
@login_required
def bulk_tour_action():
    """Perform bulk actions on tours (admin only)"""
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
        
        tours = Tour.query.filter(Tour.id.in_(item_ids)).all()
        if not tours:
            return jsonify({'success': False, 'message': 'No tours found'}), 404
        
        success_count = 0
        for tour in tours:
            try:
                if action == 'activate':
                    tour.status = 'active'
                elif action == 'deactivate':
                    tour.status = 'inactive'
                elif action == 'delete':
                    db.session.delete(tour)
                elif action == 'feature':
                    # If Tour model has featured field
                    if hasattr(tour, 'featured'):
                        tour.featured = True
                elif action == 'unfeature':
                    if hasattr(tour, 'featured'):
                        tour.featured = False
                else:
                    continue
                
                success_count += 1
            except Exception as e:
                logger.error(f"Bulk action error for tour {tour.id}: {str(e)}")
                continue
        
        db.session.commit()
        
        # Log the bulk action
        TokenManager.log_security_event(
            current_user.id, 'bulk_tour_action',
            f'Performed "{action}" on {success_count} tours'
        )
        
        return jsonify({
            'success': True, 
            'message': f'Bulk action "{action}" completed on {success_count} tours',
            'affected_count': success_count
        }), 200
        
    except Exception as e:
        logger.error(f"Bulk tour action error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to perform bulk action'}), 500

@bulk_bp.route('/users', methods=['POST'])
@login_required
def bulk_user_action():
    """Perform bulk actions on users (super admin only)"""
    try:
        user = User.query.get(current_user.id)
        if not user or user.admin_level != 'super_admin':
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        action = data.get('action')
        item_ids = data.get('item_ids', [])
        
        if not action or not item_ids:
            return jsonify({'success': False, 'message': 'Action and item IDs are required'}), 400
        
        users = User.query.filter(User.id.in_(item_ids)).all()
        if not users:
            return jsonify({'success': False, 'message': 'No users found'}), 404
        
        success_count = 0
        for target_user in users:
            try:
                # Prevent actions on super admins by other admins
                if target_user.admin_level == 'super_admin' and target_user.id != current_user.id:
                    continue
                
                if action == 'activate':
                    target_user.is_active = True
                elif action == 'deactivate':
                    target_user.is_active = False
                elif action == 'verify':
                    target_user.email_verified = True
                elif action == 'unverify':
                    target_user.email_verified = False
                else:
                    continue
                
                success_count += 1
            except Exception as e:
                logger.error(f"Bulk action error for user {target_user.id}: {str(e)}")
                continue
        
        db.session.commit()
        
        # Log the bulk action
        TokenManager.log_security_event(
            current_user.id, 'bulk_user_action',
            f'Performed "{action}" on {success_count} users'
        )
        
        return jsonify({
            'success': True, 
            'message': f'Bulk action "{action}" completed on {success_count} users',
            'affected_count': success_count
        }), 200
        
    except Exception as e:
        logger.error(f"Bulk user action error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to perform bulk action'}), 500