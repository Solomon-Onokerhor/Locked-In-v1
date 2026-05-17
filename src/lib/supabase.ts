import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// We use createBrowserClient from @supabase/ssr so it automatically synchronizes
// the session with the cookies set by the Next.js server (e.g. during PKCE auth callbacks).
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);


