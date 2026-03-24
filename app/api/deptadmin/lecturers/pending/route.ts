import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { supabase } = getTenantDb()
    const { searchParams } = new URL(request.url)
    const department_id = searchParams.get('department_id')

    let query = supabase
      .from('users')
      .select('id, name, email, staff_id, role, status, academic_title')
      .eq('role', 'lecturer')
      .eq('status', 'pending')

    if (department_id) {
      query = query.eq('department_id', department_id)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ lecturers: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
