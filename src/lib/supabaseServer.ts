import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

// Server-side Supabase client for use in Server Components/Actions
export const createServerClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    // In Next.js 15+, cookies() is async and must be awaited
    const cookieStore = await cookies();

    // Get Clerk token for Supabase
    let token: string | null = null;
    try {
        const { getToken } = await auth();
        token = await getToken({ template: 'supabase' });
    } catch (error) {
        // Handle gracefully if auth() fails (e.g. static generation)
        console.warn('Failed to get Clerk auth token for Supabase', error);
    }

    return createSSRClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            // We only need 'get' for server components (which are read-only)
            set(name: string, value: string, options: any) { },
            remove(name: string, options: any) { },
        },
    });
};

// We export this as an async function instead of a singleton so consumers await it.
export const getSupabaseServer = createServerClient;
