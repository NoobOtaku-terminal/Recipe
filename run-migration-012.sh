#!/bin/bash
# Emergency script to run migration 012 directly on production database

# Run migration 012 directly in the postgres container
docker exec -i recipe_postgres psql -U recipeuser -d recipedb <<'EOF'

-- Migration 012: Recipe Likes and Improvements

-- Create recipe_likes table for like/dislike functionality
CREATE TABLE IF NOT EXISTS recipe_likes (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, recipe_id)
);

-- Add indexes for recipe_likes
CREATE INDEX IF NOT EXISTS idx_recipe_likes_recipe_id ON recipe_likes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_likes_user_id ON recipe_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_likes_created_at ON recipe_likes(created_at DESC);

-- Trigger to prevent self-liking
CREATE OR REPLACE FUNCTION prevent_self_like()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM recipes 
        WHERE recipe_id = NEW.recipe_id 
        AND author_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'Users cannot like their own recipes';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_self_like
    BEFORE INSERT OR UPDATE ON recipe_likes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_like();

-- Trigger to award XP for likes
CREATE OR REPLACE FUNCTION trigger_like_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author UUID;
BEGIN
    -- Get recipe author
    SELECT author_id INTO recipe_author
    FROM recipes
    WHERE recipe_id = NEW.recipe_id;

    -- Award XP based on like type
    IF TG_OP = 'INSERT' THEN
        -- Award +1 XP for new like
        IF NEW.is_like = true THEN
            PERFORM award_xp(recipe_author, 1);
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_like <> NEW.is_like THEN
        -- Like changed to dislike or vice versa
        IF NEW.is_like = true THEN
            PERFORM award_xp(recipe_author, 1);
        ELSE
            -- Remove XP when changing like to dislike
            PERFORM award_xp(recipe_author, -1);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_like_xp
    AFTER INSERT OR UPDATE ON recipe_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_like_xp();

-- Trigger to remove XP when like is deleted
CREATE OR REPLACE FUNCTION trigger_like_delete_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author UUID;
BEGIN
    -- Get recipe author
    SELECT author_id INTO recipe_author
    FROM recipes
    WHERE recipe_id = OLD.recipe_id;

    -- Remove XP if it was a like
    IF OLD.is_like = true THEN
        PERFORM award_xp(recipe_author, -1);
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_remove_like_xp
    AFTER DELETE ON recipe_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_like_delete_xp();

-- Update recipe_stats view to include like/dislike counts
DROP VIEW IF EXISTS recipe_stats CASCADE;

CREATE VIEW recipe_stats AS
SELECT 
    r.recipe_id,
    r.title,
    r.author_id,
    u.username as author_username,
    COUNT(DISTINCT rt.rating_id) as rating_count,
    COALESCE(AVG(rt.rating), 0) as average_rating,
    COUNT(DISTINCT c.comment_id) as comment_count,
    COUNT(DISTINCT CASE WHEN rl.is_like = true THEN rl.user_id END) as like_count,
    COUNT(DISTINCT CASE WHEN rl.is_like = false THEN rl.user_id END) as dislike_count,
    r.created_at,
    r.updated_at
FROM recipes r
LEFT JOIN users u ON r.author_id = u.user_id
LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id
LEFT JOIN comments c ON r.recipe_id = c.recipe_id
LEFT JOIN recipe_likes rl ON r.recipe_id = rl.recipe_id
GROUP BY r.recipe_id, r.title, r.author_id, u.username, r.created_at, r.updated_at;

-- Record migration
INSERT INTO schema_migrations (filename) 
VALUES ('012_recipe_likes_and_improvements.sql')
ON CONFLICT (filename) DO NOTHING;

EOF

echo "Migration 012 completed successfully!"
