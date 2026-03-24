'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

export default function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPass !== confirm) {
       return setError('New passwords do not securely match.')
    }
    if (newPass.length < 6) {
       return setError('New password strictly requires at least 6 characters.')
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, newPass })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Password update failed')

      setSuccess('Your password has been successfully updated!')
      setCurrent('')
      setNewPass('')
      setConfirm('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      <div>
        <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-2">Current Password</label>
        <input 
          type="password" 
          value={current}
          onChange={e => setCurrent(e.target.value)}
          required 
          placeholder="••••••••" 
        />
      </div>

      <div>
        <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-2">New Password</label>
        <input 
          type="password" 
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          required 
          placeholder="••••••••" 
        />
      </div>

      <div>
        <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-2">Confirm New Password</label>
        <input 
          type="password" 
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required 
          placeholder="••••••••" 
        />
      </div>

      <button disabled={loading} type="submit" className="w-full sm:w-auto bg-purple-primary hover:bg-purple-accent text-white font-bold py-3.5 px-8 rounded-xl mt-2 transition-all flex items-center justify-center gap-2">
         {loading ? <BrandLoader size={18} /> : 'Update Password'}
      </button>
    </form>
  )
}
