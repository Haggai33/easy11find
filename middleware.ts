import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Just let the request continue for now
  return NextResponse.next()
}

// Set a matcher to define which routes the middleware runs on
export const config = {
  matcher: '/dashboard/:path*', // Run this middleware only for dashboard routes
}