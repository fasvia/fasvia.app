import { getTenantDb } from '@/lib/db'
import DeptAdminDashboardClient from './DeptAdminDashboardClient'

// Mock prefixes for UI
const prefixes = ['ZOO', 'MTH', 'PHY', 'CHM', 'CSC', 'ENG', 'GNS']

export default async function DeptAdminDashboard() {
  const { supabase, withTenant, schoolId } = getTenantDb()
  
  const { data: courses } = await withTenant(
    supabase.from('courses').select('*').order('code')
  )

  // Fetch the current admin's department (Mocking first one for now)
  const { data: dept } = await withTenant(
      supabase.from('departments').select('id').limit(1)
  ).single()
  
  const activeDeptId = dept?.id || '00000000-0000-0000-0000-000000000000'

  const { data: lecturers } = await withTenant(
      supabase.from('users').select('*').eq('role', 'lecturer').eq('department_id', activeDeptId).eq('status', 'approved')
  )

  // Fetch Academic Sessions for filtering
  const { data: sessions } = await withTenant(
    supabase.from('academic_sessions').select('*').order('created_at', { ascending: false })
  )

  // Fetch Students for management
  const { data: students } = await withTenant(
      supabase.from('users').select('id, name, email, matric_number, level, status').eq('role', 'student').eq('department_id', activeDeptId).order('name')
  )

  // Fetch Disputes with student info
  const { data: disputes } = await withTenant(
    supabase.from('disputes')
      .select('*, users!disputes_student_id_fkey(name, matric_number)')
      .order('raised_at', { ascending: false })
  )

  // Map courses to lecturers for better UI
  const processedLecturers = lecturers?.map((lec: any) => ({
    ...lec,
    courses: courses?.filter((c: any) => c.lecturer_id === lec.id).map((c: any) => c.code) || []
  }))

  return (
    <div className="min-h-screen bg-bg-primary">
      <DeptAdminDashboardClient 
        initialCourses={courses || []} 
        initialLecturers={processedLecturers || []}
        initialStudents={students || []}
        initialDisputes={disputes || []}
        academicSessions={sessions || []}
        departmentId={activeDeptId}
        departmentPrefixes={prefixes}
      />
    </div>
  )
}
