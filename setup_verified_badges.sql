-- Add verified badge columns to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS badge_label TEXT DEFAULT NULL;

-- Create a secure RPC to grant badges (Admin Only)
CREATE OR REPLACE FUNCTION grant_verified_badge(p_user_id UUID, p_badge_label TEXT)
RETURNS VOID AS $$
BEGIN
    -- Security check: Ensure the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can grant badges';
    END IF;

    UPDATE profiles 
    SET is_verified = TRUE,
        badge_label = p_badge_label
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
