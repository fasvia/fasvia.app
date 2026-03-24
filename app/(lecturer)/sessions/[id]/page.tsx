import { getTenantDb } from '@/lib/db'
import ManualMarker from '@/components/lecturer/ManualMarker'
import LiveSessionTracker from '@/components/lecturer/LiveSessionTracker'

export default async function LiveSessionPage({ params }: { params: { id: string } }) {
  const { supabase, withTenant, schoolId } = getTenantDb()
  
  const { data: session } = await withTenant(
      supabase.from('sessions')
      .select('*, courses(code, title)')
      .eq('id', params.id)
      .single()
  )

  if (!session) {
    return <div className="p-8 text-white">Session not found.</div>
  }

  // Fetch initial records
  const { data: records } = await withTenant(
      supabase.from('attendance_records')
      .select('*, users(name, matric_number, profile_photo_url)')
      .eq('session_id', session.id)
  )

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <span className={`px-3 py-1 text-xs rounded-full border uppercase tracking-widest font-bold mb-3 inline-block ${session.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              {session.is_active ? 'Live Session' : 'Closed'}
            </span>
            <h1 className="text-3xl text-white font-bold mb-1">{session.courses?.code}</h1>
            <p className="text-text-muted">{session.courses?.title}</p>
          </div>
          <div className="text-right flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1">
             <p className="text-white text-sm"><span className="text-text-muted">Started:</span> {new Date(session.start_time).toLocaleTimeString()}</p>
             <p className="text-white text-sm"><span className="text-text-muted">Target End:</span> {new Date(session.end_time).toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <LiveSessionTracker sessionId={session.id} initialRecords={records || []} isActive={session.is_active} />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <ManualMarker sessionId={session.id} schoolId={schoolId} />
            
            <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xl">
               <h3 className="text-xl text-white font-bold mb-2">Session Control</h3>
               <p className="text-text-muted text-sm mb-6">Sessions close automatically at target end time.</p>
               <button disabled={!session.is_active} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-50 py-4 rounded-xl font-bold border border-red-500/30 transition-colors">
                 Force Close Session
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
