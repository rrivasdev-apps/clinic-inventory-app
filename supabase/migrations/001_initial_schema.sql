-- =============================================================================
-- 001_initial_schema.sql
-- Creates all tables, enums, indexes, and audit triggers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type movement_type as enum ('purchase', 'return', 'usage', 'expiry', 'loss', 'adjustment');
create type alert_status as enum ('active', 'resolved');
create type purchase_order_status as enum ('draft', 'sent', 'received', 'cancelled');
create type sync_status as enum ('synced', 'pending');
create type user_role as enum ('admin', 'nurse', 'purchasing', 'readonly');
create type alert_log_type as enum ('immediate', 'daily');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  color       text        not null default '#6b7280',
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid        references auth.users(id)
);

create table suppliers (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  contact_name text,
  phone        text,
  email        text,
  address      text,
  notes        text,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid        references auth.users(id)
);

create table products (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  code          text        unique,
  category_id   uuid        references categories(id),
  unit          text        not null default 'unidad',
  stock_current numeric     not null default 0,
  stock_minimum numeric     not null default 0,
  stock_maximum numeric,
  location      text,
  supplier_id   uuid        references suppliers(id),
  price         numeric,
  expiry_date   date,
  image_url     text,
  description   text,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid        references auth.users(id)
);

-- Simple procedure reference (v1 — becomes full agenda module in the future)
create table procedures (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  created_at  timestamptz not null default now(),
  created_by  uuid        references auth.users(id)
);

-- Append-only by design — no updated_at, never UPDATE or DELETE
create table movements (
  id           uuid          primary key default gen_random_uuid(),
  product_id   uuid          not null references products(id),
  type         movement_type not null,
  quantity     numeric       not null, -- signed: positive = stock in, negative = stock out
  user_id      uuid          not null references auth.users(id),
  procedure_id uuid          references procedures(id),
  notes        text,
  sync_status  sync_status   not null default 'synced',
  created_at   timestamptz   not null default now(),
  created_by   uuid          references auth.users(id)
);

create table alerts (
  id            uuid         primary key default gen_random_uuid(),
  product_id    uuid         not null references products(id),
  stock_at_alert numeric     not null,
  status        alert_status not null default 'active',
  created_at    timestamptz  not null default now(),
  resolved_at   timestamptz,
  resolved_by   uuid         references auth.users(id)
);

create table alert_logs (
  id            uuid          primary key default gen_random_uuid(),
  type          alert_log_type not null,
  product_id    uuid           references products(id), -- set for 'immediate' alerts only
  products_json jsonb          not null default '[]',   -- snapshot of products at send time
  sent_email    boolean        not null default false,
  sent_whatsapp boolean        not null default false,
  error_message text,
  created_at    timestamptz    not null default now()
);

create table purchase_orders (
  id          uuid                 primary key default gen_random_uuid(),
  supplier_id uuid                 not null references suppliers(id),
  status      purchase_order_status not null default 'draft',
  items_json  jsonb                not null default '[]',
  notes       text,
  created_at  timestamptz          not null default now(),
  updated_at  timestamptz          not null default now(),
  created_by  uuid                 references auth.users(id)
);

create table user_roles (
  id         uuid      primary key default gen_random_uuid(),
  user_id    uuid      not null references auth.users(id) on delete cascade,
  role       user_role not null,
  module     text      not null default 'inventory',
  created_at timestamptz not null default now(),
  created_by uuid      references auth.users(id),
  unique (user_id, module)
);

-- Single-row table — enforced by the unique index below
create table settings (
  id                    uuid        primary key default gen_random_uuid(),
  clinic_name           text        not null default 'Mi Clínica',
  alert_recipient_name  text,
  alert_recipient_email text,
  alert_recipient_phone text,       -- E.164 format: +50688887777
  alert_time            time        not null default '08:00:00',
  alert_timezone        text        not null default 'America/Costa_Rica',
  alert_cooldown_hours  integer     not null default 4,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Enforce single row
create unique index idx_settings_singleton on settings ((true));

-- Seed default settings
insert into settings default values;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_products_category    on products(category_id);
create index idx_products_supplier    on products(supplier_id);
create index idx_products_active      on products(is_active);
create index idx_movements_product    on movements(product_id);
create index idx_movements_user       on movements(user_id);
create index idx_movements_created_at on movements(created_at desc);
create index idx_alerts_product       on alerts(product_id);
create index idx_alerts_active        on alerts(product_id) where status = 'active';
create index idx_alert_logs_product   on alert_logs(product_id, created_at desc);
create index idx_user_roles_user      on user_roles(user_id);

-- ---------------------------------------------------------------------------
-- updated_at auto-maintenance
-- ---------------------------------------------------------------------------
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_categories_updated_at    before update on categories    for each row execute function handle_updated_at();
create trigger trg_suppliers_updated_at     before update on suppliers     for each row execute function handle_updated_at();
create trigger trg_products_updated_at      before update on products      for each row execute function handle_updated_at();
create trigger trg_purchase_orders_updated  before update on purchase_orders for each row execute function handle_updated_at();
create trigger trg_settings_updated_at      before update on settings      for each row execute function handle_updated_at();
