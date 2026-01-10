# Recipe Battle Platform - Architecture Deep Dive

## 🎯 Design Philosophy

### **Core Principles**

1. **Infrastructure as Code**: Everything reproducible via Docker
2. **Security First**: Internal networking, JWT auth, no public DB
3. **Stateless Backend**: Horizontal scaling ready
4. **Data Normalization**: No duplication, clean relationships
5. **Future-Proof**: S3/RDS migration without rewrites

## 🏗️ System Architecture

### **Three-Tier Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
│  ┌────────────┐      ┌─────────────────────────────────────┐   │
│  │   Nginx    │─────▶│         React SPA (Frontend)        │   │
│  │  (Proxy)   │      │  - Authentication UI                │   │
│  │            │      │  - Recipe CRUD                      │   │
│  │  - Routing │      │  - Ratings & Comments               │   │
│  │  - SSL     │      │  - Battle Voting                    │   │
│  │  - Cache   │      │  - Profile Management               │   │
│  └─────┬──────┘      └─────────────────────────────────────┘   │
└────────┼────────────────────────────────────────────────────────┘
         │
         │ HTTP/HTTPS
         │
┌────────▼────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Node.js + Express.js Backend                  │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │   Auth   │  │  Recipe  │  │  Battle  │              │  │
│  │  │ Service  │  │ Service  │  │ Service  │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │  Rating  │  │  Judge   │  │  Media   │              │  │
│  │  │ Service  │  │ Service  │  │ Handler  │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  │                                                           │  │
│  │  Middleware: Auth, Validation, Error Handling, Logging   │  │
│  └────────────────────────┬──────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ SQL Queries
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       Data Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  PostgreSQL Database                      │  │
│  │                                                           │  │
│  │  Schemas:                                                 │  │
│  │  - Users & Authentication                                │  │
│  │  - Recipes & Ingredients                                 │  │
│  │  - Ratings & Comments                                    │  │
│  │  - Battles & Votes                                       │  │
│  │  - Judge Credibility                                     │  │
│  │  - Badges & Achievements                                 │  │
│  │                                                           │  │
│  │  Features:                                                │  │
│  │  - ACID transactions                                     │  │
│  │  - Foreign key constraints                               │  │
│  │  - Indexes for performance                               │  │
│  │  - UUID primary keys                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Volume: postgres_data (persistent)                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       Storage Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Media File Storage (Volume)                  │  │
│  │                                                           │  │
│  │  /uploads/                                                │  │
│  │    ├── recipes/      (recipe images & videos)            │  │
│  │    └── proofs/       (user verification images)          │  │
│  │                                                           │  │
│  │  Metadata stored in PostgreSQL media table               │  │
│  │  Future: Migrate to AWS S3 without schema changes        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### **User Registration Flow**

```
User Browser
     │
     │ POST /api/auth/register
     ▼
┌─────────┐
│  Nginx  │ ─── Forward ───▶ Backend :3000
└─────────┘                      │
                                 │ 1. Validate input
                                 │ 2. Hash password (bcrypt)
                                 │ 3. Generate UUID
                                 ▼
                          ┌──────────────┐
                          │  PostgreSQL  │
                          │  INSERT user │
                          └──────────────┘
                                 │
                                 │ 4. Create JWT token
                                 │ 5. Create judge_profile
                                 ▼
                          Return JWT + user data
```

### **Recipe Creation Flow**

```
User Browser (Authenticated)
     │
     │ POST /api/recipes + JWT
     ▼
┌─────────┐
│  Nginx  │ ─── Forward ───▶ Backend :3000
└─────────┘                      │
                                 │ 1. Verify JWT
                                 │ 2. Extract user_id
                                 │ 3. Validate recipe data
                                 ▼
                          ┌──────────────┐
                          │ Transaction  │
                          ├──────────────┤
                          │ INSERT recipe│
                          │ INSERT steps │
                          │ INSERT links │
                          └──────────────┘
                                 │
                                 │ 4. Upload media (if present)
                                 │ 5. Store metadata
                                 ▼
                          Return recipe + ID
```

