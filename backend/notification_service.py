"""
Hermann Böhmer - Notification Service
Telegram + E-Mail Benachrichtigungen für Admin-Events
"""

import os
import asyncio
import aiohttp
import logging
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr

logger = logging.getLogger(__name__)

# ==================== KONFIGURATION ====================

# Telegram
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHANNEL_ID = os.environ.get('TELEGRAM_CHANNEL_ID', '')

# E-Mail
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.hostinger.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', os.environ.get('SMTP_USER', ''))
ADMIN_EMAIL_PASSWORD = os.environ.get('ADMIN_EMAIL_PASSWORD', os.environ.get('SMTP_PASSWORD', ''))
NOTIFICATION_RECIPIENTS = [e.strip() for e in os.environ.get('NOTIFICATION_RECIPIENTS', '').split(',') if e.strip()]

# Schalter
NOTIFY_NEW_ORDER = os.environ.get('NOTIFY_NEW_ORDER', 'true').lower() == 'true'
NOTIFY_LOW_STOCK = os.environ.get('NOTIFY_LOW_STOCK', 'true').lower() == 'true'
NOTIFY_CONTACT_FORM = os.environ.get('NOTIFY_CONTACT_FORM', 'true').lower() == 'true'
NOTIFY_NEW_CUSTOMER = os.environ.get('NOTIFY_NEW_CUSTOMER', 'true').lower() == 'true'
NOTIFY_NEWSLETTER_SIGNUP = os.environ.get('NOTIFY_NEWSLETTER_SIGNUP', 'true').lower() == 'true'
NOTIFY_OUT_OF_STOCK = os.environ.get('NOTIFY_OUT_OF_STOCK', 'true').lower() == 'true'
NOTIFY_COUPON_USED = os.environ.get('NOTIFY_COUPON_USED', 'true').lower() == 'true'
NOTIFY_DAILY_SUMMARY = os.environ.get('NOTIFY_DAILY_SUMMARY', 'true').lower() == 'true'

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://hermann-boehmer.com')

logger.info(f"Notification Service initialized")
logger.info(f"Telegram: {'configured' if TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID else 'NOT configured'}")
logger.info(f"Email recipients: {len(NOTIFICATION_RECIPIENTS)}")


# ==================== TELEGRAM ====================

