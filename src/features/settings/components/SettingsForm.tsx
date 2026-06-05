'use client'

import { useActionState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveSettings } from '../actions'
import { triggerAlertNow } from '@/features/alerts/actions'
import { TIMEZONES } from '../validation'
import type { Settings } from '@/types'

const CURRENCIES = [
  { code: 'CRC', label: 'Colón Costarricense (CRC)' },
  { code: 'USD', label: 'Dólar Estadounidense (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'MXN', label: 'Peso Mexicano (MXN)' },
  { code: 'ARS', label: 'Peso Argentino (ARS)' },
  { code: 'BRL', label: 'Real Brasileño (BRL)' },
  { code: 'COP', label: 'Peso Colombiano (COP)' },
  { code: 'PEN', label: 'Sol Peruano (PEN)' },
  { code: 'CLP', label: 'Peso Chileno (CLP)' },
  { code: 'VES', label: 'Bolívares Venezolanos (Bs)' },
]

interface Props {
  settings: Settings
}

export default function SettingsForm({ settings }: Props) {
  const [state, formAction, pending] = useActionState(saveSettings, undefined)
  const [testing, startTest]         = useTransition()
  const [testResult, setTestResult]  = React.useState<{ ok: boolean; msg: string } | null>(null)
  const [alertTimezone, setAlertTimezone] = React.useState(settings.alert_timezone)
  const [currency, setCurrency] = React.useState((settings as any).currency ?? 'CRC')

  const handleTimezoneChange = (value: string | null) => {
    if (value !== null) setAlertTimezone(value)
  }

  const handleCurrencyChange = (value: string | null) => {
    if (value !== null) setCurrency(value)
  }

  async function handleTest() {
    startTest(async () => {
      const result = await triggerAlertNow()
      if ('error' in result) {
        setTestResult({ ok: false, msg: result.error })
      } else if ('success' in result && result.success) {
        const { sentEmail, sentTelegram, productsCount } = result
        if (productsCount === 0) {
          setTestResult({ ok: true, msg: 'Sin alertas activas — todos los productos están en stock normal' })
        } else {
          setTestResult({
            ok:  true,
            msg: `Alerta enviada a ${productsCount} producto(s) — Email: ${sentEmail ? '✓' : '✗'}  Telegram: ${sentTelegram ? '✓' : '✗'}`,
          })
        }
      }
    })
  }

  // Default time without seconds
  const defaultTime = settings.alert_time?.slice(0, 5) ?? '08:00'

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        {/* Hidden inputs to submit Select values */}
        <input type="hidden" name="alert_timezone" value={alertTimezone} />
        <input type="hidden" name="currency" value={currency} />
        {state?.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {/* Clinic */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Clínica
          </h2>
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Nombre de la clínica</Label>
            <Input id="clinic_name" name="clinic_name" defaultValue={settings.clinic_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Seleccionar moneda">
                  {CURRENCIES.find(c => c.code === currency)?.label || 'Seleccionar moneda'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>{curr.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define la moneda usada en reportes y órdenes de compra.
            </p>
          </div>
        </section>

        {/* Alert recipient */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Destinatario de alertas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="alert_recipient_name">Nombre</Label>
              <Input
                id="alert_recipient_name"
                name="alert_recipient_name"
                defaultValue={settings.alert_recipient_name ?? ''}
                placeholder="Ej. María González"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert_recipient_email">Correo electrónico</Label>
              <Input
                id="alert_recipient_email"
                name="alert_recipient_email"
                type="email"
                defaultValue={settings.alert_recipient_email ?? ''}
                placeholder="compras@clinica.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="alert_recipient_telegram_chat_id">
                Telegram Chat ID
              </Label>
              <Input
                id="alert_recipient_telegram_chat_id"
                name="alert_recipient_telegram_chat_id"
                defaultValue={settings.alert_recipient_telegram_chat_id ?? ''}
                placeholder="Ej. 123456789"
              />
              <p className="text-xs text-muted-foreground">
                El número de chat ID que obtuviste de <code>getUpdates</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Alerta diaria programada
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="alert_time">Hora de envío</Label>
              <Input
                id="alert_time"
                name="alert_time"
                type="time"
                defaultValue={defaultTime}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="alert_timezone">Zona horaria</Label>
              <Select value={alertTimezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger id="alert_timezone">
                  <SelectValue placeholder="Seleccionar zona horaria">
                    {TIMEZONES.find(tz => tz.value === alertTimezone)?.label || 'Seleccionar zona horaria'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert_cooldown_hours">Cooldown entre alertas (horas)</Label>
              <Input
                id="alert_cooldown_hours"
                name="alert_cooldown_hours"
                type="number"
                min={1}
                max={72}
                defaultValue={settings.alert_cooldown_hours}
              />
              <p className="text-xs text-muted-foreground">
                Evita duplicados — no se repite una alerta inmediata por el mismo producto dentro de este período.
              </p>
            </div>
          </div>
        </section>

        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar configuración'}
        </Button>
      </form>

      {/* Test notification */}
      <section className="rounded-xl border p-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Probar notificaciones</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Envía una alerta ahora con los productos críticos actuales.
            Requiere tener email y/o Telegram configurados arriba.
          </p>
        </div>

        {testResult && (
          <p className={`text-sm rounded-md px-3 py-2 ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
            {testResult.msg}
          </p>
        )}

        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing}
          type="button"
        >
          {testing ? 'Enviando…' : '📨 Enviar alerta de prueba ahora'}
        </Button>
      </section>
    </div>
  )
}

// Need React import for useState in this file
import React from 'react'
