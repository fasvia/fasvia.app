import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  const { supabase, withTenant } = getTenantDb()
  
  const { data: attendance } = await withTenant(
      supabase
        .from('attendance_records')
        .select('id, verification_method, marked_at, users(name, matric_number), status')
        .eq('session_id', sessionId)
        .order('marked_at', { ascending: false })
  )

  return NextResponse.json({ attendance: attendance || [] })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { supabase, schoolId, withTenant } = getTenantDb()
    
    if (body.action === 'end_session') {
       await withTenant(supabase.from('sessions').update({ is_active: false, end_time: new Date().toISOString() }).eq('id', body.session_id))
       return NextResponse.json({ success: true })
    }
    
    if (body.action === 'manual_mark') {
       const { data: user } = await withTenant(supabase.from('users').select('id').eq('matric_number', body.matric_number)).single()
       if (!user) return NextResponse.json({ error: 'Student not identically documented against registry variables.' }, { status: 400 })
       
        await supabase.from('attendance_records').insert({
          school_id: schoolId, 
          session_id: body.session_id,
          student_id: user.id,
          verification_method: 'MANUAL',
          is_verified: true,
          status: 'verified' // Auto mapped gracefully inside logical scope
        })
       return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Unknown sequence mapped.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
