import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routes import auth, issues, admin, department, escalation
from app.db.database import Base, engine
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import get_password_hash


Base.metadata.create_all(bind=engine)

with Session(engine) as db:
    admin_email = "admin@publiceye.com"
    if not db.query(User).filter(User.email == admin_email).first():
        db.add(User(
            name="System Admin",
            email=admin_email,
            password_hash=get_password_hash("admin123"),
            role="admin"
        ))
    
    #  Seed Default Departments 
    dept_email = "roads@publiceye.com"
    if not db.query(User).filter(User.email == dept_email).first():
        db.add(User(
            name="Roads & Transport Dept",
            email=dept_email,
            password_hash=get_password_hash("dept123"),
            role="department"
        ))
    
    water_email = "water@publiceye.com"
    if not db.query(User).filter(User.email == water_email).first():
        db.add(User(
            name="Water & Sanitation Dept",
            email=water_email,
            password_hash=get_password_hash("dept123"),
            role="department"
        ))

    # Seed Default Senior Authority 
    senior_email = "senior@publiceye.com"
    if not db.query(User).filter(User.email == senior_email).first():
        db.add(User(
            name="Director / Senior Authority",
            email=senior_email,
            password_hash=get_password_hash("senior123"),
            role="senior_authority"
        ))
        
    db.commit()

#  Ensure upload directory exists 
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Public-Eye API",
    description="Civic Issue & Grievance Tracker — REST API",
    version="1.0.0",
)

#  CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Static files (uploaded images) 
app.mount("/static", StaticFiles(directory="static"), name="static")

#  Routers 
app.include_router(auth.router)
app.include_router(issues.router)
app.include_router(admin.router)
app.include_router(department.router)
app.include_router(escalation.router)


@app.get("/", tags=["root"])
def read_root():
    return {"message": "Welcome to the Public-Eye API", "version": "1.0.0", "docs": "/docs"}
