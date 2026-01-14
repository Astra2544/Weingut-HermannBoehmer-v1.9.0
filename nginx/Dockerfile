FROM nginx:alpine

# Nur die Config-Templates kopieren (NICHT alle ins conf.d!)
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default-initial.conf /etc/nginx/templates/default-initial.conf
COPY conf.d/default-ssl.conf /etc/nginx/templates/default-ssl.conf
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    mkdir -p /var/www/certbot /etc/nginx/templates /etc/nginx/conf.d

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
