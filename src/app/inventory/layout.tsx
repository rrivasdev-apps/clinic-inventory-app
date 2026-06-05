import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import InventoryNav from './inventory-nav'
import { getActiveAlertsCount } from '@/features/alerts/queries'
import type { UserRole } from '@/types'

export default async function InventoryLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [settings, role, activeAlertsCount] = await Promise.all([
    supabase.from('settings').select('clinic_name').single().then((r) => r.data),
    getCurrentUserRole(),
    getActiveAlertsCount(),
  ])

  return (
    <div className="flex h-full min-h-screen flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-card">
        <div className="border-b px-6 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inventario</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground truncate">
            {settings?.clinic_name ?? 'Mi Clínica'}
          </p>
        </div>
        <InventoryNav orientation="vertical" role={role} activeAlertsCount={activeAlertsCount} />
        {/* Role badge at bottom of sidebar */}
        {role && (
          <div className="border-t px-4 py-3">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs font-medium capitalize text-primary">{role}</p>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
          <div>
            <p className="text-xs text-muted-foreground">Inventario</p>
            <p className="text-sm font-semibold">{settings?.clinic_name ?? 'Mi Clínica'}</p>
          </div>
          {role && (
            <span className="text-xs font-medium text-primary capitalize">{role}</span>
          )}
        </header>

        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card lg:hidden">
          <InventoryNav orientation="horizontal" role={role} activeAlertsCount={activeAlertsCount} />
        </nav>
      </div>
    </div>
  )
}
