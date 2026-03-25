import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId, deviceFingerprint } = await request.json()

    if (!userId || !deviceFingerprint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: device } = await (supabaseAdmin as any)
      .from('user_devices')
      .select('device_fingerprint')
      .eq('user_id', userId)
      .maybeSingle()

    if (!device) {
      // No device registered yet — first-time login, allow and register
      return NextResponse.json({ status: 'unregistered' })
    }

    if (device.device_fingerprint === deviceFingerprint) {
      return NextResponse.json({ status: 'match' })
    }

    // Device fingerprint doesn't match — different phone
    return NextResponse.json({ status: 'blocked' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
