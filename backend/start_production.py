#!/usr/bin/env python3
"""
Production startup script for NavidDoggy Backend
Sets correct environment variables and starts server
"""

import os
import sys
from manage import app

def set_production_environment():
    """Set production environment variables"""
    
    # Production URLs
    os.environ['FRONTEND_URL'] = 'http://46.101.244.203:3000'
    os.environ['BACKEND_URL'] = 'http://46.101.244.203:5000'
    
    # CORS Configuration
    os.environ['CORS_ORIGINS'] = 'http://46.101.244.203:3000,http://46.101.244.203:5000,http://localhost:3000'
    
    # OAuth Configuration
    os.environ['GOOGLE_REDIRECT_URI'] = 'http://46.101.244.203:5000/api/auth/google/callback'
    
    # Flask Configuration
    os.environ['FLASK_ENV'] = 'production'
    os.environ['FLASK_DEBUG'] = 'False'
    
    print("🌐 Production environment variables set:")
    print(f"   FRONTEND_URL: {os.environ['FRONTEND_URL']}")
    print(f"   BACKEND_URL: {os.environ['BACKEND_URL']}")
    print(f"   CORS_ORIGINS: {os.environ['CORS_ORIGINS']}")
    print(f"   GOOGLE_REDIRECT_URI: {os.environ['GOOGLE_REDIRECT_URI']}")

def main():
    """Main startup function"""
    print("🚀 Starting NavidDoggy Backend in Production Mode...")
    
    # Set production environment
    set_production_environment()
    
    # Log configuration
    print("\n🔧 Configuration:")
    print(f"   Frontend URL: {app.config.get('FRONTEND_URL')}")
    print(f"   CORS Origins: {app.config.get('CORS_ORIGINS')}")
    print(f"   Google Redirect: {app.config.get('GOOGLE_REDIRECT_URI')}")
    
    print("\n🌍 Starting server on http://46.101.244.203:5000")
    print("   Server will be accessible from:")
    print("   - http://46.101.244.203:5000 (public)")
    print("   - http://127.0.0.1:5000 (local)")
    print("\n📡 Admin routes will use server IP, not localhost")
    print("✅ All localhost references have been updated")
    
    try:
        # Start the server
        app.run(
            host='0.0.0.0',  # Listen on all interfaces
            port=5000,
            debug=False,
            threaded=True
        )
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()