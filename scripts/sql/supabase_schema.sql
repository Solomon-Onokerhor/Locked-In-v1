-- SUPABASE SCHEMA FOR LOCKED IN MVP

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Custom Types
create type room_type as enum ('Study', 'Skill');
create type user_role as enum ('student', 'room_creator', 'admin');
create type member_role as enum ('member', 'creator', 'co-host');
create type transaction_status as enum ('paid', 'failed', 'refunded');
create type resource_type as enum ('PDF', 'PPT', 'DOCX', 'Video');

-- 3. Profiles Table (Extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  faculty text,
  courses text[],
  role user_role default 'student',
  joined_rooms uuid[] default '{}',
  created_at timestamp with time zone default now()
);

-- 4. Rooms Table
create table rooms (
  room_id uuid primary key default uuid_generate_v4(),
  room_type room_type not null,
  session_mode text default 'virtual' check (session_mode in ('virtual', 'in_person')),
  title text not null,
  description text,
  created_by uuid references profiles(id),
  date_time timestamp with time zone not null,
  duration_minutes integer default 60,
  meeting_link text,
  physical_location text,
  location_note text,
  max_members integer default 10,
  is_paid boolean default false,
  price float default 0,
  commission_rate float default 10,
  status text default 'active',
  tags text[] default '{}',
  faculty text,
  course_code text,
  created_at timestamp with time zone default now()
);

-- ... (rest of tables)

-- 9. Atomic Join Function
create or replace function join_room_atomic(p_room_id uuid, p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_count int;
  v_max int;
  v_room_exists boolean;
  v_already_member boolean;
begin
  -- Check if room exists and get max members
  select true, max_members into v_room_exists, v_max from rooms where room_id = p_room_id;
  
  if not v_room_exists then
    return json_build_object('success', false, 'error', 'Room not found');
  end if;

  -- Check if already a member
  select exists(select 1 from room_members where room_id = p_room_id and user_id = p_user_id) into v_already_member;
  
  if v_already_member then
    return json_build_object('success', false, 'error', 'Already a member of this room');
  end if;

  -- Check capacity
  select count(*) into v_count from room_members where room_id = p_room_id;
  
  if v_count >= v_max then
    return json_build_object('success', false, 'error', 'Room is full');
  end if;

  -- Join room
  insert into room_members (room_id, user_id, role_in_room, has_access_to_resources)
  values (p_room_id, p_user_id, 'member', true);

  return json_build_object('success', true);
end;
$$;

-- 5. Room Members Table
create table room_members (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(room_id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role_in_room member_role default 'member',
  attendance_confirmed boolean default false,
  token text, -- For unique paid links
  has_access_to_resources boolean default false,
  joined_at timestamp with time zone default now(),
  unique(room_id, user_id)
);

-- 6. Chat Table
create table messages (
  message_id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(room_id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  text text not null,
  timestamp timestamp with time zone default now()
);

-- 7. Transactions Table
create table transactions (
  transaction_id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(room_id),
  user_id uuid references profiles(id),
  amount float not null,
  commission float not null,
  status transaction_status default 'paid',
  timestamp timestamp with time zone default now()
);

-- 8. Free Resources Table
create table resources (
  resource_id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  file_url text not null,
  resource_type resource_type not null,
  uploaded_by uuid references profiles(id),
  tags text[] default '{}',
  thumbs_up integer default 0,
  thumbs_down integer default 0,
  download_count integer default 0,
  created_at timestamp with time zone default now()
);

-- 9. Resource Votes Table (tracks individual user votes)
create table resource_votes (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid references resources(resource_id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  vote_type text not null check (vote_type in ('up', 'down')),
  created_at timestamp with time zone default now(),
  unique(resource_id, user_id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Rooms
alter table rooms enable row level security;
create policy "Rooms are viewable by everyone." on rooms for select using (true);
create policy "Creators can create rooms." on rooms for insert with check (auth.uid() = created_by);
create policy "Creators can update own rooms." on rooms for update using (auth.uid() = created_by);

-- Room Members
alter table room_members enable row level security;
create policy "Members are viewable by everyone in the room." on room_members for select using (true);
create policy "Users can join rooms." on room_members for insert with check (auth.uid() = user_id);

-- Messages
alter table messages enable row level security;
create policy "Messages are viewable by room members." on messages for select 
  using (exists (select 1 from room_members where room_id = messages.room_id and user_id = auth.uid()));
create policy "Members can send messages." on messages for insert 
  with check (exists (select 1 from room_members where room_id = messages.room_id and user_id = auth.uid()));

-- Resources
alter table resources enable row level security;
create policy "Resources are viewable by all students." on resources for select using (true);
create policy "Admins and creators can upload resources." on resources for insert 
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'room_creator')));

-- REALTIME CONFIGURATION
-- Enable realtime for messages
alter publication supabase_realtime add table messages;

-- RPC FUNCTIONS

-- Toggle resource vote (up/down)
create or replace function toggle_resource_vote(p_resource_id uuid, p_vote_type text)
returns void
language plpgsql
security definer
as $$
declare
  v_existing text;
begin
  select vote_type into v_existing
  from resource_votes
  where resource_id = p_resource_id and user_id = auth.uid();

  if v_existing is null then
    -- New vote
    insert into resource_votes (resource_id, user_id, vote_type) values (p_resource_id, auth.uid(), p_vote_type);
    if p_vote_type = 'up' then
      update resources set thumbs_up = thumbs_up + 1 where resource_id = p_resource_id;
    else
      update resources set thumbs_down = thumbs_down + 1 where resource_id = p_resource_id;
    end if;
  elsif v_existing = p_vote_type then
    -- Remove vote
    delete from resource_votes where resource_id = p_resource_id and user_id = auth.uid();
    if p_vote_type = 'up' then
      update resources set thumbs_up = greatest(thumbs_up - 1, 0) where resource_id = p_resource_id;
    else
      update resources set thumbs_down = greatest(thumbs_down - 1, 0) where resource_id = p_resource_id;
    end if;
  else
    -- Swap vote
    update resource_votes set vote_type = p_vote_type where resource_id = p_resource_id and user_id = auth.uid();
    if p_vote_type = 'up' then
      update resources set thumbs_up = thumbs_up + 1, thumbs_down = greatest(thumbs_down - 1, 0) where resource_id = p_resource_id;
    else
      update resources set thumbs_down = thumbs_down + 1, thumbs_up = greatest(thumbs_up - 1, 0) where resource_id = p_resource_id;
    end if;
  end if;
end;
$$;

-- Record resource download
create or replace function record_resource_download(p_resource_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update resources set download_count = download_count + 1 where resource_id = p_resource_id;
end;
$$;
