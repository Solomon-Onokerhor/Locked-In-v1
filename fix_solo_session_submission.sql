-- fix_solo_session_submission.sql
-- Creates an atomic RPC for submitting solo sessions and updating stats

CREATE OR REPLACE FUNCTION submit_solo_session(
    p_label TEXT,
    p_goal TEXT,
    p_duration INTEGER,
    p_completed_goal TEXT,
    p_distraction TEXT,
    p_is_pomodoro BOOLEAN
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS on profiles update
AS $$
DECLARE
    v_user_id UUID;
    v_score_update INTEGER := 10; -- Base score
    v_current_score INTEGER;
    v_current_time INTEGER;
    v_current_sessions INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- 1. Insert the session
    INSERT INTO solo_sessions (
        user_id,
        label,
        goal,
        duration_minutes,
        completed_goal,
        distraction_reason,
        completed_at,
        quit_early
    ) VALUES (
        v_user_id,
        COALESCE(p_label, 'Solo Session'),
        p_goal,
        p_duration,
        p_completed_goal,
        p_distraction,
        now(),
        false
    );

    -- 2. Calculate Score Multipliers
    IF p_completed_goal = 'yes' THEN
        v_score_update := v_score_update + 5;
    END IF;
    
    IF p_distraction = 'Nothing! I was locked in 🔒' THEN
        v_score_update := v_score_update + 5;
    END IF;
    
    IF p_duration >= 60 THEN
        v_score_update := v_score_update + 10;
    END IF;
    
    IF p_is_pomodoro THEN
        v_score_update := v_score_update + 5;
    END IF;

    -- 3. Update Profiles Stats (Focus Time, Score, Session Count)
    UPDATE profiles
    SET 
        total_focus_time_minutes = COALESCE(total_focus_time_minutes, 0) + p_duration,
        sessions_completed = COALESCE(sessions_completed, 0) + 1,
        focus_score = COALESCE(focus_score, 0) + v_score_update
    WHERE id = v_user_id;

    -- 4. Update Streaks (using existing logic or inline)
    -- We can call the existing helper or do it here. Let's do it here for safety.
    UPDATE profiles
    SET 
        current_streak = CASE 
            WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
            WHEN last_active_date < CURRENT_DATE - INTERVAL '1 day' THEN 1
            WHEN last_active_date = CURRENT_DATE THEN current_streak
            ELSE 1
        END,
        last_active_date = CURRENT_DATE
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'points_earned', v_score_update);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
