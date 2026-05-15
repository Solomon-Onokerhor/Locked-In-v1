-- 1) Reset all streaks to 0 to ensure a clean state
UPDATE profiles 
SET current_streak = 0, 
    last_active_date = NULL;

-- 2) Update the activity function to fix potential NULL and date cast bugs
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_last_active date;
    v_current_streak int;
BEGIN
    -- Get the current authenticated user's ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Get current stats
    SELECT last_active_date, current_streak 
    INTO v_last_active, v_current_streak
    FROM profiles 
    WHERE id = v_user_id;

    -- CASE 1: Already active today -> Do nothing
    IF v_last_active = CURRENT_DATE THEN
        RETURN;
    END IF;

    -- CASE 2: Active yesterday -> Increment streak
    IF v_last_active = (CURRENT_DATE - 1) THEN
        UPDATE profiles 
        SET current_streak = COALESCE(current_streak, 0) + 1,
            last_active_date = CURRENT_DATE
        WHERE id = v_user_id;
    
    -- CASE 3: First time or streak broken -> Reset to 1
    ELSE
        UPDATE profiles 
        SET current_streak = 1,
            last_active_date = CURRENT_DATE
        WHERE id = v_user_id;
    END IF;
END;
$$;
