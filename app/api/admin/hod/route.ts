import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { schoolId } = getTenantDb()
    const { department_id, name, email, password } = await request.json()

    // Create the HOD in Supabase Auth using the Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'dept_admin',
        school_id: schoolId,
        department_id: department_id,
        name: name
      }
    })

    if (authError) throw authError

    // Wait 1.5 seconds for the public.users postgres trigger to complete its base insert
    await new Promise(r => setTimeout(r, 1500))

    // Hash password explicitly since Fasvia relies on a custom bcrypt column for the frontend login gateway
    const hashedPassword = await bcrypt.hash(password, 10)

    // Ensure the users table has the heavily correct data overriding standard roles
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert({
         id: authData.user.id,
         email: email,
         role: 'dept_admin',
         school_id: schoolId,
         department_id: department_id,
         name: name,
         password: hashedPassword
      }, { onConflict: 'id' })

    if (dbError) throw dbError
    return NextResponse.json({ success: true, user: authData.user })
      
  } catch(error: any) {
    console.error('SchoolAdmin Provision HOD:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