async def send_telegram(message: str) -> bool:
    """Sendet Nachricht an Telegram Channel"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHANNEL_ID:
        logger.warning("Telegram not configured - skipping")
        return False
    
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHANNEL_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=10) as response:
                if response.status == 200:
                    logger.info("Telegram message sent successfully")
                    return True
                else:
                    error = await response.text()
                    logger.error(f"Telegram API error: {response.status} - {error}")
                    return False
    except Exception as e:
        logger.error(f"Telegram send failed: {str(e)}")
        return False


# ==================== ADMIN E-MAIL ====================

def get_admin_email_template(title: str, content: str, accent_color: str = "#8B2E2E") -> str:
    """HTML Template für Admin-Benachrichtigungen"""
    return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9F8F6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F8F6;">
        <tr>
            <td align="center" style="padding: 30px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E5E0D8;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 25px 30px; background-color: {accent_color}; text-align: center;">
                            <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 600;">
                                🍑 Hermann Böhmer Admin
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                        <td style="padding: 25px 30px 15px; border-bottom: 1px solid #E5E0D8;">
                            <h2 style="margin: 0; color: #2D2A26; font-size: 18px; font-weight: 600;">
                                {title}
                            </h2>
                            <p style="margin: 5px 0 0; color: #969088; font-size: 12px;">
                                {datetime.now().strftime('%d.%m.%Y um %H:%M Uhr')}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 25px 30px;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #F9F8F6; border-top: 1px solid #E5E0D8; text-align: center;">
                            <p style="margin: 0; color: #969088; font-size: 11px;">
                                Diese E-Mail wurde automatisch vom Hermann Böhmer Shop-System gesendet.
                            </p>
                            <p style="margin: 5px 0 0;">
                                <a href="{FRONTEND_URL}/admin" style="color: {accent_color}; font-size: 12px; text-decoration: none;">
                                    → Zum Admin-Dashboard
                                </a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''


async def send_admin_email(subject: str, html_content: str) -> bool:
    """Sendet E-Mail an alle Benachrichtigungs-Empfänger"""
    if not NOTIFICATION_RECIPIENTS:
        logger.warning("No notification recipients configured - skipping email")
        return False
    
    if not ADMIN_EMAIL or not ADMIN_EMAIL_PASSWORD:
        logger.warning("Admin email not configured - skipping")
        return False
    
    success_count = 0
    
    for recipient in NOTIFICATION_RECIPIENTS:
        try:
            message = MIMEMultipart('alternative')
            message['Subject'] = f"[Hermann Böhmer] {subject}"
            message['From'] = formataddr((str(Header('Hermann Böhmer Admin', 'utf-8')), ADMIN_EMAIL))
            message['To'] = recipient
            
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)
            
            if SMTP_USE_TLS:
                await aiosmtplib.send(
                    message,
                    hostname=SMTP_HOST,
                    port=SMTP_PORT,
                    username=ADMIN_EMAIL,
                    password=ADMIN_EMAIL_PASSWORD,
                    use_tls=True
                )
            else:
                await aiosmtplib.send(
                    message,
                    hostname=SMTP_HOST,
                    port=SMTP_PORT,
                    username=ADMIN_EMAIL,
                    password=ADMIN_EMAIL_PASSWORD,
                    start_tls=True
                )
            
            logger.info(f"Admin email sent to {recipient}")
            success_count += 1
            
        except Exception as e:
            logger.error(f"Failed to send admin email to {recipient}: {str(e)}")
    
    return success_count > 0


async def notify(telegram_message: str, email_subject: str, email_content: str, accent_color: str = "#8B2E2E"):
    """Sendet Benachrichtigung via Telegram UND E-Mail"""
    # Telegram
    telegram_task = send_telegram(telegram_message)
    
    # E-Mail
    html = get_admin_email_template(email_subject, email_content, accent_color)
    email_task = send_admin_email(email_subject, html)
    
    # Beide parallel ausführen
    await asyncio.gather(telegram_task, email_task, return_exceptions=True)


# ==================== BENACHRICHTIGUNGS-FUNKTIONEN ====================

async def notify_new_order(order: dict):
    """Benachrichtigung: Neue Bestellung"""
    if not NOTIFY_NEW_ORDER:
        return
    
    tracking = order.get('tracking_number', order.get('id', '')[:8])
    customer = order.get('customer_name', 'Unbekannt')
    email = order.get('customer_email', '')
    total = order.get('total_amount', 0)
    items = order.get('item_details', [])
    address = f"{order.get('shipping_address', '')}, {order.get('shipping_postal', '')} {order.get('shipping_city', '')}"
    country = order.get('shipping_country', 'Österreich')
    
    # Produkte als Liste
    product_list = "\n".join([f"  • {item.get('name_de', 'Produkt')} x{item.get('quantity', 1)}" for item in items])
    
    # Telegram
    telegram_msg = f"""🛒 <b>NEUE BESTELLUNG</b>

<b>Bestellnr:</b> {tracking}
<b>Kunde:</b> {customer}
<b>E-Mail:</b> {email}

<b>Produkte:</b>
{product_list}

<b>Summe:</b> €{total:.2f}

