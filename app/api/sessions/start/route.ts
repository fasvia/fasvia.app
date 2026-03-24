import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const sessionUser = getUserSession()
    
    if (!sessionUser) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lecturer_id = sessionUser.id
    const body = await request.json()

    // 1. Process Classroom Fingerprint (Update or Insert)
    let geofencePoints = body.geofence_points

    if (body.fingerprint_id) {
      // Existing fingerprint: increment count, evaluate confidence
      const { data: fp } = await supabase
        .from('classroom_fingerprints')
        .select('session_count, confidence_score')
        .eq('id', body.fingerprint_id)
        .single()
        
      if (fp) {
        const newCount = (fp.session_count || 0) + 1
        // After 5 sessions, boost confidence score to 70+
        const newScore = newCount >= 5 ? Math.max(fp.confidence_score, 75) : fp.confidence_score + 10
        
        await supabase
          .from('classroom_fingerprints')
          .update({ session_count: newCount, confidence_score: newScore, updated_at: new Date().toISOString() })
          .eq('id', body.fingerprint_id)
      }
    } else {
      // New fingerprint from walking to the back
      const { data: newFp, error: fpError } = await supabase
        .from('classroom_fingerprints')
        .insert({
          school_id: schoolId,
          building_name: body.room_name || 'Unknown Hall',
          centre_lat: body.start_lat,
          centre_lng: body.start_lng,
          learned_radius: body.preset_size,
          confidence_score: 30, // Initial low confidence
          session_count: 1,
          geofence_points: body.geofence_points // Store the F1 and F2 points
        })
        .select()
        .single()
        
      if (fpError) throw fpError
    }

    // 2. Create the Attendance Session
    // We assume semester mapping from active session rules. Passed from UI or checked here.
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        school_id: schoolId,
        course_id: body.course_id,
        lecturer_id: body.lecturer_id,
        academic_session_id: body.academic_session_id,
        semester: 'first', // Hardcoded for prototype
        latitude: body.start_lat,
        longitude: body.start_lng,
        geofence_radius: body.preset_size,
        geofence_points: body.geofence_points,
        duration_minutes: body.duration_minutes,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + body.duration_minutes * 60000).toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
