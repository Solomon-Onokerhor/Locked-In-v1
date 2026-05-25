-- Alter buddy_connections to add status
ALTER TABLE public.buddy_connections
ADD COLUMN status TEXT DEFAULT 'pending'
CHECK (status IN ('pending', 'accepted', 'declined'));

-- Mark existing connections as accepted
UPDATE public.buddy_connections SET status = 'accepted';

-- Update the check_buddy_connection RPC to strictly check for 'accepted'
CREATE OR REPLACE FUNCTION public.check_buddy_connection(p_user_id text, p_buddy_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.buddy_connections
    WHERE status = 'accepted' AND (
      (user_id = p_user_id AND buddy_id = p_buddy_id) OR
      (user_id = p_buddy_id AND buddy_id = p_user_id)
    )
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$function$;
