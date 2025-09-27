#!/usr/bin/env python3
"""
Script to fix JWT user_id conversion issues in API routes
"""

import re

def fix_user_id_conversions():
    """Fix all user_id conversions in api/routes.py"""
    
    # Read the file
    with open('backend/app/api/routes.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix patterns where current_user_id is used in User.query.get()
    patterns_to_fix = [
        # Pattern 1: current_user = User.query.get(current_user_id)
        (r'current_user = User\.query\.get\(current_user_id\)', 
         'current_user = User.query.get(int(current_user_id))'),
        
        # Pattern 2: user = User.query.get(user_id) (if not already fixed)
        (r'user = User\.query\.get\(user_id\)', 
         'user = User.query.get(int(user_id))'),
    ]
    
    # Apply fixes
    for pattern, replacement in patterns_to_fix:
        content = re.sub(pattern, replacement, content)
    
    # Write back to file
    with open('backend/app/api/routes.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Fixed user_id conversions in api/routes.py")

if __name__ == "__main__":
    fix_user_id_conversions() 