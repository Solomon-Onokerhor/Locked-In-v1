-- Secure RPC to allow admins to delete users from the system
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Verify caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
  END IF;

  -- 2. Delete the user's profile and everything else manually just in case
  DELETE FROM public.room_members WHERE user_id = target_user_id;
  DELETE FROM public.messages WHERE sender_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 3. Delete the user from auth.users (this requires SECURITY DEFINER so function has postgres privileges)
  DELETE FROM auth.users WHERE id = target_user_id;
  
END;
$$;
