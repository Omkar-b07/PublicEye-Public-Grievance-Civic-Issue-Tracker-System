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
from app.schemas.user_schema import UserCreate, UserResponse, Token, OTPRequest, OTPVerify, ForgotPasswordRequest, ForgotPasswordReset, UserUpdate
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


@router.put("/me", response_model=UserResponse)
def update_me(update_data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update the currently authenticated user's profile. Requires OTP if phone changes."""
    if update_data.name:
        current_user.name = update_data.name
        
    if update_data.phone and update_data.phone != current_user.phone:
        record = _otp_store.get(update_data.phone)
        if not record:
            raise HTTPException(status_code=400, detail="OTP is required to change mobile number. Please request one first.")
        if datetime.utcnow() > record["expires_at"]:
            del _otp_store[update_data.phone]
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        if not update_data.otp or record["otp"] != update_data.otp:
            raise HTTPException(status_code=400, detail="Incorrect OTP.")
            
        del _otp_store[update_data.phone]
        
        # Verify phone is not used by another user
        existing = db.query(User).filter(User.phone == update_data.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="This mobile number is already in use by another account.")
            
        current_user.phone = update_data.phone

    db.commit()
    db.refresh(current_user)
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


# ─────────────────────────────────────────────────────────────────────────────
# Forgot Password
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/forgot-password/request", status_code=200)
def request_password_reset(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    _otp_store[request.email] = {"otp": otp, "expires_at": expires_at}

    print(f"\n{'='*40}")
    print(f"  🔐 Password Reset requested for: {request.email}")
    print(f"      OTP Code: {otp}")
    print(f"  Expires at: {expires_at.strftime('%H:%M:%S UTC')}")
    print(f"{'='*40}\n")

    return {"message": "If the email matches an account, we sent an OTP. Check your console."}


@router.post("/forgot-password/reset", status_code=200)
def reset_password(request: ForgotPasswordReset, db: Session = Depends(get_db)):
    record = _otp_store.get(request.email)
    if not record:
        raise HTTPException(status_code=400, detail="No reset requested for this email.")

    if datetime.utcnow() > record["expires_at"]:
        del _otp_store[request.email]
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    if record["otp"] != request.otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    user.password_hash = get_password_hash(request.new_password)
    db.commit()

    del _otp_store[request.email]
    return {"message": "Password successfully reset! You can now log in."}
