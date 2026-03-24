'use client'

import { useState } from 'react'
import { Check, X, ShieldAlert, FileText } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

export default function DisputeManager({ disputes }: { disputes: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoadingId(id)
    try {
      const res = await fetch('/api/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispute_id: id,
          action: action
        })
      })
      if (!res.ok) throw new Error()
      window.location.reload()
    } catch {
      alert(`Failed to ${action} dispute`)
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl text-white font-bold mb-4 flex items-center gap-2">
          <ShieldAlert className="text-yellow-400"/> Pending Appeals ({disputes.filter(d => d.status === 'pending').length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disputes.filter(d => d.status === 'pending').map((d: any) => (
            <div key={d.id} className="bg-surface border border-border-subtle p-5 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 bg-bg-primary rounded-bl-xl border-b border-l border-border-subtle text-xs text-text-muted font-bold uppercase tracking-widest">Under Review</div>
              
              <h3 className="text-lg text-white font-bold mb-1">{d.users?.name}</h3>
              <p className="text-purple-accent text-sm font-medium mb-4">{d.users?.matric_number}</p>
              
              <div className="bg-bg-primary p-3 rounded-lg border border-border-subtle mb-4">
                <span className="text-xs text-text-muted uppercase tracking-widest block mb-1">Reason for appeal</span>
                <p className="text-white text-sm">{d.reason}</p>
              </div>

              {d.evidence_url && (
                <button className="flex items-center gap-2 text-sm text-purple-accent bg-purple-primary/10 px-3 py-2 rounded-lg mb-6 hover:bg-purple-primary/20 transition-colors">
                  <FileText size={16}/> View Attached Evidence
                </button>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(d.id, 'approve')} 
                  disabled={!!loadingId} 
                  className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold py-2 rounded-lg border border-green-500/30 flex justify-center items-center gap-2 transition-colors"
                >
                   {loadingId === d.id ? <BrandLoader size={18} /> : <><Check size={18}/> Approve</>}
                </button>
                <button 
                  onClick={() => handleAction(d.id, 'reject')} 
                  disabled={!!loadingId} 
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded-lg border border-red-500/30 flex justify-center items-center gap-2 transition-colors"
                >
                   {loadingId === d.id ? <BrandLoader size={18} /> : <><X size={18}/> Reject</>}
                </button>
              </div>
            </div>
          ))}

          {disputes.filter(d => d.status === 'pending').length === 0 && (
            <p className="text-text-muted col-span-full py-8 text-center bg-surface border border-border-dashed border-border-subtle rounded-xl">No pending appeals.</p>
          )}
        </div>
      </div>
    </div>
  )
}
