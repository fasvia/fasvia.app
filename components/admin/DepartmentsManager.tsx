'use client'

import React, { useState } from 'react'
import { Building2, CheckCircle, Shield, Key, ShieldCheck, Copy, Layers } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

export default function DepartmentsManager({ initialDepartments }: { initialDepartments: any[] }) {
  const [departments, setDepartments] = useState(initialDepartments)

  // Department Form
  const [deptData, setDeptData] = useState({ name: '', code: '' })
  const [creatingDept, setCreatingDept] = useState(false)

  // HOD Form
  const [hodData, setHodData] = useState({ department_id: '', name: '', email: '' })
  const [creatingHod, setCreatingHod] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null)

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingDept(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setDepartments([...departments, data.department].sort((a,b) => a.name.localeCompare(b.name)))
      setDeptData({ name: '', code: '' })
      alert('Department Created Successfully!')
    } catch(err: any) {
      alert(`Error building department: ${err.message}`)
    } finally {
      setCreatingDept(false)
    }
  }

  const handleProvisionHOD = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingHod(true)
    setGeneratedCredentials(null)
    
    // Auto Generate Strong Payload for HOD
    const genPassword = 'Hod' + Math.random().toString(36).slice(-6) + '@' + new Date().getFullYear();

    try {
      const res = await fetch('/api/admin/hod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...hodData, password: genPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setGeneratedCredentials({ email: hodData.email, password: genPassword })
      setHodData({ department_id: '', name: '', email: '' })
    } catch(err: any) {
      alert(`Error provisioning HOD: ${err.message}`)
    } finally {
      setCreatingHod(false)
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECTION 1: REGISTER DEPARTMENT */}
          <section className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-border-subtle bg-bg-primary flex items-center gap-2">
                <Building2 size={18} className="text-purple-accent"/> 
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Register Department</h2>
             </div>
             <div className="p-6">
                <form onSubmit={handleCreateDepartment} className="space-y-5">
                   <div>
                     <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-2">Department Name</label>
                     <input required type="text" value={deptData.name} onChange={e=>setDeptData({...deptData, name: e.target.value})} className="w-full bg-bg-primary border border-border-subtle focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none" placeholder="e.g. Computer Science" />
                   </div>
                   <div>
                     <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-2">Short Code</label>
                     <input required type="text" value={deptData.code} onChange={e=>setDeptData({...deptData, code: e.target.value.toUpperCase()})} className="w-full bg-bg-primary border border-border-subtle focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none uppercase" placeholder="CSC" />
                   </div>
                   <button disabled={creatingDept} type="submit" className="w-full bg-purple-primary/20 hover:bg-purple-primary/40 text-purple-accent border border-purple-primary/50 font-bold py-4 rounded-xl mt-4 transition-all flex justify-center items-center text-xs uppercase tracking-widest">
                      {creatingDept ? <BrandLoader size={18} /> : 'Create Faculty Division'}
                   </button>
                </form>
             </div>
          </section>

          {/* SECTION 2: PROVISION HOD */}
          <section className="bg-gradient-to-br from-surface to-purple-900/10 border border-purple-primary/30 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.05)] flex flex-col">
             <div className="p-6 border-b border-purple-primary/30 bg-purple-900/20 flex items-center gap-2">
                <ShieldCheck size={18} className="text-purple-400"/> 
                <h2 className="text-lg font-bold text-white uppercase tracking-wide">Provision HOD Administrator</h2>
             </div>
             <div className="p-6 flex-1 flex flex-col justify-between">
                <form onSubmit={handleProvisionHOD} className="space-y-5">
                   <div>
                     <label className="text-xs text-purple-300/80 font-bold uppercase tracking-widest block mb-2">Target Department</label>
                     <select required value={hodData.department_id} onChange={e=>setHodData({...hodData, department_id: e.target.value})} className="w-full bg-bg-primary/80 border border-purple-primary/40 focus:border-purple-accent rounded-xl p-3 text-white text-sm outline-none appearance-none font-bold">
                       <option value="" disabled>Select faculty constraint...</option>
                       {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-purple-300/80 font-bold uppercase tracking-widest block mb-2">HOD Name</label>
                     <div className="flex bg-bg-primary/80 border border-purple-primary/40 rounded-xl px-4 py-3 focus-within:border-purple-accent">
                        <Shield className="text-purple-500/50 mr-3" size={18} />
                        <input type="text" required value={hodData.name} onChange={e=>setHodData({...hodData, name: e.target.value})} className="bg-transparent text-white text-sm outline-none w-full placeholder:text-text-muted font-medium" placeholder="Prof. Adebayo" />
                     </div>
                   </div>
                   <div>
                     <label className="text-xs text-purple-300/80 font-bold uppercase tracking-widest block mb-2">Email Address</label>
                     <div className="flex bg-bg-primary/80 border border-purple-primary/40 rounded-xl px-4 py-3 focus-within:border-purple-accent">
                        <Key className="text-purple-500/50 mr-3" size={18} />
                        <input type="email" required value={hodData.email} onChange={e=>setHodData({...hodData, email: e.target.value})} className="bg-transparent text-white text-sm outline-none w-full placeholder:text-text-muted font-medium" placeholder="hod.csc@university.edu" />
                     </div>
                   </div>

                   <button disabled={creatingHod || departments.length===0} type="submit" className="w-full bg-purple-accent hover:bg-purple-500 text-white font-bold py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 transition-all flex justify-center items-center text-xs uppercase tracking-widest">
                      {creatingHod ? <BrandLoader size={18} /> : 'Generate Executive Keys'}
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

       {/* SECTION 3: ALL DEPARTMENTS */}
       <section className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-border-subtle bg-bg-primary flex items-center gap-2">
             <Layers size={18} className="text-white"/> 
             <h2 className="text-lg font-bold text-white uppercase tracking-wide">University Faculty</h2>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-bg-primary text-xs text-text-muted uppercase tracking-widest font-bold border-b border-border-subtle">
                      <th className="p-4 pl-6">Department Name</th>
                      <th className="p-4">Code Reference</th>
                      <th className="p-4">Date Established</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                   {departments.map(d => (
                      <tr key={d.id} className="hover:bg-bg-primary/50 transition-colors">
                         <td className="p-4 pl-6 font-bold text-white">{d.name}</td>
                         <td className="p-4 text-purple-accent font-mono text-sm font-bold">{d.code}</td>
                         <td className="p-4 text-text-muted text-sm font-mono">{new Date(d.created_at).toLocaleDateString()}</td>
                      </tr>
                   ))}
                   {departments.length === 0 && (
                      <tr>
                         <td colSpan={3} className="p-8 text-center text-text-muted font-bold uppercase tracking-widest text-xs">No Departments Established Yet</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </section>

    </div>
  )
}
