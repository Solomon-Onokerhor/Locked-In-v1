-- Solo Sessions Table
-- Tracks individual focus sessions for the enhanced Solo Timer

CREATE TABLE IF NOT EXISTS solo_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE solo_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions
CREATE POLICY "Users can read own solo sessions"
    ON solo_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can insert own solo sessions"
    ON solo_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow anyone to count recent sessions (for the live counter)
-- This is a SELECT policy that allows counting all rows
CREATE POLICY "Anyone can count recent sessions"
    ON solo_sessions FOR SELECT
    USING (completed_at > now() - interval '30 minutes');

-- Index for the live counter query (recent sessions)
CREATE INDEX IF NOT EXISTS idx_solo_sessions_completed_at
    ON solo_sessions (completed_at DESC);

-- Index for user's session history
CREATE INDEX IF NOT EXISTS idx_solo_sessions_user_id
    ON solo_sessions (user_id, completed_at DESC);
