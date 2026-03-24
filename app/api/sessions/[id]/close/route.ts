import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const sessionId = params.id

    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        is_active: false,
        end_time: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
