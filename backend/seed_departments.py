import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.upvote import Upvote
from app.models.issue import Issue
from app.models.user import User
from app.utils.security import get_password_hash

departments_to_add = [
    {"name": "Public Works Department", "email": "pwd@publiceye.com", "phone": "18001001"},
    {"name": "Water Supply & Sewerage Board", "email": "water@publiceye.com", "phone": "18001002"},
    {"name": "Electricity Board", "email": "electricity@publiceye.com", "phone": "18001003"},
    {"name": "Municipal Waste Management", "email": "waste@publiceye.com", "phone": "18001004"},
    {"name": "Traffic Police Department", "email": "traffic@publiceye.com", "phone": "18001005"},
    {"name": "Parks & Recreation", "email": "parks@publiceye.com", "phone": "18001006"},
    {"name": "Public Health Department", "email": "health@publiceye.com", "phone": "18001007"}
]

def seed_departments():
    db = SessionLocal()
    try:
        for dept in departments_to_add:
            existing = db.query(User).filter(User.email == dept["email"]).first()
            if not existing:
                new_dept = User(
                    name=dept["name"],
                    email=dept["email"],
                    phone=dept["phone"],
                    password_hash=get_password_hash("password123"),
                    role="department"
                )
                db.add(new_dept)
                print(f"Added {dept['name']}")
            else:
                print(f"Already exists: {dept['name']}")
        db.commit()
        print("Done seeding departments!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_departments()
