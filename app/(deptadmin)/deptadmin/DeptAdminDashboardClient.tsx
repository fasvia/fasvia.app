'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  BookOpen, 
  Users, 
  BarChart2, 
  Search, 
  Download, 
  Mail, 
  Plus, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  UserPlus,
  FileDown,
  ChevronRight,
  Filter,
  Smartphone
} from 'lucide-react'
import CourseForm from '@/components/deptadmin/CourseForm'
import CourseOCRUpload from '@/components/deptadmin/CourseOCRUpload'
import BrandLoader from '@/components/ui/BrandLoader'
import DisputeManager from '@/components/deptadmin/DisputeManager'
import { generateAttendancePDF } from '@/lib/export-utils'

export default function DeptAdminDashboardClient({ 
  initialCourses, 
  initialLecturers, 
  initialStudents,
  initialDisputes,
  academicSessions,
  departmentId, 
  departmentPrefixes 
}: any) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'courses'
  const [activeTab, setActiveTab] = useState(tab)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [pendingLecturers, setPendingLecturers] = useState<any[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newLecturer, setNewLecturer] = useState({ name: '', email: '', staff_id: '', academic_title: 'Mr.' })
  const [createdLecturer, setCreatedLecturer] = useState<{name: string, password?: string} | null>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [allocatingLecturer, setAllocatingLecturer] = useState<any | null>(null)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [savingAllocation, setSavingAllocation] = useState(false)
  const [navigating, setNavigating] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)

  // Records Filtering
  const [filterSession, setFilterSession] = useState(academicSessions?.[0]?.id || '')
  const [filterSemester, setFilterSemester] = useState('first')

  useEffect(() => {
    // Show spinner briefly for "premium feel" on sidebar navigation
    setNavigating(true)
    const timer = setTimeout(() => setNavigating(false), 500)

    setActiveTab(tab)
    if (tab === 'lecturers') fetchPending()

    return () => clearTimeout(timer)
  }, [tab])

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/deptadmin/lecturers/pending')
      const data = await res.json()
      setPendingLecturers(data.lecturers || [])
    } catch {}
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === initialCourses?.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(initialCourses?.map((c: any) => c.id) || [])
    }
  }

  const handleApprove = async (id: string) => {
    setApproving(id)
    try {
      const res = await fetch('/api/deptadmin/lecturers/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' })
      })
      if (!res.ok) throw new Error()
      fetchPending()
      router.refresh()
    } catch {
      alert('Approval failed')
    } finally {
      setApproving(null)
    }
  }

  const handleAddLecturer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/deptadmin/lecturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLecturer, department_id: departmentId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setCreatedLecturer({ name: data.lecturer.name, password: data.temp_password })
      setIsAddModalOpen(false)
      setNewLecturer({ name: '', email: '', staff_id: '', academic_title: 'Mr.' })
      router.refresh()
    } catch {
      alert('Failed to add lecturer')
    }
  }

  const handleDeleteLecturer = async (id: string) => {
    if (!confirm('Are you sure you want to remove this lecturer? All their course allocations will be cleared.')) return
    try {
      const res = await fetch(`/api/deptadmin/lecturers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert('Failed to delete lecturer')
    }
  }

  const handleOpenAllocate = (lec: any) => {
    setAllocatingLecturer(lec)
    const currentCourses = initialCourses.filter((c: any) => c.lecturer_id === lec.id).map((c: any) => c.id)
    setSelectedCourseIds(currentCourses)
  }

  const handleAllocateCourses = async () => {
    setSavingAllocation(true)
    try {
      const res = await fetch('/api/deptadmin/lecturers/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecturerId: allocatingLecturer.id,
          courseIds: selectedCourseIds
        })
      })
      if (!res.ok) throw new Error()
      setAllocatingLecturer(null)
      router.refresh()
    } catch {
      alert('Failed to allocate courses')
    } finally {
      setSavingAllocation(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} courses?`)) return
    
    setDeleting(true)
    try {
      const res = await fetch('/api/deptadmin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })

      if (!res.ok) throw new Error('Failed to delete courses')
      
      setSelectedIds([])
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const renderCourses = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        <div className="lg:col-span-5">
          <CourseOCRUpload departmentId={departmentId} onSuccess={() => router.refresh()} />
        </div>
        <div className="lg:col-span-7">
          <CourseForm departmentPrefixes={departmentPrefixes} departmentId={departmentId} onSuccess={() => router.refresh()} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-white font-medium flex items-center gap-3">
          <BookOpen size={20} className="text-purple-accent"/> 
          Active Departmental Curriculum ({initialCourses?.length || 0})
        </h2>
        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            disabled={deleting}
            className="bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          >
            {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
          </button>
        )}
      </div>
      
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-bg-primary text-text-muted text-xs uppercase tracking-widest border-b border-border-subtle">
            <tr>
              <th className="p-5 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === initialCourses?.length && initialCourses?.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border-subtle bg-bg-primary text-purple-primary focus:ring-purple-accent"
                />
              </th>
              <th className="p-5 font-semibold">Code</th>
              <th className="p-5 font-semibold">Title</th>
              <th className="p-5 font-semibold">Level</th>
              <th className="p-5 font-semibold">Semester</th>
              <th className="p-5 font-semibold text-center">Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {initialCourses?.map((c: any) => (
              <tr key={c.id} className={`hover:bg-bg-primary/50 transition-colors ${selectedIds.includes(c.id) ? 'bg-purple-primary/10' : ''}`}>
                <td className="p-5">
                   <input 
                    type="checkbox" 
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="w-4 h-4 rounded border-border-subtle bg-bg-primary text-purple-primary focus:ring-purple-accent"
                  />
                </td>
                <td className="p-5 text-purple-accent font-bold tracking-wider">{c.code}</td>
                <td className="p-5 text-white">{c.title}</td>
                <td className="p-5 text-text-muted"><span className="px-2 py-1 bg-bg-primary rounded-md border border-border-subtle text-xs">{c.target_level}</span></td>
                <td className="p-5 text-text-muted capitalize">{c.semester}</td>
                <td className="p-5 text-white text-center font-medium">{c.units}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderLecturers = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="text-2xl text-white font-bold">Faculty Management</h2>
            <p className="text-text-muted">Manage departmental lecturers and course allocations.</p>
         </div>
         <button 
           onClick={() => setIsAddModalOpen(true)}
           className="bg-purple-primary hover:bg-purple-accent text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl"
         >
            <UserPlus size={20}/> Add New Lecturer
         </button>
      </div>

      {pendingLecturers.length > 0 && (
        <div className="mb-12">
          <h3 className="text-lg text-purple-accent font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-accent rounded-full animate-pulse" />
            Pending Approvals ({pendingLecturers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingLecturers.map((lec: any) => (
              <div key={lec.id} className="bg-purple-primary/5 border border-purple-primary/20 p-6 rounded-2xl">
                <h3 className="text-white font-bold">{lec.academic_title ? `${lec.academic_title} ` : ''}{lec.name}</h3>
                 <p className="text-text-muted text-sm mb-4">{lec.email}</p>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(lec.id)}
                      disabled={approving === lec.id}
                      className="flex-1 bg-purple-primary text-white py-2 rounded-lg font-bold text-sm hover:bg-purple-accent transition-all"
                    >
                      {approving === lec.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button className="px-4 py-2 border border-border-subtle text-text-muted rounded-lg text-sm hover:bg-red-500/10 hover:text-red-400 transition-all">Reject</button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-lg text-white font-bold mb-4">Active Faculty</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {initialLecturers?.map((lec: any) => (
            <div key={lec.id} className="bg-surface border border-border-subtle p-6 rounded-2xl hover:border-purple-primary/30 transition-all group">
               <div className="w-12 h-12 bg-purple-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-primary transition-colors">
                  <Users size={24} className="text-purple-accent group-hover:text-white" />
               </div>
               <h3 className="text-lg text-white font-bold mb-1">
                 {lec.academic_title ? `${lec.academic_title} ` : ''}{lec.name}
               </h3>
               <p className="text-text-muted text-sm mb-4 flex items-center gap-2 italic"><Mail size={14}/> {lec.email}</p>
               
               <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => handleOpenAllocate(lec)}
                    className="flex-1 bg-bg-primary border border-border-subtle py-2 rounded-lg text-xs font-bold text-white hover:border-purple-accent transition-all flex items-center justify-center gap-1"
                  >
                    <Plus size={14}/> Allocate
                  </button>
                  <button 
                    onClick={() => handleDeleteLecturer(lec.id)}
                    className="px-3 py-2 border border-border-subtle text-text-muted rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-xs"
                  >
                    <Trash2 size={14}/>
                  </button>
               </div>

               <div className="border-t border-border-subtle pt-4">
                  <span className="text-xs text-text-muted uppercase tracking-widest block mb-2 font-bold">Allocated Modules</span>
                  <div className="flex flex-wrap gap-2">
                     {initialCourses?.filter((c: any) => c.lecturer_id === lec.id).length > 0 ? 
                       initialCourses.filter((c: any) => c.lecturer_id === lec.id).map((c: any) => (
                        <span key={c.id} className="bg-bg-primary border border-border-subtle px-2 py-1 rounded text-[10px] text-white font-bold">{c.code}</span>
                      )) : <span className="text-xs text-red-400/60 font-medium">No courses assigned</span>}
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border-subtle p-6 rounded-2xl shadow-lg">
             <span className="text-text-muted text-xs uppercase tracking-widest font-bold">Total Registered Students</span>
             <h3 className="text-4xl text-white font-bold mt-2">1,248</h3>
          </div>
          <div className="bg-surface border border-border-subtle p-6 rounded-2xl shadow-lg">
             <span className="text-text-muted text-xs uppercase tracking-widest font-bold">Avg. Attendance Rate</span>
             <h3 className="text-4xl text-green-400 font-bold mt-2">82.4%</h3>
          </div>
       </div>

       <div className="bg-surface border border-border-subtle rounded-2xl p-8">
          <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-3"><BarChart2 className="text-purple-accent"/> Departmental Insights</h3>
          <div className="space-y-6">
             {['ZLY101', 'ZLY201', 'ZLY301'].map(course => (
                <div key={course}>
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold">{course} - Performance Index</span>
                      <span className="text-purple-accent font-mono">78%</span>
                   </div>
                   <div className="w-full bg-bg-primary rounded-full h-3 border border-border-subtle overflow-hidden">
                      <div className="bg-purple-primary h-full rounded-full w-[78%]"></div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  )

  const renderFraud = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
       <DisputeManager disputes={initialDisputes} />
    </div>
  )

  const renderRecords = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
       <div className="bg-surface border border-border-subtle p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <FileDown size={120} className="text-purple-accent" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-bold text-white mb-2 italic">Faculty Records & Historical Downloads</h2>
              <p className="text-text-muted mb-8">Export end-of-semester attendance reports and exam eligibility lists. Choose a session and semester to begin filtering.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <div className="space-y-2">
                    <label className="text-xs text-text-muted uppercase tracking-widest font-bold">Academic Session (Year)</label>
                    <div className="relative">
                       <select 
                         value={filterSession} 
                         onChange={e => setFilterSession(e.target.value)}
                         className="w-full bg-bg-primary border border-border-subtle p-4 rounded-xl text-white font-bold appearance-none focus:border-purple-accent outline-none"
                       >
                          {academicSessions.map((s: any) => (
                             <option key={s.id} value={s.id}>{s.name} {s.is_active ? '(Current)' : ''}</option>
                          ))}
                       </select>
                       <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-text-muted pointer-events-none" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs text-text-muted uppercase tracking-widest font-bold">Semester</label>
                    <div className="flex bg-bg-primary p-1 rounded-xl border border-border-subtle h-[58px]">
                       <button onClick={() => setFilterSemester('first')} className={`flex-1 rounded-lg font-bold text-sm transition-all ${filterSemester === 'first' ? 'bg-purple-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>First</button>
                       <button onClick={() => setFilterSemester('second')} className={`flex-1 rounded-lg font-bold text-sm transition-all ${filterSemester === 'second' ? 'bg-purple-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Second</button>
                    </div>
                 </div>
              </div>
          </div>
       </div>

       <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-border-subtle bg-bg-primary/30 flex justify-between items-center">
             <h3 className="text-white font-bold flex items-center gap-2"><Filter size={18} className="text-purple-accent" /> Results for {academicSessions.find((s: any) => s.id === filterSession)?.name} - {filterSemester} Semester</h3>
             <span className="text-xs text-text-muted font-mono uppercase">Showing {initialCourses.filter((c: any) => c.semester === filterSemester).length} Modules</span>
          </div>
          
          <div className="divide-y divide-border-subtle">
             {initialCourses.filter((c: any) => c.semester === filterSemester).map((c: any) => (
                <div key={c.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-bg-primary/20 transition-all gap-6">
                   <div className="flex gap-6 items-center flex-1">
                      <div className="w-12 h-12 bg-purple-primary/10 rounded-xl flex items-center justify-center group-hover:bg-purple-primary transition-all">
                         <BookOpen size={24} className="text-purple-accent" />
                      </div>
                      <div>
                         <h4 className="text-white font-bold text-lg">{c.code}</h4>
                         <p className="text-sm text-text-muted">{c.title}</p>
                      </div>
                   </div>
                   
                   <div className="flex gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => {
                          const rows = [
                            ['Matric Number', 'Name', 'Total Classes', 'Attended', 'Percentage', 'Status', 'Eligibility'],
                            ['20/52HA033', 'Ayomide Johnson', '12', '10', '83%', 'In Good Standing', 'Eligible'],
                            ['19/52HA045', 'Chukwuemeka Okoro', '12', '5', '41%', 'At Risk (Ban Recommended)', 'Not Eligible']
                          ]
                          const csvContent = rows.map(e => e.join(",")).join("\n")
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                          const link = document.createElement("a")
                          link.setAttribute("href", URL.createObjectURL(blob))
                          link.setAttribute("download", `Fasvia_Eligibility_${c.code}.csv`)
                          link.click()
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-bg-primary border border-border-subtle hover:border-text-muted text-white px-5 py-3 rounded-xl font-bold text-xs transition-all"
                      >
                         <FileDown size={14} /> CSV
                      </button>
                      <button 
                         onClick={() => generateAttendancePDF([
                           { name: 'Ayomide Johnson', matric: '20/52HA033', attended: 10, total: 12, percentage: 83 },
                           { name: 'Chukwuemeka Okoro', matric: '19/52HA045', attended: 5, total: 12, percentage: 41 }
                         ], {
                            type: 'course',
                            schoolName: 'Official University Portal',
                            courseCode: c.code,
                            courseTitle: c.title,
                            lecturerName: 'Faculty Admin',
                            hodName: 'HOD',
                            deptName: 'Department',
                            dateRange: 'Semester Summary'
                         })}
                         className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-primary hover:bg-purple-accent text-white px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-lg"
                      >
                         <Download size={14} /> PDF Report
                      </button>
                   </div>
                </div>
             ))}

             {initialCourses.filter((c: any) => c.semester === filterSemester).length === 0 && (
                <div className="p-20 text-center">
                   <AlertCircle size={40} className="text-text-muted mx-auto mb-4 opacity-50" />
                   <h4 className="text-white font-bold">No modules record found</h4>
                   <p className="text-text-muted text-sm mt-1">There are no courses registered for this semester/session combination.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  )

  const handleResetDevice = async (userId: string) => {
    if (!confirm('This will allow the student to register a NEW device on their next login. Continue?')) return
    
    setResettingId(userId)
    try {
      const res = await fetch(`/api/auth/device/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      alert('Device access reset successfully. The student can now log in from a new phone.')
    } catch {
      alert('Failed to reset device access.')
    } finally {
      setResettingId(null)
    }
  }

  const renderStudents = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h2 className="text-2xl text-white font-bold">Student Management</h2>
            <p className="text-text-muted">Manage departmental students and security settings. Use "Reset Device" if a student loses their phone.</p>
         </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-bg-primary text-text-muted text-xs uppercase tracking-widest border-b border-border-subtle">
            <tr>
              <th className="p-5 font-semibold">Matric Number</th>
              <th className="p-5 font-semibold">Name</th>
              <th className="p-5 font-semibold">Level</th>
              <th className="p-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {initialStudents?.map((s: any) => (
              <tr key={s.id} className="hover:bg-bg-primary/50 transition-colors">
                <td className="p-5 text-purple-accent font-bold tracking-wider">{s.matric_number}</td>
                <td className="p-5 text-white">{s.name}</td>
                <td className="p-5 text-text-muted">
                  <span className="px-2 py-1 bg-bg-primary rounded-md border border-border-subtle text-xs whitespace-nowrap">{s.level} Level</span>
                </td>
                <td className="p-5 text-right">
                  <button 
                    onClick={() => handleResetDevice(s.id)}
                    disabled={resettingId === s.id}
                    className="group bg-purple-primary/10 border border-purple-primary/30 hover:bg-purple-primary hover:text-white text-purple-accent px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2"
                  >
                    <Smartphone size={14} className={resettingId === s.id ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'} />
                    {resettingId === s.id ? 'Resetting...' : 'Reset Device'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {(!initialStudents || initialStudents.length === 0) && (
          <div className="p-20 text-center">
             <Users size={40} className="text-text-muted mx-auto mb-4 opacity-50" />
             <h4 className="text-white font-bold">No students found</h4>
             <p className="text-text-muted text-sm mt-1">There are no students registered in your department yet.</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-8 pb-32">
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'lecturers' && renderLecturers()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'fraud' && renderFraud()}
        {activeTab === 'records' && renderRecords()}

       {/* Created Lecturer Success Modal */}
       {createdLecturer && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-green-500/30 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300 transform scale-100">
               <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={32} />
               </div>
               <h2 className="text-2xl text-white font-bold mb-2 text-center">Lecturer Added!</h2>
               <p className="text-text-muted mb-8 text-center text-sm">Provide these credentials to <b>{createdLecturer.name}</b></p>
               
               <div className="bg-bg-primary border border-border-subtle rounded-2xl p-6 mb-8">
                  <span className="text-xs text-text-muted uppercase tracking-widest font-bold block mb-2">Temporary Password</span>
                  <div className="flex items-center justify-between">
                     <code className="text-xl text-purple-accent font-mono font-bold tracking-wider">{createdLecturer.password}</code>
                     <button onClick={() => {navigator.clipboard.writeText(createdLecturer.password || ''); alert('Copied!')}} className="text-text-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-surface px-3 py-1 rounded-md border border-border-subtle">Copy</button>
                  </div>
               </div>

               <button onClick={() => setCreatedLecturer(null)} className="w-full px-6 py-4 bg-purple-primary text-white rounded-xl font-bold hover:bg-purple-accent transition-all shadow-xl">Close & Continue</button>
            </div>
         </div>
       )}

       {/* Add Lecturer Modal */}
       {isAddModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border-subtle w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
               <h2 className="text-2xl text-white font-bold mb-2">Add New Lecturer</h2>
               <p className="text-text-muted mb-8 text-sm">Create a faculty account manually.</p>
               
               <form onSubmit={handleAddLecturer} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className="text-xs text-text-muted uppercase tracking-widest font-bold mb-2 block">Title</label>
                      <select 
                        required 
                        value={newLecturer.academic_title} 
                        onChange={e => setNewLecturer({...newLecturer, academic_title: e.target.value})} 
                        className="w-full bg-bg-primary border border-border-subtle rounded-xl p-4 text-white focus:border-purple-accent outline-none appearance-none"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                        <option value="Asst. Prof.">Asst. Prof.</option>
                        <option value="Assoc. Prof.">Assoc. Prof.</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-text-muted uppercase tracking-widest font-bold mb-2 block">Full Name</label>
                      <input type="text" required value={newLecturer.name} onChange={e => setNewLecturer({...newLecturer, name: e.target.value})} className="w-full bg-bg-primary border border-border-subtle rounded-xl p-4 text-white focus:border-purple-accent outline-none" placeholder="e.g. Ojo Samuel" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-widest font-bold mb-2 block">Email Address</label>
                    <input type="email" required value={newLecturer.email} onChange={e => setNewLecturer({...newLecturer, email: e.target.value})} className="w-full bg-bg-primary border border-border-subtle rounded-xl p-4 text-white focus:border-purple-accent outline-none" placeholder="faculty@unilorin.edu.ng" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-widest font-bold mb-2 block">Staff ID</label>
                    <input type="text" required value={newLecturer.staff_id} onChange={e => setNewLecturer({...newLecturer, staff_id: e.target.value})} className="w-full bg-bg-primary border border-border-subtle rounded-xl p-4 text-white focus:border-purple-accent outline-none" placeholder="ST/2024/001" />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-6 py-3 border border-border-subtle text-white rounded-xl font-bold hover:bg-bg-primary transition-all">Cancel</button>
                    <button type="submit" className="flex-1 px-6 py-3 bg-purple-primary text-white rounded-xl font-bold hover:bg-purple-accent transition-all">Add Lecturer</button>
                  </div>
               </form>
            </div>
         </div>
       )}

       {/* Course Allocation Modal */}
       {allocatingLecturer && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border-subtle w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-2xl text-white font-bold">Allocate Modules</h2>
                    <p className="text-text-muted text-sm">Assign courses to <b>{allocatingLecturer.academic_title} {allocatingLecturer.name}</b></p>
                 </div>
                 <button onClick={() => setAllocatingLecturer(null)} className="text-text-muted hover:text-white transition-colors">✕</button>
               </div>
               
               <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 mb-8 custom-scrollbar">
                  {initialCourses.map((c: any) => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setSelectedCourseIds(prev => 
                          prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id]
                        )
                      }}
                      className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${selectedCourseIds.includes(c.id) ? 'bg-purple-primary/10 border-purple-accent' : 'bg-bg-primary border-border-subtle hover:border-text-muted'}`}
                    >
                       <div>
                          <span className="text-purple-accent font-bold text-sm block">{c.code}</span>
                          <span className="text-white text-sm font-medium">{c.title}</span>
                       </div>
                       {selectedCourseIds.includes(c.id) ? (
                         <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center">
                            <CheckCircle size={14} className="text-white" />
                         </div>
                       ) : (
                         <div className="w-6 h-6 border-2 border-border-subtle rounded-full" />
                       )
                       }
                    </div>
                  ))}
               </div>
               
               <div className="flex gap-4">
                  <button type="button" onClick={() => setAllocatingLecturer(null)} className="flex-1 px-6 py-4 border border-border-subtle text-white rounded-xl font-bold hover:bg-bg-primary transition-all">Cancel</button>
                  <button 
                    onClick={handleAllocateCourses}
                    disabled={savingAllocation}
                    className="flex-1 px-6 py-4 bg-purple-primary text-white rounded-xl font-bold hover:bg-purple-accent transition-all shadow-xl disabled:opacity-50"
                  >
                    {savingAllocation ? 'Saving...' : 'Save Allocations'}
                  </button>
               </div>
            </div>
         </div>
       )}

       {/* Global Brand Loader Overlay */}
       {(deleting || savingAllocation || approving || navigating) && (
         <div className="fixed inset-0 bg-bg-primary/80 backdrop-blur-xl z-[9999] flex items-center justify-center pointer-events-auto">
            <BrandLoader />
         </div>
       )}
    </div>
  )
}
