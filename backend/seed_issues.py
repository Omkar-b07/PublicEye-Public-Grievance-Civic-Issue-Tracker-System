import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.issue import Issue
from app.models.upvote import Upvote
from app.utils.security import get_password_hash

sample_issues = [
    {
        "title": "Massive pothole on main road",
        "description": "A very large pothole has formed near the junction causing severe traffic slowdowns and damage to vehicles.",
        "category": "Roads",
        "address": "Andheri West, Mumbai",
        "latitude": 19.1136,
        "longitude": 72.8697,
        "priority": "HIGH"
    },
    {
        "title": "Streetlight pole bent and wires exposed",
        "description": "An old streetlight pole is heavily bent and live wires are hanging dangerously low near the sidewalk.",
        "category": "Electricity",
        "address": "Koramangala, Bangalore",
        "latitude": 12.9279,
        "longitude": 77.6271,
        "priority": "HIGH"
    },
    {
        "title": "Garbage overflowing from public bins",
        "description": "The local garbage bins have not been cleared for 3 days and there is waste spreading onto the street.",
        "category": "Waste",
        "address": "Connaught Place, New Delhi",
        "latitude": 28.6304,
        "longitude": 77.2177,
        "priority": "MEDIUM"
    },
    {
        "title": "Water leaking from main supply pipe",
        "description": "Clean drinking water is gushing out of a cracked pipe under the bridge.",
        "category": "Water",
        "address": "Bandra Tali, Mumbai",
        "latitude": 19.0596,
        "longitude": 72.8295,
        "priority": "HIGH"
    },
    {
        "title": "Broken swings in children's park",
        "description": "The swings in the local park have rusted chains that snapped recently. Dangerous for kids.",
        "category": "Parks",
        "address": "Jayanagar, Bangalore",
        "latitude": 12.9250,
        "longitude": 77.5938,
        "priority": "LOW"
    },
    {
        "title": "Traffic signal completely off",
        "description": "The 4-way traffic signal at the intersection is completely dead causing near-misses.",
        "category": "Traffic",
        "address": "T Nagar, Chennai",
        "latitude": 13.0418,
        "longitude": 80.2341,
        "priority": "HIGH"
    }
]

def seed_data():
    db = SessionLocal()
    try:
        # Find a citizen to be the creator
        citizen = db.query(User).filter(User.role == "citizen").first()
        if not citizen:
            citizen = User(
                name="Test Citizen",
                email="citizen1@publiceye.com",
                password_hash=get_password_hash("password123"),
                role="citizen"
            )
            db.add(citizen)
            db.commit()
            db.refresh(citizen)
            
        for issue_data in sample_issues:
            new_issue = Issue(
                title=issue_data["title"],
                description=issue_data["description"],
                category=issue_data["category"],
                address=issue_data["address"],
                latitude=issue_data["latitude"],
                longitude=issue_data["longitude"],
                priority=issue_data["priority"],
                status="PENDING",
                created_by=citizen.id
            )
            db.add(new_issue)
            
        db.commit()
        print(f"Successfully seeded {len(sample_issues)} new reports!")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
