import { NextResponse, NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const url = new URL('/login', request.nextUrl.origin)
  const response = NextResponse.redirect(url)
  
  // Wipe the HttpOnly Fasvia JWT securely!
  response.cookies.delete('fasvia_token')
  
  return response
}
