from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import pyotp
import json
from .extensions import db
from enum import Enum

def generate_upload_url(filename):
    """Generate HTTPS URL for uploaded files using the production domain"""
    from flask import current_app
    
    # Check if we're in production mode
    if current_app.config.get('PREFERRED_URL_SCHEME') == 'https':
        # Use production domain for HTTPS URLs
        base_url = 'https://doggodaiily.com'
    else:
        # Use development URL
        base_url = current_app.config.get('BASE_URL', 'http://localhost:5000')
    
    return f"{base_url}/uploads/{filename}"

class PermissionLevel(Enum):
    """Admin permission levels"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    VIEWER = "viewer"

class User(UserMixin, db.Model):
    """Enhanced user model with comprehensive security features"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    admin_level = db.Column(db.String(20), default='user')
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(255), nullable=True)
    email_verification_expires = db.Column(db.DateTime, nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    # Enhanced security fields
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(255), nullable=True)
    backup_codes = db.Column(db.Text, nullable=True)  # JSON array of backup codes
    
    # Account security
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime, nullable=True)
    account_locked_until = db.Column(db.DateTime, nullable=True)
    requires_password_change = db.Column(db.Boolean, default=False)
    password_changed_at = db.Column(db.DateTime, nullable=True)
    
    # Password reset
    reset_password_token = db.Column(db.String(255), nullable=True)
    reset_password_expires = db.Column(db.DateTime, nullable=True)
    
    # Activity tracking
    last_login = db.Column(db.DateTime, nullable=True)
    login_count = db.Column(db.Integer, default=0)
    last_ip_address = db.Column(db.String(45), nullable=True)
    last_user_agent = db.Column(db.Text, nullable=True)
    
    # Profile fields
    bio = db.Column(db.Text, nullable=True)
    avatar_path = db.Column(db.String(500), nullable=True)
    preferences = db.Column(db.Text, nullable=True)  # JSON string
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Set password with enhanced security"""
        self.password_hash = generate_password_hash(password)
        self.password_changed_at = datetime.utcnow()
        self.requires_password_change = False
    
    def check_password(self, password):
        """Check password with enhanced security"""
        return check_password_hash(self.password_hash, password)
    
    def is_admin_user(self):
        """Check if user has admin privileges"""
        admin_levels = ['super_admin', 'admin', 'moderator']
        return self.admin_level in admin_levels
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if not self.account_locked_until:
            return False
        return datetime.utcnow() < self.account_locked_until
    
    def lock_account(self, duration_minutes=30):
        """Lock account for specified duration"""
        self.account_locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        db.session.commit()
    
    def unlock_account(self):
        """Unlock account"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        db.session.commit()
    
    def increment_failed_attempts(self):
        """Increment failed login attempts"""
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.utcnow()
        db.session.commit()
    
    def reset_failed_attempts(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.account_locked_until = None
        db.session.commit()
    
    # 2FA Methods
    def generate_2fa_secret(self):
        """Generate 2FA secret"""
        import pyotp
        self.two_factor_secret = pyotp.random_base32()
        return self.two_factor_secret
    
    def get_2fa_qr_code(self):
        """Generate QR code URL for 2FA setup"""
        import pyotp
        if not self.two_factor_secret:
            return None
        
        totp = pyotp.TOTP(self.two_factor_secret)
        provisioning_uri = totp.provisioning_uri(
            name=self.email,
            issuer_name="DoggoDaily"
        )
        return provisioning_uri
    
    def verify_2fa_token(self, token):
        """Verify 2FA token"""
        import pyotp
        if not self.two_factor_secret:
            return False
        
        totp = pyotp.TOTP(self.two_factor_secret)
        return totp.verify(token)
    
    def generate_backup_codes(self):
        """Generate backup codes for 2FA"""
        import secrets
        codes = [secrets.token_hex(4).upper() for _ in range(8)]
        self.backup_codes = json.dumps(codes)
        return codes
    
    def verify_backup_code(self, code):
        """Verify backup code"""
        if not self.backup_codes:
            return False
        
        try:
            codes = json.loads(self.backup_codes)
            if code.upper() in codes:
                # Remove used code
                codes.remove(code.upper())
                self.backup_codes = json.dumps(codes)
                db.session.commit()
                return True
        except (json.JSONDecodeError, ValueError):
            pass
        
        return False
    
    @property
    def avatar_url(self):
        """Get avatar URL"""
        if self.avatar_path:
            return f"/uploads/avatars/{self.avatar_path.split('/')[-1]}"
        return None
    
    def to_dict(self):
        """Convert user to dictionary with enhanced security"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'admin_level': self.admin_level,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'two_factor_enabled': self.two_factor_enabled,
            'requires_password_change': self.requires_password_change,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'preferences': self._safe_json_parse(self.preferences, {})
        }
    
    def _safe_json_parse(self, value, default=None):
        """Safely parse JSON string or return default"""
        if not value:
            return default
        try:
            import json
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value if value else default
    
    def get_active_sessions_count(self):
        """Get count of active sessions"""
        return UserSession.query.filter_by(
            user_id=self.id,
            is_active=True
        ).count()
    
    def end_all_sessions(self, exclude_session_id=None):
        """End all sessions for this user"""
        query = UserSession.query.filter_by(
            user_id=self.id,
            is_active=True
        )
        
        if exclude_session_id:
            query = query.filter(UserSession.id != exclude_session_id)
        
        sessions = query.all()
        for session in sessions:
            session.is_active = False
            session.ended_at = datetime.utcnow()
        
        db.session.commit()
        return len(sessions)

class Story(db.Model):
    __tablename__ = 'stories'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    preview = db.Column(db.String(500), nullable=True)  # Short preview text
    thumbnail = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(50), nullable=False, default='general')
    language = db.Column(db.String(5), nullable=False, default='en')  # en, it
    status = db.Column(db.String(20), default='draft')  # draft, pending, published, rejected, archived
    is_featured = db.Column(db.Boolean, default=False)
    views = db.Column(db.Integer, default=0)
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    reading_time = db.Column(db.Integer, default=0)  # in minutes
    tags = db.Column(db.String(255), nullable=True)  # comma-separated tags
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = db.Column(db.DateTime, nullable=True)
    
    # Submission tracking fields
    submitted_at = db.Column(db.DateTime, nullable=True)  # When user submitted for review
    reviewed_at = db.Column(db.DateTime, nullable=True)   # When admin reviewed
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Admin who reviewed
    rejection_reason = db.Column(db.Text, nullable=True)  # Reason for rejection
    admin_notes = db.Column(db.Text, nullable=True)       # Admin notes
    
    # Media files information (JSON string)
    media_files = db.Column(db.Text, nullable=True)       # JSON string of media files info
    
    # Relationships
    author = db.relationship('User', backref=db.backref('stories', lazy=True), foreign_keys=[user_id])
    reviewer = db.relationship('User', backref=db.backref('reviewed_stories', lazy=True), foreign_keys=[reviewed_by])
    likes = db.relationship('StoryLike', backref='story', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='story', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_content=False):
        from flask import url_for
        
        # Generate thumbnail URL if thumbnail exists
        thumbnail_url = None
        if self.thumbnail:
            try:
                # Handle different thumbnail path formats
                if self.thumbnail.startswith('http'):
                    thumbnail_url = self.thumbnail  # Already a full URL
                elif 'uploads/' in self.thumbnail:
                    # Extract relative path for url_for
                    thumb_rel = self.thumbnail.split('uploads/', 1)[1] if 'uploads/' in self.thumbnail else self.thumbnail
                    thumbnail_url = generate_upload_url(thumb_rel)
                else:
                    # Assume it's a relative path
                    thumbnail_url = generate_upload_url(self.thumbnail)
            except Exception as e:
                print(f"❌ Story thumbnail URL generation failed: {e}")
                # Fallback: construct URL manually
                if self.thumbnail and not self.thumbnail.startswith('http'):
                    from flask import current_app
                    base_url = current_app.config.get('BASE_URL', 'https://doggodaiily.com')
                    if 'uploads/' in self.thumbnail:
                        thumbnail_url = f"{base_url}/{self.thumbnail}"
                    else:
                        thumbnail_url = f"{base_url}/uploads/{self.thumbnail}"
                else:
                    thumbnail_url = self.thumbnail
        
        # Parse media files JSON
        media_files_data = []
        if self.media_files:
            try:
                import json
                media_files_data = json.loads(self.media_files)
            except (json.JSONDecodeError, TypeError):
                media_files_data = []
        
        data = {
            'id': self.id,
            'title': self.title,
            'preview': self.preview,
            'thumbnail': self.thumbnail,
            'thumbnail_url': thumbnail_url,
            'category': self.category,
            'language': self.language,
            'status': self.status,
            'is_featured': self.is_featured,
            'views': self.views,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'reading_time': self.reading_time,
            'tags': self.tags.split(',') if self.tags else [],
            'author': self.author.to_dict() if self.author else None,
            'reviewer': self.reviewer.to_dict() if self.reviewer else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'rejection_reason': self.rejection_reason,
            'admin_notes': self.admin_notes,
            'media_files': media_files_data
        }
        if include_content:
            data['content'] = self.content
        return data

class StoryLike(db.Model):
    __tablename__ = 'story_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    story_id = db.Column(db.Integer, db.ForeignKey('stories.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'story_id', name='unique_user_story_like'),)

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    story_id = db.Column(db.Integer, db.ForeignKey('stories.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)  # For nested comments
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    author = db.relationship('User', backref=db.backref('comments', lazy=True), foreign_keys=[user_id])
    # Self-referencing relationship for nested comments
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy=True)

    def to_dict(self, include_replies=False):
        data = {
            'id': self.id,
            'content': self.content,
            'author': self.author.to_dict() if self.author else None,
            'parent_id': self.parent_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_replies:
            data['replies'] = [reply.to_dict() for reply in self.replies if reply.is_active]
        return data

class GalleryLike(db.Model):
    __tablename__ = 'gallery_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for anonymous users
    gallery_item_id = db.Column(db.Integer, db.ForeignKey('gallery_items.id'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)  # Store IP for anonymous users
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'gallery_item_id', name='unique_user_gallery_like'),
        db.UniqueConstraint('ip_address', 'gallery_item_id', name='unique_ip_gallery_like'),
    )

class GalleryItem(db.Model):
    __tablename__ = 'gallery_items'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # in bytes
    file_type = db.Column(db.String(10), nullable=False)  # image, video
    mime_type = db.Column(db.String(100), nullable=False)
    thumbnail = db.Column(db.String(500), nullable=True)
    category = db.Column(db.String(50), nullable=False, default='general')
    tags = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='active')  # active, archived, deleted
    homepage_featured = db.Column(db.Boolean, default=False)  # Featured on homepage
    views = db.Column(db.Integer, default=0)
    downloads = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)
    width = db.Column(db.Integer, nullable=True)  # for images/videos
    height = db.Column(db.Integer, nullable=True)  # for images/videos
    duration = db.Column(db.Integer, nullable=True)  # for videos in seconds
    location = db.Column(db.String(255), nullable=True)  # photo location
    photographer = db.Column(db.String(100), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    uploader = db.relationship('User', backref=db.backref('gallery_items', lazy=True), foreign_keys=[user_id])
    likes_rel = db.relationship('GalleryLike', backref='gallery_item', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        from flask import url_for
        # Build file URL served via main blueprint
        path = self.file_path or ''
        # Expect stored like 'uploads/gallery/filename' -> need 'gallery/filename'
        rel = path.split('uploads/', 1)[1] if 'uploads/' in path else path
        
        print(f"🔍 to_dict() for item {self.id}:")
        print(f"  📁 file_path: {path}")
        print(f"  📁 rel: {rel}")
        
        try:
            file_url = generate_upload_url(rel) if rel else None
            print(f"  🔗 Generated URL: {file_url}")
        except Exception as e:
            print(f"  ❌ URL generation failed: {e}")
            # Fallback: construct URL manually
            if rel:
                from flask import current_app
                base_url = current_app.config.get('BASE_URL', 'https://doggodaiily.com')
                file_url = f"{base_url}/uploads/{rel}"
                print(f"  🔗 Fallback URL: {file_url}")
            else:
                file_url = None

        # Generate thumbnail URL if thumbnail exists
        thumbnail_url = None
        if self.thumbnail:
            try:
                thumb_rel = self.thumbnail.split('uploads/', 1)[1] if 'uploads/' in self.thumbnail else self.thumbnail
                thumbnail_url = generate_upload_url(thumb_rel)
            except Exception as e:
                print(f"  ❌ Thumbnail URL generation failed: {e}")
                thumbnail_url = None

        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'file_path': self.file_path,
            'file_url': file_url,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'mime_type': self.mime_type,
            'thumbnail': self.thumbnail,
            'thumbnail_url': thumbnail_url,
            'category': self.category,
            'tags': self.tags.split(',') if self.tags else [],
            'status': self.status,
            'homepage_featured': self.homepage_featured,
            'views': self.views,
            'downloads': self.downloads,
            'likes': self.likes,
            'width': self.width,
            'height': self.height,
            'duration': self.duration,
            'location': self.location,
            'photographer': self.photographer,
            'uploader': self.uploader.to_dict() if self.uploader else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Tour(db.Model):
    __tablename__ = 'tours'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # English fields
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    short_description = db.Column(db.String(500), nullable=True)
    location = db.Column(db.String(255), nullable=False)
    
    # Italian fields
    title_it = db.Column(db.String(255), nullable=True)
    description_it = db.Column(db.Text, nullable=True)
    short_description_it = db.Column(db.String(500), nullable=True)
    location_it = db.Column(db.String(255), nullable=True)
    
    # Common fields
    date = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in hours
    max_capacity = db.Column(db.Integer, nullable=False)
    current_bookings = db.Column(db.Integer, default=0)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    guide_name = db.Column(db.String(100), nullable=False)
    guide_contact = db.Column(db.String(255), nullable=True)
    tour_type = db.Column(db.String(50), nullable=False, default='group')  # group, private
    difficulty_level = db.Column(db.String(20), nullable=False, default='easy')  # easy, moderate, hard
    includes = db.Column(db.Text, nullable=True)  # JSON string of included items
    requirements = db.Column(db.Text, nullable=True)  # JSON string of requirements
    image = db.Column(db.String(500), nullable=True)  # Main tour image
    thumbnail = db.Column(db.String(500), nullable=True)
    gallery = db.Column(db.Text, nullable=True)  # JSON string of image URLs
    status = db.Column(db.String(20), default='active')  # active, cancelled, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    bookings = db.relationship('TourBooking', backref='tour', lazy=True, cascade='all, delete-orphan')

    @property
    def is_full(self):
        return self.current_bookings >= self.max_capacity

    @property
    def occupancy_percentage(self):
        if self.max_capacity == 0:
            return 0
        return (self.current_bookings / self.max_capacity) * 100

    def to_dict(self, include_bookings=False, language='en'):
        import json
        from flask import url_for
        
        # Get language-specific content
        if language == 'it':
            title = self.title_it or self.title
            description = self.description_it or self.description
            short_description = self.short_description_it or self.short_description
            location = self.location_it or self.location
        else:  # Default to English
            title = self.title
            description = self.description
            short_description = self.short_description
            location = self.location
        
        # Generate image URL
        image_url = None
        if self.image:
            try:
                # Handle different path formats
                if self.image.startswith('uploads/'):
                    # Remove 'uploads/' prefix if present
                    rel_path = self.image.split('uploads/', 1)[1]
                else:
                    rel_path = self.image
                
                image_url = generate_upload_url(rel_path)
            except:
                # Fallback to direct URL construction
                from flask import current_app
                base_url = current_app.config.get('BASE_URL', 'https://doggodaiily.com')
                if self.image.startswith('uploads/'):
                    image_url = f"{base_url}/{self.image}"
                else:
                    image_url = f"{base_url}/uploads/{self.image}"
        
        data = {
            'id': self.id,
            'title': title,
            'description': description,
            'short_description': short_description,
            'location': location,
            'date': self.date.isoformat(),
            'duration': self.duration,
            'max_capacity': self.max_capacity,
            'current_bookings': self.current_bookings,
            'price': float(self.price),
            'guide_name': self.guide_name,
            'guide_contact': self.guide_contact,
            'tour_type': self.tour_type,
            'difficulty_level': self.difficulty_level,
            'includes': self._safe_json_parse(self.includes, []),
            'requirements': self._safe_json_parse(self.requirements, []),
            'image': self.image,
            'image_url': image_url,
            'thumbnail': self.thumbnail,
            'gallery': self._safe_json_parse(self.gallery, []),
            'status': self.status,
            'is_full': self.is_full,
            'occupancy_percentage': self.occupancy_percentage,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_bookings:
            data['bookings'] = [booking.to_dict() for booking in self.bookings]
        return data

    def _safe_json_parse(self, value, default=None):
        """Safely parse JSON string or return default"""
        if not value:
            return default
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            # If it's not valid JSON, return as string or default
            return value if value else default

class TourBooking(db.Model):
    __tablename__ = 'tour_bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    tour_id = db.Column(db.Integer, db.ForeignKey('tours.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    guest_name = db.Column(db.String(100), nullable=False)
    guest_email = db.Column(db.String(120), nullable=False)
    guest_phone = db.Column(db.String(20), nullable=True)
    number_of_guests = db.Column(db.Integer, default=1)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    special_requests = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='confirmed')  # pending, confirmed, cancelled, completed
    payment_status = db.Column(db.String(20), default='pending')  # pending, paid, refunded
    booking_reference = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', backref=db.backref('user_tour_bookings', lazy=True), foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'tour': self.tour.to_dict() if self.tour else None,
            'user': self.user.to_dict() if self.user else None,
            'guest_name': self.guest_name,
            'guest_email': self.guest_email,
            'guest_phone': self.guest_phone,
            'number_of_guests': self.number_of_guests,
            'total_price': float(self.total_price),
            'special_requests': self.special_requests,
            'status': self.status,
            'payment_status': self.payment_status,
            'booking_reference': self.booking_reference,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Analytics(db.Model):
    __tablename__ = 'analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, index=True)
    metric_type = db.Column(db.String(50), nullable=False)  # page_views, user_registrations, etc.
    metric_value = db.Column(db.Integer, default=0)
    additional_data = db.Column(db.Text, nullable=True)  # JSON string for extra data
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'metric_type': self.metric_type,
            'metric_value': self.metric_value,
            'additional_data': self._safe_json_parse(self.additional_data, {}),
            'created_at': self.created_at.isoformat()
        }

    def _safe_json_parse(self, value, default=None):
        """Safely parse JSON string or return default"""
        if not value:
            return default
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            # If it's not valid JSON, return as string or default
            return value if value else default

class SecurityLog(db.Model):
    """Enhanced security logging for monitoring suspicious activities"""
    __tablename__ = 'security_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    event_type = db.Column(db.String(100), nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='security_logs')
    
    def __repr__(self):
        return f'<SecurityLog {self.event_type} for user {self.user_id}>'

class UserSession(db.Model):
    """Enhanced user session management"""
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    access_token_jti = db.Column(db.String(255), nullable=False, unique=True)
    refresh_token_jti = db.Column(db.String(255), nullable=True)
    device_fingerprint = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    ended_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='sessions')
    
    def __repr__(self):
        return f'<UserSession {self.id} for user {self.user_id}>'
    
    def is_expired(self):
        """Check if session is expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
        db.session.commit()

class BlacklistedToken(db.Model):
    """Track blacklisted JWT tokens for security"""
    __tablename__ = 'blacklisted_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), unique=True, nullable=False)  # JWT ID
    token_type = db.Column(db.String(10), nullable=False)  # access or refresh
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    revoked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    reason = db.Column(db.String(100), nullable=True)  # logout, security, admin, etc. 

class AdminAuditLog(db.Model):
    """Admin actions audit trail"""
    __tablename__ = 'admin_audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    admin_username = db.Column(db.String(255), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    target_type = db.Column(db.String(50))  # user, story, tour, etc.
    target_id = db.Column(db.String(50))
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    details = db.Column(db.Text)  # JSON string with additional details
    severity = db.Column(db.String(20), default='info')  # info, warning, error
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    admin_user = db.relationship('User', foreign_keys=[admin_user_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'admin_user_id': self.admin_user_id,
            'admin_username': self.admin_username,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'details': self._safe_json_parse(self.details, None),
            'severity': self.severity,
            'timestamp': self.timestamp.isoformat()
        }

    def _safe_json_parse(self, value, default=None):
        """Safely parse JSON string or return default"""
        if not value:
            return default
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            # If it's not valid JSON, return as string or default
            return value if value else default

class SecurityAlert(db.Model):
    """Security monitoring alerts"""
    __tablename__ = 'security_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved = db.Column(db.Boolean, default=False)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    resolver = db.relationship('User', foreign_keys=[resolved_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'description': self.description,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'timestamp': self.timestamp.isoformat(),
            'resolved': self.resolved,
            'resolved_by': self.resolved_by,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes
        }

class SystemConfig(db.Model):
    """System configuration settings"""
    __tablename__ = 'system_configs'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    data_type = db.Column(db.String(20), default='string')  # string, int, bool, json
    description = db.Column(db.Text)
    is_sensitive = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    updater = db.relationship('User', foreign_keys=[updated_by])
    
    def get_value(self):
        """Get typed value"""
        if self.data_type == 'int':
            return int(self.value) if self.value else 0
        elif self.data_type == 'bool':
            return self.value.lower() in ['true', '1', 'yes'] if self.value else False
        elif self.data_type == 'json':
            return self._safe_json_parse(self.value, {})
        else:
            return self.value

    def _safe_json_parse(self, value, default=None):
        """Safely parse JSON string or return default"""
        if not value:
            return default
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            # If it's not valid JSON, return as string or default
            return value if value else default
    
    def set_value(self, value):
        """Set typed value"""
        if self.data_type == 'json':
            self.value = json.dumps(value)
        else:
            self.value = str(value)
    
    def to_dict(self, include_sensitive=False):
        return {
            'id': self.id,
            'key': self.key,
            'value': '***HIDDEN***' if self.is_sensitive and not include_sensitive else self.get_value(),
            'data_type': self.data_type,
            'description': self.description,
            'is_sensitive': self.is_sensitive,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'updated_by': self.updated_by
        }

class Message(db.Model):
    """User messages and admin responses"""
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Nullable for anonymous messages
    sender_name = db.Column(db.String(100), nullable=False)
    sender_email = db.Column(db.String(120), nullable=False)
    sender_phone = db.Column(db.String(20), nullable=True)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    service_type = db.Column(db.String(50), nullable=True)
    urgency = db.Column(db.String(20), default='normal')
    status = db.Column(db.String(20), default='unread')  # unread, read, replied, closed
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    
    # Admin response fields
    admin_response = db.Column(db.Text, nullable=True)
    responded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    responded_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='messages')
    responder = db.relationship('User', foreign_keys=[responded_by], backref='responded_messages')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'sender_name': self.sender_name,
            'sender_email': self.sender_email,
            'sender_phone': self.sender_phone,
            'subject': self.subject,
            'message': self.message,
            'service_type': self.service_type,
            'urgency': self.urgency,
            'status': self.status,
            'priority': self.priority,
            'admin_response': self.admin_response,
            'responded_by': self.responded_by,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_name': self.user.name if self.user else None,
            'responder_name': self.responder.name if self.responder else None
        } 