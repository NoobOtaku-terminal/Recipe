#!/bin/bash
# Complete production fix script for Cook-Off Platform
# Run this ON THE SERVER: ssh -i ~/Downloads/Recipe_key.pem recipe@20.205.129.101
# Then: cd ~/Recipe && ./FIX_PRODUCTION.sh

echo "=== Cook-Off Platform Production Fix ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to pull code!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Code pulled successfully${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking database for battles...${NC}"
docker compose exec postgres psql -U recipeuser -d recipedb -c "SELECT id, dish_name, status FROM battles;" || echo "No battles found or DB not running"
echo ""

echo -e "${YELLOW}Step 3: Stopping services...${NC}"
docker compose down
echo -e "${GREEN}✓ Services stopped${NC}"
echo ""

echo -e "${YELLOW}Step 4: Rebuilding backend and frontend...${NC}"
docker compose build backend frontend
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Starting services...${NC}"
docker compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start services!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Services started${NC}"
echo ""

echo -e "${YELLOW}Step 6: Waiting for services to be ready...${NC}"
sleep 10
echo ""

echo -e "${YELLOW}Step 7: Checking service status...${NC}"
docker compose ps
echo ""

echo -e "${YELLOW}Step 8: Checking uploads directory...${NC}"
docker compose exec backend ls -la /app/uploads/ || echo "Cannot check uploads directory"
echo ""

echo -e "${YELLOW}Step 9: Checking database battles...${NC}"
docker compose exec postgres psql -U recipeuser -d recipedb -c "SELECT id, dish_name, status, starts_at, ends_at FROM battles ORDER BY created_at DESC LIMIT 5;" || echo "No battles or DB error"
echo ""

echo -e "${YELLOW}Step 10: Checking media entries...${NC}"
docker compose exec postgres psql -U recipeuser -d recipedb -c "SELECT id, url, media_type FROM media ORDER BY id DESC LIMIT 5;" || echo "No media or DB error"
echo ""

echo -e "${GREEN}=== Fix deployment completed! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Open browser to http://20.205.129.101/admin/battles"
echo "2. Press F12 to open browser console"
echo "3. Check console logs for errors"
echo "4. If battles exist but don't show, check the console output"
echo ""
echo "To view logs:"
echo "  docker compose logs --tail=100 -f backend frontend"
echo ""
echo "To check backend API directly:"
echo "  curl -H \"Authorization: Bearer YOUR_TOKEN\" http://localhost:3000/api/admin/battles"
