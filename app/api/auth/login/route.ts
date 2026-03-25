import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { email, password, deviceFingerprint, platform } = await request.json()

    // 1. Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password, role, name, school_id')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // 2. Verify password
    if (!user.password) {
      return NextResponse.json({ error: 'Invalid account configuration' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // 3. Students can ONLY log in on the native mobile app
    if (user.role === 'student' && platform !== 'native') {
      return NextResponse.json(
        { error: 'Students must use the Fasvia mobile app to log in. Download it from your institution.' },
        { status: 403 }
      )
    }

    // 4. Device binding check (only on native platform)
    let deviceStatus: 'skip' | 'unregistered' | 'match' | 'blocked' = 'skip'

    if (platform === 'native' && deviceFingerprint && user.role === 'student') {
      // Check if this device is registered for this user
      const { data: device } = await (supabase as any)
        .from('user_devices')
        .select('device_fingerprint')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!device) {
        deviceStatus = 'unregistered'
      } else if ((device as any).device_fingerprint === deviceFingerprint) {
        deviceStatus = 'match'
      } else {
        // Different device — block login
        return NextResponse.json(
          { error: 'This account is secured to another device. Contact your institution administrator to reset access.' },
          { status: 403 }
        )
      }
    }

    // 5. Construct JWT
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is not defined in environment')

    const token = jwt.sign(
      { id: user.id, role: user.role, school_id: user.school_id },
      secret,
      { expiresIn: '7d' }
    )

    // 6. Set Cookie and return
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
      deviceStatus,
    })

    response.cookies.set('fasvia_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
