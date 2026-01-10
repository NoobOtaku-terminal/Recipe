# Quick Start Guide

Get the Recipe Battle Platform running in minutes.

## 🚀 Local Development (One Command)

### Prerequisites

- Docker & Docker Compose installed
- 8 GB RAM minimum
- Ports 80, 3000, 5432 available

### Start Everything

```bash
# Clone repository
git clone <your-repo-url>
cd Recipe

# Copy environment file
cp .env.example .env

# Start all services (builds images, runs migrations, seeds data)
docker-compose up -d

# Wait for services to be healthy (30-60 seconds)
docker-compose ps
```

**Access the application:**

- Frontend: http://localhost
- Backend API: http://localhost/api
- API Health: http://localhost/api/health

### Test Accounts (Development)

```
Username: johndoe
Password: password123

Username: janechef
Password: password123

Username: mikecook
Password: password123
```

### Stop Everything

```bash
docker-compose down

# Remove all data (fresh start)
docker-compose down -v
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Nginx (Port 80)                    │
│              Reverse Proxy + Load Balancer              │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
             ▼                            ▼
    ┌────────────────┐          ┌─────────────────┐
    │   Frontend     │          │    Backend      │
    │   React SPA    │          │  Express API    │
    │   (Port 5173)  │          │  (Port 3000)    │
    └────────────────┘          └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │   PostgreSQL    │
                                │  (Port 5432)    │
                                └─────────────────┘
```

## 📦 Services

### PostgreSQL Database

- **Image**: postgres:15-alpine
- **Port**: 5432 (internal only)
- **Data**: Persistent volume `postgres_data`
- **Health**: `pg_isready` check every 10s

### Migration Runner

- **Image**: Custom Node.js
- **Purpose**: Run versioned SQL migrations
- **Behavior**: Runs once at startup, exits when complete
- **Migrations**: `/database/migrations/001-004`

### Backend API

- **Image**: Custom Node.js
- **Port**: 3000 (internal only)
- **Endpoints**: `/api/auth`, `/api/recipes`, `/api/ratings`, etc.
- **Health**: `/api/health` and `/api/health/db`

### Frontend

- **Image**: Custom React + Nginx
- **Port**: 5173 (internal only)
- **Build**: Vite production build
- **Serves**: Static files + SPA routing

### Nginx Reverse Proxy

- **Image**: nginx:alpine
- **Port**: 80 (external)
- **Routes**:
  - `/` → Frontend
  - `/api/*` → Backend
  - `/uploads/*` → Backend static files

## 🛠️ Development Workflow

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Service

```bash
# Restart backend (after code changes)
docker-compose restart backend

# Rebuild and restart (after dependency changes)
docker-compose up -d --build backend
```

### Access Database

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U recipeuser -d recipedb

# Run SQL file
docker-compose exec -T postgres psql -U recipeuser -d recipedb < script.sql

# Backup database
docker-compose exec -T postgres pg_dump -U recipeuser recipedb > backup.sql
```

### Run Migrations

```bash
# Migrations run automatically on startup
# To manually re-run:
docker-compose run --rm migrations
```

### Seed Development Data

```bash
# Seed data loads automatically in dev mode
# To manually re-seed:
docker-compose exec -T postgres psql -U recipeuser -d recipedb < database/seeds/dev_seed.sql
```

### Check Health

```bash
# All services
./scripts/health-check.sh http://localhost

# Manual checks
curl http://localhost/health
curl http://localhost/api/health
curl http://localhost/api/health/db
```

## 🧪 Testing the Platform

### 1. Register New User

```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "display_name": "Test User"
  }'
```

**Response:**

```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1..."
}
```

### 2. Login

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. Get Recipes

```bash
curl http://localhost/api/recipes
```

### 4. Create Recipe (with token)

```bash
TOKEN="<your-token>"

curl -X POST http://localhost/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My Test Recipe",
    "description": "A delicious test",
    "difficulty": "easy",
    "prep_time": 10,
    "cook_time": 20,
    "servings": 4,
    "is_vegetarian": true,
    "ingredients": [
      {
        "name": "Test Ingredient",
        "quantity": "100",
        "unit": "grams"
      }
    ],
    "steps": [
      {
        "step_number": 1,
        "instruction": "Mix ingredients",
        "estimated_time": 5
      }
    ],
    "cuisines": ["italian"]
  }'
```

### 5. Rate Recipe

```bash
curl -X POST http://localhost/api/ratings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "recipe_id": "<recipe-uuid>",
    "rating": 5,
    "review_text": "Excellent recipe!"
  }'
```

### 6. Post Comment

```bash
curl -X POST http://localhost/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "recipe_id": "<recipe-uuid>",
    "comment_text": "Great recipe, worked perfectly!",
    "is_verified_recreation": false
  }'
