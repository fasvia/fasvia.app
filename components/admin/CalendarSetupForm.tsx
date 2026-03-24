'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'

const sessionSchema = z.object({
  name: z.string().min(4, 'E.g. 2024/2025'),
  first_semester_start: z.string().min(1, 'Required'),
  first_semester_end: z.string().min(1, 'Required'),
  second_semester_start: z.string().min(1, 'Required'),
  second_semester_end: z.string().min(1, 'Required'),
  is_active: z.boolean().default(true)
})

type SessionFormValues = z.infer<typeof sessionSchema>

export default function CalendarSetupForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { is_active: true }
  })

  async function onSubmit(data: SessionFormValues) {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/academic-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          first_semester_start: new Date(data.first_semester_start).toISOString(),
          first_semester_end: new Date(data.first_semester_end).toISOString(),
          second_semester_start: new Date(data.second_semester_start).toISOString(),
          second_semester_end: new Date(data.second_semester_end).toISOString(),
        })
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to sync calendar')
      }
      
      onSuccess?.()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface p-8 rounded-2xl border border-purple-primary/20 w-full max-w-2xl mx-auto shadow-2xl">
      <h2 className="text-2xl text-white mb-2 tracking-tight">Set Academic Calendar</h2>
      <p className="text-text-muted mb-8 text-sm">Configure the semester bounds for the entire university. Automated attendance uses these dates to control features.</p>
      
      {errorMsg && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm text-text-muted mb-2 font-medium">Session Name</label>
          <input 
            {...register('name')} 
            placeholder="2024/2025" 
            className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-accent transition-colors" 
          />
          {errors.name && <p className="text-red-400 text-xs mt-2">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-bg-primary/50 border border-border-subtle rounded-xl space-y-4">
            <h3 className="text-purple-accent font-semibold text-sm tracking-wider uppercase">First Semester</h3>
            <div>
              <label className="block text-xs text-text-muted mb-1">Start Date</label>
              <input type="date" {...register('first_semester_start')} className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-white text-sm" />
              {errors.first_semester_start && <p className="text-red-400 text-xs mt-1">{errors.first_semester_start.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">End Date</label>
              <input type="date" {...register('first_semester_end')} className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-white text-sm" />
              {errors.first_semester_end && <p className="text-red-400 text-xs mt-1">{errors.first_semester_end.message}</p>}
            </div>
          </div>

          <div className="p-5 bg-bg-primary/50 border border-border-subtle rounded-xl space-y-4">
            <h3 className="text-purple-accent font-semibold text-sm tracking-wider uppercase">Second Semester</h3>
            <div>
              <label className="block text-xs text-text-muted mb-1">Start Date</label>
              <input type="date" {...register('second_semester_start')} className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-white text-sm" />
              {errors.second_semester_start && <p className="text-red-400 text-xs mt-1">{errors.second_semester_start.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">End Date</label>
              <input type="date" {...register('second_semester_end')} className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-white text-sm" />
              {errors.second_semester_end && <p className="text-red-400 text-xs mt-1">{errors.second_semester_end.message}</p>}
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          type="submit" 
          className="w-full mt-8 bg-purple-primary hover:bg-purple-accent disabled:opacity-50 text-white font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2"
        >
          {loading ? 'Saving Calendar...' : 'Confirm Academic Calendar'}
        </button>
      </form>
    </div>
  )
}
