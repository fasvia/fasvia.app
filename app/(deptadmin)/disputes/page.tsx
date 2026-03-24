import { getTenantDb } from '@/lib/db'
import DisputeManager from '@/components/deptadmin/DisputeManager'
import { FileText } from 'lucide-react'

export default async function DeptDisputesPage() {
  const { supabase, withTenant } = getTenantDb()

  // Fetch disputes
  const { data: disputes } = await withTenant(
      supabase.from('disputes').select('*, users(name, matric_number)').order('created_at', { ascending: false })
  )

  // Fetch courses representing the department's active curriculum
  const { data: courses } = await withTenant(
      supabase.from('courses').select('id, code, title')
  )

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl text-white font-bold mb-2">Appeals & Final Reports</h1>
        <p className="text-text-muted mb-10">Resolve student attendance disputes and export final exam eligibility CSVs.</p>
        
        <DisputeManager disputes={disputes || []} coursesRef={courses || []} />
      </div>
    </div>
  )
}
