#!/bin/bash

# Test Script for Recipe Platform Bug Fixes
# Run this after deployment to verify all fixes are working

echo "🧪 Recipe Platform - Bug Fix Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${1:-http://localhost}"
TOKEN=""
USER_ID=""
RECIPE_ID=""
OTHER_RECIPE_ID=""

echo "Testing against: $API_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local description=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $description... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        echo "Response: $body"
    fi
}

echo "📋 Manual Testing Guide"
echo "======================="
echo ""
echo "Please test the following manually in your browser:"
echo ""
echo "1. ${YELLOW}Comment on Someone Else's Recipe${NC}"
echo "   - Navigate to any recipe you don't own"
echo "   - Scroll to comments section"
echo "   - Type a comment and click 'Post Comment'"
echo "   - Expected: Comment appears successfully"
echo ""

echo "2. ${YELLOW}Rate Someone Else's Recipe${NC}"
echo "   - Navigate to any recipe you don't own"
echo "   - Scroll to ratings section"
echo "   - Click on 1-5 stars"
echo "   - Expected: 'Rating submitted!' toast message"
echo ""

echo "3. ${YELLOW}Try Rating Your Own Recipe${NC}"
echo "   - Navigate to one of your own recipes"
echo "   - Expected: No rating UI should appear"
echo "   - (If it does, clicking should show 'You cannot rate your own recipe')"
echo ""

echo "4. ${YELLOW}Like Someone Else's Recipe${NC}"
echo "   - Navigate to any recipe you don't own"
echo "   - Click the thumbs up (like) button"
echo "   - Expected: Button turns green, count increases"
echo ""

echo "5. ${YELLOW}Undo Like${NC}"
echo "   - Click the same thumbs up button again"
echo "   - Expected: Button returns to normal, count decreases"
echo ""

echo "6. ${YELLOW}Dislike Someone Else's Recipe${NC}"
echo "   - Click the thumbs down (dislike) button"
echo "   - Expected: Button turns red, count increases"
echo ""

echo "7. ${YELLOW}Try Liking Your Own Recipe${NC}"
echo "   - Navigate to one of your own recipes"
echo "   - Try clicking like or dislike"
echo "   - Expected: Error message 'You cannot like or dislike your own recipe'"
echo ""

echo "8. ${YELLOW}Edit Your Own Recipe${NC}"
echo "   - Navigate to one of your own recipes"
echo "   - Click the 'Edit' button (top right)"
echo "   - Make changes and save"
echo "   - Expected: Recipe updates successfully"
echo ""

echo "9. ${YELLOW}Try Editing Someone Else's Recipe${NC}"
echo "   - Navigate to someone else's recipe"
echo "   - Expected: No 'Edit' button should appear"
echo ""

echo ""
echo "✅ ${GREEN}All tests should PASS${NC}"
echo ""
echo "If any test fails, check:"
echo "  - Backend logs: docker-compose logs -f backend"
echo "  - Frontend console: Browser DevTools > Console"
echo "  - Network tab: Browser DevTools > Network"
echo ""
