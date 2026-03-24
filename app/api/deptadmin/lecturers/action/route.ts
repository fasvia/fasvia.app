import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { supabase } = getTenantDb()
    const { id, action } = await request.json()

    if (!id || !action) {
      throw new Error('Missing ID or action')
    }

    const { error } = await supabase
      .from('users')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
