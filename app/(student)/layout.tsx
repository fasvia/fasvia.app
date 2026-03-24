import OfflineSyncManager from '@/components/student/OfflineSyncManager'
import Sidebar from '@/components/ui/Sidebar'
import { getUserSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = getUserSession()
  if (!user || user.role !== 'student') redirect('/login')

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar role={user.role} />
      <div className="flex-1 ml-64 overflow-y-auto">
        <OfflineSyncManager />
        {children}
      </div>
    </div>
  )
}
