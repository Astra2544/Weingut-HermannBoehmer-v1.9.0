"""
Hermann Böhmer Wachauer Gold - E-Mail Service
Komplettes E-Mail-System mit SMTP (für Hostinger oder andere Provider)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file explicitly
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr
from datetime import datetime
from typing import Optional
import logging
import hashlib

logger = logging.getLogger(__name__)

# ==================== SMTP SERVER KONFIGURATION ====================
# Server-Einstellungen (für alle E-Mails gleich)

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.hostinger.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# ==================== HAUPT E-MAIL (Bestellungen, Passwort-Reset, Willkommen) ====================
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', '')
SENDER_PASSWORD = os.environ.get('SENDER_PASSWORD', os.environ.get('SMTP_PASSWORD', ''))
SENDER_NAME = os.environ.get('SENDER_NAME', 'Hermann Böhmer Wachauer Gold')

# ==================== KONTAKT E-MAIL (Kontaktformular-Antworten) ====================
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', SENDER_EMAIL)
CONTACT_EMAIL_PASSWORD = os.environ.get('CONTACT_EMAIL_PASSWORD', SENDER_PASSWORD)
CONTACT_EMAIL_NAME = os.environ.get('CONTACT_EMAIL_NAME', 'Hermann Böhmer Kundenservice')

# ==================== NEWSLETTER E-MAIL (Newsletter-Versand) ====================
NEWSLETTER_EMAIL = os.environ.get('NEWSLETTER_EMAIL', SENDER_EMAIL)
NEWSLETTER_EMAIL_PASSWORD = os.environ.get('NEWSLETTER_EMAIL_PASSWORD', SENDER_PASSWORD)
NEWSLETTER_EMAIL_NAME = os.environ.get('NEWSLETTER_EMAIL_NAME', 'Hermann Böhmer Newsletter')

# ==================== ADMIN E-MAIL (Admin-Benachrichtigungen) - wird in notification_service genutzt ====================
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', SENDER_EMAIL)
ADMIN_EMAIL_PASSWORD = os.environ.get('ADMIN_EMAIL_PASSWORD', SENDER_PASSWORD)

# Legacy Support: Falls alte SMTP_USER/SMTP_PASSWORD noch genutzt werden
if not SENDER_EMAIL:
    SENDER_EMAIL = os.environ.get('SMTP_USER', '')
    SENDER_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

# Log loaded config (without passwords)
logger.info(f"Email Service initialized: SMTP_HOST={SMTP_HOST}")
logger.info(f"  → Sender (Bestellungen): {SENDER_EMAIL}")
logger.info(f"  → Contact (Kundenservice): {CONTACT_EMAIL}")
logger.info(f"  → Newsletter: {NEWSLETTER_EMAIL}")
logger.info(f"  → Admin: {ADMIN_EMAIL}")

# Deutschsprachige Länder
GERMAN_COUNTRIES = ['Österreich', 'Deutschland', 'Schweiz', 'Liechtenstein', 'Austria', 'Germany', 'Switzerland']

def get_language(country: str) -> str:
    """Bestimmt die Sprache basierend auf dem Land"""
    if any(gc.lower() in country.lower() for gc in GERMAN_COUNTRIES):
        return 'de'
    return 'en'

def generate_unsubscribe_token(email: str) -> str:
    """Generiert einen einfachen Token für Abmeldung"""
    secret = os.environ.get('JWT_SECRET', 'boehmer-secret-2024')
    return hashlib.sha256(f"{email}{secret}".encode()).hexdigest()[:32]

def verify_unsubscribe_token(email: str, token: str) -> bool:
    """Verifiziert den Abmelde-Token"""
    expected = generate_unsubscribe_token(email)
    return token == expected

# ==================== E-MAIL TEMPLATES ====================

def get_base_template(content: str, language: str = 'de') -> str:
    """Base HTML Template mit elegantem Design"""
    
    footer_text = {
        'de': {
            'company': 'Hermann Böhmer Wachauer Gold',
            'address': 'Weingut Dürnstein, Wachau, Österreich',
            'contact': 'Bei Fragen kontaktieren Sie uns unter',
            'unsubscribe': 'Diese E-Mail wurde automatisch versendet.',
            'rights': 'Alle Rechte vorbehalten.'
        },
        'en': {
            'company': 'Hermann Böhmer Wachauer Gold',
            'address': 'Winery Dürnstein, Wachau, Austria',
            'contact': 'For questions, contact us at',
            'unsubscribe': 'This email was sent automatically.',
            'rights': 'All rights reserved.'
        }
    }
    
    f = footer_text.get(language, footer_text['de'])
    year = datetime.now().year
    
    return f'''
<!DOCTYPE html>
<html lang="{language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hermann Böhmer</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Manrope:wght@300;400;500;600&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9F8F6; color: #2D2A26;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F8F6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E5E0D8;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #E5E0D8;">
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; color: #2D2A26; letter-spacing: 0.5px;">
                                Hermann Böhmer
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #969088;">
                                Weingut Dürnstein
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #F9F8F6; border-top: 1px solid #E5E0D8;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #2D2A26;">
                                            {f['company']}
                                        </p>
                                        <p style="margin: 0 0 15px; font-size: 13px; color: #969088;">
                                            {f['address']}
                                        </p>
                                        <p style="margin: 0 0 5px; font-size: 12px; color: #969088;">
                                            {f['contact']} <a href="mailto:info@boehmer-wachau.at" style="color: #8B2E2E; text-decoration: none;">info@boehmer-wachau.at</a>
                                        </p>
                                        <p style="margin: 15px 0 0; font-size: 11px; color: #C4BDB3;">
                                            © {year} {f['company']}. {f['rights']}<br>
                                            {f['unsubscribe']}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''


# ==================== WILLKOMMENS-EMAIL ====================

def get_welcome_email(customer_name: str, language: str = 'de') -> tuple:
    """Willkommens-E-Mail nach Registrierung"""
    
    if language == 'de':
        subject = "Willkommen bei Hermann Böhmer Wachauer Gold"
        content = f'''
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Herzlich Willkommen, {customer_name}!
            </h2>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Vielen Dank für Ihre Registrierung bei Hermann Böhmer Wachauer Gold. 
                Wir freuen uns, Sie in unserer Familie begrüßen zu dürfen.
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Als Mitglied unseres Kundenkreises genießen Sie:
            </p>
            <ul style="margin: 0 0 25px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #5C5852;">
                <li>Exklusiven Zugang zu limitierten Editionen</li>
                <li>Unser Treueprogramm mit besonderen Vorteilen</li>
                <li>Persönliche Bestellhistorie und einfache Nachbestellung</li>
                <li>Frühe Information über neue Kreationen</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{FRONTEND_URL}/shop" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Jetzt entdecken
                </a>
            </div>
            <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Mit herzlichen Grüßen aus der Wachau,<br>
                <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">Ihr Hermann Böhmer Team</span>
            </p>
        '''
    else:
        subject = "Welcome to Hermann Böhmer Wachauer Gold"
        content = f'''
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Welcome, {customer_name}!
            </h2>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Thank you for registering with Hermann Böhmer Wachauer Gold. 
                We are delighted to welcome you to our family.
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                As a member of our customer circle, you enjoy:
            </p>
            <ul style="margin: 0 0 25px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #5C5852;">
                <li>Exclusive access to limited editions</li>
                <li>Our loyalty program with special benefits</li>
                <li>Personal order history and easy reordering</li>
                <li>Early information about new creations</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{FRONTEND_URL}/shop" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Discover Now
                </a>
            </div>
            <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
                With warm regards from the Wachau,<br>
                <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">Your Hermann Böhmer Team</span>
            </p>
        '''
    
    return subject, get_base_template(content, language)


# ==================== PASSWORT ZURÜCKSETZEN ====================

def get_password_reset_email(customer_name: str, reset_token: str, language: str = 'de') -> tuple:
    """Passwort-Reset E-Mail mit sicherem Link"""
    
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    if language == 'de':
        subject = "Passwort zurücksetzen - Hermann Böhmer"
        content = f'''
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Passwort zurücksetzen
            </h2>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Guten Tag {customer_name},
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. 
                Klicken Sie auf den folgenden Button, um ein neues Passwort festzulegen:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Neues Passwort festlegen
                </a>
            </div>
            <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.7; color: #969088;">
                Dieser Link ist aus Sicherheitsgründen nur <strong>1 Stunde</strong> gültig.
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.7; color: #969088;">
                Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. 
                Ihr Passwort bleibt unverändert.
            </p>
            <div style="margin-top: 25px; padding: 15px; background-color: #F9F8F6; border-left: 3px solid #8B2E2E;">
                <p style="margin: 0; font-size: 13px; color: #5C5852;">
                    <strong>Sicherheitshinweis:</strong> Wir werden Sie niemals nach Ihrem Passwort fragen. 
                    Teilen Sie diesen Link mit niemandem.
                </p>
            </div>
        '''
    else:
        subject = "Reset Your Password - Hermann Böhmer"
        content = f'''
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Reset Your Password
            </h2>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Dear {customer_name},
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                You have requested to reset your password. 
                Click the button below to set a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Set New Password
                </a>
            </div>
            <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.7; color: #969088;">
                This link is valid for <strong>1 hour</strong> for security reasons.
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.7; color: #969088;">
                If you did not request this, you can safely ignore this email. 
                Your password will remain unchanged.
            </p>
            <div style="margin-top: 25px; padding: 15px; background-color: #F9F8F6; border-left: 3px solid #8B2E2E;">
                <p style="margin: 0; font-size: 13px; color: #5C5852;">
                    <strong>Security Notice:</strong> We will never ask for your password. 
                    Do not share this link with anyone.
                </p>
            </div>
        '''
    
    return subject, get_base_template(content, language)


# ==================== BESTELLBESTÄTIGUNG ====================

def get_order_confirmation_email(order: dict, language: str = 'de') -> tuple:
    """Bestellbestätigung mit allen Details"""
    
    # Produkte-Tabelle generieren
    items_html = ""
    for item in order.get('item_details', []):
        product_name = item.get('product_name_de' if language == 'de' else 'product_name_en', item.get('product_name_de', 'Produkt'))
        items_html += f'''
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #E5E0D8;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="vertical-align: top;">
                                <p style="margin: 0 0 5px; font-size: 14px; font-weight: 500; color: #2D2A26;">
                                    {product_name}
                                </p>
                                <p style="margin: 0; font-size: 13px; color: #969088;">
                                    {"Menge" if language == "de" else "Quantity"}: {item.get('quantity', 1)}
                                </p>
                            </td>
                            <td style="text-align: right; vertical-align: top;">
                                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #2D2A26;">
                                    €{item.get('subtotal', 0):.2f}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        '''
    
    tracking_url = f"{FRONTEND_URL}/tracking?number={order.get('tracking_number', '')}"
    
    if language == 'de':
        subject = f"Bestellbestätigung #{order.get('tracking_number', '')}"
        content = f'''
            <h2 style="margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Vielen Dank für Ihre Bestellung!
            </h2>
            <p style="margin: 0 0 25px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Guten Tag {order.get('customer_name', 'Kunde')}, wir haben Ihre Bestellung erhalten und werden sie schnellstmöglich bearbeiten.
            </p>
            
            <!-- Bestellnummer Box -->
            <div style="padding: 20px; background-color: #F9F8F6; border: 1px solid #E5E0D8; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0 0 5px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                    Ihre Bestellnummer
                </p>
                <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 500; color: #8B2E2E;">
                    {order.get('tracking_number', '')}
                </p>
            </div>
            
            <!-- Bestellte Artikel -->
            <h3 style="margin: 0 0 15px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                Bestellte Artikel
            </h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                {items_html}
            </table>
            
            <!-- Summen -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #5C5852;">Zwischensumme</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #2D2A26; text-align: right;">€{order.get('subtotal', 0):.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #5C5852;">Versand</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #2D2A26; text-align: right;">{"Kostenlos" if order.get('shipping_cost', 0) == 0 else f"€{order.get('shipping_cost', 0):.2f}"}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; font-size: 16px; font-weight: 600; color: #2D2A26; border-top: 2px solid #2D2A26;">Gesamtsumme</td>
                    <td style="padding: 12px 0; font-size: 16px; font-weight: 600; color: #8B2E2E; text-align: right; border-top: 2px solid #2D2A26;">€{order.get('total_amount', 0):.2f}</td>
                </tr>
            </table>
            
            <!-- Lieferadresse -->
            <h3 style="margin: 0 0 15px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                Lieferadresse
            </h3>
            <div style="padding: 15px; background-color: #F9F8F6; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2D2A26;">
                    {order.get('customer_name', '')}<br>
                    {order.get('shipping_address', '')}<br>
                    {order.get('shipping_postal', '')} {order.get('shipping_city', '')}<br>
                    {order.get('shipping_country', '')}
                </p>
            </div>
            
            <!-- Tracking Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{tracking_url}" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Bestellung verfolgen
                </a>
            </div>
            
            <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.7; color: #969088; text-align: center;">
                Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versendet wurde.
            </p>
        '''
    else:
        subject = f"Order Confirmation #{order.get('tracking_number', '')}"
        content = f'''
            <h2 style="margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Thank You for Your Order!
            </h2>
            <p style="margin: 0 0 25px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Dear {order.get('customer_name', 'Customer')}, we have received your order and will process it as quickly as possible.
            </p>
            
            <!-- Order Number Box -->
            <div style="padding: 20px; background-color: #F9F8F6; border: 1px solid #E5E0D8; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0 0 5px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                    Your Order Number
                </p>
                <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 500; color: #8B2E2E;">
                    {order.get('tracking_number', '')}
                </p>
            </div>
            
            <!-- Ordered Items -->
            <h3 style="margin: 0 0 15px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                Ordered Items
            </h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                {items_html}
            </table>
            
            <!-- Totals -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #5C5852;">Subtotal</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #2D2A26; text-align: right;">€{order.get('subtotal', 0):.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-size: 14px; color: #5C5852;">Shipping</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #2D2A26; text-align: right;">{"Free" if order.get('shipping_cost', 0) == 0 else f"€{order.get('shipping_cost', 0):.2f}"}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; font-size: 16px; font-weight: 600; color: #2D2A26; border-top: 2px solid #2D2A26;">Total</td>
                    <td style="padding: 12px 0; font-size: 16px; font-weight: 600; color: #8B2E2E; text-align: right; border-top: 2px solid #2D2A26;">€{order.get('total_amount', 0):.2f}</td>
                </tr>
            </table>
            
            <!-- Shipping Address -->
            <h3 style="margin: 0 0 15px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                Shipping Address
            </h3>
            <div style="padding: 15px; background-color: #F9F8F6; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2D2A26;">
                    {order.get('customer_name', '')}<br>
                    {order.get('shipping_address', '')}<br>
                    {order.get('shipping_postal', '')} {order.get('shipping_city', '')}<br>
                    {order.get('shipping_country', '')}
                </p>
            </div>
            
            <!-- Tracking Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{tracking_url}" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Track Your Order
                </a>
            </div>
            
            <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.7; color: #969088; text-align: center;">
                You will receive another email once your order has been shipped.
            </p>
        '''
    
    return subject, get_base_template(content, language)


# ==================== STATUS UPDATE EMAILS ====================

def get_status_update_email(order: dict, new_status: str, language: str = 'de') -> tuple:
    """Status-Update E-Mail bei Statusänderung"""
    
    tracking_url = f"{FRONTEND_URL}/tracking?number={order.get('tracking_number', '')}"
    
    status_info = {
        'de': {
            'processing': {
                'title': 'Ihre Bestellung wird bearbeitet',
                'icon': '⚙️',
                'message': 'Gute Nachrichten! Ihre Bestellung wird jetzt von unserem Team sorgfältig zusammengestellt.',
                'next': 'Sie erhalten eine E-Mail mit der Sendungsverfolgung, sobald Ihr Paket versendet wurde.'
            },
            'shipped': {
                'title': 'Ihre Bestellung ist unterwegs!',
                'icon': '📦',
                'message': 'Ihr Paket hat unser Weingut verlassen und ist auf dem Weg zu Ihnen.',
                'next': 'Die voraussichtliche Lieferzeit beträgt 2-4 Werktage.'
            },
            'delivered': {
                'title': 'Ihre Bestellung wurde zugestellt',
                'icon': '✓',
                'message': 'Ihr Paket wurde erfolgreich zugestellt. Wir hoffen, Sie genießen unsere Produkte!',
                'next': 'Wir würden uns über Ihr Feedback freuen.'
            },
            'cancelled': {
                'title': 'Bestellung storniert',
                'icon': '✕',
                'message': 'Ihre Bestellung wurde storniert. Falls eine Zahlung erfolgt ist, wird diese innerhalb von 5-7 Werktagen erstattet.',
                'next': 'Bei Fragen kontaktieren Sie uns bitte.'
            }
        },
        'en': {
            'processing': {
                'title': 'Your Order is Being Processed',
                'icon': '⚙️',
                'message': 'Great news! Your order is now being carefully prepared by our team.',
                'next': 'You will receive an email with tracking information once your package has been shipped.'
            },
            'shipped': {
                'title': 'Your Order is On Its Way!',
                'icon': '📦',
                'message': 'Your package has left our winery and is on its way to you.',
                'next': 'Estimated delivery time is 2-4 business days.'
            },
            'delivered': {
                'title': 'Your Order Has Been Delivered',
                'icon': '✓',
                'message': 'Your package has been successfully delivered. We hope you enjoy our products!',
                'next': 'We would love to hear your feedback.'
            },
            'cancelled': {
                'title': 'Order Cancelled',
                'icon': '✕',
                'message': 'Your order has been cancelled. If payment was made, it will be refunded within 5-7 business days.',
                'next': 'Please contact us if you have any questions.'
            }
        }
    }
    
    info = status_info.get(language, status_info['de']).get(new_status, status_info['de']['processing'])
    
    if language == 'de':
        subject = f"{info['title']} - Bestellung #{order.get('tracking_number', '')}"
        content = f'''
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 70px; height: 70px; line-height: 70px; font-size: 32px; background-color: #F9F8F6; border: 2px solid #8B2E2E; border-radius: 50%;">
                    {info['icon']}
                </div>
            </div>
            
            <h2 style="margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26; text-align: center;">
                {info['title']}
            </h2>
            
            <p style="margin: 0 0 25px; font-size: 15px; line-height: 1.7; color: #5C5852; text-align: center;">
                Guten Tag {order.get('customer_name', 'Kunde')},
            </p>
            
            <div style="padding: 20px; background-color: #F9F8F6; border: 1px solid #E5E0D8; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0 0 5px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                    Bestellnummer
                </p>
                <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 500; color: #8B2E2E;">
                    {order.get('tracking_number', '')}
                </p>
            </div>
            
            <p style="margin: 0 0 15px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                {info['message']}
            </p>
            
            <p style="margin: 0 0 25px; font-size: 14px; line-height: 1.7; color: #969088;">
                {info['next']}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{tracking_url}" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Bestellung verfolgen
                </a>
            </div>
        '''
    else:
        subject = f"{info['title']} - Order #{order.get('tracking_number', '')}"
        content = f'''
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 70px; height: 70px; line-height: 70px; font-size: 32px; background-color: #F9F8F6; border: 2px solid #8B2E2E; border-radius: 50%;">
                    {info['icon']}
                </div>
            </div>
            
            <h2 style="margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26; text-align: center;">
                {info['title']}
            </h2>
            
            <p style="margin: 0 0 25px; font-size: 15px; line-height: 1.7; color: #5C5852; text-align: center;">
                Dear {order.get('customer_name', 'Customer')},
            </p>
            
            <div style="padding: 20px; background-color: #F9F8F6; border: 1px solid #E5E0D8; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0 0 5px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #969088;">
                    Order Number
                </p>
                <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 500; color: #8B2E2E;">
                    {order.get('tracking_number', '')}
                </p>
            </div>
            
            <p style="margin: 0 0 15px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                {info['message']}
            </p>
            
            <p style="margin: 0 0 25px; font-size: 14px; line-height: 1.7; color: #969088;">
                {info['next']}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{tracking_url}" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Track Your Order
                </a>
            </div>
        '''
    
    return subject, get_base_template(content, language)


# ==================== E-MAIL SENDEN FUNKTIONEN ====================

async def send_email(to_email: str, subject: str, html_content: str, attachment: bytes = None, attachment_filename: str = None) -> bool:
    """
    Sendet E-Mail über SENDER_EMAIL (Haupt-E-Mail)
    Verwendet für: Bestellbestätigungen, Passwort-Reset, Willkommen, Status-Updates
    """
    from email.mime.application import MIMEApplication
    
    if not SENDER_EMAIL or not SENDER_PASSWORD:
        logger.warning("SENDER_EMAIL not configured - email not sent")
        logger.warning("Please set SENDER_EMAIL and SENDER_PASSWORD in .env")
        return False
    
    try:
        # E-Mail erstellen (mixed für Attachments)
        if attachment:
            message = MIMEMultipart('mixed')
            msg_alternative = MIMEMultipart('alternative')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg_alternative.attach(html_part)
            message.attach(msg_alternative)
            
            pdf_attachment = MIMEApplication(attachment, _subtype='pdf')
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=attachment_filename or 'document.pdf')
            message.attach(pdf_attachment)
        else:
            message = MIMEMultipart('alternative')
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)
        
        message['Subject'] = subject
        message['From'] = formataddr((str(Header(SENDER_NAME, 'utf-8')), SENDER_EMAIL))
        message['To'] = to_email
        
        if SMTP_USE_TLS:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=SENDER_EMAIL,
                password=SENDER_PASSWORD,
                use_tls=True
            )
        else:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=SENDER_EMAIL,
                password=SENDER_PASSWORD,
                start_tls=True
            )
        
        logger.info(f"[SENDER] Email sent to {to_email}" + (f" with attachment {attachment_filename}" if attachment else ""))
        return True
        
    except Exception as e:
        logger.error(f"[SENDER] Error sending email to {to_email}: {str(e)}")
        return False


async def send_contact_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Sendet E-Mail über CONTACT_EMAIL (Kundenservice)
    Verwendet für: Kontaktformular-Antworten, Kundenanfragen
    """
    if not CONTACT_EMAIL or not CONTACT_EMAIL_PASSWORD:
        logger.warning("CONTACT_EMAIL not configured - falling back to SENDER_EMAIL")
        return await send_email(to_email, subject, html_content)
    
    try:
        message = MIMEMultipart('alternative')
        html_part = MIMEText(html_content, 'html', 'utf-8')
        message.attach(html_part)
        
        message['Subject'] = subject
        message['From'] = formataddr((str(Header(CONTACT_EMAIL_NAME, 'utf-8')), CONTACT_EMAIL))
        message['To'] = to_email
        message['Reply-To'] = CONTACT_EMAIL
        
        if SMTP_USE_TLS:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=CONTACT_EMAIL,
                password=CONTACT_EMAIL_PASSWORD,
                use_tls=True
            )
        else:
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=CONTACT_EMAIL,
                password=CONTACT_EMAIL_PASSWORD,
                start_tls=True
            )
        
        logger.info(f"[CONTACT] Email sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"[CONTACT] Error sending email to {to_email}: {str(e)}")
        # Fallback to sender email
        return await send_email(to_email, subject, html_content)


# ==================== HELPER FUNKTIONEN ====================

async def send_welcome_email(customer_email: str, customer_name: str, country: str = 'Österreich'):
    """Sendet Willkommens-E-Mail an neuen Kunden"""
    language = get_language(country)
    subject, html = get_welcome_email(customer_name, language)
    return await send_email(customer_email, subject, html)


async def send_password_reset_email(customer_email: str, customer_name: str, reset_token: str, country: str = 'Österreich'):
    """Sendet Passwort-Reset E-Mail"""
    language = get_language(country)
    subject, html = get_password_reset_email(customer_name, reset_token, language)
    return await send_email(customer_email, subject, html)


async def send_order_confirmation(order: dict):
    """Sendet Bestellbestätigung mit PDF-Rechnung als Anhang"""
    from invoice_generator import generate_invoice_pdf, generate_invoice_filename
    
    language = get_language(order.get('shipping_country', 'Österreich'))
    subject, html = get_order_confirmation_email(order, language)
    
    # PDF-Rechnung generieren
    try:
        pdf_bytes = generate_invoice_pdf(order)
        pdf_filename = generate_invoice_filename(order)
        logger.info(f"Generated invoice PDF: {pdf_filename}")
        
        # E-Mail mit PDF-Anhang senden
        return await send_email(
            order.get('customer_email', ''), 
            subject, 
            html,
            attachment=pdf_bytes,
            attachment_filename=pdf_filename
        )
    except Exception as e:
        logger.error(f"Failed to generate invoice PDF: {str(e)}")
        # Fallback: E-Mail ohne PDF senden
        return await send_email(order.get('customer_email', ''), subject, html)


async def send_order_status_update(order: dict, new_status: str):
    """Sendet Status-Update E-Mail"""
    language = get_language(order.get('shipping_country', 'Österreich'))
    subject, html = get_status_update_email(order, new_status, language)
    return await send_email(order.get('customer_email', ''), subject, html)


# ==================== KONTAKTFORMULAR E-MAILS ====================

def get_contact_confirmation_email(customer_name: str, subject_text: str, message_text: str, language: str = 'de') -> tuple:
    """Bestätigung für Kontaktformular-Absender"""
    
    if language == 'de':
        subject = "Ihre Nachricht an Hermann Böhmer"
        content = f'''
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Vielen Dank für Ihre Nachricht!
            </h2>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Guten Tag {customer_name},
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                wir haben Ihre Nachricht erhalten und werden uns schnellstmöglich bei Ihnen melden.
                In der Regel antworten wir innerhalb von 24-48 Stunden.
            </p>
            
            <div style="margin: 25px 0; padding: 20px; background-color: #F9F8F6; border-left: 3px solid #8B2E2E;">
                <p style="margin: 0 0 10px; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #969088;">
                    Ihre Anfrage
                </p>
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 500; color: #2D2A26;">
                    {subject_text}
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5C5852;">
                    {message_text[:500]}{"..." if len(message_text) > 500 else ""}
                </p>
            </div>
            
            <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Mit herzlichen Grüßen aus der Wachau,<br>
                <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">Ihr Hermann Böhmer Kundenservice</span>
            </p>
        '''
    else:
        subject = "Your message to Hermann Böhmer"
        content = f'''
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26;">
                Thank you for your message!
            </h2>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Dear {customer_name},
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                We have received your message and will get back to you as soon as possible.
                We usually respond within 24-48 hours.
            </p>
            
            <div style="margin: 25px 0; padding: 20px; background-color: #F9F8F6; border-left: 3px solid #8B2E2E;">
                <p style="margin: 0 0 10px; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #969088;">
                    Your inquiry
                </p>
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 500; color: #2D2A26;">
                    {subject_text}
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5C5852;">
                    {message_text[:500]}{"..." if len(message_text) > 500 else ""}
                </p>
            </div>
            
            <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
                With warm regards from the Wachau,<br>
                <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">Your Hermann Böhmer Customer Service</span>
            </p>
        '''
    
    return subject, get_base_template(content, language)


async def send_contact_confirmation(customer_email: str, customer_name: str, subject_text: str, message_text: str, language: str = 'de'):
    """Sendet Bestätigung an Kontaktformular-Absender über CONTACT_EMAIL"""
    subject, html = get_contact_confirmation_email(customer_name, subject_text, message_text, language)
    return await send_contact_email(customer_email, subject, html)


# ==================== NEWSLETTER E-MAILS ====================

def get_newsletter_welcome_email(language: str = 'de') -> tuple:
    """Newsletter-Anmeldung Bestätigungs-E-Mail"""
    
    if language == 'de':
        subject = "Willkommen beim Hermann Böhmer Newsletter! 🍑"
        content = f'''
            <div style="text-align: center; margin-bottom: 25px;">
                <span style="display: inline-block; font-size: 48px;">🍑</span>
            </div>
            
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26; text-align: center;">
                Vielen Dank für Ihre Anmeldung!
            </h2>
            
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Sie haben sich erfolgreich für unseren Newsletter angemeldet und erhalten ab sofort:
            </p>
            
            <ul style="margin: 0 0 25px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #5C5852;">
                <li>Exklusive Angebote und Rabatte</li>
                <li>Neuigkeiten zu unseren Wachauer Produkten</li>
                <li>Einladungen zu besonderen Events</li>
                <li>Rezepte und Tipps rund um Marillen</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{FRONTEND_URL}/shop" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Jetzt Shop entdecken
                </a>
            </div>
            
            <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Herzliche Grüße aus der Wachau,<br>
                <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">Ihr Hermann Böhmer Team</span>
            </p>
            
            <p style="margin: 25px 0 0; font-size: 12px; line-height: 1.6; color: #969088; text-align: center;">
                Sie können sich jederzeit vom Newsletter abmelden.
            </p>
        '''
    else:
        subject = "Welcome to the Hermann Böhmer Newsletter! 🍑"
        content = f'''
            <div style="text-align: center; margin-bottom: 25px;">
                <span style="display: inline-block; font-size: 48px;">🍑</span>
            </div>
            
            <h2 style="margin: 0 0 20px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 500; color: #2D2A26; text-align: center;">
                Thank You for Subscribing!
            </h2>
            
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #5C5852;">
                You have successfully subscribed to our newsletter. From now on you will receive:
            </p>
            
            <ul style="margin: 0 0 25px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #5C5852;">
                <li>Exclusive offers and discounts</li>
                <li>News about our Wachau products</li>
                <li>Invitations to special events</li>
                <li>Recipes and tips about apricots</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{FRONTEND_URL}/shop" style="display: inline-block; padding: 14px 35px; background-color: #8B2E2E; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                    Discover Our Shop
                </a>
            </div>
            
            <p style="margin: 25px 0 0; font-size: 15px; line-height: 1.7; color: #5C5852;">
                Warm regards from the Wachau,<br>
                <span style="font-family: 'Playfair Display', Georgia, serif; font-style: italic; color: #2D2A26;">Your Hermann Böhmer Team</span>
            </p>
            
            <p style="margin: 25px 0 0; font-size: 12px; line-height: 1.6; color: #969088; text-align: center;">
                You can unsubscribe from the newsletter at any time.
            </p>
        '''
    
    return subject, get_base_template(content, language)


async def send_newsletter_welcome(subscriber_email: str, language: str = 'de'):
    """Sendet Newsletter-Willkommens-E-Mail"""
    subject, html = get_newsletter_welcome_email(language)
    # Newsletter E-Mails über die Newsletter-E-Mail-Adresse senden
    return await send_newsletter_email(subscriber_email, subject, html)


# ==================== NEWSLETTER E-MAIL SYSTEM ====================

def get_newsletter_template(content: str, subscriber_email: str, language: str = 'de') -> str:
    """Newsletter HTML Template mit Abmelde-Link"""
    
    # Abmelde-Token generieren
    unsubscribe_token = generate_unsubscribe_token(subscriber_email)
    unsubscribe_url = f"{FRONTEND_URL}/newsletter/unsubscribe?email={subscriber_email}&token={unsubscribe_token}"
    
    footer_text = {
        'de': {
            'company': 'Hermann Böhmer Wachauer Gold',
            'address': 'Weingut Dürnstein, Wachau, Österreich',
            'unsubscribe': 'Newsletter abmelden',
            'unsubscribe_text': 'Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben.',
            'rights': 'Alle Rechte vorbehalten.'
        },
        'en': {
            'company': 'Hermann Böhmer Wachauer Gold',
            'address': 'Winery Dürnstein, Wachau, Austria',
            'unsubscribe': 'Unsubscribe',
            'unsubscribe_text': 'You are receiving this email because you subscribed to our newsletter.',
            'rights': 'All rights reserved.'
        }
    }
    
    f = footer_text.get(language, footer_text['de'])
    year = datetime.now().year
    
    return f'''
<!DOCTYPE html>
<html lang="{language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hermann Böhmer Newsletter</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Manrope:wght@300;400;500;600&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F9F8F6; color: #2D2A26;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F8F6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E5E0D8;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #E5E0D8;">
                            <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; color: #2D2A26; letter-spacing: 0.5px;">
                                Hermann Böhmer
                            </h1>
                            <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #969088;">
                                Newsletter
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer with Unsubscribe -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #F9F8F6; border-top: 1px solid #E5E0D8;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 10px; font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #2D2A26;">
                                            {f['company']}
                                        </p>
                                        <p style="margin: 0 0 15px; font-size: 12px; color: #969088;">
                                            {f['address']}
                                        </p>
                                        <p style="margin: 0 0 5px; font-size: 11px; color: #C5C0B8;">
                                            © {year} {f['company']}. {f['rights']}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Unsubscribe Section -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #F2EFE9; border-top: 1px solid #E5E0D8; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 11px; color: #969088;">
                                {f['unsubscribe_text']}
                            </p>
                            <a href="{unsubscribe_url}" style="font-size: 11px; color: #8B2E2E; text-decoration: underline;">
                                {f['unsubscribe']}
                            </a>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''


async def send_newsletter_email(to_email: str, subject: str, html_content: str) -> bool:
    """Sendet E-Mail über die Newsletter-E-Mail-Adresse (news@...)"""
    if not NEWSLETTER_EMAIL or not NEWSLETTER_EMAIL_PASSWORD:
        logger.warning("Newsletter email not configured, falling back to default sender")
        return await send_email(to_email, subject, html_content)
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = formataddr((str(Header(NEWSLETTER_EMAIL_NAME, 'utf-8')), NEWSLETTER_EMAIL))
        msg['To'] = to_email
        msg['Reply-To'] = NEWSLETTER_EMAIL
        
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        if SMTP_USE_TLS:
            await aiosmtplib.send(
                msg,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=NEWSLETTER_EMAIL,
                password=NEWSLETTER_EMAIL_PASSWORD,
                use_tls=True
            )
        else:
            await aiosmtplib.send(
                msg,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=NEWSLETTER_EMAIL,
                password=NEWSLETTER_EMAIL_PASSWORD,
                start_tls=True
            )
        
        logger.info(f"Newsletter email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send newsletter email to {to_email}: {str(e)}")
        # Fallback to default sender
        return await send_email(to_email, subject, html_content)


async def send_newsletter_to_subscriber(subscriber_email: str, subject: str, content: str, language: str = 'de') -> bool:
    """Sendet Newsletter an einen Abonnenten mit Abmelde-Link"""
    html = get_newsletter_template(content, subscriber_email, language)
    return await send_newsletter_email(subscriber_email, subject, html)
