import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function GET() {
  try {
    const { supabase } = getTenantDb()
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ departments: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