<b>Versand an:</b>
{address}
{country}"""

    # E-Mail Content
    items_html = "".join([f'<tr><td style="padding: 8px 0; border-bottom: 1px solid #E5E0D8;">{item.get("name_de", "Produkt")}</td><td style="padding: 8px 0; border-bottom: 1px solid #E5E0D8; text-align: center;">{item.get("quantity", 1)}</td><td style="padding: 8px 0; border-bottom: 1px solid #E5E0D8; text-align: right;">€{item.get("price", 0):.2f}</td></tr>' for item in items])
    
    email_content = f'''
        <table style="width: 100%; margin-bottom: 20px;">
            <tr>
                <td style="padding: 10px; background-color: #F9F8F6;">
                    <strong>Bestellnummer:</strong> {tracking}
                </td>
            </tr>
        </table>
        
        <h3 style="color: #2D2A26; font-size: 14px; margin: 0 0 10px;">Kunde</h3>
        <p style="margin: 0 0 5px; color: #5C5852;">{customer}</p>
        <p style="margin: 0 0 15px; color: #5C5852;">{email}</p>
        
        <h3 style="color: #2D2A26; font-size: 14px; margin: 0 0 10px;">Produkte</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr style="background-color: #F9F8F6;">
                <th style="padding: 8px; text-align: left; font-size: 12px;">Artikel</th>
                <th style="padding: 8px; text-align: center; font-size: 12px;">Menge</th>
                <th style="padding: 8px; text-align: right; font-size: 12px;">Preis</th>
            </tr>
            {items_html}
        </table>
        
        <table style="width: 100%; margin-bottom: 15px;">
            <tr>
                <td style="text-align: right; padding: 5px 0;"><strong>Zwischensumme:</strong></td>
                <td style="text-align: right; padding: 5px 0; width: 100px;">€{order.get("subtotal", 0):.2f}</td>
            </tr>
            <tr>
                <td style="text-align: right; padding: 5px 0;"><strong>Versand:</strong></td>
                <td style="text-align: right; padding: 5px 0;">€{order.get("shipping_cost", 0):.2f}</td>
            </tr>
            {"<tr><td style='text-align: right; padding: 5px 0;'><strong>Rabatt:</strong></td><td style='text-align: right; padding: 5px 0; color: #22c55e;'>-€" + f"{order.get('discount_amount', 0):.2f}</td></tr>" if order.get('discount_amount', 0) > 0 else ""}
            <tr style="font-size: 16px; color: #8B2E2E;">
                <td style="text-align: right; padding: 10px 0; border-top: 2px solid #8B2E2E;"><strong>GESAMT:</strong></td>
                <td style="text-align: right; padding: 10px 0; border-top: 2px solid #8B2E2E;"><strong>€{total:.2f}</strong></td>
            </tr>
        </table>
        
        <h3 style="color: #2D2A26; font-size: 14px; margin: 0 0 10px;">Lieferadresse</h3>
        <p style="margin: 0; color: #5C5852;">
            {address}<br>
            {country}
        </p>
    '''
    
    await notify(telegram_msg, "🛒 Neue Bestellung eingegangen", email_content, "#8B2E2E")


async def notify_low_stock(product: dict):
    """Benachrichtigung: Niedriger Lagerbestand"""
    if not NOTIFY_LOW_STOCK:
        return
    
    name = product.get('name_de', 'Unbekanntes Produkt')
    stock = product.get('stock', 0)
    
    telegram_msg = f"""⚠️ <b>NIEDRIGER LAGERBESTAND</b>

<b>Produkt:</b> {name}
<b>Bestand:</b> nur noch {stock} Stück

Bitte nachbestellen!"""

    email_content = f'''
        <div style="padding: 20px; background-color: #FEF3C7; border-left: 4px solid #F59E0B;">
            <p style="margin: 0 0 10px; font-size: 16px; color: #92400E;">
                <strong>⚠️ Warnung: Niedriger Lagerbestand</strong>
            </p>
            <p style="margin: 0; color: #78350F;">
                <strong>{name}</strong><br>
                Nur noch <strong>{stock} Stück</strong> auf Lager
            </p>
        </div>
        <p style="margin: 20px 0 0; color: #5C5852;">
            Bitte bestelle dieses Produkt zeitnah nach, um Lieferengpässe zu vermeiden.
        </p>
    '''
    
    await notify(telegram_msg, "⚠️ Niedriger Lagerbestand", email_content, "#F59E0B")


async def notify_out_of_stock(product: dict):
    """Benachrichtigung: Produkt ausverkauft"""
    if not NOTIFY_OUT_OF_STOCK:
        return
    
    name = product.get('name_de', 'Unbekanntes Produkt')
    
    telegram_msg = f"""🚨 <b>PRODUKT AUSVERKAUFT!</b>

<b>Produkt:</b> {name}
<b>Bestand:</b> 0 Stück

DRINGEND nachbestellen!"""

    email_content = f'''
        <div style="padding: 20px; background-color: #FEE2E2; border-left: 4px solid #EF4444;">
            <p style="margin: 0 0 10px; font-size: 16px; color: #991B1B;">
                <strong>🚨 ALARM: Produkt ausverkauft!</strong>
            </p>
            <p style="margin: 0; color: #7F1D1D;">
                <strong>{name}</strong><br>
                ist komplett ausverkauft (0 Stück)
            </p>
        </div>
        <p style="margin: 20px 0 0; color: #5C5852;">
            <strong>Dringend:</strong> Dieses Produkt kann nicht mehr bestellt werden. Bitte sofort nachbestellen!
        </p>
    '''
    
    await notify(telegram_msg, "🚨 Produkt ausverkauft!", email_content, "#EF4444")


async def notify_contact_form(name: str, email: str, subject: str, message: str):
    """Benachrichtigung: Neue Kontaktanfrage"""
    if not NOTIFY_CONTACT_FORM:
        return
    
    telegram_msg = f"""📧 <b>NEUE KONTAKTANFRAGE</b>

