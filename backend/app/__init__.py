import os
from flask import Flask, request, jsonify
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_login import current_user
from datetime import datetime
import logging
from dotenv import load_dotenv

from .extensions import db, cors, login_manager, mail, migrate, oauth
from .api import api_bp
from .auth import auth_bp
from .main import main_bp
from .api.routes.admin_routes import admin_bp
from config import config as config_map

# Import all model files to ensure they're registered with SQLAlchemy
from . import models_extended
from . import models_analytics  
from . import models_security
from . import models_gallery_extended

def create_app(config_name=None):
    app = Flask(__name__)

    # Load environment variables from .env (if present)
    load_dotenv()

    # Load configuration (prefer explicit env, fallback to development)
    selected_config = config_name or os.environ.get('FLASK_CONFIG') or os.environ.get('FLASK_ENV') or 'development'
    # Normalize values like "Development"/"development"
    selected_config = str(selected_config).lower()
    app_config_class = config_map.get(selected_config, config_map.get('development'))
    app.config.from_object(app_config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    oauth.init_app(app)
    
    # Enhanced CORS configuration with debugging
    cors_origins = app.config.get('CORS_ORIGINS', [])
    print(f"🌐 CORS Origins configured: {cors_origins}")
    
    cors.init_app(app, 
        origins=cors_origins,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        allow_headers=[
            'Content-Type', 
            'Authorization', 
            'X-Requested-With', 
            'X-Device-Fingerprint',
            'Accept',
            'Origin',
            'Access-Control-Request-Method',
            'Access-Control-Request-Headers'
        ],
        supports_credentials=True,
        expose_headers=['Content-Range', 'X-Content-Range'],
        max_age=86400
    )
    
    login_manager.init_app(app)
    mail.init_app(app)
    # No JWT - using Flask-Login sessions only
    
    # Security Headers with Talisman
    csp = {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'font-src': "'self' https://fonts.gstatic.com",
        'img-src': "'self' data: https: blob:",
        'connect-src': "'self' https:",
        'frame-ancestors': "'none'",
        'base-uri': "'self'",
        'form-action': "'self'"
    }
    
    Talisman(app, 
        force_https=app.config.get('FORCE_HTTPS', False),
        strict_transport_security=True,
        content_security_policy=csp,
        feature_policy={
            'geolocation': "'none'",
            'camera': "'none'",
            'microphone': "'none'",
            'payment': "'none'"
        }
    )
    
    # Rate Limiting
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=["2000 per day", "200 per hour"],
        storage_uri=app.config.get('RATELIMIT_STORAGE_URL', 'memory://'),
        strategy="fixed-window"
    )
    
    # Apply rate limits to auth endpoints
    limiter.limit("30 per minute")(auth_bp)
    limiter.limit("100 per hour", per_method=True)(api_bp)

    # Configure login manager
    login_manager.login_view = 'api.auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    login_manager.session_protection = 'strong'

    @login_manager.unauthorized_handler
    def handle_unauthorized():
        # For API endpoints, return JSON 401 instead of redirecting
        return jsonify({
            'success': False,
            'message': 'Login required'
        }), 401

    @login_manager.user_loader
    def load_user(user_id):
        from .models import User
        return User.query.get(int(user_id))

    # Removed JWT callbacks (session-based auth)

    # Security middleware
    @app.before_request
    def security_middleware():
        """Enhanced security middleware with comprehensive logging"""
        try:
            # Log request details for security monitoring
            if request.endpoint and 'api' in request.endpoint:
                from .auth.utils import TokenManager
                
                # Get client information
                client_ip = request.remote_addr
                user_agent = request.headers.get('User-Agent', 'Unknown')
                device_fingerprint = request.headers.get('X-Device-Fingerprint', 'Unknown')
                
                # Log API requests for security monitoring
                app.logger.info(f"🔍 API Request: {request.method} {request.path} | IP: {client_ip} | Device: {device_fingerprint}")
                
                # Check for suspicious patterns
                if request.method == 'POST' and request.path in ['/api/auth/login', '/api/auth/admin/login']:
                    app.logger.info(f"🔐 Login Attempt: {request.path} | IP: {client_ip}")
                
        except Exception as e:
            app.logger.error(f"Security middleware error: {str(e)}")

    # Security headers
    @app.after_request
    def add_security_headers(response):
        """Add comprehensive security headers"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        return response

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'message': 'Bad request',
            'error': 'bad_request'
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'success': False,
            'message': 'Unauthorized',
            'error': 'unauthorized'
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'success': False,
            'message': 'Forbidden',
            'error': 'forbidden'
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Not found',
            'error': 'not_found'
        }), 404

    @app.errorhandler(422)
    def validation_error(error):
        return jsonify({
            'success': False,
            'message': 'Validation error',
            'error': 'validation_error'
        }), 422

    @app.errorhandler(423)
    def locked(error):
        return jsonify({
            'success': False,
            'message': 'Resource is locked',
            'error': 'locked'
        }), 423

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            'success': False,
            'message': 'Rate limit exceeded. Please try again later.',
            'error': 'rate_limit_exceeded',
            'retry_after': e.retry_after if hasattr(e, 'retry_after') else None
        }), 429

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f"Internal server error: {str(error)}")
        return jsonify({
            'success': False,
            'message': 'Internal server error',
            'error': 'internal_error'
        }), 500

    # Health check endpoint
    @app.route('/health')
    def health_check():
        """Enhanced health check endpoint"""
        try:
            # Check database connection
            db.session.execute('SELECT 1')
            db_status = 'healthy'
        except Exception as e:
            db_status = 'unhealthy'
            app.logger.error(f"Database health check failed: {str(e)}")
        
        # Check memory usage
        import psutil
        memory = psutil.virtual_memory()
        memory_healthy = memory.percent < 90
        
        # Overall health
        overall_healthy = db_status == 'healthy' and memory_healthy
        
        return jsonify({
            'success': True,
            'healthy': overall_healthy,
            'checks': {
                'database': db_status,
                'memory': 'healthy' if memory_healthy else 'unhealthy',
                'timestamp': datetime.utcnow().isoformat()
            }
        }), 200 if overall_healthy else 503

    # Register blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # Register Google OAuth client once at startup (per Google Web Server OAuth flow)
    try:
        google_client_id = app.config.get('GOOGLE_CLIENT_ID')
        google_client_secret = app.config.get('GOOGLE_CLIENT_SECRET')
        if google_client_id and google_client_secret:
            oauth.register(
                name='google',
                client_id=google_client_id,
                client_secret=google_client_secret,
                server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
                client_kwargs={'scope': 'openid email profile'}
            )
    except Exception as e:
        app.logger.error(f"Failed to register Google OAuth client: {e}")
    
    return app 