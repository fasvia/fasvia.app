import CalendarSetupForm from '@/components/admin/CalendarSetupForm'
import { getTenantDb } from '@/lib/db'

export default async function AdminDashboard() {
  const { supabase, withTenant } = getTenantDb()
  
  const { data: session } = await withTenant(
     supabase.from('academic_sessions').select('*').eq('is_active', true).single()
  )

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl text-white font-bold mb-2">School Admin Dashboard</h1>
        <p className="text-text-muted mb-12">Manage your university's Fasvia configuration.</p>
        
        {!session ? (
          <CalendarSetupForm />
        ) : (
          <div className="bg-surface p-8 rounded-2xl border border-purple-primary/20 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-white">Active Session: <span className="text-purple-accent">{session.name}</span></h2>
              <span className="px-3 py-1 bg-purple-primary/20 text-purple-accent text-xs rounded-full border border-purple-primary/50 uppercase tracking-widest font-bold">Active</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 bg-bg-primary rounded-xl border border-border-subtle hover:border-purple-accent/50 transition-colors">
                 <p className="text-xs text-purple-accent uppercase tracking-widest mb-2 font-semibold">First Semester</p>
                 <p className="text-white font-medium text-lg">
                   {new Date(session.first_semester_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
                   <span className="text-text-muted mx-2">→</span> 
                   {new Date(session.first_semester_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                 </p>
               </div>
               <div className="p-6 bg-bg-primary rounded-xl border border-border-subtle hover:border-purple-accent/50 transition-colors">
                 <p className="text-xs text-purple-accent uppercase tracking-widest mb-2 font-semibold">Second Semester</p>
                 <p className="text-white font-medium text-lg">
                   {new Date(session.second_semester_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
                   <span className="text-text-muted mx-2">→</span> 
                   {new Date(session.second_semester_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                 </p>
               </div>
            </div>
            
            <div className="mt-8 flex gap-4">
              <button className="px-6 py-2 bg-bg-primary border border-border-subtle rounded-lg text-sm text-white hover:border-purple-accent transition-colors">Edit Calendar</button>
              <button className="px-6 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors">Suspend Session</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
