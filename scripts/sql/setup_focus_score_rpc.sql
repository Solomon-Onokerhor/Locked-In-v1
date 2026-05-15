-- setup_focus_score_rpc.sql
-- Creates an RPC function to safely increment or decrement a user's focus score.

CREATE OR REPLACE FUNCTION update_focus_score(score_delta INTEGER, user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow the user to update their own score
  IF auth.uid() = user_uuid THEN
    UPDATE profiles
    SET focus_score = COALESCE(focus_score, 0) + score_delta
    WHERE id = user_uuid;
  ELSE
    RAISE EXCEPTION 'Not authorized to update this profile';
  END IF;
END;
$$;
