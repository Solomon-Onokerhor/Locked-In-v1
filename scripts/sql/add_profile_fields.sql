-- Add new columns to the profiles table for the updated onboarding flow
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS programme TEXT,
ADD COLUMN IF NOT EXISTS level TEXT;
