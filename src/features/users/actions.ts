'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { requireAdminRole } from '@/lib/auth'
import type { UserRole } from '@/types'

const uuidSchema  = z.string().uuid()
const emailSchema = z.string().email()

const USERS_PATH = '/inventory/settings/users'

export async function inviteUser(_prevState: unknown, formData: FormData) {
  await requireAdminRole()

  const email = formData.get('email')
  const role  = formData.get('role') as UserRole

  if (typeof email !== 'string' || !emailSchema.safeParse(email).success) {
    return { error: 'Email inválido' }
  }
  if (!['admin', 'nurse', 'purchasing', 'readonly'].includes(role)) {
    return { error: 'Rol inválido' }
  }

  const admin = createAdminClient()

  // Invite via Supabase Auth (sends email with magic link)
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/confirm`,
  })
  if (error) return { error: error.message }

  // Assign the role immediately
  const supabase = await createClient()
  await supabase.from('user_roles').upsert(
    { user_id: data.user.id, role, module: 'inventory' },
    { onConflict: 'user_id,module' }
  )

  revalidatePath(USERS_PATH)
  return { success: `Invitación enviada a ${email}` }
}

export async function changeUserRole(userId: string, role: UserRole) {
  if (!uuidSchema.safeParse(userId).success) throw new Error('ID inválido')
  await requireAdminRole()

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: userId, role, module: 'inventory' },
      { onConflict: 'user_id,module' }
    )

  if (error) throw new Error(error.message)
  revalidatePath(USERS_PATH)
}

export async function removeUserRole(userId: string) {
  if (!uuidSchema.safeParse(userId).success) throw new Error('ID inválido')
  await requireAdminRole()

  const supabase = await createClient()
  await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('module', 'inventory')

  revalidatePath(USERS_PATH)
}

export async function setUserBanned(userId: string, banned: boolean) {
  if (!uuidSchema.safeParse(userId).success) throw new Error('ID inválido')
  await requireAdminRole()

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: banned ? '876600h' : 'none',   // 876600h ≈ 100 years
  })

  if (error) throw new Error(error.message)
  revalidatePath(USERS_PATH)
}
