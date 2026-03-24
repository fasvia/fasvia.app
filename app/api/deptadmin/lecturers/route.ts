import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import bcrypt from 'bcryptjs'

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = 'FA-'
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const { name, email, staff_id, department_id, academic_title } = await request.json()

    if (!name || !email) {
      throw new Error('Name and email are required')
    }

    if (!department_id) {
       throw new Error('Department ID is required')
    }

    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        school_id: schoolId,
        name,
        email,
        password: hashedPassword,
        staff_id,
        department_id,
        academic_title,
        role: 'lecturer',
        status: 'approved',
        is_verified: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      lecturer: user,
      temp_password: tempPassword 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase } = getTenantDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) throw new Error('Lecturer ID is required')

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
