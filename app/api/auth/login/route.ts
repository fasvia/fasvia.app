import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const { email, password } = await request.json()

    // 1. Find user (Globally locating their exact tenant assignment!)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password, role, name, school_id')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // 2. Verify Bcrypt Hash (Generated efficiently via pgcrypto or Node)
    if (!user.password) {
      return NextResponse.json({ error: 'Invalid account configuration' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // 3. Construct JWT using the true database-verified tenant UUID
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is not defined in environment')
    
    const token = jwt.sign({ 
       id: user.id, 
       role: user.role, 
       school_id: user.school_id 
    }, secret, { expiresIn: '7d' })

    // 4. Set Cookie and Route appropriately
    const response = NextResponse.json({ 
       success: true, 
       user: { id: user.id, name: user.name, role: user.role } 
    })
    
    response.cookies.set('fasvia_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
