"""
Extended Gallery Models for album functionality
"""
from datetime import datetime
from .extensions import db
from .models import GalleryItem

class GalleryAlbum(db.Model):
    """Gallery albums for grouping related media"""
    __tablename__ = 'gallery_albums'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    album_type = db.Column(db.String(50), default='mixed')  # photos, videos, mixed
    category = db.Column(db.String(100), default='general')
    tags = db.Column(db.Text, nullable=True)
    is_featured = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='active')  # active, archived, draft
    cover_image_id = db.Column(db.Integer, db.ForeignKey('gallery_items.id'), nullable=True)
    
    # User who created the album
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Album metadata
    total_items = db.Column(db.Integer, default=0)
    total_views = db.Column(db.Integer, default=0)
    total_likes = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='gallery_albums')
    cover_image = db.relationship('GalleryItem', foreign_keys=[cover_image_id])
    items = db.relationship('GalleryItem', 
                          foreign_keys='GalleryItem.album_id',
                          backref='album',
                          order_by='GalleryItem.album_order')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'album_type': self.album_type,
            'category': self.category,
            'tags': self.tags.split(',') if self.tags else [],
            'is_featured': self.is_featured,
            'status': self.status,
            'cover_image_id': self.cover_image_id,
            'cover_image_url': self.cover_image.file_url if self.cover_image else None,
            'user_id': self.user_id,
            'total_items': self.total_items,
            'total_views': self.total_views,
            'total_likes': self.total_likes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'items': [item.to_dict() for item in self.items] if hasattr(self, '_items_loaded') else []
        }
    
    def load_items(self):
        """Load items for this album"""
        self._items_loaded = True
        return self
    
    def update_stats(self):
        """Update album statistics"""
        self.total_items = len(self.items)
        self.total_views = sum(item.views or 0 for item in self.items)
        self.total_likes = sum(item.likes or 0 for item in self.items)
        
        # Set cover image if not set
        if not self.cover_image_id and self.items:
            self.cover_image_id = self.items[0].id
        
        db.session.commit()
    
    @classmethod
    def get_with_items(cls, album_id):
        """Get album with all its items loaded"""
        album = cls.query.get(album_id)
        if album:
            album.load_items()
        return album

# Extend GalleryItem model to support albums
def extend_gallery_item():
    """Add album support to existing GalleryItem model"""
    if not hasattr(GalleryItem, 'album_id'):
        GalleryItem.album_id = db.Column(db.Integer, db.ForeignKey('gallery_albums.id'), nullable=True)
    if not hasattr(GalleryItem, 'album_order'):
        GalleryItem.album_order = db.Column(db.Integer, default=0)
    if not hasattr(GalleryItem, 'is_album_cover'):
        GalleryItem.is_album_cover = db.Column(db.Boolean, default=False)

# Album interaction tracking
class AlbumView(db.Model):
    """Track album views"""
    __tablename__ = 'album_views'
    
    id = db.Column(db.Integer, primary_key=True)
    album_id = db.Column(db.Integer, db.ForeignKey('gallery_albums.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    view_duration = db.Column(db.Integer, nullable=True)  # seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    album = db.relationship('GalleryAlbum', backref='view_logs')
    user = db.relationship('User', backref='album_views')

class AlbumLike(db.Model):
    """Track album likes"""
    __tablename__ = 'album_likes'
    
    id = db.Column(db.Integer, primary_key=True)
    album_id = db.Column(db.Integer, db.ForeignKey('gallery_albums.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    album = db.relationship('GalleryAlbum', backref='like_logs')
    user = db.relationship('User', backref='album_likes')
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('album_id', 'user_id', name='unique_album_user_like'),)

# Initialize album support
extend_gallery_item()