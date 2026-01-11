# Recipe Battle Platform 🍳⚔️

A community-driven social recipe platform with trust-based judging, proof-based feedback, and gamified recipe battles.

## 🏗️ Architecture Overview

### **Complete Tech Stack**

- **Frontend**: React SPA (JavaScript)
- **Backend**: Node.js + Express.js REST API
- **Database**: PostgreSQL 17
- **Reverse Proxy**: Nginx
- **Infrastructure**: Docker + Docker Compose
- **Cloud Target**: AWS EC2
- **Authentication**: JWT
- **Media Storage**: Local filesystem (Docker volume, S3-ready)

### **Service Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS EC2                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Docker Network                      │  │
│  │                                                        │  │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐     │  │
│  │  │  Nginx   │────▶│ Frontend │     │ Backend  │     │  │
│  │  │  :80/443 │     │  React   │◀────│ Express  │     │  │
│  │  └─────┬────┘     └──────────┘     └────┬─────┘     │  │
│  │        │                                  │           │  │
│  │        └──────────────────────────────────┤           │  │
│  │                                           │           │  │
│  │                              ┌────────────▼────────┐  │  │
│  │                              │   PostgreSQL 15     │  │  │
│  │                              │   (Not Exposed)     │  │  │
│  │                              └─────────────────────┘  │  │
│  │                                                        │  │
│  │  Volumes: postgres_data, media_uploads                │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**

- Docker 24.x or later
- Docker Compose 2.x or later
- Git

### **Local Development**

```bash
# Clone repository
git clone <repo-url>
cd Recipe

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Build and start all services
docker-compose up --build

# Access application
# Frontend: http://localhost
# Backend API: http://localhost/api
```

### **First-Time Setup**

The system automatically:

1. Creates PostgreSQL database
2. Runs all migrations
3. Seeds initial data (dev mode only)
4. Starts all services with health checks

## 📁 Repository Structure

```
Recipe/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # API client & auth
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Helper functions
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── nginx.conf           # Production static serving
│
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Business logic
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── services/        # Credibility, battles, media
│   │   └── utils/           # Helpers, validators
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── database/                 # PostgreSQL infrastructure
│   ├── migrations/          # Versioned schema changes
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_indexes.sql
│   │   └── ...
│   ├── seeds/               # Development seed data
│   │   └── dev_seed.sql
│   ├── init/                # Initialization scripts
│   │   └── init.sh
│   └── Dockerfile.migrations
│
├── nginx/                    # Reverse proxy
│   ├── nginx.conf           # Main configuration
│   └── Dockerfile
│
├── scripts/                  # Deployment & utilities
│   ├── deploy-aws.sh        # AWS EC2 deployment
│   ├── backup-db.sh         # Database backup
│   ├── health-check.sh      # Service health validation
│   └── setup-ec2.sh         # EC2 instance setup
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md      # Detailed architecture
│   ├── API.md               # API documentation
│   ├── DEPLOYMENT.md        # AWS deployment guide
│   └── DATABASE.md          # Schema & migrations
│
├── docker-compose.yml        # Orchestration (development)
├── docker-compose.prod.yml   # Production overrides
├── .env.example             # Environment template
├── .dockerignore
├── .gitignore
└── README.md
```

## 🔧 Environment Configuration

### **Required Environment Variables**

```bash
# Database
POSTGRES_USER=recipeuser
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=recipedb
DATABASE_URL=postgresql://recipeuser:<password>@postgres:5432/recipedb

# Backend
JWT_SECRET=<random_64_char_string>
JWT_EXPIRY=7d
NODE_ENV=production
PORT=3000
MEDIA_UPLOAD_PATH=/app/uploads

# Frontend
REACT_APP_API_URL=http://localhost/api

# AWS (Production)
AWS_REGION=us-east-1
AWS_S3_BUCKET=recipe-media-prod  # Future migration
```

## 🐳 Docker Services

### **Service Definitions**

| Service    | Image              | Port    | Healthcheck | Restart |
| ---------- | ------------------ | ------- | ----------- | ------- |
| nginx      | nginx:alpine       | 80, 443 | HTTP check  | always  |
| frontend   | recipe-frontend    | -       | -           | always  |
| backend    | recipe-backend     | -       | /health     | always  |
| postgres   | postgres:15-alpine | -       | pg_isready  | always  |
| migrations | recipe-migrations  | -       | one-time    | no      |

### **Volumes**

- `postgres_data`: PostgreSQL data persistence
- `media_uploads`: User-uploaded media files

