-- Migration: WhatsApp OTP Table
-- Creates a table to securely store OTPs for phone number verification.

CREATE TABLE IF NOT EXISTS whatsapp_otps (
    phone_number TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE whatsapp_otps ENABLE ROW LEVEL SECURITY;

-- Since OTP checks will be handled strictly server-side by Next.js using
-- the service role key, we do NOT create any policies for the frontend.
-- The service role automatically bypasses RLS.

-- Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
