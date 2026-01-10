# Database Documentation

PostgreSQL database schema and management guide for Recipe Battle Platform.

## 📊 Database Overview

- **DBMS**: PostgreSQL 15
- **Extensions**: uuid-ossp, pg_trgm, citext
- **Character Set**: UTF-8
- **Timezone**: UTC
- **Migration System**: Custom Node.js runner with versioning

## 🏗️ Schema Architecture

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    users     │────────<│   recipes    │>────────│  ingredients │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                          │
       │                        │                          │
       ▼                        ▼                          ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│judge_profiles│         │recipe_steps  │         │recipe_ingr... │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │
       │                        ▼
       │                 ┌──────────────┐
       │                 │   cuisines   │
       │                 └──────────────┘
       │                        │
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│   ratings    │         │recipe_cuisines│
└──────────────┘         └──────────────┘
       │
       │
       ▼
┌──────────────┐         ┌──────────────┐
│   comments   │────────<│    media     │
└──────────────┘         └──────────────┘
       │
       │
       ▼
┌──────────────┐         ┌──────────────┐
│   battles    │>────────│battle_entries│
└──────────────┘         └──────────────┘
       │
       ▼
┌──────────────┐
│ battle_votes │
└──────────────┘
```

## 📋 Table Schemas

### users

Core user account information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `username`, `email`
- BTREE on `created_at`

**Constraints:**

- `role` must be: user, admin, or moderator
- `username` and `email` are case-insensitive (citext)

**Triggers:**

- `update_users_updated_at`: Auto-update `updated_at` on row change
- `create_judge_profile_trigger`: Auto-create judge_profiles entry on INSERT

### judge_profiles

Judge credibility and statistics.

```sql
CREATE TABLE judge_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    credibility_score NUMERIC(5,2) DEFAULT 50.00 CHECK (credibility_score >= 0 AND credibility_score <= 100),
    verified_comments_count INTEGER DEFAULT 0,
    total_ratings_given INTEGER DEFAULT 0,
    total_battle_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `user_id`
- BTREE on `credibility_score DESC` (leaderboard queries)

**Triggers:**

- `update_credibility_on_verified_comment`: Increase credibility on verified comment
- `decrement_credibility_on_comment_delete`: Decrease credibility on verified comment deletion

**Credibility Calculation:**

```sql
-- Base score: 50
-- Verified comment: +2.5 per comment
-- Max score: 100
-- Formula: MIN(50 + (verified_comments_count * 2.5), 100)
```

### recipes

Recipe content and metadata.

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    prep_time INTEGER CHECK (prep_time > 0),
    cook_time INTEGER CHECK (cook_time > 0),
    servings INTEGER CHECK (servings > 0),
    is_vegetarian BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `id`
- BTREE on `created_by`, `created_at DESC`
- BTREE on `difficulty`, `is_vegetarian`
- GIN on `title` using `gin_trgm_ops` (full-text search)

**Virtual Columns (via recipe_stats view):**

- `avg_rating`: Average rating (1-5)
- `rating_count`: Total number of ratings
- `comment_count`: Total number of comments

### ingredients

Master ingredient list.

```sql
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `name` (case-insensitive)
- GIN on `name` using `gin_trgm_ops`

### recipe_ingredients

Junction table linking recipes to ingredients.

```sql
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity VARCHAR(50),
    unit VARCHAR(50),
    preparation_notes TEXT,
    display_order INTEGER DEFAULT 0,
    UNIQUE(recipe_id, ingredient_id)
);
```

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `(recipe_id, ingredient_id)`
- BTREE on `recipe_id`, `display_order`

### recipe_steps

Ordered cooking instructions.

```sql
CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    estimated_time INTEGER,
    UNIQUE(recipe_id, step_number)
);
```

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `(recipe_id, step_number)`
- BTREE on `recipe_id`, `step_number`

### cuisines

Cuisine types (Italian, Japanese, etc.).

```sql
CREATE TABLE cuisines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `name`

**Default Values:**

```sql
INSERT INTO cuisines (name) VALUES
    ('italian'), ('chinese'), ('japanese'), ('indian'),
    ('mexican'), ('french'), ('thai'), ('greek'),
    ('mediterranean'), ('american');
```

### recipe_cuisines

Junction table linking recipes to cuisines.

```sql
CREATE TABLE recipe_cuisines (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    cuisine_id UUID REFERENCES cuisines(id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, cuisine_id)
);
```

**Indexes:**

