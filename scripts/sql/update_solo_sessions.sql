-- update_solo_sessions.sql
-- Migration script to add goal tracking, completion status, and distraction telemetry
-- to the existing solo_sessions table, and add focus scoring to profiles.

-- 1. Updates to solo_sessions table
DO $$ 
BEGIN
    -- Add goal column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solo_sessions' AND column_name = 'goal') THEN
        ALTER TABLE solo_sessions ADD COLUMN goal TEXT DEFAULT '';
    END IF;

    -- Add completed_goal status (yes, partial, no)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solo_sessions' AND column_name = 'completed_goal') THEN
        ALTER TABLE solo_sessions ADD COLUMN completed_goal VARCHAR(10) CHECK (completed_goal IN ('yes', 'partial', 'no', NULL));
    END IF;

    -- Add distraction_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solo_sessions' AND column_name = 'distraction_reason') THEN
        ALTER TABLE solo_sessions ADD COLUMN distraction_reason TEXT;
    END IF;

    -- Add quit_early boolean boolean flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'solo_sessions' AND column_name = 'quit_early') THEN
        ALTER TABLE solo_sessions ADD COLUMN quit_early BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Updates to profiles table
DO $$
BEGIN
    -- Add focus_score integer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'focus_score') THEN
        ALTER TABLE profiles ADD COLUMN focus_score INTEGER DEFAULT 0;
    END IF;

    -- Add sessions_completed integer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sessions_completed') THEN
        ALTER TABLE profiles ADD COLUMN sessions_completed INTEGER DEFAULT 0;
    END IF;
END $$;
