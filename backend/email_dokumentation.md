# ====================================================================================
#                    HERMANN BÖHMER - E-MAIL DOKUMENTATION
# ====================================================================================
#
# Diese Dokumentation zeigt GENAU welche E-Mail was macht.
# Basiert auf der Code-Analyse von: email_service.py, notification_service.py, server.py
#
# ====================================================================================


## ÜBERSICHT: 4 E-MAIL-KONTEN

| E-Mail-Konto | Variable | Standard-Wert |
|--------------|----------|---------------|
| **SENDER** | SENDER_EMAIL | info@hermann-boehmer.com |
| **CONTACT** | CONTACT_EMAIL | info@hermann-boehmer.com |
| **NEWSLETTER** | NEWSLETTER_EMAIL | news@hermann-boehmer.com |
| **ADMIN** | ADMIN_EMAIL | admin@hermann-boehmer.com |


---

## 1️⃣ SENDER_EMAIL (info@hermann-boehmer.com)

**Zweck:** Hauptkommunikation mit Kunden (Bestellungen, Account)

### Was wird GESENDET?

| Aktion | Empfänger | Betreff (DE) | Auslöser |
|--------|-----------|--------------|----------|
| **Bestellbestätigung** | Kunde | "Bestellbestätigung #WG-xxxxx" | Nach Bestellung |
| **Passwort-Reset** | Kunde | "Passwort zurücksetzen - Hermann Böhmer" | Kunde klickt "Passwort vergessen" |
| **Willkommens-E-Mail** | Neuer Kunde | "Willkommen bei Hermann Böhmer Wachauer Gold" | Nach Registrierung |
| **Status-Update** | Kunde | "Bestellupdate #WG-xxxxx" | Admin ändert Bestellstatus |

### Code-Referenzen:
- `send_email()` → email_service.py Zeile 644
- `send_welcome_email()` → email_service.py Zeile 753
- `send_password_reset_email()` → email_service.py Zeile 760
- `send_order_confirmation()` → email_service.py Zeile 767
- `send_order_status_update()` → email_service.py Zeile 794


---

## 2️⃣ CONTACT_EMAIL (info@hermann-boehmer.com)

**Zweck:** Kundenservice - Kontaktformular

### Was wird GESENDET?

| Aktion | Empfänger | Betreff (DE) | Auslöser |
|--------|-----------|--------------|----------|
| **Kontaktformular-Bestätigung** | Kunde | "Ihre Nachricht an Hermann Böhmer" | Kunde sendet Kontaktformular |

### Code-Referenzen:
- `send_contact_email()` → email_service.py Zeile 704
- `send_contact_confirmation()` → email_service.py Zeile 872


---

## 3️⃣ NEWSLETTER_EMAIL (news@hermann-boehmer.com)

**Zweck:** Newsletter-Kommunikation

### Was wird GESENDET?

| Aktion | Empfänger | Betreff (DE) | Auslöser |
|--------|-----------|--------------|----------|
| **Newsletter-Willkommen** | Neuer Abonnent | "Willkommen beim Hermann Böhmer Newsletter! 🍑" | Anmeldung zum Newsletter |
| **Newsletter-Kampagne** | Alle Abonnenten | (variabel) | Admin versendet Newsletter |

### Code-Referenzen:
- `send_newsletter_email()` → email_service.py Zeile 1075
- `send_newsletter_welcome()` → email_service.py Zeile 961
- `send_newsletter_to_subscriber()` → email_service.py Zeile 1119


---

## 4️⃣ ADMIN_EMAIL (admin@hermann-boehmer.com)

**Zweck:** Interne Benachrichtigungen an Administratoren

### Was wird GESENDET? (an NOTIFICATION_RECIPIENTS!)

| Aktion | Empfänger | Betreff | Auslöser | Schalter |
|--------|-----------|---------|----------|----------|
| **Neue Bestellung** | NOTIFICATION_RECIPIENTS | "Neue Bestellung #xxxxx" | Kunde bestellt | NOTIFY_NEW_ORDER |
| **Niedriger Bestand** | NOTIFICATION_RECIPIENTS | "Niedriger Bestand: [Produkt]" | Bestand < 10 | NOTIFY_LOW_STOCK |
| **Produkt ausverkauft** | NOTIFICATION_RECIPIENTS | "Ausverkauft: [Produkt]" | Bestand = 0 | NOTIFY_OUT_OF_STOCK |
| **Neue Kontaktanfrage** | NOTIFICATION_RECIPIENTS | "Neue Kontaktanfrage" | Kontaktformular | NOTIFY_CONTACT_FORM |
| **Neuer Kunde** | NOTIFICATION_RECIPIENTS | "Neuer Kunde registriert" | Registrierung | NOTIFY_NEW_CUSTOMER |
| **Newsletter-Anmeldung** | NOTIFICATION_RECIPIENTS | "Neue Newsletter-Anmeldung" | Newsletter-Signup | NOTIFY_NEWSLETTER_SIGNUP |
| **Gutschein verwendet** | NOTIFICATION_RECIPIENTS | "Gutschein verwendet" | Bestellung mit Gutschein | NOTIFY_COUPON_USED |
| **Tägliche Zusammenfassung** | NOTIFICATION_RECIPIENTS | "Tägliche Zusammenfassung" | Automatisch 20:00 Uhr | NOTIFY_DAILY_SUMMARY |

