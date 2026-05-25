-- Add active session tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN is_locked_in BOOLEAN DEFAULT false,
ADD COLUMN current_topic TEXT;

-- Create buddy_pokes table for nudges
CREATE TABLE IF NOT EXISTS public.buddy_pokes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for buddy_pokes
ALTER TABLE public.buddy_pokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pokes received"
ON public.buddy_pokes FOR SELECT
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can insert pokes"
ON public.buddy_pokes FOR INSERT
WITH CHECK (auth.uid() = sender_id);
