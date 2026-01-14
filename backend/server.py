"""
Hermann Böhmer Shop API - PostgreSQL Version
Complete migration from MongoDB to PostgreSQL with SQLAlchemy async
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_, and_, desc
from sqlalchemy.orm import selectinload
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from slugify import slugify
import secrets
from contextlib import asynccontextmanager

# Database imports
from database import (
    engine, async_session, init_db, get_session, Base,
    Product as DBProduct,
    Admin as DBAdmin,
    Customer as DBCustomer,
    Order as DBOrder,
    PaymentTransaction as DBPaymentTransaction,
    ShippingRate as DBShippingRate,
    Testimonial as DBTestimonial,
    NewsletterSubscriber as DBNewsletterSubscriber,
    Coupon as DBCoupon,
    LoyaltySettings as DBLoyaltySettings,
    LoyaltyTransaction as DBLoyaltyTransaction,
    PasswordResetToken as DBPasswordResetToken,
    ContactMessage as DBContactMessage,
    Expense as DBExpense,
    AdminEmail as DBAdminEmail,
    ProductView as DBProductView,
    NotificationLog as DBNotificationLog,
    PendingCheckoutSession as DBPendingCheckoutSession
)

# Stripe Integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Email Service
from email_service import (
    send_welcome_email,
    send_password_reset_email,
    send_order_confirmation,
    send_order_status_update,
    send_contact_confirmation,
    send_newsletter_welcome
)

# Notification Service
from notification_service import (
    notify_new_order,
    notify_low_stock,
    notify_out_of_stock,
    notify_contact_form,
    notify_new_customer,
    notify_newsletter_signup,
    notify_coupon_used,
    check_stock_levels
)

# Invoice Generator
from invoice_generator import generate_invoice_pdf, generate_invoice_filename

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'wachau-gold-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_placeholder')
STRIPE_DEMO_MODE = (
    'DEIN_STRIPE' in STRIPE_API_KEY or 
    'placeholder' in STRIPE_API_KEY or 
    'HIER' in STRIPE_API_KEY or
    len(STRIPE_API_KEY) < 20 or
    not STRIPE_API_KEY.startswith('sk_')
)
logger.info(f"Stripe Demo Mode: {STRIPE_DEMO_MODE}")

# ==================== APP LIFECYCLE ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager"""
    # Startup
    logger.info("🚀 Starting Hermann Böhmer Shop API...")
    await init_db()
    await seed_initial_data()
    logger.info("✅ PostgreSQL Database initialized!")
    yield
    # Shutdown
    logger.info("👋 Shutting down...")

app = FastAPI(title="Hermann Böhmer Shop API - PostgreSQL", lifespan=lifespan)

# CORS Middleware - MUSS ZUERST hinzugefügt werden!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== PYDANTIC MODELS ====================

class NewsletterSubscribe(BaseModel):
    email: str
    source: Optional[str] = "website"

class AdminEmailSend(BaseModel):
    to_email: str
    subject: str
    message: str
    order_id: Optional[str] = None

class LoyaltyAdjustment(BaseModel):
    points: int
    reason: str

