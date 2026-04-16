"""
Authentication routes:
  POST /auth/signup        — register a new user
  POST /auth/login         — login, get JWT
  GET  /auth/me            — get current user profile
  POST /auth/otp/send      — send (fake) OTP to email (logged to console)
  POST /auth/otp/verify    — verify the OTP code
"""
import random
import string
from datetime import timedelta, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, Token, OTPRequest, OTPVerify
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.config import settings
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# --- In-memory OTP store: { phone: {"otp": "123456", "expires_at": datetime} }
_otp_store: dict = {}


# ─────────────────────────────────────────────────────────────────────────────
# Signup
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Role defaults to 'citizen'."""
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    existing_phone = db.query(User).filter(User.phone == user_in.phone).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="An account with this mobile number already exists.")

    user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role or "citizen",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ─────────────────────────────────────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email + password. Returns a JWT access token."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ─────────────────────────────────────────────────────────────────────────────
# Current User
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


# ─────────────────────────────────────────────────────────────────────────────
# Dummy OTP (no external SMS API — OTP is printed to the server console)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/otp/send", status_code=200)
def send_otp(request: OTPRequest):
    """
    Generate a 6-digit OTP and 'send' it (prints to console for demo).
    Valid for 5 minutes.
    """
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    _otp_store[request.phone] = {"otp": otp, "expires_at": expires_at}

    # In a real app:  send_sms(request.phone, otp)
    print(f"\n{'='*40}")
    print(f"  📱  OTP securely queued for Mobile: {request.phone}")
    print(f"      OTP Code: {otp}")
    print(f"  Expires at: {expires_at.strftime('%H:%M:%S UTC')}")
    print(f"{'='*40}\n")

    return {"message": f"OTP successfully sent to {request.phone}. Please check the console in purely dev mode."}


@router.post("/otp/verify", status_code=200)
def verify_otp(request: OTPVerify):
    """Verify a previously issued OTP. Returns success/failure."""
    record = _otp_store.get(request.phone)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP was requested for this mobile number.")

    if datetime.utcnow() > record["expires_at"]:
        del _otp_store[request.phone]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    if record["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    # Clean up
    del _otp_store[request.phone]
    return {"message": "Mobile number verified successfully."}
