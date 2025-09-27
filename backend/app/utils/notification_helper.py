"""
Helper functions for creating and managing notifications
"""
from datetime import datetime, timedelta
from ..models_extended import Notification, Message, ActivityLog
from ..extensions import db
import logging

logger = logging.getLogger(__name__)

class NotificationManager:
    """Manages creation and distribution of notifications"""
    
    @staticmethod
    def create_system_notification(title, message, notification_type='info', priority='normal'):
        """Create a system-wide notification for all admin users"""
        try:
            notification = Notification(
                user_id=None,  # System notification
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                is_system=True
            )
            db.session.add(notification)
            db.session.commit()
            logger.info(f"Created system notification: {title}")
            return notification
        except Exception as e:
            logger.error(f"Failed to create system notification: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def create_user_notification(user_id, title, message, notification_type='info', priority='normal', action_url=None):
        """Create a notification for a specific user"""
        try:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                action_url=action_url,
                is_system=False
            )
            db.session.add(notification)
            db.session.commit()
            logger.info(f"Created user notification for user {user_id}: {title}")
            return notification
        except Exception as e:
            logger.error(f"Failed to create user notification: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def log_activity(user_id, action, description, entity_type=None, entity_id=None, extra_data=None, ip_address=None, user_agent=None):
        """Log activity for the admin dashboard"""
        try:
            activity = ActivityLog(
                user_id=user_id,
                action=action,
                description=description,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else None,
                extra_data=extra_data,
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.session.add(activity)
            db.session.commit()
            logger.info(f"Logged activity: {action} by user {user_id}")
            return activity
        except Exception as e:
            logger.error(f"Failed to log activity: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def create_message_notification(message_id):
        """Create notification when a new message is received"""
        try:
            message = Message.query.get(message_id)
            if not message:
                return None
            
            title = f"New message: {message.subject}"
            notification_message = f"From: {message.sender_name} ({message.sender_email})"
            
            # Create system notification for all admins
            return NotificationManager.create_system_notification(
                title=title,
                message=notification_message,
                notification_type='info',
                priority='normal'
            )
        except Exception as e:
            logger.error(f"Failed to create message notification: {str(e)}")
            return None
    
    @staticmethod
    def cleanup_old_notifications(days=30):
        """Clean up old notifications"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            old_notifications = Notification.query.filter(
                Notification.created_at < cutoff_date,
                Notification.is_read == True
            ).all()
            
            count = len(old_notifications)
            for notification in old_notifications:
                db.session.delete(notification)
            
            db.session.commit()
            logger.info(f"Cleaned up {count} old notifications")
            return count
        except Exception as e:
            logger.error(f"Failed to cleanup old notifications: {str(e)}")
            db.session.rollback()
            return 0
    
    @staticmethod
    def get_unread_count(user_id):
        """Get unread notification count for a user"""
        try:
            return Notification.query.filter(
                (Notification.user_id == user_id) | (Notification.is_system == True),
                Notification.is_read == False
            ).count()
        except Exception as e:
            logger.error(f"Failed to get unread count: {str(e)}")
            return 0