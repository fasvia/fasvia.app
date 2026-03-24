import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function GET() {
  try {
    const { supabase, withTenant } = getTenantDb()
    
    // Fetch all sessions for this school
    const { data: sessions, error } = await withTenant(
      supabase.from('academic_sessions').select('*').order('created_at', { ascending: false })
    )

    if (error) throw error

    return NextResponse.json({ sessions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const body = await request.json()

    // Deactivate previous active sessions if this one is intended to be active
    if (body.is_active) {
      await supabase
        .from('academic_sessions')
        .update({ is_active: false })
        .eq('school_id', schoolId)
        .eq('is_active', true)
    }

    const { data, error } = await supabase
      .from('academic_sessions')
      .insert({
        school_id: schoolId,
        name: body.name,
        first_semester_start: body.first_semester_start,
        first_semester_end: body.first_semester_end,
        second_semester_start: body.second_semester_start,
        second_semester_end: body.second_semester_end,
        is_active: body.is_active ?? false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
