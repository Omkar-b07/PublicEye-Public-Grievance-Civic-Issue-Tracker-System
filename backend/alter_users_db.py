import sqlite3

def upgrade():
    conn = sqlite3.connect("./publiceye.db")
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN phone VARCHAR")
        print("Added phone column to users.")
    except sqlite3.OperationalError as e:
        print(f"Skipped adding phone column: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