- PRIMARY KEY on `(recipe_id, cuisine_id)`

### user_cuisines

User's preferred cuisines.

```sql
CREATE TABLE user_cuisines (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    cuisine_id UUID REFERENCES cuisines(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, cuisine_id)
);
```

**Indexes:**

- PRIMARY KEY on `(user_id, cuisine_id)`

### ratings

User ratings for recipes.

```sql
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id, user_id)
);
```

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `(recipe_id, user_id)` (one rating per user per recipe)
- BTREE on `recipe_id`, `created_at DESC`
- BTREE on `user_id`

**Triggers:**

- `prevent_self_rating`: Prevent users from rating their own recipes
- `update_judge_profile_on_rating`: Increment total_ratings_given

### comments

Threaded comments with verification.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_verified_recreation BOOLEAN DEFAULT FALSE,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `id`
- BTREE on `recipe_id`, `parent_comment_id`, `created_at`
- BTREE on `user_id`
- BTREE on `is_verified_recreation` (filter verified recreations)

**Triggers:**

- `validate_verified_comment`: Ensure verified recreations have media
- `update_credibility_on_verified_comment`: Increase judge credibility

**Threading:**

- `parent_comment_id = NULL`: Top-level comment
- `parent_comment_id = <uuid>`: Reply to another comment

### media

File uploads (images, videos).

```sql
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video')),
    file_size BIGINT,
    mime_type VARCHAR(100),
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `id`
- BTREE on `uploaded_by`, `created_at DESC`
- BTREE on `media_type`

**Storage:**

- Files stored in: `/app/uploads/<media_type>/<timestamp>-<filename>`
- Served via Nginx with caching

### battles

Recipe competitions.

```sql
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    theme VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL CHECK (end_date > start_date),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**

- PRIMARY KEY on `id`
- BTREE on `status`, `start_date`
- BTREE on `theme`
- BTREE on `created_by`

**Status Lifecycle:**

1. `pending`: Created but not started
2. `active`: Currently accepting votes
3. `completed`: Voting closed, results final

### battle_entries

Recipes competing in a battle.

```sql
CREATE TABLE battle_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(battle_id, recipe_id)
);
```

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `(battle_id, recipe_id)`
- BTREE on `battle_id`

### battle_votes

User votes in battles.

```sql
CREATE TABLE battle_votes (
    battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES battle_entries(id) ON DELETE CASCADE,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (battle_id, user_id)
);
```

**Indexes:**

- PRIMARY KEY on `(battle_id, user_id)` (one vote per user per battle)
- BTREE on `entry_id`

**Triggers:**

- `validate_battle_vote`: Ensure entry belongs to battle
- `update_judge_profile_on_vote`: Increment total_battle_votes

### badges

Achievement system.

```sql
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    criteria JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Badges:**

```sql
INSERT INTO badges (name, description, criteria) VALUES
    ('Recipe Master', 'Posted 10+ recipes', '{"recipes_count": 10}'),
    ('Top Rated Chef', 'Avg rating 4.5+', '{"avg_rating": 4.5}'),
    ('Verified Judge', '25+ verified recreations', '{"verified_comments": 25}'),
    ('Battle Champion', 'Won 5+ battles', '{"battles_won": 5}');
```

### user_badges

User achievements.

```sql
CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);
```

**Indexes:**

- PRIMARY KEY on `(user_id, badge_id)`

## 🔍 Materialized Views

### recipe_stats

Aggregated recipe statistics (refreshed periodically).

```sql
CREATE MATERIALIZED VIEW recipe_stats AS
SELECT
    r.id,
    COALESCE(AVG(rat.rating), 0) AS avg_rating,
    COUNT(DISTINCT rat.id) AS rating_count,
    COUNT(DISTINCT c.id) AS comment_count
FROM recipes r
LEFT JOIN ratings rat ON r.id = rat.recipe_id
LEFT JOIN comments c ON r.id = c.recipe_id
GROUP BY r.id;

CREATE UNIQUE INDEX ON recipe_stats (id);
```

**Refresh:**

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY recipe_stats;
```

**Scheduled Refresh:**

```bash
# Cron job (every hour)
0 * * * * docker-compose exec -T postgres psql -U recipeuser -d recipedb -c "REFRESH MATERIALIZED VIEW CONCURRENTLY recipe_stats;"
```

### judge_leaderboard

Top judges by credibility (refreshed daily).

