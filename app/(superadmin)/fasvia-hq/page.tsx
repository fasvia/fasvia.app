import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import CompanyDashboard from '@/components/superadmin/CompanyDashboard'

export default async function FasviaHQ() {
  const token = cookies().get('fasvia_hq_token')?.value
  // High-Level Security Lock
  if (!token) redirect('/fasvia-hq/login')

  // Fetch cross-tenant data using Service Role Key
  const { data: schools } = await supabaseAdmin.from('schools').select('*').order('created_at', { ascending: false })
  
  const { count: totalStudents } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student')
  
  // Records today
  const today = new Date()
  today.setHours(0,0,0,0)
  const { count: todayRecords } = await supabaseAdmin.from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

  const stats = {
    totalUniversities: schools?.length || 0,
    activeUniversities: schools?.filter((s:any) => s.subscription_status === 'Active').length || 0,
    totalStudents: totalStudents || 0,
    recordsToday: todayRecords || 0
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
       <CompanyDashboard initialSchools={schools || []} initialStats={stats} />
    </div>
  )
}
