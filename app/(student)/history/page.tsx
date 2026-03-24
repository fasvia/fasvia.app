import { getTenantDb } from '@/lib/db'
import StudentHistory from '@/components/student/StudentHistory'
import { getUserSession } from '@/lib/auth'

export default async function HistoryPage() {
  const { supabase, withTenant } = getTenantDb()
  const sessionUser = getUserSession()
  const studentId = sessionUser?.id

  if (!studentId) return null

  const { data: activeAcademicSession } = await withTenant(
      supabase.from('academic_sessions').select('id').eq('is_active', true).single()
  )

  // Fetch all sessions for courses the student is registered to
  const { data: studentCourses } = await withTenant(
      supabase.from('student_courses').select('course_id').eq('student_id', studentId).eq('academic_session_id', activeAcademicSession?.id)
  )
  const courseIds = studentCourses?.map((sc: any) => sc.course_id) || []

  // Get all session events for these courses (closed ones usually)
  const { data: sessions } = await withTenant(
    supabase.from('sessions')
    .select('*, courses(code)')
    .in('course_id', courseIds)
    .order('start_time', { ascending: false })
  )

  // Get attendance records
  const { data: attendanceRecords } = await withTenant(
    supabase.from('attendance_records')
    .select('*')
    .eq('student_id', studentId)
  )

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl text-white font-bold mb-2">History & Grades</h1>
        <p className="text-text-muted mb-10">Review your attendance performance and handle disputes.</p>
        
        <StudentHistory sessions={sessions || []} attendanceRecords={attendanceRecords || []} />
      </div>
    </div>
  )
}
