import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client for use in Server Components/Actions
export const createServerClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const cookieStore = cookies();

    return createSSRClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            // We only need 'get' for server components (which are read-only)
            // Actions/Route handlers that need set/remove will handle cookies differently if needed
            set(name: string, value: string, options: any) { },
            remove(name: string, options: any) { },
        },
    });
};

// We export this as an async function instead of a singleton so consumers await it.
export const getSupabaseServer = createServerClient;
