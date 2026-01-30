-- Migration 015: Allow images as battle proofs (not just videos)
-- This updates the validation function to accept both images and videos

-- =============================================================================
-- FUNCTION: Validate media proof requirements (images or videos)
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
    
    -- Must be an image or video
    IF v_media_type NOT IN ('image', 'video') THEN
        RAISE EXCEPTION 'Proof must be an image or video';
    END IF;
    
    -- If it's a video, enforce video-specific constraints
    IF v_media_type = 'video' THEN
        -- Max 20MB (20 * 1024 * 1024 bytes)
        IF v_file_size > 20971520 THEN
            RAISE EXCEPTION 'Video must be under 20MB';
        END IF;
        
        -- Max 60 seconds duration
        IF v_duration > 60 THEN
            RAISE EXCEPTION 'Video must be under 60 seconds';
        END IF;
    END IF;
    
    -- If it's an image, enforce image-specific constraints
    IF v_media_type = 'image' THEN
        -- Max 5MB for images
        IF v_file_size IS NOT NULL AND v_file_size > 5242880 THEN
            RAISE EXCEPTION 'Image must be under 5MB';
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
