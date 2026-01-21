-- Video Proof System Enhancements
-- Migration 008: Add video-specific validations and battle winner rewards

BEGIN;

-- =============================================================================
-- VIDEO PROOF VALIDATIONS
-- =============================================================================

-- Add video-specific metadata to media table
ALTER TABLE media
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS upload_ip INET,
ADD COLUMN IF NOT EXISTS video_hash VARCHAR(64); -- SHA256 hash for duplicate detection

-- Create indexes for video validation queries
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_video_hash ON media(video_hash);

-- Add proof submission timestamp to battle_votes
ALTER TABLE battle_votes
ADD COLUMN IF NOT EXISTS proof_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS proof_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for proof verification queue
CREATE INDEX IF NOT EXISTS idx_battle_votes_pending_verification ON battle_votes(verified) 
WHERE verified = FALSE AND proof_media_id IS NOT NULL;

-- =============================================================================
-- BATTLE WINNER XP REWARDS
-- =============================================================================

-- Create battle_winners table to track final winners (different from battle_results view)
CREATE TABLE IF NOT EXISTS battle_winners (
    battle_id UUID PRIMARY KEY REFERENCES battles(id) ON DELETE CASCADE,
    first_place_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    second_place_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    third_place_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    first_place_votes INTEGER,
    second_place_votes INTEGER,
    third_place_votes INTEGER,
    calculated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for battle winners
CREATE INDEX IF NOT EXISTS idx_battle_winners_recipes ON battle_winners(
    first_place_recipe_id, 
    second_place_recipe_id, 
    third_place_recipe_id
);

-- =============================================================================
-- FUNCTION: Validate video proof requirements
-- =============================================================================
CREATE OR REPLACE FUNCTION validate_video_proof(media_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_media_type VARCHAR(20);
    v_file_size BIGINT;
    v_duration INTEGER;
BEGIN
    -- Get media details
    SELECT media_type, file_size_bytes, duration_seconds
    INTO v_media_type, v_file_size, v_duration
    FROM media
    WHERE id = media_uuid;
    
    -- Check if media exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Media not found';
    END IF;
    
    -- Must be a video
    IF v_media_type != 'video' THEN
        RAISE EXCEPTION 'Proof must be a video';
    END IF;
    
    -- Max 20MB (20 * 1024 * 1024 bytes)
    IF v_file_size > 20971520 THEN
        RAISE EXCEPTION 'Video must be under 20MB';
    END IF;
    
    -- Max 60 seconds duration
    IF v_duration > 60 THEN
        RAISE EXCEPTION 'Video must be under 60 seconds';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCTION: Calculate battle winners and award XP
-- =============================================================================
CREATE OR REPLACE FUNCTION finalize_battle(battle_uuid UUID)
RETURNS VOID AS $$
DECLARE
    v_first_recipe UUID;
    v_second_recipe UUID;
    v_third_recipe UUID;
    v_first_votes INTEGER;
    v_second_votes INTEGER;
    v_third_votes INTEGER;
    v_first_author UUID;
    v_second_author UUID;
    v_third_author UUID;
BEGIN
    -- Get top 3 recipes by verified vote count
    SELECT recipe_id, vote_count
    INTO v_first_recipe, v_first_votes
    FROM (
        SELECT bv.recipe_id, COUNT(*) as vote_count
        FROM battle_votes bv
        WHERE bv.battle_id = battle_uuid 
        AND bv.verified = TRUE
        GROUP BY bv.recipe_id
        ORDER BY vote_count DESC
        LIMIT 1
    ) top1;
    
    SELECT recipe_id, vote_count
    INTO v_second_recipe, v_second_votes
    FROM (
        SELECT bv.recipe_id, COUNT(*) as vote_count
        FROM battle_votes bv
        WHERE bv.battle_id = battle_uuid 
        AND bv.verified = TRUE
        AND bv.recipe_id != v_first_recipe
        GROUP BY bv.recipe_id
        ORDER BY vote_count DESC
        LIMIT 1
    ) top2;
    
    SELECT recipe_id, vote_count
    INTO v_third_recipe, v_third_votes
    FROM (
        SELECT bv.recipe_id, COUNT(*) as vote_count
        FROM battle_votes bv
        WHERE bv.battle_id = battle_uuid 
        AND bv.verified = TRUE
        AND bv.recipe_id NOT IN (v_first_recipe, v_second_recipe)
        GROUP BY bv.recipe_id
        ORDER BY vote_count DESC
        LIMIT 1
    ) top3;
    
    -- Insert or update battle winners
    INSERT INTO battle_winners (
        battle_id,
        first_place_recipe_id,
        second_place_recipe_id,
        third_place_recipe_id,
        first_place_votes,
        second_place_votes,
        third_place_votes
    ) VALUES (
        battle_uuid,
        v_first_recipe,
        v_second_recipe,
        v_third_recipe,
        v_first_votes,
        v_second_votes,
        v_third_votes
    )
    ON CONFLICT (battle_id) DO UPDATE SET
        first_place_recipe_id = EXCLUDED.first_place_recipe_id,
        second_place_recipe_id = EXCLUDED.second_place_recipe_id,
        third_place_recipe_id = EXCLUDED.third_place_recipe_id,
        first_place_votes = EXCLUDED.first_place_votes,
        second_place_votes = EXCLUDED.second_place_votes,
        third_place_votes = EXCLUDED.third_place_votes,
        calculated_at = NOW();
    
    -- Award XP to winners
    -- 1st place: +50 XP
    IF v_first_recipe IS NOT NULL THEN
        SELECT author_id INTO v_first_author FROM recipes WHERE id = v_first_recipe;
        IF v_first_author IS NOT NULL THEN
            PERFORM award_xp(v_first_author, 50);
        END IF;
    END IF;
    
    -- 2nd place: +25 XP
    IF v_second_recipe IS NOT NULL THEN
        SELECT author_id INTO v_second_author FROM recipes WHERE id = v_second_recipe;
        IF v_second_author IS NOT NULL THEN
            PERFORM award_xp(v_second_author, 25);
        END IF;
    END IF;
    
    -- 3rd place: +10 XP
    IF v_third_recipe IS NOT NULL THEN
        SELECT author_id INTO v_third_author FROM recipes WHERE id = v_third_recipe;
        IF v_third_author IS NOT NULL THEN
            PERFORM award_xp(v_third_author, 10);
        END IF;
    END IF;
    
    -- Update battle status to closed
    UPDATE battles
    SET status = 'closed'
    WHERE id = battle_uuid;
    
    RAISE NOTICE 'Battle finalized. Winners: 1st=% (% votes), 2nd=% (% votes), 3rd=% (% votes)',
        v_first_recipe, v_first_votes, v_second_recipe, v_second_votes, v_third_recipe, v_third_votes;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: Prevent voting without verified proof
-- =============================================================================
CREATE OR REPLACE FUNCTION enforce_verified_proof_voting()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if proof is required (for active battles)
    IF (SELECT status FROM battles WHERE id = NEW.battle_id) = 'active' THEN
        -- Proof media must be provided
        IF NEW.proof_media_id IS NULL THEN
            RAISE EXCEPTION 'Proof of cooking is required to vote in battles';
        END IF;
        
        -- Validate video proof
        PERFORM validate_video_proof(NEW.proof_media_id);
        
        -- Set submission timestamp
        NEW.proof_submitted_at := NOW();
        
        -- Auto-approve for trusted users (level 4+), otherwise pending
        IF (SELECT level FROM users WHERE id = NEW.user_id) >= 4 THEN
            NEW.verified := TRUE;
            NEW.proof_verified_at := NOW();
        ELSE
            NEW.verified := FALSE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_proof_on_vote ON battle_votes;
CREATE TRIGGER enforce_proof_on_vote
BEFORE INSERT ON battle_votes
FOR EACH ROW
EXECUTE FUNCTION enforce_verified_proof_voting();

-- =============================================================================
-- FUNCTION: Admin verify proof
-- =============================================================================
CREATE OR REPLACE FUNCTION verify_battle_proof(
    vote_battle_id UUID,
    vote_user_id UUID,
    admin_id UUID,
    approval BOOLEAN,
    admin_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Verify admin has permission
    IF NOT (SELECT is_admin OR is_moderator FROM users WHERE id = admin_id) THEN
        RAISE EXCEPTION 'Only admins can verify proofs';
    END IF;
    
    -- Update vote verification
    UPDATE battle_votes
    SET 
        verified = approval,
        proof_verified_at = NOW(),
        verified_by = admin_id,
        notes = COALESCE(admin_notes, notes)
    WHERE battle_id = vote_battle_id 
    AND user_id = vote_user_id;
    
    -- Log admin action
    INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
    VALUES (
        admin_id,
        CASE WHEN approval THEN 'APPROVE_PROOF' ELSE 'REJECT_PROOF' END,
        'battle_vote',
        vote_user_id,
        jsonb_build_object(
            'battle_id', vote_battle_id,
            'user_id', vote_user_id,
            'notes', admin_notes
        )
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS FOR PROOF MANAGEMENT
-- =============================================================================

-- Pending proof verification queue
CREATE OR REPLACE VIEW pending_proof_verifications AS
SELECT 
    bv.battle_id,
    bv.user_id,
    u.username,
    u.level,
    b.dish_name,
    bv.recipe_id,
    r.title AS recipe_title,
    m.url AS proof_video_url,
    m.file_size_bytes,
    m.duration_seconds,
    bv.proof_submitted_at,
    bv.notes,
    EXTRACT(EPOCH FROM (NOW() - bv.proof_submitted_at)) / 3600 AS hours_pending
FROM battle_votes bv
JOIN users u ON bv.user_id = u.id
JOIN battles b ON bv.battle_id = b.id
JOIN recipes r ON bv.recipe_id = r.id
JOIN media m ON bv.proof_media_id = m.id
WHERE bv.verified = FALSE
AND bv.proof_media_id IS NOT NULL
ORDER BY bv.proof_submitted_at ASC;

-- Battle winners with detailed information
CREATE OR REPLACE VIEW battle_winners_detailed AS
SELECT 
    bw.battle_id,
    b.dish_name,
    b.status,
    -- 1st place
    r1.title AS first_place_recipe,
    u1.username AS first_place_author,
    bw.first_place_votes,
    -- 2nd place
    r2.title AS second_place_recipe,
    u2.username AS second_place_author,
    bw.second_place_votes,
    -- 3rd place
    r3.title AS third_place_recipe,
    u3.username AS third_place_author,
    bw.third_place_votes,
    bw.calculated_at,
    -- Total participants
    (SELECT COUNT(DISTINCT be.recipe_id) 
     FROM battle_entries be 
     WHERE be.battle_id = bw.battle_id) AS total_entries,
    (SELECT COUNT(DISTINCT bv.user_id) 
     FROM battle_votes bv 
     WHERE bv.battle_id = bw.battle_id AND bv.verified = TRUE) AS total_verified_voters
FROM battle_winners bw
JOIN battles b ON bw.battle_id = b.id
LEFT JOIN recipes r1 ON bw.first_place_recipe_id = r1.id
LEFT JOIN users u1 ON r1.author_id = u1.id
LEFT JOIN recipes r2 ON bw.second_place_recipe_id = r2.id
LEFT JOIN users u2 ON r2.author_id = u2.id
LEFT JOIN recipes r3 ON bw.third_place_recipe_id = r3.id
LEFT JOIN users u3 ON r3.author_id = u3.id
ORDER BY bw.calculated_at DESC;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 008: Video Proof Enhancements completed!';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '  - Video validation (20MB max, 60s max)';
    RAISE NOTICE '  - Duplicate detection via SHA256 hash';
    RAISE NOTICE '  - Auto-approval for Level 4+ users';
    RAISE NOTICE '  - Battle winner XP awards (1st: +50, 2nd: +25, 3rd: +10)';
    RAISE NOTICE '  - Admin proof verification workflow';
    RAISE NOTICE '  - Pending proof queue view';
END $$;
