import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const token = cookies().get('fasvia_hq_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized HQ Control' }, { status: 401 })

    const { name, code, domain, primary_colour, secondary_colour, subscription_status } = await request.json()

    // Using supabaseAdmin to bypass RLS and create tenant
    const { data: school, error } = await supabaseAdmin
      .from('schools')
      .insert({
        name,
        code,
        domain: domain || `${code.toLowerCase()}.fasvia.app`,
        primary_colour: primary_colour || '#7C3AED',
        secondary_colour: secondary_colour || '#A855F7',
        subscription_status: subscription_status || 'Trial'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, school })
  } catch(error: any) {
    console.error('Superadmin Create School Error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