class CouponBase(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_order_value: Optional[float] = None
    max_uses: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True
    description: Optional[str] = None

class CouponValidation(BaseModel):
    code: str
    subtotal: float

class ProductCreate(BaseModel):
    name_de: str
    name_en: str
    description_de: str
    description_en: str
    price: float
    original_price: Optional[float] = None
    image_url: str
    category: str = "likoer"
    stock: int = 100
    is_featured: bool = False
    is_limited: bool = False
    is_18_plus: bool = False
    alcohol_content: Optional[float] = None
    volume_ml: int = 500
    weight_g: Optional[int] = None
    tags: List[str] = []

class ProductUpdate(BaseModel):
    name_de: Optional[str] = None
    name_en: Optional[str] = None
    description_de: Optional[str] = None
    description_en: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    is_limited: Optional[bool] = None
    is_18_plus: Optional[bool] = None
    alcohol_content: Optional[float] = None
    volume_ml: Optional[int] = None
    weight_g: Optional[int] = None
    tags: Optional[List[str]] = None

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminRegister(BaseModel):
    email: str
    password: str
    admin_secret: str

class CartItem(BaseModel):
    product_id: str
    quantity: int

class CustomerRegister(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None

class CustomerLogin(BaseModel):
    email: str
    password: str

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    default_address: Optional[str] = None
    default_city: Optional[str] = None
    default_postal: Optional[str] = None
    default_country: Optional[str] = None
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_postal: Optional[str] = None
    billing_country: Optional[str] = None
    billing_same_as_shipping: Optional[bool] = None

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class TrackingUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

class CreateOrderRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    shipping_city: str
    shipping_postal: str
    shipping_country: str = "Österreich"
    items: List[CartItem]
    notes: Optional[str] = None
    origin_url: str
    customer_id: Optional[str] = None
    coupon_code: Optional[str] = None

class ContactFormRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str
    date: Optional[datetime] = None
    notes: Optional[str] = None

class TestimonialCreate(BaseModel):
    name: str
    location: str
    text_de: str
    text_en: str
    rating: int = 5
    is_active: bool = True

class ShippingRateCreate(BaseModel):
    country: str
    rate: float
    free_shipping_threshold: float = 0
    is_active: bool = True

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc).timestamp() + 86400
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_customer_token(customer_id: str, email: str) -> str:
    payload = {
        'customer_id': customer_id,
        'email': email,
        'type': 'customer',
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 30
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_customer(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify customer token and return customer data"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if payload.get('type') != 'customer':
            raise HTTPException(status_code=401, detail="Invalid customer token")
        
        if payload['exp'] < datetime.now(timezone.utc).timestamp():
            raise HTTPException(status_code=401, detail="Token expired")
        
        async with async_session() as session:
            result = await session.execute(
                select(DBCustomer).where(DBCustomer.id == payload['customer_id'])
            )
            customer = result.scalar_one_or_none()
            if not customer:
                raise HTTPException(status_code=401, detail="Customer not found")
            
            return {
                'id': customer.id,
                'email': customer.email,
                'first_name': customer.first_name,
                'last_name': customer.last_name,
                'phone': customer.phone,
                'default_address': customer.default_address,
                'default_city': customer.default_city,
                'default_postal': customer.default_postal,
                'default_country': customer.default_country,
                'billing_address': customer.billing_address,
                'billing_city': customer.billing_city,
                'billing_postal': customer.billing_postal,
                'billing_country': customer.billing_country,
                'billing_same_as_shipping': customer.billing_same_as_shipping,
                'cart_items': customer.cart_items or [],
                'newsletter_subscribed': customer.newsletter_subscribed,
                'created_at': customer.created_at.isoformat() if customer.created_at else None
            }
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        async with async_session() as session:
            result = await session.execute(
                select(DBAdmin).where(DBAdmin.id == payload['user_id'])
            )
            admin = result.scalar_one_or_none()
            if not admin:
                raise HTTPException(status_code=401, detail="Invalid token")
            return {'id': admin.id, 'email': admin.email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== DATABASE HELPERS ====================

def generate_tracking_number() -> str:
    """Generate unique tracking number"""
    prefix = "HB"
    timestamp = datetime.now().strftime("%y%m%d")
    random_part = secrets.token_hex(3).upper()
    return f"{prefix}{timestamp}{random_part}"


async def generate_invoice_number(session) -> str:
    """Generate sequential invoice number like RE-2026-00001"""
    year = datetime.now().year
    result = await session.execute(
        select(func.count(DBOrder.id)).where(
            DBOrder.invoice_number.isnot(None),
            DBOrder.invoice_number.like(f"RE-{year}-%")
        )
    )
    count = result.scalar() or 0
    next_number = count + 1
    return f"RE-{year}-{next_number:05d}"

def db_to_dict(obj, exclude: List[str] = None) -> dict:
    """Convert SQLAlchemy object to dictionary"""
    exclude = exclude or []
    result = {}
    for column in obj.__table__.columns:
        if column.name not in exclude:
            value = getattr(obj, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
    return result

# ==================== SEED DATA ====================

async def seed_initial_data():
    """Seed initial data if database is empty"""
    async with async_session() as session:
        # Check if admin exists
        result = await session.execute(select(func.count(DBAdmin.id)))
        admin_count = result.scalar()
        
        if admin_count == 0:
            # Create initial admin from environment variables
            initial_admin_email = os.environ.get('INITIAL_ADMIN_EMAIL', '')
            initial_admin_password = os.environ.get('INITIAL_ADMIN_PASSWORD', '')
            
            if initial_admin_email and initial_admin_password:
                admin = DBAdmin(
                    id=str(uuid.uuid4()),
                    email=initial_admin_email.lower(),
                    password_hash=hash_password(initial_admin_password)
                )
                session.add(admin)
                logger.info(f"✅ Initial admin created: {initial_admin_email}")
            else:
                logger.warning("⚠️ No initial admin configured! Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in environment.")
        
        # Check if shipping rates exist
        result = await session.execute(select(func.count(DBShippingRate.id)))
        shipping_count = result.scalar()
        
        if shipping_count == 0:
            default_shipping_rates = [
                {"country": "Österreich", "rate": 5.90, "free_shipping_threshold": 60.0},
                {"country": "Deutschland", "rate": 9.90, "free_shipping_threshold": 80.0},
                {"country": "Schweiz", "rate": 14.90, "free_shipping_threshold": 100.0},
                {"country": "Italien", "rate": 12.90, "free_shipping_threshold": 100.0},
                {"country": "Frankreich", "rate": 14.90, "free_shipping_threshold": 100.0},
                {"country": "Niederlande", "rate": 12.90, "free_shipping_threshold": 100.0},
                {"country": "Belgien", "rate": 12.90, "free_shipping_threshold": 100.0},
            ]
            for rate_data in default_shipping_rates:
                rate = DBShippingRate(
                    id=str(uuid.uuid4()),
                    **rate_data,
                    is_active=True
                )
                session.add(rate)
            logger.info("✅ Default shipping rates created")
        
        # Check if testimonials exist
        result = await session.execute(select(func.count(DBTestimonial.id)))
        testimonial_count = result.scalar()
        
        if testimonial_count == 0:
            default_testimonials = [
                {
                    "name": "Maria H.",
                    "location": "Wien",
                    "text_de": "Die beste Marillenmarmelade, die ich je gegessen habe! Der Geschmack erinnert mich an meine Kindheit in der Wachau.",
                    "text_en": "The best apricot jam I've ever had! The taste reminds me of my childhood in the Wachau.",
                    "rating": 5
                },
                {
                    "name": "Thomas K.",
                    "location": "München",
                    "text_de": "Der Marillenlikör ist einfach hervorragend. Perfekt als Digestif nach einem guten Essen.",
                    "text_en": "The apricot liqueur is simply excellent. Perfect as a digestif after a good meal.",
                    "rating": 5
                },
                {
                    "name": "Sandra M.",
                    "location": "Zürich",
                    "text_de": "Schnelle Lieferung und wunderschöne Verpackung. Die Pralinen waren ein perfektes Geschenk!",
                    "text_en": "Fast delivery and beautiful packaging. The pralines were a perfect gift!",
                    "rating": 5
                }
            ]
            for t_data in default_testimonials:
                testimonial = DBTestimonial(
                    id=str(uuid.uuid4()),
                    **t_data,
                    is_active=True
                )
                session.add(testimonial)
            logger.info("✅ Default testimonials created")
        
        # Check if loyalty settings exist
        result = await session.execute(select(func.count(DBLoyaltySettings.id)))
        loyalty_count = result.scalar()
        
        if loyalty_count == 0:
            loyalty = DBLoyaltySettings(
                id='loyalty_settings',
                points_per_euro=1.0,
                points_value_euro=0.01,
                min_points_redeem=100,
                is_active=True
            )
            session.add(loyalty)
            logger.info("✅ Default loyalty settings created")
        
        # Check if products exist
        result = await session.execute(select(func.count(DBProduct.id)))
        product_count = result.scalar()
        
        if product_count == 0:
            default_products = [
                {
                    "name_de": "Wachauer Marillenlikör",
                    "name_en": "Wachau Apricot Liqueur",
                    "description_de": "Handgemachter Likör aus sonnengereiften Wachauer Marillen. Ein Genuss pur oder als Basis für Cocktails.",
                    "description_en": "Handmade liqueur from sun-ripened Wachau apricots. A delight neat or as a base for cocktails.",
                    "price": 24.90,
                    "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800",
                    "category": "likoer",
                    "stock": 50,
                    "is_featured": True,
                    "is_18_plus": True,
                    "alcohol_content": 25.0,
                    "volume_ml": 500,
                    "slug": "wachauer-marillenlikoer"
                },
                {
                    "name_de": "Wachauer Marillenmarmelade",
                    "name_en": "Wachau Apricot Jam",
                    "description_de": "Fruchtige Marmelade mit hohem Fruchtanteil aus echten Wachauer Marillen. Perfekt zum Frühstück.",
                    "description_en": "Fruity jam with high fruit content from real Wachau apricots. Perfect for breakfast.",
                    "price": 8.90,
                    "image_url": "https://images.unsplash.com/photo-1597733336794-12d05021d510?w=800",
                    "category": "marmelade",
                    "stock": 100,
                    "is_featured": True,
                    "volume_ml": 340,
                    "slug": "wachauer-marillenmarmelade"
                },
                {
                    "name_de": "Marillenbrand Reserve",
                    "name_en": "Apricot Brandy Reserve",
                    "description_de": "Im Eichenfass gereifter Edelbrand aus Wachauer Marillen. Komplex und vollmundig.",
                    "description_en": "Oak-aged fine brandy from Wachau apricots. Complex and full-bodied.",
                    "price": 45.90,
                    "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800",
                    "category": "edelbrand",
                    "stock": 30,
                    "is_18_plus": True,
                    "alcohol_content": 40.0,
                    "volume_ml": 350,
                    "slug": "marillenbrand-reserve"
                },
                {
                    "name_de": "Marillenpralinen",
                    "name_en": "Apricot Pralines",
                    "description_de": "Feine belgische Schokolade gefüllt mit Marillenlikör-Ganache. Das perfekte Geschenk.",
                    "description_en": "Fine Belgian chocolate filled with apricot liqueur ganache. The perfect gift.",
                    "price": 14.90,
                    "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800",
                    "category": "pralinen",
                    "stock": 40,
                    "is_featured": True,
                    "weight_g": 150,
                    "slug": "marillenpralinen"
                }
            ]
            for p_data in default_products:
                product = DBProduct(
                    id=str(uuid.uuid4()),
                    **p_data,
                    tags=[]
                )
                session.add(product)
            logger.info("✅ Default products created")
        
        await session.commit()

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products")
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None):
    async with async_session() as session:
        query = select(DBProduct)
        
        if category and category != 'all':
            query = query.where(DBProduct.category == category)
        if featured is not None:
            query = query.where(DBProduct.is_featured == featured)
        
        result = await session.execute(query.order_by(DBProduct.created_at.desc()))
        products = result.scalars().all()
        
        return [db_to_dict(p) for p in products]

@api_router.get("/products/{slug}")
async def get_product(slug: str):
    async with async_session() as session:
        # Try by slug first
        result = await session.execute(
            select(DBProduct).where(DBProduct.slug == slug)
        )
        product = result.scalar_one_or_none()
        
        # Try by ID if not found
        if not product:
            result = await session.execute(
                select(DBProduct).where(DBProduct.id == slug)
            )
            product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return db_to_dict(product)

@api_router.post("/admin/products")
async def create_product(product: ProductCreate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        product_id = str(uuid.uuid4())
        slug = slugify(product.name_de)
        
        # Ensure unique slug
        result = await session.execute(
            select(DBProduct).where(DBProduct.slug == slug)
        )
        if result.scalar_one_or_none():
            slug = f"{slug}-{product_id[:8]}"
        
        db_product = DBProduct(
            id=product_id,
            slug=slug,
            **product.model_dump()
        )
        session.add(db_product)
        await session.commit()
        await session.refresh(db_product)
        
        return db_to_dict(db_product)

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, update: ProductUpdate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBProduct).where(DBProduct.id == product_id)
        )
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        
        if 'name_de' in update_data:
            update_data['slug'] = slugify(update_data['name_de'])
        
        for key, value in update_data.items():
            setattr(product, key, value)
        
        await session.commit()
        await session.refresh(product)
        
        return db_to_dict(product)

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBProduct).where(DBProduct.id == product_id)
        )
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        await session.delete(product)
        await session.commit()
        
        return {"message": "Product deleted"}

# ==================== UNIFIED AUTH LOGIN ====================

class UnifiedLogin(BaseModel):
    email: str
    password: str
    language: Optional[str] = "de"

@api_router.post("/auth/login")
async def unified_login(credentials: UnifiedLogin):
    """Unified login for both admin and customer"""
    async with async_session() as session:
        email_lower = credentials.email.lower().strip()
        
        # Check admin first
        result = await session.execute(
            select(DBAdmin).where(func.lower(DBAdmin.email) == email_lower)
        )
        admin = result.scalar_one_or_none()
        
        if admin and verify_password(credentials.password, admin.password_hash):
            token = create_token(admin.id, admin.email)
            return {
                "token": token,
                "user_type": "admin",
                "user": {"id": admin.id, "email": admin.email}
            }
        
        # Check customer
        result = await session.execute(
            select(DBCustomer).where(func.lower(DBCustomer.email) == email_lower)
        )
        customer = result.scalar_one_or_none()
        
        if customer and verify_password(credentials.password, customer.password_hash):
            if not customer.is_active:
                error_msg = "Konto deaktiviert" if credentials.language == "de" else "Account deactivated"
                raise HTTPException(status_code=403, detail=error_msg)
            
            # Update last login
            customer.last_login = datetime.now(timezone.utc)
            await session.commit()
            
            token = create_customer_token(customer.id, customer.email)
            return {
                "token": token,
                "user_type": "customer",
                "user": {
                    "id": customer.id,
                    "email": customer.email,
                    "first_name": customer.first_name,
                    "last_name": customer.last_name,
                    "phone": customer.phone
                }
            }
        
        # Error message based on language
        error_msg = "E-Mail oder Passwort falsch" if credentials.language == "de" else "Invalid email or password"
        raise HTTPException(status_code=401, detail=error_msg)

# ==================== ADMIN AUTH ROUTES ====================

@api_router.post("/admin/setup")
async def setup_initial_admin():
    """Create initial admin from environment variables - only works if no admin exists"""
    async with async_session() as session:
        # Check if any admin exists
        result = await session.execute(select(func.count(DBAdmin.id)))
        admin_count = result.scalar()
        
        if admin_count > 0:
            raise HTTPException(status_code=400, detail="Admin already exists")
        
        # Get credentials from environment
        initial_admin_email = os.environ.get('INITIAL_ADMIN_EMAIL', '')
        initial_admin_password = os.environ.get('INITIAL_ADMIN_PASSWORD', '')
        
        if not initial_admin_email or not initial_admin_password:
            raise HTTPException(
                status_code=400, 
                detail="INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set"
            )
        
        # Create admin
        admin = DBAdmin(
            id=str(uuid.uuid4()),
            email=initial_admin_email.lower().strip(),
            password_hash=hash_password(initial_admin_password)
        )
        session.add(admin)
        await session.commit()
        
        logger.info(f"✅ Initial admin created via /admin/setup: {initial_admin_email}")
        return {"message": "Admin created successfully", "email": initial_admin_email}

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    async with async_session() as session:
        result = await session.execute(
            select(DBAdmin).where(DBAdmin.email == credentials.email)
        )
        admin = result.scalar_one_or_none()
        
        if not admin or not verify_password(credentials.password, admin.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_token(admin.id, admin.email)
        return {"token": token, "email": admin.email}

@api_router.post("/admin/register")
async def admin_register(data: AdminRegister):
    if data.admin_secret != os.environ.get('ADMIN_SECRET', 'wachau-admin-2024'):
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    
    async with async_session() as session:
        result = await session.execute(
            select(DBAdmin).where(DBAdmin.email == data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        admin = DBAdmin(
            id=str(uuid.uuid4()),
            email=data.email,
            password_hash=hash_password(data.password)
        )
        session.add(admin)
        await session.commit()
        
        return {"message": "Admin registered successfully"}

@api_router.get("/admin/verify")
async def verify_admin(admin: dict = Depends(get_current_admin)):
    return {"valid": True, "email": admin['email']}

# ==================== CUSTOMER AUTH ROUTES ====================

@api_router.post("/customer/register")
async def customer_register(data: CustomerRegister, background_tasks: BackgroundTasks):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.email == data.email.lower())
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        customer = DBCustomer(
            id=str(uuid.uuid4()),
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone
        )
        session.add(customer)
        await session.commit()
        
        token = create_customer_token(customer.id, customer.email)
        
        # Send welcome email
        background_tasks.add_task(
            send_welcome_email,
            customer.email,
            customer.first_name
        )
        
        # Notify admin
        background_tasks.add_task(
            notify_new_customer,
            {
                "email": customer.email,
                "first_name": customer.first_name,
                "last_name": customer.last_name
            }
        )
        
        return {
            "token": token,
            "customer": {
                "id": customer.id,
                "email": customer.email,
                "first_name": customer.first_name,
                "last_name": customer.last_name
            }
        }

@api_router.post("/customer/login")
async def customer_login(data: CustomerLogin):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.email == data.email.lower())
        )
        customer = result.scalar_one_or_none()
        
        if not customer or not verify_password(data.password, customer.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not customer.is_active:
            raise HTTPException(status_code=403, detail="Account deactivated")
        
        # Update last login
        customer.last_login = datetime.now(timezone.utc)
        await session.commit()
        
        token = create_customer_token(customer.id, customer.email)
        
        return {
            "token": token,
            "customer": {
                "id": customer.id,
                "email": customer.email,
                "first_name": customer.first_name,
                "last_name": customer.last_name,
                "phone": customer.phone,
                "default_address": customer.default_address,
                "default_city": customer.default_city,
                "default_postal": customer.default_postal,
                "default_country": customer.default_country,
                "billing_address": customer.billing_address,
                "billing_city": customer.billing_city,
                "billing_postal": customer.billing_postal,
                "billing_country": customer.billing_country,
                "billing_same_as_shipping": customer.billing_same_as_shipping
            }
        }

@api_router.get("/customer/me")
async def get_current_customer_me(customer: dict = Depends(get_current_customer)):
    """Get current logged in customer data (alias for /customer/profile)"""
    return customer

@api_router.get("/customer/profile")
async def get_customer_profile(customer: dict = Depends(get_current_customer)):
    return customer

@api_router.get("/customer/stats")
async def get_customer_stats(customer: dict = Depends(get_current_customer)):
    """Statistiken für den eingeloggten Kunden - nur bezahlte Bestellungen"""
    async with async_session() as session:
        # Anzahl Bestellungen - NUR BEZAHLT
        orders_result = await session.execute(
            select(func.count(DBOrder.id)).where(
                and_(
                    DBOrder.customer_email == customer['email'],
                    DBOrder.payment_status == 'paid'
                )
            )
        )
        order_count = orders_result.scalar() or 0
        
        # Gesamtausgaben - NUR BEZAHLT
        spent_result = await session.execute(
            select(func.sum(DBOrder.total_amount)).where(
                and_(
                    DBOrder.customer_email == customer['email'],
                    DBOrder.payment_status == 'paid'
                )
            )
        )
        total_spent = float(spent_result.scalar() or 0)
        
        # Letzte Bestellung - NUR BEZAHLT
        last_order_result = await session.execute(
            select(DBOrder.created_at)
            .where(
                and_(
                    DBOrder.customer_email == customer['email'],
                    DBOrder.payment_status == 'paid'
                )
            )
            .order_by(DBOrder.created_at.desc())
            .limit(1)
        )
        last_order = last_order_result.scalar_one_or_none()
        last_order_date = last_order.isoformat() if last_order else None
        
        # Loyalty-System basierend auf Gesamtausgaben
        def get_loyalty_tier(spent: float):
            if spent >= 500:
                return {"tier": "Gold", "next_tier": None, "amount_to_next_tier": 0}
            elif spent >= 200:
                return {"tier": "Silber", "next_tier": "Gold", "amount_to_next_tier": 500 - spent}
            elif spent >= 50:
                return {"tier": "Bronze", "next_tier": "Silber", "amount_to_next_tier": 200 - spent}
            else:
                return {"tier": "Starter", "next_tier": "Bronze", "amount_to_next_tier": 50 - spent}
        
        loyalty = get_loyalty_tier(total_spent)
        
        return {
            "order_count": order_count,
            "total_spent": total_spent,
            "last_order_date": last_order_date,
            "loyalty": loyalty,
            "member_since": customer.get('created_at')
        }

@api_router.put("/customer/profile")
async def update_customer_profile(update: CustomerUpdate, customer: dict = Depends(get_current_customer)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == customer['id'])
        )
        db_customer = result.scalar_one_or_none()
        
        if not db_customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        for key, value in update_data.items():
            setattr(db_customer, key, value)
        
        await session.commit()
        await session.refresh(db_customer)
        
        return db_to_dict(db_customer, exclude=['password_hash'])

@api_router.get("/customer/verify")
async def verify_customer(customer: dict = Depends(get_current_customer)):
    return {"valid": True, "customer": customer}

# ==================== PASSWORD RESET ====================

@api_router.post("/customer/password-reset/request")
async def request_password_reset(data: PasswordResetRequest, background_tasks: BackgroundTasks):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.email == data.email.lower())
        )
        customer = result.scalar_one_or_none()
        
        # Always return success to prevent email enumeration
        if not customer:
            return {"message": "If an account exists, a reset link has been sent"}
        
        # Create reset token
        token = secrets.token_urlsafe(32)
        reset_token = DBPasswordResetToken(
            id=str(uuid.uuid4()),
            customer_id=customer.id,
            token=token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        session.add(reset_token)
        await session.commit()
        
        # Send email
        background_tasks.add_task(
            send_password_reset_email,
            customer.email,
            customer.first_name,
            token
        )
        
        return {"message": "If an account exists, a reset link has been sent"}

@api_router.get("/customer/password-reset/verify/{token}")
async def verify_reset_token(token: str):
    """Verify if a password reset token is valid"""
    async with async_session() as session:
        result = await session.execute(
            select(DBPasswordResetToken).where(
                DBPasswordResetToken.token == token,
                DBPasswordResetToken.used == False,
                DBPasswordResetToken.expires_at > datetime.now(timezone.utc)
            )
        )
        reset_token = result.scalar_one_or_none()
        
        if not reset_token:
            raise HTTPException(status_code=404, detail="Invalid or expired token")
        
        return {"valid": True, "message": "Token is valid"}

@api_router.post("/customer/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    async with async_session() as session:
        result = await session.execute(
            select(DBPasswordResetToken).where(
                DBPasswordResetToken.token == data.token,
                DBPasswordResetToken.used == False,
                DBPasswordResetToken.expires_at > datetime.now(timezone.utc)
            )
        )
        reset_token = result.scalar_one_or_none()
        
        if not reset_token:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        # Update password
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == reset_token.customer_id)
        )
        customer = result.scalar_one_or_none()
        
        if customer:
            customer.password_hash = hash_password(data.new_password)
            reset_token.used = True
            await session.commit()
        
        return {"message": "Password updated successfully"}

