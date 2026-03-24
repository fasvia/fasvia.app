'use client'

import { useState } from 'react'
import { Search, CheckCircle, UserX } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'
import { supabase } from '@/lib/supabase'

export default function ManualMarker({ sessionId, schoolId }: { sessionId: string, schoolId: string }) {
  const [matric, setMatric] = useState('')
  const [loading, setLoading] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setStudent(null)
    setSuccess('')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, matric_number, level, profile_photo_url')
        .eq('school_id', schoolId)
        .eq('matric_number', matric.toUpperCase())
        .single()

      if (error || !data) throw new Error('Student not found.')
      setStudent(data)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPresent = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      // Direct insertion. In real app might go through an API route so secrets remain safe, but for prototype anon key acts as authenticated if RLS is set, or we can use API.
      // Since we don't have RLS set up firmly, we'll hit Supabase directly or ideally an API.
      // Let's use the DB directly for speed, mimicking authorized lecturer token.
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          school_id: schoolId,
          session_id: sessionId,
          student_id: student.id,
          verification_method: 'manual',
          is_manual: true,
          status: 'verified'
        })

      if (error) {
         if (error.code === '23505') throw new Error('Student is already marked present.')
         throw error
      }
      
      setSuccess(`${student.name} marked present manually.`)
      setStudent(null)
      setMatric('')
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xl">
      <h3 className="text-xl text-white font-bold mb-4">Manual Override</h3>
      <p className="text-text-muted text-sm mb-6">Search matric number and verify the student's face visually before marking.</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Enter Matric No." 
          value={matric} 
          onChange={e => setMatric(e.target.value)}
          className="flex-1 bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white focus:border-purple-accent uppercase outline-none" 
        />
        <button type="submit" disabled={loading || !matric} className="bg-bg-primary hover:bg-purple-primary/20 text-text-muted hover:text-white px-4 rounded-xl border border-border-subtle transition-all">
           {loading && !student ? <BrandLoader size={20} /> : <Search size={20} />}
        </button>
      </form>

      {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}
      {success && <p className="text-green-400 text-sm mb-4 p-3 bg-green-500/10 rounded-lg">{success}</p>}

      {student && (
        <div className="animate-in fade-in duration-300 border border-purple-primary/30 p-4 rounded-xl bg-bg-primary text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-border-subtle overflow-hidden border-2 border-purple-accent mb-3">
             {student.profile_photo_url ? (
               <img src={student.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-text-muted"><UserX size={32}/></div>
             )}
          </div>
          <h4 className="text-white font-bold text-lg">{student.name}</h4>
          <p className="text-purple-accent font-medium text-sm mb-1">{student.matric_number}</p>
          <p className="text-text-muted text-xs mb-4">{student.level}</p>

          <button onClick={handleMarkPresent} disabled={loading} className="w-full bg-purple-primary hover:bg-purple-accent text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            {loading ? <BrandLoader size={18} /> : <><CheckCircle size={18}/> Mark Present</>}
          </button>
        </div>
      )}
    </div>
  )
}
