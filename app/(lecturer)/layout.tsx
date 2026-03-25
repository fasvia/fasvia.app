import Sidebar from '@/components/ui/Sidebar'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTenantDb } from '@/lib/db'

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  const user = getUserSession()
  if (!user || user.role !== 'lecturer') redirect('/login')

  const { supabase, withTenant } = getTenantDb()
  
  const { data: allocated } = await withTenant(supabase.from('lecturer_courses').select('course_id, courses(id, code, title)').eq('lecturer_id', user.id))
  const { data: sessionStats } = await withTenant(supabase.from('sessions').select('course_id').eq('lecturer_id', user.id))
  
  const coursesWithCounts = allocated?.map((ac: any) => ({
     ...ac,
     session_count: sessionStats?.filter((s: any) => s.course_id === ac.course_id).length || 0
  })) || []

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role={user.role} courses={coursesWithCounts} />
      <div className="flex-1 lg:ml-64 pt-20 lg:pt-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