# ==================== CUSTOMER CART ====================

@api_router.get("/customer/cart")
async def get_cart(customer: dict = Depends(get_current_customer)):
    return {"items": customer.get('cart_items', [])}

@api_router.post("/customer/cart")
async def update_cart(items: List[CartItem], customer: dict = Depends(get_current_customer)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == customer['id'])
        )
        db_customer = result.scalar_one_or_none()
        
        if db_customer:
            db_customer.cart_items = [item.model_dump() for item in items]
            await session.commit()
        
        return {"items": [item.model_dump() for item in items]}

@api_router.delete("/customer/cart")
async def clear_cart(customer: dict = Depends(get_current_customer)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == customer['id'])
        )
        db_customer = result.scalar_one_or_none()
        
        if db_customer:
            db_customer.cart_items = []
            await session.commit()
        
        return {"items": []}

# ==================== CUSTOMER ORDERS ====================

@api_router.get("/customer/orders")
async def get_customer_orders(customer: dict = Depends(get_current_customer)):
    """Get customer orders - only returns paid orders"""
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder)
            .where(
                and_(
                    or_(
                        DBOrder.customer_id == customer['id'],
                        DBOrder.customer_email == customer['email']
                    ),
                    DBOrder.payment_status == 'paid'  # Only show paid orders
                )
            )
            .order_by(DBOrder.created_at.desc())
        )
        orders = result.scalars().all()
        
        return [db_to_dict(o) for o in orders]

