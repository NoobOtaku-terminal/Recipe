# 🚀 Quick Production Values Reference

## Environment Variables for Production

### Required Changes

```env
# Change these from development to production:
NODE_ENV=production              # Was: development
VITE_APP_ENV=production         # Was: development
SEED_DATABASE=false             # Was: true

# Generate new secure values:
POSTGRES_PASSWORD=<use: openssl rand -base64 16>
JWT_SECRET=<use: openssl rand -base64 32>

# Security:
CORS_ORIGIN=https://yourdomain.com    # Was: *
LOG_LEVEL=warn                         # Was: info or debug
```

### Keep These Settings

```env
# These stay the same:
POSTGRES_USER=recipeuser
POSTGRES_DB=recipedb
DATABASE_URL=postgresql://recipeuser:<PASSWORD>@postgres:5432/recipedb
PORT=3000
VITE_API_URL=/api
JWT_EXPIRY=7d
MEDIA_UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
HTTP_PORT=80
HTTPS_PORT=443
DEBUG=false
```

## Summary Table

| Variable            | Value for Production |
| ------------------- | -------------------- |
| `NODE_ENV`          | `production`         |
| `VITE_APP_ENV`      | `production`         |
| `SEED_DATABASE`     | `false`              |
| `LOG_LEVEL`         | `warn` or `error`    |
| `CORS_ORIGIN`       | Your domain or IP    |
| `POSTGRES_PASSWORD` | Strong password      |
| `JWT_SECRET`        | Generated secret     |

## Deploy Command

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Verify Production Mode

```bash
# Check NODE_ENV is set to production
docker-compose exec backend printenv NODE_ENV
# Should output: production

# Check seeds are skipped
docker-compose logs migrations | grep -i seed
# Should show: "Skipping seed data (production mode or disabled)"
```

## Files Checked ✅

- ✅ `.env.example` - Updated with Vite variables and production notes
- ✅ `.env.production.template` - Production-ready template
- ✅ `docker-compose.prod.yml` - Uses production Dockerfile
- ✅ `Dockerfile.migrations.prod` - No seeds dependency
- ✅ `.gitignore` - Migrations included, seeds excluded
- ✅ `PRODUCTION_CHECKLIST.md` - Complete deployment guide
- ✅ Backend server.js - Reads NODE_ENV correctly
- ✅ Frontend api.js - Uses VITE_API_URL correctly
