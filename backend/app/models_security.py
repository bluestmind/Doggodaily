"""
Enhanced Security Models for comprehensive security monitoring and maintenance
"""
from datetime import datetime, timedelta
from .extensions import db
from .models import User
import json
from sqlalchemy import func, text
import hashlib
import secrets

class SecurityLog(db.Model):
    """Comprehensive security event logging"""
    __tablename__ = 'enhanced_security_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    event_type = db.Column(db.String(50), nullable=False)  # login, logout, failed_login, admin_action, etc.
    severity = db.Column(db.String(20), default='info')  # low, medium, high, critical
    source_ip = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    device_fingerprint = db.Column(db.String(255), nullable=True)
    location = db.Column(db.JSON, nullable=True)  # Geographic location data
    description = db.Column(db.Text, nullable=False)
    event_metadata = db.Column(db.JSON, nullable=True)  # Additional event-specific data
    risk_score = db.Column(db.Integer, default=0)  # 0-100 risk assessment
    is_blocked = db.Column(db.Boolean, default=False)
    action_taken = db.Column(db.String(255), nullable=True)  # What action was taken
    investigation_status = db.Column(db.String(50), default='none')  # none, pending, investigating, resolved
    investigation_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='enhanced_security_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_type': self.event_type,
            'severity': self.severity,
            'source_ip': self.source_ip,
            'location': self.location,
            'description': self.description,
            'metadata': self.event_metadata,
            'risk_score': self.risk_score,
            'is_blocked': self.is_blocked,
            'action_taken': self.action_taken,
            'investigation_status': self.investigation_status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def log_event(cls, event_type, description, user_id=None, source_ip=None, 
                  user_agent=None, severity='info', event_metadata=None, risk_score=0):
        """Convenience method to log security events"""
        log_entry = cls(
            user_id=user_id,
            event_type=event_type,
            severity=severity,
            source_ip=source_ip,
            user_agent=user_agent,
            description=description,
            event_metadata=event_metadata,
            risk_score=risk_score
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry

class ThreatDetection(db.Model):
    """Advanced threat detection and tracking"""
    __tablename__ = 'threat_detections'
    
    id = db.Column(db.Integer, primary_key=True)
    threat_type = db.Column(db.String(50), nullable=False)  # brute_force, sql_injection, xss, ddos, etc.
    threat_level = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    source_ip = db.Column(db.String(45), nullable=False)
    target_endpoint = db.Column(db.String(500), nullable=True)
    attack_pattern = db.Column(db.Text, nullable=True)  # Pattern or signature that matched
    payload = db.Column(db.Text, nullable=True)  # Actual malicious payload
    user_agent = db.Column(db.Text, nullable=True)
    headers = db.Column(db.JSON, nullable=True)  # Request headers
    frequency = db.Column(db.Integer, default=1)  # How many times this pattern occurred
    is_active = db.Column(db.Boolean, default=True)
    is_mitigated = db.Column(db.Boolean, default=False)
    mitigation_action = db.Column(db.String(255), nullable=True)  # What action was taken
    false_positive = db.Column(db.Boolean, default=False)
    first_seen = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def update_frequency(self):
        """Update frequency and last seen timestamp"""
        self.frequency += 1
        self.last_seen = datetime.utcnow()
        db.session.commit()

class IPBlacklist(db.Model):
    """IP address blacklist management"""
    __tablename__ = 'ip_blacklist'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), unique=True, nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    added_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    threat_level = db.Column(db.String(20), default='medium')
    auto_added = db.Column(db.Boolean, default=False)  # Automatically added by system
    expires_at = db.Column(db.DateTime, nullable=True)  # Temporary blocks
    is_active = db.Column(db.Boolean, default=True)
    hit_count = db.Column(db.Integer, default=0)  # How many times this IP was blocked
    last_hit = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    added_by_user = db.relationship('User', backref='ip_blacklist_entries')
    
    @classmethod
    def is_blocked(cls, ip_address):
        """Check if an IP is blocked"""
        blocked_ip = cls.query.filter_by(
            ip_address=ip_address,
            is_active=True
        ).filter(
            db.or_(
                cls.expires_at.is_(None),
                cls.expires_at > datetime.utcnow()
            )
        ).first()
        
        if blocked_ip:
            blocked_ip.hit_count += 1
            blocked_ip.last_hit = datetime.utcnow()
            db.session.commit()
            return True
        return False
    
    @classmethod
    def add_to_blacklist(cls, ip_address, reason, added_by=None, expires_hours=None, threat_level='medium'):
        """Add IP to blacklist"""
        expires_at = None
        if expires_hours:
            expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
        
        existing = cls.query.filter_by(ip_address=ip_address).first()
        if existing:
            existing.reason = reason
            existing.threat_level = threat_level
            existing.expires_at = expires_at
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
        else:
            blacklist_entry = cls(
                ip_address=ip_address,
                reason=reason,
                added_by=added_by,
                threat_level=threat_level,
                expires_at=expires_at,
                auto_added=(added_by is None)
            )
            db.session.add(blacklist_entry)
        
        db.session.commit()

