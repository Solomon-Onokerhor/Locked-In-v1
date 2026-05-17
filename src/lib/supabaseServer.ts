import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for use in Server Components/Actions
export const createServerClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // Simply returning the standard client. 
    // In a full App Router setup without Clerk, we'd use @supabase/ssr and cookies() here
    // if user-context is required on the server.
    return createClient(supabaseUrl, supabaseAnonKey);
};

// We export this as an async function instead of a singleton so consumers await it.
export const getSupabaseServer = createServerClient;

