#!/usr/bin/env python3
"""
Script to create admin users for the DoggoDaily application.
Usage: python create_admin.py
"""

import sys
import os
from datetime import datetime, timezone

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, PermissionLevel
from werkzeug.security import generate_password_hash

def create_admin_user(email, name, password, admin_level):
    """Create an admin user with the specified level"""
    app = create_app()
    
    with app.app_context():
        # Create database tables if they don't exist
        try:
            db.create_all()
            print("✅ Database tables created successfully!")
        except Exception as e:
            print(f"⚠️  Warning: Could not create database tables: {str(e)}")
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return False
        
        # Create new admin user
        admin_user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
            admin_level=admin_level,
            email_verified=True,
            is_active=True
        )
        
        try:
            db.session.add(admin_user)
            db.session.commit()
            print(f"✅ Admin user created successfully!")
            print(f"   Email: {email}")
            print(f"   Name: {name}")
            print(f"   Admin Level: {admin_level}")
            return True
        except Exception as e:
            print(f"❌ Error creating admin user: {str(e)}")
            db.session.rollback()
            return False

def main():
    """Main function to create admin users"""
    print("🐕 DoggoDaily Admin User Creator")
    print("=" * 40)
    
    # Create super admin
    print("\n1. Creating Super Admin...")
    create_admin_user(
        email="supernajji@doggodaily.com",
        name="Super Administrator",
        password="SuperNajji123!",
        admin_level=PermissionLevel.SUPER_ADMIN.value
    )
    
    # Create regular admin
    print("\n2. Creating Regular Admin...")
    create_admin_user(
        email="admin@doggodaily.com",
        name="Administrator",
        password="Admin123!",
        admin_level=PermissionLevel.ADMIN.value
    )
    
    # Create moderator
    print("\n3. Creating Moderator...")
    create_admin_user(
        email="moderator@doggodaily.com",
        name="Content Moderator",
        password="Moderator123!",
        admin_level=PermissionLevel.MODERATOR.value
    )
    
    print("\n" + "=" * 40)
    print("🎉 Admin user creation completed!")
    print("\nLogin Credentials:")
    print("Super Admin: supernajji@doggodaily.com / SuperNajji123!")
    print("Admin: admin@doggodaily.com / Admin123!")
    print("Moderator: moderator@doggodaily.com / Moderator123!")
    print("\n⚠️  Please change these passwords after first login!")

if __name__ == "__main__":
    main() 