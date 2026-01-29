-- Migration 012: Recipe Likes and Enhanced Features
-- Add like/dislike system and improve recipe editing
-- Created: 2026-01-27

BEGIN;

-- =============================================================================
-- RECIPE LIKES SYSTEM (separate from star ratings)
-- =============================================================================

CREATE TABLE recipe_likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL, -- true = like, false = dislike
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX idx_recipe_likes_recipe ON recipe_likes(recipe_id);
CREATE INDEX idx_recipe_likes_user ON recipe_likes(user_id);

-- Prevent self-liking
CREATE OR REPLACE FUNCTION prevent_self_like()
RETURNS TRIGGER AS $$
DECLARE
    v_author_id UUID;
BEGIN
    SELECT author_id INTO v_author_id FROM recipes WHERE id = NEW.recipe_id;
    
    IF v_author_id = NEW.user_id THEN
        RAISE EXCEPTION 'Users cannot like/dislike their own recipes';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_self_like BEFORE INSERT OR UPDATE ON recipe_likes
    FOR EACH ROW EXECUTE FUNCTION prevent_self_like();

-- =============================================================================
-- XP REWARDS FOR LIKES
-- =============================================================================

-- Award XP when recipe receives a like (+1 XP)
-- Remove XP when like changes to dislike (or vice versa)
CREATE OR REPLACE FUNCTION trigger_like_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author_id UUID;
    new_xp INTEGER;
    new_level INTEGER;
    new_level_name VARCHAR(50);
BEGIN
    -- Get the recipe author
    SELECT author_id INTO recipe_author_id
    FROM recipes
    WHERE id = NEW.recipe_id;
    
    IF recipe_author_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- ON INSERT: Award XP for likes, nothing for dislikes
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_like = TRUE THEN
            PERFORM award_xp(recipe_author_id, 1);
        END IF;
    
    -- ON UPDATE: Handle like <-> dislike transitions
    ELSIF TG_OP = 'UPDATE' THEN
        -- Changed from dislike to like: +1 XP
        IF OLD.is_like = FALSE AND NEW.is_like = TRUE THEN
            PERFORM award_xp(recipe_author_id, 1);
        
        -- Changed from like to dislike: -1 XP (if XP > 0)
        ELSIF OLD.is_like = TRUE AND NEW.is_like = FALSE THEN
            UPDATE users
            SET experience_points = GREATEST(0, experience_points - 1)
            WHERE id = recipe_author_id
            RETURNING experience_points INTO new_xp;
            
            -- Recalculate level after XP change
            new_level := calculate_level(new_xp);
            new_level_name := calculate_level_name(new_level);
            
            UPDATE users
            SET level = new_level,
                level_name = new_level_name
            WHERE id = recipe_author_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_xp_trigger
AFTER INSERT OR UPDATE ON recipe_likes
FOR EACH ROW
EXECUTE FUNCTION trigger_like_xp();

-- Award XP back when like is deleted
CREATE OR REPLACE FUNCTION trigger_like_delete_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author_id UUID;
    new_xp INTEGER;
    new_level INTEGER;
    new_level_name VARCHAR(50);
BEGIN
    -- Get the recipe author
    SELECT author_id INTO recipe_author_id
    FROM recipes
    WHERE id = OLD.recipe_id;
    
    IF recipe_author_id IS NULL THEN
        RETURN OLD;
    END IF;
    
    -- If deleting a like, remove 1 XP
    IF OLD.is_like = TRUE THEN
        UPDATE users
        SET experience_points = GREATEST(0, experience_points - 1)
        WHERE id = recipe_author_id
        RETURNING experience_points INTO new_xp;
        
        -- Recalculate level
        new_level := calculate_level(new_xp);
        new_level_name := calculate_level_name(new_level);
        
        UPDATE users
        SET level = new_level,
            level_name = new_level_name
        WHERE id = recipe_author_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_delete_xp_trigger
AFTER DELETE ON recipe_likes
FOR EACH ROW
EXECUTE FUNCTION trigger_like_delete_xp();

-- =============================================================================
-- UPDATE RECIPE STATS VIEW TO INCLUDE LIKES
-- =============================================================================

-- Drop existing view
DROP VIEW IF EXISTS recipe_stats;

-- Recreate with likes/dislikes
CREATE OR REPLACE VIEW recipe_stats AS
SELECT 
    r.id,
    r.title,
    r.created_at,
    u.username AS author_name,
    COALESCE(AVG(rt.rating), 0) AS avg_rating,
    COUNT(DISTINCT rt.user_id) AS rating_count,
    COUNT(DISTINCT c.id) AS comment_count,
    COUNT(DISTINCT CASE WHEN rl.is_like = TRUE THEN rl.user_id END) AS like_count,
    COUNT(DISTINCT CASE WHEN rl.is_like = FALSE THEN rl.user_id END) AS dislike_count
FROM recipes r
LEFT JOIN users u ON r.author_id = u.id
LEFT JOIN ratings rt ON r.id = rt.recipe_id
LEFT JOIN comments c ON r.id = c.recipe_id
LEFT JOIN recipe_likes rl ON r.id = rl.recipe_id
GROUP BY r.id, r.title, r.created_at, u.username;

-- =============================================================================
-- AUTO-UPDATE TIMESTAMP ON RECIPE_LIKES
-- =============================================================================

CREATE TRIGGER update_recipe_likes_updated_at BEFORE UPDATE ON recipe_likes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
