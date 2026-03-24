'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BrandLoader from '@/components/ui/BrandLoader'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <BrandLoader size={48} />
    </div>
  )
}
