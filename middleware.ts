// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected app routes (must be signed in)
const isProtectedRoute = createRouteMatcher(['/my-courses(.*)'])

// Public API routes that must bypass auth (e.g. Supabase webhooks)
const isPublicApiRoute = createRouteMatcher([
  '/api/revalidate',        // ← revalidation webhook
  // add more if needed (e.g. Stripe webhooks):
  // '/api/stripe/webhook',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1) Let public API routes pass through with NO auth
  if (isPublicApiRoute(req)) {
    return NextResponse.next()
  }

  // 2) Protect app pages that require auth
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // 3) Attach Clerk user id header for RLS-enabled backends
  const { userId } = await auth()
  const res = NextResponse.next()
  if (userId) {
    res.headers.set('x-clerk-user-id', userId)
  }
  return res
})

export const config = {
  matcher: [
    // Run middleware on all pages except static assets, and on API routes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
