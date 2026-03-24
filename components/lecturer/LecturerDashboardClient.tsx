'use client'
import { useState, useEffect } from 'react'
import { Clock, Play, Download, Search, CheckCircle } from 'lucide-react'
import SessionStartWizard from './SessionStartWizard'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateAttendancePDF } from '@/lib/export-utils'
import BrandLoader from '@/components/ui/BrandLoader'

export default function LecturerDashboardClient({ allocatedCourses, activeSessions, pastSessions, lecturerId, activeAcademicSessionId }: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseFilterParam = searchParams.get('course')

  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || (courseFilterParam ? 'history' : (activeSessions.length > 0 ? 'live' : 'today')))
  const [liveAttendance, setLiveAttendance] = useState<any[]>([])
  
  const [startWizardOpen, setStartWizardOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const [matricInput, setMatricInput] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)
  const [sessionAttendance, setSessionAttendance] = useState<Record<string, any[]>>({})
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [hodName, setHodName] = useState('Head of Department')
  const [deptName, setDeptName] = useState('Department')
  const [lecturerName, setLecturerName] = useState('Course Lecturer')
  const [schoolName, setSchoolName] = useState('University')

  // 1. Fetch metadata for signatures and school info
  useEffect(() => {
     const fetchMeta = async () => {
        try {
           // Get Lecturer Name
           const { data: lec } = await supabase.from('users').select('name, school_id, departments(name, id)').eq('id', lecturerId).single()
           if (lec) {
              setLecturerName(lec.name)
              setDeptName(lec.departments?.name || 'Department')
              
              // Get HOD Name
              const { data: hod } = await supabase
                 .from('users')
                 .select('name')
                 .eq('role', 'dept_admin')
                 .eq('department_id', lec.departments?.id)
                 .maybeSingle()
              if (hod) setHodName(hod.name)

              // Get School Name
              const { data: sch } = await supabase.from('schools').select('name').eq('id', lec.school_id).single()
              if (sch) setSchoolName(sch.name)
           }
        } catch(e) {}
     }
     fetchMeta()

     if (courseFilterParam) {
       setActiveTab('history')
     }
  }, [courseFilterParam, lecturerId])

  const displayedHistory = courseFilterParam 
    ? pastSessions.filter((ps: any) => ps.course_id === courseFilterParam)
    : pastSessions

  // 2. Real-time check-in using Supabase Realtime
  useEffect(() => {
    if (activeTab === 'live' && activeSessions.length > 0) {
      const sessionId = activeSessions[0].id
      
      // Initial fetch
      const fetchLogs = async () => {
         try {
           const res = await fetch(`/api/sessions/live?session_id=${sessionId}`)
           if (res.ok) {
             const logData = await res.json()
             setLiveAttendance(logData.attendance || [])
           }
         } catch(e) {}
      }
      fetchLogs()

      // Realtime subscription
      const channel = supabase
        .channel(`attendance:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attendance_records',
            filter: `session_id=eq.${sessionId}`
          },
          async (payload) => {
             // New record inserted!
             const newRecord = payload.new as any
             // Fetch student name/matric since payload doesn't have it
             const { data: userData } = await supabase
                .from('users')
                .select('name, matric_number')
                .eq('id', newRecord.student_id)
                .single()
             
             const fullRecord = {
                ...newRecord,
                users: userData
             }
             
             setLiveAttendance(prev => [fullRecord, ...prev])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [activeTab, activeSessions])

  // 3. Exact Timer tracking Elapsed explicitly natively
  useEffect(() => {
     if(activeSessions[0]) {
       const interval = setInterval(() => {
         const now = Date.now()
         const start = new Date(activeSessions[0].start_time).getTime()
         setElapsed(now - start)
       }, 500)
       return () => clearInterval(interval)
     }
  }, [activeSessions])

  // 4. Auto-ender triggering automatically when duration triggers expiration
  useEffect(() => {
     if(activeSessions[0] && elapsed > 0) {
        const durationLimitMs = activeSessions[0].duration_minutes * 60000;
        if (elapsed >= durationLimitMs + 5000) {  // 5 seconds grace auto-end
            handleEndSession(true)
        }
     }
  }, [elapsed, activeSessions])

  const formatElasped = () => {
     if (!activeSessions[0]) return '00:00:00 Remaining'
     const durationLimitMs = activeSessions[0].duration_minutes * 60000;
     const remainingMs = durationLimitMs - elapsed;
     
     if (remainingMs <= 0) return '00:00:00 Remaining'

     const totalSec = Math.floor(remainingMs / 1000)
     const hrs = Math.floor(totalSec / 3600).toString().padStart(2, '0')
     const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0')
     const secs = (totalSec % 60).toString().padStart(2, '0')
     return `${hrs}:${mins}:${secs} Remaining`
  }

  const handleManualMark = async () => {
     if(!matricInput) return
     setManualLoading(true)
     setErrorMsg('')
     try {
       const res = await fetch('/api/sessions/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'manual_mark', session_id: activeSessions[0].id, matric_number: matricInput })
       })
       const data = await res.json()
       if (!res.ok) throw new Error(data.error)
       setMatricInput('')
     } catch(e: any) {
       setErrorMsg(e.message)
     } finally {
       setManualLoading(false)
     }
  }

  // 5. Force UI transition completely avoiding lockups properly natively
  const handleEndSession = async (auto = false) => {
     if(!auto && !confirm('End this session and compile final bounds securely?')) return
     try {
       await fetch('/api/sessions/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end_session', session_id: activeSessions[0].id })
       })
       setActiveTab('history') 
       router.push('/lecturer?tab=history') // Explicitly persist the tab state through navigation
       router.refresh()
     } catch(e) {}
  }

  const handleExpandSession = async (sessionId: string) => {
     if (expandedSessionId === sessionId) {
       setExpandedSessionId(null)
       return
     }
     setExpandedSessionId(sessionId)
     if (!sessionAttendance[sessionId]) {
        setFetchingDetails(true)
        try {
           const res = await fetch(`/api/sessions/live?session_id=${sessionId}`)
           if (res.ok) {
             const data = await res.json()
             setSessionAttendance(prev => ({ ...prev, [sessionId]: data.attendance || [] }))
           }
        } catch(e) {} finally {
           setFetchingDetails(false)
        }
     }
  }

  const downloadCSV = (session: any, attendance: any[]) => {
     const headers = ['Student Name', 'Matric Number', 'Time Marked', 'Method', 'Status']
     const rows = attendance.map(log => [
        log.users?.name,
        log.users?.matric_number,
        new Date(log.created_at).toLocaleTimeString(),
        log.verification_method,
        log.status === 'verified' ? 'Verified' : 'Flagged'
     ])
     
     const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
     const link = document.createElement("a")
     const url = URL.createObjectURL(blob)
     link.setAttribute("href", url)
     link.setAttribute("download", `Attendance_${session.courses?.code}_${new Date(session.start_time).toLocaleDateString()}.csv`)
     link.style.visibility = 'hidden'
     document.body.appendChild(link)
     link.click()
     document.body.removeChild(link)
  }

  const downloadPDF = async (session: any, attendance: any[]) => {
     await generateAttendancePDF(attendance, {
        type: 'session',
        schoolName,
        courseCode: session.courses?.code,
        courseTitle: session.courses?.title,
        dateRange: new Date(session.start_time).toLocaleDateString(),
        lecturerName,
        hodName,
        deptName,
        totalRegistered: 100, // Ideally fetch from student_courses count
        totalPresent: attendance.length,
        attendanceRate: `${Math.round((attendance.length / 100) * 100)}%`,
        sessionId: session.id
     })
  }

  const downloadFullCourseReport = async (courseId: string) => {
     setFetchingDetails(true)
     try {
        // 1. Fetch all sessions for this course
        const { data: sessions } = await supabase
           .from('sessions')
           .select('id, start_time')
           .eq('course_id', courseId)
           .eq('is_active', false)
           .eq('school_id', activeSessions[0]?.school_id || pastSessions[0]?.school_id)

        if (!sessions || sessions.length === 0) throw new Error('No completed sessions found for this course.')

        // 2. Fetch all attendance records for these sessions
        const sessionIds = sessions.map(s => s.id)
        const { data: allRecords } = await supabase
           .from('attendance_records')
           .select('student_id, session_id, users(name, matric_number)')
           .in('session_id', sessionIds)

        // 3. Fetch all registered students for this course
        const { data: registeredStudents } = await supabase
           .from('student_courses')
           .select('student_id, users(name, matric_number)')
           .eq('course_id', courseId)

        if (!registeredStudents) throw new Error('No registered students found.')

        // 4. Aggregate
        const courseData = registeredStudents.map(rs => {
           const attendedCount = allRecords?.filter(r => r.student_id === rs.student_id).length || 0
           const totalSessions = sessions.length
           const percentage = Math.round((attendedCount / totalSessions) * 100)
           return {
              name: rs.users?.name,
              matric: rs.users?.matric_number,
              attended: attendedCount,
              total: totalSessions,
              percentage,
              status: percentage >= 75 ? 'Good' : 'At Risk'
           }
        })

        const selectedCourse = allocatedCourses.find((c: any) => c.course_id === courseId)?.courses
        
        await generateAttendancePDF(courseData, {
           type: 'course',
           schoolName,
           courseCode: selectedCourse?.code,
           courseTitle: selectedCourse?.title,
           lecturerName,
           hodName,
           deptName,
           dateRange: 'Full Semester'
        })
     } catch(e: any) {
        alert(e.message)
     } finally {
        setFetchingDetails(false)
     }
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8 pb-32">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
           <h1 className="text-3xl text-white font-bold mb-2">Lecturer Portal</h1>
           <p className="text-text-muted">Manage your classes and strictly govern student physical attendance.</p>
        </div>
        
        {/* Tab Navigation natively rendering */}
        <div className="flex gap-4 border-b border-border-subtle pb-4 overflow-x-auto">
          {['today', 'live', 'history'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); if(tab !== 'history') router.push('/lecturer') }} className={`px-6 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-purple-primary text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]' : 'text-text-muted hover:text-white bg-surface'}`}>
              {tab === 'today' ? "Today's Schedule" : tab === 'live' ? 'Live Session View' : 'Session History'}
            </button>
          ))}
        </div>

        {/* Tab 1: Today's Schedule */}
        {activeTab === 'today' && !startWizardOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            {allocatedCourses.length === 0 && <p className="text-text-muted">No courses globally allocated to this internal schedule yet.</p>}
            {allocatedCourses.map((ac: any) => {
               const hasActive = activeSessions.find((s: any) => s.course_id === ac.course_id)
               return (
                 <div key={ac.course_id} className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xl hover:border-purple-primary/30 transition-all">
                    <h3 className="text-2xl text-white font-bold mb-1">{ac.courses.code}</h3>
                    <p className="text-text-muted mb-6">{ac.courses.title} • {ac.courses.units} Units</p>
                    
                    {hasActive ? (
                      <button onClick={() => setActiveTab('live')} className="w-full bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/30 font-bold py-3 rounded-xl transition-all">
                        View Active Session
                      </button>
                    ) : (
                      <button onClick={() => setStartWizardOpen(true)} className="w-full bg-purple-primary hover:bg-purple-accent text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-all">
                         <Play size={18}/> Start Attendance
                      </button>
                    )}
                 </div>
               )
            })}
          </div>
        )}

        {/* Floating Wizard Override natively caching active transitions immediately solving frozen routing */}
        {activeTab === 'today' && startWizardOpen && (
           <div className="animate-in slide-in-from-bottom-8">
             <SessionStartWizard 
               courses={allocatedCourses.map((c: any) => c.courses)} 
               lecturerId={lecturerId} 
               activeAcademicSessionId={activeAcademicSessionId} 
               onSuccess={() => {
                 setStartWizardOpen(false)
                 setActiveTab('live')
                 router.refresh()
               }}
             />
             <button onClick={() => setStartWizardOpen(false)} className="mt-4 text-text-muted hover:text-white text-sm text-center w-full">Cancel Initialization</button>
           </div>
        )}


        {/* Tab 2: Live View Engine */}
        {activeTab === 'live' && activeSessions.length === 0 && (
           <div className="text-center py-20 bg-surface rounded-2xl border border-border-subtle">
             <Clock size={48} className="text-purple-primary mx-auto mb-4 opacity-50" />
             <h2 className="text-xl font-bold text-white mb-2">No Active Pipeline Linked</h2>
             <p className="text-text-muted">Launch a course session from Today's Schedule to implicitly monitor global entry points.</p>
           </div>
        )}

        {activeTab === 'live' && activeSessions[0] && (
           <div className="space-y-6 animate-in slide-in-from-right fade-in">
              <div className="flex flex-col md:flex-row justify-between md:items-center bg-surface p-6 rounded-2xl border border-purple-primary/30 shadow-2xl gap-4">
                 <div>
                    <span className="text-xs text-green-400 uppercase tracking-widest font-bold mb-1 block flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> ACTIVE STREAM</span>
                    <h2 className="text-3xl font-bold text-white mb-1">{activeSessions[0].courses.code} Session</h2>
                    <span className="text-purple-accent font-mono text-xl">{formatElasped()}</span>
                 </div>
                 <button onClick={() => handleEndSession(false)} className="bg-red-500/10 text-red-500 border border-red-500/30 px-8 py-4 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all">
                    End Session Natively
                 </button>
              </div>

              <div className="bg-purple-primary/5 border border-purple-primary/20 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="bg-purple-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-lg">{liveAttendance.length}</span>
                    Students Recorded Present
                 </h3>
                 <div className="flex flex-col gap-2">
                    <div className="flex bg-bg-primary border border-border-subtle rounded-xl p-1 md:w-80">
                       <input value={matricInput} onChange={e => setMatricInput(e.target.value)} placeholder="Force Manual Override (Matric Number)..." className="bg-transparent border-none text-white px-3 py-2 w-full text-sm focus:outline-none" />
                       <button disabled={manualLoading} onClick={handleManualMark} className="bg-surface hover:bg-border-subtle disabled:opacity-50 text-white p-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                         {manualLoading ? <BrandLoader size={16} /> : <Search size={16}/>}
                       </button>
                    </div>
                    {errorMsg && <p className="text-red-400 text-xs text-right pr-2">{errorMsg}</p>}
                 </div>
              </div>

              <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden">
                 {liveAttendance.length === 0 ? (
                    <div className="text-center py-12 text-text-muted text-sm">Waiting for the internal gateway pings strictly via Geofence metrics...</div>
                 ) : (
                    <div className="divide-y divide-border-subtle">
                       {liveAttendance.map((log: any) => (
                          <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-bg-primary transition-colors gap-3">
                             <div>
                                <h4 className="font-bold text-white">{log.users?.name}</h4>
                                <p className="text-text-muted text-sm flex items-center gap-2">
                                  {log.users?.matric_number} 
                                  <span className="text-[10px] bg-border-subtle px-1.5 py-0.5 rounded text-white">{new Date(log.marked_at).toLocaleTimeString()}</span>
                                </p>
                             </div>
                             <div className="flex space-x-2">
                     <span className={`text-xs px-3 py-1 rounded-full font-bold ${log.verification_method === 'MANUAL' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-400'}`}>
                        {log.verification_method}
                     </span>
                     {log.status !== 'verified' && (
                       <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500 text-black border border-amber-600">
                          FLAGGED
                       </span>
                     )}
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* Tab 3: Session History Archive */}
        {activeTab === 'history' && (
           <div className="space-y-4 animate-in fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Session History Archive</h2>
                {courseFilterParam && (
                   <button 
                     onClick={() => downloadFullCourseReport(courseFilterParam)}
                     disabled={fetchingDetails}
                     className="flex items-center gap-2 px-6 py-3 bg-purple-primary hover:bg-purple-accent text-white font-bold rounded-xl transition-all shadow-xl disabled:opacity-50"
                   >
                      <Download size={20} /> {fetchingDetails ? 'Compiling...' : 'Export Full Course Report'}
                   </button>
                )}
             </div>
             {courseFilterParam && <p className="text-purple-accent text-sm font-bold flex items-center gap-2">Filtered to explicitly isolated module context.</p>}
             {displayedHistory.length === 0 && <p className="text-text-muted">No historical parameters logged yet in standard archives.</p>}
             {displayedHistory.map((ps: any) => {
                const isExpanded = expandedSessionId === ps.id
                const attendance = sessionAttendance[ps.id] || []
                
                return (
                  <div key={ps.id} className="bg-surface rounded-2xl border border-border-subtle overflow-hidden hover:border-purple-primary/30 transition-all">
                    <div 
                      onClick={() => handleExpandSession(ps.id)}
                      className="p-5 flex flex-col md:flex-row justify-between md:items-center cursor-pointer gap-4"
                    >
                       <div>
                          <h4 className="text-xl text-white font-bold">{ps.courses.code}</h4>
                          <p className="text-text-muted text-sm">
                            {new Date(ps.start_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(ps.start_time).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                          </p>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="badge-purple font-mono">{ps.duration_minutes} Mins Duration</span>
                          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                             <Download size={20} className="text-purple-accent" />
                          </div>
                       </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 border-t border-border-subtle bg-bg-primary/50 animate-in slide-in-from-top-4 duration-300">
                         {fetchingDetails ? (
                           <div className="flex items-center justify-center py-10">
                              <BrandLoader size={32} />
                           </div>
                         ) : (
                           <div className="space-y-6">
                              <div className="flex justify-end gap-3">
                                 <button 
                                   onClick={() => downloadCSV(ps, attendance)}
                                   className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-border-subtle text-white text-sm font-bold rounded-lg transition-all border border-border-subtle"
                                 >
                                    <Download size={16} /> Download CSV
                                 </button>
                                 <button 
                                   onClick={() => downloadPDF(ps, attendance)}
                                   className="flex items-center gap-2 px-4 py-2 bg-purple-primary hover:bg-purple-accent text-white text-sm font-bold rounded-lg transition-all shadow-lg"
                                 >
                                    <Download size={16} /> Download PDF
                                 </button>
                              </div>

                              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                                 <table className="w-full text-left text-sm">
                                    <thead className="bg-surface text-text-muted uppercase tracking-wider font-bold">
                                       <tr>
                                          <th className="px-4 py-3">Student Name</th>
                                          <th className="px-4 py-3">Matric Number</th>
                                          <th className="px-4 py-3">Time</th>
                                          <th className="px-4 py-3">Method</th>
                                          <th className="px-4 py-3">Status</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-subtle">
                                       {attendance.length === 0 ? (
                                          <tr>
                                             <td colSpan={5} className="px-4 py-10 text-center text-text-muted">No attendance records found for this session.</td>
                                          </tr>
                                       ) : (
                                          attendance.map((log: any) => (
                                             <tr key={log.id} className="hover:bg-surface/50 transition-colors">
                                                <td className="px-4 py-3 text-white font-medium">{log.users?.name}</td>
                                                <td className="px-4 py-3 text-text-muted">{log.users?.matric_number}</td>
                                                <td className="px-4 py-3 text-text-muted">{new Date(log.marked_at).toLocaleTimeString()}</td>
                                                <td className="px-4 py-3">
                                                   <span className="bg-border-subtle px-2 py-0.5 rounded text-[10px] text-white uppercase font-bold">{log.verification_method}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                   <span className={`font-bold ${log.status === 'verified' ? 'text-green-400' : 'text-amber-500'}`}>
                                                      {log.status === 'verified' ? 'Verified' : 'Flagged'}
                                                   </span>
                                                </td>
                                             </tr>
                                          ))
                                       )}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                )
             })}
           </div>
        )}

       </div>
       
       {/* Global Brand Loader Overlay */}
       {fetchingDetails && !expandedSessionId && (
         <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-xl z-[9999] flex flex-col gap-4 items-center justify-center pointer-events-auto">
            <BrandLoader size={80} />
            <p className="text-white font-bold animate-pulse">Compiling Course Data...</p>
         </div>
       )}
    </div>
  )
}
