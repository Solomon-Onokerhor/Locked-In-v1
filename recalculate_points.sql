-- recalculate_points.sql
-- Run this in Supabase SQL Editor to retroactively award Focus Points
-- for all past room sessions and solo sessions.
-- This will OVERWRITE the current focus_score for all users.

-- Step 1: Reset everyone's focus_score to 0 (fresh start)
UPDATE profiles SET focus_score = 0;

-- Step 2: Award points for ALL completed Solo Sessions (not quit early)
-- Formula: 10 base + 1 per minute of session duration
-- Bonus: +5 if goal completed, +5 if no distraction, +10 if >= 60min, +5 for pomodoro
UPDATE profiles p
SET focus_score = focus_score + COALESCE(solo.total_solo_points, 0)
FROM (
    SELECT 
        user_id,
        SUM(
            10 -- base completion points
            + duration_minutes  -- 1 point per minute
            + CASE WHEN completed_goal = 'yes' THEN 5 ELSE 0 END
            + CASE WHEN distraction_reason = 'Nothing! I was locked in 🔒' THEN 5 ELSE 0 END
            + CASE WHEN duration_minutes >= 60 THEN 10 ELSE 0 END
        ) AS total_solo_points
    FROM solo_sessions
    WHERE quit_early = false
    GROUP BY user_id
) solo
WHERE p.id = solo.user_id;

-- Step 3: Deduct points for quit-early Solo Sessions (-5 each, same as before)
UPDATE profiles p
SET focus_score = focus_score + COALESCE(quit.total_penalty, 0)
FROM (
    SELECT 
        user_id,
        SUM(-5) AS total_penalty
    FROM solo_sessions
    WHERE quit_early = true
    GROUP BY user_id
) quit
WHERE p.id = quit.user_id;

-- Step 4: Award points for ALL past Room Sessions
-- Formula: room duration_minutes as base points
UPDATE profiles p
SET focus_score = focus_score + COALESCE(room_pts.total_room_points, 0)
FROM (
    SELECT 
        rm.user_id,
        SUM(COALESCE(r.duration_minutes, 30)) AS total_room_points
    FROM room_members rm
    JOIN rooms r ON r.room_id = rm.room_id
    GROUP BY rm.user_id
) room_pts
WHERE p.id = room_pts.user_id;

-- Done! Everyone's focus_score now reflects ALL their past effort.
-- Check the leaderboard to see your updated ranking!
