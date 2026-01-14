from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from slugify import slugify
import secrets

# Stripe Integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Email Service
from email_service import (
    send_welcome_email, 
    send_password_reset_email, 
    send_order_confirmation, 
    send_order_status_update
)

# Notification Service (Telegram + E-Mail Benachrichtigungen)
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'wachau-gold-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_placeholder')
# Demo mode if key contains placeholder text or is too short to be valid
STRIPE_DEMO_MODE = (
    'DEIN_STRIPE' in STRIPE_API_KEY or 
    'placeholder' in STRIPE_API_KEY or 
    'HIER' in STRIPE_API_KEY or
    len(STRIPE_API_KEY) < 20 or
    not STRIPE_API_KEY.startswith('sk_')
)
logging.info(f"Stripe Demo Mode: {STRIPE_DEMO_MODE}")

app = FastAPI(title="Wachau Gold API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== NEWSLETTER MODELS ====================

class NewsletterSubscribe(BaseModel):
    email: str
    source: Optional[str] = "website"  # website, under_construction, checkout, manual

class NewsletterSubscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    is_active: bool = True
    source: str = "website"  # website, checkout, manual
    subscribed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    unsubscribed_at: Optional[datetime] = None

# ==================== ADMIN EMAIL MODELS ====================

class AdminEmailSend(BaseModel):
    to_email: str
    subject: str
    message: str
    order_id: Optional[str] = None  # Falls es sich auf eine Bestellung bezieht

class AdminEmailMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_email: str
    to_email: str
    subject: str
    body: str
    is_incoming: bool = True  # True = empfangen, False = gesendet
    is_read: bool = False
    order_id: Optional[str] = None
    customer_id: Optional[str] = None
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== MODELS ====================

# ==================== LOYALTY POINTS MODELS ====================

class LoyaltySettings(BaseModel):
    """Einstellungen für das Treuepunkte-System"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default="loyalty_settings")
    points_per_euro: float = 1.0  # Punkte pro Euro Umsatz
    points_value_euro: float = 0.01  # Wert eines Punktes in Euro (100 Punkte = 1€)
    min_points_redeem: int = 100  # Mindestpunkte zum Einlösen
    is_active: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoyaltyTransaction(BaseModel):
    """Einzelne Punkte-Transaktion"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_email: str
    points: int  # Positiv = verdient, Negativ = eingelöst
    type: str  # 'earned', 'redeemed', 'bonus', 'adjustment', 'expired'
    reason: str  # Beschreibung
    order_id: Optional[str] = None
    created_by: Optional[str] = None  # Admin email wenn manuell
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoyaltyAdjustment(BaseModel):
    """Request für manuelle Punkte-Anpassung"""
    points: int
    reason: str

# ==================== COUPON MODELS ====================

class CouponBase(BaseModel):
    """Gutschein/Rabattcode"""
    code: str
    discount_type: str  # 'percent' oder 'fixed'
    discount_value: float  # Prozent oder Euro-Betrag
    min_order_value: Optional[float] = None  # Mindestbestellwert
    max_uses: Optional[int] = None  # Maximale Nutzungen (None = unbegrenzt)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True
    description: Optional[str] = None

class Coupon(CouponBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uses_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouponValidation(BaseModel):
    """Request zur Gutschein-Validierung"""
    code: str
    subtotal: float

# ==================== PRODUCT MODELS ====================

class ProductBase(BaseModel):
    name_de: str
    name_en: str
    description_de: str
    description_en: str
    price: float
    original_price: Optional[float] = None
    image_url: str
    category: str = "likoer"  # likoer, edelbrand, geschenk, chutney, marmelade, pralinen, schokolade
    stock: int = 100
    is_featured: bool = False
    is_limited: bool = False
    is_18_plus: bool = False  # Requires age verification at checkout
    alcohol_content: Optional[float] = None
    volume_ml: int = 500
    weight_g: Optional[int] = None  # For non-liquid products
    tags: List[str] = []

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sold_count: int = 0

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

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

class OrderItemDetail(BaseModel):
    """Detailed order item with product info for display"""
    product_id: str
    quantity: int
    product_name_de: str
    product_name_en: str
    product_price: float
    product_image_url: str
    subtotal: float

class OrderBase(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    shipping_city: str
    shipping_postal: str
    shipping_country: str = "Österreich"
    items: List[CartItem]
    notes: Optional[str] = None
    customer_id: Optional[str] = None  # Link to customer account if logged in
    coupon_code: Optional[str] = None  # Applied coupon code

class Order(OrderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tracking_number: str = ""
    status: str = "pending"  # pending, paid, processing, shipped, delivered
    payment_status: str = "unpaid"  # unpaid, pending, paid, failed
    stripe_session_id: Optional[str] = None
    total_amount: float = 0
    shipping_cost: float = 0
    subtotal: float = 0
    discount_amount: float = 0  # Applied discount
    coupon_code: Optional[str] = None
    coupon_details: Optional[dict] = None  # Details of applied coupon
    is_new: bool = True
    item_details: List[dict] = []  # Stores product details at time of order
    admin_notes: Optional[str] = None  # Admin-Notizen zur Bestellung
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Carrier tracking fields
    carrier: Optional[str] = None
    carrier_code: Optional[str] = None
    carrier_tracking_number: Optional[str] = None
    carrier_tracking_url: Optional[str] = None

class PaymentTransaction(BaseModel):
    """Payment transaction record"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    session_id: str
    amount: float
    currency: str = "eur"
    payment_status: str = "pending"  # pending, paid, failed, expired
    metadata: dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ShippingRate(BaseModel):
    """Shipping rate for a country"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    country: str
    rate: float
    free_shipping_threshold: float = 0  # 0 means no free shipping
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TrackingUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    text_de: str
    text_en: str
    rating: int = 5
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== CUSTOMER MODELS ====================

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
    # Lieferadresse
    default_address: Optional[str] = None
    default_city: Optional[str] = None
    default_postal: Optional[str] = None
    default_country: Optional[str] = None
    # Rechnungsadresse
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_postal: Optional[str] = None
    billing_country: Optional[str] = None
    billing_same_as_shipping: Optional[bool] = None

# Password Reset Models
class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    token: str
    expires_at: datetime
    used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    # Lieferadresse
    default_address: Optional[str] = None
    default_city: Optional[str] = None
    default_postal: Optional[str] = None
    default_country: str = "Österreich"
    # Rechnungsadresse
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_postal: Optional[str] = None
    billing_country: Optional[str] = None
    billing_same_as_shipping: bool = True
    # Other
    cart_items: List[dict] = []  # Persistent cart
    newsletter_subscribed: bool = False
    is_active: bool = True
    admin_notes: Optional[str] = None  # Admin-Notizen zum Kunden
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc).timestamp() + 86400  # 24h
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_customer_token(customer_id: str, email: str) -> str:
    payload = {
        'customer_id': customer_id,
        'email': email,
        'type': 'customer',
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 30  # 30 days
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
        
        customer = await db.customers.find_one({'id': payload['customer_id']}, {'_id': 0, 'password_hash': 0})
        if not customer:
            raise HTTPException(status_code=401, detail="Customer not found")
        
        return customer
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin = await db.admins.find_one({'id': payload['user_id']}, {'_id': 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid token")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category:
        query['category'] = category
    if featured is not None:
        query['is_featured'] = featured
    products = await db.products.find(query, {'_id': 0}).to_list(100)
    return products

@api_router.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    product = await db.products.find_one({'slug': slug}, {'_id': 0})
    if not product:
        # Try by ID
        product = await db.products.find_one({'id': slug}, {'_id': 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/admin/products", response_model=Product)
async def create_product(product: ProductCreate, admin: dict = Depends(get_current_admin)):
    product_dict = product.model_dump()
    product_obj = Product(**product_dict)
    product_obj.slug = slugify(product.name_de)
    
    # Ensure unique slug
    existing = await db.products.find_one({'slug': product_obj.slug})
    if existing:
        product_obj.slug = f"{product_obj.slug}-{product_obj.id[:8]}"
    
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product_obj

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, update: ProductUpdate, admin: dict = Depends(get_current_admin)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    if 'name_de' in update_data:
        update_data['slug'] = slugify(update_data['name_de'])
    
    result = await db.products.update_one({'id': product_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({'id': product_id}, {'_id': 0})
    return product

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.products.delete_one({'id': product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== ORDER ROUTES ====================

class CreateOrderRequest(BaseModel):
    """Request for creating an order (before payment)"""
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    shipping_city: str
    shipping_postal: str
    shipping_country: str = "Österreich"
    items: List[CartItem]
    notes: Optional[str] = None
    origin_url: str  # Frontend URL for redirect

class CreateOrderResponse(BaseModel):
    """Response with order and payment URL"""
    order_id: str
    checkout_url: str
    total_amount: float

@api_router.post("/orders/create-checkout", response_model=CreateOrderResponse)
async def create_order_with_checkout(request: Request, order_data: CreateOrderRequest):
    """Create order and Stripe checkout session - order is NOT confirmed until payment succeeds"""
    
    # Calculate total and gather item details
    subtotal = 0.0
    item_details = []
    
    for item in order_data.items:
        product = await db.products.find_one({'id': item.product_id}, {'_id': 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        
        # Check stock
        if product.get('stock', 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product['name_de']}")
        
        item_subtotal = float(product['price']) * item.quantity
        subtotal += item_subtotal
        
        # Store product details at time of order
        item_details.append({
            'product_id': item.product_id,
            'quantity': item.quantity,
            'product_name_de': product.get('name_de', ''),
            'product_name_en': product.get('name_en', ''),
            'product_price': float(product['price']),
            'product_image_url': product.get('image_url', ''),
            'subtotal': item_subtotal
        })
    
    # Get shipping cost for country
    shipping_rate = await db.shipping_rates.find_one({
        'country': order_data.shipping_country,
        'is_active': True
    }, {'_id': 0})
    
    shipping_cost = 9.90  # Default
    if shipping_rate:
        if shipping_rate['free_shipping_threshold'] > 0 and subtotal >= shipping_rate['free_shipping_threshold']:
            shipping_cost = 0.0
        else:
            shipping_cost = float(shipping_rate['rate'])
    
    # Apply coupon if provided
    discount_amount = 0.0
    coupon_details = None
    if order_data.coupon_code:
        coupon_result = await apply_coupon_to_order(order_data.coupon_code, subtotal)
        if coupon_result.get('valid'):
            discount_amount = coupon_result['discount_amount']
            coupon_details = {
                'code': coupon_result['code'],
                'discount_type': coupon_result['discount_type'],
                'discount_value': coupon_result['discount_value'],
                'discount_amount': discount_amount
            }
    
    total = subtotal - discount_amount + shipping_cost
    
    # Create order with payment_status = unpaid
    order_id = str(uuid.uuid4())
    order_obj = Order(
        id=order_id,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        shipping_address=order_data.shipping_address,
        shipping_city=order_data.shipping_city,
        shipping_postal=order_data.shipping_postal,
        shipping_country=order_data.shipping_country,
        items=order_data.items,
        notes=order_data.notes,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        discount_amount=discount_amount,
        coupon_code=order_data.coupon_code.upper() if order_data.coupon_code else None,
        coupon_details=coupon_details,
        total_amount=total,
        item_details=item_details,
        status="pending",
        payment_status="unpaid",
        is_new=False,  # Will be set to True when payment succeeds
        tracking_number=f"WG-{datetime.now().strftime('%Y%m%d')}-{order_id[:8].upper()}"
    )
    
    # Save order to DB
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Check if we're in demo mode (no real Stripe keys)
    if STRIPE_DEMO_MODE:
        # Demo mode: Create a fake session and redirect to demo success page
        demo_session_id = f"demo_{order_id}"
        await db.orders.update_one(
            {'id': order_id},
            {'$set': {'stripe_session_id': demo_session_id, 'payment_status': 'pending'}}
        )
        
        # Create demo payment transaction
        payment_tx = PaymentTransaction(
            order_id=order_id,
            session_id=demo_session_id,
            amount=total,
            currency="eur",
            payment_status="pending",
            metadata={"order_id": order_id, "demo": True}
        )
        tx_doc = payment_tx.model_dump()
        tx_doc['created_at'] = tx_doc['created_at'].isoformat()
        tx_doc['updated_at'] = tx_doc['updated_at'].isoformat()
        await db.payment_transactions.insert_one(tx_doc)
        
        # Return demo checkout URL that goes directly to success simulation
        demo_checkout_url = f"{order_data.origin_url}/payment/demo?order_id={order_id}&session_id={demo_session_id}&total={total}"
        
        return CreateOrderResponse(
            order_id=order_id,
            checkout_url=demo_checkout_url,
            total_amount=total
        )
    
    # Real Stripe mode
    # Create Stripe checkout session
    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build success and cancel URLs
        success_url = f"{order_data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}"
        cancel_url = f"{order_data.origin_url}/payment/cancel?order_id={order_id}"
        
        checkout_request = CheckoutSessionRequest(
            amount=total,  # Amount in EUR (float)
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "order_id": order_id,
                "customer_email": order_data.customer_email,
                "customer_name": order_data.customer_name
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Update order with stripe session ID
        await db.orders.update_one(
            {'id': order_id},
            {'$set': {'stripe_session_id': session.session_id, 'payment_status': 'pending'}}
        )
        
        # Create payment transaction record
        payment_tx = PaymentTransaction(
            order_id=order_id,
            session_id=session.session_id,
            amount=total,
            currency="eur",
            payment_status="pending",
            metadata={
                "order_id": order_id,
                "customer_email": order_data.customer_email
            }
        )
        tx_doc = payment_tx.model_dump()
        tx_doc['created_at'] = tx_doc['created_at'].isoformat()
        tx_doc['updated_at'] = tx_doc['updated_at'].isoformat()
        await db.payment_transactions.insert_one(tx_doc)
        
        return CreateOrderResponse(
            order_id=order_id,
            checkout_url=session.url,
            total_amount=total
        )
        
    except Exception as e:
        # If Stripe fails, delete the order
        await db.orders.delete_one({'id': order_id})
        logging.error(f"Stripe checkout creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(request: Request, session_id: str):
    """Check payment status and update order if paid"""
    
    # Find order by session ID
    order = await db.orders.find_one({'stripe_session_id': session_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If already paid, return success
    if order.get('payment_status') == 'paid':
        return {
            "status": "complete",
            "payment_status": "paid",
            "order_id": order['id'],
            "tracking_number": order['tracking_number']
        }
    
    # DEMO MODE: Handle demo sessions without calling Stripe
    if session_id.startswith('demo_') or STRIPE_DEMO_MODE:
        # In demo mode, mark as paid immediately
        await process_successful_payment(order['id'])
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {'session_id': session_id},
            {'$set': {
                'payment_status': 'paid',
                'updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        
        updated_order = await db.orders.find_one({'id': order['id']}, {'_id': 0})
        return {
            "status": "complete",
            "payment_status": "paid",
            "order_id": updated_order['id'],
            "tracking_number": updated_order['tracking_number']
        }
    
    # REAL MODE: Check with Stripe
    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        if checkout_status.payment_status == 'paid':
            # Payment successful! Update order and reserve stock
            await process_successful_payment(order['id'])
            
            # Update payment transaction
            await db.payment_transactions.update_one(
                {'session_id': session_id},
                {'$set': {
                    'payment_status': 'paid',
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }}
            )
            
            updated_order = await db.orders.find_one({'id': order['id']}, {'_id': 0})
            return {
                "status": "complete",
                "payment_status": "paid",
                "order_id": updated_order['id'],
                "tracking_number": updated_order['tracking_number']
            }
        elif checkout_status.status == 'expired':
            await db.orders.update_one(
                {'id': order['id']},
                {'$set': {'payment_status': 'failed', 'status': 'cancelled'}}
            )
            await db.payment_transactions.update_one(
                {'session_id': session_id},
                {'$set': {'payment_status': 'expired', 'updated_at': datetime.now(timezone.utc).isoformat()}}
            )
            return {
                "status": "expired",
                "payment_status": "failed",
                "order_id": order['id']
            }
        else:
            return {
                "status": checkout_status.status,
                "payment_status": checkout_status.payment_status,
                "order_id": order['id']
            }
            
    except Exception as e:
        logging.error(f"Payment status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment status check failed")

async def award_loyalty_points(order: dict):
    """Treuepunkte nach erfolgreicher Bestellung vergeben"""
    settings = await db.loyalty_settings.find_one({'id': 'loyalty_settings'}, {'_id': 0})
    if not settings or not settings.get('is_active', True):
        return
    
    # Kunde finden
    customer = await db.customers.find_one({'email': order.get('customer_email')}, {'_id': 0})
    if not customer:
        return
    
    # Punkte berechnen
    points_per_euro = settings.get('points_per_euro', 1.0)
    order_total = order.get('total_amount', 0)
    points_earned = int(order_total * points_per_euro)
    
    if points_earned <= 0:
        return
    
    # Transaktion erstellen
    transaction = LoyaltyTransaction(
        customer_id=customer['id'],
        customer_email=customer['email'],
        points=points_earned,
        type='earned',
        reason=f"Bestellung #{order.get('tracking_number', order.get('id', '')[:8])}",
        order_id=order.get('id')
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.loyalty_transactions.insert_one(doc)
    
    logging.info(f"Awarded {points_earned} loyalty points to {customer['email']}")

async def process_successful_payment(order_id: str):
    """Process a successful payment - update order and deduct stock"""
    
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        return
    
    # Prevent double processing
    if order.get('payment_status') == 'paid':
        return
    
    # Deduct stock for each item
    for item in order.get('items', []):
        await db.products.update_one(
            {'id': item['product_id']},
            {'$inc': {'stock': -item['quantity'], 'sold_count': item['quantity']}}
        )
    
    # Update order status
    await db.orders.update_one(
        {'id': order_id},
        {'$set': {
            'payment_status': 'paid',
            'status': 'pending',  # Ready for processing
            'is_new': True  # Now it's a real new order!
        }}
    )
    
    # Update customer phone if they have account but no phone saved
    customer_email = order.get('customer_email', '').lower()
    customer_phone = order.get('customer_phone', '')
    if customer_email and customer_phone:
        customer = await db.customers.find_one({'email': customer_email})
        if customer and not customer.get('phone'):
            await db.customers.update_one(
                {'email': customer_email},
                {'$set': {'phone': customer_phone}}
            )
            logging.info(f"Updated phone number for customer {customer_email}")
    
    # Award loyalty points
    try:
        await award_loyalty_points(order)
    except Exception as e:
        logging.error(f"Failed to award loyalty points: {str(e)}")
    
    # Send order confirmation email (fire and forget)
    try:
        updated_order = await db.orders.find_one({'id': order_id}, {'_id': 0})
        if updated_order:
            await send_order_confirmation(updated_order)
    except Exception as e:
        logging.error(f"Failed to send order confirmation email: {str(e)}")
    
    # ===== ADMIN NOTIFICATIONS =====
    try:
        updated_order = await db.orders.find_one({'id': order_id}, {'_id': 0})
        if updated_order:
            # 1. Neue Bestellung Benachrichtigung
            await notify_new_order(updated_order)
            
            # 2. Gutschein verwendet?
            if updated_order.get('coupon_code') and updated_order.get('discount_amount', 0) > 0:
                await notify_coupon_used(
                    updated_order['coupon_code'],
                    updated_order['discount_amount'],
                    updated_order
                )
            
            # 3. Lagerbestand prüfen für alle bestellten Produkte
            for item in updated_order.get('items', []):
                product = await db.products.find_one({'id': item['product_id']}, {'_id': 0})
                if product:
                    stock = product.get('stock', 0)
                    if stock == 0:
                        await notify_out_of_stock(product)
                    elif stock < 10:
                        await notify_low_stock(product)
    except Exception as e:
        logging.error(f"Failed to send admin notifications: {str(e)}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == 'paid':
            # Payment successful
            order_id = webhook_response.metadata.get('order_id')
            if order_id:
                await process_successful_payment(order_id)
                
                # Update payment transaction
                await db.payment_transactions.update_one(
                    {'session_id': webhook_response.session_id},
                    {'$set': {
                        'payment_status': 'paid',
                        'updated_at': datetime.now(timezone.utc).isoformat()
                    }}
                )
                
        logging.info(f"Webhook processed: {webhook_response.event_type}")
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Webhook processing failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# Keep old endpoint for backward compatibility but mark order as unpaid
@api_router.post("/orders", response_model=Order)
async def create_order_legacy(order: OrderBase, background_tasks: BackgroundTasks):
    """Legacy order creation - for testing only. Orders created here are NOT paid."""
    # Calculate total and gather item details
    subtotal = 0.0
    item_details = []
    
    for item in order.items:
        product = await db.products.find_one({'id': item.product_id}, {'_id': 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        
        item_subtotal = float(product['price']) * item.quantity
        subtotal += item_subtotal
        
        item_details.append({
            'product_id': item.product_id,
            'quantity': item.quantity,
            'product_name_de': product.get('name_de', ''),
            'product_name_en': product.get('name_en', ''),
            'product_price': float(product['price']),
            'product_image_url': product.get('image_url', ''),
            'subtotal': item_subtotal
        })
    
    # Get shipping cost
    shipping_rate = await db.shipping_rates.find_one({
        'country': order.shipping_country,
        'is_active': True
    }, {'_id': 0})
    
    shipping_cost = 9.90
    if shipping_rate:
        if shipping_rate['free_shipping_threshold'] > 0 and subtotal >= shipping_rate['free_shipping_threshold']:
            shipping_cost = 0.0
        else:
            shipping_cost = float(shipping_rate['rate'])
    
    total = subtotal + shipping_cost
    
    order_obj = Order(**order.model_dump())
    order_obj.subtotal = subtotal
    order_obj.shipping_cost = shipping_cost
    order_obj.total_amount = total
    order_obj.is_new = True
    order_obj.item_details = item_details
    order_obj.payment_status = "unpaid"
    order_obj.tracking_number = f"WG-{datetime.now().strftime('%Y%m%d')}-{order_obj.id[:8].upper()}"
    
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Send order confirmation email
    background_tasks.add_task(send_order_confirmation, doc)
    
    return order_obj

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/tracking/{tracking_number}")
async def track_order(tracking_number: str):
    # Search by internal tracking number or carrier tracking number
    order = await db.orders.find_one({
        '$or': [
            {'tracking_number': tracking_number.upper()},
            {'tracking_number': tracking_number},
            {'carrier_tracking_number': tracking_number.upper()},
            {'carrier_tracking_number': tracking_number}
        ]
    }, {'_id': 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    
    return {
        "tracking_number": order.get('tracking_number', ''),
        "status": order.get('status', 'pending'),
        "created_at": order.get('created_at', ''),
        "shipping_city": order.get('shipping_city', ''),
        "shipping_country": order.get('shipping_country', ''),
        "carrier": order.get('carrier'),
        "carrier_tracking_number": order.get('carrier_tracking_number'),
        "carrier_tracking_url": order.get('carrier_tracking_url')
    }

@api_router.get("/admin/orders")
async def get_all_orders(admin: dict = Depends(get_current_admin)):
    orders = await db.orders.find({}, {'_id': 0}).sort('created_at', -1).to_list(100)
    
    # Enrich orders with customer info if available
    enriched_orders = []
    for order in orders:
        order_data = dict(order)
        
        # Check if order has customer_id or matching customer by email
        customer = None
        if order.get('customer_id'):
            customer = await db.customers.find_one({'id': order['customer_id']}, {'_id': 0, 'password_hash': 0})
        elif order.get('customer_email'):
            customer = await db.customers.find_one({'email': order['customer_email'].lower()}, {'_id': 0, 'password_hash': 0})
        
        if customer:
            # Get customer stats
            paid_orders = await db.orders.find({
                'customer_email': customer['email'],
                'payment_status': 'paid'
            }).to_list(1000)
            total_spent = sum(o.get('total_amount', 0) for o in paid_orders)
            loyalty = calculate_loyalty_tier(total_spent)
            
            order_data['customer_account'] = {
                "id": customer['id'],
                "first_name": customer['first_name'],
                "last_name": customer['last_name'],
                "loyalty_tier": loyalty['tier'],
                "loyalty_icon": loyalty['tier_icon'],
                "total_orders": len(paid_orders),
                "total_spent": round(total_spent, 2)
            }
        else:
            order_data['customer_account'] = None
        
        enriched_orders.append(order_data)
    
    return enriched_orders

@api_router.put("/admin/orders/mark-all-seen")
async def mark_all_orders_seen(admin: dict = Depends(get_current_admin)):
    """Mark all orders as seen"""
    await db.orders.update_many({'is_new': True}, {'$set': {'is_new': False}})
    return {"message": "All orders marked as seen"}

@api_router.put("/admin/orders/{order_id}/mark-seen")
async def mark_order_as_seen(order_id: str, admin: dict = Depends(get_current_admin)):
    """Mark an order as seen (no longer new)"""
    result = await db.orders.update_one({'id': order_id}, {'$set': {'is_new': False}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order marked as seen"}

# Helper function to detect carrier from tracking number and generate tracking URL
def get_carrier_tracking_url(tracking_number: str, shipping_country: str = "Österreich") -> dict:
    """
    Detect carrier from tracking number format and return carrier info with tracking URL.
    Supports Austrian Post, DHL, DPD, GLS, Hermes for EU shipping.
    """
    if not tracking_number:
        return None
    
    tracking_number = tracking_number.strip().upper()
    
    # Austrian Post - Format: various, often starts with "LX", "RR", "CX", "UX", "EE" or numeric
    if (tracking_number.startswith(('LX', 'RR', 'CX', 'UX', 'EE', 'CP', 'RL')) and len(tracking_number) >= 13) or \
       (tracking_number.isdigit() and len(tracking_number) >= 10):
        return {
            "carrier": "Austrian Post",
            "carrier_code": "austrian_post",
            "tracking_url": f"https://www.post.at/sv/sendungssuche?snr={tracking_number}"
        }
    
    # DHL - Format: Various, often 10-39 chars, may start with JJD, 00, etc.
    if tracking_number.startswith(('JJD', '00', '420')) or \
       (len(tracking_number) >= 10 and len(tracking_number) <= 39 and tracking_number.isdigit()):
        return {
            "carrier": "DHL",
            "carrier_code": "dhl",
            "tracking_url": f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
        }
    
    # DPD - Format: Typically 14 digits or starts with 0550, 0580
    if tracking_number.startswith(('0550', '0580')) or (tracking_number.isdigit() and len(tracking_number) == 14):
        return {
            "carrier": "DPD",
            "carrier_code": "dpd",
            "tracking_url": f"https://tracking.dpd.de/status/de_DE/parcel/{tracking_number}"
        }
    
    # GLS - Format: Typically starts with 6 or 7 and has 11-14 digits
    if tracking_number.isdigit() and len(tracking_number) >= 11 and len(tracking_number) <= 14:
        if tracking_number[0] in ('6', '7', '8'):
            return {
                "carrier": "GLS",
                "carrier_code": "gls",
                "tracking_url": f"https://www.gls-group.eu/276-I-PORTAL-WEB/content/GLS/AT01/DE/5004.htm?txtRefNo={tracking_number}"
            }
    
    # Hermes - Format: Typically starts with H, 16-19 characters
    if tracking_number.startswith('H') and len(tracking_number) >= 16:
        return {
            "carrier": "Hermes",
            "carrier_code": "hermes",
            "tracking_url": f"https://www.myhermes.de/empfangen/sendungsverfolgung/?trackingId={tracking_number}"
        }
    
    # UPS - Format: 1Z followed by 16 alphanumeric characters
    if tracking_number.startswith('1Z') and len(tracking_number) == 18:
        return {
            "carrier": "UPS",
            "carrier_code": "ups",
            "tracking_url": f"https://www.ups.com/track?loc=de_DE&tracknum={tracking_number}"
        }
    
    # FedEx - Format: Typically 12-22 digits
    if tracking_number.isdigit() and len(tracking_number) >= 12 and len(tracking_number) <= 22:
        return {
            "carrier": "FedEx",
            "carrier_code": "fedex",
            "tracking_url": f"https://www.fedex.com/fedextrack/?trknbr={tracking_number}"
        }
    
    # Default: Return Austrian Post as default for Austrian shop
    return {
        "carrier": "Austrian Post",
        "carrier_code": "austrian_post",
        "tracking_url": f"https://www.post.at/sv/sendungssuche?snr={tracking_number}"
    }

@api_router.put("/admin/orders/{order_id}")
async def update_order_status(order_id: str, update: TrackingUpdate, background_tasks: BackgroundTasks, admin: dict = Depends(get_current_admin)):
    # Get current order
    order = await db.orders.find_one({'id': order_id}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    old_status = order.get('status')
    new_status = update.status
    
    update_data = {'status': new_status}
    carrier_info = None  # Initialize carrier_info
    
    # Handle tracking number with carrier detection
    if update.tracking_number:
        update_data['tracking_number'] = update.tracking_number.strip()
        
        # Auto-detect carrier and generate tracking URL
        carrier_info = get_carrier_tracking_url(update.tracking_number, order.get('shipping_country', 'Österreich'))
        if carrier_info:
            update_data['carrier'] = carrier_info['carrier']
            update_data['carrier_code'] = carrier_info['carrier_code']
            update_data['carrier_tracking_url'] = carrier_info['tracking_url']
            update_data['carrier_tracking_number'] = update.tracking_number.strip()
    
    if update.notes:
        update_data['notes'] = update.notes
    
    result = await db.orders.update_one({'id': order_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Send status update email if status changed
    if old_status != new_status and new_status in ['processing', 'shipped', 'delivered', 'cancelled']:
        # Update order dict with new status for email
        order['status'] = new_status
        if update.tracking_number:
            order['tracking_number'] = update.tracking_number
            if carrier_info:
                order['carrier_tracking_url'] = carrier_info['tracking_url']
                order['carrier'] = carrier_info['carrier']
        background_tasks.add_task(send_order_status_update, order, new_status)
    
    return {"message": "Order updated"}

@api_router.get("/admin/orders/new-count")
async def get_new_orders_count(admin: dict = Depends(get_current_admin)):
    """Get count of new (unseen) orders"""
    count = await db.orders.count_documents({'is_new': True})
    return {"count": count}

# ==================== SHIPPING RATES ROUTES ====================

class ShippingRateCreate(BaseModel):
    country: str
    rate: float
    free_shipping_threshold: float = 0

class ShippingRateUpdate(BaseModel):
    rate: Optional[float] = None
    free_shipping_threshold: Optional[float] = None
    is_active: Optional[bool] = None

@api_router.get("/shipping-rates")
async def get_shipping_rates():
    """Public endpoint to get active shipping rates for checkout"""
    rates = await db.shipping_rates.find({'is_active': True}, {'_id': 0}).to_list(50)
    return rates

@api_router.get("/admin/shipping-rates")
async def get_all_shipping_rates(admin: dict = Depends(get_current_admin)):
    """Admin endpoint to get all shipping rates"""
    rates = await db.shipping_rates.find({}, {'_id': 0}).to_list(50)
    return rates

@api_router.post("/admin/shipping-rates")
async def create_shipping_rate(rate: ShippingRateCreate, admin: dict = Depends(get_current_admin)):
    """Create a new shipping rate"""
    # Check if rate for this country already exists
    existing = await db.shipping_rates.find_one({'country': rate.country})
    if existing:
        raise HTTPException(status_code=400, detail=f"Shipping rate for {rate.country} already exists")
    
    shipping_rate = ShippingRate(
        country=rate.country,
        rate=rate.rate,
        free_shipping_threshold=rate.free_shipping_threshold
    )
    doc = shipping_rate.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.shipping_rates.insert_one(doc)
    return shipping_rate

@api_router.put("/admin/shipping-rates/{rate_id}")
async def update_shipping_rate(rate_id: str, update: ShippingRateUpdate, admin: dict = Depends(get_current_admin)):
    """Update a shipping rate"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.shipping_rates.update_one({'id': rate_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shipping rate not found")
    return {"message": "Shipping rate updated"}

@api_router.delete("/admin/shipping-rates/{rate_id}")
async def delete_shipping_rate(rate_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a shipping rate"""
    result = await db.shipping_rates.delete_one({'id': rate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipping rate not found")
    return {"message": "Shipping rate deleted"}

# ==================== TESTIMONIAL ROUTES ====================

@api_router.get("/testimonials", response_model=List[Testimonial])
async def get_testimonials():
    testimonials = await db.testimonials.find({'is_active': True}, {'_id': 0}).to_list(20)
    return testimonials

@api_router.post("/admin/testimonials", response_model=Testimonial)
async def create_testimonial(testimonial: Testimonial, admin: dict = Depends(get_current_admin)):
    doc = testimonial.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.testimonials.insert_one(doc)
    return testimonial

# ==================== AUTH ROUTES ====================

ADMIN_SECRET = os.environ.get('ADMIN_SECRET', 'wachau-admin-2024')
DEFAULT_ADMIN_EMAIL = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@boehmer.at')
DEFAULT_ADMIN_PASSWORD = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'wachau2024')

# Admin creation model (for dashboard use)
class AdminCreate(BaseModel):
    email: str
    password: str

@api_router.post("/admin/register")
async def register_admin(data: AdminRegister):
    if data.admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    
    existing = await db.admins.find_one({'email': data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin = AdminUser(
        email=data.email,
        password_hash=hash_password(data.password)
    )
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admins.insert_one(doc)
    
    token = create_token(admin.id, admin.email)
    return {"token": token, "email": admin.email}

@api_router.post("/admin/create")
async def create_admin_from_dashboard(data: AdminCreate, admin: dict = Depends(get_current_admin)):
    """Create a new admin from the dashboard (requires existing admin authentication)"""
    existing = await db.admins.find_one({'email': data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_admin = AdminUser(
        email=data.email,
        password_hash=hash_password(data.password)
    )
    doc = new_admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admins.insert_one(doc)
    
    return {"message": "Admin created successfully", "email": new_admin.email, "id": new_admin.id}

@api_router.post("/admin/login")
async def login_admin(data: AdminLogin):
    # First, ensure default admin exists
    default_admin = await db.admins.find_one({'email': DEFAULT_ADMIN_EMAIL})
    if not default_admin:
        # Create default admin on first login attempt
        admin = AdminUser(
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=hash_password(DEFAULT_ADMIN_PASSWORD)
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.admins.insert_one(doc)
    
    admin = await db.admins.find_one({'email': data.email}, {'_id': 0})
    if not admin or not verify_password(data.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(admin['id'], admin['email'])
    return {"token": token, "email": admin['email']}

@api_router.get("/admin/me")
async def get_admin_profile(admin: dict = Depends(get_current_admin)):
    return {"email": admin['email'], "id": admin['id']}

# ==================== CUSTOMER AUTH ENDPOINTS ====================

@api_router.post("/customer/register")
async def register_customer(data: CustomerRegister, background_tasks: BackgroundTasks):
    """Register a new customer account"""
    # Check if email exists
    existing = await db.customers.find_one({'email': data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail existiert bereits. Bitte melden Sie sich an.")
    
    # Create customer
    customer = Customer(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone
    )
    
    await db.customers.insert_one(customer.model_dump())
    
    # Send welcome email in background
    background_tasks.add_task(
        send_welcome_email, 
        customer.email, 
        customer.first_name, 
        'Österreich'  # Default, kann später aus Adresse kommen
    )
    
    # Admin-Benachrichtigung: Neuer Kunde
    try:
        await notify_new_customer(customer.model_dump())
    except Exception as e:
        logging.error(f"Failed to send new customer notification: {str(e)}")
    
    token = create_customer_token(customer.id, customer.email)
    return {
        "token": token,
        "customer": {
            "id": customer.id,
            "email": customer.email,
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "phone": customer.phone
        }
    }

@api_router.post("/customer/login")
async def login_customer(data: CustomerLogin):
    """Login customer"""
    customer = await db.customers.find_one({'email': data.email.lower()})
    if not customer:
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    if not verify_password(data.password, customer['password_hash']):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    if not customer.get('is_active', True):
        raise HTTPException(status_code=401, detail="Konto deaktiviert")
    
    # Update last login
    await db.customers.update_one(
        {'id': customer['id']},
        {'$set': {'last_login': datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_customer_token(customer['id'], customer['email'])
    return {
        "token": token,
        "customer": {
            "id": customer['id'],
            "email": customer['email'],
            "first_name": customer['first_name'],
            "last_name": customer['last_name'],
            "phone": customer.get('phone'),
            "default_address": customer.get('default_address'),
            "default_city": customer.get('default_city'),
            "default_postal": customer.get('default_postal'),
            "default_country": customer.get('default_country', 'Österreich'),
            "cart_items": customer.get('cart_items', [])
        }
    }

# ==================== PASSWORD RESET ====================

@api_router.post("/customer/password-reset/request")
async def request_password_reset(data: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Request a password reset email"""
    logging.info(f"Password reset requested for: {data.email}")
    
    customer = await db.customers.find_one({'email': data.email.lower()})
    
    # Always return success to prevent email enumeration
    if not customer:
        logging.warning(f"Password reset: No customer found for {data.email}")
        return {"message": "Wenn ein Konto mit dieser E-Mail existiert, erhalten Sie einen Link zum Zurücksetzen des Passworts."}
    
    logging.info(f"Customer found: {customer.get('first_name')} - {customer.get('email')}")
    
    # Generate secure token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)  # Changed to 30 minutes as user requested
    
    # Save token to database
    token_doc = PasswordResetToken(
        customer_id=customer['id'],
        token=reset_token,
        expires_at=expires_at
    )
    await db.password_reset_tokens.insert_one(token_doc.model_dump())
    logging.info(f"Password reset token saved for customer {customer['id']}")
    
    # Send email DIRECTLY instead of background task to ensure it's sent
    try:
        result = await send_password_reset_email(
            customer['email'],
            customer['first_name'],
            reset_token,
            customer.get('default_country', 'Österreich')
        )
        if result:
            logging.info(f"Password reset email sent successfully to {customer['email']}")
        else:
            logging.error(f"Failed to send password reset email to {customer['email']}")
    except Exception as e:
        logging.error(f"Error sending password reset email: {str(e)}")
    
    return {"message": "Wenn ein Konto mit dieser E-Mail existiert, erhalten Sie einen Link zum Zurücksetzen des Passworts."}

@api_router.post("/customer/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    """Confirm password reset with token"""
    # Find valid token
    token_doc = await db.password_reset_tokens.find_one({
        'token': data.token,
        'used': False
    })
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Link")
    
    # Check expiration
    expires_at = token_doc['expires_at']
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Link abgelaufen. Bitte fordern Sie einen neuen an.")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.customers.update_one(
        {'id': token_doc['customer_id']},
        {'$set': {'password_hash': new_hash}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {'token': data.token},
        {'$set': {'used': True}}
    )
    
    return {"message": "Passwort erfolgreich geändert. Sie können sich jetzt anmelden."}

@api_router.get("/customer/password-reset/verify/{token}")
async def verify_reset_token(token: str):
    """Verify if a reset token is valid"""
    token_doc = await db.password_reset_tokens.find_one({
        'token': token,
        'used': False
    })
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Ungültiger Link")
    
    expires_at = token_doc['expires_at']
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
    
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Link abgelaufen")
    
    return {"valid": True}

# ==================== UNIFIED LOGIN ====================

class UnifiedLogin(BaseModel):
    email: str
    password: str

@api_router.post("/auth/login")
async def unified_login(data: UnifiedLogin):
    """Unified login for both admin and customer accounts"""
    email_lower = data.email.lower()
    
    # First, ensure default admin exists
    default_admin = await db.admins.find_one({'email': DEFAULT_ADMIN_EMAIL})
    if not default_admin:
        admin = AdminUser(
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=hash_password(DEFAULT_ADMIN_PASSWORD)
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.admins.insert_one(doc)
    
    # Try admin login first
    admin = await db.admins.find_one({'email': email_lower}, {'_id': 0})
    if admin and verify_password(data.password, admin['password_hash']):
        token = create_token(admin['id'], admin['email'])
        return {
            "token": token,
            "user_type": "admin",
            "user": {
                "id": admin['id'],
                "email": admin['email'],
                "first_name": "Admin",
                "last_name": ""
            }
        }
    
    # Try customer login
    customer = await db.customers.find_one({'email': email_lower})
    if customer and verify_password(data.password, customer['password_hash']):
        if not customer.get('is_active', True):
            raise HTTPException(status_code=401, detail="Konto deaktiviert")
        
        # Update last login
        await db.customers.update_one(
            {'id': customer['id']},
            {'$set': {'last_login': datetime.now(timezone.utc).isoformat()}}
        )
        
        token = create_customer_token(customer['id'], customer['email'])
        return {
            "token": token,
            "user_type": "customer",
            "user": {
                "id": customer['id'],
                "email": customer['email'],
                "first_name": customer['first_name'],
                "last_name": customer['last_name'],
                "phone": customer.get('phone'),
                "default_address": customer.get('default_address'),
                "default_city": customer.get('default_city'),
                "default_postal": customer.get('default_postal'),
                "default_country": customer.get('default_country', 'Österreich'),
                "cart_items": customer.get('cart_items', [])
            }
        }
    
    # Neither found
    raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")

@api_router.get("/customer/me")
async def get_customer_profile(customer: dict = Depends(get_current_customer)):
    """Get current customer profile"""
    return customer

@api_router.put("/customer/me")
async def update_customer_profile(data: CustomerUpdate, customer: dict = Depends(get_current_customer)):
    """Update customer profile"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.customers.update_one({'id': customer['id']}, {'$set': update_data})
    
    updated = await db.customers.find_one({'id': customer['id']}, {'_id': 0, 'password_hash': 0})
    return updated

@api_router.get("/customer/orders")
async def get_customer_orders(customer: dict = Depends(get_current_customer)):
    """Get all orders for current customer"""
    orders = await db.orders.find(
        {'customer_email': customer['email']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    return orders

@api_router.get("/customer/cart")
async def get_customer_cart(customer: dict = Depends(get_current_customer)):
    """Get customer's saved cart"""
    return {"cart_items": customer.get('cart_items', [])}

@api_router.put("/customer/cart")
async def update_customer_cart(cart_items: List[CartItem], customer: dict = Depends(get_current_customer)):
    """Update customer's cart"""
    cart_data = [item.model_dump() for item in cart_items]
    await db.customers.update_one(
        {'id': customer['id']},
        {'$set': {'cart_items': cart_data}}
    )
    return {"cart_items": cart_data}

@api_router.get("/customer/check-email")
async def check_email_exists(email: str):
    """Check if email already exists"""
    existing = await db.customers.find_one({'email': email.lower()})
    return {"exists": existing is not None}

# Loyalty Tier Calculation
def calculate_loyalty_tier(total_spent: float) -> dict:
    """Calculate customer loyalty tier based on total spent"""
    tiers = [
        {"name": "Bronze", "min": 0, "max": 50, "color": "#CD7F32", "icon": "🥉"},
        {"name": "Silber", "min": 50, "max": 100, "color": "#C0C0C0", "icon": "🥈"},
        {"name": "Gold", "min": 100, "max": 250, "color": "#FFD700", "icon": "🥇"},
        {"name": "Platinum", "min": 250, "max": 500, "color": "#E5E4E2", "icon": "💎"},
        {"name": "Diamond", "min": 500, "max": float('inf'), "color": "#B9F2FF", "icon": "👑"}
    ]
    
    current_tier = tiers[0]
    next_tier = tiers[1] if len(tiers) > 1 else None
    
    for i, tier in enumerate(tiers):
        if total_spent >= tier["min"]:
            current_tier = tier
            next_tier = tiers[i + 1] if i + 1 < len(tiers) else None
    
    amount_to_next = 0
    if next_tier:
        amount_to_next = next_tier["min"] - total_spent
    
    return {
        "tier": current_tier["name"],
        "tier_color": current_tier["color"],
        "tier_icon": current_tier["icon"],
        "total_spent": round(total_spent, 2),
        "next_tier": next_tier["name"] if next_tier else None,
        "amount_to_next_tier": round(max(0, amount_to_next), 2) if next_tier else 0,
        "progress_percent": min(100, (total_spent / next_tier["min"] * 100)) if next_tier else 100
    }

@api_router.get("/customer/stats")
async def get_customer_stats(customer: dict = Depends(get_current_customer)):
    """Get customer statistics including loyalty tier"""
    # Get all paid orders for this customer
    orders = await db.orders.find({
        'customer_email': customer['email'],
        'payment_status': 'paid'
    }).to_list(1000)
    
    total_spent = sum(order.get('total_amount', 0) for order in orders)
    order_count = len(orders)
    
    # Get last order date
    last_order = None
    if orders:
        sorted_orders = sorted(orders, key=lambda x: x.get('created_at', ''), reverse=True)
        last_order = sorted_orders[0].get('created_at') if sorted_orders else None
    
    loyalty = calculate_loyalty_tier(total_spent)
    
    return {
        "total_spent": round(total_spent, 2),
        "order_count": order_count,
        "last_order_date": last_order,
        "loyalty": loyalty
    }

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/customer/password")
async def change_customer_password(data: PasswordChange, customer: dict = Depends(get_current_customer)):
    """Change customer password"""
    # Get full customer with password hash
    full_customer = await db.customers.find_one({'id': customer['id']})
    
    # Verify current password
    if not verify_password(data.current_password, full_customer['password_hash']):
        raise HTTPException(status_code=400, detail="Aktuelles Passwort ist falsch")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Neues Passwort muss mindestens 6 Zeichen haben")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.customers.update_one(
        {'id': customer['id']},
        {'$set': {'password_hash': new_hash}}
    )
    
    return {"message": "Passwort erfolgreich geändert"}

# ==================== ADMIN CUSTOMER MANAGEMENT ====================

@api_router.get("/admin/customers")
async def get_all_customers(admin: dict = Depends(get_current_admin)):
    """Get all customers with stats for admin"""
    customers = await db.customers.find({}, {'_id': 0, 'password_hash': 0}).to_list(1000)
    
    # Get all active newsletter subscribers emails for quick lookup
    newsletter_subscribers = await db.newsletter_subscribers.find(
        {'is_active': True}, 
        {'email': 1, '_id': 0}
    ).to_list(10000)
    subscribed_emails = {sub['email'].lower() for sub in newsletter_subscribers}
    
    result = []
    for cust in customers:
        # Get orders for this customer
        orders = await db.orders.find({
            'customer_email': cust['email'],
            'payment_status': 'paid'
        }).to_list(1000)
        
        total_spent = sum(order.get('total_amount', 0) for order in orders)
        order_count = len(orders)
        
        # Last order
        last_order_date = None
        if orders:
            sorted_orders = sorted(orders, key=lambda x: x.get('created_at', ''), reverse=True)
            last_order_date = sorted_orders[0].get('created_at') if sorted_orders else None
        
        loyalty = calculate_loyalty_tier(total_spent)
        
        # Check if customer email is in newsletter subscribers
        is_subscribed = cust['email'].lower() in subscribed_emails
        
        result.append({
            **cust,
            "newsletter_subscribed": is_subscribed,  # Dynamisch aus Newsletter-DB abgeglichen
            "stats": {
                "total_spent": round(total_spent, 2),
                "order_count": order_count,
                "last_order_date": last_order_date,
                "loyalty_tier": loyalty["tier"],
                "loyalty_color": loyalty["tier_color"],
                "loyalty_icon": loyalty["tier_icon"]
            }
        })
    
    # Sort by total spent descending
    result.sort(key=lambda x: x['stats']['total_spent'], reverse=True)
    return result

@api_router.get("/admin/customers/{customer_id}")
async def get_customer_detail(customer_id: str, admin: dict = Depends(get_current_admin)):
    """Get detailed customer info including all orders"""
    customer = await db.customers.find_one({'id': customer_id}, {'_id': 0, 'password_hash': 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    # Get all orders
    orders = await db.orders.find(
        {'customer_email': customer['email']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    
    # Calculate stats
    paid_orders = [o for o in orders if o.get('payment_status') == 'paid']
    total_spent = sum(order.get('total_amount', 0) for order in paid_orders)
    loyalty = calculate_loyalty_tier(total_spent)
    
    # Check newsletter subscription status dynamically
    newsletter_sub = await db.newsletter_subscribers.find_one(
        {'email': customer['email'].lower(), 'is_active': True},
        {'_id': 0}
    )
    customer['newsletter_subscribed'] = newsletter_sub is not None
    
    return {
        "customer": customer,
        "orders": orders,
        "stats": {
            "total_spent": round(total_spent, 2),
            "order_count": len(paid_orders),
            "all_orders_count": len(orders),
            "loyalty": loyalty
        }
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    # Check if already seeded
    existing = await db.products.find_one()
    if existing:
        return {"message": "Database already seeded"}
    
    # Seed products
    products = [
        {
            "id": str(uuid.uuid4()),
            "name_de": "Wachauer Marillenlikör Premium",
            "name_en": "Wachau Apricot Liqueur Premium",
            "description_de": "Unser Signature-Likör, hergestellt aus handverlesenen Wachauer Marillen. Ein samtiger Genuss mit intensivem Fruchtaroma und feiner Süße. Perfekt als Digestif oder zum Verfeinern von Desserts.",
            "description_en": "Our signature liqueur, crafted from hand-picked Wachau apricots. A velvety delight with intense fruit aroma and refined sweetness. Perfect as a digestif or for enhancing desserts.",
            "price": 32.90,
            "original_price": 38.90,
            "image_url": "https://images.unsplash.com/photo-1712995518454-fb58d7995f69?crop=entropy&cs=srgb&fm=jpg&q=85",
            "category": "likoer",
            "stock": 45,
            "is_featured": True,
            "is_limited": True,
            "alcohol_content": 25.0,
            "volume_ml": 500,
            "tags": ["premium", "bestseller", "geschenk"],
            "slug": "wachauer-marillenlikoer-premium",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "sold_count": 234
        },
        {
            "id": str(uuid.uuid4()),
            "name_de": "Marillen Edelbrand",
            "name_en": "Apricot Fine Brandy",
            "description_de": "Doppelt destilliert für höchste Reinheit. Dieser Edelbrand fängt die Essenz der Wachauer Marille ein - intensiv, fruchtig und mit langem Abgang.",
            "description_en": "Double distilled for utmost purity. This fine brandy captures the essence of Wachau apricots - intense, fruity with a long finish.",
            "price": 45.00,
            "image_url": "https://images.unsplash.com/photo-1587304656733-50aaff6d1446?crop=entropy&cs=srgb&fm=jpg&q=85",
            "category": "edelbrand",
            "stock": 28,
            "is_featured": True,
            "is_limited": False,
            "alcohol_content": 40.0,
            "volume_ml": 350,
            "tags": ["edelbrand", "premium"],
            "slug": "marillen-edelbrand",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "sold_count": 156
        },
        {
            "id": str(uuid.uuid4()),
            "name_de": "Marillenlikör Klassik",
            "name_en": "Apricot Liqueur Classic",
            "description_de": "Der zeitlose Klassiker aus unserem Haus. Mild, fruchtig und perfekt ausbalanciert - ideal für Einsteiger und Kenner gleichermaßen.",
            "description_en": "The timeless classic from our house. Mild, fruity and perfectly balanced - ideal for beginners and connoisseurs alike.",
            "price": 24.90,
            "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?crop=entropy&cs=srgb&fm=jpg&q=85",
            "category": "likoer",
            "stock": 120,
            "is_featured": False,
            "is_limited": False,
            "alcohol_content": 20.0,
            "volume_ml": 500,
            "tags": ["klassik", "einsteiger"],
            "slug": "marillenlikoer-klassik",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "sold_count": 89
        },
        {
            "id": str(uuid.uuid4()),
            "name_de": "Geschenkset Wachau Trio",
            "name_en": "Gift Set Wachau Trio",
            "description_de": "Drei unserer beliebtesten Kreationen in einer eleganten Geschenkbox. Enthält: Premium Likör, Klassik Likör und Edelbrand je 200ml.",
            "description_en": "Three of our most popular creations in an elegant gift box. Contains: Premium Liqueur, Classic Liqueur and Fine Brandy, 200ml each.",
            "price": 65.00,
            "original_price": 75.00,
            "image_url": "https://images.unsplash.com/photo-1608885898957-a559228e8749?crop=entropy&cs=srgb&fm=jpg&q=85",
            "category": "geschenk",
            "stock": 15,
            "is_featured": True,
            "is_limited": True,
            "alcohol_content": None,
            "volume_ml": 600,
            "tags": ["geschenk", "set", "premium"],
            "slug": "geschenkset-wachau-trio",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "sold_count": 67
        }
    ]
    
    await db.products.insert_many(products)
    
    # Seed testimonials
    testimonials = [
        {
            "id": str(uuid.uuid4()),
            "name": "Maria H.",
            "location": "Wien",
            "text_de": "Der beste Marillenlikör, den ich je probiert habe. Man schmeckt die Qualität der Wachauer Marillen in jedem Schluck.",
            "text_en": "The best apricot liqueur I've ever tasted. You can taste the quality of Wachau apricots in every sip.",
            "rating": 5,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Thomas K.",
            "location": "München",
            "text_de": "Ein Geschenk für meine Eltern - sie waren begeistert! Die Verpackung ist wunderschön und der Likör erstklassig.",
            "text_en": "A gift for my parents - they were thrilled! The packaging is beautiful and the liqueur is first class.",
            "rating": 5,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sophie L.",
            "location": "Zürich",
            "text_de": "Wir haben das Weingut besucht und waren vom Geschmack und der Gastfreundschaft überwältigt. Jetzt bestellen wir regelmäßig.",
            "text_en": "We visited the winery and were overwhelmed by the taste and hospitality. Now we order regularly.",
            "rating": 5,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.testimonials.insert_many(testimonials)
    
    # Seed default shipping rates
    shipping_count = await db.shipping_rates.count_documents({})
    if shipping_count == 0:
        default_shipping_rates = [
            {
                "id": str(uuid.uuid4()),
                "country": "Österreich",
                "rate": 5.90,
                "free_shipping_threshold": 50.0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "country": "Deutschland",
                "rate": 9.90,
                "free_shipping_threshold": 75.0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "country": "Schweiz",
                "rate": 14.90,
                "free_shipping_threshold": 100.0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "country": "Italien",
                "rate": 12.90,
                "free_shipping_threshold": 100.0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "country": "Frankreich",
                "rate": 14.90,
                "free_shipping_threshold": 100.0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "country": "Niederlande",
                "rate": 12.90,
                "free_shipping_threshold": 100.0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "country": "Belgien",
                "rate": 12.90,
                "free_shipping_threshold": 100.0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.shipping_rates.insert_many(default_shipping_rates)
    
    return {"message": "Database seeded successfully"}

# ==================== STATS ====================

@api_router.get("/admin/stats")
async def get_stats(admin: dict = Depends(get_current_admin)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({'status': 'pending'})
    processing_orders = await db.orders.count_documents({'status': 'processing'})
    shipped_orders = await db.orders.count_documents({'status': 'shipped'})
    delivered_orders = await db.orders.count_documents({'status': 'delivered'})
    new_orders_count = await db.orders.count_documents({'is_new': True})
    
    # Calculate total revenue
    orders = await db.orders.find({}, {'_id': 0, 'total_amount': 1, 'status': 1, 'created_at': 1}).to_list(1000)
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    
    # Calculate monthly revenue (last 6 months)
    monthly_revenue = {}
    for order in orders:
        if 'created_at' in order:
            try:
                if isinstance(order['created_at'], str):
                    date = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00'))
                else:
                    date = order['created_at']
                month_key = date.strftime('%Y-%m')
                monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + order.get('total_amount', 0)
            except (ValueError, KeyError, TypeError):
                pass
    
    # Get top selling products
    products = await db.products.find({}, {'_id': 0, 'name_de': 1, 'sold_count': 1, 'price': 1}).sort('sold_count', -1).to_list(5)
    
    # Low stock products
    low_stock = await db.products.find({'stock': {'$lt': 20}}, {'_id': 0, 'name_de': 1, 'stock': 1}).to_list(10)
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
        "new_orders_count": new_orders_count,
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "top_products": products,
        "low_stock_products": low_stock
    }

@api_router.get("/admin/analytics")
async def get_analytics(admin: dict = Depends(get_current_admin)):
    """Erweiterte Analytics-Daten"""
    from datetime import timedelta
    
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)
    
    # Alle Bestellungen
    all_orders = await db.orders.find({'payment_status': 'paid'}, {'_id': 0}).to_list(10000)
    
    # Bestellungen der letzten 30 Tage
    recent_orders = []
    for order in all_orders:
        try:
            created = order.get('created_at')
            if isinstance(created, str):
                created = datetime.fromisoformat(created.replace('Z', '+00:00'))
            if created >= thirty_days_ago:
                recent_orders.append(order)
        except:
            pass
    
    # Umsatz nach Tagen (letzte 30 Tage)
    daily_revenue = {}
    for i in range(30):
        day = (now - timedelta(days=i)).strftime('%Y-%m-%d')
        daily_revenue[day] = 0
    
    for order in recent_orders:
        try:
            created = order.get('created_at')
            if isinstance(created, str):
                created = datetime.fromisoformat(created.replace('Z', '+00:00'))
            day = created.strftime('%Y-%m-%d')
            if day in daily_revenue:
                daily_revenue[day] += order.get('total_amount', 0)
        except:
            pass
    
    # Top Produkte (nach Verkaufszahl)
    products = await db.products.find({}, {'_id': 0, 'name_de': 1, 'sold_count': 1, 'price': 1, 'stock': 1, 'category': 1}).to_list(100)
    top_products = sorted(products, key=lambda x: x.get('sold_count', 0), reverse=True)[:10]
    
    # Verkäufe nach Kategorie
    category_sales = {}
    for product in products:
        cat = product.get('category', 'other')
        category_sales[cat] = category_sales.get(cat, 0) + product.get('sold_count', 0)
    
    # Umsatz nach Land
    country_revenue = {}
    for order in all_orders:
        country = order.get('shipping_country', 'Unbekannt')
        country_revenue[country] = country_revenue.get(country, 0) + order.get('total_amount', 0)
    
    # Durchschnittlicher Bestellwert
    avg_order_value = sum(o.get('total_amount', 0) for o in all_orders) / len(all_orders) if all_orders else 0
    
    # Bestellungen der letzten 7 Tage vs. Woche davor
    orders_last_7_days = len([o for o in recent_orders if datetime.fromisoformat(o['created_at'].replace('Z', '+00:00')) >= seven_days_ago])
    
    # Kunden
    customers = await db.customers.find({}, {'_id': 0, 'created_at': 1}).to_list(10000)
    new_customers_30_days = 0
    for c in customers:
        try:
            created = c.get('created_at')
            if isinstance(created, str):
                created = datetime.fromisoformat(created.replace('Z', '+00:00'))
            if created >= thirty_days_ago:
                new_customers_30_days += 1
        except:
            pass
    
    # Produkt-Klicks (aus einer separaten Collection, falls vorhanden)
    product_views = await db.product_views.find({}, {'_id': 0}).to_list(1000) if await db.list_collection_names() else []
    
    # Website-Besucher simulieren (in echtem Projekt würde man Google Analytics API nutzen)
    # Hier erstellen wir Placeholder-Daten
    
    return {
        "total_orders": len(all_orders),
        "orders_last_30_days": len(recent_orders),
        "orders_last_7_days": orders_last_7_days,
        "total_revenue": sum(o.get('total_amount', 0) for o in all_orders),
        "revenue_last_30_days": sum(o.get('total_amount', 0) for o in recent_orders),
        "avg_order_value": round(avg_order_value, 2),
        "total_customers": len(customers),
        "new_customers_30_days": new_customers_30_days,
        "daily_revenue": daily_revenue,
        "top_products": top_products,
        "category_sales": category_sales,
        "country_revenue": country_revenue,
        "conversion_rate": 3.2  # Placeholder - würde normalerweise aus Tracking kommen
    }

# ==================== ADMIN MANAGEMENT ====================

@api_router.get("/admin/admins")
async def get_all_admins(admin: dict = Depends(get_current_admin)):
    admins = await db.admins.find({}, {'_id': 0, 'password_hash': 0}).to_list(100)
    return admins

@api_router.delete("/admin/admins/{admin_id}")
async def delete_admin(admin_id: str, admin: dict = Depends(get_current_admin)):
    # Can't delete yourself
    if admin['id'] == admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.admins.delete_one({'id': admin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"message": "Admin deleted"}

# ==================== ADMIN NOTES ====================

class AdminNoteUpdate(BaseModel):
    notes: Optional[str] = None

@api_router.put("/admin/customers/{customer_id}/notes")
async def update_customer_notes(customer_id: str, data: AdminNoteUpdate, admin: dict = Depends(get_current_admin)):
    """Admin-Notiz zu einem Kunden speichern"""
    result = await db.customers.update_one(
        {'id': customer_id},
        {'$set': {'admin_notes': data.notes}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    return {"message": "Notiz gespeichert"}

@api_router.put("/admin/orders/{order_id}/notes")
async def update_order_notes(order_id: str, data: AdminNoteUpdate, admin: dict = Depends(get_current_admin)):
    """Admin-Notiz zu einer Bestellung speichern"""
    result = await db.orders.update_one(
        {'id': order_id},
        {'$set': {'admin_notes': data.notes}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    return {"message": "Notiz gespeichert"}

# ==================== LOYALTY POINTS SYSTEM ====================

@api_router.get("/admin/loyalty/settings")
async def get_loyalty_settings(admin: dict = Depends(get_current_admin)):
    """Treuepunkte-Einstellungen abrufen"""
    settings = await db.loyalty_settings.find_one({'id': 'loyalty_settings'}, {'_id': 0})
    if not settings:
        # Standardeinstellungen erstellen
        default_settings = LoyaltySettings()
        doc = default_settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.loyalty_settings.insert_one(doc)
        return default_settings.model_dump()
    return settings

@api_router.put("/admin/loyalty/settings")
async def update_loyalty_settings(settings: LoyaltySettings, admin: dict = Depends(get_current_admin)):
    """Treuepunkte-Einstellungen aktualisieren"""
    settings.updated_at = datetime.now(timezone.utc)
    doc = settings.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.loyalty_settings.update_one(
        {'id': 'loyalty_settings'},
        {'$set': doc},
        upsert=True
    )
    return {"message": "Einstellungen gespeichert", "settings": doc}

@api_router.get("/admin/loyalty/customers")
async def get_loyalty_customers(admin: dict = Depends(get_current_admin)):
    """Alle Kunden mit Treuepunkten abrufen"""
    customers = await db.customers.find({}, {'_id': 0, 'password_hash': 0}).to_list(1000)
    
    result = []
    for cust in customers:
        # Punkte-Transaktionen für diesen Kunden
        transactions = await db.loyalty_transactions.find(
            {'customer_id': cust['id']},
            {'_id': 0}
        ).sort('created_at', -1).to_list(100)
        
        # Gesamtpunkte berechnen
        total_points = sum(t.get('points', 0) for t in transactions)
        earned_points = sum(t.get('points', 0) for t in transactions if t.get('points', 0) > 0)
        redeemed_points = abs(sum(t.get('points', 0) for t in transactions if t.get('points', 0) < 0))
        
        result.append({
            **cust,
            'loyalty_points': total_points,
            'earned_points': earned_points,
            'redeemed_points': redeemed_points,
            'transactions_count': len(transactions)
        })
    
    # Nach Punkten sortieren
    result.sort(key=lambda x: x['loyalty_points'], reverse=True)
    return result

@api_router.get("/admin/loyalty/customers/{customer_id}")
async def get_customer_loyalty_details(customer_id: str, admin: dict = Depends(get_current_admin)):
    """Details und Transaktionshistorie eines Kunden"""
    customer = await db.customers.find_one({'id': customer_id}, {'_id': 0, 'password_hash': 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    transactions = await db.loyalty_transactions.find(
        {'customer_id': customer_id},
        {'_id': 0}
    ).sort('created_at', -1).to_list(500)
    
    total_points = sum(t.get('points', 0) for t in transactions)
    
    return {
        "customer": customer,
        "loyalty_points": total_points,
        "transactions": transactions
    }

@api_router.post("/admin/loyalty/customers/{customer_id}/adjust")
async def adjust_customer_points(
    customer_id: str, 
    adjustment: LoyaltyAdjustment,
    admin: dict = Depends(get_current_admin)
):
    """Manuelle Punkte-Anpassung durch Admin"""
    customer = await db.customers.find_one({'id': customer_id}, {'_id': 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    transaction = LoyaltyTransaction(
        customer_id=customer_id,
        customer_email=customer['email'],
        points=adjustment.points,
        type='bonus' if adjustment.points > 0 else 'adjustment',
        reason=adjustment.reason,
        created_by=admin['email']
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.loyalty_transactions.insert_one(doc)
    
    # Neue Gesamtpunkte berechnen
    all_transactions = await db.loyalty_transactions.find(
        {'customer_id': customer_id},
        {'points': 1, '_id': 0}
    ).to_list(1000)
    total_points = sum(t.get('points', 0) for t in all_transactions)
    
    return {
        "message": f"Punkte angepasst: {'+' if adjustment.points > 0 else ''}{adjustment.points}",
        "total_points": total_points,
        "transaction": doc
    }

# Kunden-Endpoint für eigene Punkte
@api_router.get("/customer/loyalty")
async def get_my_loyalty_points(customer: dict = Depends(get_current_customer)):
    """Eigene Treuepunkte abrufen"""
    transactions = await db.loyalty_transactions.find(
        {'customer_id': customer['id']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    
    total_points = sum(t.get('points', 0) for t in transactions)
    
    # Einstellungen für Punktewert
    settings = await db.loyalty_settings.find_one({'id': 'loyalty_settings'}, {'_id': 0})
    points_value = settings.get('points_value_euro', 0.01) if settings else 0.01
    min_redeem = settings.get('min_points_redeem', 100) if settings else 100
    
    return {
        "total_points": total_points,
        "points_value_euro": points_value,
        "euro_value": round(total_points * points_value, 2),
        "min_points_redeem": min_redeem,
        "can_redeem": total_points >= min_redeem,
        "recent_transactions": transactions[:10]
    }

# ==================== FINANCE/ACCOUNTING ====================

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str = "general"
    date: Optional[str] = None

class Expense(ExpenseCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = ""

@api_router.get("/admin/expenses")
async def get_expenses(admin: dict = Depends(get_current_admin)):
    expenses = await db.expenses.find({}, {'_id': 0}).sort('created_at', -1).to_list(100)
    return expenses

@api_router.post("/admin/expenses")
async def create_expense(expense: ExpenseCreate, admin: dict = Depends(get_current_admin)):
    expense_obj = Expense(**expense.model_dump())
    expense_obj.created_by = admin['email']
    
    doc = expense_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.expenses.insert_one(doc)
    return expense_obj

@api_router.delete("/admin/expenses/{expense_id}")
async def delete_expense(expense_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.expenses.delete_one({'id': expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}

@api_router.get("/admin/finance/summary")
async def get_finance_summary(admin: dict = Depends(get_current_admin)):
    # Get all orders revenue
    orders = await db.orders.find({}, {'_id': 0, 'total_amount': 1, 'created_at': 1}).to_list(1000)
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    
    # Get all expenses
    expenses = await db.expenses.find({}, {'_id': 0, 'amount': 1, 'category': 1, 'created_at': 1}).to_list(1000)
    total_expenses = sum(expense.get('amount', 0) for expense in expenses)
    
    # Profit
    profit = total_revenue - total_expenses
    
    # Expenses by category
    expense_categories = {}
    for exp in expenses:
        cat = exp.get('category', 'general')
        expense_categories[cat] = expense_categories.get(cat, 0) + exp.get('amount', 0)
    
    return {
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "profit": profit,
        "expense_categories": expense_categories
    }

# ==================== COUPON/DISCOUNT SYSTEM ====================

@api_router.get("/admin/coupons")
async def get_all_coupons(admin: dict = Depends(get_current_admin)):
    """Alle Gutscheincodes abrufen"""
    coupons = await db.coupons.find({}, {'_id': 0}).sort('created_at', -1).to_list(500)
    return coupons

@api_router.post("/admin/coupons")
async def create_coupon(coupon: CouponBase, admin: dict = Depends(get_current_admin)):
    """Neuen Gutscheincode erstellen"""
    # Prüfen ob Code bereits existiert
    code_upper = coupon.code.upper()
    existing = await db.coupons.find_one({'code': code_upper})
    if existing:
        raise HTTPException(status_code=400, detail="Dieser Code existiert bereits")
    
    new_coupon = Coupon(
        code=code_upper,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        min_order_value=coupon.min_order_value,
        max_uses=coupon.max_uses,
        valid_from=coupon.valid_from,
        valid_until=coupon.valid_until,
        is_active=coupon.is_active,
        description=coupon.description
    )
    doc = new_coupon.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('valid_from'):
        doc['valid_from'] = doc['valid_from'].isoformat()
    if doc.get('valid_until'):
        doc['valid_until'] = doc['valid_until'].isoformat()
    
    await db.coupons.insert_one(doc)
    return {"message": "Gutschein erstellt", "coupon": doc}

@api_router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: CouponBase, admin: dict = Depends(get_current_admin)):
    """Gutscheincode aktualisieren"""
    existing = await db.coupons.find_one({'id': coupon_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Gutschein nicht gefunden")
    
    update_data = coupon.model_dump()
    update_data['code'] = coupon.code.upper()
    if update_data.get('valid_from') and isinstance(update_data['valid_from'], datetime):
        update_data['valid_from'] = update_data['valid_from'].isoformat()
    if update_data.get('valid_until') and isinstance(update_data['valid_until'], datetime):
        update_data['valid_until'] = update_data['valid_until'].isoformat()
    
    await db.coupons.update_one({'id': coupon_id}, {'$set': update_data})
    return {"message": "Gutschein aktualisiert"}

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: dict = Depends(get_current_admin)):
    """Gutscheincode löschen"""
    result = await db.coupons.delete_one({'id': coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gutschein nicht gefunden")
    return {"message": "Gutschein gelöscht"}

@api_router.post("/coupons/validate")
async def validate_coupon(data: CouponValidation):
    """Gutscheincode validieren (öffentlich für Checkout)"""
    code = data.code.upper().strip()
    subtotal = data.subtotal
    
    coupon = await db.coupons.find_one({'code': code, 'is_active': True}, {'_id': 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Ungültiger Gutscheincode")
    
    now = datetime.now(timezone.utc)
    
    # Gültigkeit prüfen - valid_from
    if coupon.get('valid_from'):
        valid_from = coupon['valid_from']
        if isinstance(valid_from, str):
            valid_from = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
        if now < valid_from:
            raise HTTPException(status_code=400, detail="Dieser Gutschein ist noch nicht gültig")
    
    # Gültigkeit prüfen - valid_until
    if coupon.get('valid_until'):
        valid_until = coupon['valid_until']
        if isinstance(valid_until, str):
            valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
        if now > valid_until:
            raise HTTPException(status_code=400, detail="Dieser Gutschein ist abgelaufen")
    
    # Max uses prüfen
    if coupon.get('max_uses') and coupon.get('uses_count', 0) >= coupon['max_uses']:
        raise HTTPException(status_code=400, detail="Dieser Gutschein wurde bereits zu oft verwendet")
    
    # Mindestbestellwert prüfen
    if coupon.get('min_order_value') and subtotal < coupon['min_order_value']:
        raise HTTPException(
            status_code=400, 
            detail=f"Mindestbestellwert von €{coupon['min_order_value']:.2f} nicht erreicht"
        )
    
    # Rabatt berechnen
    if coupon['discount_type'] == 'percent':
        discount_amount = subtotal * (coupon['discount_value'] / 100)
    else:  # fixed
        discount_amount = min(coupon['discount_value'], subtotal)
    
    return {
        "valid": True,
        "code": coupon['code'],
        "discount_type": coupon['discount_type'],
        "discount_value": coupon['discount_value'],
        "discount_amount": round(discount_amount, 2),
        "description": coupon.get('description', '')
    }

async def apply_coupon_to_order(code: str, subtotal: float) -> dict:
    """Gutschein auf Bestellung anwenden und uses_count erhöhen"""
    code = code.upper().strip()
    coupon = await db.coupons.find_one({'code': code, 'is_active': True}, {'_id': 0})
    
    if not coupon:
        return {"valid": False, "discount_amount": 0}
    
    # Validierung wiederholen
    now = datetime.now(timezone.utc)
    
    if coupon.get('valid_from'):
        valid_from = coupon['valid_from']
        if isinstance(valid_from, str):
            valid_from = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
        if now < valid_from:
            return {"valid": False, "discount_amount": 0}
    
    if coupon.get('valid_until'):
        valid_until = coupon['valid_until']
        if isinstance(valid_until, str):
            valid_until = datetime.fromisoformat(valid_until.replace('Z', '+00:00'))
        if now > valid_until:
            return {"valid": False, "discount_amount": 0}
    
    if coupon.get('max_uses') and coupon.get('uses_count', 0) >= coupon['max_uses']:
        return {"valid": False, "discount_amount": 0}
    
    if coupon.get('min_order_value') and subtotal < coupon['min_order_value']:
        return {"valid": False, "discount_amount": 0}
    
    # Rabatt berechnen
    if coupon['discount_type'] == 'percent':
        discount_amount = subtotal * (coupon['discount_value'] / 100)
    else:
        discount_amount = min(coupon['discount_value'], subtotal)
    
    # Uses count erhöhen
    await db.coupons.update_one({'code': code}, {'$inc': {'uses_count': 1}})
    
    return {
        "valid": True,
        "code": code,
        "discount_amount": round(discount_amount, 2),
        "discount_type": coupon['discount_type'],
        "discount_value": coupon['discount_value']
    }

# ==================== NEWSLETTER ====================

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe, background_tasks: BackgroundTasks):
    """Öffentlicher Endpunkt für Newsletter-Anmeldung"""
    from email_service import send_newsletter_welcome
    
    email = data.email.lower().strip()
    source = data.source or "website"
    
    # Prüfen ob E-Mail bereits existiert
    existing = await db.newsletter_subscribers.find_one({'email': email})
    if existing:
        if existing.get('is_active'):
            raise HTTPException(
                status_code=400, 
                detail="Diese E-Mail-Adresse ist bereits für den Newsletter angemeldet."
            )
        else:
            # Reaktivieren
            await db.newsletter_subscribers.update_one(
                {'email': email},
                {'$set': {'is_active': True, 'unsubscribed_at': None, 'source': source}}
            )
            # Willkommens-E-Mail senden
            background_tasks.add_task(send_newsletter_welcome, email, 'de')
            return {"message": "Willkommen zurück! Sie erhalten wieder unseren Newsletter."}
    
    # Neu anlegen
    subscriber = NewsletterSubscriber(email=email, source=source)
    doc = subscriber.model_dump()
    doc['subscribed_at'] = doc['subscribed_at'].isoformat()
    await db.newsletter_subscribers.insert_one(doc)
    
    # Willkommens-E-Mail senden
    background_tasks.add_task(send_newsletter_welcome, email, 'de')
    
    # Admin-Benachrichtigung: Newsletter-Anmeldung
    try:
        await notify_newsletter_signup(email, source)
    except Exception as e:
        logging.error(f"Failed to send newsletter signup notification: {str(e)}")
    
    return {"message": "Vielen Dank! Sie wurden erfolgreich für den Newsletter angemeldet."}

@api_router.post("/newsletter/unsubscribe")
async def unsubscribe_newsletter(data: NewsletterSubscribe):
    """Öffentlicher Endpunkt für Newsletter-Abmeldung"""
    email = data.email.lower().strip()
    
    result = await db.newsletter_subscribers.update_one(
        {'email': email},
        {'$set': {'is_active': False, 'unsubscribed_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Sie wurden erfolgreich vom Newsletter abgemeldet."}

class NewsletterUnsubscribeRequest(BaseModel):
    email: str
    token: str

@api_router.get("/newsletter/unsubscribe")
async def unsubscribe_newsletter_get(email: str, token: str):
    """Öffentlicher Endpunkt für Newsletter-Abmeldung via Link (GET)"""
    from email_service import verify_unsubscribe_token
    
    email = email.lower().strip()
    
    # Token verifizieren
    if not verify_unsubscribe_token(email, token):
        raise HTTPException(status_code=400, detail="Ungültiger Abmelde-Link")
    
    # Abmelden
    result = await db.newsletter_subscribers.update_one(
        {'email': email},
        {'$set': {'is_active': False, 'unsubscribed_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="E-Mail nicht gefunden")
    
    return {"message": "Sie wurden erfolgreich vom Newsletter abgemeldet.", "email": email}

@api_router.get("/admin/newsletter/subscribers")
async def get_newsletter_subscribers(admin: dict = Depends(get_current_admin)):
    """Admin: Alle Newsletter-Abonnenten abrufen"""
    subscribers = await db.newsletter_subscribers.find({}, {'_id': 0}).sort('subscribed_at', -1).to_list(1000)
    
    # Statistiken
    total = len(subscribers)
    active = len([s for s in subscribers if s.get('is_active')])
    
    return {
        "subscribers": subscribers,
        "stats": {
            "total": total,
            "active": active,
            "inactive": total - active
        }
    }

@api_router.delete("/admin/newsletter/subscribers/{subscriber_id}")
async def delete_newsletter_subscriber(subscriber_id: str, admin: dict = Depends(get_current_admin)):
    """Admin: Newsletter-Abonnent löschen"""
    result = await db.newsletter_subscribers.delete_one({'id': subscriber_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"message": "Subscriber deleted"}

@api_router.post("/admin/newsletter/send-launch-notification")
async def send_launch_notification(admin: dict = Depends(get_current_admin)):
    """Admin: 'Wir sind live' Benachrichtigung an alle Newsletter-Abonnenten senden"""
    from email_service import send_newsletter_to_subscriber, FRONTEND_URL
    import os
    
    # Get all active subscribers
    subscribers = await db.newsletter_subscribers.find({'is_active': True}, {'email': 1, '_id': 0}).to_list(10000)
    
    if not subscribers:
        return {"message": "Keine aktiven Abonnenten gefunden", "sent_count": 0}
    
    frontend_url = os.environ.get('FRONTEND_URL', FRONTEND_URL)
    
    # Email content - German (ohne Abmelde-Link, der wird automatisch hinzugefügt)
    content_de = f'''
        <div style="text-align: center; padding: 20px 0;">
            <p style="font-size: 14px; letter-spacing: 3px; color: #8B2E2E; text-transform: uppercase; margin-bottom: 20px;">
                🎉 GROSSARTIGE NEUIGKEITEN 🎉
            </p>
            <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; color: #2D2A26; margin: 0 0 20px;">
                Wir sind jetzt <em style="color: #8B2E2E;">online!</em>
            </h1>
        </div>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
            Liebe Freundin, lieber Freund unseres Hauses,
        </p>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
            Das Warten hat ein Ende! Unser neuer Online-Shop ist ab sofort verfügbar. 
            Entdecken Sie unsere exquisiten Wachauer Marillenprodukte – von Premium-Likören 
            über handgemachte Edelbrände bis hin zu feinsten Marmeladen.
        </p>
        <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.7; color: #5C5852;">
            Als Dankeschön für Ihre Geduld haben wir etwas Besonderes für Sie vorbereitet. 
            Besuchen Sie uns jetzt und lassen Sie sich von der Qualität überzeugen!
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{frontend_url}/shop" 
               style="display: inline-block; background-color: #8B2E2E; color: white; 
                      padding: 14px 32px; text-decoration: none; font-weight: 600; 
                      letter-spacing: 1px; text-transform: uppercase; font-size: 13px;">
                Jetzt entdecken →
            </a>
        </div>
        <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
            Herzliche Grüße aus Dürnstein,<br>
            <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">
                Hermann & Nicholas Böhmer
            </span>
        </p>
    '''
    
    subject = "🍑 Hermann Böhmer ist jetzt online!"
    
    sent_count = 0
    failed_emails = []
    
    for subscriber in subscribers:
        email = subscriber['email']
        try:
            # Newsletter-E-Mail mit Abmelde-Link senden
            success = await send_newsletter_to_subscriber(email, subject, content_de, 'de')
            if success:
                sent_count += 1
            else:
                failed_emails.append(email)
        except Exception as e:
            failed_emails.append(email)
    
    # Log the notification
    notification_log = {
        "id": str(uuid.uuid4()),
        "type": "launch_notification",
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "total_subscribers": len(subscribers),
        "sent_count": sent_count,
        "failed_count": len(failed_emails),
        "sent_by": admin.get('email', 'admin')
    }
    await db.notification_logs.insert_one(notification_log)
    
    return {
        "message": f"Launch-Benachrichtigung gesendet",
        "total_subscribers": len(subscribers),
        "sent_count": sent_count,
        "failed_count": len(failed_emails),
        "failed_emails": failed_emails[:10] if failed_emails else []  # Only return first 10
    }

# ==================== ADMIN EMAIL SYSTEM ====================

@api_router.post("/admin/email/send")
async def send_admin_email(email_data: AdminEmailSend, background_tasks: BackgroundTasks, admin: dict = Depends(get_current_admin)):
    """Admin: E-Mail an Kunden senden"""
    from email_service import send_email, get_base_template, SENDER_NAME
    import os
    
    # Verwende CONTACT_EMAIL wenn verfügbar, sonst SMTP_USER
    contact_email = os.environ.get('CONTACT_EMAIL', os.environ.get('SMTP_USER', ''))
    contact_name = os.environ.get('CONTACT_EMAIL_NAME', SENDER_NAME)
    
    # E-Mail-Inhalt mit Template
    content = f'''
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
            {email_data.message.replace(chr(10), '<br>')}
        </p>
        <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
            Mit freundlichen Grüßen,<br>
            <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">{contact_name}</span>
        </p>
    '''
    
    html = get_base_template(content, 'de')
    
    # E-Mail senden
    success = await send_email(email_data.to_email, email_data.subject, html)
    
    if success:
        # In Datenbank speichern
        email_record = AdminEmailMessage(
            from_email=contact_email,
            to_email=email_data.to_email,
            subject=email_data.subject,
            body=email_data.message,
            is_incoming=False,
            is_read=True,
            order_id=email_data.order_id
        )
        doc = email_record.model_dump()
        doc['received_at'] = doc['received_at'].isoformat()
        await db.admin_emails.insert_one(doc)
        
        return {"message": "E-Mail erfolgreich gesendet", "id": email_record.id}
    else:
        raise HTTPException(status_code=500, detail="E-Mail konnte nicht gesendet werden. Bitte SMTP-Einstellungen prüfen.")

@api_router.get("/admin/email/inbox")
async def get_admin_inbox(admin: dict = Depends(get_current_admin)):
    """Admin: Posteingang abrufen (gesendete und ggf. empfangene E-Mails)"""
    emails = await db.admin_emails.find({}, {'_id': 0}).sort('received_at', -1).to_list(500)
    
    # Ungelesene zählen
    unread_count = len([e for e in emails if not e.get('is_read') and e.get('is_incoming')])
    
    return {
        "emails": emails,
        "unread_count": unread_count
    }

@api_router.get("/admin/email/{email_id}")
async def get_admin_email(email_id: str, admin: dict = Depends(get_current_admin)):
    """Admin: Einzelne E-Mail abrufen"""
    email = await db.admin_emails.find_one({'id': email_id}, {'_id': 0})
    if not email:
        raise HTTPException(status_code=404, detail="E-Mail nicht gefunden")
    
    # Als gelesen markieren
    await db.admin_emails.update_one({'id': email_id}, {'$set': {'is_read': True}})
    
    return email

@api_router.delete("/admin/email/{email_id}")
async def delete_admin_email(email_id: str, admin: dict = Depends(get_current_admin)):
    """Admin: E-Mail löschen"""
    result = await db.admin_emails.delete_one({'id': email_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="E-Mail nicht gefunden")
    return {"message": "E-Mail gelöscht"}

@api_router.get("/admin/email/customer/{customer_email}")
async def get_emails_for_customer(customer_email: str, admin: dict = Depends(get_current_admin)):
    """Admin: Alle E-Mails mit einem bestimmten Kunden"""
    emails = await db.admin_emails.find({
        '$or': [
            {'to_email': customer_email},
            {'from_email': customer_email}
        ]
    }, {'_id': 0}).sort('received_at', -1).to_list(100)
    
    return emails

# ==================== CUSTOMER NEWSLETTER STATUS ====================

@api_router.get("/admin/customers/{customer_id}/newsletter")
async def get_customer_newsletter_status(customer_id: str, admin: dict = Depends(get_current_admin)):
    """Admin: Newsletter-Status eines Kunden prüfen"""
    customer = await db.customers.find_one({'id': customer_id}, {'_id': 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    
    subscriber = await db.newsletter_subscribers.find_one({'email': customer['email']}, {'_id': 0})
    
    return {
        "email": customer['email'],
        "is_subscribed": subscriber is not None and subscriber.get('is_active', False),
        "subscription_details": subscriber
    }

# ==================== CONTACT FORM ====================

class ContactFormData(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/contact")
async def submit_contact_form(data: ContactFormData, background_tasks: BackgroundTasks):
    """Öffentlicher Endpunkt für Kontaktformular"""
    
    # Speichern in Datenbank
    contact = ContactMessage(
        name=data.name,
        email=data.email.lower(),
        phone=data.phone,
        subject=data.subject,
        message=data.message
    )
    
    doc = contact.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_messages.insert_one(doc)
    
    # Benachrichtigung an Admin senden (Background Task)
    try:
        from email_service import send_email, get_base_template
        
        admin_notification_content = f'''
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                <strong>Neue Kontaktanfrage erhalten:</strong>
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #969088; width: 120px;">Name:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #2D2A26;">{data.name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #969088;">E-Mail:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #2D2A26;"><a href="mailto:{data.email}" style="color: #8B2E2E;">{data.email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #969088;">Telefon:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #2D2A26;">{data.phone or '-'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #969088;">Betreff:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #E5E0D8; color: #2D2A26;">{data.subject or '-'}</td>
                </tr>
            </table>
            <p style="margin: 20px 0 10px; font-size: 15px; color: #969088;">Nachricht:</p>
            <div style="padding: 20px; background: #F9F8F6; border-left: 3px solid #8B2E2E;">
                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #2D2A26; white-space: pre-wrap;">{data.message}</p>
            </div>
        '''
        
        html = get_base_template(admin_notification_content, 'de')
        
        # An Admin-Email senden
        import os
        admin_email = os.environ.get('ADMIN_EMAIL', os.environ.get('SMTP_USER', ''))
        if admin_email:
            background_tasks.add_task(send_email, admin_email, f"Neue Kontaktanfrage: {data.subject or 'Allgemeine Anfrage'}", html)
    except Exception as e:
        logging.error(f"Failed to send contact notification: {str(e)}")
    
    # Admin-Benachrichtigung via Telegram + E-Mail (Notification Service)
    try:
        await notify_contact_form(data.name, data.email, data.subject or '', data.message)
    except Exception as e:
        logging.error(f"Failed to send contact form notification: {str(e)}")
    
    return {"message": "Vielen Dank für Ihre Nachricht! Wir werden uns so schnell wie möglich bei Ihnen melden."}

@api_router.get("/admin/contact-messages")
async def get_contact_messages(admin: dict = Depends(get_current_admin)):
    """Admin: Alle Kontaktanfragen abrufen"""
    messages = await db.contact_messages.find({}, {'_id': 0}).sort('created_at', -1).to_list(500)
    unread_count = len([m for m in messages if not m.get('is_read')])
    
    return {
        "messages": messages,
        "unread_count": unread_count
    }

@api_router.put("/admin/contact-messages/{message_id}/read")
async def mark_contact_message_read(message_id: str, admin: dict = Depends(get_current_admin)):
    """Admin: Kontaktanfrage als gelesen markieren"""
    result = await db.contact_messages.update_one({'id': message_id}, {'$set': {'is_read': True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden")
    return {"message": "Als gelesen markiert"}

@api_router.delete("/admin/contact-messages/{message_id}")
async def delete_contact_message(message_id: str, admin: dict = Depends(get_current_admin)):
    """Admin: Kontaktanfrage löschen"""
    result = await db.contact_messages.delete_one({'id': message_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden")
    return {"message": "Gelöscht"}

# ==================== MAIN APP CONFIG ====================

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
