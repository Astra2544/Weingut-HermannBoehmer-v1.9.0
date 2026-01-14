# 🔐 SSL/HTTPS Setup Anleitung - Hermann Böhmer Shop

## Das Problem war:

### 1. NGINX "duplicate upstream" Fehler
Das Dockerfile hat **alle 3 Config-Dateien** ins `/etc/nginx/conf.d/` kopiert:
- `default.conf`
- `default-ssl.conf`  
- `default-initial.conf`

Und `nginx.conf` lädt ALLE `.conf` Dateien → **3x upstream Definition = Fehler!**

**Lösung:** Config-Dateien werden jetzt in `/etc/nginx/templates/` gespeichert und das `entrypoint.sh` kopiert nur EINE davon nach `/etc/nginx/conf.d/`.

### 2. Let's Encrypt Rate Limiting
Der `certbot-init` Container lief in einer **Endlosschleife** und machte zu viele Anfragen → Rate Limit erreicht.

**Lösung:** `certbot-init` Container entfernt. Zertifikate werden nur noch **manuell** mit dem Script geholt.

---

## 🚀 Setup-Anleitung (auf deinem Server)

### Schritt 1: Ports freigeben

**Ubuntu/Debian mit UFW:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
sudo ufw status
```

**CentOS/RHEL mit firewalld:**
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

**Prüfen ob Ports frei sind:**
```bash
sudo lsof -i :80
sudo lsof -i :443
```

Falls Apache läuft:
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Schritt 2: DNS prüfen

```bash
# DNS Auflösung prüfen
dig hermann-boehmer.com +short
dig www.hermann-boehmer.com +short
dig api.hermann-boehmer.com +short

# Alle sollten DEINE Server-IP anzeigen!
```

### Schritt 3: Alte Container stoppen

```bash
cd /pfad/zu/projekt
docker compose down
```

### Schritt 4: 1 Stunde warten (wegen Rate Limit)

Du hast das Rate Limit erreicht. **Warte bis ca. 21:08 UTC** (oder 1 Stunde ab jetzt).

### Schritt 5: SSL Setup ausführen

```bash
chmod +x init-ssl.sh
./init-ssl.sh
```

Das Script:
1. Prüft alle Voraussetzungen
2. Startet Services im HTTP-Modus
3. Testet ob Domains erreichbar sind
4. Holt SSL-Zertifikate von Let's Encrypt
5. Startet Nginx mit HTTPS neu

---

## 🔄 Zertifikat-Erneuerung (alle 60-90 Tage)

```bash
docker compose run --rm certbot renew
docker compose restart nginx
```

Oder als Cronjob:
```bash
# Crontab öffnen
crontab -e

# Diese Zeile hinzufügen (jeden Montag um 3 Uhr nachts):
0 3 * * 1 cd /pfad/zu/projekt && docker compose run --rm certbot renew && docker compose restart nginx
```

---

## 🔍 Troubleshooting

### "too many failed authorizations" Fehler
→ Rate Limit erreicht. **1 Stunde warten**, dann erneut versuchen.

### "duplicate upstream" Fehler
→ Alte Docker Images löschen:
```bash
docker compose down
docker compose build --no-cache nginx
docker compose up -d
```

### Domain nicht erreichbar
```bash
# DNS prüfen
dig hermann-boehmer.com

# HTTP direkt testen
curl -I http://hermann-boehmer.com

# Nginx Logs prüfen
docker compose logs nginx
```

### SSL Zertifikat läuft ab
```bash
# Status prüfen
docker compose run --rm certbot certificates

# Erneuern
docker compose run --rm certbot renew --force-renewal
docker compose restart nginx
```

---

## 📊 Status prüfen

```bash
# Alle Container Status
docker compose ps

# Nginx Logs
docker compose logs -f nginx

# SSL Zertifikat Info
echo | openssl s_client -servername hermann-boehmer.com -connect hermann-boehmer.com:443 2>/dev/null | openssl x509 -noout -dates
```