```sql
CREATE MATERIALIZED VIEW judge_leaderboard AS
SELECT
    jp.user_id,
    u.username,
    u.display_name,
    jp.credibility_score,
    jp.verified_comments_count,
    jp.total_ratings_given,
    jp.total_battle_votes,
    COUNT(ub.badge_id) AS badges_count,
    ROW_NUMBER() OVER (ORDER BY jp.credibility_score DESC) AS rank
FROM judge_profiles jp
JOIN users u ON jp.user_id = u.id
LEFT JOIN user_badges ub ON u.id = ub.user_id
GROUP BY jp.user_id, u.username, u.display_name, jp.credibility_score,
         jp.verified_comments_count, jp.total_ratings_given, jp.total_battle_votes;

CREATE UNIQUE INDEX ON judge_leaderboard (user_id);
```

## ⚡ Triggers

### Auto-Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Applied to: `users`, `recipes`, `ratings`, `comments`, `battles`, `judge_profiles`

### Auto-Create Judge Profile

```sql
CREATE OR REPLACE FUNCTION create_judge_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO judge_profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_judge_profile_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_judge_profile();
```

### Prevent Self-Rating

```sql
CREATE OR REPLACE FUNCTION prevent_self_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM recipes
        WHERE id = NEW.recipe_id AND created_by = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Cannot rate your own recipe';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_self_rating_trigger
    BEFORE INSERT OR UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_rating();
```

### Update Judge Credibility

```sql
CREATE OR REPLACE FUNCTION update_credibility_on_verified_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_verified_recreation = TRUE THEN
        UPDATE judge_profiles
        SET
            credibility_score = LEAST(credibility_score + 2.5, 100),
            verified_comments_count = verified_comments_count + 1
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credibility_trigger
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_credibility_on_verified_comment();
```

### Validate Battle Vote

```sql
CREATE OR REPLACE FUNCTION validate_battle_vote()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM battle_entries
        WHERE id = NEW.entry_id AND battle_id = NEW.battle_id
    ) THEN
        RAISE EXCEPTION 'Entry does not belong to this battle';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_battle_vote_trigger
    BEFORE INSERT OR UPDATE ON battle_votes
    FOR EACH ROW
    EXECUTE FUNCTION validate_battle_vote();
```

## 🔄 Migration System

### Migration Tracking

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Migration Files

Located in `/database/migrations/`:

1. **001_initial_schema.sql**: All table definitions
2. **002_indexes.sql**: Performance indexes
3. **003_triggers.sql**: Business logic triggers
4. **004_views.sql**: Materialized views

### Running Migrations

**Automated (Docker):**

```bash
docker-compose up migrations
```

**Manual:**

```bash
node database/run-migrations.js
```

**Migration Runner Logic:**

```javascript
// Check if migration already executed
const { rows } = await client.query(
  "SELECT version FROM schema_migrations WHERE version = $1",
  [version]
);

if (rows.length === 0) {
  // Execute migration in transaction
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [
    version,
  ]);
  await client.query("COMMIT");
}
```

### Rollback

Migrations are designed to be idempotent. To rollback:

1. Remove migration from `schema_migrations`
2. Manually write DOWN migration
3. Re-run migrations

## 🗂️ Backup & Restore

### Automated Backups

**Daily backup script:**

```bash
#!/bin/bash
docker-compose exec -T postgres pg_dump -U recipeuser recipedb | gzip > backups/recipe_db_$(date +%Y%m%d).sql.gz
```

**Cron schedule:**

```bash
0 2 * * * /home/ubuntu/recipe/scripts/backup-db.sh
```

### Manual Backup

```bash
# Full backup
docker-compose exec -T postgres pg_dump -U recipeuser recipedb > backup.sql

# Schema only
docker-compose exec -T postgres pg_dump -U recipeuser -s recipedb > schema.sql

# Data only
docker-compose exec -T postgres pg_dump -U recipeuser -a recipedb > data.sql

# Specific table
docker-compose exec -T postgres pg_dump -U recipeuser -t recipes recipedb > recipes.sql
```

### Restore

```bash
# From SQL file
docker-compose exec -T postgres psql -U recipeuser recipedb < backup.sql

# From compressed file
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U recipeuser recipedb

# From S3
aws s3 cp s3://bucket/backup.sql.gz - | gunzip | docker-compose exec -T postgres psql -U recipeuser recipedb
```

## 🚀 Performance Optimization

### Index Strategy

**B-Tree Indexes:**

- Primary keys (automatic)
- Foreign keys (explicit)
- Frequently filtered columns (status, difficulty, is_vegetarian)
- Sorting columns (created_at DESC, credibility_score DESC)

