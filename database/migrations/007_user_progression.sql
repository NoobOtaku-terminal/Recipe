-- User Progression System
-- Migration 007

BEGIN;

-- =============================================================================
-- USER EXPERIENCE POINTS (XP) SYSTEM
-- =============================================================================

-- Add XP and level tracking to users
ALTER TABLE users
ADD COLUMN experience_points INTEGER DEFAULT 0,
ADD COLUMN level INTEGER DEFAULT 1,
ADD COLUMN level_name VARCHAR(50) DEFAULT 'beginner';

-- Create index for leaderboard queries
CREATE INDEX idx_users_xp ON users(experience_points DESC);
CREATE INDEX idx_users_level ON users(level DESC);

-- =============================================================================
-- XP REWARD CONSTANTS
-- =============================================================================
-- Recipe created: +10 XP
-- Vote received: +5 XP
-- Comment received: +3 XP
-- Battle participation (entry): +15 XP
-- Battle win (1st place): +50 XP
-- Battle 2nd place: +25 XP
-- Battle 3rd place: +10 XP

-- =============================================================================
-- LEVEL THRESHOLDS
-- =============================================================================
-- Level 1 (Beginner): 0-99 XP
-- Level 2 (Intermediate): 100-299 XP
-- Level 3 (Advanced): 300-599 XP
-- Level 4 (Expert): 600-999 XP
-- Level 5 (Master): 1000-1499 XP
-- Level 6 (Grandmaster): 1500+ XP

-- =============================================================================
-- FUNCTION: Calculate level from XP
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF xp < 100 THEN
        RETURN 1;
    ELSIF xp < 300 THEN
        RETURN 2;
    ELSIF xp < 600 THEN
        RETURN 3;
    ELSIF xp < 1000 THEN
        RETURN 4;
    ELSIF xp < 1500 THEN
        RETURN 5;
    ELSE
        RETURN 6;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- FUNCTION: Calculate level name from level number
