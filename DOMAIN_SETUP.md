# Domain & HTTPS Setup Guide

## 🌐 Domain: cook-off.app

This guide walks you through configuring your domain with HTTPS/SSL certificates.

---

## Prerequisites

- Domain: `cook-off.app` registered
- Azure VM IP: `20.205.129.101`
- SSH access to the server
- Ports 80 and 443 open in Azure Network Security Group

---

## Step 1: Configure DNS Records

Add the following DNS A records in your domain registrar:

| Type | Name | Value          | TTL  |
| ---- | ---- | -------------- | ---- |
| A    | @    | 20.205.129.101 | 3600 |
| A    | www  | 20.205.129.101 | 3600 |

**Verify DNS propagation:**

```bash
# Check from your local machine
nslookup cook-off.app
nslookup www.cook-off.app

# Or use online tools
# https://dnschecker.org
```

⏱️ DNS propagation can take 5 minutes to 48 hours

---

## Step 2: Update Environment Variables

On your Azure VM, update the production `.env` file:

```bash
cd ~/Recipe
nano .env
```

Update the following variables:

```env
# Change this:
CORS_ORIGIN=*

# To this:
CORS_ORIGIN=https://cook-off.app,https://www.cook-off.app
```

Save and exit (Ctrl+X, Y, Enter)

---

## Step 3: Deploy Updated Code

```bash
cd ~/Recipe
git pull origin main
```

---

## Step 4: Create Required Directories

```bash
sudo mkdir -p /data/letsencrypt
sudo mkdir -p /data/certbot
sudo mkdir -p /data/postgres_data
sudo mkdir -p /data/media_uploads

sudo chmod -R 755 /data/letsencrypt
sudo chmod -R 755 /data/certbot
```

---

## Step 5: Configure Azure Firewall

In Azure Portal:

1. Go to your VM → Networking → Network Security Group
2. Add inbound security rules:

| Port | Protocol | Source   | Priority | Name        |
| ---- | -------- | -------- | -------- | ----------- |
| 80   | TCP      | Internet | 100      | Allow-HTTP  |
| 443  | TCP      | Internet | 110      | Allow-HTTPS |

---

## Step 6: Obtain SSL Certificate

Run the automated setup script:

```bash
cd ~/Recipe
sudo ./scripts/setup-ssl.sh
```

This script will:

- ✅ Check prerequisites
- ✅ Obtain Let's Encrypt SSL certificate
- ✅ Configure automatic renewal
- ✅ Start all services with HTTPS

**OR manually obtain the certificate:**

```bash
# Stop nginx temporarily
docker compose stop nginx certbot

# Obtain certificate
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d cook-off.app \
    -d www.cook-off.app

# Start all services
docker compose up -d
```

---

## Step 7: Verify HTTPS Setup

### Test HTTP Redirect:

```bash
curl -I http://cook-off.app
```

Should return `301 Moved Permanently` to HTTPS

### Test HTTPS:

```bash
curl -I https://cook-off.app
```

Should return `200 OK`

### Check SSL Certificate:

```bash
openssl s_client -connect cook-off.app:443 -servername cook-off.app
```

Look for: `Verify return code: 0 (ok)`

### Browser Test:

1. Open https://cook-off.app in browser
2. Check for 🔒 lock icon in address bar
3. Click lock → Certificate is valid

---

## Certificate Auto-Renewal

The certbot service automatically renews certificates every 12 hours.

**Check renewal logs:**

```bash
docker compose logs certbot
```

**Manual renewal test:**

```bash
docker compose run --rm certbot renew --dry-run
```

---

## Security Features Enabled

✅ **HTTPS/SSL** - Let's Encrypt TLS certificates  
✅ **HTTP → HTTPS Redirect** - All traffic forced to secure  
✅ **HSTS** - HTTP Strict Transport Security with 1-year max-age  
✅ **OCSP Stapling** - Improved certificate validation  
✅ **Modern TLS** - Only TLS 1.2 and TLS 1.3 supported  
✅ **Strong Ciphers** - Modern cipher suites only  
✅ **CSP** - Content Security Policy headers  
✅ **X-Frame-Options** - Clickjacking protection  
✅ **X-XSS-Protection** - XSS attack mitigation  
✅ **CORS** - Configured for production domains only

---

## Troubleshooting

### DNS not resolving

```bash
# Check if DNS is propagated
dig cook-off.app +short
# Should return: 20.205.129.101
```

### Certificate generation fails

**Check DNS first:**

```bash
ping cook-off.app
# Should reach 20.205.129.101
```

**Check port 80 is accessible:**

```bash
curl -I http://cook-off.app
```

**View certbot logs:**

```bash
docker compose logs certbot
```

### Nginx fails to start

**Check nginx configuration:**

```bash
docker compose exec nginx nginx -t
```

**View nginx logs:**

```bash
docker compose logs nginx
```

### HTTPS not working

**Verify certificate exists:**

```bash
sudo ls -la /data/letsencrypt/live/cook-off.app/
```

Should show: `cert.pem`, `chain.pem`, `fullchain.pem`, `privkey.pem`

**Restart nginx:**

```bash
docker compose restart nginx
```

---

## Updating the Application

After pulling new code:

```bash
cd ~/Recipe
git pull origin main

# Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# Check status
docker compose ps
docker compose logs -f
```

---

## SSL Certificate Locations

- **Host:** `/data/letsencrypt/live/cook-off.app/`
- **Container:** `/etc/letsencrypt/live/cook-off.app/`

**Files:**

- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key
- `cert.pem` - Server certificate
- `chain.pem` - CA chain

---

## Production URLs

- **Main Site:** https://cook-off.app
- **WWW:** https://www.cook-off.app
- **API:** https://cook-off.app/api
- **Media:** https://cook-off.app/uploads

All HTTP traffic automatically redirects to HTTPS.

---

## Next Steps

1. ✅ Configure DNS records
2. ✅ Update `.env` file
3. ✅ Run SSL setup script
4. ✅ Test in browser
5. 🎉 Your app is live with HTTPS!

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review docker compose logs
3. Verify all prerequisites are met
4. Ensure DNS is fully propagated

---

**🔒 Your Recipe Battle Platform is now secure with HTTPS!**
