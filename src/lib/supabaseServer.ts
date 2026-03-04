import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for use in Server Components/Actions
// This bypasses the need for client-side environment variable prefixing where appropriate
export const createServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabaseServer = createServerClient();