# ==================== SHIPPING RATES ====================

@api_router.get("/shipping-rates")
async def get_shipping_rates():
    async with async_session() as session:
        result = await session.execute(
            select(DBShippingRate).where(DBShippingRate.is_active == True)
        )
        rates = result.scalars().all()
        return [db_to_dict(r) for r in rates]

@api_router.post("/admin/shipping-rates")
async def create_shipping_rate(rate: ShippingRateCreate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        db_rate = DBShippingRate(
            id=str(uuid.uuid4()),
            **rate.model_dump()
        )
        session.add(db_rate)
        await session.commit()
        return db_to_dict(db_rate)

@api_router.put("/admin/shipping-rates/{rate_id}")
async def update_shipping_rate(rate_id: str, rate: ShippingRateCreate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBShippingRate).where(DBShippingRate.id == rate_id)
        )
        db_rate = result.scalar_one_or_none()
        
        if not db_rate:
            raise HTTPException(status_code=404, detail="Shipping rate not found")
        
        for key, value in rate.model_dump().items():
            setattr(db_rate, key, value)
        
        await session.commit()
        return db_to_dict(db_rate)

@api_router.delete("/admin/shipping-rates/{rate_id}")
async def delete_shipping_rate(rate_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBShippingRate).where(DBShippingRate.id == rate_id)
        )
        db_rate = result.scalar_one_or_none()
        
        if not db_rate:
            raise HTTPException(status_code=404, detail="Shipping rate not found")
        
        await session.delete(db_rate)
        await session.commit()
        return {"message": "Shipping rate deleted"}

# ==================== TESTIMONIALS ====================

@api_router.get("/testimonials")
async def get_testimonials():
    async with async_session() as session:
        result = await session.execute(
            select(DBTestimonial).where(DBTestimonial.is_active == True)
        )
        testimonials = result.scalars().all()
        return [db_to_dict(t) for t in testimonials]

@api_router.post("/admin/testimonials")
async def create_testimonial(testimonial: TestimonialCreate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        db_testimonial = DBTestimonial(
            id=str(uuid.uuid4()),
            **testimonial.model_dump()
        )
        session.add(db_testimonial)
        await session.commit()
        return db_to_dict(db_testimonial)

@api_router.put("/admin/testimonials/{testimonial_id}")
async def update_testimonial(testimonial_id: str, testimonial: TestimonialCreate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBTestimonial).where(DBTestimonial.id == testimonial_id)
        )
        db_testimonial = result.scalar_one_or_none()
        
        if not db_testimonial:
            raise HTTPException(status_code=404, detail="Testimonial not found")
        
        for key, value in testimonial.model_dump().items():
            setattr(db_testimonial, key, value)
        
        await session.commit()
        return db_to_dict(db_testimonial)

@api_router.delete("/admin/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBTestimonial).where(DBTestimonial.id == testimonial_id)
        )
        db_testimonial = result.scalar_one_or_none()
        
        if not db_testimonial:
            raise HTTPException(status_code=404, detail="Testimonial not found")
        
        await session.delete(db_testimonial)
        await session.commit()
        return {"message": "Testimonial deleted"}

# ==================== NEWSLETTER ====================

@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(data: NewsletterSubscribe, background_tasks: BackgroundTasks):
    async with async_session() as session:
        result = await session.execute(
            select(DBNewsletterSubscriber).where(DBNewsletterSubscriber.email == data.email.lower())
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            if existing.is_active:
                return {"message": "Already subscribed", "already_subscribed": True}
            else:
                existing.is_active = True
                existing.unsubscribed_at = None
                await session.commit()
                background_tasks.add_task(send_newsletter_welcome, data.email.lower(), 'de')
                return {"message": "Re-subscribed successfully"}

        subscriber = DBNewsletterSubscriber(
            id=str(uuid.uuid4()),
            email=data.email.lower(),
            source=data.source
        )
        session.add(subscriber)
        await session.commit()

        background_tasks.add_task(send_newsletter_welcome, data.email.lower(), 'de')
        background_tasks.add_task(notify_newsletter_signup, data.email)

        return {"message": "Subscribed successfully"}

@api_router.post("/newsletter/unsubscribe")
async def newsletter_unsubscribe(data: NewsletterSubscribe):
    async with async_session() as session:
        result = await session.execute(
            select(DBNewsletterSubscriber).where(DBNewsletterSubscriber.email == data.email.lower())
        )
        subscriber = result.scalar_one_or_none()
        
        if subscriber and subscriber.is_active:
            subscriber.is_active = False
            subscriber.unsubscribed_at = datetime.now(timezone.utc)
            await session.commit()
        
        return {"message": "Unsubscribed successfully"}

@api_router.get("/admin/newsletter/subscribers")
async def get_newsletter_subscribers(admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBNewsletterSubscriber).order_by(DBNewsletterSubscriber.subscribed_at.desc())
        )
        subscribers = result.scalars().all()
        return [db_to_dict(s) for s in subscribers]

# ==================== COUPONS ====================

@api_router.post("/coupons/validate")
async def validate_coupon(data: CouponValidation):
    async with async_session() as session:
        # Case-insensitive Suche - sowohl Groß- als auch Kleinschreibung akzeptieren
        result = await session.execute(
            select(DBCoupon).where(
                func.upper(DBCoupon.code) == data.code.strip().upper(),
                DBCoupon.is_active == True
            )
        )
        coupon = result.scalar_one_or_none()
        
        if not coupon:
            raise HTTPException(status_code=400, detail="Ungültiger Gutscheincode")
        
        now = datetime.now(timezone.utc)
        
        if coupon.valid_from and now < coupon.valid_from:
            raise HTTPException(status_code=400, detail="Dieser Gutschein ist noch nicht aktiv")
        
        if coupon.valid_until and now > coupon.valid_until:
            raise HTTPException(status_code=400, detail="Dieser Gutschein ist abgelaufen")
        
        if coupon.max_uses and coupon.uses_count >= coupon.max_uses:
            raise HTTPException(status_code=400, detail="Maximale Nutzungsanzahl erreicht")
        
        if coupon.min_order_value and data.subtotal < coupon.min_order_value:
            raise HTTPException(
                status_code=400, 
                detail=f"Mindestbestellwert: €{coupon.min_order_value:.2f}"
            )
        
        # Calculate discount
        if coupon.discount_type == 'percent':
            discount_amount = data.subtotal * (coupon.discount_value / 100)
        else:
            discount_amount = min(coupon.discount_value, data.subtotal)
        
        return {
            "valid": True,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "discount_amount": round(float(discount_amount), 2),
            "description": coupon.description or ""
        }

@api_router.get("/admin/coupons")
async def get_coupons(admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCoupon).order_by(DBCoupon.created_at.desc())
        )
        coupons = result.scalars().all()
        return [db_to_dict(c) for c in coupons]

@api_router.post("/admin/coupons")
async def create_coupon(coupon: CouponBase, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        db_coupon = DBCoupon(
            id=str(uuid.uuid4()),
            code=coupon.code.upper(),
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            min_order_value=coupon.min_order_value,
            max_uses=coupon.max_uses,
            valid_from=coupon.valid_from,
            valid_until=coupon.valid_until,
            is_active=coupon.is_active,
            description=coupon.description
        )
        session.add(db_coupon)
        await session.commit()
        return db_to_dict(db_coupon)

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: CouponBase, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCoupon).where(DBCoupon.id == coupon_id)
        )
        db_coupon = result.scalar_one_or_none()
        
        if not db_coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        
        db_coupon.code = coupon.code.upper()
        db_coupon.discount_type = coupon.discount_type
        db_coupon.discount_value = coupon.discount_value
        db_coupon.min_order_value = coupon.min_order_value
        db_coupon.max_uses = coupon.max_uses
        db_coupon.valid_from = coupon.valid_from
        db_coupon.valid_until = coupon.valid_until
        db_coupon.is_active = coupon.is_active
        db_coupon.description = coupon.description
        
        await session.commit()
        return db_to_dict(db_coupon)

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCoupon).where(DBCoupon.id == coupon_id)
        )
        db_coupon = result.scalar_one_or_none()
        
        if not db_coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        
        await session.delete(db_coupon)
        await session.commit()
        return {"message": "Coupon deleted"}

