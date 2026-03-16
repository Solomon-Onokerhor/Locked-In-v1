import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight In-Memory Rate Limiter for Edge
// Maps IP to { count, timestamp }
const rateLimitMap = new Map<string, { count: number; timer: number }>();
const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const path = request.nextUrl.pathname;

    // 1. RATE LIMITING for Auth & API Endpoints
    if (path.startsWith('/api/') || path.includes('/auth/')) {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const now = Date.now();
        const record = rateLimitMap.get(ip);

        if (!record || now > record.timer + WINDOW_MS) {
            rateLimitMap.set(ip, { count: 1, timer: now });
        } else {
            record.count += 1;
            if (record.count > LIMIT) {
                return new NextResponse(
                    JSON.stringify({ error: 'Too many requests from this IP. Please try again after 15 minutes.' }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }
    }

    // 2. SUPABASE SESSION REFRESH (required for PKCE auth flow)
    // This ensures the Supabase session cookies are refreshed on every request,
    // which is critical for the password recovery callback to work.
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session - this is important for PKCE code exchange
    await supabase.auth.getUser();

    // 3. HEADERS (Fallback application for dynamic routes, NextConfig handles static edge)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