### **Battle Voting Flow**

```
User Browser (Authenticated)
     │
     │ POST /api/battles/{id}/vote
     ▼
Backend
     │
     │ 1. Verify JWT
     │ 2. Check battle status (active?)
     │ 3. Check duplicate vote
     ▼
┌──────────────┐
│ Transaction  │
├──────────────┤
│ INSERT vote  │
│ UPDATE stats │
└──────────────┘
     │
     │ 4. Calculate winner (if battle ended)
     │ 5. Award badges (if applicable)
     ▼
Return vote confirmation
```

## 🐳 Docker Infrastructure

### **Service Dependencies**

```
Start Order:
1. postgres        (no dependencies)
2. migrations      (depends on: postgres)
3. backend         (depends on: postgres, migrations complete)
4. frontend        (build-time only, no runtime deps)
5. nginx           (depends on: frontend, backend)
```

### **Network Architecture**

```
┌─────────────────────────────────────────────────────────┐
│              recipe_network (bridge)                    │
│                                                          │
│  nginx:80 ◄─── PUBLIC ACCESS                           │
│     │                                                    │
│     ├──▶ frontend:3000 (internal)                      │
│     └──▶ backend:3000 (internal)                       │
│              │                                           │
│              └──▶ postgres:5432 (internal only)        │
│                                                          │
│  External Access: ONLY nginx port 80/443               │
│  Internal DNS: Service names resolve automatically      │
└─────────────────────────────────────────────────────────┘
```

### **Volume Strategy**

```
postgres_data/
├── pg_data/            # PostgreSQL data directory
│   ├── base/
│   ├── pg_wal/
│   └── pg_stat/
└── backups/            # Optional backup location

media_uploads/
├── recipes/
│   ├── {uuid}/
│   │   ├── image1.jpg
│   │   └── video.mp4
└── proofs/
    └── {uuid}/
        └── proof.jpg

Backup Strategy:
- Daily automated backups via cron
- Retention: 7 days local, 30 days S3
- Point-in-time recovery ready
```

## 🔐 Security Architecture

### **Authentication Flow**

```
1. User Login
   ↓
   POST /api/auth/login {email, password}
   ↓
   Backend validates credentials
   ↓
   Generate JWT with payload:
   {
     userId: UUID,
     username: string,
     judgeLevel: string,
     iat: timestamp,
     exp: timestamp
   }
   ↓
   Return JWT to client
   ↓
   Client stores in localStorage
   ↓
   Subsequent requests include:
   Authorization: Bearer {JWT}
```

### **Authorization Layers**

```
┌──────────────────────────────────────┐
│         Public Endpoints             │
│  - GET /api/recipes (browse)        │
│  - GET /api/recipes/:id (view)      │
│  - POST /api/auth/register          │
│  - POST /api/auth/login             │
└──────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│      Authenticated Endpoints         │
│  - POST /api/recipes (create)       │
│  - PUT /api/recipes/:id (own only)  │
│  - POST /api/ratings                │
│  - POST /api/comments               │
│  - POST /api/battles/:id/vote       │
└──────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│        Admin Endpoints               │
│  - POST /api/battles (create)       │
│  - DELETE /api/users/:id            │
│  - POST /api/badges (create)        │
└──────────────────────────────────────┘
```

### **Security Measures**

| Layer              | Implementation                       |
| ------------------ | ------------------------------------ |
| **Transport**      | HTTPS (TLS 1.3) via Nginx            |
| **Authentication** | JWT with 7-day expiry                |
| **Authorization**  | Middleware-based role checks         |
| **Password**       | bcrypt (12 rounds)                   |
| **SQL Injection**  | Parameterized queries only           |
| **XSS**            | React auto-escaping + CSP headers    |
| **CSRF**           | SameSite cookies + token validation  |
| **Rate Limiting**  | express-rate-limit (100 req/15min)   |
| **File Upload**    | Type validation, size limits (10MB)  |
| **Secrets**        | Environment variables, not committed |

