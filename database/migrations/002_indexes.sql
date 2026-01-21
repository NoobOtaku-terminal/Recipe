-- Migration 002: Indexes and Performance Optimization
-- Recipe Battle Platform
-- Created: 2026-01-08

BEGIN;

-- =============================================================================
-- PRIMARY LOOKUPS
-- =============================================================================

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Recipe lookups
CREATE INDEX idx_recipes_author ON recipes(author_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_updated_at ON recipes(updated_at DESC);

-- =============================================================================
-- FILTERING & SEARCH
-- =============================================================================

-- Recipe filtering
CREATE INDEX idx_recipes_is_veg ON recipes(is_veg);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty_claimed);
CREATE INDEX idx_recipes_cook_time ON recipes(cook_time_minutes);
CREATE INDEX idx_recipes_calories ON recipes(calories);

-- Composite index for common search patterns
CREATE INDEX idx_recipes_search ON recipes(is_veg, difficulty_claimed, cook_time_minutes);

-- Full-text search on recipes (optional, for future enhancement)
CREATE INDEX idx_recipes_title_trgm ON recipes USING gin(title gin_trgm_ops);
CREATE INDEX idx_recipes_description_trgm ON recipes USING gin(description gin_trgm_ops);

-- =============================================================================
-- RELATIONSHIPS
-- =============================================================================

-- Recipe steps ordering
CREATE INDEX idx_recipe_steps_recipe_stepno ON recipe_steps(recipe_id, step_no);

-- Ratings
CREATE INDEX idx_ratings_recipe ON ratings(recipe_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- Comments
CREATE INDEX idx_comments_recipe ON comments(recipe_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_verified ON comments(is_verified);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Recipe media
CREATE INDEX idx_recipe_media_recipe ON recipe_media(recipe_id);

-- Comment media
CREATE INDEX idx_comment_media_comment ON comment_media(comment_id);

-- =============================================================================
-- BATTLES & VOTING
-- =============================================================================

-- Battle lookups
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_starts_at ON battles(starts_at);
CREATE INDEX idx_battles_ends_at ON battles(ends_at);

-- Battle entries
CREATE INDEX idx_battle_entries_battle ON battle_entries(battle_id);
CREATE INDEX idx_battle_entries_recipe ON battle_entries(recipe_id);

-- Battle votes
CREATE INDEX idx_battle_votes_battle ON battle_votes(battle_id);
CREATE INDEX idx_battle_votes_recipe ON battle_votes(recipe_id);
CREATE INDEX idx_battle_votes_user ON battle_votes(user_id);

-- =============================================================================
-- JUDGE CREDIBILITY
-- =============================================================================

-- Judge rankings
CREATE INDEX idx_judge_profiles_level ON judge_profiles(level);
CREATE INDEX idx_judge_profiles_score ON judge_profiles(credibility_score DESC);
CREATE INDEX idx_judge_profiles_reviews ON judge_profiles(verified_reviews_count DESC);

-- =============================================================================
-- DIFFICULTY FEEDBACK
-- =============================================================================

CREATE INDEX idx_difficulty_feedback_recipe ON difficulty_feedback(recipe_id);

-- =============================================================================
-- BADGES
-- =============================================================================

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_awarded ON user_badges(awarded_at DESC);

COMMIT;
