"""
Enhanced Analytics Models for comprehensive data tracking and analysis
"""
from datetime import datetime, timedelta
from .extensions import db
from .models import User
import json
from sqlalchemy import func, text

class AnalyticsEvent(db.Model):
    """Track user interactions and events for analytics"""
    __tablename__ = 'enhanced_analytics_events'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Can be anonymous
    session_id = db.Column(db.String(255), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)  # page_view, click, download, etc.
    event_category = db.Column(db.String(50), nullable=False)  # gallery, tours, stories, etc.
    event_action = db.Column(db.String(100), nullable=False)  # view, like, share, book, etc.
    event_label = db.Column(db.String(255), nullable=True)  # Optional label for the event
    page_url = db.Column(db.String(500), nullable=True)
    referrer_url = db.Column(db.String(500), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    device_type = db.Column(db.String(20), nullable=True)  # desktop, mobile, tablet
    browser = db.Column(db.String(50), nullable=True)
    os = db.Column(db.String(50), nullable=True)
    screen_resolution = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # Time spent on page in seconds
    event_metadata = db.Column(db.JSON, nullable=True)  # Additional event data
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='enhanced_analytics_events')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'event_type': self.event_type,
            'event_category': self.event_category,
            'event_action': self.event_action,
            'event_label': self.event_label,
            'page_url': self.page_url,
            'referrer_url': self.referrer_url,
            'device_type': self.device_type,
            'browser': self.browser,
            'os': self.os,
            'country': self.country,
            'city': self.city,
            'duration': self.duration,
            'metadata': self.event_metadata,
            'created_at': self.created_at.isoformat()
        }

class PageView(db.Model):
    """Track page views with detailed information"""
    __tablename__ = 'enhanced_page_views'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=False)
    page_url = db.Column(db.String(500), nullable=False)
    page_title = db.Column(db.String(255), nullable=True)
    referrer_url = db.Column(db.String(500), nullable=True)
    time_on_page = db.Column(db.Integer, nullable=True)  # Seconds
    bounce = db.Column(db.Boolean, default=False)  # True if only page viewed in session
    exit_page = db.Column(db.Boolean, default=False)  # True if last page in session
    device_info = db.Column(db.JSON, nullable=True)
    location_info = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='page_views')

class ContentInteraction(db.Model):
    """Track interactions with specific content (stories, gallery, tours)"""
    __tablename__ = 'enhanced_content_interactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    content_type = db.Column(db.String(50), nullable=False)  # story, gallery_item, tour
    content_id = db.Column(db.Integer, nullable=False)
    interaction_type = db.Column(db.String(50), nullable=False)  # view, like, share, comment, book
    session_id = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.Integer, nullable=True)  # Time spent with content
    scroll_depth = db.Column(db.Integer, nullable=True)  # Percentage scrolled
    click_coordinates = db.Column(db.JSON, nullable=True)  # X,Y coordinates if applicable
    session_metadata = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='content_interactions')
    
    @classmethod
    def get_popular_content(cls, content_type, days=30, limit=10):
        """Get most popular content by interaction count"""
        return db.session.query(
            cls.content_id,
            func.count(cls.id).label('interaction_count'),
            func.count(func.distinct(cls.user_id)).label('unique_users')
        ).filter(
            cls.content_type == content_type,
            cls.created_at >= datetime.utcnow() - timedelta(days=days)
        ).group_by(cls.content_id).order_by(
            func.count(cls.id).desc()
        ).limit(limit).all()

class UserSession(db.Model):
    """Track user sessions for detailed analytics"""
    __tablename__ = 'enhanced_user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    device_fingerprint = db.Column(db.String(255), nullable=True)
    device_type = db.Column(db.String(20), nullable=True)
    browser = db.Column(db.String(50), nullable=True)
    browser_version = db.Column(db.String(20), nullable=True)
    os = db.Column(db.String(50), nullable=True)
    os_version = db.Column(db.String(20), nullable=True)
    screen_resolution = db.Column(db.String(20), nullable=True)
    timezone = db.Column(db.String(50), nullable=True)
    language = db.Column(db.String(10), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    region = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    utm_source = db.Column(db.String(255), nullable=True)
    utm_medium = db.Column(db.String(255), nullable=True)
    utm_campaign = db.Column(db.String(255), nullable=True)
    utm_term = db.Column(db.String(255), nullable=True)
    utm_content = db.Column(db.String(255), nullable=True)
    landing_page = db.Column(db.String(500), nullable=True)
    exit_page = db.Column(db.String(500), nullable=True)
    page_views = db.Column(db.Integer, default=0)
    total_duration = db.Column(db.Integer, default=0)  # Total session duration in seconds
    is_bounce = db.Column(db.Boolean, default=False)
    is_conversion = db.Column(db.Boolean, default=False)  # Did user complete desired action
    conversion_type = db.Column(db.String(50), nullable=True)  # signup, tour_booking, etc.
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ended_at = db.Column(db.DateTime, nullable=True)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='enhanced_user_sessions')
    
    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()
        self.total_duration = int((self.last_activity - self.started_at).total_seconds())
        db.session.commit()
    
    def end_session(self, exit_page=None):
        """End the session"""
        self.ended_at = datetime.utcnow()
        self.total_duration = int((self.ended_at - self.started_at).total_seconds())
        if exit_page:
            self.exit_page = exit_page
        # Mark as bounce if only one page view and short duration
        if self.page_views <= 1 and self.total_duration < 30:
            self.is_bounce = True
        db.session.commit()

