#!/bin/sh
# ============================================================
# Certbot Auto-Renewal - Hermann Böhmer Shop
# Prüft alle 12 Stunden und lädt Nginx nach Erneuerung neu
# ============================================================

echo "========================================"
echo "  🔄 Certbot Auto-Renewal Service"
echo "  Prüft alle 12 Stunden"
echo "========================================"

# Funktion: Nginx neu laden
reload_nginx() {
    echo "🔄 Lade Nginx neu..."
    
    # Finde nginx container
    NGINX_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '^nginx|_nginx' | head -1)
    
    if [ -n "$NGINX_CONTAINER" ]; then
        docker exec "$NGINX_CONTAINER" nginx -s reload 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Nginx erfolgreich neu geladen!"
        else
            echo "⚠️  Nginx reload fehlgeschlagen"
        fi
    else
        echo "⚠️  Nginx Container nicht gefunden"
    fi
}

# Endlosschleife für Renewal
trap exit TERM

while true; do
    echo ""
    echo "[$(date)] Prüfe Zertifikate..."
    
    # Certbot renewal mit deploy-hook
    certbot renew --quiet --deploy-hook "echo 'Zertifikat erneuert!'"
    
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
        # Prüfe ob tatsächlich erneuert wurde (exit 0 heißt nicht immer Erneuerung)
        if certbot certificates 2>/dev/null | grep -q "VALID"; then
            echo "✅ Zertifikate OK"
            # Nginx vorsichtshalber neu laden
            reload_nginx
        fi
    else
        echo "⚠️  Renewal check fehlgeschlagen"
    fi
    
    echo "[$(date)] Nächste Prüfung in 12 Stunden..."
    echo ""
    
    # 12 Stunden warten
    sleep 12h &
    wait $!
done
