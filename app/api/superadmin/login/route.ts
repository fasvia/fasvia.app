import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const validEmail = process.env.SUPERADMIN_EMAIL
    const validPassword = process.env.SUPERADMIN_PASSWORD

    if (!validEmail || !validPassword) {
      return NextResponse.json({ error: 'Server Configuration Error: SuperAdmin credentials missing in environment.' }, { status: 500 })
    }

    if (email === validEmail && password === validPassword) {
      cookies().set('fasvia_hq_token', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Unauthorized: Invalid Nelbion Group SuperAdmin credentials' }, { status: 401 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
