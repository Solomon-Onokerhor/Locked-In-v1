-- Fix RLS Policies for Clerk JWT Integration
-- Supabase auth.uid() only works for valid UUIDs. Because Clerk user IDs are strings (e.g. 'user_2...'),
-- we must read the user ID directly from the JWT sub claim: (request.jwt() ->> 'sub') or (auth.jwt() ->> 'sub')

-- 1. Profiles Table
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'sub') = id)
WITH CHECK ((auth.jwt() ->> 'sub') = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub') = id);

-- 2. Rooms Table
DROP POLICY IF EXISTS "Users can insert own rooms" ON rooms;
CREATE POLICY "Users can insert own rooms"
ON rooms FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub') = created_by);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rooms;
CREATE POLICY "Enable insert for authenticated users only"
ON rooms FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub') = created_by);

-- 3. Buddy Connections Table
DROP POLICY IF EXISTS "Users can insert own buddy connections" ON buddy_connections;
CREATE POLICY "Users can insert own buddy connections"
ON buddy_connections FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- 4. Solo Sessions Table
DROP POLICY IF EXISTS "Users can insert own solo sessions" ON solo_sessions;
CREATE POLICY "Users can insert own solo sessions"
ON solo_sessions FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- Note: Ensure any functions using auth.uid() are also updated to use (auth.jwt() ->> 'sub').
