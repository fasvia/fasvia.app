import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const department_id = searchParams.get('department_id')
    const { supabase, withTenant } = getTenantDb()

    let query = supabase.from('courses').select('*').order('code', { ascending: true })
    if (department_id) {
      query = query.eq('department_id', department_id)
    }

    const { data, error } = await withTenant(query)
    if (error) throw error

    return NextResponse.json({ courses: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const rawBody = await request.json()
    
    // Support bulk insert (from OCR) or single insert
    const payload = Array.isArray(rawBody) ? rawBody : [rawBody]
    
    const coursesToInsert = payload.map(c => ({
      school_id: schoolId,
      department_id: c.department_id,
      code: c.code,
      title: c.title,
      units: parseInt(c.units, 10),
      target_level: c.target_level, // auto-assigned from first digit on frontend
      semester: c.semester,
      is_open: c.is_open ?? false
    }))

    const { data, error } = await supabase
      .from('courses')
      .insert(coursesToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({ courses: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase } = getTenantDb()
    const { ids } = await request.json()
    
    if (!ids || !Array.isArray(ids)) {
      throw new Error('Invalid IDs provided for deletion.')
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .in('id', ids)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
