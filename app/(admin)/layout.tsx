import Sidebar from '@/components/ui/Sidebar'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getUserSession()
  if (!user || (user.role !== 'admin' && user.role !== 'school_admin')) redirect('/login')

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role={user.role} />
      <div className="flex-1 lg:ml-64 pt-20 lg:pt-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
