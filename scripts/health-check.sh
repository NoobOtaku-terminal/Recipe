#!/bin/bash
set -e

# Recipe Battle Platform - Health Check Script
# Usage: ./health-check.sh [base-url]

BASE_URL=${1:-"http://localhost"}

echo "🏥 Running health checks for Recipe Battle Platform..."
echo "Base URL: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response, expected $expected_status)"
        return 1
    fi
}

# Health checks
FAILED=0

check_endpoint "Nginx" "$BASE_URL/health" || ((FAILED++))
check_endpoint "Backend API" "$BASE_URL/api/health" || ((FAILED++))
check_endpoint "Database" "$BASE_URL/api/health/db" || ((FAILED++))
check_endpoint "Frontend" "$BASE_URL/" || ((FAILED++))

echo ""

# Docker container status
echo "📦 Docker Container Status:"
docker-compose ps

echo ""

# Service health
echo "🔍 Detailed Service Health:"
echo ""

# Backend
echo "Backend API:"
curl -s "$BASE_URL/api/health" | jq '.' || echo "  Failed to get response"
echo ""

# Database
echo "Database:"
curl -s "$BASE_URL/api/health/db" | jq '.' || echo "  Failed to get response"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED health check(s) failed${NC}"
    exit 1
fi