class ConversionEvent(db.Model):
    """Track conversion events (goals achieved)"""
    __tablename__ = 'conversion_events'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=False)
    conversion_type = db.Column(db.String(50), nullable=False)  # signup, tour_booking, story_submit, etc.
    conversion_value = db.Column(db.Float, nullable=True)  # Monetary value if applicable
    funnel_step = db.Column(db.String(50), nullable=True)  # Which step in funnel led to conversion
    source_page = db.Column(db.String(500), nullable=True)  # Page where conversion started
    session_metadata = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='conversions')

class PerformanceMetric(db.Model):
    """Track website performance metrics"""
    __tablename__ = 'performance_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), nullable=False)
    page_url = db.Column(db.String(500), nullable=False)
    load_time = db.Column(db.Float, nullable=True)  # Page load time in seconds
    dom_content_loaded = db.Column(db.Float, nullable=True)
    first_contentful_paint = db.Column(db.Float, nullable=True)
    largest_contentful_paint = db.Column(db.Float, nullable=True)
    first_input_delay = db.Column(db.Float, nullable=True)
    cumulative_layout_shift = db.Column(db.Float, nullable=True)
    connection_type = db.Column(db.String(20), nullable=True)  # 4g, wifi, etc.
    server_response_time = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class ABTestVariant(db.Model):
    """A/B testing variants"""
    __tablename__ = 'ab_test_variants'
    
    id = db.Column(db.Integer, primary_key=True)
    test_name = db.Column(db.String(100), nullable=False)
    variant_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    traffic_percentage = db.Column(db.Float, default=50.0)  # Percentage of traffic to show this variant
    is_active = db.Column(db.Boolean, default=True)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class ABTestAssignment(db.Model):
    """Track which users see which test variants"""
    __tablename__ = 'ab_test_assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('ab_test_variants.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=False)
    variant_shown = db.Column(db.String(100), nullable=False)
    converted = db.Column(db.Boolean, default=False)
    conversion_type = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    test = db.relationship('ABTestVariant', backref='assignments')
    user = db.relationship('User', backref='ab_test_assignments')

class HeatmapData(db.Model):
    """Store heatmap click/scroll data"""
    __tablename__ = 'heatmap_data'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), nullable=False)
    page_url = db.Column(db.String(500), nullable=False)
    element_selector = db.Column(db.String(255), nullable=True)  # CSS selector of clicked element
    click_x = db.Column(db.Integer, nullable=True)
    click_y = db.Column(db.Integer, nullable=True)
    scroll_depth = db.Column(db.Integer, nullable=True)  # Max scroll depth percentage
    viewport_width = db.Column(db.Integer, nullable=True)
    viewport_height = db.Column(db.Integer, nullable=True)
    device_type = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

