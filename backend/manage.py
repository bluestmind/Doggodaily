#!/usr/bin/env python3

import os
import sys
from flask.cli import FlaskGroup
from app import create_app
from app.models import db, User, Story, GalleryItem, Tour
from werkzeug.security import generate_password_hash
from datetime import datetime

# Import enhanced logging
from enhanced_logging import setup_enhanced_logging

app = create_app()

# Setup enhanced logging
setup_enhanced_logging(app)

cli = FlaskGroup(app)

@cli.command()
def create_db():
    """Create database tables."""
    db.create_all()
    app.logger.info("DATABASE: Tables created successfully")
    print("Database tables created.")

@cli.command()
def drop_db():
    """Drop database tables."""
    db.drop_all()
    app.logger.info("DATABASE: Tables dropped successfully")
    print("Database tables dropped.")

@cli.command()
def init_db():
    """Initialize database with sample data."""
    app.logger.info("DATABASE: Initializing with sample data...")
    
    # Create tables
    db.create_all()
    
    # Create admin user
    admin = User.query.filter_by(email='admin@example.com').first()
    if not admin:
        admin = User(
            name='Admin User',
            email='admin@example.com',
            role='admin',
            is_active=True,
            email_verified=True
        )
        admin.set_password('admin123')
        db.session.add(admin)
        app.logger.info("USER_CREATED: Admin user created - admin@example.com")
        print("Created admin user: admin@example.com / admin123")
    
    # Create test user
    user = User.query.filter_by(email='user@example.com').first()
    if not user:
        user = User(
            name='Test User',
            email='user@example.com',
            role='user',
            is_active=True,
            email_verified=True
        )
        user.set_password('user123')
        db.session.add(user)
        app.logger.info("USER_CREATED: Test user created - user@example.com")
        print("Created test user: user@example.com / user123")
    
    db.session.commit()
    app.logger.info("DATABASE: Initialization completed successfully")
    print("Database initialized with sample data.")

@cli.command()
def create_admin():
    """Create an admin user for testing."""
    app.logger.info("ADMIN_SETUP: Creating admin user...")
    
    admin = User.query.filter_by(email='admin@test.com').first()
    if admin:
        app.logger.info("ADMIN_SETUP: Admin user already exists")
        print("Admin user already exists: admin@test.com")
        return
    
    admin = User(
        name='Test Admin',
        email='admin@test.com',
        role='admin',
        is_active=True,
        email_verified=True
    )
    admin.set_password('TestAdmin123!')
    db.session.add(admin)
    db.session.commit()
    
    app.logger.info("ADMIN_SETUP: Admin user created successfully")
    app.logger.info("ADMIN_CREDENTIALS: Email=admin@test.com, Password=TestAdmin123!")
    
    print("Created admin user:")
    print("Email: admin@test.com")
    print("Password: TestAdmin123!")

@cli.command()
def run_debug():
    """Run comprehensive debug tests"""
    app.logger.info("DEBUG: Starting comprehensive debug tests...")
    
    # Import and run debug script
    try:
        import debug_admin
        debug_admin.main()
    except ImportError:
        app.logger.error("DEBUG: Debug script not found - debug_admin.py missing")
        print("Debug script not found.")

@cli.command('run-server')
def run_server():
    """Run the server on production IP"""
    app.logger.info("SERVER: Starting on production IP...")
    app.run(host='0.0.0.0', port=5000, debug=False)

@cli.command('run-local')
def run_local():
    """Run the server locally"""
    app.logger.info("SERVER: Starting on localhost...")
    app.run(host='127.0.0.1', port=5000, debug=True)

# Use the new Flask 2.0+ way to run startup code
@app.before_request
def log_startup():
    """Log application startup (runs before first request)"""
    if not hasattr(app, '_startup_logged'):
        app.logger.info("SERVER_STARTUP: NavidDoggy Backend Server Starting...")
        app.logger.info(f"ENVIRONMENT: {app.config.get('ENV', 'development')}")
        app.logger.info(f"DEBUG_MODE: {app.config.get('DEBUG', False)}")
        app.logger.info(f"DATABASE_URI: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Unknown')}")
        app._startup_logged = True

if __name__ == '__main__':
    app.logger.info("CLI_STARTUP: Starting Flask CLI...")
    cli() 