# ==================== ORDERS ====================

async def apply_coupon_to_order(code: str, subtotal: float) -> dict:
    """Helper to apply coupon and return discount info"""
    async with async_session() as session:
        result = await session.execute(
            select(DBCoupon).where(
                DBCoupon.code == code.upper(),
                DBCoupon.is_active == True
            )
        )
        coupon = result.scalar_one_or_none()
        
        if not coupon:
            return {"valid": False}
        
        now = datetime.now(timezone.utc)
        
        if coupon.valid_from and now < coupon.valid_from:
            return {"valid": False}
        if coupon.valid_until and now > coupon.valid_until:
            return {"valid": False}
        if coupon.max_uses and coupon.uses_count >= coupon.max_uses:
            return {"valid": False}
        if coupon.min_order_value and subtotal < coupon.min_order_value:
            return {"valid": False}
        
        if coupon.discount_type == 'percent':
            discount_amount = subtotal * (coupon.discount_value / 100)
        else:
            discount_amount = min(coupon.discount_value, subtotal)
        
        return {
            "valid": True,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "discount_amount": round(discount_amount, 2)
        }

@api_router.post("/orders/create-checkout")
async def create_order_with_checkout(request: Request, order_data: CreateOrderRequest, background_tasks: BackgroundTasks):
    """Create secure checkout session - Order wird erst nach erfolgreicher Zahlung gespeichert!"""
    import json

    async with async_session() as session:
        subtotal = 0.0
        item_details = []

        for item in order_data.items:
            result = await session.execute(
                select(DBProduct).where(DBProduct.id == item.product_id)
            )
            product = result.scalar_one_or_none()

            if not product:
                raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")

            if product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name_de}")

            item_subtotal = float(product.price) * item.quantity
            subtotal += item_subtotal

            item_details.append({
                'product_id': item.product_id,
                'quantity': item.quantity,
                'product_name_de': product.name_de,
                'product_name_en': product.name_en,
                'product_price': float(product.price),
                'product_image_url': product.image_url,
                'subtotal': item_subtotal
            })

        result = await session.execute(
            select(DBShippingRate).where(
                DBShippingRate.country == order_data.shipping_country,
                DBShippingRate.is_active == True
            )
        )
        shipping_rate = result.scalar_one_or_none()

        shipping_cost = 9.90
        if shipping_rate:
            if shipping_rate.free_shipping_threshold > 0 and subtotal >= shipping_rate.free_shipping_threshold:
                shipping_cost = 0.0
            else:
                shipping_cost = float(shipping_rate.rate)

        discount_amount = 0.0
        coupon_details = None
        if order_data.coupon_code:
            coupon_result = await apply_coupon_to_order(order_data.coupon_code, subtotal)
            if coupon_result.get('valid'):
                discount_amount = coupon_result['discount_amount']
                coupon_details = coupon_result

        total = subtotal - discount_amount + shipping_cost

        session_token = secrets.token_urlsafe(32)
        pending_session = DBPendingCheckoutSession(
            id=str(uuid.uuid4()),
            session_token=session_token,
            customer_id=order_data.customer_id,
            customer_name=order_data.customer_name,
            customer_email=order_data.customer_email,
            customer_phone=order_data.customer_phone,
            shipping_address=order_data.shipping_address,
            shipping_city=order_data.shipping_city,
            shipping_postal=order_data.shipping_postal,
            shipping_country=order_data.shipping_country,
            items=[item.model_dump() for item in order_data.items],
            item_details=item_details,
            notes=order_data.notes,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            discount_amount=discount_amount,
            total_amount=total,
            coupon_code=order_data.coupon_code,
            coupon_details=coupon_details,
            is_demo=STRIPE_DEMO_MODE,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        session.add(pending_session)
        await session.commit()

        if STRIPE_DEMO_MODE:
            checkout_url = f"{order_data.origin_url}/checkout/demo?token={session_token}"
            return {
                "session_token": session_token,
                "checkout_url": checkout_url,
                "total_amount": total,
                "demo_mode": True
            }
        else:
            try:
                checkout = StripeCheckout(api_key=STRIPE_API_KEY)

                line_items = []
                for detail in item_details:
                    line_items.append({
                        "price_data": {
                            "currency": "eur",
                            "product_data": {
                                "name": detail['product_name_de']
                            },
                            "unit_amount": int(detail['product_price'] * 100)
                        },
                        "quantity": detail['quantity']
                    })

                if discount_amount > 0:
                    line_items.append({
                        "price_data": {
                            "currency": "eur",
                            "product_data": {"name": f"Rabatt ({order_data.coupon_code})"},
                            "unit_amount": -int(discount_amount * 100)
                        },
                        "quantity": 1
                    })

                if shipping_cost > 0:
                    line_items.append({
                        "price_data": {
                            "currency": "eur",
                            "product_data": {"name": "Versand"},
                            "unit_amount": int(shipping_cost * 100)
                        },
                        "quantity": 1
                    })

                checkout_request = CheckoutSessionRequest(
                    line_items=line_items,
                    success_url=f"{order_data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                    cancel_url=f"{order_data.origin_url}/payment/cancel",
                    mode="payment",
                    metadata={
                        "checkout_token": session_token
                    }
                )

                stripe_session = await checkout.create_session(checkout_request)

                pending_session.stripe_session_id = stripe_session.id
                await session.commit()

                return {
                    "session_token": session_token,
                    "checkout_url": stripe_session.url,
                    "total_amount": total,
                    "demo_mode": False
                }

            except Exception as e:
                logger.error(f"Stripe error: {e}")
                raise HTTPException(status_code=500, detail="Payment processing error")

@api_router.get("/checkout/session/{token}")
async def get_checkout_session(token: str):
    """Get checkout session details for frontend display"""
    async with async_session() as session:
        result = await session.execute(
            select(DBPendingCheckoutSession).where(
                DBPendingCheckoutSession.session_token == token,
                DBPendingCheckoutSession.status == 'pending'
            )
        )
        checkout_session = result.scalar_one_or_none()

        if not checkout_session:
            raise HTTPException(status_code=404, detail="Checkout session not found")

        if checkout_session.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Checkout session expired")

        return {
            "customer_name": checkout_session.customer_name,
            "customer_email": checkout_session.customer_email,
            "shipping_address": checkout_session.shipping_address,
            "shipping_city": checkout_session.shipping_city,
            "shipping_postal": checkout_session.shipping_postal,
            "shipping_country": checkout_session.shipping_country,
            "items": checkout_session.item_details,
            "subtotal": checkout_session.subtotal,
            "shipping_cost": checkout_session.shipping_cost,
            "discount_amount": checkout_session.discount_amount,
            "total_amount": checkout_session.total_amount,
            "coupon_code": checkout_session.coupon_code,
            "is_demo": checkout_session.is_demo
        }

@api_router.post("/checkout/demo/complete")
async def complete_demo_checkout(
    token: str,
    card_number: str,
    background_tasks: BackgroundTasks
):
    """Complete demo checkout - validates test card and creates order"""
    valid_test_cards = [
        "4242424242424242",
        "4000056655665556",
        "5555555555554444",
        "2223003122003222",
        "378282246310005",
        "6011111111111117"
    ]

    clean_card = card_number.replace(" ", "").replace("-", "")

    if clean_card not in valid_test_cards:
        raise HTTPException(
            status_code=400,
            detail="Invalid test card. Use 4242 4242 4242 4242 for testing."
        )

    async with async_session() as session:
        result = await session.execute(
            select(DBPendingCheckoutSession).where(
                DBPendingCheckoutSession.session_token == token,
                DBPendingCheckoutSession.status == 'pending',
                DBPendingCheckoutSession.is_demo == True
            )
        )
        checkout_session = result.scalar_one_or_none()

        if not checkout_session:
            raise HTTPException(status_code=404, detail="Checkout session not found or already completed")

        if checkout_session.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Checkout session expired")

        tracking_number = generate_tracking_number()
        invoice_number = await generate_invoice_number(session)
        order_id = str(uuid.uuid4())

        order = DBOrder(
            id=order_id,
            tracking_number=tracking_number,
            invoice_number=invoice_number,
            customer_id=checkout_session.customer_id,
            customer_name=checkout_session.customer_name,
            customer_email=checkout_session.customer_email,
            customer_phone=checkout_session.customer_phone,
            shipping_address=checkout_session.shipping_address,
            shipping_city=checkout_session.shipping_city,
            shipping_postal=checkout_session.shipping_postal,
            shipping_country=checkout_session.shipping_country,
            items=checkout_session.items,
            item_details=checkout_session.item_details,
            notes=checkout_session.notes,
            subtotal=checkout_session.subtotal,
            shipping_cost=checkout_session.shipping_cost,
            discount_amount=checkout_session.discount_amount,
            total_amount=checkout_session.total_amount,
            coupon_code=checkout_session.coupon_code,
            coupon_details=checkout_session.coupon_details,
            status='paid',
            payment_status='paid',
            is_new=True
        )
        session.add(order)

        for item in checkout_session.items:
            result = await session.execute(
                select(DBProduct).where(DBProduct.id == item['product_id'])
            )
            product = result.scalar_one_or_none()
            if product:
                product.stock = max(0, product.stock - item['quantity'])
                product.sold_count = (product.sold_count or 0) + item['quantity']

        if checkout_session.coupon_code:
            result = await session.execute(
                select(DBCoupon).where(func.upper(DBCoupon.code) == checkout_session.coupon_code.upper())
            )
            coupon = result.scalar_one_or_none()
            if coupon:
                coupon.uses_count = (coupon.uses_count or 0) + 1

        checkout_session.status = 'completed'
        checkout_session.completed_at = datetime.now(timezone.utc)

        transaction = DBPaymentTransaction(
            id=str(uuid.uuid4()),
            order_id=order_id,
            session_id=f"demo_{token}",
            amount=checkout_session.total_amount,
            currency='eur',
            payment_status='paid',
            payment_metadata={"demo": True, "card_last4": clean_card[-4:]}
        )
        session.add(transaction)

        await session.commit()

        order_dict = db_to_dict(order)
        background_tasks.add_task(send_order_confirmation, order_dict)
        background_tasks.add_task(notify_new_order, order_dict)

        return {
            "success": True,
            "order": order_dict,
            "demo_mode": True
        }

@api_router.get("/payment/verify")
@api_router.get("/orders/verify-payment")
async def verify_payment(
    session_id: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """Verify Stripe payment and create order - SECURE: only creates order after Stripe confirms payment"""
    import json

    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

    async with async_session() as session:
        existing_order = await session.execute(
            select(DBOrder).where(DBOrder.stripe_session_id == session_id)
        )
        existing = existing_order.scalar_one_or_none()
        if existing:
            return {
                "success": True,
                "order": db_to_dict(existing),
                "already_processed": True
            }

        try:
            checkout = StripeCheckout(api_key=STRIPE_API_KEY)
            status = await checkout.get_session_status(session_id)

            if status.status != "complete":
                return {
                    "success": False,
                    "status": status.status,
                    "message": "Payment not completed"
                }

            import stripe
            stripe.api_key = STRIPE_API_KEY
            stripe_session = stripe.checkout.Session.retrieve(session_id)
            metadata = stripe_session.metadata

            if not metadata or not metadata.get('checkout_token'):
                raise HTTPException(status_code=400, detail="Invalid session metadata")

            checkout_token = metadata['checkout_token']

            result = await session.execute(
                select(DBPendingCheckoutSession).where(
                    DBPendingCheckoutSession.session_token == checkout_token
                )
            )
            checkout_session = result.scalar_one_or_none()

            if not checkout_session:
                raise HTTPException(status_code=404, detail="Checkout session not found")

            if checkout_session.status == 'completed':
                result = await session.execute(
                    select(DBOrder).where(DBOrder.stripe_session_id == session_id)
                )
                order = result.scalar_one_or_none()
                if order:
                    return {"success": True, "order": db_to_dict(order)}
                raise HTTPException(status_code=400, detail="Session already processed but order not found")

            tracking_number = generate_tracking_number()
            invoice_number = await generate_invoice_number(session)
            order_id = str(uuid.uuid4())

            order = DBOrder(
                id=order_id,
                tracking_number=tracking_number,
                invoice_number=invoice_number,
                stripe_session_id=session_id,
                customer_id=checkout_session.customer_id,
                customer_name=checkout_session.customer_name,
                customer_email=checkout_session.customer_email,
                customer_phone=checkout_session.customer_phone,
                shipping_address=checkout_session.shipping_address,
                shipping_city=checkout_session.shipping_city,
                shipping_postal=checkout_session.shipping_postal,
                shipping_country=checkout_session.shipping_country,
                items=checkout_session.items,
                item_details=checkout_session.item_details,
                notes=checkout_session.notes,
                subtotal=checkout_session.subtotal,
                shipping_cost=checkout_session.shipping_cost,
                discount_amount=checkout_session.discount_amount,
                total_amount=checkout_session.total_amount,
                coupon_code=checkout_session.coupon_code,
                coupon_details=checkout_session.coupon_details,
                status='paid',
                payment_status='paid',
                is_new=True
            )
            session.add(order)

            for item in checkout_session.items:
                result = await session.execute(
                    select(DBProduct).where(DBProduct.id == item['product_id'])
                )
                product = result.scalar_one_or_none()
                if product:
                    product.stock = max(0, product.stock - item['quantity'])
                    product.sold_count = (product.sold_count or 0) + item['quantity']

            if checkout_session.coupon_code:
                result = await session.execute(
                    select(DBCoupon).where(func.upper(DBCoupon.code) == checkout_session.coupon_code.upper())
                )
                coupon = result.scalar_one_or_none()
                if coupon:
                    coupon.uses_count = (coupon.uses_count or 0) + 1

            transaction = DBPaymentTransaction(
                id=str(uuid.uuid4()),
                order_id=order_id,
                session_id=session_id,
                amount=checkout_session.total_amount,
                currency='eur',
                payment_status='paid'
            )
            session.add(transaction)

            checkout_session.status = 'completed'
            checkout_session.completed_at = datetime.now(timezone.utc)

            await session.commit()

            order_dict = db_to_dict(order)
            if background_tasks:
                background_tasks.add_task(send_order_confirmation, order_dict)
                background_tasks.add_task(notify_new_order, order_dict)

            return {
                "success": True,
                "order": order_dict
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Payment verification error: {e}")
            raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

@api_router.get("/checkout/status")
async def get_checkout_status():
    """Get checkout configuration status"""
    return {
        "demo_mode": STRIPE_DEMO_MODE,
        "stripe_configured": not STRIPE_DEMO_MODE,
        "test_cards": [
            {"number": "4242 4242 4242 4242", "brand": "Visa", "description": "Successful payment"},
            {"number": "4000 0566 5566 5556", "brand": "Visa (debit)", "description": "Successful payment"},
            {"number": "5555 5555 5555 4444", "brand": "Mastercard", "description": "Successful payment"}
        ] if STRIPE_DEMO_MODE else []
    }

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(DBOrder.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return db_to_dict(order)

# ==================== ADMIN ORDER MANAGEMENT ====================

@api_router.get("/admin/orders")
async def get_all_orders(
    admin: dict = Depends(get_current_admin),
    status: Optional[str] = None,
    limit: int = 100
):
    """Get all orders for admin - only returns paid orders"""
    async with async_session() as session:
        # Only show paid orders - no pending/failed/unpaid orders
        query = select(DBOrder).where(DBOrder.payment_status == 'paid')
        
        if status:
            query = query.where(DBOrder.status == status)
        
        query = query.order_by(DBOrder.created_at.desc()).limit(limit)
        result = await session.execute(query)
        orders = result.scalars().all()
        
        return [db_to_dict(o) for o in orders]

@api_router.get("/admin/orders/{order_id}")
async def get_admin_order(order_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(DBOrder.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Mark as read
        if order.is_new:
            order.is_new = False
            await session.commit()
        
        return db_to_dict(order)

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    update: TrackingUpdate, 
    admin: dict = Depends(get_current_admin),
    background_tasks: BackgroundTasks = None
):
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(DBOrder.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        old_status = order.status
        order.status = update.status
        
        if update.tracking_number:
            order.carrier_tracking_number = update.tracking_number
        if update.notes:
            order.admin_notes = update.notes
        
        await session.commit()

        order_dict = db_to_dict(order)
        if background_tasks and old_status != update.status:
            background_tasks.add_task(send_order_status_update, order_dict, update.status)

        return order_dict

@api_router.put("/admin/orders/{order_id}/tracking")
async def update_order_tracking(
    order_id: str,
    carrier: str,
    tracking_number: str,
    admin: dict = Depends(get_current_admin),
    background_tasks: BackgroundTasks = None
):
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(DBOrder.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order.carrier = carrier
        order.carrier_tracking_number = tracking_number
        order.status = 'shipped'
        
        # Generate tracking URL
        carrier_urls = {
            'dhl': f'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}',
            'post': f'https://www.post.at/sv/sendungssuche?snr={tracking_number}',
            'dpd': f'https://tracking.dpd.de/status/de_DE/parcel/{tracking_number}',
            'gls': f'https://gls-group.eu/AT/de/paketverfolgung?match={tracking_number}'
        }
        order.carrier_tracking_url = carrier_urls.get(carrier.lower(), '')

        await session.commit()

        order_dict = db_to_dict(order)
        if background_tasks:
            background_tasks.add_task(send_order_status_update, order_dict, 'shipped')

        return order_dict

@api_router.delete("/admin/orders/{order_id}")
async def delete_order(order_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(DBOrder.id == order_id)
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        await session.delete(order)
        await session.commit()
        
        return {"message": "Order deleted"}

# ==================== TRACKING ====================

@api_router.get("/tracking/{tracking_number}")
async def track_order(tracking_number: str):
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(
                or_(
                    DBOrder.tracking_number == tracking_number.upper(),
                    DBOrder.carrier_tracking_number == tracking_number
                )
            )
        )
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {
            "tracking_number": order.tracking_number,
            "status": order.status,
            "carrier": order.carrier,
            "carrier_tracking_number": order.carrier_tracking_number,
            "carrier_tracking_url": order.carrier_tracking_url,
            "created_at": order.created_at.isoformat() if order.created_at else None
        }


# ==================== INVOICE DOWNLOAD ====================

@api_router.get("/orders/{order_id}/invoice")
async def download_invoice_customer(order_id: str, customer: dict = Depends(get_current_customer)):
    """Download invoice as PDF for customer's own order"""
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(
                DBOrder.id == order_id,
                DBOrder.customer_id == customer['id']
            )
        )
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order_dict = db_to_dict(order)
        pdf_bytes = generate_invoice_pdf(order_dict)
        filename = generate_invoice_filename(order_dict)

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )


@api_router.get("/admin/orders/{order_id}/invoice")
async def download_invoice_admin(order_id: str, admin: dict = Depends(get_current_admin)):
    """Download invoice as PDF for any order (admin only)"""
    async with async_session() as session:
        result = await session.execute(
            select(DBOrder).where(DBOrder.id == order_id)
        )
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order_dict = db_to_dict(order)
        pdf_bytes = generate_invoice_pdf(order_dict)
        filename = generate_invoice_filename(order_dict)

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )


# ==================== CONTACT FORM ====================

@api_router.post("/contact")
async def submit_contact_form(data: ContactFormRequest, background_tasks: BackgroundTasks):
    async with async_session() as session:
        message = DBContactMessage(
            id=str(uuid.uuid4()),
            name=data.name,
            email=data.email,
            phone=data.phone,
            subject=data.subject,
            message=data.message
        )
        session.add(message)
        await session.commit()
        
        # Admin-Benachrichtigung über neue Kontaktanfrage
        background_tasks.add_task(
            notify_contact_form,
            data.name,
            data.email,
            data.subject,
            data.message
        )
        
        # Bestätigungs-E-Mail an Kunden senden (über CONTACT_EMAIL)
        background_tasks.add_task(
            send_contact_confirmation,
            data.email,
            data.name,
            data.subject,
            data.message,
            'de'  # TODO: Sprache aus Request ermitteln
        )
        
        return {"message": "Message sent successfully"}

@api_router.get("/admin/contact-messages")
async def get_contact_messages(admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBContactMessage).order_by(DBContactMessage.created_at.desc())
        )
        messages = result.scalars().all()
        return [db_to_dict(m) for m in messages]

@api_router.put("/admin/contact-messages/{message_id}/read")
async def mark_message_read(message_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBContactMessage).where(DBContactMessage.id == message_id)
        )
        message = result.scalar_one_or_none()
        
        if message:
            message.is_read = True
            await session.commit()
        
        return {"success": True}

# ==================== ADMIN CUSTOMERS ====================

@api_router.get("/admin/customers")
async def get_all_customers(admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).order_by(DBCustomer.created_at.desc())
        )
        customers = result.scalars().all()
        return [db_to_dict(c, exclude=['password_hash']) for c in customers]

@api_router.get("/admin/customers/{customer_id}")
async def get_customer(customer_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == customer_id)
        )
        customer = result.scalar_one_or_none()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get customer orders - ONLY PAID
        orders_result = await session.execute(
            select(DBOrder).where(
                and_(
                    or_(
                        DBOrder.customer_id == customer_id,
                        DBOrder.customer_email == customer.email
                    ),
                    DBOrder.payment_status == 'paid'  # Only show paid orders
                )
            ).order_by(DBOrder.created_at.desc())
        )
        orders = orders_result.scalars().all()
        
        customer_data = db_to_dict(customer, exclude=['password_hash'])
        customer_data['orders'] = [db_to_dict(o) for o in orders]
        
        return customer_data

