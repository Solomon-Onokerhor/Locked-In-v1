-- Recount actual buddies and update the profiles table
DO $$
DECLARE
    r RECORD;
    actual_count INT;
BEGIN
    FOR r IN SELECT id FROM profiles LOOP
        -- Count unique accepted buddy connections for this user
        SELECT count(*)
        INTO actual_count
        FROM buddy_connections
        WHERE user_id = r.id OR buddy_id = r.id;

        -- Update the profile
        UPDATE profiles
        SET study_buddies = actual_count
        WHERE id = r.id;
    END LOOP;
END;
$$;
