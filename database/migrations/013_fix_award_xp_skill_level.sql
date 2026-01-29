-- Migration 013: Fix award_xp function skill_level bug
-- The award_xp function was incorrectly updating skill_level
-- which has a constraint CHECK (skill_level IN ('beginner', 'intermediate', 'expert'))
-- but level_name can be 'advanced', 'master', 'grandmaster'
-- Created: 2026-01-29

BEGIN;

-- =============================================================================
-- FIX AWARD_XP FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION award_xp(user_uuid UUID, xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
    new_xp INTEGER;
    new_level INTEGER;
    new_level_name VARCHAR(50);
BEGIN
    -- Add XP
    UPDATE users 
    SET experience_points = experience_points + xp_amount
    WHERE id = user_uuid
    RETURNING experience_points INTO new_xp;
    
    -- Calculate new level
    new_level := calculate_level(new_xp);
    new_level_name := calculate_level_name(new_level);
    
    -- Update level if changed (DON'T touch skill_level - it's user's self-reported skill)
    UPDATE users
    SET level = new_level,
        level_name = new_level_name
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

COMMIT;
