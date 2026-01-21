#!/bin/bash
# Quick fix for docker-compose.prod.yml on Azure server

cd /home/recipe/Recipe

# Backup current file
cp docker-compose.prod.yml docker-compose.prod.yml.backup

# Remove version line and fix replicas issue
cat > docker-compose.prod.yml << 'EOF'
# Production overrides for docker-compose.yml
# Usage: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  migrations:
    build:
      context: ./database
      dockerfile: Dockerfile.migrations.prod
    environment:
      NODE_ENV: production
      SEED_DATABASE: 'false'
    volumes:
      - ./database/migrations:/migrations:ro
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    environment:
      NODE_ENV: production
      LOG_LEVEL: warn
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "2"

  nginx:
    ports:
      - "80:80"
      - "443:443"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  postgres_data:
    driver: local
  media_uploads:
    driver: local
EOF

echo "✅ docker-compose.prod.yml fixed!"
echo "Backup saved as: docker-compose.prod.yml.backup"
EOF
chmod +x fix-docker-compose.sh
echo "Created fix-docker-compose.sh"
