import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/maintenance(.*)'
])
const isMaintenanceRoute = createRouteMatcher(['/maintenance(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Check for maintenance mode FIRST
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  
  if (
    isMaintenanceMode &&
    !isMaintenanceRoute(req) &&
    !req.nextUrl.pathname.startsWith('/_next') &&
    !req.nextUrl.pathname.startsWith('/api') && // allow webhooks/API
    req.nextUrl.pathname !== '/favicon.ico' &&
    req.nextUrl.pathname !== '/icon.png' // allow app icon
  ) {
    const maintenanceUrl = new URL('/maintenance', req.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth()

  // For users visiting /onboarding, don't try to redirect
  if (isAuthenticated && isOnboardingRoute(req)) {
    return NextResponse.next()
  }

  // If the user isn't signed in and the route is private, redirect to sign-in
  if (!isAuthenticated && !isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url })

  // Catch users who do not have `onboardingComplete: true` in their publicMetadata
  // Redirect them to the /onboarding route to complete onboarding
  if (isAuthenticated && !sessionClaims?.metadata?.onboardingComplete) {
    const onboardingUrl = new URL('/onboarding', req.url)
    return NextResponse.redirect(onboardingUrl)
  }

  // If the user is signed in and the route is protected, let them view.
  if (isAuthenticated && !isPublicRoute(req)) return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
