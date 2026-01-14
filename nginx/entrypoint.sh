#!/bin/sh
set -e

DOMAIN="hermann-boehmer.com"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

echo "========================================"
echo "  NGINX Startup - Hermann Böhmer Shop"
echo "========================================"

# Lösche alte Configs um Duplikate zu vermeiden
rm -f /etc/nginx/conf.d/*.conf

# Prüfe ob Zertifikate existieren
if [ -f "$CERT_PATH" ]; then
    echo "✅ SSL-Zertifikate gefunden!"
    echo "🔒 Starte mit HTTPS Config..."
    cp /etc/nginx/templates/default-ssl.conf /etc/nginx/conf.d/default.conf
else
    echo "⚠️  Keine SSL-Zertifikate gefunden!"
    echo "📋 Starte mit HTTP-only Config für Let's Encrypt Challenge..."
    cp /etc/nginx/templates/default-initial.conf /etc/nginx/conf.d/default.conf
fi

echo "🚀 Starte Nginx..."
exec nginx -g 'daemon off;'
