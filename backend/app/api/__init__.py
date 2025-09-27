from flask import Blueprint

# Create the main API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import all route modules to register them
from .routes.auth_routes import auth_bp
from .routes.user_routes import user_bp
from .routes.story_routes import story_bp
# Gallery routes moved to admin_routes.py
from .routes.tour_routes import tour_routes
from .routes.admin_routes import admin_bp
from .routes.security_routes import security_bp
from .routes.analytics_routes import analytics_bp
from .routes.communication_routes import communication_bp
from .routes.system_routes import system_bp
from .routes.bulk_routes import bulk_bp
from .routes.story_bulk import story_extra_bp
from .routes.book_routes import book_bp
from .routes.contact_routes import contact_bp
# Register all blueprints
api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(user_bp, url_prefix='/users')
api_bp.register_blueprint(story_bp, url_prefix='/stories')
# Gallery blueprint removed - functionality moved to admin_routes.py
api_bp.register_blueprint(tour_routes, url_prefix='/tours')
api_bp.register_blueprint(admin_bp, url_prefix='/admin')
api_bp.register_blueprint(security_bp, url_prefix='/security')
api_bp.register_blueprint(analytics_bp, url_prefix='/analytics')
api_bp.register_blueprint(communication_bp, url_prefix='/communications')
api_bp.register_blueprint(system_bp, url_prefix='/system')
api_bp.register_blueprint(bulk_bp, url_prefix='/bulk')
api_bp.register_blueprint(book_bp, url_prefix='/books')
api_bp.register_blueprint(contact_bp, url_prefix='/contact')
story_bp.register_blueprint(story_extra_bp)

# Import and register new admin routes
try:
    from .routes.dashboard_routes import dashboard_bp
    api_bp.register_blueprint(dashboard_bp, url_prefix='/admin/dash')
except Exception as e:
    print(f"Failed to register dashboard routes: {e}")

try:
    from .routes.communications_routes import communications_bp as comms_bp
    api_bp.register_blueprint(comms_bp, url_prefix='/admin/comms')
except Exception as e:
    print(f"Failed to register communications routes: {e}")

try:
    from .routes.analytics_extended import analytics_extended_bp
    api_bp.register_blueprint(analytics_extended_bp, url_prefix='/admin/stats')
except Exception as e:
    print(f"Failed to register analytics routes: {e}")

try:
    from .routes.notifications_routes import notifications_bp
    api_bp.register_blueprint(notifications_bp, url_prefix='/admin/notifications')
except Exception as e:
    print(f"Failed to register notifications routes: {e}")

try:
    from .routes.security_admin_routes import security_admin_bp
    api_bp.register_blueprint(security_admin_bp, url_prefix='/admin/security')
except Exception as e:
    print(f"Failed to register security admin routes: {e}")

try:
    from .routes.system_admin_routes import system_admin_bp
    api_bp.register_blueprint(system_admin_bp, url_prefix='/admin/system')
except Exception as e:
    print(f"Failed to register system admin routes: {e}")

try:
    from .routes.profile_routes import profile_bp
    api_bp.register_blueprint(profile_bp, url_prefix='/profile')
except Exception as e:
    print(f"Failed to register profile routes: {e}")

# Story submission routes are now integrated into profile_routes.py

# Register admin story routes
try:
    from .routes.admin_story_routes import admin_story_bp
    api_bp.register_blueprint(admin_story_bp, url_prefix='/admin/stories')
    print("✅ Admin story routes registered")
except Exception as e:
    print(f"❌ Failed to register admin story routes: {e}")

# Register user preferences routes
try:
    from .routes.user_preferences_routes import user_preferences_bp
    api_bp.register_blueprint(user_preferences_bp, url_prefix='/user/preferences')
    print("✅ User preferences routes registered")
except Exception as e:
    print(f"❌ Failed to register user preferences routes: {e}")

# Register enhanced analytics routes
try:
    from .routes.analytics_enhanced import analytics_enhanced_bp
    api_bp.register_blueprint(analytics_enhanced_bp, url_prefix='/analytics')
    print("✅ Enhanced analytics routes registered")
except Exception as e:
    print(f"❌ Failed to register enhanced analytics routes: {e}")

# Register enhanced security routes
try:
    from .routes.security_enhanced import security_enhanced_bp
    api_bp.register_blueprint(security_enhanced_bp, url_prefix='/security')
    print("✅ Enhanced security routes registered")
except Exception as e:
    print(f"❌ Failed to register enhanced security routes: {e}")

# Book management routes moved to admin_routes.py

# Gallery albums routes moved to admin_routes.py 