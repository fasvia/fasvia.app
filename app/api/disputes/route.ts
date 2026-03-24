import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const { session_id, student_id, reason, evidence_url } = await request.json()

    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({
        school_id: schoolId,
        session_id: session_id,
        student_id: student_id,
        reason: reason,
        evidence_url: evidence_url,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, dispute })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionUser = getUserSession()
    if (!sessionUser) throw new Error('Unauthorized')

    const { supabase, schoolId } = getTenantDb()
    const { dispute_id, action } = await request.json()

    // 1. Update dispute status
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .update({
        status: action === 'approve' ? 'resolved' : 'rejected',
        resolved_by: sessionUser.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', dispute_id)
      .eq('school_id', schoolId)
      .select()
      .single()

    if (disputeError) throw disputeError

    // 2. If approved, verify the student's attendance record
    if (action === 'approve') {
       // Check if record exists
       const { data: existingRecord } = await supabase
         .from('attendance_records')
         .select('id')
         .eq('session_id', dispute.session_id!)
         .eq('student_id', dispute.student_id!)
         .single()

       if (existingRecord) {
         await supabase
           .from('attendance_records')
           .update({ status: 'verified', is_manual: true, verification_method: 'manual' })
           .eq('id', existingRecord.id)
       } else {
         await supabase
           .from('attendance_records')
           .insert({
             school_id: schoolId,
             session_id: dispute.session_id,
             student_id: dispute.student_id,
             verification_method: 'manual',
             status: 'verified',
             is_manual: true
           })
       }
    }

    return NextResponse.json({ success: true, dispute })
  } catch (error: any) {
    console.error('Dispute PATCH Error:', error)
    return NextResponse.json({ error: error.message || error.details || error.hint || 'Unknown DB Error' }, { status: 400 })
  }
}
