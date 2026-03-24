import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function GET() {
  try {
    const { supabase, withTenant } = getTenantDb()

    const { data: departments, error } = await withTenant(
      supabase.from('departments').select('*').order('name', { ascending: true })
    )

    if (error) throw error
    return NextResponse.json({ departments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const { name, code } = await request.json()

    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        school_id: schoolId,
        name,
        code: code.toUpperCase()
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ department })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
