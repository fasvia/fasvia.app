import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserSession } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Only admins can reset device bindings
    const session = getUserSession()
    if (!session || !['admin', 'school_admin', 'dept_admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { userId } = params

    const { error } = await (supabaseAdmin as any)
      .from('user_devices')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Device binding reset. User can now log in on a new device.' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
