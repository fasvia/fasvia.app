import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export interface UserSession {
  id: string
  role: string
  school_id: string
}

export function getUserSession(): UserSession | null {
  const cookieStore = cookies()
  const token = cookieStore.get('fasvia_token')?.value
  
  if (!token) return null

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    const decoded = jwt.verify(token, secret) as UserSession
    return decoded
  } catch (err) {
    return null
  }
}
