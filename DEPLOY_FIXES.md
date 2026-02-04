# Deploy Latest Fixes

## SSH to Server
```bash
ssh noobotaku@20.205.129.101
```

## Pull Latest Code
```bash
cd ~/Recipe
git pull origin main
```

## Run Migration 016 (if not already run)
```bash
docker compose exec postgres psql -U recipeuser -d recipedb -f /docker-entrypoint-initdb.d/016_auto_update_battle_status.sql
```

## Rebuild and Restart All Services
```bash
# Stop all services
docker compose down

# Rebuild backend and frontend with latest code
docker compose build backend frontend

# Start all services
docker compose up -d

# Check logs
docker compose logs --tail=100 -f backend frontend
```

## Verify Fixes

### 1. Check Battle Status Auto-Update
Wait 5 minutes and check if battle statuses update automatically.

### 2. Check Admin Battles Page
- Go to http://20.205.129.101/admin/battles
- Should show all battles with correct status

### 3. Check Leaderboard
- Go to http://20.205.129.101/leaderboard  
- Should show all active battles stacked vertically

### 4. Check Media Files
- Upload a recipe with image/video
- Should not get 404 errors

## Quick Verification Commands
```bash
# Check if containers are running
docker compose ps

# Check backend logs for errors
docker compose logs backend --tail=50

# Check if migration 016 ran
docker compose exec postgres psql -U recipeuser -d recipedb -c "SELECT * FROM battles_with_current_status LIMIT 1;"

# Check battles in database
docker compose exec postgres psql -U recipeuser -d recipedb -c "SELECT id, dish_name, status, starts_at, ends_at FROM battles;"
```

## Troubleshooting

### If Admin Page Shows "No battles yet"
1. Check browser console for errors (F12)
2. Check if token is valid: `localStorage.getItem('token')`
3. Test API directly: `curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/admin/battles`

### If Leaderboard is Blank
1. Check browser console (F12)
2. Verify battles exist and are active
3. Check network tab for /api/battles response

### If Media Still Shows 404
1. Verify directory exists: `docker compose exec backend ls -la /app/uploads/`
2. Check media table: `docker compose exec postgres psql -U recipeuser -d recipedb -c "SELECT id, url FROM media LIMIT 10;"`
3. Fix paths if needed with SQL update
