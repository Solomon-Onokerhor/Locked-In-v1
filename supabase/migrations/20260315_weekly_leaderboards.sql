-- Migration: Create Weekly Leaderboard Functions
-- This file defines two RPCs to dynamically calculate leaderboard standings based strictly on the current week's sessions.

-- 1. Weekly Student Leaderboard
-- Aggregates focus time from the past 7 days across both isolated solo_sessions and general room sessions (if any exist per user logic).
CREATE OR REPLACE FUNCTION get_weekly_leaderboard()
RETURNS TABLE (
    id UUID,
    name TEXT,
    avatar_url TEXT,
    faculty TEXT,
    focus_score BIGINT,
    current_streak INT,
    is_verified BOOLEAN
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- We calculate the "weekly focus score" by summing session durations from the last 7 days.
    -- We will query `solo_sessions` as the primary engine for focus time tracking in this app.
    WITH weekly_sessions AS (
        SELECT 
            user_id,
            SUM(duration_minutes) as weekly_score
        FROM solo_sessions
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND completed = true
        GROUP BY user_id
    )
    SELECT 
        p.id,
        p.name,
        p.avatar_url,
        p.faculty,
        COALESCE(ws.weekly_score, 0)::BIGINT as focus_score,
        p.current_streak,
        p.is_verified
    FROM profiles p
    JOIN weekly_sessions ws ON p.id = ws.user_id
    WHERE ws.weekly_score > 0
    ORDER BY ws.weekly_score DESC, p.current_streak DESC
    LIMIT 100;
$$;


-- 2. Weekly Faculty Leaderboard
-- Aggregates the weekly scores constructed above and groups them purely by faculty.
CREATE OR REPLACE FUNCTION get_weekly_faculty_leaderboard()
RETURNS TABLE (
    faculty TEXT,
    total_streak BIGINT,
    active_students BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH weekly_sessions AS (
        SELECT 
            user_id,
            SUM(duration_minutes) as weekly_score
        FROM solo_sessions
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND completed = true
        GROUP BY user_id
    ),
    faculty_scores AS (
        SELECT 
            p.faculty,
            SUM(ws.weekly_score) as total_points,
            COUNT(DISTINCT p.id) as students_count
        FROM profiles p
        JOIN weekly_sessions ws ON p.id = ws.user_id
        WHERE p.faculty IS NOT NULL AND p.faculty != ''
        GROUP BY p.faculty
    )
    SELECT 
        faculty,
        total_points::BIGINT as total_streak,
        students_count::BIGINT as active_students
    FROM faculty_scores
    ORDER BY total_points DESC;
$$;
