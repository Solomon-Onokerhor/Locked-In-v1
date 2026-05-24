import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/api/webhooks(.*)',
  '/api/admin/maintenance(.*)', // allow reading maintenance status publicly
  '/maintenance',
  '/favicon.ico',
  '/icon.png',
  '/manifest.json'
]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function isMaintenanceModeActive(): Promise<boolean> {
  // Fall back to env var if Supabase isn't configured
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return process.env.MAINTENANCE_MODE === 'true';
  }
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_config?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 30 }, // cache for 30 seconds to avoid hammering Supabase
      }
    );
    if (!res.ok) return process.env.MAINTENANCE_MODE === 'true';
    const rows = await res.json();
    if (!rows || rows.length === 0) return false;
    return rows[0].value === 'true';
  } catch {
    // On error, fall back to env var
    return process.env.MAINTENANCE_MODE === 'true';
  }
}

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Skip maintenance check for static assets and Next.js internals
  const isAsset = path.startsWith('/_next') || path.startsWith('/api') || path === '/favicon.ico' || path === '/icon.png' || path === '/manifest.json';

  // Maintenance mode — skip assets, the maintenance page, and the admin panel
  if (!isAsset && !path.startsWith('/maintenance') && !path.startsWith('/admin')) {
    const maintenanceActive = await isMaintenanceModeActive();
    if (maintenanceActive) {
      // Check if user is admin to bypass maintenance
      const { userId } = await auth();
      let isAdmin = false;
      
      if (userId && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const res = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role`,
            {
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          );
          if (res.ok) {
            const rows = await res.json();
            if (rows && rows.length > 0 && rows[0].role === 'admin') {
              isAdmin = true;
            }
          }
        } catch (e) {
          console.error("Failed to check admin role for maintenance bypass", e);
        }
      }

      if (!isAdmin) {
        const maintenanceUrl = new URL('/maintenance', req.url);
        return NextResponse.redirect(maintenanceUrl);
      }
    }
  }

  // Auth protection — redirect unauthenticated users to sign-in
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Onboarding gate — signed-in users who haven't completed onboarding
  // are redirected to /onboarding (checked via Clerk publicMetadata in JWT).
  // REQUIRES: Clerk Dashboard → Sessions → Customize session token →
  //   add: { "metadata": "{{user.public_metadata}}" }
  const { userId, sessionClaims } = await auth();
  if (userId && path !== '/onboarding' && !path.startsWith('/sign-') && !path.startsWith('/api')) {
    // sessionClaims.metadata is populated only if the session token is customized in Clerk Dashboard
    const meta = (sessionClaims as any)?.metadata as Record<string, unknown> | undefined;
    // Only gate if we have metadata in the token AND onboardingComplete is explicitly false
    if (meta !== undefined && !meta.onboardingComplete) {
      const onboardingUrl = new URL('/onboarding', req.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

