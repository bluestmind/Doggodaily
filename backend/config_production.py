import os
from config import Config

class ProductionConfig(Config):
    """Production configuration"""
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f'sqlite:///{os.path.join(os.path.abspath(os.path.dirname(__file__)), "data", "production.db")}'
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-production-secret-key-change-this'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-jwt-secret-key-change-this'
    
    # Flask-Login Session Protection
    SESSION_COOKIE_SECURE = True  # HTTPS only
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 86400  # 24 hours
    
    # CORS for production
    CORS_ORIGINS = [
        'https://www.doggodaiily.com',  # Production domain
        'https://doggodaiily.com',      # Production domain without www
        'http://46.101.244.203:3000',  # Frontend on port 3000 (fallback)
        'http://46.101.244.203:5000',  # Backend API (fallback)
        'https://46.101.244.203',      # IP fallback
        'http://localhost:3000'        # For local development
    ]
    
    # Frontend URL for production
    FRONTEND_URL = 'https://www.doggodaiily.com'
    
    # Google OAuth redirect for production
    GOOGLE_REDIRECT_URI = 'https://www.doggodaiily.com/api/auth/google/callback'
    
    # Email configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    
    # Upload configuration
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or '/var/www/naviddog/uploads'
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
    
    # Logging
    LOG_LEVEL = 'INFO'
    LOG_FILE = '/var/log/naviddog/app.log'
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL') or 'memory://'
    
    # Security headers
    SECURITY_CONTENT_SECURITY_POLICY = {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'font-src': "'self'",
        'connect-src': "'self'",
        'media-src': "'self'"
    }
    
    # Performance
    SEND_FILE_MAX_AGE_DEFAULT = 31536000  # 1 year for static files
    
    # Debug settings
    DEBUG = False
    TESTING = False
    
    # Google OAuth (if using)
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')