class RateLimitLog(db.Model):
    """Track rate limiting events"""
    __tablename__ = 'rate_limit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    endpoint = db.Column(db.String(500), nullable=False)
    limit_type = db.Column(db.String(50), nullable=False)  # per_minute, per_hour, per_day
    limit_value = db.Column(db.Integer, nullable=False)  # The limit that was exceeded
    current_count = db.Column(db.Integer, nullable=False)  # Current request count
    time_window = db.Column(db.String(20), nullable=False)  # The time window (1m, 1h, 1d)
    action_taken = db.Column(db.String(100), nullable=False)  # blocked, warned, logged
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='rate_limit_logs')

class MaintenanceMode(db.Model):
    """Maintenance mode configuration and logging"""
    __tablename__ = 'maintenance_mode'
    
    id = db.Column(db.Integer, primary_key=True)
    is_enabled = db.Column(db.Boolean, default=False, nullable=False)
    maintenance_type = db.Column(db.String(50), default='general')  # general, security, emergency, scheduled
    title = db.Column(db.String(255), default='Site Maintenance')
    message = db.Column(db.Text, default='We are currently performing maintenance. Please check back soon.')
    estimated_duration = db.Column(db.Integer, nullable=True)  # Minutes
    allowed_ips = db.Column(db.JSON, nullable=True)  # IPs that can still access the site
    allowed_user_ids = db.Column(db.JSON, nullable=True)  # Users that can still access
    bypass_routes = db.Column(db.JSON, nullable=True)  # Routes that should still work
    redirect_url = db.Column(db.String(500), nullable=True)  # Alternative URL to redirect to
    show_progress = db.Column(db.Boolean, default=False)  # Show maintenance progress
    progress_percentage = db.Column(db.Integer, default=0)  # Current progress (0-100)
    scheduled_start = db.Column(db.DateTime, nullable=True)
    scheduled_end = db.Column(db.DateTime, nullable=True)
    enabled_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    enabled_at = db.Column(db.DateTime, nullable=True)
    disabled_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    disabled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    enabled_by_user = db.relationship('User', foreign_keys=[enabled_by], backref='maintenance_enabled')
    disabled_by_user = db.relationship('User', foreign_keys=[disabled_by], backref='maintenance_disabled')
    
    @classmethod
    def get_current(cls):
        """Get current maintenance mode configuration"""
        return cls.query.order_by(cls.updated_at.desc()).first()
    
    @classmethod
    def enable_maintenance(cls, title=None, message=None, maintenance_type='general', 
                          enabled_by=None, estimated_duration=None, allowed_ips=None):
        """Enable maintenance mode"""
        current = cls.get_current()
        if current:
            current.is_enabled = True
            current.maintenance_type = maintenance_type
            current.title = title or current.title
            current.message = message or current.message
            current.estimated_duration = estimated_duration
            current.allowed_ips = allowed_ips or current.allowed_ips
            current.enabled_by = enabled_by
            current.enabled_at = datetime.utcnow()
            current.updated_at = datetime.utcnow()
        else:
            current = cls(
                is_enabled=True,
                maintenance_type=maintenance_type,
                title=title or 'Site Maintenance',
                message=message or 'We are currently performing maintenance. Please check back soon.',
                estimated_duration=estimated_duration,
                allowed_ips=allowed_ips,
                enabled_by=enabled_by,
                enabled_at=datetime.utcnow()
            )
            db.session.add(current)
        
        db.session.commit()
        
        # Log the maintenance event
        SecurityLog.log_event(
            event_type='maintenance_enabled',
            description=f'Maintenance mode enabled: {maintenance_type}',
            user_id=enabled_by,
            severity='medium',
            metadata={'maintenance_type': maintenance_type, 'estimated_duration': estimated_duration}
        )
        
        return current
    
    @classmethod
    def disable_maintenance(cls, disabled_by=None):
        """Disable maintenance mode"""
        current = cls.get_current()
        if current and current.is_enabled:
            current.is_enabled = False
            current.disabled_by = disabled_by
            current.disabled_at = datetime.utcnow()
            current.updated_at = datetime.utcnow()
            db.session.commit()
            
            # Log the maintenance event
            SecurityLog.log_event(
                event_type='maintenance_disabled',
                description='Maintenance mode disabled',
                user_id=disabled_by,
                severity='info'
            )
        
        return current
    
    def update_progress(self, percentage, message=None):
        """Update maintenance progress"""
        self.progress_percentage = max(0, min(100, percentage))
        if message:
            self.message = message
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def is_user_allowed(self, user_id=None, ip_address=None):
        """Check if a user or IP is allowed during maintenance"""
        if not self.is_enabled:
            return True
        
        # Check allowed user IDs
        if user_id and self.allowed_user_ids:
            if user_id in self.allowed_user_ids:
                return True
        
        # Check allowed IPs
        if ip_address and self.allowed_ips:
            if ip_address in self.allowed_ips:
                return True
        
        return False

