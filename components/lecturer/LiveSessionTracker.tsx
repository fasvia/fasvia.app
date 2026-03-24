'use client'

import { useState, useEffect } from 'react'
import { User, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LiveSessionTracker({ sessionId, initialRecords, isActive }: { sessionId: string, initialRecords: any[], isActive: boolean }) {
  const [records, setRecords] = useState<any[]>(initialRecords || [])

  useEffect(() => {
    if (!isActive) return

    // Subscribe to real-time inserts on attendance_records for this session
    const channel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          // Fetch student details for the new record
          const { data: user } = await supabase
             .from('users')
             .select('name, matric_number, profile_photo_url')
             .eq('id', payload.new.student_id)
             .single()
             
          const newRecord = { ...payload.new, users: user }
          setRecords(prev => [newRecord, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, isActive])

  const verifiedCount = records.filter(r => r.status === 'verified').length
  const flaggedCount = records.filter(r => r.status === 'flagged').length

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xl h-full flex flex-col">
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-bg-primary p-4 rounded-xl border border-green-500/20 text-center">
          <CheckCircle className="mx-auto text-green-400 mb-2" size={24} />
          <h4 className="text-3xl text-white font-bold">{verifiedCount}</h4>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">Verified</p>
        </div>
        <div className="bg-bg-primary p-4 rounded-xl border border-yellow-500/20 text-center">
          <AlertCircle className="mx-auto text-yellow-400 mb-2" size={24} />
          <h4 className="text-3xl text-white font-bold">{flaggedCount}</h4>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">Flagged</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-4 mt-4">
        <h3 className="text-lg text-white font-medium">Activity Log</h3>
        {isActive && <span className="flex items-center gap-2 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live Updates</span>}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[300px]">
        {records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted p-8">
            <User size={48} className="mb-4 opacity-50" />
            <p>No students have checked in yet.</p>
          </div>
        ) : (
          records.map((r, i) => (
            <div key={r.id || i} className={`p-4 rounded-xl flex items-center justify-between border ${r.status === 'flagged' ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-bg-primary/50 border-border-subtle'}`}>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-surface overflow-hidden border border-border-subtle">
                   {r.users?.profile_photo_url ? (
                     <img src={r.users.profile_photo_url} className="w-full h-full object-cover" />
                   ) : (
                     <User className="w-full h-full p-2 text-text-muted" />
                   )}
                 </div>
                 <div>
                   <p className="text-white font-medium">{r.users?.name || 'Unknown Student'}</p>
                   <p className="text-xs text-text-muted">{r.users?.matric_number}</p>
                 </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full border ${r.status === 'flagged' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                  {r.status === 'flagged' ? 'Boundary' : r.is_manual ? 'Lecturer OK' : 'GPS OK'}
                </span>
                <p className="text-[10px] text-text-muted mt-2">{new Date(r.marked_at).toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
