import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'
import LecturerDashboardClient from '@/components/lecturer/LecturerDashboardClient'
import { redirect } from 'next/navigation'

export default async function LecturerDashboardPage() {
  const { supabase, withTenant } = getTenantDb()
  const sessionUser = getUserSession()

  if (!sessionUser || sessionUser.role !== 'lecturer') redirect('/login')

  const { data: activeAcademicSession } = await withTenant(
      supabase.from('academic_sessions').select('id').eq('is_active', true)
  ).single()

  const { data: coursesData } = await withTenant(
      supabase.from('courses').select('id, code, title, units, semester').eq('lecturer_id', sessionUser.id)
  )

  const allocatedCoursesRaw = (coursesData || []).map(c => ({
     course_id: c.id,
     courses: c
  }))

  const { data: activeSessions } = await withTenant(
    supabase
      .from('sessions')
      .select('id, course_id, courses(code, title), start_time, duration_minutes')
      .eq('lecturer_id', sessionUser.id)
      .eq('is_active', true)
      .order('start_time', { ascending: false })
  )

  const { data: pastSessions } = await withTenant(
    supabase
      .from('sessions')
      .select('id, course_id, courses(code, title), start_time, duration_minutes, is_active')
      .eq('lecturer_id', sessionUser.id)
      .eq('is_active', false)
      .order('start_time', { ascending: false })
  )

  return (
    <LecturerDashboardClient 
      allocatedCourses={allocatedCoursesRaw || []} 
      activeSessions={activeSessions || []} 
      pastSessions={pastSessions || []}
      lecturerId={sessionUser.id}
      activeAcademicSessionId={activeAcademicSession?.id}
    />
  )
}
