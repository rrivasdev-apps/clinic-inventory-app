# CLAUDE.md — Sistema de Inventario Clínica de Cirugía Plástica

## Project: Clinic Inventory Management System

Sistema de gestión de inventario para clínica de cirugía plástica. Reemplaza hojas de Excel con una plataforma web + PWA móvil que registra entradas y salidas de materiales en tiempo real, alerta sobre stock crítico por email y WhatsApp, y genera reportes de consumo. Primer módulo de un sistema administrativo más amplio. Construido con Claude Code como herramienta principal de desarrollo.

---

## Tech Stack

- **Frontend:** React / Next.js 16 (App Router)
- **Styling:** Tailwind CSS / shadcn/ui
- **Backend:** Supabase (Auth, DB, Edge Functions, Realtime, Storage)
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth
- **Deployment:** Vercel
- **AI:** Anthropic Claude API
- **Mobile:** PWA (Progressive Web App — misma codebase, instalable en iOS y Android)
- **Email:** Resend
- **WhatsApp:** Twilio WhatsApp API (v1) → Meta WhatsApp Business Cloud API (v2)

---

## Key Commands

- Dev server: `npm run dev` (port 3000)
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Database types: `npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts`
- Nueva migración: `npx supabase migration new <nombre>`
- Push migrations to cloud: `npx supabase db push`

---

## File Structure

- `src/app/` — App Router: rutas, layouts, páginas. Todas las rutas del inventario bajo `src/app/inventory/`
- `src/components/` — Componentes UI reutilizables: tablas, modales, formularios, badges de alerta, QR scanner
- `src/components/ui/` — Componentes base de shadcn/ui — nunca en `src/features/`
- `src/features/` — Módulos por funcionalidad: `inventory/`, `movements/`, `alerts/`, `reports/`, `suppliers/`, `auth/`
- `src/lib/` — Cliente Supabase (`supabase.ts`), cliente Claude (`claude.ts`), helpers de fecha y unidades
- `src/types/` — Tipos TypeScript incluyendo tipos generados de Supabase (`database.types.ts`)
- `src/styles/` — Estilos globales y configuración de Tailwind
- `supabase/migrations/` — Migraciones de base de datos (nunca editar manualmente — usar `supabase migration new`)
- `supabase/functions/` — Edge Functions: `send-alert/`, `ai-insights/`, `generate-report/`
- `public/` — Assets estáticos, íconos PWA, `manifest.json`, service worker

---

## Architecture Notes

**Auth y Roles:**
- Supabase Auth maneja login (email/password + magic link). Es el proveedor único de identidad para todos los módulos futuros del sistema administrativo.
- Roles definidos en tabla `user_roles` con campo `module` para permisos granulares por módulo: `admin`, `nurse`, `purchasing`, `readonly`.
- RLS habilitado en TODAS las tablas sin excepción. Nunca deshabilitar RLS en producción.
- Las API keys y el service role key de Supabase nunca se exponen al cliente — solo en Edge Functions.

**Movimientos — Regla crítica:**
- La tabla `movements` es **append-only**. NUNCA hacer UPDATE ni DELETE sobre un movimiento existente.
- Para corregir un error: insertar un movimiento de ajuste con cantidad positiva o negativa y nota explicativa.
- Un trigger de Postgres actualiza `products.stock_current` automáticamente en cada INSERT en `movements`.
- Cuando `stock_current <= stock_minimum`, un segundo trigger inserta en `alerts` y dispara webhook a la Edge Function `send-alert/`.

**Sistema de Alertas — Email + WhatsApp:**
- Dos tipos: **alerta inmediata** (cuando un movimiento baja el stock al crítico) y **alerta diaria programada** (cron a la hora configurada en `settings`).
- Regla absoluta: si no hay productos con `stock_current <= stock_minimum`, no se envía nada — ni email ni WhatsApp.
- Anti-duplicación: verificar `alert_logs` por cooldown (configurable) antes de enviar alerta inmediata del mismo producto.
- La alerta diaria siempre consolida TODOS los productos críticos en un solo mensaje — nunca un mensaje por producto.
- Si falla un canal (email o WhatsApp), igual intentar el otro y registrar el error en `alert_logs.error_message`.
- El número de WhatsApp del destinatario debe estar en formato E.164 (`+50688887777`). Validar en el formulario de configuración.
- Twilio sandbox requiere opt-in previo del número destinatario. En producción con Meta, los mensajes proactivos requieren templates aprobados — tramitar antes del lanzamiento.