## 📊 Database Design

### **Normalization Strategy**

**1NF → 2NF → 3NF Applied**

- No repeating groups (ingredients in separate table)
- No partial dependencies (composite keys used correctly)
- No transitive dependencies (cuisines normalized)

### **Relationship Patterns**

```
users ──────┬─── 1:1 ───▶ judge_profiles
            │
            ├─── 1:N ───▶ recipes
            │
            ├─── M:N ───▶ cuisines (via user_cuisines)
            │
            └─── M:N ───▶ badges (via user_badges)

recipes ────┬─── 1:N ───▶ recipe_steps
            │
            ├─── M:N ───▶ ingredients (via recipe_ingredients)
            │
            ├─── M:N ───▶ media (via recipe_media)
            │
            └─── 1:N ───▶ ratings, comments, difficulty_feedback

battles ────┬─── M:N ───▶ recipes (via battle_entries)
            │
            └─── 1:N ───▶ battle_votes
```

### **Indexing Strategy**

```sql
-- High-frequency lookups
CREATE INDEX idx_recipes_author ON recipes(author_id);
CREATE INDEX idx_ratings_recipe ON ratings(recipe_id);
CREATE INDEX idx_comments_recipe ON comments(recipe_id);

-- Filtering & sorting
CREATE INDEX idx_recipes_veg ON recipes(is_veg);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty_claimed);
CREATE INDEX idx_recipes_created ON recipes(created_at DESC);

-- Composite for complex queries
CREATE INDEX idx_recipes_search ON recipes(is_veg, difficulty_claimed, cook_time_minutes);

-- Battle queries
CREATE INDEX idx_battle_entries ON battle_entries(battle_id, recipe_id);
CREATE INDEX idx_battle_votes_unique ON battle_votes(battle_id, user_id);
```

## 🚀 Scalability Design

### **Current State: Single Server**

```
EC2 Instance
├── Docker Engine
├── All containers on one host
├── Local volumes
└── Single backend process
```

### **Horizontal Scaling Path**

```
Phase 1: Multi-Container Backend
┌─────────────────────────────────────┐
│  Application Load Balancer          │
│         (AWS ALB)                   │
└─────────┬───────────────────────────┘
          │
    ┌─────┴─────┬─────────────┐
    ▼           ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│Backend │  │Backend │  │Backend │
│   #1   │  │   #2   │  │   #3   │
└───┬────┘  └───┬────┘  └───┬────┘
    └───────────┴───────────┘
                │
                ▼
        ┌──────────────┐
        │  PostgreSQL  │
        │   (Single)   │
        └──────────────┘
```

```
Phase 2: Managed Database
┌─────────────────────────────────────┐
│         AWS RDS PostgreSQL          │
│  ┌──────────┐      ┌──────────┐   │
│  │  Primary │──────│ Read Rep │   │
│  │  (Write) │      │ (Reads)  │   │
│  └──────────┘      └──────────┘   │
└─────────────────────────────────────┘
```

```
Phase 3: CDN + Object Storage
┌─────────────────────────────────────┐
│          CloudFront CDN             │
│  ┌──────────┐      ┌──────────┐   │
│  │  S3 App  │      │ S3 Media │   │
│  │  Static  │      │ Uploads  │   │
│  └──────────┘      └──────────┘   │
└─────────────────────────────────────┘
```

### **Stateless Design Guarantees**

✅ No session storage on backend (JWT only)
✅ No local file dependencies (media via volume)
✅ No in-memory caching (Redis-ready)
✅ Idempotent API operations
✅ Database connection pooling

## 🔄 Data Flow Patterns

### **Read-Heavy Optimization**

