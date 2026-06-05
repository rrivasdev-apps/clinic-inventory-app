'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const uuidSchema = z.string().uuid()

export async function resolveAlert(alertId: string) {
  if (!uuidSchema.safeParse(alertId).success) throw new Error('ID de alerta inválido')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq('id', alertId)

  if (error) throw new Error(error.message)

  revalidatePath('/inventory/alerts')
  revalidatePath('/inventory/dashboard')
}

export async function triggerAlertNow() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/send-alert?type=daily`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    const data = await res.json()
    if (!res.ok) {
      return { error: data.error ?? 'Error al enviar alerta' }
    }

    return {
      success: true,
      sentEmail: Boolean(data.sentEmail),
      sentTelegram: Boolean(data.sentTelegram),
      productsCount: Number(data.productsCount ?? 0),
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido al enviar alerta' }
  }
}
