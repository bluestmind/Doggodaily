"""
Extended models for admin panel real-time features
"""
from datetime import datetime, timedelta
from .extensions import db
from .models import User
import json

class Notification(db.Model):
    """User notifications system"""
    __tablename__ = 'admin_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # info, warning, error, success
    action_url = db.Column(db.String(500), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    is_system = db.Column(db.Boolean, default=False)  # System notifications vs user notifications
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'action_url': self.action_url,
            'is_read': self.is_read,
            'is_system': self.is_system,
            'priority': self.priority,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None
        }
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.read_at = datetime.utcnow()
        db.session.commit()

class Message(db.Model):
    """Contact messages and communications"""
    __tablename__ = 'admin_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_name = db.Column(db.String(100), nullable=False)
    sender_email = db.Column(db.String(120), nullable=False)
    sender_phone = db.Column(db.String(20), nullable=True)
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False, default='contact')  # contact, booking, complaint, etc.
    status = db.Column(db.String(20), default='unread')  # unread, read, replied, resolved
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    replied_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    
    def to_dict(self):
        return {
            'id': self.id,
            'sender_name': self.sender_name,
            'sender_email': self.sender_email,
            'sender_phone': self.sender_phone,
            'subject': self.subject,
            'message': self.message,
            'type': self.type,
            'status': self.status,
            'priority': self.priority,
            'assigned_to': self.assigned_to,
            'assigned_user': self.assigned_user.to_dict() if self.assigned_user else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'replied_at': self.replied_at.isoformat() if self.replied_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }
    
    def mark_as_read(self):
        """Mark message as read"""
        if self.status == 'unread':
            self.status = 'read'
            self.updated_at = datetime.utcnow()
            db.session.commit()
    
    def mark_as_replied(self):
        """Mark message as replied"""
        self.status = 'replied'
        self.replied_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def mark_as_resolved(self):
        """Mark message as resolved"""
        self.status = 'resolved'
        self.resolved_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()

class ActivityLog(db.Model):
    """Real-time activity logging for dashboard"""
    __tablename__ = 'admin_activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    entity_type = db.Column(db.String(50), nullable=True)  # story, tour, user, etc.
    entity_id = db.Column(db.String(50), nullable=True)
    extra_data = db.Column(db.Text, nullable=True)  # JSON string for additional data
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'action': self.action,
            'description': self.description,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'extra_data': self._safe_json_parse(self.extra_data, {}),
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat()
        }
    
    def _safe_json_parse(self, value, default=None):
        """Safely parse JSON string or return default"""
        if not value:
            return default
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value if value else default

class ViewTracker(db.Model):
    """Track page views and interactions for analytics"""
    __tablename__ = 'view_tracker'
    
    id = db.Column(db.Integer, primary_key=True)
    page_type = db.Column(db.String(50), nullable=False)  # story, gallery, tour, etc.
    page_id = db.Column(db.String(50), nullable=True)  # ID of the specific item
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    referrer = db.Column(db.String(500), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'page_type': self.page_type,
            'page_id': self.page_id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'referrer': self.referrer,
            'timestamp': self.timestamp.isoformat()
        }

class LikeTracker(db.Model):
    """Track likes across different entities"""
    __tablename__ = 'like_tracker'
    
    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(50), nullable=False)  # story, gallery, etc.
    entity_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Composite unique constraint
    __table_args__ = (db.UniqueConstraint('entity_type', 'entity_id', 'user_id', name='unique_user_like'),)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat()
        }

class UserStorySubmission(db.Model):
    """User story submissions awaiting approval"""
    __tablename__ = 'user_story_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200), nullable=True)
    category = db.Column(db.String(50), nullable=False)
    tags = db.Column(db.Text, nullable=True)  # JSON string of tags
    media_files = db.Column(db.Text, nullable=True)  # JSON string of media file paths
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, approved, rejected
    rejection_reason = db.Column(db.Text, nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    published_story_id = db.Column(db.Integer, nullable=True)  # Reference to published story
    terms_accepted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='story_submissions')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'location': self.location,
            'category': self.category,
            'tags': json.loads(self.tags) if self.tags else [],
            'media_files': json.loads(self.media_files) if self.media_files else [],
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'admin_notes': self.admin_notes,
            'reviewed_by': self.reviewed_by,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'published_story_id': self.published_story_id,
            'terms_accepted': self.terms_accepted,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'user_name': self.user.name if self.user else None,
            'reviewer_name': self.reviewer.name if self.reviewer else None
        }

    def approve(self, admin_user_id, admin_notes=None):
        """Approve the story submission"""
        self.status = 'approved'
        self.reviewed_by = admin_user_id
        self.reviewed_at = datetime.utcnow()
        if admin_notes:
            self.admin_notes = admin_notes
        db.session.commit()

    def reject(self, admin_user_id, rejection_reason, admin_notes=None):
        """Reject the story submission"""
        self.status = 'rejected'
        self.reviewed_by = admin_user_id
        self.reviewed_at = datetime.utcnow()
        self.rejection_reason = rejection_reason
        if admin_notes:
            self.admin_notes = admin_notes
        db.session.commit()

class StoryMediaFile(db.Model):
    """Media files associated with story submissions"""
    __tablename__ = 'story_media_files'
    
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('user_story_submissions.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # image, video
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    submission = db.relationship('UserStorySubmission', backref='media_files_rel')

    def to_dict(self):
        return {
            'id': self.id,
            'submission_id': self.submission_id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat()
        }