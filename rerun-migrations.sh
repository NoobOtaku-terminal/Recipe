#!/bin/bash

echo "🔄 Re-running Database Migrations"
echo "=================================="
echo ""
echo "This will force the migrations container to run again"
echo "to pick up migrations 012, 013, and 014"
echo ""

# Stop and remove the old migrations container
echo "🗑️  Removing old migrations container..."
docker-compose rm -f migrations

# Remove the container completely to force rebuild
docker rm -f recipe_migrations 2>/dev/null || true

# Rebuild and run migrations container
echo ""
echo "🔨 Rebuilding migrations container..."
docker-compose build --no-cache migrations

echo ""
echo "🚀 Running migrations..."
docker-compose up migrations

echo ""
echo "📊 Checking migration results..."
docker logs recipe_migrations | tail -20

echo ""
echo "✅ Done! Now restart the backend:"
echo "   docker-compose restart backend"
