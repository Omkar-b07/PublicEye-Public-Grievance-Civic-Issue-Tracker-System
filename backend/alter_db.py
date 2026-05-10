import sqlite3

def upgrade():
    conn = sqlite3.connect("./publiceye.db")
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE issues ADD COLUMN feedback_rating INTEGER")
        print("Added feedback_rating column.")
    except sqlite3.OperationalError as e:
        print(f"Skipped feedback_rating: {e}")
        
    try:
        cursor.execute("ALTER TABLE issues ADD COLUMN feedback_text TEXT")
        print("Added feedback_text column.")
    except sqlite3.OperationalError as e:
        print(f"Skipped feedback_text: {e}")
        
    try:
        cursor.execute("ALTER TABLE issues ADD COLUMN is_false_resolution BOOLEAN DEFAULT FALSE")
        print("Added is_false_resolution column.")
    except sqlite3.OperationalError as e:
        print(f"Skipped is_false_resolution: {e}")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
