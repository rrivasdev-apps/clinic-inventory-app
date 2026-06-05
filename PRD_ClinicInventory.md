# Product Requirements Document
## Project: Sistema de Inventario para Clínica de Cirugía Plástica

**Version:** 1.0
**Date:** June 3, 2026
**Status:** Draft

---

## Project Overview

Sistema de gestión de inventario diseñado específicamente para clínicas de cirugía plástica. Reemplaza el manejo manual en hojas de Excel con una plataforma web y móvil que registra en tiempo real las entradas y salidas de materiales, alerta cuando los niveles caen por debajo de un punto crítico, y genera reportes de consumo para toma de decisiones.

---

## Tech Stack

- **Frontend:** React / Next.js
- **Styling:** Tailwind CSS / shadcn/ui
- **Backend:** Supabase (BaaS — Auth, DB, Edge Functions, Realtime, Storage)
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth (email/password + magic link)
- **Deployment:** Vercel (frontend) + Supabase Cloud (backend)
- **AI:** Anthropic Claude API (predicción de consumo, reportes inteligentes)
- **Mobile:** PWA (Progressive Web App) — misma codebase, instalable en iOS y Android

---

## Key Commands

- Dev server: `npm run dev` (port 5173)
- Build: `npm run build`
- Test: `npm run test`
- Lint: `npm run lint`
- Database types: `npx supabase gen types typescript --local > src/types/database.ts`
- Supabase local: `npx supabase start`
- New migration: `npx supabase migration new <nombre>`

---

## File Structure

- `src/components/` — Componentes UI reutilizables (tablas, modales, alertas, formularios)
- `src/features/` — Módulos por funcionalidad: `inventory/`, `movements/`, `alerts/`, `reports/`, `suppliers/`, `auth/`
- `src/lib/` — Cliente Supabase, utilidades, helpers de fecha y unidades
- `src/pages/` — Rutas: dashboard, inventario, movimientos, alertas, proveedores, reportes, configuración
- `src/types/` — Tipos TypeScript incluyendo tipos generados de Supabase
- `src/styles/` — Estilos globales y configuración de Tailwind
- `supabase/migrations/` — Archivos de migración de base de datos
- `supabase/functions/` — Edge Functions: `alerts/`, `reports/`, `ai-insights/`
- `public/` — Assets estáticos, íconos PWA, manifest.json

---

## Problema Actual

La clínica maneja su inventario en hojas de Excel con los siguientes problemas críticos:

- No se registra cuándo ni quién saca material del inventario.
- No existe alerta cuando un producto cae por debajo del stock mínimo.
- No hay trazabilidad de consumo por procedimiento o cirujano.
- El Excel no es accesible en tiempo real desde múltiples dispositivos.
- No hay historial de movimientos auditables.
- Riesgo de quedarse sin materiales críticos durante una cirugía.

---

## Goals

- Digitalizar y centralizar el inventario en una plataforma accesible desde web y móvil.
- Registrar cada entrada y salida de material con usuario, fecha, hora, y motivo.
- Alertar automáticamente cuando un producto cae por debajo de su punto crítico.
- Generar reportes de consumo por período, categoría, proveedor y procedimiento.
- Proveer una experiencia mobile-first para uso durante o después de procedimientos.

---

## Target Users

| Rol | Descripción |
|---|---|
| Administrador | Configura el sistema, gestiona usuarios, define puntos críticos, ve todos los reportes |
| Enfermera / Instrumentista | Registra salidas de material durante procedimientos desde móvil |
| Encargado de Compras | Monitorea alertas de stock bajo y gestiona órdenes de compra |
| Cirujano | Consulta disponibilidad de materiales antes de un procedimiento (solo lectura) |

---

## Core Features

### 1. Gestión de Inventario
- Catálogo de productos con: nombre, código, categoría, unidad de medida, stock actual, stock mínimo (punto crítico), stock máximo, ubicación física (armario/cajón), imagen, proveedor, y precio unitario.
- Vista de inventario con búsqueda, filtros por categoría y estado (normal / bajo / crítico / agotado).
- Códigos QR por producto para escaneo rápido desde móvil.
- Soporte para múltiples unidades: unidades, cajas, ampollas, ml, etc.

### 2. Registro de Movimientos
- Registro de **entradas**: compra, devolución de proveedor, ajuste de inventario.
- Registro de **salidas**: uso en procedimiento, vencimiento, pérdida, ajuste.
- Cada movimiento registra: producto, cantidad, tipo, usuario, fecha/hora, número de procedimiento (opcional), notas.
- Escaneo de QR desde móvil para registrar salidas rápidamente.
- Posibilidad de registrar múltiples salidas en una sola operación (kit de procedimiento).

