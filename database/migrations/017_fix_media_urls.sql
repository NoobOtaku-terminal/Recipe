-- Migration 017: Fix media URLs to use correct subdirectory paths
-- This fixes any media entries that might have incorrect URL paths

-- Check current media URLs
DO $$
BEGIN
    RAISE NOTICE 'Current media URLs:';
END $$;

SELECT id, url, media_type FROM media ORDER BY id DESC LIMIT 10;

-- No automatic updates since we can't determine if a file should be in 'file' vs 'proofs'
-- Just ensure future uploads use correct paths (already fixed in backend code)

-- Note: If you need to manually fix specific URLs, use:
-- UPDATE media SET url = '/uploads/file/FILENAME' WHERE id = X;
-- UPDATE media SET url = '/uploads/proofs/FILENAME' WHERE id = Y;
