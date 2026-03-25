import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const token = cookies().get('fasvia_hq_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized HQ Control' }, { status: 401 })

    const { school_id, name, email, password } = await request.json()

    // Create the user in Supabase Auth using the Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'school_admin',
        school_id: school_id,
        name: name
      }
    })

    if (authError) throw authError

    // Wait 1.5 seconds to allow the public.users postgres trigger to complete its insert
    await new Promise(r => setTimeout(r, 1500))
    
    // Hash password explicitly since Fasvia uses a custom bcrypt column on the public users table!
    const hashedPassword = await bcrypt.hash(password, 10)

    // Ensure the users table has the correct data, upgrading the record with the raw hash
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert({
         id: authData.user.id,
         email: email,
         role: 'school_admin',
         school_id: school_id,
         name: name,
         password: hashedPassword
      }, { onConflict: 'id' })

    if (dbError) throw dbError

    return NextResponse.json({ success: true, user: authData.user })
  } catch(error: any) {
    console.error('Superadmin Provision Admin:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
