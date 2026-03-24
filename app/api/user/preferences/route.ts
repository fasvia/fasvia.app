import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const sessionUser = getUserSession()
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { supabase, schoolId } = getTenantDb()
    const prefs = await request.json()

    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: prefs })
      .eq('id', sessionUser.id)
      .eq('school_id', schoolId)

    if (error) throw error

    return NextResponse.json({ success: true, prefs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
