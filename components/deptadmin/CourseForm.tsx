'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface CourseFormProps {
  departmentPrefixes: string[]
  departmentId: string
  onSuccess?: () => void
}

export default function CourseForm({ departmentPrefixes, departmentId, onSuccess }: CourseFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      prefix: departmentPrefixes[0] || 'ZOO',
      number: '',
      title: '',
      units: '3',
      semester: 'first',
      is_open: false
    }
  })

  // Watch values for the preview step
  const values = watch()
  
  const autoAssignedLevel = values.number ? `${values.number.charAt(0)}00L` : 'Unknown Level'
  const fullCode = `${values.prefix} ${values.number}`

  const onPreview = () => setStep(2)

  const onConfirm = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/deptadmin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: departmentId,
          code: fullCode,
          title: values.title,
          units: values.units,
          semester: values.semester,
          is_open: values.is_open,
          target_level: autoAssignedLevel
        })
      })

      if (!res.ok) throw new Error((await res.json()).error)
      onSuccess?.()
      setStep(1)
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="bg-surface p-6 rounded-xl border border-purple-primary/30 shadow-2xl">
        <h3 className="text-xl text-white font-medium mb-4">Confirm Course Addition</h3>
        
        <div className="p-4 bg-purple-primary/10 border border-purple-primary/30 rounded-lg mb-6">
          <p className="text-white text-lg font-medium leading-relaxed">
            You are adding <span className="text-purple-accent">{fullCode}</span> - {values.title} - <span className="text-purple-accent">{autoAssignedLevel}</span> - {values.semester === 'first' ? 'First Semester' : 'Second Semester'} - {values.is_open ? 'Open to all (GST/Borrowed)' : 'Department only'}.
          </p>
          <p className="text-text-muted mt-2 text-sm text-center font-bold tracking-widest uppercase">Confirm?</p>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setStep(1)} disabled={loading} className="w-1/3 bg-bg-primary text-text-muted hover:text-white py-3 border border-border-subtle rounded-xl transition-colors">
            Back
          </button>
          <button onClick={onConfirm} disabled={loading} className="w-2/3 bg-purple-primary hover:bg-purple-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            {loading ? 'Saving...' : 'Yes, Add Course'}
          </button>
        </div>
        {errorMsg && <p className="text-red-400 text-sm mt-4 text-center">{errorMsg}</p>}
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-xl border border-border-subtle">
      <h3 className="text-xl text-white font-medium mb-6">Guided Course Entry</h3>
      
      <form onSubmit={handleSubmit(onPreview)} className="space-y-5">
        <div className="flex gap-4">
          <div className="w-1/3">
            <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Prefix</label>
            <select {...register('prefix')} className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-accent">
              {departmentPrefixes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="w-2/3">
            <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Course Num (3 digits)</label>
            <input 
              {...register('number', { required: true, pattern: /^\d{3}$/ })} 
              placeholder="e.g. 301" 
              className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-accent" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Course Title</label>
          <input 
            {...register('title', { required: true })} 
            placeholder="e.g. Algorithms & Data Structures" 
            className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-accent" 
          />
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Units</label>
            <input 
              type="number" {...register('units', { required: true, min: 1, max: 6 })} 
              className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-accent" 
            />
          </div>
          <div className="w-1/2">
            <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Semester</label>
            <select {...register('semester')} className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-accent">
              <option value="first">First Semester</option>
              <option value="second">Second Semester</option>
              <option value="both">Both Semesters</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input 
            type="checkbox" 
            id="is_open"
            {...register('is_open')} 
            className="w-5 h-5 accent-purple-primary bg-bg-primary border-border-subtle rounded"
          />
          <label htmlFor="is_open" className="text-sm text-text-muted">Is this a borrowed/GST course open to the whole school?</label>
        </div>

        <button type="submit" className="w-full mt-4 bg-purple-primary hover:bg-purple-accent text-white font-semibold py-4 rounded-xl transition-all">
          Review &amp; Confirm
        </button>
      </form>
    </div>
  )
}
