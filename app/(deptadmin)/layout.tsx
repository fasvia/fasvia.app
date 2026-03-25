import Sidebar from '@/components/ui/Sidebar'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTenantDb } from '@/lib/db'

export default async function DeptAdminLayout({ children }: { children: React.ReactNode }) {
  const user = getUserSession()
  if (!user || user.role !== 'dept_admin') redirect('/login')

  const { supabase, withTenant } = getTenantDb()
  
  // Fetch pending disputes for the notification badge
  const { count } = await withTenant(
     supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  )

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role={user.role} pendingDisputes={count || 0} />
      <div className="flex-1 lg:ml-64 pt-20 lg:pt-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