# Analytics calculation functions
class AnalyticsCalculator:
    """Utility class for calculating analytics metrics"""
    
    @staticmethod
    def get_total_users(days=30):
        """Get total unique users in the last N days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.session.query(func.count(func.distinct(User.id))).filter(
            User.created_at >= cutoff_date
        ).scalar() or 0
    
    @staticmethod
    def get_active_users(days=30):
        """Get active users (with sessions) in the last N days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.session.query(func.count(func.distinct(UserSession.user_id))).filter(
            UserSession.started_at >= cutoff_date,
            UserSession.user_id.isnot(None)
        ).scalar() or 0
    
    @staticmethod
    def get_total_sessions(days=30):
        """Get total sessions in the last N days"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.session.query(func.count(UserSession.id)).filter(
            UserSession.started_at >= cutoff_date
        ).scalar() or 0
    
    @staticmethod
    def get_bounce_rate(days=30):
        """Calculate bounce rate percentage"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        total_sessions = db.session.query(func.count(UserSession.id)).filter(
            UserSession.started_at >= cutoff_date
        ).scalar() or 0
        
        if total_sessions == 0:
            return 0
        
        bounce_sessions = db.session.query(func.count(UserSession.id)).filter(
            UserSession.started_at >= cutoff_date,
            UserSession.is_bounce == True
        ).scalar() or 0
        
        return round((bounce_sessions / total_sessions) * 100, 2)
    
    @staticmethod
    def get_average_session_duration(days=30):
        """Get average session duration in minutes"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        avg_duration = db.session.query(func.avg(UserSession.total_duration)).filter(
            UserSession.started_at >= cutoff_date,
            UserSession.total_duration > 0
        ).scalar() or 0
        
        return round(avg_duration / 60, 2)  # Convert to minutes
    
    @staticmethod
    def get_page_views_by_day(days=30):
        """Get daily page view counts"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # PostgreSQL/MySQL compatible date grouping
        if db.engine.name == 'postgresql':
            date_func = func.date_trunc('day', PageView.created_at)
        else:
            date_func = func.date(PageView.created_at)
        
        return db.session.query(
            date_func.label('date'),
            func.count(PageView.id).label('views')
        ).filter(
            PageView.created_at >= cutoff_date
        ).group_by(date_func).order_by(date_func).all()
    
    @staticmethod
    def get_top_pages(days=30, limit=10):
        """Get most viewed pages"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.session.query(
            PageView.page_url,
            func.count(PageView.id).label('views'),
            func.count(func.distinct(PageView.session_id)).label('unique_views')
        ).filter(
            PageView.created_at >= cutoff_date
        ).group_by(PageView.page_url).order_by(
            func.count(PageView.id).desc()
        ).limit(limit).all()
    
    @staticmethod
    def get_traffic_sources(days=30, limit=10):
        """Get top traffic sources"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.session.query(
            UserSession.utm_source,
            func.count(UserSession.id).label('sessions'),
            func.count(func.distinct(UserSession.user_id)).label('unique_users')
        ).filter(
            UserSession.started_at >= cutoff_date,
            UserSession.utm_source.isnot(None)
        ).group_by(UserSession.utm_source).order_by(
            func.count(UserSession.id).desc()
        ).limit(limit).all()
    
    @staticmethod
    def get_device_breakdown(days=30):
        """Get device type breakdown"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.session.query(
            UserSession.device_type,
            func.count(UserSession.id).label('sessions'),
            func.count(func.distinct(UserSession.user_id)).label('unique_users')
        ).filter(
            UserSession.started_at >= cutoff_date,
            UserSession.device_type.isnot(None)
        ).group_by(UserSession.device_type).all()
    
    @staticmethod
    def get_geographic_breakdown(days=30, limit=10):
        """Get geographic breakdown by country"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return db.session.query(
            UserSession.country,
            func.count(UserSession.id).label('sessions'),
            func.count(func.distinct(UserSession.user_id)).label('unique_users')
        ).filter(
            UserSession.started_at >= cutoff_date,
            UserSession.country.isnot(None)
        ).group_by(UserSession.country).order_by(
            func.count(UserSession.id).desc()
        ).limit(limit).all()
    
    @staticmethod
    def get_conversion_rate(conversion_type=None, days=30):
        """Calculate conversion rate"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        total_sessions = db.session.query(func.count(UserSession.id)).filter(
            UserSession.started_at >= cutoff_date
        ).scalar() or 0
        
        if total_sessions == 0:
            return 0
        
        conversion_filter = [ConversionEvent.created_at >= cutoff_date]
        if conversion_type:
            conversion_filter.append(ConversionEvent.conversion_type == conversion_type)
        
        conversions = db.session.query(func.count(func.distinct(ConversionEvent.session_id))).filter(
            *conversion_filter
        ).scalar() or 0
        
        return round((conversions / total_sessions) * 100, 2)
    
    @staticmethod
    def get_real_time_stats():
        """Get real-time statistics for the last hour"""
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        
        active_sessions = db.session.query(func.count(UserSession.id)).filter(
            UserSession.last_activity >= one_hour_ago
        ).scalar() or 0
        
        page_views_last_hour = db.session.query(func.count(PageView.id)).filter(
            PageView.created_at >= one_hour_ago
        ).scalar() or 0
        
        new_users_last_hour = db.session.query(func.count(User.id)).filter(
            User.created_at >= one_hour_ago
        ).scalar() or 0
        
        return {
            'active_sessions': active_sessions,
            'page_views_last_hour': page_views_last_hour,
            'new_users_last_hour': new_users_last_hour,
            'timestamp': datetime.utcnow().isoformat()
        }