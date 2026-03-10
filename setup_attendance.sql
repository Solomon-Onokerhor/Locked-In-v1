-- SUPABASE MIGRATION: ATTENDANCE CONFIRMATION RPC

-- Record attendance for a user in a specific room
create or replace function confirm_room_attendance(p_room_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_member_exists boolean;
begin
  -- Check if user is actually a member of this room
  select exists(
    select 1 
    from room_members 
    where room_id = p_room_id 
    and user_id = auth.uid()
  ) into v_member_exists;

  if not v_member_exists then
    raise exception 'User is not a member of this room';
  end if;

  -- Update attendance status
  update room_members 
  set attendance_confirmed = true 
  where room_id = p_room_id 
  and user_id = auth.uid();
  
end;
$$;
