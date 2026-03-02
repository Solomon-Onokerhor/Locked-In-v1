-- SECURITY HOTFIX: Prevent Privilege Escalation
-- Description: Restricts the 'role' column so users cannot promote themselves to admin.

-- 1. Drop the old insecure policy
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- 2. Create a new policy for users to update their PUBLIC profile info ONLY
-- (Note: In Supabase, column-level RLS is usually handled by checking OLD vs NEW in a trigger, 
-- or by using a Security Definer function. However, we can split policies by role.)

-- Allow users to update their own non-role data
CREATE POLICY "Users can update own info (except role)." ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (
    CASE 
      WHEN role IS DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()) THEN false
      ELSE true
    END
  )
);

-- 3. Allow admins to update ANY profile (including roles)
CREATE POLICY "Admins can update any profile." ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Protection for the Super Admin (prevent demotion of the main owner)
-- Replace 'sonokerhor@gmail.com' with the actual owner email if different.
CREATE OR REPLACE FUNCTION protect_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email = 'sonokerhor@gmail.com' AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote the Super Admin.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_super_admin ON profiles;
CREATE TRIGGER tr_protect_super_admin
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_super_admin();
