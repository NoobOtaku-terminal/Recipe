-- Battle System Enhancements & Admin Features
-- Migration 005

BEGIN;

-- =============================================================================
-- BATTLE SYSTEM ENHANCEMENTS
-- =============================================================================

-- Add proof_media_id to battle_votes (users must upload proof of cooking to vote)
ALTER TABLE battle_votes 
ADD COLUMN proof_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
ADD COLUMN notes TEXT,
ADD COLUMN verified BOOLEAN DEFAULT FALSE;

-- Create index for faster proof lookups
CREATE INDEX idx_battle_votes_proof ON battle_votes(proof_media_id);

-- Add creator_id to battles (who created the battle)
ALTER TABLE battles
ADD COLUMN creator_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for battle creators
CREATE INDEX idx_battles_creator ON battles(creator_id);

-- =============================================================================
-- ADMIN SYSTEM
-- =============================================================================

-- Add admin role to users
ALTER TABLE users
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN is_moderator BOOLEAN DEFAULT FALSE;

-- Create admin activity log
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- 'user', 'recipe', 'battle', 'comment', etc.
    target_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for admin log queries
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);

-- Add moderation fields to recipes
ALTER TABLE recipes
ADD COLUMN is_approved BOOLEAN DEFAULT TRUE,
ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN moderation_notes TEXT;

-- Add moderation fields to comments
ALTER TABLE comments
ADD COLUMN is_approved BOOLEAN DEFAULT TRUE,
ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;

-- =============================================================================
-- BATTLE STATISTICS VIEW
-- =============================================================================

CREATE OR REPLACE VIEW battle_statistics AS
SELECT 
    b.id AS battle_id,
    b.dish_name,
    b.status,
    b.starts_at,
    b.ends_at,
    COUNT(DISTINCT be.recipe_id) AS entry_count,
    COUNT(DISTINCT bv.user_id) AS voter_count,
    COUNT(DISTINCT CASE WHEN bv.verified THEN bv.user_id END) AS verified_voter_count,
    u.username AS creator_name
FROM battles b
LEFT JOIN battle_entries be ON b.id = be.battle_id
LEFT JOIN battle_votes bv ON b.id = bv.battle_id
LEFT JOIN users u ON b.creator_id = u.id
GROUP BY b.id, b.dish_name, b.status, b.starts_at, b.ends_at, u.username;

-- =============================================================================
-- ADMIN STATISTICS VIEW
-- =============================================================================

CREATE OR REPLACE VIEW admin_statistics AS
SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS new_users_week,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days') AS new_users_month,
    (SELECT COUNT(*) FROM recipes) AS total_recipes,
    (SELECT COUNT(*) FROM recipes WHERE is_flagged) AS flagged_recipes,
    (SELECT COUNT(*) FROM recipes WHERE created_at > NOW() - INTERVAL '7 days') AS new_recipes_week,
    (SELECT COUNT(*) FROM battles) AS total_battles,
    (SELECT COUNT(*) FROM battles WHERE status = 'active') AS active_battles,
    (SELECT COUNT(*) FROM comments) AS total_comments,
    (SELECT COUNT(*) FROM comments WHERE is_flagged) AS flagged_comments,
    (SELECT COUNT(*) FROM ratings) AS total_ratings,
    (SELECT AVG(rating) FROM ratings) AS average_rating;

COMMIT;
