#!/bin/bash

# Emergency Database Fix Script
# This script manually runs the missing migrations that fix XP system

echo "🔧 Emergency Database Migration Fix"
echo "===================================="
echo ""
echo "This will run migrations 007, 013, and 014 to fix:"
echo "  - XP system (award_xp function)"
echo "  - Like triggers"
echo "  - Skill level constraint"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Database connection details
DB_CONTAINER="recipe_postgres"
DB_NAME="${POSTGRES_DB:-recipedb}"
DB_USER="${POSTGRES_USER:-recipeuser}"

echo ""
echo "📊 Checking current migrations..."
docker exec -it $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "SELECT filename FROM schema_migrations ORDER BY id;"

echo ""
echo "🔧 Running missing migrations..."

# Run migration 007 - User Progression
echo ""
echo "Running: 007_user_progression.sql"
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < database/migrations/007_user_progression.sql

# Run migration 013 - Fix award_xp
echo ""
echo "Running: 013_fix_award_xp_skill_level.sql"
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < database/migrations/013_fix_award_xp_skill_level.sql

# Run migration 014 - Fix like triggers
echo ""
echo "Running: 014_fix_like_triggers.sql"
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < database/migrations/014_fix_like_triggers.sql

echo ""
echo "📊 Updated migrations list:"
docker exec -it $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "SELECT filename FROM schema_migrations ORDER BY id;"

echo ""
echo "✅ Migration fix complete!"
echo ""
echo "Next steps:"
echo "1. Restart backend: docker-compose restart backend"
echo "2. Test the features again"