<b>Von:</b> {name}
<b>E-Mail:</b> {email}
<b>Betreff:</b> {subject or 'Kein Betreff'}

<b>Nachricht:</b>
{message[:500]}{'...' if len(message) > 500 else ''}"""

    email_content = f'''
        <table style="width: 100%; margin-bottom: 20px; background-color: #F9F8F6;">
            <tr>
                <td style="padding: 15px;">
                    <strong>Von:</strong> {name}<br>
                    <strong>E-Mail:</strong> <a href="mailto:{email}" style="color: #8B2E2E;">{email}</a><br>
                    <strong>Betreff:</strong> {subject or 'Kein Betreff'}
                </td>
            </tr>
        </table>
        
        <h3 style="color: #2D2A26; font-size: 14px; margin: 0 0 10px;">Nachricht</h3>
        <div style="padding: 15px; background-color: #FFFFFF; border: 1px solid #E5E0D8;">
            <p style="margin: 0; color: #5C5852; white-space: pre-wrap;">{message}</p>
        </div>
        
        <p style="margin: 20px 0 0;">
            <a href="mailto:{email}?subject=Re: {subject}" style="display: inline-block; padding: 10px 20px; background-color: #8B2E2E; color: white; text-decoration: none;">
                → Antworten
            </a>
        </p>
    '''
    
    await notify(telegram_msg, "📧 Neue Kontaktanfrage", email_content, "#8B2E2E")


async def notify_new_customer(customer: dict):
    """Benachrichtigung: Neuer Kunde registriert"""
    if not NOTIFY_NEW_CUSTOMER:
        return
    
    name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}"
    email = customer.get('email', '')
    
    telegram_msg = f"""👤 <b>NEUER KUNDE</b>

<b>Name:</b> {name}
<b>E-Mail:</b> {email}

Ein neuer Kunde hat sich registriert!"""

    email_content = f'''
        <div style="text-align: center; padding: 20px;">
            <div style="width: 60px; height: 60px; background-color: #DCFCE7; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">👤</span>
            </div>
            <h3 style="margin: 0 0 5px; color: #2D2A26;">{name}</h3>
            <p style="margin: 0; color: #5C5852;">{email}</p>
        </div>
        <p style="text-align: center; color: #22C55E; margin-top: 15px;">
            ✓ Neuer Kunde hat sich erfolgreich registriert
        </p>
    '''
    
    await notify(telegram_msg, "👤 Neuer Kunde registriert", email_content, "#22C55E")


async def notify_newsletter_signup(email: str, source: str = "website"):
    """Benachrichtigung: Newsletter-Anmeldung"""
    if not NOTIFY_NEWSLETTER_SIGNUP:
        return
    
    telegram_msg = f"""📰 <b>NEWSLETTER-ANMELDUNG</b>

<b>E-Mail:</b> {email}
<b>Quelle:</b> {source}"""

    email_content = f'''
        <div style="text-align: center; padding: 20px;">
            <span style="font-size: 40px;">📰</span>
            <h3 style="margin: 15px 0 5px; color: #2D2A26;">Neue Newsletter-Anmeldung</h3>
            <p style="margin: 0; color: #8B2E2E; font-size: 16px;"><strong>{email}</strong></p>
            <p style="margin: 10px 0 0; color: #969088; font-size: 12px;">Quelle: {source}</p>
        </div>
    '''
    
    await notify(telegram_msg, "📰 Newsletter-Anmeldung", email_content, "#8B2E2E")


async def notify_coupon_used(coupon_code: str, discount_amount: float, order: dict):
    """Benachrichtigung: Gutschein verwendet"""
    if not NOTIFY_COUPON_USED:
        return
    
    customer = order.get('customer_name', 'Unbekannt')
    order_total = order.get('total_amount', 0)
    
    telegram_msg = f"""🎁 <b>GUTSCHEIN EINGELÖST</b>

