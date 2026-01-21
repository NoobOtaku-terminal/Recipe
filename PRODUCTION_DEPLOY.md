# Production Deployment Quick Reference

## Files Created for Production:

1. ✅ `database/Dockerfile.migrations.prod` - Production migrations (no seeds required)
2. ✅ `docs/AZURE_DEPLOYMENT.md` - Complete Azure deployment guide
3. ✅ `.gitignore` updated - Migration files are now committed to repo

## What's in Git (will be on Azure):

- ✅ Migration files: `database/migrations/*.sql`
- ❌ Seed files: `database/seeds/*.sql` (ignored)
- ✅ Production Dockerfile: `database/Dockerfile.migrations.prod`
- ✅ Production compose: `docker-compose.prod.yml`

## Deploy on Azure VM:

```bash
# 1. Clone repository on Azure
git clone <your-repo-url>
cd Recipe

# 2. Create .env file with production settings
nano .env
# Add your production environment variables

# 3. Deploy with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Key Points:

- **Seeds are NOT needed** in production (only for local development)
- **Migrations WILL run** (they're in git repo)
- **Production uses** `Dockerfile.migrations.prod` (no seeds dependency)
- **Auto-skips seeding** when `NODE_ENV=production`

## Verify Deployment:

```bash
# Check all containers are running
docker-compose ps

# View migration logs
docker-compose logs migrations

# Check backend health
curl http://localhost:3000/api/health

# Check frontend
curl http://localhost
```

## If you need test data in production:

Create it manually via API or admin panel, NOT via seed files.
