import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
        secure: true,
        sameSite: 'strict',
        // Note: httpOnly cannot be set by browser JS, but these cookies will be transmitted securely
    }
});
