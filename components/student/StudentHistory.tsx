'use client'

import { useState } from 'react'
import { AlertTriangle, Clock, Info, CheckCircle, FileText, Settings, LogOut, FileSearch, ShieldAlert } from 'lucide-react'

export default function StudentHistory({ sessions, attendanceRecords }: { sessions: any[], attendanceRecords: any[] }) {
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Quick Map of attended sessions
  const attendedSet = new Set(attendanceRecords.map(r => r.session_id))
  
  const totalClasses = sessions.length
  const attendedClasses = attendedSet.size
  const attendancePercentage = totalClasses === 0 ? 100 : Math.round((attendedClasses / totalClasses) * 100)
  
  const isEligible = attendancePercentage >= 75

  const submitDispute = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSession.id,
          student_id: '33333333-3333-3333-3333-333333333333', // Mock ID
          reason: disputeReason,
          evidence_url: null // Would upload evidence to bucket here in full app
        })
      })
      if (!res.ok) throw new Error()
      alert('Dispute submitted successfully!')
      setSelectedSession(null)
    } catch {
      alert('Failed to submit dispute.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${isEligible ? 'bg-surface border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        {!isEligible && (
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
             <h2 className="text-3xl text-white font-bold mb-2">Semester Overview</h2>
             {!isEligible ? (
               <p className="text-red-400 font-medium flex items-center gap-2"><ShieldAlert size={18}/> WARNING: You are NOT eligible for exams.</p>
             ) : (
               <p className="text-green-400 font-medium flex items-center gap-2"><CheckCircle size={18}/> You are eligible for exams.</p>
             )}
           </div>
           
           <div className="flex gap-4 items-end">
             <div className="text-center">
               <p className="text-4xl text-white font-bold">{attendancePercentage}%</p>
               <p className="text-xs text-text-muted uppercase tracking-widest mt-1">Total Score</p>
             </div>
             <div className="h-12 w-px bg-border-subtle mx-2"></div>
             <div className="text-center">
               <p className="text-3xl text-white font-bold">{attendedClasses}<span className="text-lg text-text-muted">/{totalClasses}</span></p>
               <p className="text-xs text-text-muted uppercase tracking-widest mt-1">Classes</p>
             </div>
           </div>
        </div>
      </div>

      <h3 className="text-xl text-white font-bold flex items-center gap-2">Class History</h3>

      <div className="space-y-4">
        {sessions.map((s: any) => {
          const attended = attendedSet.has(s.id)
          const record = attendanceRecords.find(r => r.session_id === s.id)

          return (
            <div key={s.id} className="bg-surface p-5 rounded-xl border border-border-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                   {attended ? (
                     <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                   ) : (
                     <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>
                   )}
                   <h4 className="text-white font-bold text-lg">{s.courses?.code}</h4>
                </div>
                <p className="text-text-muted text-sm">{new Date(s.start_time).toLocaleDateString()} at {new Date(s.start_time).toLocaleTimeString()}</p>
                {attended && record?.marked_offline && <span className="text-xs text-yellow-500 mt-1 inline-block">Synced Offline</span>}
              </div>

              {!attended && (
                <button onClick={() => setSelectedSession(s)} className="text-xs font-bold uppercase tracking-wider text-purple-accent hover:text-white bg-purple-primary/10 hover:bg-purple-primary border border-purple-primary/30 px-4 py-2 rounded-lg transition-colors">
                  File Dispute
                </button>
              )}
            </div>
          )
        })}
        {sessions.length === 0 && <p className="text-text-muted text-center py-12">No classes recorded yet for the active semester.</p>}
      </div>

      {/* Dispute Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle p-8 rounded-2xl max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl">
            <h3 className="text-xl text-white font-bold mb-2">Dispute Absence</h3>
            <p className="text-text-muted text-sm mb-6">Filing a dispute for {selectedSession.courses?.code} on {new Date(selectedSession.start_time).toLocaleDateString()}.</p>
            
            <textarea 
               value={disputeReason}
               onChange={e => setDisputeReason(e.target.value)}
               placeholder="Please explain in detail why you were marked absent..."
               className="w-full h-32 bg-bg-primary border border-border-subtle rounded-xl p-4 text-white focus:border-purple-accent outline-none mb-6 resize-none"
            />

            <div className="bg-bg-primary p-4 rounded-xl border border-border-dashed border-border-subtle text-center mb-8 text-text-muted text-sm cursor-pointer hover:border-purple-primary hover:text-purple-primary transition-colors">
               <FileSearch className="mx-auto mb-2" size={24} />
               Click to upload medical or evidence document (Optional)
            </div>

            <div className="flex gap-4">
              <button onClick={() => setSelectedSession(null)} className="flex-1 py-3 border border-border-subtle text-white rounded-xl font-bold hover:bg-bg-primary transition-colors">Cancel</button>
              <button disabled={loading || !disputeReason} onClick={submitDispute} className="flex-1 py-3 bg-purple-primary hover:bg-purple-accent disabled:opacity-50 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors">Submit Appeal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
