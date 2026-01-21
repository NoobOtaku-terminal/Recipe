-- Migration 003: Triggers and Functions
-- Recipe Battle Platform - Automated Updates
-- Created: 2026-01-08

BEGIN;

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_judge_profiles_updated_at BEFORE UPDATE ON judge_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- JUDGE PROFILE AUTO-CREATION
-- =============================================================================

CREATE OR REPLACE FUNCTION create_judge_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO judge_profiles (user_id, level, credibility_score, verified_reviews_count)
    VALUES (NEW.id, 'Beginner Taster', 0.0, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_judge_profile AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_judge_profile();

-- =============================================================================
-- CREDIBILITY SCORE CALCULATION
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_credibility_score(p_user_id UUID)
RETURNS FLOAT AS $$
DECLARE
    v_verified_count INT;
    v_total_comments INT;
    v_battle_participations INT;
    v_score FLOAT;
BEGIN
    -- Count verified comments
    SELECT COUNT(*) INTO v_verified_count
    FROM comments
    WHERE user_id = p_user_id AND is_verified = TRUE;
    
    -- Count total comments
    SELECT COUNT(*) INTO v_total_comments
    FROM comments
    WHERE user_id = p_user_id;
    
    -- Count battle participations
    SELECT COUNT(*) INTO v_battle_participations
    FROM battle_votes
    WHERE user_id = p_user_id;
    
    -- Calculate score (weighted formula)
    v_score := (v_verified_count * 10.0) + 
               (v_total_comments * 2.0) + 
               (v_battle_participations * 5.0);
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATE JUDGE CREDIBILITY ON VERIFIED COMMENT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_judge_credibility_on_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_new_score FLOAT;
    v_new_level VARCHAR(20);
BEGIN
    IF NEW.is_verified = TRUE AND (OLD IS NULL OR OLD.is_verified = FALSE) THEN
        -- Recalculate score
        v_new_score := calculate_credibility_score(NEW.user_id);
        
        -- Determine new level
        IF v_new_score >= 500 THEN
            v_new_level := 'Master Critic';
        ELSIF v_new_score >= 100 THEN
            v_new_level := 'Home Chef';
        ELSE
            v_new_level := 'Beginner Taster';
        END IF;
        
        -- Update judge profile
        UPDATE judge_profiles
        SET credibility_score = v_new_score,
            level = v_new_level,
            verified_reviews_count = verified_reviews_count + 1
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credibility_on_verified_comment 
AFTER INSERT OR UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_judge_credibility_on_comment();

-- =============================================================================
-- PREVENT DUPLICATE RATINGS
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_self_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_author_id UUID;
BEGIN
    SELECT author_id INTO v_author_id FROM recipes WHERE id = NEW.recipe_id;
    
    IF v_author_id = NEW.user_id THEN
        RAISE EXCEPTION 'Users cannot rate their own recipes';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_self_rating BEFORE INSERT ON ratings
    FOR EACH ROW EXECUTE FUNCTION prevent_self_rating();

-- =============================================================================
-- VALIDATE BATTLE VOTE
-- =============================================================================

CREATE OR REPLACE FUNCTION validate_battle_vote()
RETURNS TRIGGER AS $$
DECLARE
    v_battle_status VARCHAR(20);
BEGIN
    -- Check battle is active
    SELECT status INTO v_battle_status FROM battles WHERE id = NEW.battle_id;
    
    IF v_battle_status != 'active' THEN
        RAISE EXCEPTION 'Battle is not active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_battle_vote BEFORE INSERT ON battle_votes
    FOR EACH ROW EXECUTE FUNCTION validate_battle_vote();

COMMIT;
