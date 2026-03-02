-- 1. Add DELETE policy for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can delete own rooms." ON rooms;
CREATE POLICY "Creators can delete own rooms." ON rooms 
FOR DELETE USING (auth.uid() = created_by);

-- 2. Ensure Admins can delete any room
DROP POLICY IF EXISTS "Admins can delete any room." ON rooms;
CREATE POLICY "Admins can delete any room." ON rooms 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Also allow Admins to update any room (for archiving, etc)
DROP POLICY IF EXISTS "Admins can update any room." ON rooms;
CREATE POLICY "Admins can update any room." ON rooms 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
