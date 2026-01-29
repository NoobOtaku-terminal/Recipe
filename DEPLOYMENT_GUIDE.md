# 🚀 Deployment Guide - Bug Fixes

## Quick Summary

**Fixed Issues:**
1. ✅ Users unable to comment on recipes
2. ✅ Users unable to rate recipes  
3. ✅ Users unable to like/dislike or undo on others' recipes
4. ✅ Users unable to edit their own recipes

**Files Changed:**
- `backend/src/routes/comments.js`
- `backend/src/routes/ratings.js`
- `backend/src/routes/likes.js`
- `backend/src/middleware/validation.js`

---

## 📋 Pre-Deployment Checklist

- [ ] Backup current database
- [ ] Commit all changes locally
- [ ] Test locally (optional but recommended)

---

## 🔧 Deployment Steps

### Step 1: Commit and Push Changes

```bash
cd /home/noobotaku/Desktop/Recipe

# Check what files changed
git status

# Add all changes
git add backend/src/routes/comments.js
git add backend/src/routes/ratings.js
git add backend/src/routes/likes.js
git add backend/src/middleware/validation.js

# Commit with descriptive message
git commit -m "fix: resolve comment, rating, like/dislike, and edit issues

- Add recipe existence validation to all endpoints
- Prevent self-rating and self-like with clear error messages
- Fix comment parentId null handling
- Improve error messages for better UX
- Make DELETE like endpoint idempotent
- Fix myLike response format"

# Push to remote
git push origin main
```

### Step 2: Deploy to Production Server

SSH into your production server and run:

```bash
# Navigate to app directory
cd /path/to/your/recipe/app

# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Monitor logs for errors
docker-compose logs -f backend
```

Press `Ctrl+C` to stop following logs once you see:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

### Step 3: Verify Services are Running

```bash
# Check all containers are running
docker-compose ps

# Should show:
# recipe_nginx      - Up
# recipe_frontend   - Up  
# recipe_backend    - Up (healthy)
# recipe_postgres   - Up (healthy)
```

### Step 4: Test the Fixes

Run the test script:
```bash
./test-fixes.sh http://your-production-domain.com
```

Or test manually in browser (see FIXES_APPLIED.md for checklist)

---

## 🧪 Manual Testing Guide

### Test 1: Comment on Recipe ✓

1. Login to your app
2. Go to any recipe you **don't** own
3. Scroll to comments section
4. Type: "Great recipe!" and click "Post Comment"
5. **Expected**: Comment appears immediately with success message

### Test 2: Rate Recipe ✓

1. Go to any recipe you **don't** own
2. Scroll to ratings section
3. Click on 4 stars
4. **Expected**: "Rating submitted!" toast appears
5. Rating appears in list below

### Test 3: Like Recipe ✓

1. Go to any recipe you **don't** own
2. Click thumbs up 👍 button
3. **Expected**: Button turns green, count increases
4. Click again to undo
5. **Expected**: Button returns to normal, count decreases

### Test 4: Dislike Recipe ✓

1. Go to any recipe you **don't** own
2. Click thumbs down 👎 button
3. **Expected**: Button turns red, count increases
4. Click again to undo
5. **Expected**: Button returns to normal, count decreases

### Test 5: Edit Your Recipe ✓

1. Go to one of **your own** recipes
2. Click "Edit" button (top right)
3. Change title to "Updated Title"
4. Click "Save"
5. **Expected**: Recipe updates successfully

### Test 6: Self-Action Prevention ✓

Test that users **cannot** perform actions on their own recipes:

**Own Recipe - Rate**: No rating UI appears
**Own Recipe - Like**: Shows error "You cannot like or dislike your own recipe"
**Own Recipe - Comment**: Can comment (this is allowed)

**Other's Recipe - Edit**: No edit button appears

---

## 🐛 Troubleshooting

### Issue: Backend won't start

**Check logs:**
```bash
docker-compose logs backend
```

**Common fixes:**
```bash
# Restart backend only
docker-compose restart backend

# Full rebuild
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Issue: "Cannot rate/like your own recipe" on others' recipes

**Cause**: Token might have wrong user ID

**Fix**: Logout and login again to refresh token

### Issue: Comments/ratings not appearing

**Check database connection:**
```bash
docker-compose exec backend wget -qO- http://localhost:3000/api/health/db
```

**Expected response:**
```json
{"status":"healthy","database":"connected"}
```

### Issue: 401 Unauthorized errors

**Cause**: Token expired or invalid

**Fix**: 
1. Logout
2. Clear browser cache
3. Login again

---

## 📊 Monitoring After Deployment

### Monitor Backend Logs

```bash
# Follow logs in real-time
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Check Health Status

```bash
# Backend health
curl http://your-domain.com/api/health

# Database health
curl http://your-domain.com/api/health/db
```

### Monitor Error Rates

Check for these errors in logs:
- ❌ `Recipe not found` - Rare, OK
- ❌ `cannot rate their own` - Expected when users try self-actions
- ❌ `Forbidden` - Expected for permission errors
- ⚠️ `Database error` - **Investigate immediately**
- ⚠️ `Connection refused` - **Check database container**

---

## ✅ Success Criteria

Deployment is successful when:

- [x] All 4 containers are running and healthy
- [x] Backend logs show "Database connected successfully"
- [x] Can comment on others' recipes
- [x] Can rate others' recipes
- [x] Can like/dislike others' recipes
- [x] Can undo like/dislike
- [x] Can edit own recipes
- [x] Cannot rate/like own recipes (shows error)
- [x] Cannot edit others' recipes (no button shown)

---

## 🔄 Rollback Plan

If something goes wrong:

```bash
# Stop containers
docker-compose down

# Revert to previous commit
git log --oneline -5  # Find previous commit hash
git revert HEAD       # Or: git reset --hard <previous-commit-hash>

# Rebuild and restart
docker-compose up -d --build
```

---

## 📞 Support

If issues persist:

1. Check [FIXES_APPLIED.md](./FIXES_APPLIED.md) for details
2. Review backend logs: `docker-compose logs backend`
3. Check browser console for frontend errors
4. Verify database is healthy: `docker-compose exec postgres pg_isready`

---

## 🎉 Post-Deployment

After successful deployment:

1. ✅ Mark issues as resolved in your tracking system
2. ✅ Update team that fixes are live
3. ✅ Monitor user feedback
4. ✅ Keep logs for 24-48 hours for any edge cases

**Estimated deployment time**: 5-10 minutes
**Downtime**: < 1 minute (during container restart)