```
Recipe Browse (High Traffic)
     │
     ▼
┌─────────────────┐
│  Nginx Cache    │ ◄─── Cache HIT (90% of requests)
│  (Optional)     │
└─────────────────┘
     │ Cache MISS
     ▼
Backend API
     │
     │ Query with indexes
     ▼
PostgreSQL
     │
     │ Materialized views for:
     │  - Recipe aggregates (avg rating)
     │  - Judge rankings
     │  - Battle leaderboards
     ▼
Return JSON
```

### **Write-Heavy Optimization**

```
Battle Voting (Peak Load)
     │
     ▼
Backend API
     │
     │ Queue votes (optional: Redis)
     ▼
PostgreSQL
     │
     │ INSERT with ON CONFLICT
     │ (prevents duplicate votes)
     ▼
Async Processing
     │
     │ - Update aggregates
     │ - Calculate winners
     │ - Award badges
     ▼
Background Jobs
```

## 🧪 Testing Strategy

### **Levels**

```
Unit Tests
├── Backend controllers
├── Services (credibility calc, media handling)
├── Middleware (auth, validation)
└── Utility functions

Integration Tests
├── API endpoints (Supertest)
├── Database operations
├── Authentication flows
└── File uploads

E2E Tests
├── User registration → recipe creation
├── Battle participation flow
├── Rating & commenting
└── Judge credibility progression

Load Tests
├── Concurrent requests (Artillery)
├── Database query performance
└── Media upload stress
```

## 📈 Monitoring & Observability

### **Metrics to Track**

```
Application Metrics
├── API response times (p50, p95, p99)
├── Request rate (per endpoint)
├── Error rate (4xx, 5xx)
└── Active users

Database Metrics
├── Connection pool usage
├── Query execution time
├── Cache hit ratio
└── Disk I/O

Infrastructure Metrics
├── CPU utilization
├── Memory usage
├── Disk space
└── Network bandwidth
```

### **Logging Strategy**

```
Structured JSON Logs
{
  "timestamp": "2026-01-08T12:00:00Z",
  "level": "info",
  "service": "backend",
  "requestId": "uuid",
  "userId": "uuid",
  "action": "create_recipe",
  "duration": 120,
  "status": 201
}

Log Levels:
- ERROR: Failures, exceptions
- WARN: Deprecated usage, high latency
- INFO: Business events (recipe created, battle started)
- DEBUG: Detailed execution flow
```

## 🔧 Deployment Strategies

### **Blue-Green Deployment**

```
1. Current (Blue)
   - Serving traffic
   - Version v1.0

2. Deploy New (Green)
   - Start new containers
   - Version v1.1
   - Run health checks

3. Switch Traffic
   - Update load balancer
   - Route to Green

4. Keep Blue (Rollback Ready)
   - Monitor for 1 hour
   - Rollback if issues
```

### **Rolling Updates**

```
docker-compose up -d --no-deps --scale backend=3 --no-recreate backend

Process:
1. Start new container (v1.1)
2. Wait for health check
3. Stop old container (v1.0)
4. Repeat for remaining containers
5. Zero-downtime deployment
```

## 🎯 Performance Targets

| Metric             | Target  | Measurement        |
| ------------------ | ------- | ------------------ |
| API Response (p95) | < 200ms | New Relic          |
| Page Load          | < 2s    | Lighthouse         |
| Database Query     | < 50ms  | pg_stat_statements |
| Concurrent Users   | 10,000  | Load testing       |
| Uptime             | 99.9%   | AWS CloudWatch     |

## 🔮 Future Enhancements

1. **Real-time Features**
   - WebSocket for live battle updates
   - Real-time notifications
2. **Advanced Analytics**

   - Recipe recommendation engine
   - Trend analysis
   - Judge behavior insights

3. **AI Integration**

   - Auto-tag ingredients from images
   - Nutrition calculation
   - Recipe difficulty prediction

4. **Mobile Apps**

   - iOS/Android native apps
   - Share backend API
   - Offline recipe viewing

5. **Social Features**
   - Follow users
   - Recipe collections
   - Social sharing
