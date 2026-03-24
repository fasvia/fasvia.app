import AttendanceMarker from '@/components/student/AttendanceMarker'
import StudentDashboardClient from '@/components/student/StudentDashboardClient'
import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'

export default async function StudentDashboard() {
  const { supabase, withTenant } = getTenantDb()
  
  const sessionUser = getUserSession()
  const studentId = sessionUser?.id

  if (!studentId) return null

  // Fetch active academic session ID
  const { data: activeAcademicSession } = await withTenant(
      supabase.from('academic_sessions').select('id').eq('is_active', true)
  ).single()

  // Fetch the courses this student belongs to
  const { data: studentCourses } = await withTenant(
      supabase.from('student_courses')
      .select('course_id')
      .eq('student_id', studentId)
      .eq('academic_session_id', activeAcademicSession?.id)
  )

  const courseIds = studentCourses?.map((sc: any) => sc.course_id) || []

  // Fetch only active sessions meant for this student's registered courses
  const { data: activeSessions } = await withTenant(
    supabase.from('sessions')
    .select('*, courses(code, title)')
    .in('course_id', courseIds)
    .eq('is_active', true)
  )

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8 pb-24">
      <StudentDashboardClient 
        studentId={studentId} 
        activeAcademicSessionId={activeAcademicSession?.id} 
        initialActiveSessions={activeSessions} 
      />
    </div>
  )
}
