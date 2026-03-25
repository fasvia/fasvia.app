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
      // Valid Demo School ID for root domain/local fallback
      schoolId = '754f7386-a244-489e-97c2-846115995874' 
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