**GIN Indexes:**

- Full-text search (recipe titles, ingredient names)
- JSONB columns (badge criteria)

**Unique Indexes:**

- Prevent duplicates (username, email, ratings, votes)

### Query Optimization

**Use materialized views:**

```sql
-- Instead of:
SELECT r.*, AVG(rat.rating) FROM recipes r
LEFT JOIN ratings rat ON r.id = rat.recipe_id
GROUP BY r.id;

-- Use:
SELECT r.*, rs.avg_rating FROM recipes r
JOIN recipe_stats rs ON r.id = rs.id;
```

**Use indexed lookups:**

```sql
-- Good: Uses index on created_at
SELECT * FROM recipes WHERE created_at > '2026-01-01' ORDER BY created_at DESC;

-- Bad: Full table scan
SELECT * FROM recipes WHERE DATE(created_at) = '2026-01-01';
```

**Avoid N+1 queries:**

```sql
-- Bad: N+1 (1 query + N ingredient queries)
SELECT * FROM recipes;
-- Then for each recipe:
SELECT * FROM recipe_ingredients WHERE recipe_id = ?;

-- Good: Single JOIN
SELECT r.*, ri.* FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id;
```

### Connection Pooling

**pg (Node.js):**

```javascript
const pool = new Pool({
  max: 20, // Max connections
  idleTimeoutMillis: 30000, // Close idle connections
  connectionTimeoutMillis: 2000,
});
```

### VACUUM & ANALYZE

**Auto-vacuum (enabled by default):**

```sql
-- Check autovacuum settings
SHOW autovacuum;

-- Manual vacuum
VACUUM ANALYZE recipes;
```

### Partitioning (Future)

For high-volume tables (comments, ratings):

```sql
CREATE TABLE comments_2026 PARTITION OF comments
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

## 📊 Monitoring

### Active Queries

```sql
SELECT pid, age(clock_timestamp(), query_start), usename, query
FROM pg_stat_activity
WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start;
```

### Slow Queries

```sql
-- Enable slow query logging
ALTER DATABASE recipedb SET log_min_duration_statement = 1000; -- 1 second

-- View slow queries in logs
docker-compose logs postgres | grep "duration:"
```

### Index Usage

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### Table Sizes

```sql
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::text)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::text) DESC;
```

### Database Size

```sql
SELECT pg_size_pretty(pg_database_size('recipedb'));
```

## 🔒 Security

### Row-Level Security (Future)

```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY recipe_policy ON recipes
    FOR ALL
    USING (created_by = current_user_id());
```

### Prepared Statements

```javascript
// Always use parameterized queries
const result = await pool.query("SELECT * FROM recipes WHERE id = $1", [
  recipeId,
]);

// NEVER:
const result = await pool.query(
  `SELECT * FROM recipes WHERE id = '${recipeId}'`
);
```

### Connection Encryption

```javascript
const pool = new Pool({
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("/path/to/ca-cert.pem"),
  },
});
```

## 🧪 Testing

### Sample Queries

**Get recipe with all details:**

```sql
SELECT
    r.*,
    u.username AS author,
    rs.avg_rating,
    rs.rating_count,
    json_agg(DISTINCT jsonb_build_object(
        'name', i.name,
        'quantity', ri.quantity,
        'unit', ri.unit
    )) AS ingredients,
    json_agg(DISTINCT jsonb_build_object(
        'step_number', rs_step.step_number,
        'instruction', rs_step.instruction
    ) ORDER BY rs_step.step_number) AS steps
FROM recipes r
JOIN users u ON r.created_by = u.id
LEFT JOIN recipe_stats rs ON r.id = rs.id
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN ingredients i ON ri.ingredient_id = i.id
LEFT JOIN recipe_steps rs_step ON r.id = rs_step.recipe_id
WHERE r.id = '...'
GROUP BY r.id, u.username, rs.avg_rating, rs.rating_count;
```

**Top-rated recipes:**

```sql
SELECT r.*, rs.avg_rating, rs.rating_count
FROM recipes r
JOIN recipe_stats rs ON r.id = rs.id
WHERE rs.rating_count >= 5
ORDER BY rs.avg_rating DESC, rs.rating_count DESC
LIMIT 10;
```

**Leaderboard:**

```sql
SELECT * FROM judge_leaderboard
ORDER BY rank
LIMIT 50;
```

## 📚 References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [Trigger Functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
