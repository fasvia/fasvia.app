'use client'
import { useState, useEffect } from 'react'
import { Download, WifiOff } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'
import AttendanceMarker from './AttendanceMarker'
import { supabase } from '@/lib/supabase'
import { generateAttendancePDF } from '@/lib/export-utils'
import { getPendingRecords, isExpired, markAsSynced, cleanupSyncedRecords } from '@/lib/offline'

export default function StudentDashboardClient({ studentId, activeAcademicSessionId, initialActiveSessions }: any) {
  const [fetching, setFetching] = useState(false)
  const [studentName, setStudentName] = useState('Student')
  const [schoolName, setSchoolName] = useState('University')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
       setIsOnline(navigator.onLine)
       const handleOnline = () => setIsOnline(true)
       const handleOffline = () => setIsOnline(false)
       window.addEventListener('online', handleOnline)
       window.addEventListener('offline', handleOffline)
       return () => {
         window.removeEventListener('online', handleOnline)
         window.removeEventListener('offline', handleOffline)
       }
    }
  }, [])

  useEffect(() => {
     const fetchMeta = async () => {
        const { data: user } = await supabase.from('users').select('name, school_id').eq('id', studentId).single()
        if (user) {
           setStudentName(user.name || 'Student')
           const { data: sch } = await supabase.from('schools').select('name').eq('id', user.school_id || '').single()
           if (sch) setSchoolName(sch.name || 'University')
        }
     }
     fetchMeta()

     // Realtime Listener for Instant Dispute Notifications
     if (!studentId) return;
     const channel = supabase.channel('student-disputes')
       .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'disputes',
          filter: `student_id=eq.${studentId}`
       }, (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'resolved' || newStatus === 'rejected') {
             alert(`Notice: Your attendance appeal has been ${newStatus.toUpperCase()}! Please check your records.`);
          }
       })
       .subscribe()

     return () => {
        supabase.removeChannel(channel);
     }
  }, [studentId])

  const downloadPersonalReport = async () => {
     setFetching(true)
     try {
        // 1. Get all registered courses
        const { data: registrations } = await supabase
           .from('student_courses')
           .select('course_id, courses(code, title, department_id, departments(name))')
           .eq('student_id', studentId)
           .eq('academic_session_id', activeAcademicSessionId)

        if (!registrations) throw new Error('No registered courses found.')

        // 2. For each course, calculate attendance
        const reportData = await Promise.all(registrations.map(async (reg: any) => {
           // Total sessions held for this course
           const { count: totalSessions } = await supabase
              .from('sessions')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', reg.course_id)
              .eq('is_active', false)

           // Sessions attended by this student
           const { count: attendedCount } = await supabase
              .from('attendance_records')
              .select('*', { count: 'exact', head: true })
              .eq('student_id', studentId)
              .eq('session_id', reg.course_id) // Wait, this is wrong. Need to join attendance_records with sessions
           
           const { data: sessions } = await supabase
              .from('sessions')
              .select('id')
              .eq('course_id', reg.course_id)
              .eq('academic_session_id', activeAcademicSessionId)
              .eq('is_active', false)

           const sessionIds = sessions?.map(s => s.id) || []
           let realAttended = 0
           if (sessionIds.length > 0) {
              const { count } = await supabase
                 .from('attendance_records')
                 .select('*', { count: 'exact', head: true })
                 .eq('student_id', studentId)
                 .in('session_id', sessionIds)
              realAttended = count || 0
           }

           const total = totalSessions || 0
           const attended = realAttended || 0
           const percentage = total > 0 ? Math.round((attended / total) * 100) : 100

           return {
              code: reg.courses.code,
              title: reg.courses.title,
              attended,
              total,
              percentage
           }
        }))

        // Get HOD/Lecturer names for a generic student report is tricky, 
        // usually student reports are simpler or use Dean's name.
        // For now, I'll use placeholders or the first course's HOD.
        
        await generateAttendancePDF(reportData, {
           type: 'student',
           schoolName,
           courseCode: 'ALL',
           courseTitle: 'Personal Attendance Summary',
           lecturerName: 'N/A',
           hodName: 'Dean of Students',
           deptName: 'Student Affairs',
           studentName
        })
     } catch(e: any) {
        alert(e.message)
     } finally {
        setFetching(false)
     }
  }

  // Step 4: Background Sync Engine
  useEffect(() => {
    async function syncOfflineRecords() {
      if (typeof navigator === 'undefined' || !navigator.onLine) return
      const pending = await getPendingRecords()
      if (!pending || pending.length === 0) return
      
      console.log(`[Fasvia] Syncing ${pending.length} offline records...`)
      for (const record of pending) {
        if (isExpired(record.marked_at)) {
          await markAsSynced(record.id)
          continue
        }
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...record, marked_offline: true, synced_at: new Date().toISOString() })
          })
          if (res.ok) await markAsSynced(record.id)
        } catch (err) { console.error('Sync failed:', err) }
      }
      await cleanupSyncedRecords()
    }

    syncOfflineRecords()
    const interval = setInterval(syncOfflineRecords, 5 * 60 * 1000)
    window.addEventListener('online', syncOfflineRecords)
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', syncOfflineRecords)
    }
  }, [])

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
         <div>
            <h1 className="text-3xl text-white font-bold mb-2">My Attendance</h1>
            <p className="text-text-muted">Mark your presence and monitor your global standing.</p>
         </div>
         <button 
           onClick={downloadPersonalReport}
           disabled={fetching}
           className="bg-surface hover:bg-border-subtle text-white p-3 rounded-2xl border border-border-subtle transition-all shadow-lg flex items-center gap-2"
           title="Download Full Attendance Report"
         >
            {fetching ? <BrandLoader size={24} /> : <Download size={24} />}
            </button>
      </div>

      {!isOnline && (
        <div className="offline-banner">
          <WifiOff size={18} />
          <span>You are offline — Attendance will sync automatically when you reconnect.</span>
        </div>
      )}

      {(!initialActiveSessions || initialActiveSessions.length === 0) ? (
        <div className="text-center py-20 bg-surface border border-border-subtle rounded-3xl animate-in fade-in">
           <div className="w-16 h-16 bg-bg-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-border-subtle">
             <span className="text-purple-primary text-2xl">💤</span>
           </div>
           <h2 className="text-xl text-white font-medium mb-2">No Active Classes</h2>
           <p className="text-text-muted text-sm px-8">There are no ongoing attendance sessions for any of your registered courses right now.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-6">
          {initialActiveSessions.map((session: any) => (
             <AttendanceMarker key={session.id} session={session} studentId={studentId as string} />
          ))}
        </div>
      )}
    </div>
  )
}
