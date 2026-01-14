"""
PostgreSQL Database Configuration and Models for Hermann Böhmer Shop
Migration from MongoDB to PostgreSQL with SQLAlchemy async
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from contextlib import asynccontextmanager

from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey,
    create_engine, Index, Enum as SQLEnum, text
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql+asyncpg://boehmer_admin:Wachau2024!Secure@localhost:5432/hermann_boehmer_shop')

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for debugging SQL queries
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Session factory
async_session = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Base class for all models
class Base(DeclarativeBase):
    pass


def generate_uuid():
    return str(uuid.uuid4())


# ==================== DATABASE MODELS ====================

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    name_de = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    description_de = Column(Text, nullable=False)
    description_en = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    image_url = Column(String(512), nullable=False)
    category = Column(String(50), nullable=False, default='likoer', index=True)
    stock = Column(Integer, nullable=False, default=100)
    is_featured = Column(Boolean, default=False)
    is_limited = Column(Boolean, default=False)
    is_18_plus = Column(Boolean, default=False)
    alcohol_content = Column(Float, nullable=True)
    volume_ml = Column(Integer, default=500)
    weight_g = Column(Integer, nullable=True)
    tags = Column(JSON, default=list)
    sold_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Admin(Base):
    __tablename__ = 'admins'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Customer(Base):
    __tablename__ = 'customers'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    
    # Shipping address
    default_address = Column(String(255), nullable=True)
    default_city = Column(String(100), nullable=True)
    default_postal = Column(String(20), nullable=True)
    default_country = Column(String(100), default='Österreich')
    
    # Billing address
    billing_address = Column(String(255), nullable=True)
    billing_city = Column(String(100), nullable=True)
    billing_postal = Column(String(20), nullable=True)
    billing_country = Column(String(100), nullable=True)
    billing_same_as_shipping = Column(Boolean, default=True)
    
    # Other
    cart_items = Column(JSON, default=list)
    newsletter_subscribed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)


class Order(Base):
    __tablename__ = 'orders'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tracking_number = Column(String(50), unique=True, nullable=False, index=True)
    invoice_number = Column(String(50), unique=True, nullable=True, index=True)
    
    # Customer info
    customer_id = Column(String(36), ForeignKey('customers.id'), nullable=True, index=True)
    customer_name = Column(String(200), nullable=False)
    customer_email = Column(String(255), nullable=False, index=True)
    customer_phone = Column(String(50), nullable=False)
    
    # Shipping address
    shipping_address = Column(String(255), nullable=False)
    shipping_city = Column(String(100), nullable=False)
    shipping_postal = Column(String(20), nullable=False)
    shipping_country = Column(String(100), default='Österreich')
    
    # Order details
    items = Column(JSON, nullable=False)  # List of CartItem dicts
    item_details = Column(JSON, default=list)  # Detailed product info at time of order
    notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), default='pending', index=True)  # pending, paid, processing, shipped, delivered, cancelled
    payment_status = Column(String(20), default='unpaid', index=True)  # unpaid, pending, paid, failed
    is_new = Column(Boolean, default=True)
    
    # Payment
    stripe_session_id = Column(String(255), nullable=True, index=True)
    
    # Amounts
    subtotal = Column(Float, default=0)
    shipping_cost = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    
    # Coupon
    coupon_code = Column(String(50), nullable=True)
    coupon_details = Column(JSON, nullable=True)
    
    # Carrier tracking
    carrier = Column(String(50), nullable=True)
    carrier_code = Column(String(50), nullable=True)
    carrier_tracking_number = Column(String(100), nullable=True)
    carrier_tracking_url = Column(String(512), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    customer = relationship("Customer", backref="orders")


class PaymentTransaction(Base):
    __tablename__ = 'payment_transactions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey('orders.id'), nullable=False, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default='eur')
    payment_status = Column(String(20), default='pending')
    payment_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ShippingRate(Base):
    __tablename__ = 'shipping_rates'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    country = Column(String(100), unique=True, nullable=False, index=True)
    rate = Column(Float, nullable=False)
    free_shipping_threshold = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Testimonial(Base):
    __tablename__ = 'testimonials'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    text_de = Column(Text, nullable=False)
    text_en = Column(Text, nullable=False)
    rating = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class NewsletterSubscriber(Base):
    __tablename__ = 'newsletter_subscribers'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    source = Column(String(50), default='website')
    subscribed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)


class Coupon(Base):
    __tablename__ = 'coupons'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(String(20), nullable=False)  # 'percent' or 'fixed'
    discount_value = Column(Float, nullable=False)
    min_order_value = Column(Float, nullable=True)
    max_uses = Column(Integer, nullable=True)
    uses_count = Column(Integer, default=0)
    valid_from = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class LoyaltySettings(Base):
    __tablename__ = 'loyalty_settings'
    
    id = Column(String(36), primary_key=True, default='loyalty_settings')
    points_per_euro = Column(Float, default=1.0)
    points_value_euro = Column(Float, default=0.01)
    min_points_redeem = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class LoyaltyTransaction(Base):
    __tablename__ = 'loyalty_transactions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey('customers.id'), nullable=False, index=True)
    customer_email = Column(String(255), nullable=False)
    points = Column(Integer, nullable=False)
    type = Column(String(20), nullable=False)  # 'earned', 'redeemed', 'bonus', 'adjustment', 'expired'
    reason = Column(Text, nullable=False)
    order_id = Column(String(36), nullable=True)
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PasswordResetToken(Base):
    __tablename__ = 'password_reset_tokens'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey('customers.id'), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ContactMessage(Base):
    __tablename__ = 'contact_messages'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Expense(Base):
    __tablename__ = 'expenses'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AdminEmail(Base):
    __tablename__ = 'admin_emails'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    from_email = Column(String(255), nullable=False)
    to_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    is_incoming = Column(Boolean, default=True)
    is_read = Column(Boolean, default=False)
    order_id = Column(String(36), nullable=True)
    customer_id = Column(String(36), nullable=True)
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ProductView(Base):
    __tablename__ = 'product_views'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey('products.id'), nullable=False, index=True)
    customer_id = Column(String(36), nullable=True)
    session_id = Column(String(255), nullable=True)
    viewed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class NotificationLog(Base):
    __tablename__ = 'notification_logs'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    type = Column(String(50), nullable=False)
    recipient = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default='sent')
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PendingCheckoutSession(Base):
    __tablename__ = 'pending_checkout_sessions'

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_token = Column(String(64), unique=True, nullable=False, index=True)

    customer_id = Column(String(36), nullable=True)
    customer_name = Column(String(200), nullable=False)
    customer_email = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=True)

    shipping_address = Column(String(255), nullable=False)
    shipping_city = Column(String(100), nullable=False)
    shipping_postal = Column(String(20), nullable=False)
    shipping_country = Column(String(100), default='Österreich')

    items = Column(JSON, nullable=False)
    item_details = Column(JSON, default=list)
    notes = Column(Text, nullable=True)

    subtotal = Column(Float, nullable=False)
    shipping_cost = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)

    coupon_code = Column(String(50), nullable=True)
    coupon_details = Column(JSON, nullable=True)

    status = Column(String(20), default='pending')
    is_demo = Column(Boolean, default=False)
    stripe_session_id = Column(String(255), nullable=True)

    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)


# ==================== DATABASE HELPERS ====================

async def init_db():
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Add invoice_number column if it doesn't exist (migration for existing databases)
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'orders' AND column_name = 'invoice_number'
                ) THEN
                    ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(50) UNIQUE;
                    CREATE INDEX IF NOT EXISTS ix_orders_invoice_number ON orders(invoice_number);
                END IF;
            END $$;
        """))
    print("✅ Database tables created successfully!")


async def drop_db():
    """Drop all tables - USE WITH CAUTION"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("⚠️ All database tables dropped!")


@asynccontextmanager
async def get_db():
    """Get database session context manager"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_session() -> AsyncSession:
    """Get database session for dependency injection"""
    async with async_session() as session:
        yield session


# Test connection
async def test_connection():
    """Test database connection"""
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        print("✅ PostgreSQL connection successful!")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False
