-- Lead Captures Table
-- Stores WhatsApp numbers and names from the public Arsenal lead magnet page.
-- This is separate from the main profiles table (no Supabase Auth required).

CREATE TABLE IF NOT EXISTS lead_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'arsenal_page',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow anyone to insert (public lead form — no auth required)
ALTER TABLE lead_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
    ON lead_captures
    FOR INSERT
    WITH CHECK (true);

-- Only the service role (admin) can read leads
CREATE POLICY "Only admins can read leads"
    ON lead_captures
    FOR SELECT
    USING (false);
