'use client'

import { useEffect } from 'react'
import { syncOfflineMovements } from './OfflineSync'

export default function PwaSetup() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {/* SW registration failed — app still works online */})

      // Listen for sync requests from the SW
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'SYNC_MOVEMENTS') {
          syncOfflineMovements()
        }
      })
    }

    // Sync pending movements when connection is restored
    window.addEventListener('online', syncOfflineMovements)
    return () => window.removeEventListener('online', syncOfflineMovements)
  }, [])

  return null
}