**PWA y Offline:**
- Service Worker cachea assets estáticos y últimas consultas de inventario.
- Movimientos registrados sin conexión se guardan en IndexedDB con `sync_status = 'pending'`.
- Al recuperar conexión, el SW envía los movimientos pendientes a Supabase en orden cronológico.
- Nunca asumir conectividad — siempre manejar el caso offline en el registro de movimientos.

**Claude API:**
- Solo se llama desde Edge Functions (`supabase/functions/ai-insights/`). La API key NUNCA va al cliente.
- Modelo: `claude-sonnet-4-6`, `max_tokens: 1000`.
- Casos de uso: predicción de agotamiento basada en consumo histórico, sugerencia de cantidad de reorden, resumen ejecutivo de reporte mensual.
- Siempre usar streaming para respuestas visibles al usuario.

**Flujo de datos:**
```
Usuario móvil  → PWA (React) → Supabase Client (RLS) → Postgres
                                       ↓ Trigger
                               alerts table ← stock_current <= stock_minimum
                                       ↓ Webhook
                               Edge Function (send-alert) → Email + WhatsApp

Admin          → Next.js → Supabase Client (auth) → Postgres
AI             → Edge Function (ai-insights) → Claude API → dashboard
Cron diario    → pg_cron → Edge Function (send-alert) → Email + WhatsApp
```

**Database conventions:**
- Todas las tablas usan `uuid` como PK con `gen_random_uuid()` por defecto.
- Todos los timestamps son `timestamptz` en UTC.
- Columnas de auditoría en todas las tablas: `created_at`, `created_by`, `updated_at`.
- RLS habilitado en todas las tablas. Políticas por rol documentadas en cada migración.
- Después de cada migración: `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts` antes de escribir código que use esas tablas.
- Nunca usar `any` para resultados de Supabase — usar siempre los tipos generados.

**Arquitectura modular (escalabilidad futura):**
- Cada feature vive en `src/features/<modulo>/` con su propio estado, componentes, tipos y servicios. Los módulos se comunican a través de interfaces explícitas, nunca importando internos de otro módulo.
- Todas las rutas del inventario bajo `/inventory/...` para coexistir con `/patients/...`, `/billing/...`, etc. en el futuro.
- Los componentes base viven en `src/components/ui/` — nunca en `src/features/`. Esto garantiza consistencia visual al agregar módulos nuevos.
- La tabla `procedures` es intencionalmente simple en v1 — en el futuro se convierte en el módulo de agenda.
- Todas las operaciones importantes expuestas como Edge Functions con contratos claros para que módulos futuros (ej. facturación) puedan consumirlas.

---

## Key Principles

- **Mobile-first siempre.** Diseñar para 320px primero. Cada pantalla debe ser usable con una mano. Probar en dispositivos reales.
- **Movimientos son inmutables.** Nunca editar ni borrar un movimiento — solo agregar ajustes. Es una regla de negocio y de auditoría.
- **RLS en todo.** Ninguna tabla sin políticas de seguridad. Verificar en cada migración.
- **Offline resiliente.** El registro de salidas debe funcionar sin internet — es una clínica, puede haber zonas sin señal.
- **Alertas en tiempo real.** Un stock crítico durante una cirugía es una emergencia — las notificaciones deben ser inmediatas.
- **Silencio inteligente en alertas.** Si no hay productos críticos, no se envía nada. No generar ruido innecesario.
- **AI server-side only.** La Claude API key nunca toca el navegador.
- **Tipado estricto.** Regenerar tipos de Supabase después de cada migración. Cero `any`.
- **Namespace de módulo.** Rutas siempre bajo `/inventory/...` — preparar el terreno para el sistema administrativo completo.
- **Un solo sistema de auth.** Supabase Auth es el proveedor de identidad para todo el sistema futuro. No crear sistemas de auth paralelos.

