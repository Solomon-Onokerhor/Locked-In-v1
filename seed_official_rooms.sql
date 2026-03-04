-- 1. Create Official "Locked In" Study Rooms
-- These rooms will be hosted by the system and provide permanent value.

INSERT INTO rooms (
    room_id, 
    room_type, 
    session_mode, 
    title, 
    description,
    date_time, 
    duration_minutes, 
    max_members, 
    status, 
    tags, 
    course_code, 
    is_paid, 
    price,
    meeting_link
) VALUES 
(
    gen_random_uuid(), 
    'Study', 
    'virtual', 
    'Calculus Mastery Hub: Fundamentals', 
    'A permanent hub for Calculus students. Check the Resources tab for the "Master Cheat Sheet" and past exam solutions.',
    NOW(), 
    10000, 
    100, 
    'active', 
    ARRAY['Math', 'Calculus', 'Official'], 
    'MATH101', 
    false, 
    0,
    'https://meet.google.com/locked-in-official-calculus'
),
(
    gen_random_uuid(), 
    'Study', 
    'virtual', 
    'Engineering Mechanics: Statics Core', 
    'Official engineering study group. We focus on rigid body equilibrium and truss analysis. High-quality reference sheets inside.',
    NOW(), 
    10000, 
    100, 
    'active', 
    ARRAY['Engineering', 'Physics', 'Official'], 
    'ENG201', 
    false, 
    0,
    'https://meet.google.com/locked-in-official-statics'
),
(
    gen_random_uuid(), 
    'Skill', 
    'virtual', 
    'The Coffee Shop: General Study', 
    'Low-fidelity study session for anyone wanting to lock in with background music. No specific subject—just productivity.',
    NOW(), 
    10000, 
    200, 
    'active', 
    ARRAY['General', 'Productivity', 'Global'], 
    NULL, 
    false, 
    0,
    'https://meet.google.com/locked-in-coffee-shop'
);

-- Note: The created_by field is left as NULL for system-generated official rooms.
-- If your DB requires a valid user_id for created_by, please replace NULL with your Admin ID.
