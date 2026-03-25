'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Users, BarChart2, AlertTriangle, Settings, User, LogOut, Home, Calendar, FileDown, Building2, UserPlus, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Sidebar({ role, courses, pendingDisputes = 0 }: { role: string, courses?: any[], pendingDisputes?: number }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const links = {
    student: [
      { name: 'Dashboard', href: '/student', icon: Home },
      { name: 'History & Grades', href: '/history', icon: BookOpen },
    ],
    lecturer: [
      { name: 'Dashboard', href: '/lecturer', icon: Home },
    ],
    dept_admin: [
      { name: 'Courses', href: '/deptadmin', icon: BookOpen },
      { name: 'Lecturers', href: '/deptadmin?tab=lecturers', icon: Users },
      { name: 'Students', href: '/deptadmin?tab=students', icon: UserPlus },
      { name: 'Reports', href: '/deptadmin?tab=reports', icon: BarChart2 },
      { name: 'Fraud Alerts', href: '/deptadmin?tab=fraud', icon: AlertTriangle, badge: pendingDisputes > 0 ? pendingDisputes : null },
      { name: 'Records', href: '/deptadmin?tab=records', icon: FileDown },
    ],
    admin: [
      { name: 'Overview', href: '/admin', icon: Home },
      { name: 'Calendar Setups', href: '/admin/calendar', icon: Calendar },
      { name: 'Departments', href: '/admin/departments', icon: Building2 },
    ],
    school_admin: [
      { name: 'Overview', href: '/admin', icon: Home },
      { name: 'Calendar Setups', href: '/admin/calendar', icon: Calendar },
      { name: 'Departments', href: '/admin/departments', icon: Building2 },
    ]
  }[role] || []

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-purple-primary text-white p-3 rounded-2xl shadow-lg ring-1 ring-white/20 active:scale-95 transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        w-64 min-h-screen border-r border-border-subtle bg-surface flex flex-col fixed left-0 top-0 z-[55] overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-border-subtle shrink-0 flex items-center gap-3">
          <img src="/fasvia-logo.png" alt="Fasvia Logo" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight leading-none">Fasvia</h2>
            <span className="text-purple-accent text-[10px] font-bold uppercase block mt-1">{role.replace('_', ' ')}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-2">
          {links.map(link => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/deptadmin' && link.href !== '/admin')
            return (
               <Link key={link.href} href={link.href} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-purple-primary/20 text-purple-accent font-bold' : 'text-text-muted hover:text-white hover:bg-bg-primary'}`}>
                <div className="flex items-center gap-3">
                  <link.icon size={18} /> {link.name}
                </div>
                {link.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg ring-2 ring-bg-primary">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {role === 'lecturer' && courses && courses.length > 0 && (
            <div className="mt-8">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-4 mb-3">Assigned Courses</h3>
                {courses.map((c: any) => (
                  <Link key={c.courses.id} href={`/lecturer?course=${c.courses.id}`} className="flex justify-between items-center px-4 py-3 hover:bg-bg-primary rounded-xl group transition-all">
                    <div>
                      <span className="text-white font-bold group-hover:text-purple-accent block transition-colors">{c.courses.code}</span>
                      <span className="block text-xs text-text-muted truncate max-w-[120px] mt-0.5">{c.courses.title}</span>
                    </div>
                    <span className="text-xs bg-purple-primary/20 text-purple-accent px-2 py-1 rounded-md font-bold border border-purple-primary/30">
                      {c.session_count || 0}
                    </span>
                  </Link>
                ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border-subtle space-y-2 shrink-0">
          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-text-muted hover:text-white rounded-xl transition-all">
            <User size={18} /> My Profile
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-text-muted hover:text-white rounded-xl transition-all">
            <Settings size={18} /> Settings
          </Link>
          <form action="/api/auth/logout" method="POST">
             <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left">
               <LogOut size={18} /> Log Out
             </button>
          </form>
        </div>
      </aside>
    </>
  )
}
