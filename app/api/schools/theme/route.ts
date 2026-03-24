import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const { primary_colour, secondary_colour, logo_url } = await request.json()

    const { data: school, error } = await supabase
      .from('schools')
      .update({ primary_colour, secondary_colour, logo_url })
      .eq('id', schoolId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, school })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    
    if (!schoolId) {
      return NextResponse.json({ school: null })
    }

    const { data: school, error } = await supabase
      .from('schools')
      .select('primary_colour, secondary_colour, logo_url')
      .eq('id', schoolId)
      .single()

    if (error) {
      console.error('Theme fetch error:', error)
      throw error
    }

    return NextResponse.json({ school })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
