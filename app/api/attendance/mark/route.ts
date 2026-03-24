import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'
import { verifyGeofence, verifyCircularGeofence } from '@/lib/gps'
import { compareFaces } from '@/lib/face'

export async function POST(request: Request) {
  try {
    const { supabase, schoolId, withTenant } = getTenantDb()
    const sessionUser = getUserSession()

    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student_id = sessionUser.id
    const { 
      session_id, latitude, longitude, device_fingerprint, 
      verification_method, face_photo, marked_offline, marked_at 
    } = await request.json()

    // 0. Offline Expiration Check (24h)
    if (marked_offline && marked_at) {
       const markedTime = new Date(marked_at).getTime()
       const now = new Date().getTime()
       if (now - markedTime > 24 * 60 * 60 * 1000) {
          throw new Error('Offline attendance expired. Records must be synced within 24 hours of the class.')
       }
    }

    // 1. Fetch the session to get geofence rules
    const { data: session, error: sessionError } = await withTenant(
      supabase.from('sessions').select('*').eq('id', session_id)
    ).single()

    if (sessionError || !session) throw new Error('Session not found.')
    
    // Check if session is still active and not expired
    if (!session.is_active) {
       throw new Error('Session is already closed.')
    }

    const now = new Date().getTime()
    const endTime = new Date(session.end_time).getTime()
    if (now > endTime) {
       throw new Error('Session has expired.')
    }

    // 2. Validate Geofence
    let status: 'inside' | 'boundary' | 'outside' = 'outside'

    if (session.geofence_points && session.geofence_points.f1 && session.geofence_points.f2) {
      status = verifyGeofence(
        latitude, longitude,
        session.geofence_points.f1.lat, session.geofence_points.f1.lng,
        session.geofence_points.f2.lat, session.geofence_points.f2.lng,
        session.geofence_radius || 30
      )
    } else {
      status = verifyCircularGeofence(
        latitude, longitude,
        session.latitude, session.longitude,
        session.geofence_radius || 30
      )
    }

    if (status === 'outside') {
      throw new Error('You are not within the classroom location')
    }

    // 3. Check for existing mark
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .maybeSingle()

    if (existingRecord) {
      throw new Error('You have already marked attendance for this session.')
    }
    
    // 3.5 Biometric & Device Hardened Verification (If present)
    let faceVerified = null
    try {
       // A. Always check physical hardware affinity (Device Lock)
       const { data: userData, error: userFetchError } = await supabase
         .from('users')
         .select('profile_photo_url, device_fingerprint')
         .eq('id', student_id)
         .single()
       
       if (userFetchError || !userData) throw new Error('Account verification integrity failed.')

       // If the account is locked to a fingerprint, it must match.
       if (userData.device_fingerprint && userData.device_fingerprint !== device_fingerprint) {
         throw new Error('Device Mismatch: This account is locked to its original registered physical hardware.')
       }

       if (face_photo) {
         if (userData.profile_photo_url) {
            // Strip dataurl prefixes
            const b1 = face_photo.replace(/^data:image\/\w+;base64,/, '')
            const b2 = userData.profile_photo_url.replace(/^data:image\/\w+;base64,/, '')
            
            const result = await compareFaces(b1, b2)
            faceVerified = result.confidence > 75 
            
            // Hard Rejection if face doesn't match
            if (!faceVerified) {
               throw new Error('Face Verification Failed: Security Anomaly Detected. Marking Rejected.')
            }
         }
       }
    } catch (verifErr: any) {
       console.error("Biometric/Device Security Rejection:", verifErr.message)
       // Absolute Rejection: If it's a security error (Device or Face), we block.
       if (verifErr.message.includes('Device Mismatch') || verifErr.message.includes('Face Verification Failed')) {
          throw verifErr
       }
       faceVerified = false
    }

    // 4. Save Record
    const { data: record, error: recordError } = await supabase
      .from('attendance_records')
      .insert({
        school_id: schoolId,
        session_id: session_id,
        student_id: student_id,
        latitude,
        longitude,
        device_fingerprint,
        verification_method: verification_method || 'gps',
        is_boundary_case: status === 'boundary',
        face_verified: faceVerified,
        status: (status === 'boundary' || faceVerified === false) ? 'flagged' : 'verified',
        marked_at: marked_at || new Date().toISOString(),
        marked_offline: marked_offline || false,
        synced_at: marked_offline ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (recordError) throw recordError

    return NextResponse.json({ success: true, record })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

