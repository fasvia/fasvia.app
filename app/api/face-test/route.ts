import { NextResponse } from 'next/server'
import { testFaceppConnection } from '@/lib/face'

export async function GET() {
  try {
    const data = await testFaceppConnection()
    return NextResponse.json({ success: true, payload: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