class SecurityConfiguration(db.Model):
    """Security configuration settings"""
    __tablename__ = 'security_configuration'
    
    id = db.Column(db.Integer, primary_key=True)
    # Authentication settings
    enable_2fa = db.Column(db.Boolean, default=False)
    require_2fa_for_admin = db.Column(db.Boolean, default=True)
    password_min_length = db.Column(db.Integer, default=8)
    password_require_uppercase = db.Column(db.Boolean, default=True)
    password_require_lowercase = db.Column(db.Boolean, default=True)
    password_require_numbers = db.Column(db.Boolean, default=True)
    password_require_symbols = db.Column(db.Boolean, default=False)
    password_expiry_days = db.Column(db.Integer, default=90)
    password_history_count = db.Column(db.Integer, default=5)  # Can't reuse last N passwords
    
    # Session settings
    session_timeout_minutes = db.Column(db.Integer, default=30)
    max_concurrent_sessions = db.Column(db.Integer, default=5)
    
    # Rate limiting
    enable_rate_limiting = db.Column(db.Boolean, default=True)
    login_attempts_per_minute = db.Column(db.Integer, default=5)
    api_requests_per_minute = db.Column(db.Integer, default=60)
    api_requests_per_hour = db.Column(db.Integer, default=1000)
    
    # Account lockout
    enable_account_lockout = db.Column(db.Boolean, default=True)
    lockout_attempts = db.Column(db.Integer, default=5)
    lockout_duration_minutes = db.Column(db.Integer, default=30)
    
    # IP blocking
    enable_auto_ip_blocking = db.Column(db.Boolean, default=True)
    suspicious_ip_threshold = db.Column(db.Integer, default=10)
    auto_block_duration_hours = db.Column(db.Integer, default=24)
    
    # Monitoring and alerts
    enable_security_alerts = db.Column(db.Boolean, default=True)
    alert_email = db.Column(db.String(255), nullable=True)
    alert_webhook_url = db.Column(db.String(500), nullable=True)
    
    # Content security
    enable_csrf_protection = db.Column(db.Boolean, default=True)
    enable_sql_injection_detection = db.Column(db.Boolean, default=True)
    enable_xss_protection = db.Column(db.Boolean, default=True)
    
    # Backup and recovery
    enable_audit_logs = db.Column(db.Boolean, default=True)
    log_retention_days = db.Column(db.Integer, default=90)
    
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    updated_by_user = db.relationship('User', backref='enhanced_security_updates')
    
    @classmethod
    def get_current(cls):
        """Get current security configuration"""
        config = cls.query.first()
        if not config:
            config = cls()
            db.session.add(config)
            db.session.commit()
        return config

