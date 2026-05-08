from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import re
import secrets
import asyncio
from collections import defaultdict
import time
from apscheduler.schedulers.background import BackgroundScheduler
from email_utils import (
    send_booking_confirmation_email, 
    send_booking_reminder_email, 
    send_password_reset_email, 
    send_new_booking_notification_email, 
    send_booking_cancellation_email,
    send_review_request_email,
    send_review_reminder_email,
    send_email
)
import stripe

# Setup logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ============================================
# RATE LIMITING - Simple in-memory rate limiter
# ============================================
class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.lock = asyncio.Lock()
    
    async def is_rate_limited(self, key: str, max_requests: int = 5, window_seconds: int = 60) -> bool:
        """Check if a key is rate limited. Returns True if limited."""
        async with self.lock:
            now = time.time()
            # Clean old entries
            self.requests[key] = [t for t in self.requests[key] if now - t < window_seconds]
            
            if len(self.requests[key]) >= max_requests:
                logger.warning(f"Rate limit exceeded for: {key}")
                return True
            
            self.requests[key].append(now)
            return False

rate_limiter = RateLimiter()

# ============================================
# GLOBAL ERROR HANDLER
# ============================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Interna greška servera. Molimo pokušajte ponovo."}
    )

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_professional(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    professional = await db.professionals.find_one({"email": email}, {"_id": 0})
    if professional is None:
        raise HTTPException(status_code=401, detail="Professional not found")
    return professional

def create_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

class ProfessionalRegister(BaseModel):
    name: str
    profession: str
    country: str
    city: str
    bio: str
    phone: str
    email: EmailStr
    password: str
    
    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Ime i prezime je obavezno')
        if len(v.strip()) < 2:
            raise ValueError('Ime mora imati najmanje 2 znaka')
        return v.strip()
    
    @field_validator('phone')
    @classmethod
    def phone_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Telefon je obavezan')
        # Basic phone validation - at least 6 digits
        digits = re.sub(r'\D', '', v)
        if len(digits) < 6:
            raise ValueError('Telefon mora imati najmanje 6 znamenki')
        return v.strip()
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if not v or len(v) < 6:
            raise ValueError('Lozinka mora imati najmanje 6 znakova')
        return v

class ProfessionalLogin(BaseModel):
    email: EmailStr
    password: str

class Professional(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    name: str
    profession: str
    country: str
    city: str
    bio: str
    phone: str
    slug: str
    rating: float
    review_count: int
    created_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    professional: Professional

class WorkingHoursDay(BaseModel):
    enabled: bool
    start_time: Optional[str] = None  # Format: "08:00"
    end_time: Optional[str] = None    # Format: "17:00"

class WorkingHours(BaseModel):
    monday: WorkingHoursDay
    tuesday: WorkingHoursDay
    wednesday: WorkingHoursDay
    thursday: WorkingHoursDay
    friday: WorkingHoursDay
    saturday: WorkingHoursDay
    sunday: WorkingHoursDay

class ServiceCreate(BaseModel):
    name: str
    duration_minutes: int
    price: float

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    professional_email: str
    name: str
    duration_minutes: int
    price: float
    created_at: datetime

class DayOff(BaseModel):
    date: str  # Format: "YYYY-MM-DD"
    reason: Optional[str] = None

class BookingCreate(BaseModel):
    service_id: str
    booking_datetime: str  # ISO format
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    description: Optional[str] = None
    
    @field_validator('client_name')
    @classmethod
    def client_name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Ime klijenta je obavezno')
        return v.strip()
    
    @field_validator('client_phone')
    @classmethod
    def client_phone_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Telefon klijenta je obavezan')
        return v.strip()
    
    @field_validator('booking_datetime')
    @classmethod
    def validate_datetime_format(cls, v):
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError('Neispravan format datuma i vremena')

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    professional_email: str
    professional_name: str
    service_id: str
    service_name: str
    service_duration: int
    service_price: float
    client_name: str
    client_phone: str
    client_email: Optional[str]
    description: Optional[str] = None
    booking_datetime: datetime
    status: str  # pending, confirmed, cancelled, completed
    reviewed: bool
    review_token: Optional[str]
    review_token_expires: Optional[str] = None  # ISO format datetime
    review_reminder_sent: bool = False
    reminder_sent: bool
    created_at: datetime

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    booking_id: str
    professional_email: str
    rating: int  # 1-5
    comment: Optional[str]
    client_name: str
    created_at: datetime

class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class PublicProfile(BaseModel):
    name: str
    profession: str
    country: str
    city: str
    bio: str
    phone: str
    rating: float
    review_count: int
    services: List[Service]
    reviews: List[Review]

@api_router.post("/auth/register", response_model=AuthResponse)
async def register(data: ProfessionalRegister, request: Request):
    # Rate limiting by IP
    client_ip = request.client.host if request.client else "unknown"
    if await rate_limiter.is_rate_limited(f"register:{client_ip}", max_requests=5, window_seconds=300):
        logger.warning(f"Rate limit exceeded for registration from IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Previše zahtjeva. Pokušajte ponovo za nekoliko minuta.")
    
    try:
        existing = await db.professionals.find_one({"email": data.email})
        if existing:
            logger.info(f"Registration attempt with existing email: {data.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        slug = create_slug(data.name)
        existing_slug = await db.professionals.find_one({"slug": slug})
        counter = 1
        original_slug = slug
        while existing_slug:
            slug = f"{original_slug}-{counter}"
            existing_slug = await db.professionals.find_one({"slug": slug})
            counter += 1
        
        professional_doc = {
            "email": data.email,
            "name": data.name,
            "profession": data.profession,
            "country": data.country,
            "city": data.city,
            "bio": data.bio,
            "phone": data.phone,
            "password_hash": hash_password(data.password),
            "slug": slug,
            "rating": 0.0,
            "review_count": 0,
            "password_reset_token": None,
            "password_reset_expires": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "working_hours": {
                "monday": {"enabled": True, "start_time": "08:00", "end_time": "17:00"},
                "tuesday": {"enabled": True, "start_time": "08:00", "end_time": "17:00"},
                "wednesday": {"enabled": True, "start_time": "08:00", "end_time": "17:00"},
                "thursday": {"enabled": True, "start_time": "08:00", "end_time": "17:00"},
                "friday": {"enabled": True, "start_time": "08:00", "end_time": "17:00"},
                "saturday": {"enabled": False, "start_time": None, "end_time": None},
                "sunday": {"enabled": False, "start_time": None, "end_time": None}
            },
            "days_off": []
        }
        
        await db.professionals.insert_one(professional_doc)
        logger.info(f"New professional registered: {data.email}, slug: {slug}")
        
        access_token = create_access_token(data={"sub": data.email})
        
        professional = Professional(
            email=data.email,
            name=data.name,
            profession=data.profession,
            country=data.country,
            city=data.city,
            bio=data.bio,
            phone=data.phone,
            slug=slug,
            rating=0.0,
            review_count=0,
            created_at=datetime.fromisoformat(professional_doc["created_at"])
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            professional=professional
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Greška pri registraciji. Pokušajte ponovo.")

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(data: ProfessionalLogin, request: Request):
    # Rate limiting by IP and email
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"login:{client_ip}:{data.email}"
    
    if await rate_limiter.is_rate_limited(rate_key, max_requests=5, window_seconds=60):
        logger.warning(f"Rate limit exceeded for login from IP: {client_ip}, email: {data.email}")
        raise HTTPException(status_code=429, detail="Previše pokušaja prijave. Pokušajte ponovo za minutu.")
    
    try:
        professional = await db.professionals.find_one({"email": data.email}, {"_id": 0})
        if not professional or not verify_password(data.password, professional["password_hash"]):
            logger.info(f"Failed login attempt for email: {data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"Successful login: {data.email}")
        access_token = create_access_token(data={"sub": data.email})
        
        prof_obj = Professional(
            email=professional["email"],
            name=professional["name"],
            profession=professional["profession"],
            country=professional.get("country", ""),
            city=professional.get("city", ""),
            bio=professional.get("bio", ""),
            phone=professional["phone"],
            slug=professional["slug"],
            rating=professional.get("rating", 0.0),
            review_count=professional.get("review_count", 0),
            created_at=datetime.fromisoformat(professional["created_at"])
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            professional=prof_obj
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Greška pri prijavi. Pokušajte ponovo.")

@api_router.get("/auth/me", response_model=Professional)
async def get_me(current_professional: dict = Depends(get_current_professional)):
    return Professional(
        email=current_professional["email"],
        name=current_professional["name"],
        profession=current_professional["profession"],
        country=current_professional.get("country", ""),
        city=current_professional.get("city", ""),
        bio=current_professional.get("bio", ""),
        phone=current_professional["phone"],
        slug=current_professional["slug"],
        rating=current_professional.get("rating", 0.0),
        review_count=current_professional.get("review_count", 0),
        created_at=datetime.fromisoformat(current_professional["created_at"])
    )

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    professional = await db.professionals.find_one({"email": data.email}, {"_id": 0})
    if not professional:
        return {"message": "If email exists, reset link will be sent"}
    
    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.professionals.update_one(
        {"email": data.email},
        {"$set": {
            "password_reset_token": reset_token,
            "password_reset_expires": reset_expires.isoformat()
        }}
    )
    
    frontend_url = os.environ.get('FRONTEND_URL', 'https://probook-balkans.preview.emergentagent.com')
    reset_link = f"{frontend_url}/resetiraj-lozinku/{reset_token}"
    
    background_tasks.add_task(
        send_password_reset_email,
        professional["email"],
        reset_link,
        professional["name"]
    )
    
    return {"message": "If email exists, reset link will be sent"}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    professional = await db.professionals.find_one({
        "password_reset_token": data.token
    }, {"_id": 0})
    
    if not professional:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if professional.get("password_reset_expires"):
        expires = datetime.fromisoformat(professional["password_reset_expires"])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Reset token has expired")
    else:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    new_password_hash = hash_password(data.new_password)
    
    await db.professionals.update_one(
        {"email": professional["email"]},
        {"$set": {
            "password_hash": new_password_hash,
            "password_reset_token": None,
            "password_reset_expires": None
        }}
    )
    
    return {"message": "Password successfully reset"}



@api_router.post("/services", response_model=Service)
async def create_service(data: ServiceCreate, current_professional: dict = Depends(get_current_professional)):
    import uuid
    service_doc = {
        "id": str(uuid.uuid4()),
        "professional_email": current_professional["email"],
        "name": data.name,
        "duration_minutes": data.duration_minutes,
        "price": data.price,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.services.insert_one(service_doc)
    
    return Service(
        id=service_doc["id"],
        professional_email=service_doc["professional_email"],
        name=service_doc["name"],
        duration_minutes=service_doc["duration_minutes"],
        price=service_doc["price"],
        created_at=datetime.fromisoformat(service_doc["created_at"])
    )

@api_router.get("/services", response_model=List[Service])
async def get_services(current_professional: dict = Depends(get_current_professional)):
    services = await db.services.find({"professional_email": current_professional["email"]}, {"_id": 0}).to_list(1000)
    
    return [
        Service(
            id=s["id"],
            professional_email=s["professional_email"],
            name=s["name"],
            duration_minutes=s["duration_minutes"],
            price=s["price"],
            created_at=datetime.fromisoformat(s["created_at"])
        )
        for s in services
    ]

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, data: ServiceCreate, current_professional: dict = Depends(get_current_professional)):
    service = await db.services.find_one({"id": service_id, "professional_email": current_professional["email"]}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    await db.services.update_one(
        {"id": service_id},
        {"$set": {
            "name": data.name,
            "duration_minutes": data.duration_minutes,
            "price": data.price
        }}
    )
    
    return Service(
        id=service["id"],
        professional_email=service["professional_email"],
        name=data.name,
        duration_minutes=data.duration_minutes,
        price=data.price,
        created_at=datetime.fromisoformat(service["created_at"])
    )

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_professional: dict = Depends(get_current_professional)):
    result = await db.services.delete_one({"id": service_id, "professional_email": current_professional["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

@api_router.get("/working-hours", response_model=WorkingHours)
async def get_working_hours(current_professional: dict = Depends(get_current_professional)):
    return WorkingHours(**current_professional["working_hours"])

@api_router.put("/working-hours", response_model=WorkingHours)
async def update_working_hours(data: WorkingHours, current_professional: dict = Depends(get_current_professional)):
    await db.professionals.update_one(
        {"email": current_professional["email"]},
        {"$set": {"working_hours": data.model_dump()}}
    )
    return data

@api_router.get("/days-off", response_model=List[DayOff])
async def get_days_off(current_professional: dict = Depends(get_current_professional)):
    return [DayOff(**day) for day in current_professional.get("days_off", [])]

@api_router.post("/days-off", response_model=List[DayOff])
async def add_day_off(day: DayOff, current_professional: dict = Depends(get_current_professional)):
    days_off = current_professional.get("days_off", [])
    days_off.append(day.model_dump())
    
    await db.professionals.update_one(
        {"email": current_professional["email"]},
        {"$set": {"days_off": days_off}}
    )
    return [DayOff(**d) for d in days_off]

@api_router.delete("/days-off/{date}")
async def remove_day_off(date: str, current_professional: dict = Depends(get_current_professional)):
    days_off = [d for d in current_professional.get("days_off", []) if d["date"] != date]
    
    await db.professionals.update_one(
        {"email": current_professional["email"]},
        {"$set": {"days_off": days_off}}
    )
    return {"message": "Day off removed"}

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(current_professional: dict = Depends(get_current_professional)):
    bookings = await db.bookings.find({"professional_email": current_professional["email"]}, {"_id": 0}).sort("booking_datetime", 1).to_list(1000)
    
    return [
        Booking(
            id=b["id"],
            professional_email=b["professional_email"],
            professional_name=b["professional_name"],
            service_id=b["service_id"],
            service_name=b["service_name"],
            service_duration=b["service_duration"],
            service_price=b["service_price"],
            client_name=b["client_name"],
            client_phone=b["client_phone"],
            client_email=b.get("client_email"),
            description=b.get("description"),
            booking_datetime=datetime.fromisoformat(b["booking_datetime"]),
            status=b["status"],
            reviewed=b.get("reviewed", False),
            review_token=b.get("review_token"),
            review_token_expires=b.get("review_token_expires"),
            review_reminder_sent=b.get("review_reminder_sent", False),
            reminder_sent=b.get("reminder_sent", False),
            created_at=datetime.fromisoformat(b["created_at"])
        )
        for b in bookings
    ]

@api_router.put("/bookings/{booking_id}/confirm")
async def confirm_booking(booking_id: str, current_professional: dict = Depends(get_current_professional), background_tasks: BackgroundTasks = None):
    booking = await db.bookings.find_one({"id": booking_id, "professional_email": current_professional["email"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "confirmed"}}
    )
    
    if booking.get("client_email") and background_tasks:
        from datetime import datetime as dt
        booking_dt = dt.fromisoformat(booking["booking_datetime"])
        formatted_datetime = booking_dt.strftime("%d.%m.%Y u %H:%M")
        
        background_tasks.add_task(
            send_booking_confirmation_email,
            booking["client_email"],
            booking["client_name"],
            current_professional["name"],
            booking["service_name"],
            formatted_datetime,
            current_professional["phone"]
        )
    
    return {"message": "Booking confirmed"}

@api_router.put("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, current_professional: dict = Depends(get_current_professional), background_tasks: BackgroundTasks = None):
    import secrets
    
    booking = await db.bookings.find_one({"id": booking_id, "professional_email": current_professional["email"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Generate review token with 30-day expiration
    review_token = secrets.token_urlsafe(32)
    review_token_expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    logger.info(f"[COMPLETE BOOKING] Generated review_token for booking {booking_id}: {review_token[:20]}...")
    
    result = await db.bookings.update_one(
        {"id": booking_id, "professional_email": current_professional["email"]},
        {"$set": {
            "status": "completed", 
            "reviewed": False, 
            "review_token": review_token,
            "review_token_expires": review_token_expires,
            "review_reminder_sent": False
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    logger.info(f"[COMPLETE BOOKING] Booking {booking_id} marked as completed, token saved to DB")
    
    # Send review request email to client if email is available
    if booking.get("client_email") and background_tasks:
        frontend_url = os.environ.get('FRONTEND_URL', 'https://probook-balkans.preview.emergentagent.com')
        review_link = f"{frontend_url}/ocijeni/{booking_id}/{review_token}"
        
        logger.info(f"[COMPLETE BOOKING] Review link generated: {review_link}")
        
        background_tasks.add_task(
            send_review_request_email,
            booking["client_email"],
            booking["client_name"],
            current_professional["name"],
            booking["service_name"],
            review_link
        )
        logger.info(f"[COMPLETE BOOKING] Review request email queued for booking {booking_id} to {booking['client_email']}")
    
    return {"message": "Booking completed", "review_token": review_token}

@api_router.get("/reviews")
async def get_reviews(current_professional: dict = Depends(get_current_professional)):
    reviews = await db.reviews.find({"professional_email": current_professional["email"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    return [
        Review(
            id=r["id"],
            booking_id=r["booking_id"],
            professional_email=r["professional_email"],
            rating=r["rating"],
            comment=r.get("comment"),
            client_name=r["client_name"],
            created_at=datetime.fromisoformat(r["created_at"])
        )
        for r in reviews
    ]

async def recalculate_professional_rating(professional_email: str):
    reviews = await db.reviews.find({"professional_email": professional_email}, {"_id": 0}).to_list(10000)
    
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        review_count = len(reviews)
    else:
        avg_rating = 0.0
        review_count = 0
    
    await db.professionals.update_one(
        {"email": professional_email},
        {"$set": {"rating": avg_rating, "review_count": review_count}}
    )

@api_router.get("/public/review/{booking_id}/{token}")
async def get_review_info(booking_id: str, token: str):
    logger.info(f"[REVIEW] GET request - booking_id: {booking_id}, token: {token[:20]}...")
    
    booking = await db.bookings.find_one({"id": booking_id, "review_token": token, "status": "completed"}, {"_id": 0})
    
    if not booking:
        # Debug: check what booking exists
        booking_check = await db.bookings.find_one({"id": booking_id}, {"_id": 0, "id": 1, "status": 1, "review_token": 1, "reviewed": 1})
        if booking_check:
            logger.warning(f"[REVIEW] Booking found but validation failed - id: {booking_id}, status: {booking_check.get('status')}, has_token: {booking_check.get('review_token') is not None}, reviewed: {booking_check.get('reviewed')}")
            if booking_check.get('review_token'):
                logger.warning(f"[REVIEW] Token mismatch - DB token: {booking_check.get('review_token')[:20]}..., Request token: {token[:20]}...")
        else:
            logger.warning(f"[REVIEW] No booking found with id: {booking_id}")
        raise HTTPException(status_code=404, detail="Rezervacija nije pronađena ili nije podobna za recenziju")
    
    if booking.get("reviewed", False):
        logger.warning(f"[REVIEW] Booking already reviewed - id: {booking_id}")
        raise HTTPException(status_code=400, detail="Ova rezervacija je već ocijenjena")
    
    # Check if review token has expired (30 days)
    if booking.get("review_token_expires"):
        expires = datetime.fromisoformat(booking["review_token_expires"])
        if datetime.now(timezone.utc) > expires:
            logger.warning(f"[REVIEW] Token expired - id: {booking_id}, expires: {expires}")
            raise HTTPException(status_code=400, detail="Link za recenziju je istekao. Recenzije su moguće samo unutar 30 dana od završetka usluge.")
    
    logger.info(f"[REVIEW] Validation passed for booking: {booking_id}")
    return {
        "booking_id": booking["id"],
        "professional_name": booking["professional_name"],
        "service_name": booking["service_name"],
        "booking_datetime": booking["booking_datetime"],
        "client_name": booking["client_name"]
    }

@api_router.post("/public/review/{booking_id}/{token}")
async def submit_review(booking_id: str, token: str, review_data: ReviewCreate):
    booking = await db.bookings.find_one({"id": booking_id, "review_token": token, "status": "completed"}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Rezervacija nije pronađena ili nije podobna za recenziju")
    
    if booking.get("reviewed", False):
        raise HTTPException(status_code=400, detail="Ova rezervacija je već ocijenjena. Možete ostaviti samo jednu recenziju po rezervaciji.")
    
    # Check if review token has expired (30 days)
    if booking.get("review_token_expires"):
        expires = datetime.fromisoformat(booking["review_token_expires"])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Link za recenziju je istekao. Recenzije su moguće samo unutar 30 dana od završetka usluge.")
    
    # Validate rating range
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(status_code=400, detail="Ocjena mora biti između 1 i 5")
    
    # Double-check no existing review for this booking (database-level check)
    existing_review = await db.reviews.find_one({"booking_id": booking_id}, {"_id": 0})
    if existing_review:
        raise HTTPException(status_code=400, detail="Recenzija za ovu rezervaciju već postoji")
    
    import uuid
    client_first_name = booking["client_name"].split()[0] if booking["client_name"] else "Klijent"
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_id,
        "professional_email": booking["professional_email"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "client_name": client_first_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    logger.info(f"Review submitted for booking {booking_id}, rating: {review_data.rating}")
    
    # Mark booking as reviewed and invalidate the token
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"reviewed": True, "review_token": None, "review_token_expires": None}}
    )
    
    await recalculate_professional_rating(booking["professional_email"])
    
    return Review(
        id=review_doc["id"],
        booking_id=review_doc["booking_id"],
        professional_email=review_doc["professional_email"],
        rating=review_doc["rating"],
        comment=review_doc["comment"],
        client_name=review_doc["client_name"],
        created_at=datetime.fromisoformat(review_doc["created_at"])
    )

@api_router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, current_professional: dict = Depends(get_current_professional), background_tasks: BackgroundTasks = None):
    booking = await db.bookings.find_one({"id": booking_id, "professional_email": current_professional["email"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": "cancelled"}}
    )
    
    if booking.get("client_email") and background_tasks:
        from datetime import datetime as dt
        booking_dt = dt.fromisoformat(booking["booking_datetime"])
        formatted_datetime = booking_dt.strftime("%d.%m.%Y u %H:%M")
        
        background_tasks.add_task(
            send_booking_cancellation_email,
            booking["client_email"],
            booking["client_name"],
            current_professional["name"],
            booking["service_name"],
            formatted_datetime,
            current_professional["phone"]
        )
    
    return {"message": "Booking cancelled"}

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, current_professional: dict = Depends(get_current_professional)):
    # Allow deletion for both completed and cancelled bookings
    result = await db.bookings.delete_one(
        {
            "id": booking_id, 
            "professional_email": current_professional["email"], 
            "status": {"$in": ["completed", "cancelled"]}
        }
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found or cannot be deleted")
    return {"message": "Booking deleted"}



@api_router.get("/public/featured")
async def get_featured_professionals(limit: int = 6):
    professionals = await db.professionals.find(
        {},
        {"_id": 0, "password_hash": 0, "working_hours": 0, "days_off": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for prof in professionals:
        services = await db.services.find({"professional_email": prof["email"]}, {"_id": 0}).to_list(100)
        min_price = min([s["price"] for s in services]) if services else 0.0
        
        result.append({
            "name": prof["name"],
            "profession": prof["profession"],
            "country": prof.get("country", ""),
            "city": prof.get("city", ""),
            "slug": prof["slug"],
            "rating": prof.get("rating", 0.0),
            "review_count": prof.get("review_count", 0),
            "starting_price": min_price
        })
    
    return {"professionals": result}

@api_router.get("/public/search")
async def search_professionals(profession: Optional[str] = None, city: Optional[str] = None, country: Optional[str] = None):
    query = {}
    if profession:
        query["profession"] = {"$regex": profession, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if country:
        query["country"] = {"$regex": country, "$options": "i"}
    
    professionals = await db.professionals.find(
        query,
        {"_id": 0, "password_hash": 0, "working_hours": 0, "days_off": 0}
    ).to_list(100)
    
    result = []
    for prof in professionals:
        services = await db.services.find({"professional_email": prof["email"]}, {"_id": 0}).to_list(100)
        min_price = min([s["price"] for s in services]) if services else 0.0
        
        result.append({
            "name": prof["name"],
            "profession": prof["profession"],
            "country": prof.get("country", ""),
            "city": prof.get("city", ""),
            "bio": prof.get("bio", ""),
            "slug": prof["slug"],
            "rating": prof.get("rating", 0.0),
            "review_count": prof.get("review_count", 0),
            "starting_price": min_price
        })
    
    return {"professionals": result}

@api_router.get("/public/{slug}", response_model=PublicProfile)
async def get_public_profile(slug: str):
    professional = await db.professionals.find_one({"slug": slug}, {"_id": 0, "password_hash": 0})
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    services = await db.services.find({"professional_email": professional["email"]}, {"_id": 0}).to_list(1000)
    
    reviews = await db.reviews.find({"professional_email": professional["email"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    return PublicProfile(
        name=professional["name"],
        profession=professional["profession"],
        country=professional.get("country", ""),
        city=professional.get("city", ""),
        bio=professional.get("bio", ""),
        phone=professional["phone"],
        rating=professional.get("rating", 0.0),
        review_count=professional.get("review_count", 0),
        services=[
            Service(
                id=s["id"],
                professional_email=s["professional_email"],
                name=s["name"],
                duration_minutes=s["duration_minutes"],
                price=s["price"],
                created_at=datetime.fromisoformat(s["created_at"])
            )
            for s in services
        ],
        reviews=[
            Review(
                id=r["id"],
                booking_id=r["booking_id"],
                professional_email=r["professional_email"],
                rating=r["rating"],
                comment=r.get("comment"),
                client_name=r["client_name"],
                created_at=datetime.fromisoformat(r["created_at"])
            )
            for r in reviews
        ]
    )

@api_router.get("/public/{slug}/available-slots")
async def get_available_slots(slug: str, date: str, service_id: str):
    professional = await db.professionals.find_one({"slug": slug}, {"_id": 0})
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    from datetime import datetime as dt
    target_date = dt.fromisoformat(date)
    day_name = target_date.strftime("%A").lower()
    
    working_hours = professional["working_hours"].get(day_name)
    if not working_hours or not working_hours["enabled"]:
        return {"slots": []}
    
    days_off = professional.get("days_off", [])
    if any(d["date"] == date for d in days_off):
        return {"slots": []}
    
    start_hour, start_minute = map(int, working_hours["start_time"].split(":"))
    end_hour, end_minute = map(int, working_hours["end_time"].split(":"))
    
    start_time = target_date.replace(hour=start_hour, minute=start_minute, second=0, microsecond=0)
    end_time = target_date.replace(hour=end_hour, minute=end_minute, second=0, microsecond=0)
    
    duration = timedelta(minutes=service["duration_minutes"])
    slots = []
    current = start_time
    
    while current + duration <= end_time:
        slots.append(current.isoformat())
        current += timedelta(minutes=30)
    
    bookings = await db.bookings.find({
        "professional_email": professional["email"],
        "status": {"$in": ["pending", "confirmed"]}
    }, {"_id": 0}).to_list(1000)
    
    booked_slots = set()
    for booking in bookings:
        booking_start = dt.fromisoformat(booking["booking_datetime"])
        booking_duration = timedelta(minutes=booking["service_duration"])
        booking_end = booking_start + booking_duration
        
        for slot_str in slots:
            slot_time = dt.fromisoformat(slot_str)
            slot_end = slot_time + duration
            
            if (slot_time < booking_end and slot_end > booking_start):
                booked_slots.add(slot_str)
    
    available_slots = [s for s in slots if s not in booked_slots]
    
    return {"slots": available_slots}

@api_router.post("/public/{slug}/book", response_model=Booking)
async def create_booking(slug: str, data: BookingCreate, request: Request):
    # Rate limiting for booking creation
    client_ip = request.client.host if request.client else "unknown"
    if await rate_limiter.is_rate_limited(f"booking:{client_ip}", max_requests=10, window_seconds=60):
        logger.warning(f"Rate limit exceeded for booking from IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Previše zahtjeva. Pokušajte ponovo za minutu.")
    
    try:
        professional = await db.professionals.find_one({"slug": slug}, {"_id": 0})
        if not professional:
            raise HTTPException(status_code=404, detail="Professional not found")
        
        service = await db.services.find_one({"id": data.service_id}, {"_id": 0})
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        
        # Validate booking datetime - no past bookings
        from datetime import datetime as dt
        try:
            # Parse the booking datetime
            booking_dt = dt.fromisoformat(data.booking_datetime.replace('Z', '+00:00'))
            
            # Ensure timezone aware
            if booking_dt.tzinfo is None:
                booking_dt = booking_dt.replace(tzinfo=timezone.utc)
            
            now = dt.now(timezone.utc)
            
            # Allow booking for current time or future only
            if booking_dt < now - timedelta(minutes=5):  # 5 minute grace period
                logger.warning(f"Attempt to book past time: {data.booking_datetime}")
                raise HTTPException(status_code=400, detail="Nije moguće rezervirati termin u prošlosti")
        except ValueError:
            raise HTTPException(status_code=400, detail="Neispravan format datuma i vremena")
        
        # Check for double booking - CRITICAL
        service_duration = timedelta(minutes=service["duration_minutes"])
        booking_end = booking_dt + service_duration
        
        existing_bookings = await db.bookings.find({
            "professional_email": professional["email"],
            "status": {"$in": ["pending", "confirmed"]}
        }, {"_id": 0}).to_list(1000)
        
        for existing in existing_bookings:
            existing_datetime_str = existing["booking_datetime"].replace('Z', '+00:00')
            existing_start = dt.fromisoformat(existing_datetime_str)
            if existing_start.tzinfo is None:
                existing_start = existing_start.replace(tzinfo=timezone.utc)
            existing_end = existing_start + timedelta(minutes=existing["service_duration"])
            
            # Check for overlap
            if (booking_dt < existing_end and booking_end > existing_start):
                logger.warning(f"Double booking attempt for {professional['email']} at {data.booking_datetime}")
                raise HTTPException(
                    status_code=409, 
                    detail="Ovaj termin je već zauzet. Molimo odaberite drugi termin."
                )
        
        import uuid
        booking_doc = {
            "id": str(uuid.uuid4()),
            "professional_email": professional["email"],
            "professional_name": professional["name"],
            "service_id": service["id"],
            "service_name": service["name"],
            "service_duration": service["duration_minutes"],
            "service_price": service["price"],
            "client_name": data.client_name,
            "client_phone": data.client_phone,
            "client_email": data.client_email,
            "description": data.description,
            "booking_datetime": data.booking_datetime,
            "status": "pending",
            "reviewed": False,
            "review_token": None,
            "review_token_expires": None,
            "review_reminder_sent": False,
            "reminder_sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.bookings.insert_one(booking_doc)
        logger.info(f"New booking created: {booking_doc['id']} for {professional['email']}")
        
        # Send email notification to professional
        formatted_datetime = booking_dt.strftime("%d.%m.%Y u %H:%M")
        
        email_sent = send_new_booking_notification_email(
            professional["email"],
            professional["name"],
            booking_doc["client_name"],
            booking_doc["client_phone"],
            booking_doc["service_name"],
            formatted_datetime,
            booking_doc["service_duration"],
            booking_doc["service_price"],
            booking_doc.get("description")
        )
        
        if not email_sent:
            logger.warning(f"Failed to send notification email for booking {booking_doc['id']}")
        
        return Booking(
            id=booking_doc["id"],
            professional_email=booking_doc["professional_email"],
            professional_name=booking_doc["professional_name"],
            service_id=booking_doc["service_id"],
            service_name=booking_doc["service_name"],
            service_duration=booking_doc["service_duration"],
            service_price=booking_doc["service_price"],
            client_name=booking_doc["client_name"],
            client_phone=booking_doc["client_phone"],
            client_email=booking_doc.get("client_email"),
            description=booking_doc.get("description"),
            booking_datetime=datetime.fromisoformat(booking_doc["booking_datetime"]),
            status=booking_doc["status"],
            reviewed=booking_doc["reviewed"],
            review_token=booking_doc["review_token"],
            review_token_expires=booking_doc.get("review_token_expires"),
            review_reminder_sent=booking_doc.get("review_reminder_sent", False),
            reminder_sent=booking_doc["reminder_sent"],
            created_at=datetime.fromisoformat(booking_doc["created_at"])
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Booking creation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Greška pri kreiranju rezervacije. Pokušajte ponovo.")

# ===========================================
# TEST EMAIL ENDPOINT - For debugging only
# ===========================================
@api_router.post("/test-email")
async def test_email_endpoint(test_email: str = "test@example.com"):
    """Test endpoint to verify email sending works"""
    logger.info(f"[TEST EMAIL] Test email endpoint called with: {test_email}")
    
    subject = f"{os.environ.get('SENDGRID_FROM_NAME', 'Fiksiraj')} - Test Email"
    html_content = """
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563EB;">Test Email</h1>
            <p>This is a test email to verify SendGrid integration is working.</p>
            <p>If you received this, email sending is configured correctly!</p>
            <p style="margin-top: 30px;">Tim Fiksiraj</p>
        </body>
    </html>
    """
    
    logger.info(f"[TEST EMAIL] Calling send_email function...")
    result = send_email(test_email, subject, html_content)
    
    if result:
        logger.info(f"[TEST EMAIL] Email sent successfully to {test_email}")
        return {"status": "success", "message": f"Test email sent to {test_email}"}
    else:
        logger.error(f"[TEST EMAIL] Failed to send email to {test_email}")
        return {"status": "failed", "message": f"Failed to send test email to {test_email}"}

# ===========================================
# STRIPE SUBSCRIPTION INTEGRATION
# ===========================================

# Subscription plans - €10/month
SUBSCRIPTION_PLANS = {
    "monthly": {
        "name": "Fiksiraj Premium - Mjesečna pretplata",
        "amount": 10.00,
        "currency": "eur",
        "interval": "month"
    }
}

class CreateCheckoutRequest(BaseModel):
    plan_id: str = "monthly"
    origin_url: str

class SubscriptionStatusResponse(BaseModel):
    has_subscription: bool
    subscription_status: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None


@api_router.post("/create-checkout-session")
async def create_checkout_session(request: Request, checkout_data: CreateCheckoutRequest, current_professional: dict = Depends(get_current_professional)):
    """Create Stripe checkout session for subscription"""
    try:
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe nije konfiguriran")
        
        stripe.api_key = stripe_api_key
        
        plan = SUBSCRIPTION_PLANS.get(checkout_data.plan_id)
        if not plan:
            raise HTTPException(status_code=400, detail="Nepoznati plan pretplate")
        
        # Build URLs dynamically from frontend origin
        success_url = f"{checkout_data.origin_url}/dashboard?subscription=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{checkout_data.origin_url}/dashboard?subscription=cancelled"
        
        # Create checkout session using official Stripe SDK
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': plan["currency"],
                    'product_data': {
                        'name': plan["name"],
                    },
                    'unit_amount': int(plan["amount"] * 100),  # Stripe uses cents
                    'recurring': {
                        'interval': plan["interval"],
                    },
                },
                'quantity': 1,
            }],
            mode='subscription',
            locale='hr',
            subscription_data={
                'trial_period_days': 30,
                'metadata': {
                    "professional_email": current_professional["email"],
                    "professional_id": current_professional.get("id", ""),
                    "plan_id": checkout_data.plan_id,
                }
            },
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "professional_email": current_professional["email"],
                "professional_id": current_professional.get("id", ""),
                "plan_id": checkout_data.plan_id,
                "plan_name": plan["name"]
            }
        )
        
        logger.info(f"[STRIPE] Checkout session created for {current_professional['email']}: {session.id}")
        
        # Create payment transaction record
        import uuid
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "professional_email": current_professional["email"],
            "amount": plan["amount"],
            "currency": plan["currency"],
            "plan_id": checkout_data.plan_id,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction_doc)
        logger.info(f"[STRIPE] Payment transaction created: {transaction_doc['id']}")
        
        return {"url": session.url, "session_id": session.id}
        
    except stripe.error.StripeError as e:
        logger.error(f"[STRIPE] Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stripe greška: {str(e)}")
    except Exception as e:
        logger.error(f"[STRIPE] Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Greška pri kreiranju sesije: {str(e)}")


@api_router.get("/checkout-status/{session_id}")
async def get_checkout_status(session_id: str, current_professional: dict = Depends(get_current_professional)):
    """Get checkout session status and update subscription"""
    try:
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe nije konfiguriran")
        
        stripe.api_key = stripe_api_key
        
        # Get checkout status from Stripe using official SDK
        session = stripe.checkout.Session.retrieve(session_id)
        
        logger.info(f"[STRIPE] Checkout status for {session_id}: status={session.status}, payment_status={session.payment_status}")
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": session.payment_status,
                "status": session.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Determine subscription status based on checkout result
        # For trial: session.status == "complete" but payment_status may be "no_payment_required" or "unpaid"
        if session.status == "complete" and session.subscription:
            # Retrieve the subscription to get its actual status
            subscription = stripe.Subscription.retrieve(session.subscription)
            sub_status = subscription.status  # trialing, active, past_due, unpaid, canceled, etc.
            
            logger.info(f"[STRIPE] Subscription {session.subscription} status: {sub_status}")
            
            # Check if already processed to prevent duplicate updates
            existing = await db.professionals.find_one(
                {"email": current_professional["email"]},
                {"_id": 0, "subscription_status": 1, "stripe_subscription_id": 1}
            )
            
            # Update if new subscription or status changed
            if not existing or existing.get("stripe_subscription_id") != session.subscription or existing.get("subscription_status") != sub_status:
                await db.professionals.update_one(
                    {"email": current_professional["email"]},
                    {"$set": {
                        "subscription_status": sub_status,
                        "subscription_activated_at": datetime.now(timezone.utc).isoformat(),
                        "stripe_session_id": session_id,
                        "stripe_subscription_id": session.subscription,
                        "stripe_customer_id": subscription.customer
                    }}
                )
                logger.info(f"[STRIPE] Subscription set to '{sub_status}' for {current_professional['email']}")
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"[STRIPE] Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stripe greška: {str(e)}")
    except Exception as e:
        logger.error(f"[STRIPE] Error getting checkout status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Greška pri provjeri statusa: {str(e)}")


@api_router.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
        
        if not stripe_api_key:
            logger.error("[STRIPE WEBHOOK] Stripe API key not configured")
            return {"status": "error", "message": "Stripe not configured"}
        
        stripe.api_key = stripe_api_key
        
        # Get webhook body and signature
        payload = await request.body()
        sig_header = request.headers.get("Stripe-Signature", "")
        
        # Verify webhook signature if secret is configured
        try:
            if webhook_secret:
                event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
            else:
                # Parse event without verification (for testing)
                import json
                event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
        except ValueError as e:
            logger.error(f"[STRIPE WEBHOOK] Invalid payload: {str(e)}")
            return {"status": "error", "message": "Invalid payload"}
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"[STRIPE WEBHOOK] Invalid signature: {str(e)}")
            return {"status": "error", "message": "Invalid signature"}
        
        event_type = event.type
        logger.info(f"[STRIPE WEBHOOK] Received event: {event_type}")
        
        # Handle different event types
        if event_type == "checkout.session.completed":
            session = event.data.object
            professional_email = session.metadata.get("professional_email") if session.metadata else None
            
            if professional_email and session.subscription:
                # Get actual subscription status (could be trialing or active)
                subscription = stripe.Subscription.retrieve(session.subscription)
                sub_status = subscription.status
                
                await db.professionals.update_one(
                    {"email": professional_email},
                    {"$set": {
                        "subscription_status": sub_status,
                        "stripe_session_id": session.id,
                        "stripe_subscription_id": session.subscription,
                        "stripe_customer_id": subscription.customer,
                        "subscription_activated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"[STRIPE WEBHOOK] Subscription '{sub_status}' for {professional_email}")
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session.id},
                {"$set": {
                    "payment_status": session.payment_status,
                    "event_type": event_type,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        elif event_type == "customer.subscription.updated":
            # Handles trial ending, status changes, etc.
            subscription = event.data.object
            professional_email = subscription.metadata.get("professional_email") if subscription.metadata else None
            sub_status = subscription.status
            
            if professional_email:
                await db.professionals.update_one(
                    {"email": professional_email},
                    {"$set": {
                        "subscription_status": sub_status,
                        "subscription_updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"[STRIPE WEBHOOK] Subscription updated to '{sub_status}' for {professional_email}")
        
        elif event_type == "invoice.payment_succeeded":
            invoice = event.data.object
            # Try to get metadata from subscription
            if invoice.subscription:
                subscription = stripe.Subscription.retrieve(invoice.subscription)
                professional_email = subscription.metadata.get("professional_email") if subscription.metadata else None
                
                if professional_email:
                    await db.professionals.update_one(
                        {"email": professional_email},
                        {"$set": {
                            "subscription_status": "active",
                            "last_payment_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    logger.info(f"[STRIPE WEBHOOK] Payment succeeded, status set to 'active' for {professional_email}")
        
        elif event_type == "invoice.payment_failed":
            invoice = event.data.object
            if invoice.subscription:
                subscription = stripe.Subscription.retrieve(invoice.subscription)
                professional_email = subscription.metadata.get("professional_email") if subscription.metadata else None
                sub_status = subscription.status  # Will be past_due or unpaid
                
                if professional_email:
                    await db.professionals.update_one(
                        {"email": professional_email},
                        {"$set": {
                            "subscription_status": sub_status,
                            "payment_failed_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    logger.info(f"[STRIPE WEBHOOK] Payment failed, status set to '{sub_status}' for {professional_email}")
        
        elif event_type == "customer.subscription.deleted":
            subscription = event.data.object
            professional_email = subscription.metadata.get("professional_email") if subscription.metadata else None
            
            if professional_email:
                await db.professionals.update_one(
                    {"email": professional_email},
                    {"$set": {
                        "subscription_status": "canceled",
                        "subscription_cancelled_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"[STRIPE WEBHOOK] Subscription canceled for {professional_email}")
        
        return {"status": "success", "event_type": event_type}
        
    except Exception as e:
        logger.error(f"[STRIPE WEBHOOK] Error: {str(e)}")
        return {"status": "error", "message": str(e)}


@api_router.get("/subscription-status")
async def get_subscription_status(current_professional: dict = Depends(get_current_professional)):
    """Get current professional's subscription status"""
    professional = await db.professionals.find_one(
        {"email": current_professional["email"]},
        {"_id": 0, "subscription_status": 1, "stripe_customer_id": 1, "stripe_subscription_id": 1, "subscription_activated_at": 1}
    )
    
    # Valid statuses that allow app access: trialing, active
    sub_status = professional.get("subscription_status") if professional else None
    has_valid_subscription = sub_status in ["trialing", "active"]
    
    return SubscriptionStatusResponse(
        has_subscription=has_valid_subscription,
        subscription_status=sub_status,
        stripe_customer_id=professional.get("stripe_customer_id") if professional else None,
        stripe_subscription_id=professional.get("stripe_subscription_id") if professional else None
    )


@api_router.get("/onboarding-status")
async def get_onboarding_status(current_professional: dict = Depends(get_current_professional)):
    """Get onboarding completion status"""
    professional = await db.professionals.find_one(
        {"email": current_professional["email"]},
        {"_id": 0, "onboarding_completed": 1}
    )
    return {"onboarding_completed": professional.get("onboarding_completed", False) if professional else False}


@api_router.post("/onboarding-complete")
async def complete_onboarding(current_professional: dict = Depends(get_current_professional)):
    """Mark onboarding as completed"""
    await db.professionals.update_one(
        {"email": current_professional["email"]},
        {"$set": {"onboarding_completed": True}}
    )
    logger.info(f"[ONBOARDING] Completed for {current_professional['email']}")
    return {"status": "success", "onboarding_completed": True}


class CustomerPortalRequest(BaseModel):
    return_url: str


@api_router.post("/create-customer-portal-session")
async def create_customer_portal_session(portal_data: CustomerPortalRequest, current_professional: dict = Depends(get_current_professional)):
    """Create Stripe Customer Portal session for subscription management"""
    try:
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe nije konfiguriran")
        
        stripe.api_key = stripe_api_key
        
        # Get professional's stripe_customer_id
        professional = await db.professionals.find_one(
            {"email": current_professional["email"]},
            {"_id": 0, "stripe_customer_id": 1}
        )
        
        if not professional or not professional.get("stripe_customer_id"):
            raise HTTPException(status_code=400, detail="Stripe korisnički račun nije pronađen. Pretplata još nije aktivirana.")
        
        # Create customer portal session
        session = stripe.billing_portal.Session.create(
            customer=professional["stripe_customer_id"],
            return_url=portal_data.return_url,
            locale='hr'
        )
        
        logger.info(f"[STRIPE PORTAL] Customer portal session created for {current_professional['email']}")
        
        return {"url": session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"[STRIPE PORTAL] Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Stripe greška: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[STRIPE PORTAL] Error creating portal session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Greška pri kreiranju sesije: {str(e)}")


@api_router.get("/professional-profile")
async def get_professional_profile(current_professional: dict = Depends(get_current_professional)):
    """Get full professional profile for settings page"""
    professional = await db.professionals.find_one(
        {"email": current_professional["email"]},
        {"_id": 0, "password": 0}
    )
    
    if not professional:
        raise HTTPException(status_code=404, detail="Profesionalac nije pronađen")
    
    return professional

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def check_and_send_reminders():
    """Check for bookings starting in 4 hours and send reminders"""
    try:
        now = datetime.now(timezone.utc)
        four_hours_from_now = now + timedelta(hours=4)
        four_hours_thirty_from_now = now + timedelta(hours=4, minutes=30)
        
        bookings = await db.bookings.find({
            "status": "confirmed",
            "reminder_sent": False,
            "booking_datetime": {
                "$gte": four_hours_from_now.isoformat(),
                "$lte": four_hours_thirty_from_now.isoformat()
            }
        }, {"_id": 0}).to_list(1000)
        
        for booking in bookings:
            professional = await db.professionals.find_one(
                {"email": booking["professional_email"]},
                {"_id": 0, "email": 1, "name": 1}
            )
            
            if professional:
                from datetime import datetime as dt
                booking_dt = dt.fromisoformat(booking["booking_datetime"])
                formatted_datetime = booking_dt.strftime("%d.%m.%Y u %H:%M")
                
                send_booking_reminder_email(
                    professional["email"],
                    professional["name"],
                    booking["client_name"],
                    booking["client_phone"],
                    booking["service_name"],
                    formatted_datetime
                )
                
                await db.bookings.update_one(
                    {"id": booking["id"]},
                    {"$set": {"reminder_sent": True}}
                )
                
                logger.info(f"Reminder sent for booking {booking['id']}")
    except Exception as e:
        logger.error(f"Error in reminder scheduler: {str(e)}")


async def check_and_send_review_reminders():
    """Check for completed bookings without review after 3 days and send reminder"""
    try:
        now = datetime.now(timezone.utc)
        three_days_ago = now - timedelta(days=3)
        
        # Find completed bookings that:
        # 1. Were completed more than 3 days ago
        # 2. Haven't been reviewed yet
        # 3. Haven't had a review reminder sent
        # 4. Have a valid (non-expired) review token
        # 5. Have a client email
        bookings = await db.bookings.find({
            "status": "completed",
            "reviewed": False,
            "review_reminder_sent": False,
            "review_token": {"$ne": None},
            "client_email": {"$ne": None}
        }, {"_id": 0}).to_list(1000)
        
        for booking in bookings:
            # Check if booking was completed more than 3 days ago
            # We need to find when it was marked as completed - use review_token_expires minus 30 days
            if booking.get("review_token_expires"):
                token_expires = datetime.fromisoformat(booking["review_token_expires"])
                completion_time = token_expires - timedelta(days=30)
                
                # Only send reminder if completed more than 3 days ago and token not expired
                if completion_time <= three_days_ago and now < token_expires:
                    frontend_url = os.environ.get('FRONTEND_URL', 'https://probook-balkans.preview.emergentagent.com')
                    review_link = f"{frontend_url}/ocijeni/{booking['id']}/{booking['review_token']}"
                    
                    # Calculate days remaining
                    days_remaining = (token_expires - now).days
                    
                    email_sent = send_review_reminder_email(
                        booking["client_email"],
                        booking["client_name"],
                        booking["professional_name"],
                        booking["service_name"],
                        review_link,
                        days_remaining
                    )
                    
                    if email_sent:
                        await db.bookings.update_one(
                            {"id": booking["id"]},
                            {"$set": {"review_reminder_sent": True}}
                        )
                        logger.info(f"Review reminder sent for booking {booking['id']} to {booking['client_email']}")
    except Exception as e:
        logger.error(f"Error in review reminder scheduler: {str(e)}")

scheduler = BackgroundScheduler()
scheduler.add_job(check_and_send_reminders, 'interval', minutes=30)
scheduler.add_job(check_and_send_review_reminders, 'interval', hours=6)  # Check every 6 hours for review reminders
scheduler.start()

@app.on_event("startup")
async def startup_event():
    """Initialize database indexes and startup tasks"""
    logger.info("Application starting...")
    
    try:
        # Create indexes for better performance and data integrity
        # Email index on professionals (unique)
        await db.professionals.create_index("email", unique=True)
        await db.professionals.create_index("slug", unique=True)
        logger.info("Created index: professionals.email (unique)")
        logger.info("Created index: professionals.slug (unique)")
        
        # Booking datetime index for queries
        await db.bookings.create_index("booking_datetime")
        await db.bookings.create_index("professional_email")
        await db.bookings.create_index([("professional_email", 1), ("status", 1)])
        await db.bookings.create_index("review_token")  # For review lookups
        logger.info("Created indexes on bookings collection")
        
        # Services index
        await db.services.create_index("professional_email")
        logger.info("Created index: services.professional_email")
        
        # Reviews index - unique booking_id to enforce one review per booking
        await db.reviews.create_index("professional_email")
        await db.reviews.create_index("booking_id", unique=True)  # CRITICAL: Enforce 1 review per booking
        logger.info("Created indexes on reviews collection (booking_id unique)")
        
        logger.info("Application started successfully, all indexes created")
    except Exception as e:
        logger.error(f"Error creating indexes: {str(e)}")
        # Don't fail startup for index errors - they might already exist


@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Application shutting down...")
    client.close()
    scheduler.shutdown()