@api_router.put("/admin/customers/{customer_id}")
async def admin_update_customer(customer_id: str, update: CustomerUpdate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == customer_id)
        )
        customer = result.scalar_one_or_none()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        for key, value in update_data.items():
            setattr(customer, key, value)
        
        await session.commit()
        return db_to_dict(customer, exclude=['password_hash'])

@api_router.put("/admin/customers/{customer_id}/notes")
async def update_customer_notes(customer_id: str, notes: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == customer_id)
        )
        customer = result.scalar_one_or_none()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer.admin_notes = notes
        await session.commit()
        
        return {"success": True}

# ==================== ADMIN DASHBOARD ENDPOINTS ====================

@api_router.get("/admin/summary")
async def get_admin_summary(admin: dict = Depends(get_current_admin)):
    """Dashboard-Zusammenfassung für Admin"""
    async with async_session() as session:
        # Bestellungen heute
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        orders_today_result = await session.execute(
            select(func.count(DBOrder.id)).where(DBOrder.created_at >= today)
        )
        orders_today = orders_today_result.scalar() or 0
        
        # Umsatz heute
        revenue_today_result = await session.execute(
            select(func.sum(DBOrder.total_amount)).where(DBOrder.created_at >= today)
        )
        revenue_today = float(revenue_today_result.scalar() or 0)
        
        # Gesamtbestellungen
        total_orders_result = await session.execute(
            select(func.count(DBOrder.id))
        )
        total_orders = total_orders_result.scalar() or 0
        
        # Gesamtumsatz
        total_revenue_result = await session.execute(
            select(func.sum(DBOrder.total_amount))
        )
        total_revenue = float(total_revenue_result.scalar() or 0)
        
        # Kunden
        total_customers_result = await session.execute(
            select(func.count(DBCustomer.id))
        )
        total_customers = total_customers_result.scalar() or 0
        
        # Newsletter-Abonnenten
        newsletter_result = await session.execute(
            select(func.count(DBNewsletterSubscriber.id)).where(DBNewsletterSubscriber.is_active == True)
        )
        newsletter_subscribers = newsletter_result.scalar() or 0
        
        # Offene Bestellungen
        pending_orders_result = await session.execute(
            select(func.count(DBOrder.id)).where(DBOrder.status.in_(['pending', 'processing', 'confirmed']))
        )
        pending_orders = pending_orders_result.scalar() or 0
        
        # Ungelesene Kontaktanfragen
        unread_messages_result = await session.execute(
            select(func.count(DBContactMessage.id)).where(DBContactMessage.is_read == False)
        )
        unread_messages = unread_messages_result.scalar() or 0
        
        return {
            "orders_today": orders_today,
            "revenue_today": revenue_today,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_customers": total_customers,
            "newsletter_subscribers": newsletter_subscribers,
            "pending_orders": pending_orders,
            "unread_messages": unread_messages
        }


