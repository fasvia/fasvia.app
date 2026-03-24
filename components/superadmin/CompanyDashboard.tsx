'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, FileText, CheckCircle, Shield, Key, AlertCircle, Eye, PowerOff, ShieldCheck, Copy, TerminalSquare } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

export default function CompanyDashboard({ initialSchools, initialStats }: { initialSchools: any[], initialStats: any }) {
  const router = useRouter()
  
  const [schools, setSchools] = useState(initialSchools)
  const [stats, setStats] = useState(initialStats)

  // School Form
  const [schoolData, setSchoolData] = useState({
    name: '', code: '', domain: '', primary_colour: '#7C3AED', secondary_colour: '#A855F7', subscription_status: 'Trial'
  })
  const [creatingSchool, setCreatingSchool] = useState(false)

  // Admin Form
  const [adminData, setAdminData] = useState({
    school_id: '', name: '', email: ''
  })
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null)

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingSchool(true)
    try {
      const res = await fetch('/api/superadmin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setSchools([data.school, ...schools])
      setStats({...stats, totalUniversities: stats.totalUniversities + 1})
      setSchoolData({ name: '', code: '', domain: '', primary_colour: '#7C3AED', secondary_colour: '#A855F7', subscription_status: 'Trial' })
      alert('University Provisioned Successfully!')
    } catch(err: any) {
      alert(`Error provisioning school: ${err.message}`)
    } finally {
      setCreatingSchool(false)
    }
  }

  const handleProvisionAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingAdmin(true)
    setGeneratedCredentials(null)
    
    // Auto Generate Strong Payload
    const genPassword = 'Fv' + Math.random().toString(36).slice(-6) + '@' + new Date().getFullYear();

    try {
      const res = await fetch('/api/superadmin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...adminData, password: genPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setGeneratedCredentials({ email: adminData.email, password: genPassword })
      setAdminData({ school_id: '', name: '', email: '' })
    } catch(err: any) {
      alert(`Error provisioning admin: ${err.message}`)
    } finally {
      setCreatingAdmin(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
       
       {/* Header */}
       <header className="flex justify-between items-end border-b border-border-subtle/50 pb-6">
          <div>
            <h1 className="text-3xl text-white font-bold tracking-tight uppercase flex items-center gap-3">
               <TerminalSquare className="text-purple-accent" size={28}/> FASVIA HQ
            </h1>
            <p className="text-text-muted mt-2 tracking-widest text-xs font-bold uppercase">A Nelbion Group Strategic Venture</p>
          </div>
       </header>

       {/* SECTION 1: STATS */}
       <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Building2 size={64}/></div>
             <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">Total Universities</p>
             <h3 className="text-4xl text-white font-black">{stats.totalUniversities}</h3>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-green-500"><CheckCircle size={64}/></div>
             <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">Active Tenants</p>
             <h3 className="text-4xl text-white font-black">{stats.activeUniversities}</h3>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-blue-500"><Users size={64}/></div>
             <p className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-2">Global Students</p>
             <h3 className="text-4xl text-white font-black">{stats.totalStudents}</h3>
          </div>
          <div className="bg-[#18181b] p-6 rounded-2xl border border-purple-primary/20 shadow-[0_0_30px_rgba(124,58,237,0.1)] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-purple-accent"><FileText size={64}/></div>
             <p className="text-xs font-bold text-purple-400 tracking-widest uppercase mb-2">Footprints Today</p>
             <h3 className="text-4xl text-purple-accent font-black">{stats.recordsToday}</h3>
          </div>
       </section>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECTION 2: REGISTER UNIVERSITY */}
          <section className="bg-[#18181b] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-white/5 bg-black/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide"><Building2 size={18} className="text-purple-accent"/> Allocate New B2B Tenant</h2>
             </div>
             <div className="p-6">
                <form onSubmit={handleCreateSchool} className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                       <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">University Name</label>
                       <input required type="text" value={schoolData.name} onChange={e=>setSchoolData({...schoolData, name: e.target.value})} className="w-full bg-[#0f0f12] border border-white/5 focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none" placeholder="e.g. University of Ilorin" />
                     </div>
                     <div>
                       <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Short Code</label>
                       <input required type="text" value={schoolData.code} onChange={e=>setSchoolData({...schoolData, code: e.target.value.toUpperCase()})} className="w-full bg-[#0f0f12] border border-white/5 focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none uppercase" placeholder="UNILORIN" />
                     </div>
                     <div>
                       <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Network Domain</label>
                       <input type="text" value={schoolData.domain} onChange={e=>setSchoolData({...schoolData, domain: e.target.value.toLowerCase()})} className="w-full bg-[#0f0f12] border border-white/5 focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none" placeholder="unilorin.fasvia.app" />
                     </div>
                     <div>
                       <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2 flex justify-between">Primary Color <span className="text-purple-accent">{schoolData.primary_colour}</span></label>
                       <div className="flex bg-[#0f0f12] border border-white/5 rounded-xl p-2 items-center">
                          <input type="color" required value={schoolData.primary_colour} onChange={e=>setSchoolData({...schoolData, primary_colour: e.target.value})} className="w-8 h-8 rounded shrink-0 cursor-pointer bg-transparent border-0" />
                          <span className="text-xs text-zinc-500 ml-3">Hex Value</span>
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2 flex justify-between">Secondary Color <span className="text-purple-accent">{schoolData.secondary_colour}</span></label>
                       <div className="flex bg-[#0f0f12] border border-white/5 rounded-xl p-2 items-center">
                          <input type="color" required value={schoolData.secondary_colour} onChange={e=>setSchoolData({...schoolData, secondary_colour: e.target.value})} className="w-8 h-8 rounded shrink-0 cursor-pointer bg-transparent border-0" />
                          <span className="text-xs text-zinc-500 ml-3">Hex Value</span>
                       </div>
                     </div>
                     <div className="col-span-2">
                       <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">Subscription Contract</label>
                       <select value={schoolData.subscription_status} onChange={e=>setSchoolData({...schoolData, subscription_status: e.target.value})} className="w-full bg-[#0f0f12] border border-white/5 focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none appearance-none">
                         <option value="Trial">Trial Agreement</option>
                         <option value="Active">Active Production</option>
                         <option value="Suspended">Suspended / Revoked</option>
                       </select>
                     </div>
                   </div>
                   <button disabled={creatingSchool} type="submit" className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl mt-2 transition-all flex justify-center items-center text-xs uppercase tracking-widest">
                      {creatingSchool ? <BrandLoader size={18} /> : 'Establish Tenant Infrastructure'}
                   </button>
                </form>
             </div>
          </section>

          {/* SECTION 3: PROVISION ADMIN */}
          <section className="bg-gradient-to-br from-[#18181b] to-purple-900/10 border border-purple-500/20 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.05)] flex flex-col">
             <div className="p-6 border-b border-purple-500/20 bg-purple-900/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide"><ShieldCheck size={18} className="text-purple-400"/> Provision School Admin</h2>
             </div>
             <div className="p-6 flex-1 flex flex-col justify-between">
                <form onSubmit={handleProvisionAdmin} className="space-y-5">
                   <div>
                     <label className="text-[10px] text-purple-300 font-bold uppercase tracking-widest block mb-2">Target Tenant Architecture</label>
                     <select required value={adminData.school_id} onChange={e=>setAdminData({...adminData, school_id: e.target.value})} className="w-full bg-[#0f0f12]/80 border border-purple-500/30 focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none appearance-none font-bold">
                       <option value="" disabled>Select provisioned university...</option>
                       {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] text-purple-300 font-bold uppercase tracking-widest block mb-2">Executive Name</label>
                     <div className="flex bg-[#0f0f12]/80 border border-purple-500/30 rounded-xl px-4 py-3 focus-within:border-purple-accent">
                        <Shield className="text-purple-500/50 mr-3" size={18} />
                        <input type="text" required value={adminData.name} onChange={e=>setAdminData({...adminData, name: e.target.value})} className="bg-transparent text-white text-sm outline-none w-full placeholder:text-zinc-600 font-medium" placeholder="Prof. Example H." />
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] text-purple-300 font-bold uppercase tracking-widest block mb-2">Executive Encrypted Email</label>
                     <div className="flex bg-[#0f0f12]/80 border border-purple-500/30 rounded-xl px-4 py-3 focus-within:border-purple-accent">
                        <Key className="text-purple-500/50 mr-3" size={18} />
                        <input type="email" required value={adminData.email} onChange={e=>setAdminData({...adminData, email: e.target.value})} className="bg-transparent text-white text-sm outline-none w-full placeholder:text-zinc-600 font-medium" placeholder="vc@university.edu" />
                     </div>
                   </div>
                   
                   <p className="text-xs text-purple-400/60 font-bold uppercase tracking-widest flex items-center gap-2 mt-4"><CheckCircle size={14}/> Core authentication bypass injected</p>

                   <button disabled={creatingAdmin || schools.length===0} type="submit" className="w-full bg-purple-accent hover:bg-purple-500 text-white font-bold py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all flex justify-center items-center text-xs uppercase tracking-widest">
                      {creatingAdmin ? <BrandLoader size={18} /> : 'Inject Highest Clearances'}
                   </button>
                </form>

                {generatedCredentials && (
                   <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl animate-in slide-in-from-bottom flex flex-col items-center text-center">
                     <p className="text-[10px] text-green-400 font-bold uppercase tracking-[0.2em] mb-4">Credentials Generated Successfully</p>
                     <div className="space-y-2 w-full">
                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-green-500/20">
                           <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Email</span>
                           <span className="text-white font-medium text-sm">{generatedCredentials.email}</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-green-500/20">
                           <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Master Key</span>
                           <span className="text-green-400 font-mono text-sm tracking-wider bg-green-500/20 px-2 py-1 rounded">{generatedCredentials.password}</span>
                        </div>
                     </div>
                     <button onClick={() => navigator.clipboard.writeText(`Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`)} className="mt-4 flex items-center gap-2 text-xs text-green-500 font-bold uppercase tracking-widest hover:text-white transition-colors">
                        <Copy size={14}/> Copy Payload for Transport
                     </button>
                   </div>
                )}
             </div>
          </section>
       </div>

       {/* SECTION 4: ALL UNIVERSITIES */}
       <section className="bg-[#18181b] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
             <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide"><Shield size={18} className="text-purple-accent"/> Networked Institutions</h2>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-black/40 text-[10px] text-zinc-500 uppercase tracking-widest font-bold border-b border-white/5">
                      <th className="p-4 pl-6">Institution</th>
                      <th className="p-4">Code</th>
                      <th className="p-4">Domain Node</th>
                      <th className="p-4">Authorization</th>
                      <th className="p-4">Deployment</th>
                      <th className="p-4 text-right pr-6">Commands</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {schools.map(s => (
                      <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                         <td className="p-4 pl-6 font-bold text-white max-w-[200px] truncate">{s.name}</td>
                         <td className="p-4 text-zinc-400 font-mono text-xs">{s.code}</td>
                         <td className="p-4 text-zinc-400 text-xs">{s.domain}</td>
                         <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${s.subscription_status === 'Active' ? 'bg-green-500/20 text-green-400' : s.subscription_status === 'Suspended' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                               {s.subscription_status}
                            </span>
                         </td>
                         <td className="p-4 text-zinc-400 text-xs font-mono">{new Date(s.created_at).toLocaleDateString()}</td>
                         <td className="p-4 pr-6 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-zinc-500 hover:text-white transition-colors" title="Lockdown Node"><PowerOff size={16}/></button>
                            <button className="text-zinc-500 hover:text-purple-400 transition-colors" title="Inspect Node"><Eye size={16}/></button>
                         </td>
                      </tr>
                   ))}
                   {schools.length === 0 && (
                      <tr>
                         <td colSpan={6} className="p-8 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">No B2B Tenants Allocated</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </section>

    </div>
  )
}
