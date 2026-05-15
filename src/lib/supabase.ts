import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
            let token: string | null = null;
            if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
                try {
                    token = await (window as any).Clerk.session.getToken({ template: 'supabase' });
                } catch (e) {
                    console.error('Failed to get Clerk token for Supabase:', e);
                }
            }
            const headers = new Headers(options?.headers);
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return fetch(url, { ...options, headers });
        }
    },
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    }
});