### 3. Sistema de Alertas
- Alerta automática cuando el stock cae por debajo del punto crítico configurado.
- Notificaciones en tiempo real dentro de la app (Supabase Realtime).
- Notificaciones por email al encargado de compras (Supabase Edge Functions).
- Panel de alertas activas con indicador de urgencia (bajo / crítico / agotado).
- Historial de alertas generadas.

### 4. Dashboard
- Resumen en tiempo real: total de productos, alertas activas, movimientos del día, valor total del inventario.
- Gráfica de consumo semanal/mensual.
- Top 10 productos más usados.
- Productos próximos a vencer (si aplica fecha de vencimiento).
- Acceso rápido a registrar una salida desde el dashboard.

### 5. Reportes
- Reporte de consumo por período (diario, semanal, mensual, personalizado).
- Reporte por categoría de producto.
- Reporte por proveedor.
- Reporte de movimientos por usuario.
- Reporte de productos con mayor número de alertas.
- Exportación a PDF y Excel.
- Insights de IA: predicción de cuándo se agotará un producto basado en consumo histórico.

### 6. Gestión de Proveedores
- Catálogo de proveedores con: nombre, contacto, teléfono, email, productos que suministran.
- Historial de compras por proveedor.
- Órdenes de compra básicas (generación de PDF para enviar al proveedor).

### 7. Mobile-First / PWA
- Diseño responsivo optimizado para teléfonos desde 320px.
- Instalable como app en iOS (Safari → Agregar a pantalla de inicio) y Android (Chrome → Instalar app).
- Funcionalidad offline básica: consulta de inventario y registro de movimientos en cola (sync cuando haya conexión).
- Cámara integrada para escaneo de QR desde el teléfono.

### 8. Gestión de Usuarios y Roles
- Roles: Administrador, Enfermera, Encargado de Compras, Solo Lectura.
- Cada acción en el sistema queda registrada con el usuario que la realizó.
- Administrador puede activar/desactivar usuarios.

---

## Non-Goals (v1)

- Integración con sistemas de facturación o contabilidad.
- Gestión de pacientes o expedientes clínicos.
- Control de vencimientos con FEFO (primero en vencer, primero en salir) automatizado — v2.
- App nativa iOS/Android — se usa PWA en v1.
- Integración con lectores de código de barras físicos — se usa cámara del teléfono.

---

## Architecture Notes

**Base de datos:**
- RLS habilitado en todas las tablas. Cada rol tiene permisos específicos.
- Tabla `movements` es append-only — nunca se edita ni borra un movimiento, solo se agregan ajustes.
- Triggers de Postgres actualizan automáticamente `stock_current` en la tabla `products` cada vez que se inserta un movimiento.
- Trigger de alerta: cuando `stock_current` cae por debajo de `stock_minimum`, inserta un registro en la tabla `alerts` y dispara un Edge Function para notificación por email.

**Realtime:**
- El dashboard se suscribe al canal de Supabase Realtime para `alerts` y `movements` — actualizaciones instantáneas sin polling.

**PWA:**
- `manifest.json` con íconos para iOS y Android.
- Service Worker para cache de assets y funcionamiento offline básico.
- Movimientos registrados offline se guardan en IndexedDB y se sincronizan al recuperar conexión.

**Claude API:**
- Llamadas solo desde Edge Functions — la API key nunca toca el cliente.
- Uso: análisis de consumo histórico para predecir fechas de agotamiento y sugerir cantidades de reorden.

---

## Data Model (Tablas Principales)

```
products          — catálogo de productos
categories        — categorías de productos
suppliers         — proveedores
movements         — todos los movimientos (entradas y salidas)
alerts            — alertas de stock bajo generadas
users             — usuarios del sistema (gestionados por Supabase Auth)
user_roles        — roles por usuario
procedures        — procedimientos/cirugías (referencia para movimientos)
purchase_orders   — órdenes de compra generadas
```

---

## Success Metrics

- 100% de salidas de material registradas (vs. 0% actual en Excel).
- Alertas de stock crítico enviadas en menos de 1 minuto de ocurrido el evento.
- Tiempo de registro de una salida desde móvil: menos de 30 segundos.
- Cero instancias de quedarse sin material crítico sin aviso previo en los primeros 3 meses.
- Adopción del sistema por el 100% del personal en las primeras 2 semanas.

---

## Open Questions

1. ¿Maneja la clínica fechas de vencimiento en sus materiales? ¿Es necesario alertas de vencimiento próximo?
2. ¿Se necesita soporte para múltiples bodegas o ubicaciones físicas?
3. ¿Requieren integración con algún proveedor específico para órdenes de compra automáticas?
4. ¿Cuántos usuarios simultáneos se esperan como máximo?
5. ¿Necesitan auditoría externa? ¿Los reportes deben tener firma digital o formato oficial?

---

## Milestones

