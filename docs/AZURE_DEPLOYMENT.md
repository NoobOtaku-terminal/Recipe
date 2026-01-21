# Azure Production Deployment Guide

## Prerequisites

- Azure account with active subscription
- Azure CLI installed locally
- Docker and Docker Compose installed on Azure VM
- Git repository pushed to GitHub/Azure DevOps

## Quick Deploy to Azure

### Option 1: Azure Container Instances (Recommended for Quick Start)

```bash
# 1. Login to Azure
az login

# 2. Create resource group
az group create --name recipe-rg --location eastus

# 3. Create Azure Container Registry
az acr create --resource-group recipe-rg --name recipeacr --sku Basic

# 4. Build and push images (from your local machine or CI/CD)
az acr login --name recipeacr
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker tag recipe-backend recipeacr.azurecr.io/recipe-backend:latest
docker tag recipe-frontend recipeacr.azurecr.io/recipe-frontend:latest
docker tag recipe-nginx recipeacr.azurecr.io/recipe-nginx:latest
docker push recipeacr.azurecr.io/recipe-backend:latest
docker push recipeacr.azurecr.io/recipe-frontend:latest
docker push recipeacr.azurecr.io/recipe-nginx:latest
```

### Option 2: Azure VM with Docker Compose (Full Control)

```bash
# 1. Create Ubuntu VM
az vm create \
  --resource-group recipe-rg \
  --name recipe-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard

# 2. Open ports for HTTP/HTTPS
az vm open-port --port 80 --resource-group recipe-rg --name recipe-vm
az vm open-port --port 443 --resource-group recipe-rg --name recipe-vm

# 3. SSH into VM
ssh azureuser@<VM_PUBLIC_IP>

# 4. Install Docker on VM
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# 5. Clone your repository
git clone <your-repo-url>
cd Recipe

# 6. Create production .env file
cat > .env << 'EOF'
# Database
POSTGRES_USER=recipeuser
POSTGRES_PASSWORD=<STRONG_PASSWORD_HERE>
POSTGRES_DB=recipedb
DATABASE_URL=postgresql://recipeuser:<STRONG_PASSWORD_HERE>@postgres:5432/recipedb

# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=<GENERATE_STRONG_SECRET>
JWT_EXPIRES_IN=7d
LOG_LEVEL=info

# Frontend
VITE_API_URL=http://<YOUR_DOMAIN_OR_IP>/api

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# 7. Deploy with production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 8. Check logs
docker-compose logs -f
```

## Important: Since SQL files are in .gitignore

### What gets deployed to production:

✅ Migration files (database/migrations/_.sql) - **NOT ignored**
❌ Seed files (database/seeds/_.sql) - **Ignored by .gitignore**

### Solution implemented:

1. **Production Dockerfile** (`Dockerfile.migrations.prod`):
   - Only copies `migrations/` directory
   - Creates empty `/seeds` directory
   - No dependency on seed files

2. **Production Compose** (`docker-compose.prod.yml`):
   - Uses `Dockerfile.migrations.prod`
   - Sets `NODE_ENV=production`
   - Sets `SEED_DATABASE=false`
   - No volume mount for seeds

3. **Migration Script** (`run-migrations.js`):
   - Automatically skips seeding in production mode
   - Only runs seeds if `NODE_ENV=development` AND database is empty

## Deploy Command on Azure VM

```bash
# On your Azure VM, always use this command:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

This ensures:

- Production Dockerfile is used for migrations
- No seed files are required
- Production environment variables are set

## Environment Variables Checklist

Make sure these are set in your `.env` on Azure:

```env
# Required for production
NODE_ENV=production
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<generate-with: openssl rand -base64 32>
DATABASE_URL=postgresql://recipeuser:<password>@postgres:5432/recipedb
VITE_API_URL=http://<your-azure-vm-ip-or-domain>/api
```

## Database Backup on Azure

```bash
# Backup
docker exec recipe_postgres pg_dump -U recipeuser recipedb > backup_$(date +%Y%m%d).sql

# Restore (if needed)
docker exec -i recipe_postgres psql -U recipeuser recipedb < backup_20260121.sql
```

## Monitoring

```bash
# Check all containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f nginx

# Check resource usage
docker stats
```

## SSL/HTTPS Setup (Optional but Recommended)

```bash
# Install certbot on Azure VM
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

## Troubleshooting

### If migrations fail on first deploy:

```bash
# Check migration container logs
docker-compose logs migrations

# Manually run migrations
docker-compose run --rm migrations

# Check database connection
docker exec recipe_postgres psql -U recipeuser -d recipedb -c "SELECT version();"
```

### If seeds directory error appears:

This should NOT happen with production Dockerfile, but if it does:

```bash
# The production Dockerfile creates an empty /seeds directory
# Verify the correct Dockerfile is being used:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml config | grep -A 5 migrations
```

## CI/CD with GitHub Actions (Optional)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Azure VM
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.AZURE_VM_IP }}
          username: azureuser
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd Recipe
            git pull
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Cost Optimization

- Use Azure B-series burstable VMs for small workloads
- Consider Azure Database for PostgreSQL (managed service)
- Use Azure CDN for static assets
- Set up auto-shutdown for non-production environments
