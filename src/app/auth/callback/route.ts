import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing user sessions.
                        }
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if this was a password recovery flow by inspecting the session's AMR
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const session = data?.session as any;
            const isRecovery = session?.amr?.some(
                (factor: { method: string }) => factor.method === 'recovery' || factor.method === 'otp'
            );

            if (isRecovery || next === '/auth/update-password') {
                // Always redirect to update-password for recovery sessions
                return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
            }

            // For other flows, redirect to `next` param
            return NextResponse.redirect(new URL(next, requestUrl.origin));
        }
    }

    // If code exchange failed or no code, redirect to auth page with error
    return NextResponse.redirect(new URL('/auth?error=auth_callback_error', requestUrl.origin));
}
