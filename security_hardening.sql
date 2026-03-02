-- 1. Enable RLS on Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- If policies don't exist, create them. If they do, they will now be enforced.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'Admin can delete transactions.'
    ) THEN
        CREATE POLICY "Admin can delete transactions." ON transactions 
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;

    -- Add a policy for users to see their own transactions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions.'
    ) THEN
        CREATE POLICY "Users can view own transactions." ON transactions 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 2. Secure RPC Functions (Set search_path to public to prevent shadowing)
-- This is a critical security fix recommended by the Supabase Security Advisor.

ALTER FUNCTION join_room_atomic(uuid, uuid) SET search_path = public;
ALTER FUNCTION handle_activity_stats() SET search_path = public;
ALTER FUNCTION toggle_resource_vote(uuid, text) SET search_path = public;
ALTER FUNCTION record_resource_download(uuid) SET search_path = public;

-- Also check other potential functions from schema
-- These might not exist yet but it's safe to run if they do
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_promote_admin') THEN
        ALTER FUNCTION auto_promote_admin() SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_secure_meeting_link') THEN
        ALTER FUNCTION get_secure_meeting_link(uuid) SET search_path = public;
    END IF;
END
$$;

-- 3. Final RLS Audit
-- Ensure all tables in public schema have RLS enabled
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
    END LOOP;
END
$$;
