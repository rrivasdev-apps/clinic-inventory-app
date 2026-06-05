import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types'

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('module', 'inventory')
    .single()

  return (data?.role as UserRole) ?? null
}

// Use in admin-only Server Components/pages — redirects non-admins away
export async function requireAdminRole() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/inventory/dashboard')
  return role
}
