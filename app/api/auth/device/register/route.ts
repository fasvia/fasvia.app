import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId, deviceFingerprint, deviceName } = await request.json()

    if (!userId || !deviceFingerprint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already has a device registered
    const { data: existing } = await (supabaseAdmin as any)
      .from('user_devices')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // Device already registered — don't overwrite silently (conflict)
      return NextResponse.json({ error: 'Device already registered for this account' }, { status: 409 })
    }

    const { error } = await (supabaseAdmin as any)
      .from('user_devices')
      .insert({
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName || 'Unknown Device',
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