-- =============================================================================
CREATE OR REPLACE FUNCTION calculate_level_name(lvl INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
    CASE lvl
        WHEN 1 THEN RETURN 'beginner';
        WHEN 2 THEN RETURN 'intermediate';
        WHEN 3 THEN RETURN 'advanced';
        WHEN 4 THEN RETURN 'expert';
        WHEN 5 THEN RETURN 'master';
        ELSE RETURN 'grandmaster';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- FUNCTION: Award XP to user and update level
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
    
    -- Update level if changed
    UPDATE users
    SET level = new_level,
        level_name = new_level_name,
        skill_level = new_level_name
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Award XP when recipe is created
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_recipe_xp()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM award_xp(NEW.author_id, 10);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipe_created_xp
AFTER INSERT ON recipes
FOR EACH ROW
EXECUTE FUNCTION trigger_recipe_xp();

-- =============================================================================
-- TRIGGER: Award XP when recipe receives a vote
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_vote_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author_id UUID;
BEGIN
    -- Get the recipe author
    SELECT author_id INTO recipe_author_id
    FROM recipes
    WHERE id = NEW.recipe_id;
    
    -- Award XP to recipe author (not the voter)
    IF recipe_author_id IS NOT NULL THEN
        PERFORM award_xp(recipe_author_id, 5);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER battle_vote_xp
AFTER INSERT ON battle_votes
FOR EACH ROW
EXECUTE FUNCTION trigger_vote_xp();

-- =============================================================================
-- TRIGGER: Award XP when recipe receives a comment
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_comment_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author_id UUID;
BEGIN
    -- Get the recipe author
    SELECT author_id INTO recipe_author_id
    FROM recipes
    WHERE id = NEW.recipe_id;
    
    -- Award XP to recipe author (not the commenter)
    -- Only if commenter is different from author
    IF recipe_author_id IS NOT NULL AND recipe_author_id != NEW.user_id THEN
        PERFORM award_xp(recipe_author_id, 3);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_created_xp
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION trigger_comment_xp();

-- =============================================================================
-- TRIGGER: Award XP when entering a battle
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_battle_entry_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author_id UUID;
BEGIN
    -- Get the recipe author
    SELECT author_id INTO recipe_author_id
    FROM recipes
    WHERE id = NEW.recipe_id;
    
    -- Award XP for participating in battle
    IF recipe_author_id IS NOT NULL THEN
        PERFORM award_xp(recipe_author_id, 15);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER battle_entry_xp
AFTER INSERT ON battle_entries
FOR EACH ROW
EXECUTE FUNCTION trigger_battle_entry_xp();

-- =============================================================================
-- TRIGGER: Award XP when recipe receives a rating
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_rating_xp()
RETURNS TRIGGER AS $$
DECLARE
    recipe_author_id UUID;
BEGIN
    -- Get the recipe author
    SELECT author_id INTO recipe_author_id
    FROM recipes
    WHERE id = NEW.recipe_id;
    
    -- Award XP to recipe author (not the rater)
    IF recipe_author_id IS NOT NULL AND recipe_author_id != NEW.user_id THEN
        PERFORM award_xp(recipe_author_id, 2);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rating_created_xp
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION trigger_rating_xp();

-- =============================================================================
-- UPDATE EXISTING USERS
-- =============================================================================

-- Set all existing users to level 1 with 0 XP
UPDATE users
SET experience_points = 0,
    level = 1,
    level_name = 'beginner'
WHERE experience_points IS NULL;

-- =============================================================================
-- USER PROGRESSION VIEW
-- =============================================================================

CREATE OR REPLACE VIEW user_progression AS
SELECT 
    u.id,
    u.username,
    u.experience_points AS xp,
    u.level,
    u.level_name,
    -- Calculate XP progress in current level
    CASE 
        WHEN u.level = 1 THEN u.experience_points
        WHEN u.level = 2 THEN u.experience_points - 100
        WHEN u.level = 3 THEN u.experience_points - 300
        WHEN u.level = 4 THEN u.experience_points - 600
        WHEN u.level = 5 THEN u.experience_points - 1000
        ELSE u.experience_points - 1500
    END AS xp_in_current_level,
    -- Calculate XP needed for next level
    CASE 
        WHEN u.level = 1 THEN 100
        WHEN u.level = 2 THEN 200
        WHEN u.level = 3 THEN 300
        WHEN u.level = 4 THEN 400
        WHEN u.level = 5 THEN 500
        ELSE 999999  -- Max level reached
    END AS xp_needed_for_next_level,
    -- Calculate progress percentage
    CASE 
        WHEN u.level = 1 THEN (u.experience_points::FLOAT / 100 * 100)::INTEGER
        WHEN u.level = 2 THEN ((u.experience_points - 100)::FLOAT / 200 * 100)::INTEGER
        WHEN u.level = 3 THEN ((u.experience_points - 300)::FLOAT / 300 * 100)::INTEGER
        WHEN u.level = 4 THEN ((u.experience_points - 600)::FLOAT / 400 * 100)::INTEGER
        WHEN u.level = 5 THEN ((u.experience_points - 1000)::FLOAT / 500 * 100)::INTEGER
        ELSE 100  -- Max level
    END AS level_progress_percent,
    -- User stats
    (SELECT COUNT(*) FROM recipes WHERE author_id = u.id) AS recipes_created,
    (SELECT COUNT(*) FROM battle_entries be 
     JOIN recipes r ON be.recipe_id = r.id 
     WHERE r.author_id = u.id) AS battles_entered,
    (SELECT COUNT(*) FROM battle_votes bv 
     JOIN recipes r ON bv.recipe_id = r.id 
     WHERE r.author_id = u.id) AS votes_received,
    (SELECT COUNT(*) FROM comments c 
     JOIN recipes r ON c.recipe_id = r.id 
     WHERE r.author_id = u.id AND c.user_id != u.id) AS comments_received
FROM users u
ORDER BY u.experience_points DESC, u.created_at ASC;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 007: User Progression System created successfully!';
    RAISE NOTICE 'XP Rewards: Recipe +10, Vote +5, Comment +3, Battle Entry +15, Rating +2';
    RAISE NOTICE 'Levels: 1=Beginner(0-99), 2=Intermediate(100-299), 3=Advanced(300-599)';
    RAISE NOTICE '        4=Expert(600-999), 5=Master(1000-1499), 6=Grandmaster(1500+)';
END $$;
