import { z } from 'zod'

export const settingsSchema = z.object({
  clinic_name:                      z.string().min(1, 'El nombre es requerido').max(100),
  currency:                         z.string().regex(/^[A-Z]{3}$/, 'Código de moneda inválido').default('CRC'),
  alert_recipient_name:             z.string().max(100).optional().or(z.literal('')),
  alert_recipient_email:            z.string().email('Email inválido').optional().or(z.literal('')),
  alert_recipient_telegram_chat_id: z.string().max(50).optional().or(z.literal('')),
  alert_time:                       z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  alert_timezone:                   z.enum(
    ['America/Costa_Rica','America/Mexico_City','America/Bogota','America/Lima',
     'America/Santiago','America/Argentina/Buenos_Aires','America/Sao_Paulo','America/Caracas','Europe/Madrid'] as const
  ),
  alert_cooldown_hours:             z.coerce.number().int().min(1).max(72),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>

export const TIMEZONES = [
  { value: 'America/Costa_Rica',   label: 'Costa Rica (UTC-6)' },
  { value: 'America/Mexico_City',  label: 'México (UTC-6)' },
  { value: 'America/Bogota',       label: 'Colombia (UTC-5)' },
  { value: 'America/Lima',         label: 'Perú (UTC-5)' },
  { value: 'America/Caracas',      label: 'Venezuela (UTC-4)' },
  { value: 'America/Santiago',     label: 'Chile (UTC-4/-3)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (UTC-3)' },
  { value: 'America/Sao_Paulo',    label: 'Brasil (UTC-3)' },
  { value: 'Europe/Madrid',        label: 'España (UTC+1/+2)' },
]
