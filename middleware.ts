import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Extract school_id from header or subdomain
  let schoolId = request.headers.get('x-school-id')

  if (!schoolId) {
    const parts = hostname.split('.')
    if (parts.length >= 2 && !hostname.includes('localhost') && parts[0] !== 'fasvia-app' && parts[0] !== 'www') {
      schoolId = parts[0]
    } else {
      // Deterministic fallback UUID for local dev testing
      schoolId = '11111111-1111-1111-1111-111111111111' 
    }
  }

  // Pass school_id to all matching routes via header
  const requestHeaders = new Headers(request.headers)
  if (schoolId) {
    requestHeaders.set('x-school-id', schoolId)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
    '/api/:path*'
  ],
}
