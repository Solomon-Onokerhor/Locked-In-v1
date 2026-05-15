import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Server-side Supabase client for use in Server Components/Actions
export const createServerClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    let token: string | null = null;
    try {
        const { getToken } = await auth();
        token = await getToken({ template: 'supabase' });
    } catch (e) {
        console.error('Failed to get token from Clerk auth in server component', e);
    }

    const options: any = {};
    if (token) {
        options.global = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }

    return createClient(supabaseUrl, supabaseAnonKey, options);
};

// We export this as an async function instead of a singleton so consumers await it.
export const getSupabaseServer = createServerClient;
