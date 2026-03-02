-- 1. Add Stat Columns to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_focus_time_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS study_buddies integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date DEFAULT CURRENT_DATE;

-- 2. Update join_room_atomic to update stats
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

  -- Join room
  INSERT INTO room_members (room_id, user_id, role_in_room, has_access_to_resources)
  VALUES (p_room_id, p_user_id, 'member', true);

  -- Update Profile Stats (Focus Time)
  UPDATE profiles 
  SET total_focus_time_minutes = total_focus_time_minutes + v_duration
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 4. Function to update streaks and buddy counts
CREATE OR REPLACE FUNCTION handle_activity_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Update Streak
  UPDATE profiles
  SET 
    current_streak = CASE 
      WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_active_date < CURRENT_DATE - INTERVAL '1 day' THEN 1
      ELSE current_streak 
    END,
    last_active_date = CURRENT_DATE
  WHERE id = NEW.user_id;

  -- 2. Update Buddy Count (Total unique users encountered in all rooms joined)
  UPDATE profiles
  SET study_buddies = (
    SELECT count(DISTINCT user_id) - 1 -- Subtract self
    FROM room_members
    WHERE room_id IN (
      SELECT room_id FROM room_members WHERE user_id = NEW.user_id
    )
  )
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger: Run stats update whenever a user joins a room
DROP TRIGGER IF EXISTS tr_update_stats_on_join ON room_members;
CREATE TRIGGER tr_update_stats_on_join
AFTER INSERT ON room_members
FOR EACH ROW EXECUTE FUNCTION handle_activity_stats();
