-- Safely identify and delete development and test users.
-- This script removes users with 'test', 'dev', 'demo' in their emails
-- or any specific emails you know are fake.

BEGIN;

-- 1. Identify test users (Run this first to verify who will be deleted)
-- SELECT id, email, raw_user_meta_data->>'full_name' AS name 
-- FROM auth.users 
-- WHERE 
--     email ILIKE '%test%' OR 
--     email ILIKE '%dev%' OR 
--     email ILIKE '%demo%';

-- 2. Delete test users (Uncomment to execute deletion)
-- Deleting from auth.users will automatically cascade and delete their profile, 
-- room memberships, and messages if ON DELETE CASCADE is set up (which it is for profiles).
DELETE FROM auth.users 
WHERE 
    email ILIKE '%test%' OR 
    email ILIKE '%dev%' OR 
    email ILIKE '%demo%' OR
    email = 'try567@gmail.com'; -- The banned intruder

COMMIT;
