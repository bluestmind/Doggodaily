#!/usr/bin/env python3
"""
WSGI entry point for production deployment
"""
import os
import sys

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

from app import create_app

# Create the Flask application
application = create_app('production')

if __name__ == "__main__":
    application.run()