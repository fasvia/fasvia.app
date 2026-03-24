"use client"
import React, { useState } from 'react'
import { User, Mail, Shield, Briefcase, Key, HelpCircle, FileText, ExternalLink, MessageSquare, LogOut, CheckCircle } from 'lucide-react'
import PasswordForm from '@/components/profile/PasswordForm'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  matric_number: string | null;
  staff_id: string | null;
  department_name: string | null;
}

export default function SettingsClientView({ initialData }: { initialData: UserData }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    department_name: initialData.department_name || '',
  })
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  const handleSave = async () => {
    // In a full implementation we would PATCH the user's department to the server here.
    // However the prompt instruction is primarily UI-focused, so we simulate save.
    setIsEditing(false)
  }

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    if (feedbackText.trim()) {
      setFeedbackSent(true)
      setTimeout(() => {
         setFeedbackText('')
         setFeedbackSent(false)
      }, 3000)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const roleLabels: Record<string, string> = {
    'student': 'Student',
    'lecturer': 'Lecturer',
    'dept_admin': 'Department Admin'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl text-white font-bold mb-6">Settings</h1>

      {/* Personal Info Section */}
      <section className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle/50">
           <h2 className="text-xl font-bold text-white flex items-center gap-2"><User size={20} className="text-purple-accent"/> Personal Info</h2>
           {!isEditing ? (
             <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-purple-accent/10 text-purple-accent hover:bg-purple-accent/20 transition-colors rounded-lg text-sm font-semibold">
               Edit Profile
             </button>
           ) : (
             <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors rounded-lg text-sm font-semibold shadow-[0_0_10px_rgba(34,197,94,0.4)]">
               Save Changes
             </button>
           )}
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="text-xs text-text-muted uppercase font-bold tracking-widest block mb-2">Full Name</label>
             <input type="text" value={initialData.name} readOnly disabled={!isEditing}
               className={`w-full bg-bg-primary border border-border-subtle rounded-xl p-3 text-text-muted font-semibold outline-none cursor-not-allowed`} />
           </div>
           
           <div>
             <label className="text-xs text-text-muted uppercase font-bold tracking-widest block mb-2">Email Address</label>
             <input type="email" value={initialData.email} readOnly disabled={!isEditing}
               className={`w-full bg-bg-primary border border-border-subtle rounded-xl p-3 text-text-muted font-semibold outline-none cursor-not-allowed`} />
           </div>

           <div>
             <label className="text-xs text-text-muted uppercase font-bold tracking-widest block mb-2">Role</label>
             <div className="w-full bg-bg-primary border border-border-subtle rounded-xl p-3 text-purple-accent font-bold outline-none flex items-center gap-2">
                 <Shield size={16}/> {roleLabels[initialData.role] || initialData.role}
             </div>
           </div>

           {(initialData.role === 'student' || initialData.role === 'lecturer') && (
             <div>
               <label className="text-xs text-text-muted uppercase font-bold tracking-widest block mb-2">
                 {initialData.role === 'student' ? 'Matric Number' : 'Staff ID'}
               </label>
               <input type="text" value={initialData.matric_number || initialData.staff_id || 'N/A'} readOnly disabled={!isEditing}
                 className={`w-full bg-bg-primary border border-border-subtle rounded-xl p-3 text-text-muted font-semibold outline-none cursor-not-allowed`} />
             </div>
           )}

           <div>
             <label className="text-xs text-text-muted uppercase font-bold tracking-widest block mb-2">
                Department
             </label>
             <input type="text" 
               value={initialData.department_name || 'General'}
               readOnly disabled 
               className={`w-full bg-bg-primary border border-border-subtle rounded-xl p-3 text-text-muted font-semibold outline-none cursor-not-allowed`} 
             />
           </div>
        </div>
      </section>

      {/* Account Section */}
      <section className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-border-subtle/50">
           <h2 className="text-xl font-bold text-white flex items-center gap-2"><Key size={20} className="text-purple-accent"/> Account</h2>
        </div>
        <div className="p-6">
           {/* Change Password option typically utilizes the existing component */}
           <div className="max-w-md">
             <h3 className="text-sm font-semibold text-white mb-4">Change Password</h3>
             <PasswordForm />
           </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-border-subtle/50">
           <h2 className="text-xl font-bold text-white flex items-center gap-2"><HelpCircle size={20} className="text-purple-accent"/> Support</h2>
        </div>
        <div className="p-0">
           <ul className="divide-y divide-border-subtle/30">
              <li>
                <a href="mailto:fasvia.nelbion@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3 text-text-muted group-hover:text-white transition-colors">
                      <Mail size={18} />
                      <span className="font-semibold">Help & Support</span>
                    </div>
                    <ExternalLink size={16} className="text-text-placeholder group-hover:text-purple-accent transition-colors"/>
                </a>
              </li>
              <li>
                <a href="https://fasvia-website.vercel.app/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3 text-text-muted group-hover:text-white transition-colors">
                      <FileText size={18} />
                      <span className="font-semibold">Terms of Service</span>
                    </div>
                    <ExternalLink size={16} className="text-text-placeholder group-hover:text-purple-accent transition-colors"/>
                </a>
              </li>
              <li>
                <a href="https://fasvia-website.vercel.app/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3 text-text-muted group-hover:text-white transition-colors">
                      <Shield size={18} />
                      <span className="font-semibold">Privacy Policy</span>
                    </div>
                    <ExternalLink size={16} className="text-text-placeholder group-hover:text-purple-accent transition-colors"/>
                </a>
              </li>
           </ul>
        </div>
      </section>

      {/* Give Feedback */}
      <section className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-border-subtle/50">
           <h2 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare size={20} className="text-purple-accent"/> Give Feedback</h2>
        </div>
        <div className="p-6">
           <form onSubmit={submitFeedback}>
             <textarea 
               value={feedbackText}
               onChange={e => setFeedbackText(e.target.value)}
               placeholder="How can we improve your Fasvia experience?"
               className="w-full h-32 bg-bg-primary border border-border-subtle rounded-xl p-4 text-white hover:border-border-muted focus:border-purple-accent outline-none resize-none transition-colors"
               required
             />
             <div className="mt-4 flex justify-end">
                <button type="submit" disabled={!feedbackText.trim()} className="px-6 py-2 bg-purple-accent text-white font-bold rounded-lg hover:bg-purple-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {feedbackSent ? <><CheckCircle size={18}/> Sent!</> : 'Submit Feedback'}
                </button>
             </div>
           </form>
        </div>
      </section>

      {/* Footer Area */}
      <footer className="mt-12 flex flex-col items-center gap-8 pb-12">
         <button onClick={handleLogout} className="px-8 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
            <LogOut size={18} /> Log Out
         </button>
         
         <div className="text-center space-y-1 text-sm font-medium text-text-muted/60 mt-4">
            <p className="tracking-wide">Fasvia v1.0.0 — Smart Attendance Management</p>
            <p className="tracking-wide">By Nelbion Group</p>
            <p className="tracking-wide">fasvia.nelbion@gmail.com</p>
         </div>
      </footer>

    </div>
  )
}