@api_router.get("/admin/analytics")
async def get_admin_analytics(admin: dict = Depends(get_current_admin), days: int = 30):
    """Analytics-Daten für Admin-Dashboard - nur bezahlte Bestellungen"""
    async with async_session() as session:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Bestellungen pro Tag - NUR BEZAHLT
        orders_result = await session.execute(
            select(DBOrder).where(
                and_(
                    DBOrder.created_at >= start_date,
                    DBOrder.payment_status == 'paid'  # Only paid orders
                )
            ).order_by(DBOrder.created_at)
        )
        orders = orders_result.scalars().all()
        
        # Gruppiere nach Datum
        daily_stats = {}
        for order in orders:
            date_key = order.created_at.strftime('%Y-%m-%d')
            if date_key not in daily_stats:
                daily_stats[date_key] = {"orders": 0, "revenue": 0}
            daily_stats[date_key]["orders"] += 1
            daily_stats[date_key]["revenue"] += float(order.total_amount or 0)
        
        # Top Produkte
        # (Vereinfachte Version - zählt aus den Bestellungen)
        product_sales = {}
        for order in orders:
            items = order.items or []
            for item in items:
                pid = item.get('product_id', 'unknown')
                name = item.get('name', 'Unknown')
                qty = item.get('quantity', 1)
                if pid not in product_sales:
                    product_sales[pid] = {"name": name, "quantity": 0, "revenue": 0}
                product_sales[pid]["quantity"] += qty
                product_sales[pid]["revenue"] += float(item.get('price', 0)) * qty
        
        top_products = sorted(product_sales.values(), key=lambda x: x['revenue'], reverse=True)[:10]
        
        return {
            "daily_stats": daily_stats,
            "top_products": top_products,
            "period_days": days
        }


@api_router.get("/admin/admins")
async def get_all_admins(admin: dict = Depends(get_current_admin)):
    """Liste aller Administratoren"""
    async with async_session() as session:
        result = await session.execute(
            select(DBAdmin).order_by(DBAdmin.created_at.desc())
        )
        admins = result.scalars().all()
        return [db_to_dict(a, exclude=['password_hash']) for a in admins]


@api_router.get("/admin/inbox")
async def get_admin_inbox(admin: dict = Depends(get_current_admin)):
    """Admin E-Mail Posteingang (Kontaktanfragen)"""
    async with async_session() as session:
        result = await session.execute(
            select(DBContactMessage).order_by(DBContactMessage.created_at.desc())
        )
        messages = result.scalars().all()
        return [db_to_dict(m) for m in messages]


class EmailSendRequest(BaseModel):
    to_email: str
    subject: str
    message: str
    customer_id: Optional[str] = None


