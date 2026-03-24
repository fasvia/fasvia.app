import DepartmentsManager from '@/components/admin/DepartmentsManager'
import { getTenantDb } from '@/lib/db'

export default async function AdminDepartments() {
  const { supabase, withTenant } = getTenantDb()
  
  const { data: departments } = await withTenant(
      supabase.from('departments').select('*').order('name', { ascending: true })
  )

  return (
    <div className="min-h-screen bg-bg-primary xl:pl-64 p-8">
       <div className="max-w-6xl mx-auto">
         <h1 className="text-4xl text-white font-bold mb-2">Manage Departments</h1>
         <p className="text-text-muted mb-12">Establish academic hierarchies and natively provision Department Administrators.</p>

         <DepartmentsManager initialDepartments={departments || []} />
       </div>
    </div>
  )
}
