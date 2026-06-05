import Link from 'next/link'
import { Users, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth'
import SettingsForm from '@/features/settings/components/SettingsForm'
import type { Settings } from '@/types'

interface Props {
  searchParams: Promise<{ saved?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const { saved } = await searchParams

  const [supabaseClient, role] = await Promise.all([
    createClient(),
    getCurrentUserRole(),
  ])

  const { data: settings } = await supabaseClient.from('settings').select('*').single()

  if (!settings) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-destructive text-sm">Error cargando configuración.</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajustes globales del sistema y notificaciones</p>
      </div>

      {saved === '1' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Configuración guardada correctamente.
        </div>
      )}

      <SettingsForm settings={settings as Settings} />

      {role === 'admin' && (
        <Link
          href="/inventory/settings/users"
          className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors"
        >
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Gestión de usuarios</p>
            <p className="text-xs text-muted-foreground">Invitar, asignar roles y activar/desactivar cuentas</p>
          </div>
        </Link>
      )}
    </div>
  )
}
