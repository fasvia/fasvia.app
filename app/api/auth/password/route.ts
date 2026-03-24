import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const sessionUser = getUserSession()
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { supabase, schoolId } = getTenantDb()
    const { current, newPass } = await request.json()

    // 1. Fetch genuine user directly bounded logically to token session context
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', sessionUser.id)
      .eq('school_id', schoolId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User mapping failure' }, { status: 400 })
    }

    // 2. Validate current password hashes (generated inherently via Node or pure pgcrypto)
    const isValid = await bcrypt.compare(current, user.password || '')
    if (!isValid) {
      return NextResponse.json({ error: 'Current password provided is totally incorrect.' }, { status: 401 })
    }

    // 3. Issue fresh 10 round bcrypt salt encoding algorithm matching default pgcrypto bf parameters
    const hashedNewPassword = await bcrypt.hash(newPass, 10)

    // 4. Update the record natively into the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedNewPassword })
      .eq('id', sessionUser.id)
      .eq('school_id', schoolId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
