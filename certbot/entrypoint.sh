#!/bin/sh
# ============================================================
# Certbot mit maximal 2 Versuchen - Hermann Böhmer Shop
# Nach Erfolg wird Nginx automatisch neu geladen!
# ============================================================

DOMAIN="hermann-boehmer.com"
EMAIL="info@hermann-boehmer.com"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
LOCK_FILE="/etc/letsencrypt/ssl_failed.lock"
MAX_ATTEMPTS=2
ATTEMPT_FILE="/etc/letsencrypt/attempt_count"

echo "========================================"
echo "  🔐 Certbot SSL Setup"
echo "  Domain: $DOMAIN"
echo "========================================"

# Funktion: Nginx neu laden
reload_nginx() {
    echo ""
    echo "🔄 Lade Nginx neu..."
    
    # Finde nginx container (verschiedene Namensformate)
    NGINX_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '^nginx|_nginx' | head -1)
    
    if [ -n "$NGINX_CONTAINER" ]; then
        docker exec "$NGINX_CONTAINER" nginx -s reload 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Nginx erfolgreich neu geladen!"
        else
            echo "⚠️  Nginx reload fehlgeschlagen, versuche restart..."
            docker restart "$NGINX_CONTAINER" 2>/dev/null || echo "❌ Konnte Nginx nicht neustarten"
        fi
    else
        echo "⚠️  Nginx Container nicht gefunden"
        echo "   Bitte manuell ausführen: docker restart nginx"
    fi
}

# Prüfe ob Zertifikate bereits existieren
if [ -f "$CERT_PATH" ]; then
    echo ""
    echo "✅ SSL-Zertifikate existieren bereits!"
    echo "📋 Zertifikat-Info:"
    certbot certificates 2>/dev/null || true
    echo ""
    echo "🔄 Prüfe ob Erneuerung nötig..."
    certbot renew --dry-run 2>/dev/null && echo "✅ Zertifikate sind aktuell" || echo "⚠️ Erneuerung könnte bald nötig sein"
    
    # Nginx trotzdem neu laden um sicherzustellen dass SSL Config aktiv ist
    reload_nginx
    exit 0
fi

# Prüfe ob bereits fehlgeschlagen (Lock-File)
if [ -f "$LOCK_FILE" ]; then
    LOCK_TIME=$(cat "$LOCK_FILE")
    CURRENT_TIME=$(date +%s)
    DIFF=$((CURRENT_TIME - LOCK_TIME))
    
    # Lock gilt für 1 Stunde (3600 Sekunden)
    if [ $DIFF -lt 3600 ]; then
        REMAINING=$(( (3600 - DIFF) / 60 ))
        echo ""
        echo "❌ SSL SETUP GESPERRT!"
        echo ""
        echo "   Grund: Zu viele fehlgeschlagene Versuche"
        echo "   Warte noch: $REMAINING Minuten"
        echo ""
        echo "   Das Lock wird automatisch nach 1 Stunde entfernt."
        echo "   Oder manuell: docker volume rm certbot_conf"
        echo ""
        exit 1
    else
        echo "🔓 Lock abgelaufen, entferne Lock-File..."
        rm -f "$LOCK_FILE"
        rm -f "$ATTEMPT_FILE"
    fi
fi

# Hole aktuelle Versuchszahl
if [ -f "$ATTEMPT_FILE" ]; then
    ATTEMPTS=$(cat "$ATTEMPT_FILE")
else
    ATTEMPTS=0
fi

echo ""
echo "📊 Versuch $((ATTEMPTS + 1)) von $MAX_ATTEMPTS"
echo ""

# Prüfe ob max Versuche erreicht
if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "❌ FAILED - Maximale Versuche ($MAX_ATTEMPTS) erreicht!"
    echo ""
    echo "   Setze 1-Stunden-Sperre um Rate Limit zu vermeiden..."
    date +%s > "$LOCK_FILE"
    echo ""
    echo "   Mögliche Probleme:"
    echo "   1. DNS zeigt nicht auf den Server"
    echo "   2. Port 80 ist nicht erreichbar"
    echo "   3. Firewall blockiert Zugriff"
    echo "   4. ACME Challenge wird nicht richtig serviert"
    echo ""
    echo "   Nach Behebung des Problems:"
    echo "   docker volume rm certbot_conf"
    echo "   docker compose up -d --build"
    echo ""
    exit 1
fi

# Warte auf Nginx
echo "⏳ Warte 20 Sekunden auf Nginx..."
sleep 20

# Erstelle ACME Challenge Verzeichnis
mkdir -p /var/www/certbot/.well-known/acme-challenge

# Erstelle Test-Challenge-Datei
echo ""
echo "🧪 Teste ACME Challenge-Verzeichnis..."
TEST_TOKEN="test-$(date +%s)"
echo "challenge-test-ok" > /var/www/certbot/.well-known/acme-challenge/$TEST_TOKEN

sleep 2

# Teste ob Challenge-Datei erreichbar ist
echo ""
echo "🔍 Teste HTTP Erreichbarkeit der Challenge-Dateien..."

TEST_OK=true
for domain in $DOMAIN www.$DOMAIN api.$DOMAIN; do
    echo -n "   $domain: "
    
    RESULT=$(wget -q --timeout=10 -O - "http://$domain/.well-known/acme-challenge/$TEST_TOKEN" 2>/dev/null || echo "FAILED")
    
    if [ "$RESULT" = "challenge-test-ok" ]; then
        echo "✅ Challenge OK"
    else
        if wget -q --spider --timeout=10 "http://$domain/" 2>/dev/null; then
            echo "⚠️ Root OK, aber Challenge 404"
            TEST_OK=false
        else
            echo "❌ NICHT ERREICHBAR"
            TEST_OK=false
        fi
    fi
done

rm -f /var/www/certbot/.well-known/acme-challenge/$TEST_TOKEN

if [ "$TEST_OK" = false ]; then
    echo ""
    echo "⚠️  WARNUNG: Challenge-Dateien nicht erreichbar!"
    echo "   Versuche trotzdem..."
    echo ""
fi

# Versuchszähler erhöhen
ATTEMPTS=$((ATTEMPTS + 1))
echo $ATTEMPTS > "$ATTEMPT_FILE"

# Certbot ausführen
echo ""
echo "🔐 Starte Let's Encrypt Zertifikatsanfrage..."
echo "   (Das kann 30-60 Sekunden dauern)"
echo ""

certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --preferred-challenges http \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d api.$DOMAIN

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  ✅ SSL ZERTIFIKATE ERFOLGREICH!"
    echo "========================================"
    echo ""
    echo "  🌐 https://hermann-boehmer.com"
    echo "  🌐 https://www.hermann-boehmer.com"
    echo "  🔌 https://api.hermann-boehmer.com"
    echo ""
    
    # Versuchszähler zurücksetzen
    rm -f "$ATTEMPT_FILE"
    
    # NGINX AUTOMATISCH NEU LADEN!
    reload_nginx
    
    echo ""
    echo "========================================"
    exit 0
else
    echo ""
    echo "❌ Zertifikatsanfrage fehlgeschlagen!"
    echo ""
    
    if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
        echo "❌ FAILED - Maximale Versuche erreicht!"
        echo "   Setze 1-Stunden-Sperre..."
        date +%s > "$LOCK_FILE"
    else
        echo "   Noch $((MAX_ATTEMPTS - ATTEMPTS)) Versuch(e) übrig."
        echo "   Nächster Versuch: docker compose restart certbot"
    fi
    echo ""
    exit 1
fi
