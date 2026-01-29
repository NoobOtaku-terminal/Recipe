-- Migration 014: Fix broken like triggers from migration 012
-- The trigger_like_xp and trigger_like_delete_xp functions had invalid nested DECLARE blocks
-- This migration recreates them with correct syntax
-- Created: 2026-01-29

BEGIN;

-- =============================================================================
-- FIX TRIGGER_LIKE_XP FUNCTION
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

-- =============================================================================
-- FIX TRIGGER_LIKE_DELETE_XP FUNCTION
-- =============================================================================

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

COMMIT;
