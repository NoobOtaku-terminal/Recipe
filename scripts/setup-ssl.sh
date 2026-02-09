#!/bin/bash
#
# SSL Certificate Setup Script for cook-off.app
# This script obtains Let's Encrypt SSL certificates using certbot
#

set -e

echo "========================================="
echo "SSL Certificate Setup for cook-off.app"
echo "========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Domain configuration
DOMAIN="cook-off.app"
WWW_DOMAIN="www.cook-off.app"
EMAIL="dhakad.dj9580@gmail.com"  # Change this to your email

# Create required directories
echo "Creating required directories..."
mkdir -p /data/letsencrypt
mkdir -p /data/certbot
mkdir -p /data/postgres_data
mkdir -p /data/media_uploads

# Set permissions
chmod -R 755 /data/letsencrypt
chmod -R 755 /data/certbot

echo ""
echo "========================================="
echo "IMPORTANT: Before proceeding, ensure:"
echo "1. DNS A records for $DOMAIN and $WWW_DOMAIN point to this server"
echo "2. Ports 80 and 443 are open in firewall"
echo "3. No other service is using port 80 or 443"
echo "========================================="
echo ""

read -p "Have you completed the above steps? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Setup cancelled. Please complete the steps and run again."
    exit 0
fi

# Stop nginx if running
echo "Stopping nginx temporarily..."
docker compose stop nginx certbot || true

# Obtain SSL certificate
echo ""
echo "Obtaining SSL certificate from Let's Encrypt..."
echo "This may take a few minutes..."
echo ""

docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN \
    -d $WWW_DOMAIN

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificate obtained successfully!"
    echo ""
    echo "Certificate location: /data/letsencrypt/live/$DOMAIN/"
    echo ""
    
    # Restart services
    echo "Restarting services with HTTPS enabled..."
    docker compose up -d
    
    echo ""
    echo "========================================="
    echo "✅ SSL Setup Complete!"
    echo "========================================="
    echo ""
    echo "Your site is now accessible at:"
    echo "  - https://$DOMAIN"
    echo "  - https://$WWW_DOMAIN"
    echo ""
    echo "HTTP traffic will automatically redirect to HTTPS"
    echo ""
    echo "Certificate will auto-renew every 12 hours"
    echo ""
else
    echo ""
    echo "❌ SSL certificate generation failed!"
    echo ""
    echo "Common issues:"
    echo "1. DNS not pointing to this server"
    echo "2. Firewall blocking port 80"
    echo "3. Another service using port 80"
    echo ""
    echo "Please fix the issue and run this script again"
    exit 1
fi
