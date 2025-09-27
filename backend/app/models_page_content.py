from app import db
from datetime import datetime

class PageContent(db.Model):
    """Model for managing page content that can be edited from admin panel"""
    __tablename__ = 'page_content'
    
    id = db.Column(db.Integer, primary_key=True)
    page_name = db.Column(db.String(100), nullable=False, unique=True)  # e.g., 'book_page', 'home_page'
    section_name = db.Column(db.String(100), nullable=False)  # e.g., 'hero_title', 'author_bio'
    content_key = db.Column(db.String(100), nullable=False)  # e.g., 'title', 'subtitle', 'description'
    content_value = db.Column(db.Text, nullable=True)  # The actual text content
    content_type = db.Column(db.String(50), default='text')  # text, html, json
    is_active = db.Column(db.Boolean, default=True)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'page_name': self.page_name,
            'section_name': self.section_name,
            'content_key': self.content_key,
            'content_value': self.content_value,
            'content_type': self.content_type,
            'is_active': self.is_active,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<PageContent {self.page_name}.{self.section_name}.{self.content_key}>'


