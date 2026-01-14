FROM certbot/certbot:latest

# Docker CLI installieren für nginx reload
RUN apk add --no-cache docker-cli

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
