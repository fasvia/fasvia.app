import { getTenantDb } from '@/lib/db'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import PasswordForm from '@/components/profile/PasswordForm'
import Sidebar from '@/components/ui/Sidebar'

export default async function ProfilePage() {
  const sessionUser = getUserSession()
  if (!sessionUser) redirect('/login')

  const { supabase, withTenant } = getTenantDb()

  const { data: user } = await withTenant(
      supabase.from('users').select('*, departments(name)').eq('id', sessionUser.id)
  ).single()

  if (!user) return null

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role={sessionUser.role} />
      
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-3xl text-white font-bold">My Profile</h1>

          {/* Identity Card */}
          <div className="bg-surface p-8 rounded-2xl border border-border-subtle flex gap-6 items-center">
            {user.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-purple-primary" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-purple-primary flex justify-center items-center text-3xl font-bold text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                 {initials}
              </div>
            )}
            
            <div>
              <h2 className="text-2xl text-white font-bold">{user.name}</h2>
              <p className="text-text-muted">{user.email}</p>
              <div className="flex gap-3 mt-3">
                <span className="badge-purple capitalize">{user.role.replace('_', ' ')}</span>
                {user.departments?.name && <span className="badge-amber">{user.departments.name}</span>}
                {(user.matric_number || user.staff_id) && <span className="badge-green">{user.matric_number || user.staff_id}</span>}
              </div>
            </div>
          </div>

          {/* Password Reset Form Wrapper */}
          <div className="bg-surface p-8 rounded-2xl border border-border-subtle">
             <h3 className="text-xl text-white font-bold flex items-center gap-2 mb-6"><Shield size={20} className="text-purple-accent"/> Security</h3>
             <PasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}
