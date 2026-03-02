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
  title text not null,
  description text,
  created_by uuid references profiles(id),
  date_time timestamp with time zone not null,
  location text,
  max_members integer default 10,
  is_paid boolean default false,
  price float default 0,
  commission_rate float default 10,
  status text default 'active',
  tags text[] default '{}',
  created_at timestamp with time zone default now()
);

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
  created_at timestamp with time zone default now()
);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
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
