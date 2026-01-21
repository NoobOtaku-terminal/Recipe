-- Migration: Update admin statistics view with missing fields
-- Created: 2026-01-15

BEGIN;

-- Drop existing view first
DROP VIEW IF EXISTS admin_statistics;

-- Recreate admin_statistics view with all required fields
CREATE VIEW admin_statistics AS
SELECT 
    -- User stats
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE is_admin = TRUE) AS total_admins,
    (SELECT COUNT(*) FROM users WHERE is_moderator = TRUE) AS total_moderators,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_week,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') AS new_users_month,
    
    -- Recipe stats
    (SELECT COUNT(*) FROM recipes) AS total_recipes,
    (SELECT COUNT(*) FROM recipes WHERE is_flagged = TRUE) AS flagged_recipes,
    (SELECT COUNT(*) FROM recipes WHERE created_at > NOW() - INTERVAL '7 days') AS new_recipes_week,
    
    -- Battle stats
    (SELECT COUNT(*) FROM battles) AS total_battles,
    (SELECT COUNT(*) FROM battles WHERE status = 'active') AS active_battles,
    
    -- Comment stats
    (SELECT COUNT(*) FROM comments) AS total_comments,
    (SELECT COUNT(*) FROM comments WHERE is_flagged = TRUE) AS flagged_comments,
    
    -- Rating stats
    (SELECT COUNT(*) FROM ratings) AS total_ratings,
    (SELECT COALESCE(AVG(rating), 0) FROM ratings) AS average_rating,
    
    -- Judge/Credibility stats
    (SELECT COALESCE(AVG(credibility_score), 0) FROM judge_profiles) AS avg_credibility;

COMMIT;
