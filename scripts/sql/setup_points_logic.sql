-- setup_points_logic.sql
-- Run this in the Supabase SQL Editor to update the point system.

-- 1. Update join_room_atomic to award Focus Points with a Streak Multiplier
CREATE OR REPLACE FUNCTION join_room_atomic(p_room_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_max int;
  v_room_exists boolean;
  v_already_member boolean;
  v_duration int;
  v_streak int;
  v_multiplier numeric;
  v_points int;
BEGIN
  -- Check if room exists and get max members and duration
  SELECT true, max_members, duration_minutes 
  INTO v_room_exists, v_max, v_duration 
  FROM rooms WHERE room_id = p_room_id;
  
  IF NOT v_room_exists THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;

  -- Check if already a member
  SELECT exists(SELECT 1 FROM room_members WHERE room_id = p_room_id AND user_id = p_user_id) INTO v_already_member;
  
  IF v_already_member THEN
    RETURN json_build_object('success', false, 'error', 'Already a member of this room');
  END IF;

  -- Check capacity
  SELECT count(*) INTO v_count FROM room_members WHERE room_id = p_room_id;
  
  IF v_count >= v_max THEN
    RETURN json_build_object('success', false, 'error', 'Room is full');
  END IF;

  -- Join room (attendance is auto-confirmed on lock-in)
  INSERT INTO room_members (room_id, user_id, role_in_room, has_access_to_resources, attendance_confirmed)
  VALUES (p_room_id, p_user_id, 'member', true, true);

  -- Get current streak to calculate multiplier
  SELECT COALESCE(current_streak, 0) INTO v_streak FROM profiles WHERE id = p_user_id;
  
  -- Multiplier: 1.0x base, +0.1x per day streak, max 2.5x (reached at 15 days)
  v_multiplier := 1.0 + (v_streak * 0.1);
  IF v_multiplier > 2.5 THEN
     v_multiplier := 2.5;
  END IF;

  -- Calculate points: Base is 1 point per minute of duration
  -- E.g., a 60-minute room with a 5-day streak (1.5x) grants 90 points!
  v_points := ROUND(v_duration * v_multiplier);

  -- Update Profile Stats (Focus Time & Score)
  UPDATE profiles 
  SET 
    total_focus_time_minutes = COALESCE(total_focus_time_minutes, 0) + v_duration,
    focus_score = COALESCE(focus_score, 0) + v_points
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;
