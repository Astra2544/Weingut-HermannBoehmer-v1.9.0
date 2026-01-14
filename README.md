# 🍑 Hermann Böhmer - Weingut Online-Shop

Ein eleganter, vollständiger E-Commerce Online-Shop für Wachauer Marillenprodukte mit umfangreichem Admin-Dashboard.

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Funktionen](#funktionen)
3. [Admin-Dashboard Funktionen](#admin-dashboard-funktionen)
4. [Benachrichtigungssystem](#benachrichtigungssystem)
5. [Gutschein-System](#gutschein-system)
6. [Treuepunkte-System](#treuepunkte-system)
7. [Technische Spezifikationen](#technische-spezifikationen)
8. [Projektstruktur](#projektstruktur)
9. [Umgebungsvariablen](#umgebungsvariablen)
10. [Anpassungen & Konfiguration](#anpassungen--konfiguration)
11. [Wichtige Dateien](#wichtige-dateien)
12. [Befehle](#befehle)
13. [Live-Gang Checkliste](#live-gang-checkliste)

---

## 🎯 Übersicht

Dieses Projekt ist ein vollständiger Online-Shop mit:
- **Öffentlicher Shop** für Kunden
- **Admin-Dashboard** für Verwaltung
- **Kunden-Portal** für registrierte Benutzer
- **Under Construction Modus** für Wartungsarbeiten
- **Benachrichtigungssystem** via Telegram & E-Mail
- **Gutschein-System** mit Rabattcodes
- **Treuepunkte-System** für Stammkunden

---

## ✨ Funktionen

### 🛒 Shop (Öffentlich)
- Produktkatalog mit Kategorien (Likör, Edelbrand, Marmelade, Chutney, Pralinen, Schokolade, Geschenke)
- Produktdetailseiten mit Bildern und Beschreibungen
- Warenkorb mit Mengenänderung
- **Gutschein-Eingabefeld** im Warenkorb (NEU!)
- Checkout mit Altersverifikation (18+)
- Versandkostenberechnung nach Land (mit Gratis-Versand Schwelle)
- Bestellverfolgung (Tracking)
- **PDF-Rechnungen** automatisch per E-Mail

### 👤 Kunden-Portal
- Registrierung & Login
- Bestellhistorie mit Details
- Adressverwaltung (Liefer- & Rechnungsadresse)
- Passwort zurücksetzen
- **Treuepunkte-Anzeige** mit Tier-System

### 🔐 Admin-Dashboard
Siehe nächster Abschnitt für alle Details.

### 📧 E-Mail-System
- Bestellbestätigungen mit PDF-Rechnung
- Versandbenachrichtigungen
- Newsletter-System mit Abmelde-Link
- Kontaktformular-Benachrichtigungen
- Admin-Posteingang (IMAP)
- **Admin-Benachrichtigungen** bei wichtigen Events

### 🌐 Weitere Features
- Mehrsprachig (Deutsch/Englisch)
- Cookie-Banner (DSGVO)
- SEO-optimiert (Meta-Tags)
- Mobile-responsive Design
- Under Construction Modus
- Rechtliche Seiten (Datenschutz, AGB, Impressum)
- **Chat-Widget** (KI-Assistent unten rechts) - NEU! 🤖

---

## 🖥 Admin-Dashboard Funktionen

Das Admin-Dashboard ist über `/admin` erreichbar und enthält folgende Tabs:

### 📊 Übersicht (Dashboard)
- Gesamtumsatz mit Tagesvergleich
- Anzahl Bestellungen
- Produktanzahl
- Gewinn/Verlust Berechnung
- Desktop-Sound bei neuen Bestellungen 🔔

### 📦 Bestellungen
- Alle Bestellungen mit Status
- Status ändern (Ausstehend → Bearbeitung → Versendet → Geliefert)
- Tracking-Nummer hinzufügen
- Bestelldetails anzeigen
- **Admin-Notizen** zu Bestellungen hinzufügen
- Bestellung als "Neu" markieren

### 🛍 Produkte
- Produkte hinzufügen/bearbeiten/löschen
- Kategorien verwalten
- 18+ Markierung
- Lagerbestand verwalten
- **Niedrig-Bestand Warnung** (< 10 Stück)
- Produktbilder hochladen

### 👥 Kunden
- Liste aller registrierten Kunden
- Kundendetails (Name, E-Mail, Telefon)
- Bestellhistorie pro Kunde
- Newsletter-Status
- **Treuepunkte** anzeigen und anpassen
- **Admin-Notizen** zu Kunden hinzufügen
- Loyalty-Tier (Bronze/Silber/Gold/Platinum/Diamant)

### 🎁 Gutscheine (NEU!)
- Gutscheincodes erstellen
- Rabatttyp: Prozent oder Festbetrag
- Mindestbestellwert festlegen
- Maximale Nutzungen begrenzen
- Gültigkeitszeitraum (von/bis)
- Aktivieren/Deaktivieren
- Nutzungsstatistiken

### ⭐ Treuepunkte (NEU!)
- Punkte pro Euro einstellen
- Einlöse-Rate festlegen (z.B. 100 Punkte = 1€)
- System aktivieren/deaktivieren
- Punkte manuell anpassen
- Transaktionshistorie

### 📰 Newsletter
- Alle Abonnenten anzeigen
- Aktive/Inaktive Filter
- "Wir sind live" E-Mail an alle senden
- Abmelde-Statistiken

### 📧 E-Mails
- Posteingang (IMAP)
- E-Mails lesen und beantworten
- Kontaktanfragen verwalten

### 💰 Finanzen
- Ausgaben erfassen
- Kategorien (Wareneinkauf, Marketing, etc.)
- Gewinn/Verlust Übersicht
- Monatliche Statistiken

### 📈 Statistiken (NEU!)
- Umsatz-Charts (7 Tage, 30 Tage, 12 Monate)
- Bestseller-Produkte
- Bestellungen nach Status
- Kunden-Wachstum
- Durchschnittlicher Bestellwert

### 🚚 Versand
- Versandkosten pro Land
- Gratis-Versand ab Betrag X
- Länder aktivieren/deaktivieren

### 👤 Admins
- Admin-Benutzer verwalten
- Neue Admins erstellen
- Passwort ändern

---

## 🔔 Benachrichtigungssystem

Das Benachrichtigungssystem sendet Admin-Benachrichtigungen via **Telegram** und **E-Mail** für wichtige Events.

### Verfügbare Benachrichtigungen

| Event | Beschreibung | ENV-Variable |
|-------|--------------|--------------|
| 🛒 Neue Bestellung | Bei jeder bezahlten Bestellung | `NOTIFY_NEW_ORDER` |
| ⚠️ Niedriger Bestand | Wenn Produkt < 10 Stück | `NOTIFY_LOW_STOCK` |
| 🚨 Ausverkauft | Wenn Produkt = 0 Stück | `NOTIFY_OUT_OF_STOCK` |
| 📧 Kontaktanfrage | Bei neuer Kontaktformular-Nachricht | `NOTIFY_CONTACT_FORM` |
| 👤 Neuer Kunde | Bei Kundenregistrierung | `NOTIFY_NEW_CUSTOMER` |
| 📰 Newsletter | Bei Newsletter-Anmeldung | `NOTIFY_NEWSLETTER_SIGNUP` |
| 🎁 Gutschein | Wenn Gutschein eingelöst wird | `NOTIFY_COUPON_USED` |
| 📊 Tagesbericht | Tägliche Zusammenfassung | `NOTIFY_DAILY_SUMMARY` |

### Konfiguration

In `/app/backend/.env`:

```env
# ===== TELEGRAM =====
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=-1001234567890

# ===== E-MAIL EMPFÄNGER =====
NOTIFICATION_RECIPIENTS=admin@beispiel.de,chef@beispiel.de

# ===== SCHALTER (true/false) =====
NOTIFY_NEW_ORDER=true
NOTIFY_LOW_STOCK=true
NOTIFY_CONTACT_FORM=true
NOTIFY_NEW_CUSTOMER=true
NOTIFY_NEWSLETTER_SIGNUP=true
NOTIFY_OUT_OF_STOCK=true
NOTIFY_COUPON_USED=true
NOTIFY_DAILY_SUMMARY=true
```

### Telegram Bot einrichten

1. Öffne Telegram und suche `@BotFather`
2. Sende `/newbot` und folge den Anweisungen
3. Kopiere den **Bot Token** (z.B. `123456789:ABC...`)
4. Erstelle einen Channel oder eine Gruppe
5. Füge den Bot als Admin hinzu
6. Finde die **Channel ID**:
   - Sende eine Nachricht in den Channel
   - Öffne `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Die ID steht unter `chat.id` (beginnt mit `-100` bei Channels)
7. Trage beide Werte in `.env` ein

---

## 🎫 Gutschein-System

### Gutschein erstellen (Admin-Dashboard)

1. Admin-Dashboard → Tab "Gutscheine"
2. "Neuer Gutschein" klicken
3. Ausfüllen:
   - **Code**: z.B. `WILLKOMMEN10`
   - **Rabatttyp**: Prozent oder Festbetrag
   - **Rabattwert**: z.B. `10` (für 10%)
   - **Mindestbestellwert**: Optional, z.B. `50`
   - **Max. Nutzungen**: Optional, z.B. `100`
   - **Gültig von/bis**: Optional
   - **Beschreibung**: z.B. "10% Rabatt für Neukunden"

### Gutschein anwenden (Kunde)

1. Produkte in den Warenkorb legen
2. Im Warenkorb (Schritt 1) das Gutscheinfeld finden
3. Code eingeben und "Anwenden" klicken
4. Rabatt wird sofort angezeigt und von der Summe abgezogen

### Vorhandener Test-Gutschein

- **Code**: `WILLKOMMEN10`
- **Rabatt**: 10%
- **Beschreibung**: 10% Rabatt für Neukunden

---

## ⭐ Treuepunkte-System

### Funktionsweise

1. Kunden sammeln Punkte bei jeder Bestellung
2. Punkte können gegen Rabatte eingelöst werden
3. Tier-System mit Vorteilen (Bronze → Diamant)

### Einstellungen (Admin-Dashboard → Treuepunkte)

| Einstellung | Beschreibung | Standardwert |
|-------------|--------------|--------------|
| Punkte pro Euro | Wie viele Punkte pro ausgegebenem Euro | 1 |
| Einlöse-Rate | Wie viel 1 Punkt wert ist (in €) | 0.01 |
| System aktiv | Punkte sammeln aktivieren | Ja |

### Tier-System

| Tier | Mindestausgaben | Farbe |
|------|-----------------|-------|
| Bronze | €0 | Bronze |
| Silber | €50 | Silber |
| Gold | €100 | Gold |
| Platinum | €250 | Platin |
| Diamant | €500 | Diamant |

---

## 🛠 Technische Spezifikationen

### Frontend
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **React** | 19.0.0 | UI Framework |
| **React Router** | 7.5.1 | Navigation/Routing |
| **Tailwind CSS** | 3.4.17 | Styling Framework |
| **Framer Motion** | 12.24.12 | Animationen |
| **Axios** | 1.8.4 | HTTP Client |
| **Lucide React** | 0.507.0 | Icons |
| **Radix UI** | Latest | UI Komponenten |
| **Recharts** | 3.6.0 | Charts/Diagramme |
| **Sonner** | 2.0.3 | Toast Notifications |

### Backend
| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Python** | 3.11+ | Programmiersprache |
| **FastAPI** | 0.110.1 | Web Framework |
| **MongoDB** | - | Datenbank |
| **Motor** | 3.3.1 | Async MongoDB Driver |
| **aiohttp** | - | Async HTTP (Telegram) |
| **aiosmtplib** | - | E-Mail Versand |
| **reportlab** | - | PDF-Generierung |

### Datenbank Collections
```
products              # Produkte
orders                # Bestellungen
customers             # Kunden
admins                # Admin-Benutzer
coupons               # Gutscheincodes
newsletter_subscribers # Newsletter
loyalty_settings      # Treuepunkte-Einstellungen
loyalty_transactions  # Punkte-Transaktionen
shipping_rates        # Versandkosten
contact_messages      # Kontaktanfragen
expenses              # Ausgaben
```

---

## 📁 Projektstruktur

```
/app
├── backend/
│   ├── server.py              # Haupt-API Server (alle Endpunkte)
│   ├── email_service.py       # E-Mail Funktionen
│   ├── notification_service.py # Telegram + E-Mail Benachrichtigungen
│   ├── invoice_generator.py   # PDF-Rechnungen
│   ├── notification_config.txt # Dokumentation der Benachrichtigungen
│   ├── requirements.txt       # Python Dependencies
│   └── .env                   # Backend Umgebungsvariablen
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Wiederverwendbare Komponenten
│   │   │   ├── layout/        # Navbar, Footer
│   │   │   └── ui/            # UI Komponenten (shadcn)
│   │   ├── context/           # React Context (Auth, Cart, Language)
│   │   ├── pages/             # Seiten-Komponenten
│   │   │   ├── CartPage.js    # Warenkorb mit Gutschein-Feld
│   │   │   ├── AdminDashboardPage.js # Admin-Dashboard
│   │   │   └── ...
│   │   └── App.js             # Haupt-App Komponente
│   ├── public/
│   ├── package.json
│   └── .env                   # Frontend Umgebungsvariablen
│
├── memory/
│   └── PRD.md                 # Projekt-Dokumentation
│
├── test_reports/              # Test-Ergebnisse
└── README.md                  # Diese Datei
```

---

## 🔧 Umgebungsvariablen

### Frontend (`/app/frontend/.env`)

| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `REACT_APP_BACKEND_URL` | Backend API URL | ⚠️ Nur bei Domain-Änderung |
| `REACT_APP_UNDER_CONSTRUCTION` | Wartungsmodus (`true`/`false`) | ✅ Zum Ein/Ausschalten |

### Backend (`/app/backend/.env`)

#### Datenbank
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `MONGO_URL` | MongoDB Verbindung | ⚠️ Nur bei externer DB |
| `DB_NAME` | Datenbank Name | ✅ Kann angepasst werden |

#### Stripe (Zahlungen)
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `STRIPE_API_KEY` | Stripe Secret Key | ✅ **Live-Key eintragen!** |

#### E-Mail (SMTP - Ausgehend)
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `SMTP_HOST` | SMTP Server | ✅ Eigenen Server |
| `SMTP_PORT` | SMTP Port (meist 465) | ✅ Je nach Anbieter |
| `SMTP_USE_TLS` | TLS aktivieren | ✅ Meist `true` |
| `SMTP_USER` | E-Mail Adresse | ✅ Eigene E-Mail |
| `SMTP_PASSWORD` | E-Mail Passwort | ✅ Eigenes Passwort |
| `SENDER_EMAIL` | Absender-Adresse | ✅ |
| `SENDER_NAME` | Absender-Name | ✅ |

#### E-Mail (IMAP - Eingehend)
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `IMAP_HOST` | IMAP Server | ✅ |
| `IMAP_PORT` | IMAP Port (meist 993) | ✅ |

#### Newsletter E-Mail
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `NEWSLETTER_EMAIL` | Newsletter Absender | ✅ Eigene E-Mail |
| `NEWSLETTER_EMAIL_PASSWORD` | Passwort | ✅ |

#### Admin E-Mail (Für Benachrichtigungen)
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `ADMIN_EMAIL` | Admin E-Mail Account | ✅ |
| `ADMIN_EMAIL_PASSWORD` | Passwort | ✅ |

#### Telegram Benachrichtigungen
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot Token von @BotFather | ✅ **Pflicht für Telegram!** |
| `TELEGRAM_CHANNEL_ID` | Channel/Gruppen ID | ✅ **Pflicht für Telegram!** |

#### Benachrichtigungs-Empfänger
| Variable | Beschreibung | Bearbeiten? |
|----------|--------------|-------------|
| `NOTIFICATION_RECIPIENTS` | E-Mail-Adressen (kommagetrennt) | ✅ **Empfänger eintragen!** |

#### Benachrichtigungs-Schalter (true/false)
| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `NOTIFY_NEW_ORDER` | Neue Bestellung | `true` |
| `NOTIFY_LOW_STOCK` | Niedriger Bestand | `true` |
| `NOTIFY_CONTACT_FORM` | Kontaktanfrage | `true` |
| `NOTIFY_NEW_CUSTOMER` | Neuer Kunde | `true` |
| `NOTIFY_NEWSLETTER_SIGNUP` | Newsletter-Anmeldung | `true` |
| `NOTIFY_OUT_OF_STOCK` | Ausverkauft | `true` |
| `NOTIFY_COUPON_USED` | Gutschein verwendet | `true` |
| `NOTIFY_DAILY_SUMMARY` | Tagesbericht | `true` |

---

## ⚙️ Anpassungen & Konfiguration

### 🎨 Design anpassen

**Farbschema** (in `/app/frontend/src/index.css`):
```css
--warm-bg: #F9F8F6      /* Hintergrund */
--merlot: #8B2E2E       /* Akzentfarbe (Weinrot) */
--text-dark: #2D2A26    /* Dunkler Text */
--text-gray: #5C5852    /* Grauer Text */
--border: #E5E0D8       /* Rahmenfarbe */
```

### 🔒 Admin-Zugang

**Standard Admin-Login:**
- E-Mail: `admin@boehmer.at`
- Passwort: `wachau2024`

> ⚠️ **Wichtig**: Passwort vor Live-Gang ändern!

### 🚧 Under Construction Modus

**Aktivieren:**
```env
# In /app/frontend/.env
REACT_APP_UNDER_CONSTRUCTION=true
```
Dann: `sudo supervisorctl restart frontend`

**Deaktivieren:**
```env
REACT_APP_UNDER_CONSTRUCTION=false
```
Dann: `sudo supervisorctl restart frontend`

---

## 📄 Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `/app/backend/.env` | **Alle Backend-Einstellungen** (E-Mail, Telegram, Schalter) |
| `/app/frontend/.env` | Frontend-Einstellungen |
| `/app/backend/server.py` | Alle API-Endpunkte |
| `/app/backend/notification_service.py` | Telegram & E-Mail Benachrichtigungen |
| `/app/backend/email_service.py` | E-Mail-Vorlagen |
| `/app/backend/invoice_generator.py` | PDF-Rechnungen |
| `/app/frontend/src/pages/CartPage.js` | Warenkorb mit Gutschein-Feld |
| `/app/frontend/src/pages/AdminDashboardPage.js` | Admin-Dashboard |

---

## 🖥 Befehle

### Server neu starten
```bash
# Beide Server
sudo supervisorctl restart all

# Nur Frontend
sudo supervisorctl restart frontend

# Nur Backend
sudo supervisorctl restart backend
```

### Status prüfen
```bash
sudo supervisorctl status
```

### Logs anzeigen
```bash
# Backend Logs (Fehler)
tail -f /var/log/supervisor/backend.err.log

# Frontend Logs
tail -f /var/log/supervisor/frontend.err.log
```

### Nach .env Änderungen
```bash
# Backend neu starten (für .env Änderungen)
sudo supervisorctl restart backend
```

---

## 🚀 Live-Gang Checkliste

### Pflicht
- [ ] `REACT_APP_UNDER_CONSTRUCTION=false` setzen
- [ ] Stripe **Live**-Keys eintragen (nicht Test-Keys!)
- [ ] Admin-Passwort ändern
- [ ] E-Mail-Konfiguration testen

### Empfohlen
- [ ] Telegram Bot einrichten für Benachrichtigungen
- [ ] `NOTIFICATION_RECIPIENTS` mit echten E-Mails füllen
- [ ] Alle Benachrichtigungs-Schalter prüfen
- [ ] Produkte im Admin-Dashboard anlegen
- [ ] Versandkosten pro Land konfigurieren
- [ ] Gutscheine erstellen (z.B. Willkommens-Rabatt)
- [ ] Rechtliche Seiten prüfen (Datenschutz, AGB)
- [ ] "Wir sind live" E-Mail an Newsletter vorbereiten

### Nach Live-Gang
- [ ] Test-Bestellung durchführen
- [ ] Prüfen ob Benachrichtigungen ankommen
- [ ] E-Mail-Zustellung testen
- [ ] PDF-Rechnung prüfen

---

## 📝 Changelog

### Januar 2025 - Große Erweiterung
- ✅ **Chat-Widget** - Virtueller Assistent unten rechts mit Wissen über Dürnstein & Produkte
- ✅ **Benachrichtigungssystem** (Telegram + E-Mail)
- ✅ **Gutschein-System** mit Eingabefeld im Warenkorb
- ✅ **Treuepunkte-System** mit Tier-System
- ✅ **PDF-Rechnungen** automatisch per E-Mail
- ✅ **Erweiterte Statistiken** im Admin-Dashboard
- ✅ **Admin-Notizen** für Kunden und Bestellungen
- ✅ **Desktop-Sound** bei neuen Bestellungen
- ✅ **Low-Stock Warnungen** im Admin
- ✅ Newsletter mit Abmelde-Link
- ✅ Under Construction Seite

### Frühere Updates
- Newsletter-System
- Kunden-Portal mit Login
- Bestellverfolgung
- Mehrsprachigkeit (DE/EN)

---

## 📞 Support

Bei Fragen oder Problemen:
- E-Mail: info@hermann-boehmer.com
- Telefon: +43 650 2711237

---

*Erstellt mit ❤️ für Hermann Böhmer Weingut Dürnstein*
