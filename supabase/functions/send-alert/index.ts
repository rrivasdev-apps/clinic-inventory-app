import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL            = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY          = Deno.env.get('RESEND_API_KEY')!
const TELEGRAM_BOT_TOKEN      = Deno.env.get('TELEGRAM_BOT_TOKEN')!

interface AlertProduct {
  id: string
  name: string
  unit: string
  stock_current: number
  stock_minimum: number
}

interface Settings {
  clinic_name: string
  alert_recipient_name: string | null
  alert_recipient_email: string | null
  alert_recipient_telegram_chat_id: string | null
  alert_cooldown_hours: number
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  const url   = new URL(req.url)
  const type  = (url.searchParams.get('type') ?? 'immediate') as 'immediate' | 'daily'

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

  // Load settings
  const { data: settings, error: settingsError } = await supabase
    .from('settings')
    .select('clinic_name,alert_recipient_name,alert_recipient_email,alert_recipient_telegram_chat_id,alert_cooldown_hours')
    .single()

  if (settingsError || !settings) {
    return json({ error: 'No settings found' }, 500)
  }

  // Load active alerts with product data
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, stock_at_alert, product:products(id, name, unit, stock_current, stock_minimum)')
    .eq('status', 'active')

  const products: AlertProduct[] = (alerts ?? [])
    .map((a) => a.product as AlertProduct | null)
    .filter((p): p is AlertProduct => p !== null)

  if (products.length === 0) {
    return json({ skipped: 'no active alerts' })
  }

  // Anti-duplication for immediate alerts:
  // skip if all products were already alerted within cooldown window
  if (type === 'immediate') {
    const cooldownHours = settings.alert_cooldown_hours ?? 4
    const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString()

    // Get recently alerted product IDs
    const { data: recentLogs } = await supabase
      .from('alert_logs')
      .select('product_id')
      .eq('type', 'immediate')
      .gte('created_at', since)

    const recentIds = new Set((recentLogs ?? []).map((l) => l.product_id))
    const newProducts = products.filter((p) => !recentIds.has(p.id))

    if (newProducts.length === 0) {
      return json({ skipped: 'all products within cooldown' })
    }
  }

  // Send via both channels; collect results independently
  const results = await Promise.allSettled([
    settings.alert_recipient_email
      ? sendEmail(settings as Settings, products)
      : Promise.resolve(false),
    settings.alert_recipient_telegram_chat_id
      ? sendTelegram(settings as Settings, products)
      : Promise.resolve(false),
  ])

  const sentEmail     = results[0].status === 'fulfilled' && results[0].value !== false
  const sentTelegram  = results[1].status === 'fulfilled' && results[1].value !== false
  const errors        = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message ?? 'Unknown error')
    .join('; ')

  // Log for each alerted product (immediate) or once (daily)
  if (type === 'immediate') {
    await Promise.all(products.map((p) =>
      supabase.from('alert_logs').insert({
        type:         'immediate',
        product_id:   p.id,
        products_json: [p],
        sent_email:   sentEmail,
        sent_whatsapp: sentTelegram, // column reused for Telegram
        error_message: errors || null,
      })
    ))
  } else {
    await supabase.from('alert_logs').insert({
      type:          'daily',
      products_json: products,
      sent_email:    sentEmail,
      sent_whatsapp: sentTelegram,
      error_message: errors || null,
    })
  }

  return json({ sentEmail, sentTelegram, productsCount: products.length, errors: errors || null })
})

// ---------------------------------------------------------------------------
// HTML escaping — prevents XSS if a product name ever contains special chars
// ---------------------------------------------------------------------------
function h(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Email via Resend
// ---------------------------------------------------------------------------
async function sendEmail(settings: Settings, products: AlertProduct[]): Promise<true> {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    'Inventario <alertas@resend.dev>',
      to:      [settings.alert_recipient_email!],
      subject: `⚠️ ${products.length} producto(s) con stock crítico — ${settings.clinic_name}`,
      html:    buildEmailHtml(settings, products),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend ${res.status}: ${body}`)
  }
  return true
}

function buildEmailHtml(settings: Settings, products: AlertProduct[]): string {
  const rows = products.map((p) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${h(p.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;color:#dc2626;font-weight:bold;">${p.stock_current}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${p.stock_minimum}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${h(p.unit)}</td>
    </tr>`).join('')

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#dc2626;">⚠️ Alerta de stock crítico</h2>
      <p>${h(settings.clinic_name)} — ${new Date().toLocaleString('es-CR')}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;">Producto</th>
            <th style="padding:8px 12px;">Stock actual</th>
            <th style="padding:8px 12px;">Mínimo</th>
            <th style="padding:8px 12px;text-align:left;">Unidad</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#6b7280;font-size:12px;">Generado automáticamente por el sistema de inventario.</p>
    </div>`
}

// ---------------------------------------------------------------------------
// Telegram
// ---------------------------------------------------------------------------
async function sendTelegram(settings: Settings, products: AlertProduct[]): Promise<true> {
  const text = buildTelegramMessage(settings, products)

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    settings.alert_recipient_telegram_chat_id,
        text,
        parse_mode: 'HTML',
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Telegram ${res.status}: ${body}`)
  }
  return true
}

function buildTelegramMessage(settings: Settings, products: AlertProduct[]): string {
  const date = new Date().toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' })
  const lines = products.map(
    (p) => `• <b>${p.name}</b>: ${p.stock_current} / ${p.stock_minimum} mín (${p.unit})`
  ).join('\n')

  return `⚠️ <b>Stock crítico — ${settings.clinic_name}</b>\n📅 ${date}\n\n${lines}\n\n<i>Verifica el inventario y gestiona una orden de compra.</i>`
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
