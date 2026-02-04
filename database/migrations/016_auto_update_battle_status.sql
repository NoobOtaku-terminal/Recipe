-- Migration 016: Auto-update battle status based on dates
-- Automatically updates battle status based on current time vs start/end dates

BEGIN;

-- Function to update battle statuses based on current time
CREATE OR REPLACE FUNCTION update_battle_statuses()
RETURNS void AS $$
BEGIN
    -- Update to 'active' if current time is between starts_at and ends_at
    UPDATE battles
    SET status = 'active'
    WHERE NOW() >= starts_at 
    AND NOW() < ends_at
    AND status != 'active';

    -- Update to 'closed' if current time is past ends_at
    UPDATE battles
    SET status = 'closed'
    WHERE NOW() >= ends_at
    AND status != 'closed';

    -- Update to 'upcoming' if current time is before starts_at
    UPDATE battles
    SET status = 'upcoming'
    WHERE NOW() < starts_at
    AND status != 'upcoming';
END;
$$ LANGUAGE plpgsql;

-- Create a view that always shows battles with current status
CREATE OR REPLACE VIEW battles_with_current_status AS
SELECT 
    b.*,
    CASE 
        WHEN NOW() >= b.ends_at THEN 'closed'
        WHEN NOW() >= b.starts_at AND NOW() < b.ends_at THEN 'active'
        WHEN NOW() < b.starts_at THEN 'upcoming'
        ELSE b.status
    END AS current_status
FROM battles b;

COMMIT;
