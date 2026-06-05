import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export interface ManagedUser {
  id:               string
  email:            string
  created_at:       string
  last_sign_in_at:  string | null
  is_banned:        boolean
  role:             UserRole | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:      'Administrador',
  nurse:      'Enfermera',
  purchasing: 'Compras',
  readonly:   'Solo lectura',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin:      'Acceso total — configuración, usuarios, reportes',
  nurse:      'Registra entradas y salidas de materiales',
  purchasing: 'Alertas, proveedores y órdenes de compra',
  readonly:   'Solo consulta — sin modificaciones',
}

export async function listUsers(): Promise<ManagedUser[]> {
  const admin = createAdminClient()
  const supabase = await createClient()

  // Fetch all auth users
  const { data: authData, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw new Error(error.message)

  // Fetch all role assignments
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('module', 'inventory')

  const roleMap = new Map<string, UserRole>(
    (roles ?? []).map((r) => [r.user_id, r.role as UserRole])
  )

  return authData.users.map((u) => ({
    id:              u.id,
    email:           u.email ?? '',
    created_at:      u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    is_banned:       !!(u.banned_until && new Date(u.banned_until) > new Date()),
    role:            roleMap.get(u.id) ?? null,
  }))
}
