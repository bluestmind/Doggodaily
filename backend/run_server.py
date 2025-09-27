#!/usr/bin/env python3
"""
Simple server runner for NavidDoggy Backend
Usage: python run_server.py
"""

from manage import app
import logging

if __name__ == '__main__':
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    logger.info("🚀 Starting NavidDoggy Backend Server...")
    logger.info("🌐 Server will be accessible at: http://46.101.244.203:5000")
    logger.info("🔧 CORS enabled for frontend communication")
    
    try:
        # Run server on all interfaces (0.0.0.0) so it's accessible from outside
        app.run(
            host='0.0.0.0',  # Listen on all interfaces
            port=5000,
            debug=False,
            threaded=True
        )
    except Exception as e:
        logger.error(f"❌ Server failed to start: {e}")