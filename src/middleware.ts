import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
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
  return process.env.MAINTENANCE_MODE === 'true';
}

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Skip maintenance check for static assets and Next.js internals
  const isAsset = path.startsWith('/_next') || path.startsWith('/api') || path === '/favicon.ico' || path === '/icon.png' || path === '/manifest.json';

  // Maintenance mode - skip assets, the maintenance page, and the admin panel
  if (!isAsset && !path.startsWith('/maintenance') && !path.startsWith('/admin')) {
    const maintenanceActive = await isMaintenanceModeActive();
    if (maintenanceActive) {
      // Simplified bypass: If maintenance mode is hard-enabled via Vercel ENV, 
      // block access. Admins can bypass by going to /admin directly or toggling the ENV.
      const maintenanceUrl = new URL('/maintenance', req.url);
      return NextResponse.redirect(maintenanceUrl);
    }
  }

  // Auth protection — redirect unauthenticated users to sign-in
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const { userId, sessionClaims } = await auth();

  // Redirect authenticated users away from sign-in and sign-up pages
  if (userId && (path.startsWith('/sign-in') || path.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Onboarding gate — signed-in users who haven't completed onboarding
  // are redirected to /onboarding (checked via Clerk publicMetadata in JWT).
  // REQUIRES: Clerk Dashboard → Sessions → Customize session token →
  //   add: { "metadata": "{{user.public_metadata}}" }
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

