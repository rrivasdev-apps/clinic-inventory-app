import { openDB } from 'idb'
import type { MovementType } from '@/types'

const DB_NAME = 'clinic-inventory'
const STORE   = 'pending-movements'
const DB_VER  = 1

export interface PendingMovement {
  id:           string   // local UUID (crypto.randomUUID)
  product_id:   string
  type:         MovementType
  quantity:     number   // signed
  notes:        string | null
  procedure_id: string | null
  created_at:   string   // ISO timestamp (local device time)
}

async function getDb() {
  return openDB(DB_NAME, DB_VER, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
}

export async function savePendingMovement(movement: Omit<PendingMovement, 'id' | 'created_at'>) {
  const db = await getDb()
  const record: PendingMovement = {
    ...movement,
    id:         crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  await db.add(STORE, record)
  return record
}

export async function getPendingMovements(): Promise<PendingMovement[]> {
  const db = await getDb()
  const all = await db.getAll(STORE)
  return all.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function deletePendingMovement(id: string) {
  const db = await getDb()
  await db.delete(STORE, id)
}

export async function pendingCount(): Promise<number> {
  const db = await getDb()
  return db.count(STORE)
}
