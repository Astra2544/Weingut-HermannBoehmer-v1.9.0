# 🚀 Hermann Böhmer Shop - Deployment Guide

## 📋 Schnellübersicht

### Standard-Ports

| Service | Port | Beschreibung |
|---------|------|--------------|
| **Frontend** | `3180` | React Website |
| **Backend** | `8180` | FastAPI Server |
| **PostgreSQL** | `5580` | Datenbank (EXTERN ERREICHBAR!) |

> ⚠️ **Port belegt?** Ändere in deiner `.env`: `FRONTEND_PORT`, `BACKEND_PORT`, `DB_EXTERNAL_PORT`

### Standard Datenbank-Zugangsdaten

| Einstellung | Standard-Wert | ENV-Variable |
|-------------|---------------|--------------|
| **Host** | `deine-server-ip` | - |
| **Port** | `5580` | `DB_EXTERNAL_PORT` |
| **Datenbank** | `hermann_boehmer_shop` | `DB_NAME` |
| **Benutzer** | `boehmer_admin` | `DB_USER` |
| **Passwort** | `CHANGE_ME_...` | `DB_PASSWORD` |

⚠️ **WICHTIG:** Ändere ALLE `CHANGE_ME` Werte in deiner `.env` Datei!

---

## 🔌 Datenbank-Verbindung von außen

### Mit DBeaver, pgAdmin, TablePlus, etc.

```
Host:     deine-server-ip (oder domain)
Port:     5480
Database: hermann_boehmer_shop
Username: boehmer_admin
Password: [Dein DB_PASSWORD aus .env]
```

### Mit psql (Kommandozeile)
```bash
psql -h deine-server-ip -p 5580 -U boehmer_admin -d hermann_boehmer_shop
```

### Connection String
```
postgresql://boehmer_admin:DEIN_PASSWORT@deine-server-ip:5580/hermann_boehmer_shop
```

---

## 🚀 Deployment in Coolify

### 1. Repository verbinden
- Neues Projekt → "Docker Compose"
- Git Repository verbinden
- Compose File: `docker-compose.yml`

### 2. Umgebungsvariablen setzen
Kopiere alle Variablen aus `.env.example` und ersetze die Werte:

**⚠️ MUSS geändert werden:**
```env
# Datenbank
DB_PASSWORD=DeinSicheresPasswort123!

# Admin-Zugang
INITIAL_ADMIN_EMAIL=dein@email.com
INITIAL_ADMIN_PASSWORD=DeinAdminPasswort123!

# Sicherheit
JWT_SECRET=generiere_mit_openssl_rand_hex_32
ADMIN_SECRET=generiere_mit_openssl_rand_hex_16

# URLs (deine Domain!)
REACT_APP_BACKEND_URL=https://api.hermann-boehmer.com
FRONTEND_URL=https://hermann-boehmer.com

# Stripe (für echte Zahlungen)
STRIPE_API_KEY=sk_live_...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Domains konfigurieren
| Domain | Port | Service |
|--------|------|---------|
| `hermann-boehmer.com` | 3180 | Frontend |
| `api.hermann-boehmer.com` | 8180 | Backend |

### 4. SSL aktivieren
- Let's Encrypt für beide Domains
- HTTPS erzwingen

---

## 🔑 Sichere Schlüssel generieren

```bash
# JWT Secret (64 Zeichen)
openssl rand -hex 32

# Admin Secret (32 Zeichen)
openssl rand -hex 16

# Datenbank Passwort
openssl rand -base64 24
```

---

## 🔐 Sicherheits-Checkliste

### Vor dem Deployment:
- [ ] `DB_PASSWORD` geändert
- [ ] `JWT_SECRET` geändert (mind. 32 Zeichen)
- [ ] `ADMIN_SECRET` geändert
- [ ] `INITIAL_ADMIN_EMAIL` geändert
- [ ] `INITIAL_ADMIN_PASSWORD` geändert (stark!)
- [ ] URLs angepasst (`REACT_APP_BACKEND_URL`, `FRONTEND_URL`)

### Nach dem Deployment:
- [ ] SSL/HTTPS aktiviert
- [ ] Admin-Login getestet
- [ ] Firewall konfiguriert (nur Ports 3080, 8080, 5480 offen)

---

## 👤 Admin-Zugang

Der erste Admin wird automatisch erstellt:
- **URL:** `https://deine-domain.com/admin`
- **E-Mail:** `INITIAL_ADMIN_EMAIL`
- **Passwort:** `INITIAL_ADMIN_PASSWORD`

---

## 💾 Datenbank-Backup

### Manuell (von deinem Server)
```bash
docker exec hermann_boehmer_db pg_dump -U boehmer_admin hermann_boehmer_shop > backup_$(date +%Y%m%d).sql
```

### Von extern (mit deinem PC)
```bash
pg_dump -h deine-server-ip -p 5480 -U boehmer_admin hermann_boehmer_shop > backup.sql
```

### Wiederherstellen
```bash
# Von Server
cat backup.sql | docker exec -i hermann_boehmer_db psql -U boehmer_admin hermann_boehmer_shop

# Von extern
psql -h deine-server-ip -p 5480 -U boehmer_admin hermann_boehmer_shop < backup.sql
```

---

## 🔍 Troubleshooting

### Logs anzeigen
```bash
docker-compose logs -f           # Alle
docker-compose logs -f backend   # Nur Backend
docker-compose logs -f postgres  # Nur Datenbank
```

### Health Check
```bash
curl https://api.deine-domain.com/api/health
# Erwartet: {"status":"healthy","database":"postgresql",...}
```

### Container neustarten
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Komplett neu starten
```bash
docker-compose down
docker-compose up -d
```

---

## 📊 Alle ENV-Variablen Übersicht

| Variable | Beschreibung | Pflicht |
|----------|--------------|---------|
| **PORTS** | | |
| `FRONTEND_PORT` | Frontend Port (Standard: 3080) | Optional |
| `BACKEND_PORT` | Backend Port (Standard: 8080) | Optional |
| `DB_EXTERNAL_PORT` | DB Port extern (Standard: 5480) | Optional |
| **DATENBANK** | | |
| `DB_NAME` | Datenbankname | ⚠️ Ja |
| `DB_USER` | Datenbankbenutzer | ⚠️ Ja |
| `DB_PASSWORD` | Datenbankpasswort | ⚠️ Ja |
| **ADMIN** | | |
| `INITIAL_ADMIN_EMAIL` | Erster Admin E-Mail | ⚠️ Ja |
| `INITIAL_ADMIN_PASSWORD` | Erster Admin Passwort | ⚠️ Ja |
| **SICHERHEIT** | | |
| `JWT_SECRET` | Token-Verschlüsselung | ⚠️ Ja |
| `ADMIN_SECRET` | Admin-Registrierung | ⚠️ Ja |
| **STRIPE** | | |
| `STRIPE_API_KEY` | Stripe Secret Key | Für Zahlung |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe Public Key | Für Zahlung |
| **URLs** | | |
| `REACT_APP_BACKEND_URL` | Backend URL | ⚠️ Ja |
| `FRONTEND_URL` | Frontend URL | ⚠️ Ja |
| **E-MAIL** | | |
| `SMTP_HOST` | SMTP Server | Für E-Mails |
| `SMTP_PORT` | SMTP Port | Für E-Mails |
| `SMTP_USER` | SMTP Benutzer | Für E-Mails |
| `SMTP_PASSWORD` | SMTP Passwort | Für E-Mails |
| ... | (siehe .env.example für alle) | |

---

## 📞 Support

Bei Problemen: info@hermann-boehmer.com
