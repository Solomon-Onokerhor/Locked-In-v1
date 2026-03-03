-- 1. Create Official "Locked In" Study Rooms
-- These rooms will be hosted by a "System Admin" and will always be visible to provide value.

INSERT INTO rooms (
    room_id, room_type, session_mode, title, description,
    date_time, duration_minutes, max_members, status, 
    tags, course_code, is_paid, price
) VALUES 
(
    gen_random_uuid(), 'Study', 'virtual', 'Calculus Mastery Hub: Fundamentals', 
    'A permanent hub for Calculus students. Check the Resources tab for the "Master Cheat Sheet" and past exam solutions.',
    NOW(), 10000, 100, 'active', ARRAY['Math', 'Calculus', 'Official'], 'MATH101', false, 0
),
(
    gen_random_uuid(), 'Study', 'virtual', 'Engineering Mechanics: Statics Core', 
    'Official engineering study group. We focus on rigid body equilibrium and truss analysis. High-quality reference sheets inside.',
    NOW(), 10000, 100, 'active', ARRAY['Engineering', 'Physics', 'Official'], 'ENG201', false, 0
),
(
    gen_random_uuid(), 'Social', 'virtual', 'The Coffee Shop: General Study', 
    'Low-fidelity study session for anyone wanting to lock in with background music. No specific subject—just productivity.',
    NOW(), 10000, 200, 'active', ARRAY['General', 'Productivity', 'Global'], NULL, false, 0
);

-- 2. Add some "Seed" Resources into the database metadata if needed
-- Note: Actual files must be uploaded to Storage, but we can pre-populate the 'resources' table
-- to show what high-quality resources look like.

-- (This requires the resource_id and URLs which we don't have yet, but we will suggest the user upload the .md files)
