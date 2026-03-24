'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Route dynamically based on their tenant role 
      if (data.user.role === 'student') router.push('/student')
      else if (data.user.role === 'lecturer') router.push('/lecturer')
      else if (data.user.role === 'dept_admin') router.push('/deptadmin')
      else if (data.user.role === 'school_admin' || data.user.role === 'admin') router.push('/admin')
      else router.push('/')

    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        
        <div className="flex justify-center mb-8">
           <Image src="/fasvia-logo.png" alt="Fasvia Logo" width={80} height={80} className="object-contain" />
        </div>

        <div className="bg-surface border border-border-subtle p-8 rounded-2xl shadow-2xl">
           <h2 className="text-2xl text-white font-bold mb-2">Welcome back</h2>
           <p className="text-text-muted mb-8 text-sm">Log in to manage your smart attendance sessions.</p>

           {error && (
             <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
               <AlertCircle size={18} /> {error}
             </div>
           )}

           <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-2">Email Address</label>
                <div className="flex items-center bg-bg-primary border border-border-subtle rounded-xl focus-within:border-purple-accent overflow-hidden transition-colors">
                  <div className="pl-4 pr-3 text-text-muted flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 bg-transparent py-3 pr-4 text-white outline-none"
                    placeholder="Enter school email"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-2">Password</label>
                <div className="flex items-center bg-bg-primary border border-border-subtle rounded-xl focus-within:border-purple-accent overflow-hidden transition-colors">
                  <div className="pl-4 pr-3 text-text-muted flex items-center justify-center">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 bg-transparent py-3 text-white outline-none"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-4 text-text-muted hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-purple-primary hover:bg-purple-accent text-white font-bold py-3.5 rounded-xl mt-4 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2">
                 {loading ? <BrandLoader size={18} /> : 'Sign In'}
              </button>
           </form>

           <div className="mt-6 text-center text-sm text-text-muted">
             New student? <Link href="/register" className="text-purple-accent hover:underline font-bold">Register with OCR here</Link>
           </div>
        </div>

      </div>
    </div>
  )
}
