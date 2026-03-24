import { NextResponse } from 'next/server'
import { compareFaces } from '@/lib/face'

export async function POST(req: Request) {
  try {
    const { selfieBase64, formPhotoBase64 } = await req.json()
    if (!selfieBase64 || !formPhotoBase64) {
      return NextResponse.json({ error: 'Missing images for face comparison.' }, { status: 400 })
    }

    // Strip out the dataurl prefix if it exists to satisfy Face++ base64 requirements
    const b1 = selfieBase64.replace(/^data:image\/\w+;base64,/, '');
    const b2 = formPhotoBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await compareFaces(b1, b2)
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
