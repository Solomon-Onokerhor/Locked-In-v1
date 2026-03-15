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
    // We target common auth API paths or Next.js server actions triggering auth.
    // Since Supabase manages auth, the login typically hits Supabase directly, but if the app proxies it:
    if (path.startsWith('/api/') || path.includes('/auth/')) {
        // Get IP (Vercel sets x-real-ip or x-forwarded-for)
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        const now = Date.now();
        const record = rateLimitMap.get(ip);

        // Clean up basic sliding window
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

    // 2. HEADERS (Fallback application for dynamic routes, NextConfig handles static edge)
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
