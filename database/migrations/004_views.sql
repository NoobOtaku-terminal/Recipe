-- Migration 004: Views and Materialized Views
-- Recipe Battle Platform - Optimized Read Queries
-- Created: 2026-01-08

BEGIN;

-- =============================================================================
-- RECIPE AGGREGATES VIEW
-- =============================================================================

CREATE OR REPLACE VIEW recipe_stats AS
SELECT 
    r.id,
    r.title,
    r.author_id,
    u.username AS author_name,
    r.difficulty_claimed,
    r.cook_time_minutes,
    r.is_veg,
    r.created_at,
    COALESCE(AVG(rt.rating), 0) AS avg_rating,
    COUNT(DISTINCT rt.user_id) AS rating_count,
    COUNT(DISTINCT c.id) AS comment_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.is_verified = TRUE) AS verified_comment_count,
    -- Difficulty reality calculation
    (
        SELECT difficulty
        FROM difficulty_feedback df
        WHERE df.recipe_id = r.id
        GROUP BY difficulty
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ) AS most_common_difficulty_feedback
FROM recipes r
LEFT JOIN users u ON r.author_id = u.id
LEFT JOIN ratings rt ON r.id = rt.recipe_id
LEFT JOIN comments c ON r.id = c.recipe_id
GROUP BY r.id, u.username;

-- =============================================================================
-- JUDGE LEADERBOARD VIEW
-- =============================================================================

CREATE OR REPLACE VIEW judge_leaderboard AS
SELECT 
    u.id AS user_id,
    u.username,
    jp.level,
    jp.credibility_score,
    jp.verified_reviews_count,
    COUNT(DISTINCT c.id) AS total_comments,
    COUNT(DISTINCT bv.battle_id) AS battles_participated,
    RANK() OVER (ORDER BY jp.credibility_score DESC) AS rank
FROM users u
JOIN judge_profiles jp ON u.id = jp.user_id
LEFT JOIN comments c ON u.id = c.user_id
LEFT JOIN battle_votes bv ON u.id = bv.user_id
GROUP BY u.id, u.username, jp.level, jp.credibility_score, jp.verified_reviews_count
ORDER BY jp.credibility_score DESC;

-- =============================================================================
-- BATTLE RESULTS VIEW
-- =============================================================================

CREATE OR REPLACE VIEW battle_results AS
SELECT 
    b.id AS battle_id,
    b.dish_name,
    b.status,
    b.starts_at,
    b.ends_at,
    be.recipe_id,
    r.title AS recipe_title,
    u.username AS recipe_author,
    COUNT(bv.user_id) AS vote_count,
    RANK() OVER (PARTITION BY b.id ORDER BY COUNT(bv.user_id) DESC) AS rank
FROM battles b
JOIN battle_entries be ON b.id = be.battle_id
JOIN recipes r ON be.recipe_id = r.id
JOIN users u ON r.author_id = u.id
LEFT JOIN battle_votes bv ON b.id = bv.battle_id AND be.recipe_id = bv.recipe_id
GROUP BY b.id, b.dish_name, b.status, b.starts_at, b.ends_at, be.recipe_id, r.title, u.username
ORDER BY b.created_at DESC, rank;

-- =============================================================================
-- USER PROFILE VIEW
-- =============================================================================

CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.bio,
    u.skill_level,
    u.created_at,
    jp.level AS judge_level,
    jp.credibility_score,
    jp.verified_reviews_count,
    COUNT(DISTINCT r.id) AS recipes_created,
    COUNT(DISTINCT rt.recipe_id) AS recipes_rated,
    COUNT(DISTINCT c.id) AS comments_made,
    COUNT(DISTINCT ub.badge_id) AS badges_earned,
    ARRAY_AGG(DISTINCT uc.cuisine_id) AS preferred_cuisines
FROM users u
LEFT JOIN judge_profiles jp ON u.id = jp.user_id
LEFT JOIN recipes r ON u.id = r.author_id
LEFT JOIN ratings rt ON u.id = rt.user_id
LEFT JOIN comments c ON u.id = c.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN user_cuisines uc ON u.id = uc.user_id
LEFT JOIN cuisines cu ON uc.cuisine_id = cu.id
GROUP BY u.id, jp.level, jp.credibility_score, jp.verified_reviews_count;

-- =============================================================================
-- MATERIALIZED VIEW: TRENDING RECIPES
-- =============================================================================

CREATE MATERIALIZED VIEW trending_recipes AS
SELECT 
    r.id,
    r.title,
    r.author_id,
    u.username AS author_name,
    r.difficulty_claimed,
    r.is_veg,
    COALESCE(AVG(rt.rating), 0) AS avg_rating,
    COUNT(DISTINCT rt.user_id) AS rating_count,
    COUNT(DISTINCT c.id) AS comment_count,
    -- Trending score: weighted by recency and engagement
    (
        COUNT(DISTINCT rt.user_id) * 2 +
        COUNT(DISTINCT c.id) * 3 +
        EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400 * -0.5
    ) AS trending_score
FROM recipes r
LEFT JOIN users u ON r.author_id = u.id
LEFT JOIN ratings rt ON r.id = rt.recipe_id AND rt.created_at > NOW() - INTERVAL '30 days'
LEFT JOIN comments c ON r.id = c.recipe_id AND c.created_at > NOW() - INTERVAL '30 days'
WHERE r.created_at > NOW() - INTERVAL '90 days'
GROUP BY r.id, u.username
ORDER BY trending_score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_trending_recipes_id ON trending_recipes(id);

-- =============================================================================
-- MATERIALIZED VIEW: TOP RECIPES BY CUISINE
-- =============================================================================

CREATE MATERIALIZED VIEW top_recipes_by_cuisine AS
SELECT 
    cu.id AS cuisine_id,
    cu.name AS cuisine_name,
    r.id AS recipe_id,
    r.title,
    u.username AS author_name,
    COALESCE(AVG(rt.rating), 0) AS avg_rating,
    COUNT(DISTINCT rt.user_id) AS rating_count,
    RANK() OVER (PARTITION BY cu.id ORDER BY COALESCE(AVG(rt.rating), 0) DESC, COUNT(DISTINCT rt.user_id) DESC) AS rank
FROM cuisines cu
JOIN recipe_cuisines rc ON cu.id = rc.cuisine_id
JOIN recipes r ON rc.recipe_id = r.id
LEFT JOIN users u ON r.author_id = u.id
LEFT JOIN ratings rt ON r.id = rt.recipe_id
GROUP BY cu.id, cu.name, r.id, u.username
HAVING COUNT(DISTINCT rt.user_id) >= 3;  -- Minimum 3 ratings

CREATE INDEX idx_top_recipes_cuisine ON top_recipes_by_cuisine(cuisine_id, rank);

-- =============================================================================
-- REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- =============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_recipes;
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_recipes_by_cuisine;
END;
$$ LANGUAGE plpgsql;

COMMIT;
