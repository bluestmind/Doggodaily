#!/usr/bin/env python3
"""
Book management models for the application.
"""

from datetime import datetime
from app import db

class Book(db.Model):
    """Book model for managing book content and metadata."""
    __tablename__ = 'books'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # English fields
    title = db.Column(db.String(255), nullable=False)
    subtitle = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    preview = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    tags = db.Column(db.String(500), nullable=True)  # Comma-separated tags
    
    # Italian fields
    title_it = db.Column(db.String(255), nullable=True)
    subtitle_it = db.Column(db.String(500), nullable=True)
    description_it = db.Column(db.Text, nullable=True)
    preview_it = db.Column(db.Text, nullable=True)
    category_it = db.Column(db.String(100), nullable=True)
    tags_it = db.Column(db.String(500), nullable=True)  # Comma-separated tags
    
    # Common fields (not language-specific)
    image = db.Column(db.String(500), nullable=True)
    price = db.Column(db.String(50), nullable=True)
    original_price = db.Column(db.String(50), nullable=True)  # Original price before discount
    currency = db.Column(db.String(10), default='USD')
    availability = db.Column(db.String(50), default='available')  # available, sold_out, coming_soon
    external_links = db.Column(db.Text, nullable=True)  # JSON string for links
    amazon_link = db.Column(db.String(500), nullable=True)  # Direct Amazon link
    barnes_noble_link = db.Column(db.String(500), nullable=True)  # Direct Barnes & Noble link
    featured = db.Column(db.Boolean, default=False)
    order_index = db.Column(db.Integer, default=0)  # For ordering books
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self, language='en'):
        """Convert book to dictionary with language-specific content."""
        import json
        from flask import url_for
        
        # Parse external links if they exist
        external_links_data = []
        if self.external_links:
            try:
                external_links_data = json.loads(self.external_links)
            except (json.JSONDecodeError, TypeError):
                external_links_data = []
        
        # Generate image URL
        image_url = None
        if self.image:
            # Force fallback URL construction for now
            from flask import current_app
            base_url = current_app.config.get('BASE_URL', 'https://doggodaiily.com')
            image_url = f"{base_url}/uploads/{self.image}"
            print(f"🔗 Direct URL for {self.image}: {image_url}")
        
        # Get language-specific content
        if language == 'it':
            title = self.title_it or self.title
            subtitle = self.subtitle_it or self.subtitle
            description = self.description_it or self.description
            preview = self.preview_it or self.preview
            category = self.category_it or self.category
            tags = self.tags_it or self.tags
        else:  # Default to English
            title = self.title
            subtitle = self.subtitle
            description = self.description
            preview = self.preview
            category = self.category
            tags = self.tags
        
        return {
            'id': self.id,
            'title': title,
            'subtitle': subtitle,
            'description': description,
            'preview': preview,
            'image': self.image,
            'image_url': image_url,
            'price': self.price,
            'original_price': self.original_price,
            'currency': self.currency,
            'availability': self.availability,
            'category': category,
            'tags': tags.split(',') if tags else [],
            'external_links': external_links_data,
            'amazon_link': self.amazon_link,
            'barnes_noble_link': self.barnes_noble_link,
            'featured': self.featured,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Author(db.Model):
    """Author model for managing author information."""
    __tablename__ = 'authors'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # English fields
    name = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    credentials = db.Column(db.Text, nullable=True)  # JSON string for credentials
    achievements = db.Column(db.Text, nullable=True)  # JSON string for achievements
    quote = db.Column(db.Text, nullable=True)
    hero_title = db.Column(db.String(500), nullable=True)  # Custom title for book page hero
    hero_subtitle = db.Column(db.String(500), nullable=True)  # Custom subtitle for book page hero
    book_section_title = db.Column(db.String(500), nullable=True)  # Custom title for books section
    book_section_subtitle = db.Column(db.String(500), nullable=True)  # Custom subtitle for books section
    
    # Italian fields
    name_it = db.Column(db.String(255), nullable=True)
    title_it = db.Column(db.String(500), nullable=True)
    bio_it = db.Column(db.Text, nullable=True)
    credentials_it = db.Column(db.Text, nullable=True)  # JSON string for credentials
    achievements_it = db.Column(db.Text, nullable=True)  # JSON string for achievements
    quote_it = db.Column(db.Text, nullable=True)
    hero_title_it = db.Column(db.String(500), nullable=True)  # Custom title for book page hero
    hero_subtitle_it = db.Column(db.String(500), nullable=True)  # Custom subtitle for book page hero
    book_section_title_it = db.Column(db.String(500), nullable=True)  # Custom title for books section
    book_section_subtitle_it = db.Column(db.String(500), nullable=True)  # Custom subtitle for books section
    
    # Common fields (not language-specific)
    image = db.Column(db.String(500), nullable=True)
    social_links = db.Column(db.Text, nullable=True)  # JSON string for social links
    contact_email = db.Column(db.String(255), nullable=True)
    contact_link = db.Column(db.String(500), nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self, language='en'):
        """Convert author to dictionary with language-specific content."""
        import json
        from flask import url_for
        
        # Get language-specific content
        if language == 'it':
            name = self.name_it or self.name
            title = self.title_it or self.title
            bio = self.bio_it or self.bio
            quote = self.quote_it or self.quote
            hero_title = self.hero_title_it or self.hero_title
            hero_subtitle = self.hero_subtitle_it or self.hero_subtitle
            book_section_title = self.book_section_title_it or self.book_section_title
            book_section_subtitle = self.book_section_subtitle_it or self.book_section_subtitle
            
            # Parse Italian JSON fields
            credentials_data = []
            if self.credentials_it:
                try:
                    credentials_data = json.loads(self.credentials_it)
                except (json.JSONDecodeError, TypeError):
                    credentials_data = []
            elif self.credentials:
                try:
                    credentials_data = json.loads(self.credentials)
                except (json.JSONDecodeError, TypeError):
                    credentials_data = []
            
            achievements_data = []
            if self.achievements_it:
                try:
                    achievements_data = json.loads(self.achievements_it)
                except (json.JSONDecodeError, TypeError):
                    achievements_data = []
            elif self.achievements:
                try:
                    achievements_data = json.loads(self.achievements)
                except (json.JSONDecodeError, TypeError):
                    achievements_data = []
        else:  # Default to English
            name = self.name
            title = self.title
            bio = self.bio
            quote = self.quote
            hero_title = self.hero_title
            hero_subtitle = self.hero_subtitle
            book_section_title = self.book_section_title
            book_section_subtitle = self.book_section_subtitle
            
            # Parse English JSON fields
            credentials_data = []
            if self.credentials:
                try:
                    credentials_data = json.loads(self.credentials)
                except (json.JSONDecodeError, TypeError):
                    credentials_data = []
            
            achievements_data = []
            if self.achievements:
                try:
                    achievements_data = json.loads(self.achievements)
                except (json.JSONDecodeError, TypeError):
                    achievements_data = []
        
        # Parse social links (not language-specific)
        social_links_data = []
        if self.social_links:
            try:
                social_links_data = json.loads(self.social_links)
            except (json.JSONDecodeError, TypeError):
                social_links_data = []
        
        # Generate image URL
        image_url = None
        if self.image:
            # Force fallback URL construction for now
            from flask import current_app
            base_url = current_app.config.get('BASE_URL', 'https://doggodaiily.com')
            image_url = f"{base_url}/uploads/{self.image}"
            print(f"🔗 Direct URL for {self.image}: {image_url}")
        
        return {
            'id': self.id,
            'name': name,
            'title': title,
            'image': self.image,
            'image_url': image_url,
            'bio': bio,
            'credentials': credentials_data,
            'achievements': achievements_data,
            'quote': quote,
            'social_links': social_links_data,
            'contact_email': self.contact_email,
            'contact_link': self.contact_link,
            'hero_title': hero_title,
            'hero_subtitle': hero_subtitle,
            'book_section_title': book_section_title,
            'book_section_subtitle': book_section_subtitle,
            'active': self.active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


