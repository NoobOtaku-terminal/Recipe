# ✅ Production Deployment Checklist

## Before Deploying to Azure

### 1️⃣ Environment Variables (.env file)

Create `.env` on your Azure VM with these values:

| Variable            | Development       | Production                             | Required? |
| ------------------- | ----------------- | -------------------------------------- | --------- |
| `NODE_ENV`          | `development`     | **`production`**                       | ✅ YES    |
| `VITE_APP_ENV`      | `development`     | **`production`**                       | ✅ YES    |
| `SEED_DATABASE`     | `true`            | **`false`**                            | ✅ YES    |
| `POSTGRES_PASSWORD` | Any               | **Strong password**                    | ✅ YES    |
| `JWT_SECRET`        | Any               | **Generated secret**                   | ✅ YES    |
| `CORS_ORIGIN`       | `*`               | **`https://yourdomain.com`**           | ✅ YES    |
| `LOG_LEVEL`         | `debug` or `info` | **`warn` or `error`**                  | ✅ YES    |
| `VITE_API_URL`      | `/api`            | `/api` or `https://yourdomain.com/api` | ✅ YES    |

### 2️⃣ Generate Secure Credentials

```bash
# Generate strong database password (16 characters)
openssl rand -base64 16

# Generate JWT secret (32 characters)
openssl rand -base64 32
```

### 3️⃣ Update .env File on Azure

```bash
# SSH into your Azure VM
ssh azureuser@YOUR_AZURE_IP

# Navigate to project
cd Recipe

# Create production .env
nano .env
```

Paste this template and replace the values:

```env
# DATABASE
POSTGRES_USER=recipeuser
POSTGRES_PASSWORD=YOUR_GENERATED_PASSWORD_HERE
POSTGRES_DB=recipedb
DATABASE_URL=postgresql://recipeuser:YOUR_GENERATED_PASSWORD_HERE@postgres:5432/recipedb

# BACKEND
NODE_ENV=production
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE
JWT_EXPIRY=7d
PORT=3000

# MEDIA
MEDIA_UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SECURITY
CORS_ORIGIN=https://yourdomain.com  # or http://YOUR_AZURE_IP for testing

# LOGGING
LOG_LEVEL=warn

# FRONTEND
VITE_API_URL=/api
VITE_APP_ENV=production

# NGINX
HTTP_PORT=80
HTTPS_PORT=443

# PRODUCTION SETTINGS
SEED_DATABASE=false
DEBUG=false
```

### 4️⃣ Verify Files Exist on Azure

```bash
# Check migrations are in repo
ls -la database/migrations/
# Should show: 001_initial_schema.sql, 002_indexes.sql, etc.

# Check production Dockerfile exists
ls -la database/Dockerfile.migrations.prod
# Should exist ✅

# Check seeds are NOT in repo (this is correct)
ls -la database/seeds/
# Should NOT exist on Azure (only local) ✅
```

### 5️⃣ Deploy to Production

```bash
# On Azure VM, run:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 6️⃣ Verify Deployment

```bash
# Check all containers are running
docker-compose ps
# Expected:
# ✅ recipe_postgres    (healthy)
# ✅ recipe_migrations  (exited 0)
# ✅ recipe_backend     (healthy)
# ✅ recipe_frontend    (up)
# ✅ recipe_nginx       (up)

# Check migration logs
docker-compose logs migrations
# Should see: "🎉 All migrations completed successfully!"
# Should see: "⏭️ Skipping seed data (production mode or disabled)"

# Check backend is responding
curl http://localhost/api/health
# Should return: {"status":"healthy",...}

# Check frontend is serving
curl http://localhost
# Should return HTML

# Check database
docker exec recipe_postgres psql -U recipeuser -d recipedb -c "\dt"
# Should show all tables created by migrations
```

### 7️⃣ Security Hardening (Recommended)

```bash
# Update CORS to specific domain (not *)
# Edit .env and change:
CORS_ORIGIN=https://yourdomain.com  # Replace with your actual domain

# Restart backend for CORS change
docker-compose restart backend

# Set up SSL/HTTPS with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 8️⃣ Monitoring & Logs

```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f nginx

# Check resource usage
docker stats

# Check disk space
df -h
```

## ⚠️ Common Issues & Solutions

### Issue: "COPY seeds /seeds: not found"

**Solution:** Use production docker-compose file:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Issue: "CORS error" in browser

**Solution:** Update CORS_ORIGIN in .env:

```env
CORS_ORIGIN=https://yourdomain.com  # Match your frontend domain
```

Then restart: `docker-compose restart backend`

### Issue: Backend can't connect to database

**Solution:** Check DATABASE_URL matches POSTGRES_PASSWORD:

```bash
# Both should have the same password
grep POSTGRES_PASSWORD .env
grep DATABASE_URL .env
```

### Issue: Frontend shows "Network Error"

**Solution:** Check VITE_API_URL:

- If same domain: `VITE_API_URL=/api`
- If different: `VITE_API_URL=https://api.yourdomain.com/api`

Then rebuild frontend: `docker-compose up -d --build frontend`

## 📋 Post-Deployment Tasks

- [ ] Create admin user via API
- [ ] Test user registration
- [ ] Test login/logout
- [ ] Test recipe creation
- [ ] Test file uploads
- [ ] Set up database backups
- [ ] Configure monitoring/alerts
- [ ] Set up auto-renewal for SSL certificate

## 🔐 Security Best Practices

1. **Never** commit `.env` to git
2. **Always** use strong passwords (16+ characters)
3. **Always** set `CORS_ORIGIN` to your domain (not `*`)
4. **Always** use HTTPS in production
5. **Regularly** backup your database
6. **Monitor** logs for suspicious activity
7. **Update** Docker images regularly

## 📞 Emergency Commands

```bash
# Stop all containers
docker-compose down

# Backup database NOW
docker exec recipe_postgres pg_dump -U recipeuser recipedb > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# View last 100 error logs
docker-compose logs --tail=100 backend | grep ERROR

# Restart specific service
docker-compose restart backend

# Full reset (⚠️ DELETES ALL DATA)
docker-compose down -v
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## ✅ Deployment Complete!

Your Recipe Battle Platform is now live on Azure! 🎉

Access your app at: `http://YOUR_AZURE_IP` or `https://yourdomain.com`
