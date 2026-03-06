-- 1. Drop the outdated trigger that overwrites study buddy counts based on room members
DROP TRIGGER IF EXISTS tr_update_stats_on_join ON room_members;
DROP FUNCTION IF EXISTS handle_activity_stats();

-- 2. Add Faculty and Department columns to profiles for the Campus Leaderboard
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS faculty text,
ADD COLUMN IF NOT EXISTS department text;

-- 3. Fix the update_user_activity RPC to handle 0-day streaks correctly Date logic
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

    -- CASE 1: Brand new user with 0 streak but active today -> Bump to 1
    IF v_last_active = CURRENT_DATE AND v_current_streak = 0 THEN
        UPDATE profiles 
        SET current_streak = 1
        WHERE id = v_user_id;
        RETURN;
    END IF;

    -- CASE 2: Already active today with > 0 streak -> Do nothing
    IF v_last_active = CURRENT_DATE AND v_current_streak > 0 THEN
        RETURN;
    END IF;

    -- CASE 3: Active yesterday -> Increment streak
    IF v_last_active = CURRENT_DATE - INTERVAL '1 day' THEN
        UPDATE profiles 
        SET current_streak = current_streak + 1,
            last_active_date = CURRENT_DATE
        WHERE id = v_user_id;
    
    -- CASE 4: First time returning after breaking streak -> Reset to 1
    ELSE
        UPDATE profiles 
        SET current_streak = 1,
            last_active_date = CURRENT_DATE
        WHERE id = v_user_id;
    END IF;
END;
$$;
