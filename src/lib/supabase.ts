import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let currentToken: string | null = null;

// Using vanilla supabase-js (not SSR package) so that signInWithOtp uses the
// implicit flow. This means the magic link redirects with #access_token= in the
// URL hash, which Supabase auto-detects via detectSessionInUrl: true.
// This avoids the PKCE code-verifier storage issue.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
    global: {
        fetch: async (url, options = {}) => {
            const headers = new Headers(options?.headers);
            if (currentToken) {
                headers.set('Authorization', `Bearer ${currentToken}`);
            }
            return fetch(url, {
                ...options,
                headers,
            });
        }
    }
});

export const setSupabaseToken = (token: string | null) => {
    currentToken = token;
    if (token) {
        // @ts-ignore
        if (supabase.realtime) {
            // @ts-ignore
            supabase.realtime.setAuth(token);
        }
    }
};

