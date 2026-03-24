import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { supabase, withTenant, schoolId } = getTenantDb()
    const { lecturerId, courseIds } = await request.json()

    if (!lecturerId) throw new Error('Lecturer ID is required')

    // 1. Verify lecturer exists in this school
    const { data: lecturer, error: lecError } = await withTenant(
      supabase.from('users').select('id').eq('id', lecturerId).eq('role', 'lecturer').single()
    )
    if (lecError || !lecturer) throw new Error('Lecturer not found in this institution')

    // 2. Clear existing allocations for this lecturer within this school
    const { error: clearError } = await withTenant(
      supabase
        .from('courses')
        .update({ lecturer_id: null })
        .eq('school_id', schoolId)
        .eq('lecturer_id', lecturerId)
    )
    if (clearError) throw clearError

    // 3. Update new allocations
    if (courseIds && courseIds.length > 0) {
      const { error: updateError } = await withTenant(
        supabase
          .from('courses')
          .update({ lecturer_id: lecturerId })
          .eq('school_id', schoolId)
          .in('id', courseIds)
      )
      if (updateError) throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