@api_router.post("/admin/email/send")
async def admin_send_email(request: EmailSendRequest, admin: dict = Depends(get_current_admin)):
    """Admin sendet E-Mail an Kunden"""
    from email_service import send_email
    
    # HTML-Version der Nachricht erstellen
    html_content = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8B2E2E; margin: 0;">Hermann Böhmer</h1>
                <p style="color: #666; margin: 5px 0;">Wachauer Gold</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
                {request.message.replace(chr(10), '<br>')}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                <p>Mit freundlichen Grüßen,<br>Ihr Hermann Böhmer Team</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    success = await send_email(request.to_email, request.subject, html_content)
    
    if success:
        return {"success": True, "message": "E-Mail gesendet"}
    else:
        raise HTTPException(status_code=500, detail="E-Mail konnte nicht gesendet werden")


@api_router.get("/admin/shipping-rates")
async def get_shipping_rates_admin(admin: dict = Depends(get_current_admin)):
    """Versandkosten für Admin abrufen"""
    async with async_session() as session:
        result = await session.execute(
            select(DBShippingRate).order_by(DBShippingRate.country)
        )
        rates = result.scalars().all()
        return [db_to_dict(r) for r in rates]


# ==================== LOYALTY POINTS ====================

@api_router.get("/admin/loyalty/settings")
async def get_loyalty_settings(admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBLoyaltySettings).where(DBLoyaltySettings.id == 'loyalty_settings')
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            return {
                "points_per_euro": 1.0,
                "points_value_euro": 0.01,
                "min_points_redeem": 100,
                "is_active": True
            }
        
        return db_to_dict(settings)

@api_router.put("/admin/loyalty/settings")
async def update_loyalty_settings(
    points_per_euro: float,
    points_value_euro: float,
    min_points_redeem: int,
    is_active: bool,
    admin: dict = Depends(get_current_admin)
):
    async with async_session() as session:
        result = await session.execute(
            select(DBLoyaltySettings).where(DBLoyaltySettings.id == 'loyalty_settings')
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            settings = DBLoyaltySettings(id='loyalty_settings')
            session.add(settings)
        
        settings.points_per_euro = points_per_euro
        settings.points_value_euro = points_value_euro
        settings.min_points_redeem = min_points_redeem
        settings.is_active = is_active
        settings.updated_at = datetime.now(timezone.utc)
        
        await session.commit()
        return db_to_dict(settings)

@api_router.get("/customer/loyalty/points")
async def get_customer_points(customer: dict = Depends(get_current_customer)):
    async with async_session() as session:
        result = await session.execute(
            select(func.sum(DBLoyaltyTransaction.points)).where(
                DBLoyaltyTransaction.customer_id == customer['id']
            )
        )
        total_points = result.scalar() or 0
        
        # Get recent transactions
        trans_result = await session.execute(
            select(DBLoyaltyTransaction)
            .where(DBLoyaltyTransaction.customer_id == customer['id'])
            .order_by(DBLoyaltyTransaction.created_at.desc())
            .limit(10)
        )
        transactions = trans_result.scalars().all()
        
        return {
            "total_points": total_points,
            "transactions": [db_to_dict(t) for t in transactions]
        }

@api_router.get("/admin/customers/{customer_id}/loyalty")
async def get_customer_loyalty(customer_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(func.sum(DBLoyaltyTransaction.points)).where(
                DBLoyaltyTransaction.customer_id == customer_id
            )
        )
        total_points = result.scalar() or 0
        
        trans_result = await session.execute(
            select(DBLoyaltyTransaction)
            .where(DBLoyaltyTransaction.customer_id == customer_id)
            .order_by(DBLoyaltyTransaction.created_at.desc())
        )
        transactions = trans_result.scalars().all()
        
        return {
            "total_points": total_points,
            "transactions": [db_to_dict(t) for t in transactions]
        }

@api_router.post("/admin/customers/{customer_id}/loyalty/adjust")
async def adjust_customer_points(
    customer_id: str,
    adjustment: LoyaltyAdjustment,
    admin: dict = Depends(get_current_admin)
):
    async with async_session() as session:
        result = await session.execute(
            select(DBCustomer).where(DBCustomer.id == customer_id)
        )
        customer = result.scalar_one_or_none()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        transaction = DBLoyaltyTransaction(
            id=str(uuid.uuid4()),
            customer_id=customer_id,
            customer_email=customer.email,
            points=adjustment.points,
            type='adjustment' if adjustment.points > 0 else 'redeemed',
            reason=adjustment.reason,
            created_by=admin['email']
        )
        session.add(transaction)
        await session.commit()
        
        # Get new total
        result = await session.execute(
            select(func.sum(DBLoyaltyTransaction.points)).where(
                DBLoyaltyTransaction.customer_id == customer_id
            )
        )
        total_points = result.scalar() or 0
        
        return {
            "success": True,
            "new_total": total_points
        }

# ==================== EXPENSES ====================

@api_router.get("/admin/expenses")
async def get_expenses(admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBExpense).order_by(DBExpense.date.desc())
        )
        expenses = result.scalars().all()
        return [db_to_dict(e) for e in expenses]

@api_router.post("/admin/expenses")
async def create_expense(expense: ExpenseCreate, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        db_expense = DBExpense(
            id=str(uuid.uuid4()),
            description=expense.description,
            amount=expense.amount,
            category=expense.category,
            date=expense.date or datetime.now(timezone.utc),
            notes=expense.notes
        )
        session.add(db_expense)
        await session.commit()
        return db_to_dict(db_expense)

@api_router.delete("/admin/expenses/{expense_id}")
async def delete_expense(expense_id: str, admin: dict = Depends(get_current_admin)):
    async with async_session() as session:
        result = await session.execute(
            select(DBExpense).where(DBExpense.id == expense_id)
        )
        expense = result.scalar_one_or_none()
        
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        await session.delete(expense)
        await session.commit()
        return {"message": "Expense deleted"}

# ==================== ADMIN STATISTICS ====================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_current_admin)):
    """Get admin dashboard stats - only counts paid orders"""
    async with async_session() as session:
        # Total orders - ONLY PAID
        orders_result = await session.execute(
            select(func.count(DBOrder.id)).where(DBOrder.payment_status == 'paid')
        )
        total_orders = orders_result.scalar() or 0
        
        # Total revenue - only from paid orders
        revenue_result = await session.execute(
            select(func.sum(DBOrder.total_amount)).where(
                DBOrder.payment_status == 'paid'
            )
        )
        total_revenue = revenue_result.scalar() or 0
        
        # Total customers
        customers_result = await session.execute(select(func.count(DBCustomer.id)))
        total_customers = customers_result.scalar() or 0
        
        # Total products
        products_result = await session.execute(select(func.count(DBProduct.id)))
        total_products = products_result.scalar() or 0
        
        # New orders (unread) - ONLY PAID
        new_orders_result = await session.execute(
            select(func.count(DBOrder.id)).where(
                and_(DBOrder.is_new == True, DBOrder.payment_status == 'paid')
            )
        )
        new_orders = new_orders_result.scalar() or 0
        
        # Pending orders (status pending, but payment is complete) - ONLY PAID
        pending_result = await session.execute(
            select(func.count(DBOrder.id)).where(
                and_(DBOrder.status == 'pending', DBOrder.payment_status == 'paid')
            )
        )
        pending_orders = pending_result.scalar() or 0
        
        # Low stock products - return actual products, not just count!
        low_stock_result = await session.execute(
            select(DBProduct).where(DBProduct.stock < 10).order_by(DBProduct.stock)
        )
        low_stock_products = [db_to_dict(p) for p in low_stock_result.scalars().all()]
        
        low_stock_count = len(low_stock_products)
        
        # Newsletter subscribers
        newsletter_result = await session.execute(
            select(func.count(DBNewsletterSubscriber.id)).where(
                DBNewsletterSubscriber.is_active == True
            )
        )
        newsletter_subscribers = newsletter_result.scalar() or 0
        
        return {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "total_customers": total_customers,
            "total_products": total_products,
            "new_orders_count": new_orders,
            "pending_orders": pending_orders,
            "low_stock_products": low_stock_products,  # Array of products!
            "low_stock_count": low_stock_count,
            "newsletter_subscribers": newsletter_subscribers
        }

@api_router.get("/admin/stats/sales")
async def get_sales_stats(admin: dict = Depends(get_current_admin), days: int = 30):
    async with async_session() as session:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        result = await session.execute(
            select(DBOrder).where(
                DBOrder.payment_status == 'paid',
                DBOrder.created_at >= start_date
            ).order_by(DBOrder.created_at)
        )
        orders = result.scalars().all()
        
        # Group by date
        daily_sales = {}
        for order in orders:
            date_key = order.created_at.strftime('%Y-%m-%d')
            if date_key not in daily_sales:
                daily_sales[date_key] = {'orders': 0, 'revenue': 0}
            daily_sales[date_key]['orders'] += 1
            daily_sales[date_key]['revenue'] += float(order.total_amount)
        
        return {
            "period_days": days,
            "daily_sales": daily_sales,
            "total_orders": len(orders),
            "total_revenue": sum(float(o.total_amount) for o in orders)
        }

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "postgresql",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ==================== ROUTER ====================

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
