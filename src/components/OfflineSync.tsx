'use client'

import { useEffect, useState } from 'react'
import { getPendingMovements, deletePendingMovement, pendingCount } from '@/lib/offline-movements'
import { createClient } from '@/lib/supabase/client'

// Called by PwaSetup when the browser comes back online or SW sends SYNC_MOVEMENTS
export async function syncOfflineMovements() {
  if (!navigator.onLine) return

  const pending = await getPendingMovements()
  if (!pending.length) return

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  for (const m of pending) {
    const { error } = await supabase.from('movements').insert({
      product_id:   m.product_id,
      type:         m.type,
      quantity:     m.quantity,
      user_id:      user.id,
      created_by:   user.id,
      notes:        m.notes,
      procedure_id: m.procedure_id,
      sync_status:  'synced',
      // Preserve original offline timestamp
      created_at:   m.created_at,
    })

    if (!error) {
      await deletePendingMovement(m.id)
    }
  }
}

// Badge shown when there are pending offline movements
export default function OfflineSyncBadge() {
  const [count, setCount]   = useState(0)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    pendingCount().then(setCount)
    const interval = setInterval(() => pendingCount().then(setCount), 5000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  async function handleSync() {
    setSyncing(true)
    await syncOfflineMovements()
    const remaining = await pendingCount()
    setCount(remaining)
    setSyncing(false)
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing || !navigator.onLine}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-lg lg:bottom-4"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      {syncing ? 'Sincronizando…' : `${count} mov. pendiente${count > 1 ? 's' : ''}`}
    </button>
  )
}
