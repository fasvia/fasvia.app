'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Key, AlertCircle } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

export default function SuperAdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push('/fasvia-hq')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
         <Image src="/fasvia-logo.png" alt="Fasvia HQ" width={800} height={800} className="object-cover blur-[10px]" />
      </div>

      <div className="w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-8">
           <Image src="/fasvia-logo.png" alt="Fasvia HQ" width={64} height={64} className="mb-4" />
           <h1 className="text-2xl text-white font-bold tracking-widest uppercase">Fasvia</h1>
           <p className="text-purple-accent text-xs tracking-[0.2em] font-bold uppercase mt-1">A Nelbion Group Venture</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#18181b] p-8 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)]">
           {error && (
             <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold p-3 rounded-xl mb-6 flex items-center gap-2 uppercase tracking-wider">
               <AlertCircle size={16} /> {error}
             </div>
           )}

           <div className="space-y-6">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em] block mb-2">Command Authorization Email</label>
                <div className="flex bg-[#0f0f12] border border-white/5 rounded-xl px-4 py-3 focus-within:border-purple-accent">
                   <Shield className="text-zinc-600 mr-3" size={18} />
                   <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-white text-sm outline-none w-full placeholder:text-zinc-700 font-medium" placeholder="admin@fasvia.com" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.15em] block mb-2">Master Override Passcode</label>
                <div className="flex bg-[#0f0f12] border border-white/5 rounded-xl px-4 py-3 focus-within:border-purple-accent">
                   <Key className="text-zinc-600 mr-3" size={18} />
                   <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-transparent text-white text-sm outline-none w-full placeholder:text-zinc-700 font-medium tracking-widest" placeholder="••••••••••••" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-purple-accent hover:bg-purple-600 text-white font-bold py-4 rounded-xl mt-4 transition-all flex justify-center items-center shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50 text-xs uppercase tracking-widest">
                 {loading ? <BrandLoader size={18} /> : 'Initialize Override'}
              </button>
           </div>
        </form>
      </div>
    </div>
  )
}
