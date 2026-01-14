# 🚀 Deployment Anleitung - Hermann Böhmer Shop

## Schnellstart (auf deinem Server)

```bash
# 1. Projekt klonen oder Dateien hochladen
cd /opt/hermann-boehmer  # oder wo auch immer du es haben willst

# 2. Alte Container und Volumes löschen (sauberer Start)
docker compose down -v

# 3. Alles starten
docker compose up -d --build

# 4. Logs beobachten
docker compose logs -f certbot
```

## Was passiert automatisch:

1. **Postgres** startet und wartet auf Healthcheck
2. **Backend** startet (wartet auf Postgres)
3. **Frontend** startet (wartet auf Backend)
4. **Nginx** startet mit HTTP-only Config
5. **Certbot** wartet 15 Sekunden, dann:
   - Prüft ob Zertifikate existieren → Wenn ja, fertig!
   - Prüft ob Lock-File existiert → Wenn ja, wartet
   - Versucht max 2x SSL-Zertifikate zu holen
   - Bei Erfolg: Zeigt Erfolgsmeldung
   - Bei Fehler nach 2 Versuchen: Setzt 1h-Sperre und zeigt FAILED

## Nach erfolgreichem SSL Setup:

```bash
# Nginx neu starten um SSL zu aktivieren
docker compose restart nginx

# Prüfen ob alles läuft
docker compose ps

# HTTPS testen
curl -I https://hermann-boehmer.com
```

## Bei Problemen:

### "❌ SSL SETUP GESPERRT!"
```bash
# 1 Stunde warten ODER Lock manuell entfernen:
docker volume rm hermann_boehmer_certbot_conf
docker compose up -d --build
```

### "❌ FAILED - Maximale Versuche erreicht!"
Prüfe:
1. DNS zeigt auf Server? → `dig hermann-boehmer.com +short`
2. Port 80 offen? → `curl -I http://hermann-boehmer.com`
3. Firewall? → `sudo ufw status`

Nach Behebung:
```bash
docker volume rm hermann_boehmer_certbot_conf
docker compose up -d --build
```

### "duplicate upstream" Fehler
```bash
docker compose down
docker compose build --no-cache nginx
docker compose up -d
```

## Logs anzeigen:

```bash
# Alle Logs
docker compose logs -f

# Nur Certbot
docker compose logs -f certbot

# Nur Nginx
docker compose logs -f nginx

# Nur Backend
docker compose logs -f backend
```

## Zertifikat-Erneuerung:

Passiert automatisch alle 12 Stunden durch `certbot-renew` Container.

Manuell:
```bash
docker compose exec certbot-renew certbot renew
docker compose restart nginx
```

## Ports:

- **80** - HTTP (Redirect zu HTTPS + Let's Encrypt Challenge)
- **443** - HTTPS (Frontend + API)
- **5580** - PostgreSQL (nur wenn extern benötigt)

## Domains:

- `https://hermann-boehmer.com` → Frontend
- `https://www.hermann-boehmer.com` → Frontend
- `https://api.hermann-boehmer.com` → Backend API
