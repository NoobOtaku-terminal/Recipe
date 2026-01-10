#!/bin/bash
# Database initialization script
# Runs on PostgreSQL container first start

set -e

echo "🔧 Initializing Recipe Battle Platform database..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Enable required extensions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable UUID generation
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Enable trigram similarity (for fuzzy text search)
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    
    -- Enable case-insensitive text
    CREATE EXTENSION IF NOT EXISTS citext;
EOSQL

echo "✅ Database extensions enabled"
echo "🎉 Initialization complete!"
