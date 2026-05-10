from app.db.database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE issues ADD COLUMN is_false_resolution BOOLEAN DEFAULT FALSE NOT NULL"))
            conn.commit()
            print("Successfully added 'is_false_resolution' column.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    add_column()