<b>Code:</b> {coupon_code}
<b>Rabatt:</b> €{discount_amount:.2f}
<b>Kunde:</b> {customer}
<b>Bestellsumme:</b> €{order_total:.2f}"""

    email_content = f'''
        <div style="text-align: center; padding: 20px; background-color: #F3E8FF;">
            <span style="font-size: 40px;">🎁</span>
            <h3 style="margin: 15px 0 5px; color: #7C3AED;">Gutschein eingelöst</h3>
            <p style="margin: 0; font-size: 24px; color: #5B21B6;"><strong>{coupon_code}</strong></p>
        </div>
        <table style="width: 100%; margin-top: 20px;">
            <tr>
                <td style="padding: 8px 0; color: #5C5852;">Rabatt:</td>
                <td style="padding: 8px 0; text-align: right; color: #22C55E;"><strong>-€{discount_amount:.2f}</strong></td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #5C5852;">Kunde:</td>
                <td style="padding: 8px 0; text-align: right;">{customer}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #5C5852;">Bestellsumme:</td>
                <td style="padding: 8px 0; text-align: right;"><strong>€{order_total:.2f}</strong></td>
            </tr>
        </table>
    '''
    
    await notify(telegram_msg, "🎁 Gutschein eingelöst", email_content, "#7C3AED")


async def notify_daily_summary(stats: dict):
    """Benachrichtigung: Tägliche Zusammenfassung"""
    if not NOTIFY_DAILY_SUMMARY:
        return
    
    orders_today = stats.get('orders_today', 0)
    revenue_today = stats.get('revenue_today', 0)
    new_customers = stats.get('new_customers_today', 0)
    newsletter_signups = stats.get('newsletter_signups_today', 0)
    
    telegram_msg = f"""📊 <b>TAGESBERICHT</b>

<b>Datum:</b> {datetime.now().strftime('%d.%m.%Y')}

📦 Bestellungen: {orders_today}
💰 Umsatz: €{revenue_today:.2f}
👤 Neue Kunden: {new_customers}
📰 Newsletter-Anmeldungen: {newsletter_signups}"""

    email_content = f'''
        <div style="text-align: center; padding: 15px; background-color: #F9F8F6; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #2D2A26;">Tagesbericht - {datetime.now().strftime('%d.%m.%Y')}</h3>
        </div>
        
        <table style="width: 100%;">
            <tr>
                <td style="padding: 15px; text-align: center; background-color: #DBEAFE;">
                    <p style="margin: 0; font-size: 28px; color: #1E40AF;"><strong>{orders_today}</strong></p>
                    <p style="margin: 5px 0 0; color: #1E3A8A; font-size: 12px;">Bestellungen</p>
                </td>
                <td style="padding: 15px; text-align: center; background-color: #DCFCE7;">
                    <p style="margin: 0; font-size: 28px; color: #166534;"><strong>€{revenue_today:.2f}</strong></p>
                    <p style="margin: 5px 0 0; color: #14532D; font-size: 12px;">Umsatz</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 15px; text-align: center; background-color: #FEF3C7;">
                    <p style="margin: 0; font-size: 28px; color: #92400E;"><strong>{new_customers}</strong></p>
                    <p style="margin: 5px 0 0; color: #78350F; font-size: 12px;">Neue Kunden</p>
                </td>
                <td style="padding: 15px; text-align: center; background-color: #FCE7F3;">
                    <p style="margin: 0; font-size: 28px; color: #9D174D;"><strong>{newsletter_signups}</strong></p>
                    <p style="margin: 5px 0 0; color: #831843; font-size: 12px;">Newsletter</p>
                </td>
            </tr>
        </table>
    '''
    
    await notify(telegram_msg, "📊 Täglicher Bericht", email_content, "#2563EB")


# ==================== LAGERBESTAND PRÜFEN ====================

async def check_stock_levels(db):
    """Prüft alle Produkte auf niedrigen Bestand"""
    products = await db.products.find({}, {'_id': 0, 'name_de': 1, 'stock': 1, 'id': 1}).to_list(1000)
    
    for product in products:
        stock = product.get('stock', 0)
        
        if stock == 0:
            # Prüfen ob wir bereits benachrichtigt haben (in den letzten 24h)
            # Für Simplizität: immer benachrichtigen, aber in Produktion sollte man das tracken
            await notify_out_of_stock(product)
        elif stock < 10:
            await notify_low_stock(product)