### **Networks**

- `recipe_network`: Private bridge network for all services

## 🧪 Development Workflow

### **Running Services Individually**

```bash
# Backend only
docker-compose up backend postgres

# Frontend development (hot reload)
cd frontend && npm run dev

# Database migrations
docker-compose run --rm migrations
```

### **Database Operations**

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U recipeuser -d recipedb

# Backup database
./scripts/backup-db.sh

# Restore database
docker-compose exec -T postgres psql -U recipeuser -d recipedb < backup.sql
```

### **Logs**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

## ☁️ AWS EC2 Deployment

### **Prerequisites**

- AWS account with EC2 access
- Key pair for SSH access
- Security group with ports 22, 80, 443

### **Automated Deployment**

```bash
# Set up EC2 instance
./scripts/setup-ec2.sh <instance-ip> <key.pem>

# Deploy application
./scripts/deploy-aws.sh <instance-ip> <key.pem>
```

### **Manual Deployment Steps**

```bash
# 1. Connect to EC2
ssh -i key.pem ubuntu@<instance-ip>

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone repository
git clone <repo-url> /home/ubuntu/recipe
cd /home/ubuntu/recipe

# 4. Configure environment
cp .env.example .env
nano .env  # Update production values

# 5. Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### **Production Checklist**

- [ ] Update `.env` with secure secrets
- [ ] Configure SSL certificates (Let's Encrypt)
- [ ] Set up CloudWatch logging
- [ ] Attach EBS volume for media storage
- [ ] Configure automated backups
- [ ] Set up monitoring & alerts
- [ ] Enable firewall (only 80, 443, 22)

## 🔐 Security Features

- JWT authentication with secure token storage
- Password hashing with bcrypt
- SQL injection prevention (parameterized queries)
- CORS configuration
- Rate limiting on APIs
- File upload validation
- Internal Docker networking (DB not exposed)
- Environment-based secrets management
- Security headers via Nginx

## 📊 Monitoring & Health Checks

### **Health Endpoints**

```bash
# Backend health
curl http://localhost/api/health

# Database connectivity
curl http://localhost/api/health/db
```

### **Service Status**

```bash
# Check all containers
docker-compose ps

# Service health
./scripts/health-check.sh
```

## 🚀 Scalability Roadmap

### **Current Architecture**

- Single EC2 instance
- Local file storage
- Single backend container

### **Horizontal Scaling Path**

1. **Backend Scaling**

   - Add Application Load Balancer
   - Scale backend containers: `docker-compose up --scale backend=3`
   - Stateless API design (ready)

2. **Media Storage Migration**

   - Migrate uploads to AWS S3
   - Update `MEDIA_UPLOAD_PATH` config
   - No schema changes required

3. **Database Scaling**

   - Migrate to AWS RDS PostgreSQL
   - Update `DATABASE_URL`
   - Enable read replicas

4. **CDN Integration**
   - CloudFront for static assets
   - S3 bucket for React build

## 🧩 Core Features

### **Recipe Management**

- Create, edit, delete recipes
- Structured ingredients & steps
- Multi-cuisine tagging
- Difficulty levels
- Media uploads (images, videos)

### **Rating & Review System**

- 1-5 star ratings
- Threaded comments
- Proof-based verification ("Tried & Tested")
- Difficulty reality feedback

### **Judge Credibility System**

- 3-tier judge levels
- Weighted ratings based on credibility
- Automatic score calculation
- Verified review tracking

### **Battle Mode**

- Recipe competitions
- 1v1 or N-way battles
- Community voting
- Winner badges & profile highlights

### **User Profiles**

- Bio & preferences
- Skill level tracking
- Badge collection
- Battle history
- Credibility stats

## 🛠️ Troubleshooting

### **Common Issues**

**Database connection failed**

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify network
docker network inspect recipe_recipe_network

# Restart services
docker-compose restart backend postgres
```

**Media uploads failing**

```bash
# Check volume permissions
docker-compose exec backend ls -la /app/uploads

# Verify volume mount
docker volume inspect recipe_media_uploads
```

**Frontend not loading**

```bash
# Check nginx logs
docker-compose logs nginx

# Verify build
docker-compose exec frontend ls -la /usr/share/nginx/html
```

## 📚 Additional Documentation

- [Architecture Details](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Database Schema](docs/DATABASE.md)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License - See LICENSE file

## 🔗 Links

- **Production**: https://recipe.example.com
- **API Docs**: https://recipe.example.com/api/docs
- **Status Page**: https://status.recipe.example.com
