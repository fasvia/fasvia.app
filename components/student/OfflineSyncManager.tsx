'use client'

import { useEffect, useState } from 'react'
import { getPendingRecords as getOfflineRecords, markAsSynced as removeOfflineRecord } from '@/lib/offline'
import { CloudOff, RefreshCw } from 'lucide-react'

export default function OfflineSyncManager() {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const syncRecords = async () => {
    if (syncing || !navigator.onLine) return
    
    try {
      setSyncing(true)
      const records = await getOfflineRecords()
      if (records.length === 0) {
        setPendingCount(0)
        return
      }

      setPendingCount(records.length)
      
      let successfulIds = []
      for (const record of records) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/attendance/mark`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ ...record, is_offline_sync: true })
          })

          // Even if it fails validation (e.g. 24h passed), we must delete from IDB to prevent infinite loops, 
          // unless it's a raw 50x network drop during fetch
          if (res.ok || res.status === 400 || res.status === 403) {
             successfulIds.push(record.id!)
          }
        } catch (e) {
          // fetch failed, means we are offline again
          break
        }
      }

      for (const id of successfulIds) {
        await removeOfflineRecord(id)
      }

      const remaining = await getOfflineRecords()
      setPendingCount(remaining.length)

    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    // Initial check
    syncRecords()

    // 5 Minute Interval
    const interval = setInterval(() => {
      syncRecords()
    }, 5 * 60 * 1000)

    // Window online listener
    window.addEventListener('online', syncRecords)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', syncRecords)
    }
  }, [])

  if (pendingCount === 0) return null

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl z-50 animate-in slide-in-from-bottom">
       {syncing ? <RefreshCw className="animate-spin text-yellow-500" size={16} /> : <CloudOff className="text-yellow-500" size={16} />}
       <span className="text-yellow-200 text-sm font-bold">{pendingCount} pending offline {pendingCount === 1 ? 'record' : 'records'}</span>
       <button onClick={syncRecords} disabled={syncing} className="ml-2 text-xs text-white bg-yellow-500/20 px-3 py-1 rounded-md hover:bg-yellow-500/30 transition-colors">
         {syncing ? 'Syncing...' : 'Sync Now'}
       </button>
    </div>
  )
}
