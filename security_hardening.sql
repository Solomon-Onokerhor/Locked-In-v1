-- FINAL SECURITY HARDENING FOR LOCKED IN MVP
-- 1. Secure Transactions Table (Private financial data)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Secure Resource Votes Table
ALTER TABLE resource_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Votes are viewable by everyone" ON resource_votes;
CREATE POLICY "Votes are viewable by everyone" ON resource_votes
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote" ON resource_votes;
CREATE POLICY "Users can vote" ON resource_votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can change own vote" ON resource_votes;
CREATE POLICY "Users can change own vote" ON resource_votes
FOR UPDATE USING (auth.uid() = user_id);

-- 3. Enhance Room & Member Select Policies for Admins
DROP POLICY IF EXISTS "Admins can view all members" ON room_members;
CREATE POLICY "Admins can view all members" ON room_members
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Secure the 'messages' table for Admins (Audit support)
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages" ON messages
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
