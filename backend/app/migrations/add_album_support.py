"""
Database migration to add album support to gallery system
"""
import sqlite3
import os
from datetime import datetime

def run_migration():
    """Run the album support migration"""
    
    # Get database path
    base_dir = os.path.dirname(os.path.dirname(__file__))
    instance_dir = os.path.join(base_dir, 'instance')
    db_path = os.path.join(instance_dir, 'app.db')
    
    print(f"🔄 Running album support migration...")
    print(f"📍 Base directory: {base_dir}")
    print(f"📍 Instance directory: {instance_dir}")
    print(f"📍 Database path: {db_path}")
    
    # Create instance directory if it doesn't exist
    os.makedirs(instance_dir, exist_ok=True)
    print(f"✅ Instance directory created/verified")
    
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if gallery_albums table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='gallery_albums'
        """)
        
        if not cursor.fetchone():
            print("📋 Creating gallery_albums table...")
            
            # Create gallery_albums table
            cursor.execute("""
                CREATE TABLE gallery_albums (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    album_type VARCHAR(50) DEFAULT 'mixed',
                    category VARCHAR(100) DEFAULT 'general',
                    tags TEXT,
                    is_featured BOOLEAN DEFAULT 0,
                    status VARCHAR(20) DEFAULT 'active',
                    cover_image_id INTEGER,
                    user_id INTEGER NOT NULL,
                    total_items INTEGER DEFAULT 0,
                    total_views INTEGER DEFAULT 0,
                    total_likes INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (cover_image_id) REFERENCES gallery_items (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            print("✅ gallery_albums table created")
        else:
            print("ℹ️  gallery_albums table already exists")
        
        # Check if album columns exist in gallery_items
        cursor.execute("PRAGMA table_info(gallery_items)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add album_id column if it doesn't exist
        if 'album_id' not in columns:
            print("📋 Adding album_id column to gallery_items...")
            cursor.execute("""
                ALTER TABLE gallery_items 
                ADD COLUMN album_id INTEGER REFERENCES gallery_albums(id)
            """)
            print("✅ album_id column added")
        else:
            print("ℹ️  album_id column already exists")
        
        # Add album_order column if it doesn't exist
        if 'album_order' not in columns:
            print("📋 Adding album_order column to gallery_items...")
            cursor.execute("""
                ALTER TABLE gallery_items 
                ADD COLUMN album_order INTEGER DEFAULT 0
            """)
            print("✅ album_order column added")
        else:
            print("ℹ️  album_order column already exists")
        
        # Add is_album_cover column if it doesn't exist
        if 'is_album_cover' not in columns:
            print("📋 Adding is_album_cover column to gallery_items...")
            cursor.execute("""
                ALTER TABLE gallery_items 
                ADD COLUMN is_album_cover BOOLEAN DEFAULT 0
            """)
            print("✅ is_album_cover column added")
        else:
            print("ℹ️  is_album_cover column already exists")
        
        # Check if album_views table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='album_views'
        """)
        
        if not cursor.fetchone():
            print("📋 Creating album_views table...")
            
            # Create album_views table
            cursor.execute("""
                CREATE TABLE album_views (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    album_id INTEGER NOT NULL,
                    user_id INTEGER,
                    session_id VARCHAR(255),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    view_duration INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (album_id) REFERENCES gallery_albums (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            print("✅ album_views table created")
        else:
            print("ℹ️  album_views table already exists")
        
        # Check if album_likes table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='album_likes'
        """)
        
        if not cursor.fetchone():
            print("📋 Creating album_likes table...")
            
            # Create album_likes table
            cursor.execute("""
                CREATE TABLE album_likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    album_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (album_id) REFERENCES gallery_albums (id),
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    UNIQUE(album_id, user_id)
                )
            """)
            print("✅ album_likes table created")
        else:
            print("ℹ️  album_likes table already exists")
        
        # Commit changes
        conn.commit()
        print("✅ Album support migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration()