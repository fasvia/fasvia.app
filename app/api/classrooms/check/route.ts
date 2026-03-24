import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { getDistance } from '@/lib/gps'

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const { lat, lng } = await request.json()

    // Find any classroom fingerprints within 20 meters that have high confidence
    const { data: fingerprints, error } = await supabase
      .from('classroom_fingerprints')
      .select('*')
      .eq('school_id', schoolId)
      .gte('confidence_score', 70)

    if (error) throw error

    // Manually filter by distance since Supabase basic select doesn't have PostGIS by default
    const matched = fingerprints?.filter(fp => {
      const dist = getDistance(lat, lng, fp.centre_lat, fp.centre_lng)
      return dist <= 20 // within 20m of the center
    })

    if (matched && matched.length > 0) {
      // Sort by highest confidence and return best match
      const bestMatch = matched.sort((a, b) => b.confidence_score - a.confidence_score)[0]
      return NextResponse.json({ found: true, fingerprint: bestMatch })
    }

    return NextResponse.json({ found: false })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
