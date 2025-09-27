import os
from datetime import timedelta

class Config:
    # Basic Flask config
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production-NOW')
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Database config
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///doggo_daily.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 3600,
        'pool_timeout': 20,
        'max_overflow': 0
    }
    
    # Enhanced JWT config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production-NOW')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get('JWT_ACCESS_EXPIRES_HOURS', 1)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.environ.get('JWT_REFRESH_EXPIRES_DAYS', 30)))
    JWT_ALGORITHM = 'HS256'
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    JWT_ERROR_MESSAGE_KEY = 'message'
    JWT_JSON_KEY = 'access_token'
    JWT_REFRESH_JSON_KEY = 'refresh_token'
    
    # CORS config - more restrictive by default
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://46.101.244.203:3000,http://46.101.244.203:5000,https://www.doggodaiily.com,https://doggodaiily.com').split(',')
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_MAX_AGE = 86400  # 24 hours
    
    # Enhanced Mail config
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'localhost')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@doggodaily.com')
    MAIL_SUPPRESS_SEND = os.environ.get('MAIL_SUPPRESS_SEND', 'False').lower() == 'true'
    
    # Enhanced File upload config
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 50 * 1024 * 1024))  # 50MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'}
    
    # Enhanced Security config
    BCRYPT_LOG_ROUNDS = int(os.environ.get('BCRYPT_LOG_ROUNDS', 12))
    PASSWORD_MIN_LENGTH = int(os.environ.get('PASSWORD_MIN_LENGTH', 8))
    PASSWORD_MAX_LENGTH = int(os.environ.get('PASSWORD_MAX_LENGTH', 128))
    FORCE_HTTPS = os.environ.get('FORCE_HTTPS', 'False').lower() == 'true'
    
    # Session Security
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    REMEMBER_COOKIE_DURATION = timedelta(days=30)
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'memory://')
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '2000/day,200/hour')
    RATELIMIT_HEADERS_ENABLED = True
    
    # Authentication Security
    MAX_LOGIN_ATTEMPTS = int(os.environ.get('MAX_LOGIN_ATTEMPTS', 5))
    ACCOUNT_LOCKOUT_DURATION = int(os.environ.get('ACCOUNT_LOCKOUT_DURATION', 30))  # minutes
    MAX_CONCURRENT_SESSIONS = int(os.environ.get('MAX_CONCURRENT_SESSIONS', 5))
    PASSWORD_HISTORY_COUNT = int(os.environ.get('PASSWORD_HISTORY_COUNT', 5))
    
    # Two-Factor Authentication
    TOTP_ISSUER_NAME = os.environ.get('TOTP_ISSUER_NAME', 'DoggoDaily')
    BACKUP_CODES_COUNT = int(os.environ.get('BACKUP_CODES_COUNT', 8))
    
    # Security Headers
    CSP_DEFAULT_SRC = "'self'"
    CSP_SCRIPT_SRC = "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net"
    CSP_STYLE_SRC = "'self' 'unsafe-inline' https://fonts.googleapis.com"
    CSP_IMG_SRC = "'self' data: https: blob:"
    
    # Pagination config
    POSTS_PER_PAGE = int(os.environ.get('POSTS_PER_PAGE', 10))
    STORIES_PER_PAGE = int(os.environ.get('STORIES_PER_PAGE', 12))
    GALLERY_ITEMS_PER_PAGE = int(os.environ.get('GALLERY_ITEMS_PER_PAGE', 20))
    USERS_PER_PAGE = int(os.environ.get('USERS_PER_PAGE', 20))
    
    # Logging config
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s %(levelname)s %(name)s %(message)s'
    LOG_MAX_BYTES = int(os.environ.get('LOG_MAX_BYTES', 10 * 1024 * 1024))  # 10MB
    LOG_BACKUP_COUNT = int(os.environ.get('LOG_BACKUP_COUNT', 5))
    
    # Cache config
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple')
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', 300))
    CACHE_KEY_PREFIX = 'doggo_'
    
    # Email verification
    EMAIL_VERIFICATION_REQUIRED = os.environ.get('EMAIL_VERIFICATION_REQUIRED', 'True').lower() == 'true'
    EMAIL_VERIFICATION_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get('EMAIL_VERIFICATION_EXPIRES_HOURS', 24)))
    
    # Password reset
    PASSWORD_RESET_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get('PASSWORD_RESET_EXPIRES_HOURS', 1)))
    
    # Admin settings
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@doggodaily.com')
    ADMIN_NOTIFICATION_EMAIL = os.environ.get('ADMIN_NOTIFICATION_EMAIL', ADMIN_EMAIL)
    
    # API settings
    API_VERSION = '2.0.0'
    API_TITLE = 'DoggoDaily API'
    API_DESCRIPTION = 'Secure REST API for DoggoDaily application'
    
    # OAuth (Google)
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'https://www.doggodaiily.com/api/auth/google/callback')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://www.doggodaiily.com')
    
    # Feature flags
    FEATURE_2FA_REQUIRED_FOR_ADMIN = os.environ.get('FEATURE_2FA_REQUIRED_FOR_ADMIN', 'True').lower() == 'true'
    FEATURE_EMAIL_VERIFICATION = os.environ.get('FEATURE_EMAIL_VERIFICATION', 'True').lower() == 'true'
    FEATURE_GEOLOCATION_TRACKING = os.environ.get('FEATURE_GEOLOCATION_TRACKING', 'True').lower() == 'true'
    FEATURE_DEVICE_TRACKING = os.environ.get('FEATURE_DEVICE_TRACKING', 'True').lower() == 'true'
    
    # Monitoring and alerting
    SECURITY_ALERT_EMAIL = os.environ.get('SECURITY_ALERT_EMAIL', ADMIN_NOTIFICATION_EMAIL)
    FAILED_LOGIN_ALERT_THRESHOLD = int(os.environ.get('FAILED_LOGIN_ALERT_THRESHOLD', 10))
    SUSPICIOUS_ACTIVITY_ALERT = os.environ.get('SUSPICIOUS_ACTIVITY_ALERT', 'True').lower() == 'true'

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    FORCE_HTTPS = False
    SESSION_COOKIE_SECURE = False
    # Enable cross-site cookies for dev (frontend at :3000, backend at :5000)
    SESSION_COOKIE_SAMESITE = 'None'
    REMEMBER_COOKIE_SECURE = False
    REMEMBER_COOKIE_SAMESITE = 'None'
    MAIL_SUPPRESS_SEND = True
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    WTF_CSRF_ENABLED = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    MAIL_SUPPRESS_SEND = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=1)  # Short expiry for testing
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(minutes=5)
    RATELIMIT_ENABLED = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    FORCE_HTTPS = True
    SESSION_COOKIE_SECURE = True
    LOG_LEVEL = 'WARNING'
    
    # Production-specific security
    BCRYPT_LOG_ROUNDS = 14  # More secure but slower
    MAX_LOGIN_ATTEMPTS = 3  # Stricter rate limiting
    ACCOUNT_LOCKOUT_DURATION = 60  # Longer lockout
    
    # Require environment variables in production
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Log critical config to admin
        import logging
        from logging.handlers import SMTPHandler
        
        credentials = None
        secure = None
        if getattr(cls, 'MAIL_USERNAME', None) is not None:
            credentials = (cls.MAIL_USERNAME, cls.MAIL_PASSWORD)
            if getattr(cls, 'MAIL_USE_TLS', None):
                secure = ()
        
        mail_handler = SMTPHandler(
            mailhost=(cls.MAIL_SERVER, cls.MAIL_PORT),
            fromaddr=cls.MAIL_DEFAULT_SENDER,
            toaddrs=[cls.ADMIN_NOTIFICATION_EMAIL],
            subject='DoggoDaily Application Error',
            credentials=credentials,
            secure=secure
        )
        mail_handler.setLevel(logging.ERROR)
        app.logger.addHandler(mail_handler)

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 