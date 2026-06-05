'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { settingsSchema } from './validation'

export async function saveSettings(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('module', 'inventory')
    .single()

  if (roleRow?.role !== 'admin') return { error: 'No autorizado' }

  const raw    = Object.fromEntries(formData)
  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: v } = parsed

  const { error } = await supabase.from('settings').update({
    clinic_name:                      v.clinic_name,
    currency:                         v.currency,
    alert_recipient_name:             v.alert_recipient_name             || null,
    alert_recipient_email:            v.alert_recipient_email            || null,
    alert_recipient_telegram_chat_id: v.alert_recipient_telegram_chat_id || null,
    alert_time:                       `${v.alert_time}:00`,
    alert_timezone:                   v.alert_timezone,
    alert_cooldown_hours:             v.alert_cooldown_hours,
  }).neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) return { error: error.message }

  revalidatePath('/inventory/settings')
  revalidatePath('/inventory/layout')
  // Redirect remounts the form with fresh server data — eliminates the
  // Base UI "changing defaultValue of uncontrolled input" warning.
  redirect('/inventory/settings?saved=1')
}
