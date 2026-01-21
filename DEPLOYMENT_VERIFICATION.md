# Production Deployment Verification Checklist

This file ensures all necessary files are in git for successful production deployment.

## Files That MUST Be in Git (Already Tracked ✅)

### Docker Configuration
- ✅ `docker-compose.yml` - Base configuration
- ✅ `docker-compose.prod.yml` - Production overrides
- ✅ `backend/Dockerfile` - Backend image
- ✅ `frontend/Dockerfile` - Frontend image
- ✅ `nginx/Dockerfile` - Nginx image
- ✅ `database/Dockerfile.migrations` - Development migrations
- ✅ `database/Dockerfile.migrations.prod` - **Production migrations (NO SEEDS)**

### Database Migrations (Required for Schema)
- ✅ `database/migrations/001_initial_schema.sql`
- ✅ `database/migrations/002_indexes.sql`
- ✅ `database/migrations/003_triggers.sql`
- ✅ `database/migrations/004_views.sql`
- ✅ `database/migrations/005_battle_proof_and_admin.sql`
- ✅ `database/migrations/006_update_admin_statistics.sql`
- ✅ `database/migrations/007_user_progression.sql`
- ✅ `database/migrations/008_video_proof_enhancements.sql`

### Package Lock Files (Required for Docker Builds)
- ✅ `backend/package-lock.json` - Backend dependencies
- ✅ `frontend/package-lock.json` - Frontend dependencies
- ✅ `database/package-lock.json` - Migration dependencies

### Environment Templates
- ✅ `.env.example` - Development template
- ✅ `.env.production.template` - Production template

## Files That MUST NOT Be in Git (Ignored ✅)

### Secrets
- ❌ `.env` - Contains production passwords/secrets
- ❌ `.env.local`, `.env.production` - Local overrides
- ❌ `*.pem`, `*.key` - SSL certificates, SSH keys

### Generated/Runtime Files
- ❌ `node_modules/` - npm packages (installed via package-lock.json)
- ❌ `dist/`, `build/` - Build outputs
- ❌ `logs/` - Application logs
- ❌ `postgres_data/` - Database data
- ❌ `uploads/`, `media/` - User uploaded files

### Development Only
- ❌ `database/seeds/*.sql` - Test data (NOT for production)

## Fresh Deployment Test

To test if deployment will work on a fresh server:

```bash
# Simulate fresh clone
cd /tmp
git clone https://github.com/NoobOtaku-terminal/Recipe.git test-deploy
cd test-deploy

# Check all required files exist
echo "Checking migrations..."
ls -1 database/migrations/*.sql | wc -l
# Should show: 8

echo "Checking package-lock files..."
ls -1 */package-lock.json database/package-lock.json | wc -l
# Should show: 3

echo "Checking Dockerfiles..."
ls -1 */Dockerfile database/Dockerfile.migrations* | wc -l
# Should show: 5

echo "Checking docker-compose files..."
ls -1 docker-compose*.yml | wc -l
# Should show: 2

# Create .env file
cp .env.production.template .env
nano .env  # Edit with your values

# Deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Should work without errors!
```

## What to Do Before Pushing Code

1. **Test locally first:**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

2. **Check git status:**
   ```bash
   git status
   # Make sure no .env or secrets are staged
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

4. **Deploy on server:**
   ```bash
   cd /home/recipe/Recipe
   git pull
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

## Common Deployment Errors (Prevented)

### ❌ Error: "COPY migrations /migrations: not found"
**Cause:** Migrations not in git  
**Fix:** We force-added them with `git add -f database/migrations/*.sql` ✅

### ❌ Error: "npm ci requires package-lock.json"
**Cause:** package-lock.json not in git  
**Fix:** We removed package-lock.json from .gitignore ✅

### ❌ Error: "COPY seeds /seeds: not found"
**Cause:** Using wrong Dockerfile in production  
**Fix:** Production uses Dockerfile.migrations.prod (no seeds) ✅

### ❌ Error: "can't set container_name and replicas"
**Cause:** replicas: 2 in production compose  
**Fix:** Removed replicas from docker-compose.prod.yml ✅

## Verification Commands

Run these to ensure everything is ready:

```bash
# Verify migrations in git
git ls-files database/migrations/*.sql

# Verify package-lock in git
git ls-files | grep package-lock.json

# Verify production Dockerfile exists
git ls-files database/Dockerfile.migrations.prod

# Verify no secrets in git
git ls-files | grep -E "(\.env$|password|secret)" || echo "✅ No secrets found"

# Verify .gitignore is correct
git check-ignore database/migrations/001_initial_schema.sql && echo "❌ Migrations ignored!" || echo "✅ Migrations tracked"
git check-ignore backend/package-lock.json && echo "❌ package-lock ignored!" || echo "✅ package-lock tracked"
git check-ignore .env && echo "✅ .env ignored" || echo "❌ .env tracked!"
```

## Last Updated
January 21, 2026 - All files verified and tested