---

## Common Pitfalls

- No hacer UPDATE/DELETE en la tabla `movements` — es append-only por diseño y auditoría.
- No exponer `SUPABASE_SERVICE_ROLE_KEY` ni `ANTHROPIC_API_KEY` al cliente — solo en Edge Functions.
- No deshabilitar RLS aunque sea "temporal para probar" — usar el dashboard de Supabase con service role para debugging.
- Después de cada migración, regenerar tipos antes de escribir código que use esas tablas nuevas.
- El QR scanner usa la cámara del dispositivo — siempre pedir permiso con manejo de error claro para cuando el usuario lo deniegue.
- Para PWA en iOS: el manifest y los íconos deben estar en formato específico para Safari — verificar con Lighthouse.
- Los Edge Functions de Supabase tienen timeout de 2 segundos por defecto — aumentar para reportes pesados o llamadas a Claude.
- El cron job de `pg_cron` usa UTC internamente — convertir `settings.alert_time` + `settings.alert_timezone` a UTC al programar el cron.
- No usar rutas planas (`/products`, `/alerts`) — siempre el namespace completo (`/inventory/products`, `/inventory/alerts`).
- No hardcodear el nombre de la clínica o configuración — siempre leer de tabla `settings`.
- En producción con Twilio/Meta, los mensajes proactivos de WhatsApp requieren templates pre-aprobados — tramitar antes del lanzamiento (puede tomar varios días).

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side / Edge Functions únicamente
ANTHROPIC_API_KEY=                  # Edge Functions únicamente — nunca al cliente
RESEND_API_KEY=                     # envío de emails de alerta

# WhatsApp — Twilio (opción v1)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=               # formato: whatsapp:+14155238886

# WhatsApp — Meta Cloud API (opción v2)
META_WHATSAPP_TOKEN=
META_WHATSAPP_PHONE_ID=
```

---

## Data Model Reference

```sql
products        — catálogo: nombre, código, categoría, stock_current, stock_minimum, stock_maximum, ubicación, proveedor, precio
categories      — categorías con color
suppliers       — proveedores: contacto, teléfono, email
movements       — append-only: product_id, type, quantity, user_id, procedure_id, sync_status
                  type: 'purchase'|'return'|'usage'|'expiry'|'loss'|'adjustment'
alerts          — stock bajo: product_id, stock_at_alert, status ('active'|'resolved')
alert_logs      — historial de envíos: type, products_json, sent_email, sent_whatsapp, error_message
procedures      — referencia de cirugías (v1 simple → módulo de agenda en el futuro)
purchase_orders — órdenes de compra: supplier_id, status, items_json
user_roles      — role + module por usuario (escala a permisos granulares por módulo futuro)
settings        — configuración global: clinic_name, alert_recipient, alert_time, alert_timezone, alert_cooldown_hours
```

---

## PWA Requirements

- `public/manifest.json` con nombre, íconos (192×192, 512×512), `theme_color`, `display: standalone`.
- Service Worker registrado en `src/app/layout.tsx`.
- Meta tags para iOS: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`.
- Íconos Apple Touch en `public/` para instalación en iOS.
- Movimientos offline guardados en IndexedDB — sincronizar al recuperar conexión en orden cronológico.
- Lighthouse PWA score objetivo: > 90.

---

## Módulos Futuros Anticipados

| Módulo | Conexión con Inventario |
|---|---|
| Agenda / Citas | `procedures` table — pre-reservar materiales al agendar una cirugía |
| Expedientes de Pacientes | Historial de materiales usados por paciente |
| Facturación | Costo de materiales por procedimiento desde `movements` via Edge Function |
| Compras | Órdenes de compra generadas automáticamente por alertas |
| Reportes Ejecutivos | Valor del inventario como línea en el dashboard gerencial consolidado |

---

## PRD Reference

El PRD completo está en `PRD_ClinicInventory.md`. Ante cualquier duda de alcance, consultar el PRD. Mantener v1 enfocado — resistir el feature creep. La prioridad absoluta de v1 es que las enfermeras puedan registrar salidas desde el móvil en menos de 30 segundos.
