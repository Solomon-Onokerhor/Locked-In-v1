-- Migration: Clerk-Supabase Production Sync
-- Ensures the profiles table is compatible with Clerk string user IDs
-- and has the correct RLS policies for JWT-based auth.

-- ============================================================
-- 1. Add avatar_url column if it doesn't exist
--    (populated by Clerk webhooks on user.created / user.updated)
-- ============================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- 2. Extend the role type to support soft-deletion
--    (user.deleted webhook marks profiles as 'deleted' to
--     preserve referential integrity with rooms/sessions)
-- ============================================================
DO $$
BEGIN
    -- Add 'deleted' to the role check constraint if it doesn't allow it yet
    -- Only alter if the constraint exists; otherwise assume the column is unconstrained text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        -- Alter the column to allow 'deleted' (safe to run multiple times)
        ALTER TABLE profiles
        ALTER COLUMN role TYPE TEXT;
    END IF;
END;
$$;

-- ============================================================
-- 3. Enable Row Level Security (idempotent)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS Policies
--    Clerk JWT template must include: { "sub": "{{user.id}}", "role": "authenticated" }
--    Supabase reads auth.uid() from the `sub` claim in the JWT.
-- ============================================================

-- Drop old policies first (idempotent re-run safety)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;

-- SELECT: Any authenticated user can read profiles (for leaderboard, buddies, rooms)
CREATE POLICY "Users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- UPDATE: Users can only update their own profile row
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- INSERT: Users can only insert their own profile row
-- (Webhook creates it first via service role; onboarding may also upsert)
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- ============================================================
-- 5. Grant permissions to service_role (already default, but explicit)
-- ============================================================
GRANT ALL ON profiles TO service_role;

-- ============================================================
-- 6. Index on email for fast lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
