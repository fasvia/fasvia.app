'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

interface Prefs {
  course_updates: boolean;
  attendance_alerts: boolean;
}

export default function NotificationPreferences({ initialPrefs, userId }: { initialPrefs: Prefs, userId: string }) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const togglePref = async (key: keyof Prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] }
    setPrefs(newPrefs)
    setLoading(true)
    
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      })
      
      if (!res.ok) throw new Error('Failed to mutate configuration.')
      router.refresh()
    } catch (error) {
      console.error(error)
      // Revert optimism on error
      setPrefs(prefs)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface p-8 rounded-2xl border border-border-subtle shadow-xl">
       <h3 className="text-xl text-white font-bold flex items-center gap-2 mb-6"><Bell size={20} className="text-purple-accent"/> Notifications</h3>
       <div className="space-y-4">
         
         <div className="flex items-center justify-between p-5 bg-bg-primary rounded-xl border border-border-subtle/50">
            <div>
              <h4 className="font-bold text-white text-sm">Enrollment & Course Updates</h4>
              <p className="text-xs text-text-muted mt-1">Get automatically notified when materials or sessions strictly manipulate the active timetable.</p>
            </div>
            
            <button 
              disabled={loading}
              onClick={() => togglePref('course_updates')}
              className={`w-12 h-6 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-colors ${prefs.course_updates ? 'bg-purple-primary' : 'bg-surface border border-border-subtle'}`}
            >
              <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${prefs.course_updates ? 'bg-white right-1' : 'bg-text-muted left-1'}`}></div>
            </button>
         </div>

         <div className="flex items-center justify-between p-5 bg-bg-primary rounded-xl border border-border-subtle/50">
            <div>
              <h4 className="font-bold text-white text-sm">Attendance Flags System</h4>
              <p className="text-xs text-text-muted mt-1">Subscribes directly to Geofence alerts and immediate facial scanning threshold disputes.</p>
            </div>
            
            <button 
              disabled={loading}
              onClick={() => togglePref('attendance_alerts')}
              className={`w-12 h-6 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-colors ${prefs.attendance_alerts ? 'bg-purple-primary' : 'bg-surface border border-border-subtle'}`}
            >
              <div className={`w-4 h-4 rounded-full absolute top-1 transition-all ${prefs.attendance_alerts ? 'bg-white right-1' : 'bg-text-muted left-1'}`}></div>
            </button>
         </div>

       </div>
    </div>
  )
}