| Fase | Entregable |
|---|---|
| Fase 1 | Schema de Supabase + Auth + CRUD de productos y categorías |
| Fase 2 | Registro de movimientos + actualización automática de stock |
| Fase 3 | Sistema de alertas (Realtime + email) |
| Fase 4 | Dashboard + vistas mobile-first |
| Fase 5 | Reportes + exportación PDF/Excel |
| Fase 6 | PWA (offline, instalable, QR scan) |
| Fase 7 | Gestión de proveedores + órdenes de compra |
| Fase 8 | AI insights (Claude API) + beta con usuarios reales |

---

## Actualización: Sistema de Alertas Ampliado

### Alertas por Correo y WhatsApp

**Comportamiento general:**
- El sistema evalúa diariamente a la hora configurada si hay productos con stock por debajo del mínimo.
- Si hay al menos un producto en estado crítico → se envía una lista consolidada por **email Y WhatsApp** al usuario designado.
- Si NO hay ningún producto en estado crítico → no se genera ninguna alerta, ni email ni WhatsApp.
- Una vez que un producto recupera su nivel normal de inventario, desaparece automáticamente de la lista de alertas activas.

**Configuración por el administrador:**
- Usuario designado para recibir alertas (nombre, email, número de WhatsApp con código de país).
- Hora de envío de la alerta diaria (ej. 8:00 AM).
- Zona horaria de la clínica.

**Contenido de la alerta (email y WhatsApp):**
- Encabezado: nombre de la clínica, fecha y hora del reporte.
- Lista de productos críticos con: nombre del producto, stock actual, stock mínimo recomendado, unidad de medida, y proveedor.
- Llamada a la acción: enlace directo al módulo de alertas en la app.
- Si no hay productos críticos: no se envía nada.

**Canales:**
- **Email:** vía Resend o Supabase SMTP. Formato HTML con tabla de productos críticos.
- **WhatsApp:** vía Twilio WhatsApp API o WhatsApp Business Cloud API (Meta). Mensaje de texto estructurado con la lista de productos.

**Tipos de alerta:**
1. **Alerta diaria programada:** se ejecuta todos los días a la hora configurada (Supabase Cron Job / pg_cron).
2. **Alerta inmediata en tiempo real:** cuando un movimiento hace caer el stock por debajo del mínimo, se notifica de inmediato — sin esperar la hora programada.

**Lógica de no-duplicación:**
- Si ya se envió una alerta por un producto en las últimas X horas (configurable), no se vuelve a enviar alerta inmediata por ese mismo producto.
- La alerta diaria siempre consolida TODOS los productos críticos activos al momento del envío.

---

## Consideración Estratégica: Módulo de un Sistema Administrativo Mayor

### Visión a largo plazo

El sistema de inventario está diseñado desde su arquitectura base para poder integrarse o convertirse en un módulo dentro de un sistema administrativo más amplio para la clínica. Otros módulos futuros podrían incluir:

- **Agenda y citas** — programación de procedimientos y cirugías
- **Expedientes de pacientes** — historial clínico y procedimientos realizados
- **Facturación y cobros** — vinculado al consumo de materiales por procedimiento
- **Recursos humanos** — gestión del personal de la clínica
- **Contabilidad** — costos operativos, valor del inventario, proyecciones
- **Reportes ejecutivos** — dashboard gerencial consolidado

### Implicaciones de diseño para v1

Para que la expansión futura sea posible sin reescribir el sistema, v1 debe:

1. **Arquitectura multi-módulo desde el inicio:** organizar el código en módulos desacoplados (`/features/inventory`, `/features/auth`, etc.) con interfaces bien definidas entre ellos.
2. **Schema de base de datos extensible:** diseñar las tablas con claves foráneas que puedan conectarse a tablas futuras (ej. `movements.procedure_id` ya apunta a una tabla `procedures` que en el futuro puede expandirse a un módulo de agenda completo).
3. **Sistema de roles escalable:** el sistema de roles (`admin`, `nurse`, `purchasing`, `readonly`) debe poder expandirse sin romper los existentes — usar una tabla de permisos granulares en v2.
4. **Autenticación centralizada:** Supabase Auth como proveedor único de identidad para todos los módulos futuros — un solo login para todo el sistema.
5. **API-first:** todas las operaciones del módulo de inventario expuestas como Edge Functions con contratos claros, de forma que otros módulos puedan consumirlas (ej. el módulo de facturación puede consultar el costo de materiales usados en un procedimiento).
6. **Namespacing de rutas:** usar `/inventory/...` como prefijo de todas las rutas del módulo, para que coexista con `/patients/...`, `/billing/...`, etc. en el futuro.
7. **Diseño visual consistente:** establecer desde v1 un design system (componentes shadcn/ui + tokens de Tailwind) que sea reutilizable por todos los módulos futuros.
