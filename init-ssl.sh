#!/bin/bash
# ============================================================
# SSL Zertifikat Setup - Hermann Böhmer Shop
# ============================================================
# 
# ANLEITUNG:
# 1. Zuerst Ports freigeben (siehe unten)
# 2. DNS prüfen
# 3. Dieses Script ausführen
#
# ============================================================

set -e

EMAIL="info@hermann-boehmer.com"
DOMAINS="hermann-boehmer.com www.hermann-boehmer.com api.hermann-boehmer.com"

echo ""
echo "========================================"
echo "  🔐 SSL Setup für Hermann Böhmer Shop"
echo "========================================"
echo ""

# ============================================================
# SCHRITT 0: Ports prüfen
# ============================================================
echo "📋 VORAUSSETZUNGEN:"
echo ""
echo "  1. Ports 80 und 443 müssen offen sein:"
echo "     Ubuntu/Debian:  sudo ufw allow 80 && sudo ufw allow 443"
echo "     CentOS/RHEL:    sudo firewall-cmd --permanent --add-port=80/tcp && sudo firewall-cmd --permanent --add-port=443/tcp && sudo firewall-cmd --reload"
echo ""
echo "  2. DNS muss auf diesen Server zeigen:"
echo "     hermann-boehmer.com      -> Server-IP"
echo "     www.hermann-boehmer.com  -> Server-IP"
echo "     api.hermann-boehmer.com  -> Server-IP"
echo ""
echo "  3. Keine anderen Services auf Port 80/443"
echo "     Prüfen: sudo lsof -i :80 && sudo lsof -i :443"
echo "     Apache stoppen: sudo systemctl stop apache2"
echo ""
read -p "Sind alle Voraussetzungen erfüllt? (j/n): " confirm
if [ "$confirm" != "j" ] && [ "$confirm" != "J" ]; then
    echo "❌ Abgebrochen. Bitte zuerst Voraussetzungen erfüllen."
    exit 1
fi

# ============================================================
# SCHRITT 1: Alte Container stoppen
# ============================================================
echo ""
echo "🛑 Stoppe alte Container..."
docker compose down 2>/dev/null || true

# ============================================================
# SCHRITT 2: Alte Zertifikate prüfen
# ============================================================
echo ""
echo "🔍 Prüfe bestehende Zertifikate..."

# Volume-Pfad finden
CERT_VOLUME=$(docker volume inspect hermann_boehmer_certbot_conf 2>/dev/null | grep Mountpoint | awk -F'"' '{print $4}') || true

if [ -n "$CERT_VOLUME" ] && [ -d "$CERT_VOLUME/live/hermann-boehmer.com" ]; then
    echo "✅ Zertifikate existieren bereits in: $CERT_VOLUME"
    echo ""
    read -p "Möchten Sie die bestehenden Zertifikate behalten? (j/n): " keep_certs
    if [ "$keep_certs" = "n" ] || [ "$keep_certs" = "N" ]; then
        echo "🗑️  Lösche alte Zertifikate..."
        docker volume rm hermann_boehmer_certbot_conf 2>/dev/null || true
    fi
fi

# ============================================================
# SCHRITT 3: Services mit HTTP-Config starten
# ============================================================
echo ""
echo "🚀 Starte Services (HTTP-Modus für Let's Encrypt)..."
docker compose up -d postgres
echo "⏳ Warte auf Datenbank..."
sleep 10

docker compose up -d backend frontend
echo "⏳ Warte auf Backend & Frontend..."
sleep 10

docker compose up -d nginx
echo "⏳ Warte auf Nginx..."
sleep 5

# ============================================================
# SCHRITT 4: HTTP Erreichbarkeit testen
# ============================================================
echo ""
echo "🔍 Teste HTTP Erreichbarkeit..."

for domain in hermann-boehmer.com www.hermann-boehmer.com api.hermann-boehmer.com; do
    echo -n "  Testing $domain... "
    if curl -s -o /dev/null -w "%{http_code}" "http://$domain/.well-known/acme-challenge/test" 2>/dev/null | grep -q "404\|200"; then
        echo "✅ Erreichbar"
    else
        echo "❌ NICHT erreichbar!"
        echo ""
        echo "⚠️  FEHLER: $domain ist nicht über HTTP erreichbar!"
        echo "   Mögliche Ursachen:"
        echo "   - DNS zeigt nicht auf diesen Server"
        echo "   - Port 80 ist blockiert (Firewall)"
        echo "   - Anderer Service blockiert Port 80"
        echo ""
        read -p "Trotzdem fortfahren? (j/n): " force_continue
        if [ "$force_continue" != "j" ] && [ "$force_continue" != "J" ]; then
            echo "❌ Abgebrochen."
            exit 1
        fi
    fi
done

# ============================================================
# SCHRITT 5: SSL Zertifikate holen
# ============================================================
echo ""
echo "🔐 Hole SSL-Zertifikate von Let's Encrypt..."
echo "   (Das kann 30-60 Sekunden dauern)"
echo ""

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d hermann-boehmer.com \
    -d www.hermann-boehmer.com \
    -d api.hermann-boehmer.com

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ FEHLER beim Holen der Zertifikate!"
    echo ""
    echo "   Mögliche Ursachen:"
    echo "   1. Rate Limit erreicht - 1 Stunde warten"
    echo "   2. DNS nicht korrekt konfiguriert"
    echo "   3. Port 80 nicht erreichbar"
    echo ""
    echo "   Prüfen Sie:"
    echo "   - dig hermann-boehmer.com"
    echo "   - curl -I http://hermann-boehmer.com"
    echo ""
    exit 1
fi

# ============================================================
# SCHRITT 6: Nginx mit SSL neu starten
# ============================================================
echo ""
echo "🔄 Starte Nginx mit SSL-Config neu..."
docker compose restart nginx

sleep 3

# ============================================================
# SCHRITT 7: HTTPS testen
# ============================================================
echo ""
echo "🔍 Teste HTTPS..."

for domain in hermann-boehmer.com www.hermann-boehmer.com api.hermann-boehmer.com; do
    echo -n "  Testing https://$domain... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "✅ OK ($HTTP_CODE)"
    else
        echo "⚠️  Status: $HTTP_CODE"
    fi
done

# ============================================================
# FERTIG!
# ============================================================
echo ""
echo "========================================"
echo "  ✅ SSL SETUP ABGESCHLOSSEN!"
echo "========================================"
echo ""
echo "  🌐 https://hermann-boehmer.com"
echo "  🌐 https://www.hermann-boehmer.com"
echo "  🔌 https://api.hermann-boehmer.com"
echo ""
echo "  📋 Zertifikat-Renewal (alle 60-90 Tage):"
echo "     docker compose run --rm certbot renew"
echo "     docker compose restart nginx"
echo ""
echo "========================================"
