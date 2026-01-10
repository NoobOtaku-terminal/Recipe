#!/bin/bash
set -e

# Recipe Battle Platform - Database Backup Script
# Usage: ./backup-db.sh [backup-name]

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME=${1:-"recipe_db_${TIMESTAMP}"}
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Backing up Recipe Battle Platform database..."
echo "Backup file: $BACKUP_FILE"

# Create backup using docker-compose
docker-compose exec -T postgres pg_dump -U recipeuser -d recipedb > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo "✅ Database backup complete!"
echo "File: $COMPRESSED_FILE"
echo "Size: $(du -h "$COMPRESSED_FILE" | cut -f1)"

# Optional: Upload to S3 (uncomment if AWS CLI is configured)
# if command -v aws &> /dev/null; then
#     echo "📤 Uploading to S3..."
#     aws s3 cp "$COMPRESSED_FILE" "s3://your-bucket/backups/$(basename "$COMPRESSED_FILE")"
#     echo "✅ Uploaded to S3"
# fi

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "recipe_db_*.sql.gz" -mtime +7 -delete
echo "🧹 Cleaned up old backups (>7 days)"

echo ""
echo "To restore this backup:"
echo "  gunzip -c $COMPRESSED_FILE | docker-compose exec -T postgres psql -U recipeuser -d recipedb"
echo ""
