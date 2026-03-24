import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/ui/Sidebar'
import SettingsClientView from '@/components/settings/SettingsClientView'

export default async function SettingsPage() {
  const sessionUser = getUserSession()
  if (!sessionUser) redirect('/login')

  const { supabase, withTenant } = getTenantDb()

  // Fetch complete user profile data
  const { data: userProfile } = await withTenant(
      supabase.from('users').select('name, email, role, matric_number, staff_id, departments(name)')
      .eq('id', sessionUser.id)
  ).single()

  const initialData = {
      id: sessionUser.id,
      name: userProfile?.name || 'Unknown',
      email: userProfile?.email || 'Unknown',
      role: sessionUser.role,
      matric_number: userProfile?.matric_number || null,
      staff_id: userProfile?.staff_id || null,
      department_name: userProfile?.departments?.name || 'General'
  }

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role={sessionUser.role} />
      <div className="flex-1 ml-64 p-8 overflow-y-auto pb-8">
         <SettingsClientView initialData={initialData} />
      </div>
    </div>
  )
}
