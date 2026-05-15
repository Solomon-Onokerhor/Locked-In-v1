-- SUPABASE SCHEMA FOR BUDDY CONNECTIONS

-- Create the buddy_connections table
CREATE TABLE IF NOT EXISTS buddy_connections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    buddy_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, buddy_id)
);

-- Enable Row Level Security
ALTER TABLE buddy_connections ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can view their own connections (where they are either the user or the buddy)
-- For simplicity, since a connection is mutual or one-way, let's say "Users can view connections where they are the user_id or buddy_id"
CREATE POLICY "Users can view connections they are part of" 
ON buddy_connections 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = buddy_id);

-- 2. Users can create a connection where they are the user_id
CREATE POLICY "Users can connect with others" 
ON buddy_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Users can remove a connection where they are the user_id or buddy_id
CREATE POLICY "Users can remove their connections" 
ON buddy_connections 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = buddy_id);

-- RPC to check connection status easily
CREATE OR REPLACE FUNCTION check_buddy_connection(p_user_id uuid, p_buddy_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists boolean;
BEGIN
    -- Security check: users can only check their own connections
    IF auth.uid() != p_user_id AND auth.uid() != p_buddy_id THEN
        RETURN false;
    END IF;

    SELECT exists(
        SELECT 1 FROM buddy_connections 
        WHERE (user_id = p_user_id AND buddy_id = p_buddy_id)
           OR (user_id = p_buddy_id AND buddy_id = p_user_id)
    ) INTO v_exists;
    RETURN v_exists;
END;
$$;

-- Trigger to update study_buddies count in profiles
CREATE OR REPLACE FUNCTION update_study_buddies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment for both
        UPDATE profiles SET study_buddies = study_buddies + 1 WHERE id = NEW.user_id OR id = NEW.buddy_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement for both
        UPDATE profiles SET study_buddies = GREATEST(0, study_buddies - 1) WHERE id = OLD.user_id OR id = OLD.buddy_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_buddy_connections_audit ON buddy_connections;
CREATE TRIGGER tr_buddy_connections_audit
AFTER INSERT OR DELETE ON buddy_connections
FOR EACH ROW EXECUTE FUNCTION update_study_buddies_count();