### Code-Referenzen:
- `send_admin_email()` → notification_service.py Zeile 154
- `notify_new_order()` → notification_service.py Zeile 219
- `notify_low_stock()` → notification_service.py Zeile 303
- `notify_out_of_stock()` → notification_service.py Zeile 336
- `notify_contact_form()` → notification_service.py Zeile 368
- `notify_new_customer()` → notification_service.py Zeile 408
- `notify_newsletter_signup()` → notification_service.py Zeile 439
- `notify_coupon_used()` → notification_service.py Zeile 461


---

## GRAFISCHE ÜBERSICHT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           E-MAIL SYSTEM ÜBERSICHT                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   SENDER_EMAIL (info@...)                                                   │
│   ├── → Kunde: Bestellbestätigung                                          │
│   ├── → Kunde: Passwort-Reset                                              │
│   ├── → Kunde: Willkommen                                                  │
│   └── → Kunde: Status-Update                                               │
│                                                                             │
│   CONTACT_EMAIL (info@...)                                                  │
│   └── → Kunde: Kontaktformular-Bestätigung                                 │
│                                                                             │
│   NEWSLETTER_EMAIL (news@...)                                               │
│   ├── → Abonnent: Newsletter-Willkommen                                    │
│   └── → Alle Abonnenten: Newsletter-Kampagnen                              │
│                                                                             │
│   ADMIN_EMAIL (admin@...)                                                   │
│   └── → NOTIFICATION_RECIPIENTS:                                           │
│       ├── Neue Bestellung                                                  │
│       ├── Niedriger Bestand                                                │
│       ├── Produkt ausverkauft                                              │
│       ├── Neue Kontaktanfrage                                              │
│       ├── Neuer Kunde                                                      │
│       ├── Newsletter-Anmeldung                                             │
│       ├── Gutschein verwendet                                              │
│       └── Tägliche Zusammenfassung                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## .ENV KONFIGURATION

```env
# ========== E-MAIL SERVER (für alle gleich) ==========
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USE_TLS=true

# ========== SENDER (Bestellungen, Passwort-Reset, Willkommen) ==========
SENDER_EMAIL=info@hermann-boehmer.com
SENDER_PASSWORD=xxxxx
SENDER_NAME=Hermann Böhmer Wachauer Gold

# ========== CONTACT (Kontaktformular-Bestätigungen) ==========
CONTACT_EMAIL=info@hermann-boehmer.com
CONTACT_EMAIL_PASSWORD=xxxxx
CONTACT_EMAIL_NAME=Hermann Böhmer Kundenservice

# ========== NEWSLETTER (Newsletter-Versand) ==========
NEWSLETTER_EMAIL=news@hermann-boehmer.com
NEWSLETTER_EMAIL_PASSWORD=xxxxx
NEWSLETTER_EMAIL_NAME=Hermann Böhmer Newsletter

# ========== ADMIN (Admin-Benachrichtigungen) ==========
ADMIN_EMAIL=admin@hermann-boehmer.com
ADMIN_EMAIL_PASSWORD=xxxxx

# ========== WER EMPFÄNGT ADMIN-BENACHRICHTIGUNGEN? ==========
NOTIFICATION_RECIPIENTS=ihre-email@example.com

# ========== BENACHRICHTIGUNGS-SCHALTER ==========
NOTIFY_NEW_ORDER=true
NOTIFY_LOW_STOCK=true
NOTIFY_CONTACT_FORM=true
NOTIFY_NEW_CUSTOMER=true
NOTIFY_NEWSLETTER_SIGNUP=true
NOTIFY_OUT_OF_STOCK=true
NOTIFY_COUPON_USED=true
NOTIFY_DAILY_SUMMARY=true
```


---

## WICHTIGE HINWEISE

### Fallback-Verhalten:
- Wenn `CONTACT_EMAIL_PASSWORD` fehlt → nutzt `SENDER_EMAIL`
- Wenn `NEWSLETTER_EMAIL_PASSWORD` fehlt → nutzt `SENDER_EMAIL`
- Wenn `ADMIN_EMAIL_PASSWORD` fehlt → nutzt `SENDER_EMAIL`

### Telegram (optional):
Admin-Benachrichtigungen können auch via Telegram gesendet werden:
```env
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHANNEL_ID=xxx
```


---

## GELÖSCHTE VARIABLEN (nicht mehr benötigt)

Diese Variablen wurden entfernt da sie nicht mehr verwendet werden:

| Variable | Grund |
|----------|-------|
| SMTP_USER | Ersetzt durch SENDER_EMAIL |
| SMTP_PASSWORD | Ersetzt durch SENDER_PASSWORD |
| IMAP_HOST | Nicht im Code verwendet |
| IMAP_PORT | Nicht im Code verwendet |
| IMAP_USE_SSL | Nicht im Code verwendet |


---

*Dokumentation erstellt: Januar 2026*
*Basiert auf Code-Analyse von: email_service.py, notification_service.py, server.py*