```

## 📱 Frontend Features

### Available Pages

1. **Home** (`/`) - Landing page with platform overview
2. **Recipes** (`/recipes`) - Browse all recipes with filters
3. **Recipe Detail** (`/recipes/:id`) - Full recipe view
4. **Create Recipe** (`/recipes/new`) - Submit new recipe
5. **Battles** (`/battles`) - Browse competitions
6. **Battle Detail** (`/battles/:id`) - Vote in battle
7. **Leaderboard** (`/leaderboard`) - Judge rankings
8. **Profile** (`/profile/:username`) - User profile
9. **Login** (`/login`) - Authentication
10. **Register** (`/register`) - Account creation

### Features Demonstrated

- ✅ User authentication (JWT)
- ✅ Recipe CRUD operations
- ✅ Rating system (1-5 stars)
- ✅ Threaded comments
- ✅ Verified recreation with media
- ✅ Recipe battles with voting
- ✅ Judge credibility system
- ✅ User profiles with stats
- ✅ Leaderboard
- ✅ Badge system

## 🔧 Troubleshooting

### Services won't start

```bash
# Check Docker is running
docker ps

# Check port conflicts
sudo netstat -tulpn | grep -E ':(80|3000|5432)'

# View detailed logs
docker-compose logs

# Restart from scratch
docker-compose down -v
docker-compose up -d
```

### Database connection errors

```bash
# Check postgres is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify connection inside container
docker-compose exec backend node -e "require('./src/config/database').pool.query('SELECT NOW()')"
```

### Frontend not loading

```bash
# Check nginx logs
docker-compose logs nginx

# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Migrations failing

```bash
# Check migration logs
docker-compose logs migrations

# Check postgres is ready
docker-compose exec postgres pg_isready

# Manually run migrations
docker-compose run --rm migrations
```

## 📊 Monitoring

### Container Status

```bash
# List all containers
docker-compose ps

# Real-time stats
docker stats

# Service health
docker-compose ps --services --filter "status=running"
```

### Resource Usage

```bash
# Disk usage
docker system df

# Container sizes
docker-compose images

# Volume sizes
docker volume ls
```

### Performance

```bash
# Backend response time
time curl http://localhost/api/recipes

# Database query time
docker-compose exec postgres psql -U recipeuser -d recipedb -c "\timing" -c "SELECT COUNT(*) FROM recipes;"
```

## 🚀 Production Deployment

See detailed guides:

- **[AWS EC2 Deployment](docs/DEPLOYMENT.md)** - Complete production setup
- **[API Documentation](docs/API.md)** - REST API reference
- **[Database Guide](docs/DATABASE.md)** - Schema and management
- **[Architecture Details](docs/ARCHITECTURE.md)** - System design

### Quick Production Deploy

```bash
# 1. Launch EC2 instance (t3.medium recommended)
# 2. Clone repository to local machine
# 3. Make scripts executable
chmod +x scripts/*.sh

# 4. Setup EC2 instance
./scripts/setup-ec2.sh <instance-ip> <key-file.pem>

# 5. Configure environment
# SSH into instance, edit /home/ubuntu/recipe/.env

# 6. Deploy application
./scripts/deploy-aws.sh <instance-ip> <key-file.pem>

# 7. Verify deployment
./scripts/health-check.sh http://<instance-ip>
```

## 📚 Additional Resources

### Documentation

- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment
- [API.md](docs/API.md) - API documentation
- [DATABASE.md](docs/DATABASE.md) - Database schema

### Configuration Files

- `.env.example` - Environment variables template
- `docker-compose.yml` - Development orchestration
- `docker-compose.prod.yml` - Production overrides

### External Links

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)

## 🆘 Support

### Common Issues

**Port 80 already in use:**

```bash
# Find process using port 80
sudo lsof -i :80

# Stop nginx if running
sudo systemctl stop nginx

# Or change port in docker-compose.yml
ports:
  - "8080:80"
```

**Docker permission denied:**

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Out of disk space:**

```bash
# Clean up Docker
docker system prune -a --volumes
```

### Getting Help

1. Check logs: `docker-compose logs`
2. Verify health: `./scripts/health-check.sh`
3. Review documentation in `/docs/`
4. Check GitHub issues

## 🎯 Next Steps

After successful setup:

1. ✅ Explore the frontend at http://localhost
2. ✅ Test API endpoints with Postman/cURL
3. ✅ Review database schema in `/docs/DATABASE.md`
4. ✅ Customize environment variables in `.env`
5. ✅ Add your own recipes and test features
6. ✅ Deploy to production using deployment guides
7. ✅ Set up SSL with Let's Encrypt
8. ✅ Configure automated backups
9. ✅ Set up monitoring and alerts

## ✨ Features to Explore

- **Recipe Management**: Create, edit, delete recipes
- **Smart Ratings**: Rate recipes 1-5 stars with reviews
- **Verified Comments**: Upload photos of your recreation
- **Recipe Battles**: Compete with other recipes
- **Judge Credibility**: Build reputation through verified recreations
- **Leaderboard**: See top-rated judges
- **User Profiles**: View stats and achievements
- **Badge System**: Earn achievements
- **Search & Filters**: Find recipes by cuisine, difficulty, dietary preferences

**Enjoy building your recipe community! 🍳👨‍🍳**
