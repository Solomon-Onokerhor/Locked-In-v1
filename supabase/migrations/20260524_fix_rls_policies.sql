-- Fix RLS Policies for Clerk JWT Migration
-- Run this in your Supabase SQL Editor

-- 1. Fix Rooms Table
DROP POLICY IF EXISTS "Users can insert own rooms" ON rooms;
CREATE POLICY "Users can insert own rooms"
ON rooms FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = created_by::text);

-- If you have a specific insert policy name, try the default:
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rooms;
CREATE POLICY "Enable insert for authenticated users only"
ON rooms FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = created_by::text);


-- 2. Fix Buddy Connections Table (if applicable)
DROP POLICY IF EXISTS "Users can insert own buddy connections" ON buddy_connections;
CREATE POLICY "Users can insert own buddy connections"
ON buddy_connections FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

-- 3. Fix Solo Sessions Table
-- Assuming you have a table for solo sessions logging:
DROP POLICY IF EXISTS "Users can insert own solo sessions" ON solo_sessions;
CREATE POLICY "Users can insert own solo sessions"
ON solo_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

-- IMPORTANT: The function `submit_solo_session` which logs your sessions
-- may ALSO be failing if it compares auth.uid() without casting to ::text.
-- If you created that function using auth.uid(), update it to cast auth.uid()::text.
