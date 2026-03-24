import { openDB } from 'idb'

const DB_NAME = 'fasvia-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-attendance'

export async function getOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        store.createIndex('session_id', 'session_id')
        store.createIndex('synced', 'synced')
        store.createIndex('marked_at', 'marked_at')
      }
    }
  })
}

// Save attendance record locally when offline
export async function saveOfflineAttendance(record: {
  session_id: string
  student_id: string
  latitude: number
  longitude: number
  device_fingerprint: string
  face_photo: string | null
  marked_at: string
}) {
  const db = await getOfflineDB()
  await db.add(STORE_NAME, {
    ...record,
    synced: false,
    marked_at: new Date().toISOString()
  })
  console.log('Attendance saved offline')
}

// Get all unsynced records
export async function getPendingRecords() {
  const db = await getOfflineDB()
  const all = await db.getAll(STORE_NAME)
  return all.filter(r => !r.synced)
}

// Mark a record as synced
export async function markAsSynced(id: number) {
  const db = await getOfflineDB()
  const record = await db.get(STORE_NAME, id)
  if (record) {
    record.synced = true
    await db.put(STORE_NAME, record)
  }
}

// Delete old synced records (cleanup)
export async function cleanupSyncedRecords() {
  const db = await getOfflineDB()
  const all = await db.getAll(STORE_NAME)
  const synced = all.filter(r => r.synced)
  for (const record of synced) {
    await db.delete(STORE_NAME, record.id)
  }
}

// Check if a record is expired (over 24 hours old)
export function isExpired(markedAt: string): boolean {
  const marked = new Date(markedAt).getTime()
  const now = new Date().getTime()
  const twentyFourHours = 24 * 60 * 60 * 1000
  return (now - marked) > twentyFourHours
}
