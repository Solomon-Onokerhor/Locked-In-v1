-- 1. Update rooms table default status to 'pending'
ALTER TABLE rooms ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Update existing rooms to 'active' if they aren't already
UPDATE rooms SET status = 'active' WHERE status IS NULL OR status = '';

-- 3. Update RLS policies for rooms
-- Standard users can only see 'active' rooms or their own 'pending' rooms
DROP POLICY IF EXISTS "Rooms are viewable by everyone." ON rooms;
CREATE POLICY "Public can view active rooms, creators can view own pending." 
ON rooms FOR SELECT 
USING (
    status = 'active' 
    OR auth.uid() = created_by 
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Admin RPCs for Approval
CREATE OR REPLACE FUNCTION approve_room(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Security check: Ensure the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can approve rooms';
    END IF;

    UPDATE rooms SET status = 'active' WHERE room_id = p_room_id;
END;
$$;

CREATE OR REPLACE FUNCTION reject_room(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Security check: Ensure the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can reject rooms';
    END IF;

    UPDATE rooms SET status = 'rejected' WHERE room_id = p_room_id;
END;
$$;