class FailedLoginAttempt(db.Model):
    """Track failed login attempts for security analysis"""
    __tablename__ = 'failed_login_attempts'
    
    id = db.Column(db.Integer, primary_key=True)
    username_attempted = db.Column(db.String(255), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    user_agent = db.Column(db.Text, nullable=True)
    failure_reason = db.Column(db.String(100), nullable=False)  # invalid_password, user_not_found, account_locked
    device_fingerprint = db.Column(db.String(255), nullable=True)
    location = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    @classmethod
    def get_recent_attempts(cls, ip_address=None, username=None, minutes=15):
        """Get recent failed attempts for analysis"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        query = cls.query.filter(cls.created_at >= cutoff_time)
        
        if ip_address:
            query = query.filter(cls.ip_address == ip_address)
        if username:
            query = query.filter(cls.username_attempted == username)
        
        return query.count()

class AuditLog(db.Model):
    """Comprehensive audit trail for all system changes"""
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)  # create, update, delete, view, etc.
    resource_type = db.Column(db.String(50), nullable=False)  # user, story, gallery_item, etc.
    resource_id = db.Column(db.String(50), nullable=True)  # ID of the affected resource
    old_values = db.Column(db.JSON, nullable=True)  # Previous values for updates
    new_values = db.Column(db.JSON, nullable=True)  # New values for updates
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    endpoint = db.Column(db.String(500), nullable=True)  # API endpoint used
    method = db.Column(db.String(10), nullable=True)  # HTTP method
    status_code = db.Column(db.Integer, nullable=True)  # Response status code
    details = db.Column(db.Text, nullable=True)  # Additional details
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='audit_logs')
    
    @classmethod
    def log_action(cls, action, resource_type, user_id=None, resource_id=None, 
                   old_values=None, new_values=None, ip_address=None, 
                   user_agent=None, endpoint=None, method=None, details=None):
        """Log an audit action"""
        audit_entry = cls(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            method=method,
            details=details
        )
        db.session.add(audit_entry)
        db.session.commit()
        return audit_entry

# Security utility functions
class SecurityUtils:
    """Utility functions for security operations"""
    
    @staticmethod
    def calculate_risk_score(event_type, user_id=None, ip_address=None):
        """Calculate risk score for a security event"""
        base_scores = {
            'login': 1,
            'failed_login': 5,
            'admin_login': 10,
            'password_change': 15,
            'account_creation': 5,
            'suspicious_activity': 25,
            'brute_force': 50,
            'sql_injection': 75,
            'xss_attempt': 60,
            'privilege_escalation': 90,
            'data_breach': 100
        }
        
        score = base_scores.get(event_type, 10)
        
        # Increase score for repeat offenders
        if ip_address:
            recent_events = SecurityLog.query.filter(
                SecurityLog.source_ip == ip_address,
                SecurityLog.created_at >= datetime.utcnow() - timedelta(hours=24),
                SecurityLog.risk_score > 0
            ).count()
            score += min(recent_events * 5, 30)
        
        # Increase score for new users
        if user_id:
            user = User.query.get(user_id)
            if user and user.created_at >= datetime.utcnow() - timedelta(days=7):
                score += 10
        
        return min(score, 100)
    
    @staticmethod
    def should_block_ip(ip_address):
        """Determine if an IP should be automatically blocked"""
        # Check if already blocked
        if IPBlacklist.is_blocked(ip_address):
            return True
        
        # Check recent high-risk events
        recent_high_risk = SecurityLog.query.filter(
            SecurityLog.source_ip == ip_address,
            SecurityLog.created_at >= datetime.utcnow() - timedelta(hours=1),
            SecurityLog.risk_score >= 25
        ).count()
        
        if recent_high_risk >= 3:
            IPBlacklist.add_to_blacklist(
                ip_address=ip_address,
                reason='Automatic block due to multiple high-risk events',
                expires_hours=24,
                threat_level='high'
            )
            return True
        
        return False
    
    @staticmethod
    def generate_security_token():
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_device_fingerprint(user_agent, ip_address, additional_data=None):
        """Create a device fingerprint hash"""
        fingerprint_data = f"{user_agent}:{ip_address}"
        if additional_data:
            fingerprint_data += f":{additional_data}"
        
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]
    
    @staticmethod
    def is_maintenance_mode():
        """Check if maintenance mode is enabled"""
        maintenance = MaintenanceMode.get_current()
        return maintenance and maintenance.is_enabled
    
    @staticmethod
    def get_maintenance_info():
        """Get maintenance mode information"""
        maintenance = MaintenanceMode.get_current()
        if maintenance and maintenance.is_enabled:
            return {
                'is_enabled': True,
                'title': maintenance.title,
                'message': maintenance.message,
                'maintenance_type': maintenance.maintenance_type,
                'estimated_duration': maintenance.estimated_duration,
                'show_progress': maintenance.show_progress,
                'progress_percentage': maintenance.progress_percentage,
                'scheduled_end': maintenance.scheduled_end.isoformat() if maintenance.scheduled_end else None
            }
        return {'is_enabled': False}