-- PRIVACY FIX: Block User Scraping
-- Description: Restricts the 'profiles' table so unauthorized scripts cannot download your user list.

-- 1. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;

-- 2. Create a new policy: Only logged-in students can see other students
-- This prevents random scripts from using your ANON key to scrape emails.
CREATE POLICY "Profiles are viewable by authenticated users only." ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Optional: Even more strict (Only show name/faculty, hide emails from others)
-- (This requires column-level logic which is harder in RLS, but the above is 
-- a massive improvement as it blocks anonymous scraping).

-- 4. Verification: 
-- Ensure no other table has 'true' for select unless it's strictly public content.
-- Rooms and Resources are fine to be 'true' for public discovery.
